import { createContext, useContext } from 'react'
import { atom, computed } from 'signia'

import { getAllActions } from '@/actions'
import { Assistant, Message, openai, Run, Thread } from '@/lib/openai'

type AssistantState = {
  assistant: Assistant | null
  currentThread: Thread | null
  currentRun: Run | null
  sendingMessage: boolean
  messages: Message[]
  runs: Run[]
  threads: { thread: Thread; messages: Message[]; runs: Run[] }[]
}

export class AssistantManager {
  private readonly _state = atom<AssistantState>('AssistantManager._state', {
    assistant: null,
    currentThread: null,
    currentRun: null,
    sendingMessage: false,
    messages: [],
    runs: [],
    threads: [],
  })

  private timer: ReturnType<typeof setTimeout> | null = null

  private actions = getAllActions()

  constructor(public assistant?: Assistant) {
    if (assistant) {
      this._state.update((state) => ({ ...state, assistant }))
    }

    this.getThreads().then((data) => {
      this._state.update((state) => ({ ...state, threads: data }))
    })
  }

  get state() {
    return this._state.value
  }

  async sendMessage(message: string) {
    if (!this.assistant) {
      console.error('No assistant selected')
      return
    }

    // No thread, so we will create a run a thread with an initial message from the user
    if (!this.state.currentThread) {
      const thread = await openai.beta.threads.create({
        messages: [
          {
            content: message,
            role: 'user',
            file_ids: [],
          },
        ],
      })
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: this.assistant.id,
      })

      // Save the thread ID to local storage to load later
      const threadIDs = this.localThreadIDs
      threadIDs.push(thread.id)
      localStorage.setItem('threadIDs', JSON.stringify(threadIDs))

      this._state.update((state) => ({
        ...state,
        currentThread: thread,
        currentRun: run,
      }))

      this.getLatestStatus()
    } else {
      // Or we've got an existing thread we want to continue, so we'll just add a new message
      await openai.beta.threads.messages.create(this.state.currentThread.id, {
        content: message,
        role: 'user',
        file_ids: [],
      })
      const messages = await openai.beta.threads.messages.list(
        this.state.currentThread.id,
        {
          order: 'asc',
        },
      )
      this._state.update((state) => ({
        ...state,
        messages: messages.data,
      }))

      // Everytime you send a new message on a thread, you've got to create a new run
      // The run uses the threads context to perform whatever action the assistant decides
      const run = await openai.beta.threads.runs.create(
        this.state.currentThread.id,
        {
          assistant_id: this.assistant.id,
        },
      )

      this._state.update((state) => ({
        ...state,
        currentRun: run,
      }))

      this.getLatestStatus()
    }
  }

  async getThreads() {
    if (typeof window === 'undefined') {
      return []
    }

    const threads = await Promise.all(
      this.localThreadIDs.map(async (id) => {
        const thread = await openai.beta.threads.retrieve(id)

        const messages = await openai.beta.threads.messages.list(id, {
          order: 'asc',
        })
        const runs = await openai.beta.threads.runs.list(id, {
          order: 'asc',
        })

        return {
          thread,
          messages: messages.data,
          runs: runs.data,
        }
      }),
    )

    return threads
  }

  async getThread(id: string) {
    const thread = await openai.beta.threads.retrieve(id)

    const messages = await openai.beta.threads.messages.list(id, {
      order: 'asc',
    })
    const runs = await openai.beta.threads.runs.list(id, {
      order: 'asc',
    })

    return {
      thread,
      messages: messages.data,
      runs: runs.data,
    }
  }

  private async getLatestStatus() {
    if (!this.state.currentThread) {
      return
    }

    if (this.timer) {
      clearTimeout(this.timer)
    }

    const { messages, runs: latestRuns } = await this.getThread(
      this.state.currentThread.id,
    )

    const latestActiveRun = latestRuns.findLast(
      (run) =>
        run.status === 'queued' ||
        run.status === 'in_progress' ||
        run.status === 'requires_action',
    )

    if (latestActiveRun) {
      this._state.update((state) => ({
        ...state,
        messages,
        currentRun: latestActiveRun,
      }))

      // The assistant wants to run something
      if (latestActiveRun.status === 'requires_action') {
        const submitOutputs =
          latestActiveRun.required_action?.submit_tool_outputs
        if (submitOutputs) {
          // Get all the outputs before we submit them
          const outputs: { callID: string; output: object }[] =
            await Promise.all(
              submitOutputs.tool_calls.map(async (call) => {
                switch (call.function.name) {
                  case 'discover_actions': {
                    const actions = this.actions.map((action) =>
                      action.toJSON(),
                    )
                    console.log('Assistant discovering actions:', actions)
                    return {
                      callID: call.id,
                      output: this.actions.map((action) => action.toJSON()),
                    }
                  }
                  case 'request_parameters': {
                    const args = JSON.parse(call.function.arguments)
                    const actionID = args.actionID
                    console.log('Assistant wants parameters for action:', {
                      actionID,
                    })
                    const params = args.parameters
                    const action = this.actions.find(
                      (action) => action.id === actionID,
                    )
                    if (!action) {
                      return {
                        callID: call.id,
                        output: {
                          error: `Action with ID ${actionID} not found`,
                        },
                      }
                    }

                    const result = await action.getParameters()

                    return {
                      callID: call.id,
                      output: result,
                    }
                  }
                  case 'call_action': {
                    const args = JSON.parse(call.function.arguments)
                    const actionID = args.actionID
                    console.log('Assistant wants to call an action:', actionID)
                    const params = args.parameters
                    const action = this.actions.find(
                      (action) => action.id === actionID,
                    )
                    if (!action) {
                      return {
                        callID: call.id,
                        output: {
                          error: `Action with ID ${actionID} not found`,
                        },
                      }
                    }
                    const possibleArgs = action.input.safeParse(params)
                    if (!possibleArgs.success) {
                      return {
                        callID: call.id,
                        output: {
                          error: `Invalid arguments for action ${actionID}: ${possibleArgs.error.message}`,
                        },
                      }
                    }

                    const result = await action.run(possibleArgs.data as any)

                    return {
                      callID: call.id,
                      output: result,
                    }
                  }
                  default:
                    return {
                      callID: call.id,
                      output: {
                        error: `Unknown function ${call.function.name}`,
                      },
                    }
                }
              }),
            )

          const updatedRun = await openai.beta.threads.runs.submitToolOutputs(
            this.state.currentThread.id,
            latestActiveRun.id,
            {
              tool_outputs: outputs.map((output) => {
                return {
                  output: JSON.stringify(output.output),
                  tool_call_id: output.callID,
                }
              }),
            },
          )

          this._state.update((state) => ({
            ...state,
            currentRun: updatedRun,
          }))

          this.timer = setTimeout(() => {
            this.getLatestStatus()
          }, 500)
          return
        }
      }

      this.timer = setTimeout(() => {
        this.getLatestStatus()
      }, 500)

      return
    }

    const latestRun = latestRuns[latestRuns.length - 1]
    if (latestRun.status === 'completed') {
      const { messages } = await this.getThread(this.state.currentThread.id)
      this._state.update((state) => ({
        ...state,
        messages,
        currentRun: null,
      }))
    }
  }

  @computed
  get messages() {
    return this.state.messages
  }

  @computed
  get threads() {
    return this.state.threads
  }

  @computed
  get paused() {
    if (!this.state.currentRun) {
      return false
    }

    if (this.state.sendingMessage) {
      return true
    }

    return (
      this.state.currentRun.status === 'queued' ||
      this.state.currentRun.status === 'in_progress' ||
      this.state.currentRun.status === 'requires_action'
    )
  }

  get localThreadIDs(): string[] {
    const threadIDs = localStorage.getItem('threadIDs')
    try {
      return JSON.parse(threadIDs || '[]')
    } catch {
      return []
    }
  }
}

export const AssistantContext = createContext(new AssistantManager())

export function useAssistantManager() {
  return useContext(AssistantContext)
}
