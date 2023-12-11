import { createContext, useContext } from 'react'
import { atom, computed } from 'signia'
import { useValue } from 'signia-react'

import { Message } from '@/providers/chat/types'
import { HistoryManager, useThread } from '@/providers/history/manager'
import { ToolManager } from '@/providers/tools/manager'

type ModelState = {
  messages: Message[]
  currentModel?: string
  currentThreadID?: string
  currentTemperature?: number
  currentTopP?: number
  currentSystemPrompt?: string
  runningPrompts: Map<string, boolean>
}

type PromptOptions = {
  topP?: number
  temperature?: number
}

export const DEFAULT_TEMP = 0.5
export const DEFAULT_TOP_P = 0.3

export class ChatManager {
  private readonly _state = atom<ModelState>('ChatManager._state', {
    messages: [],
    currentThreadID: undefined,
    currentModel: undefined,
    currentTemperature: 0.5,
    currentTopP: 0.3,
    runningPrompts: new Map<string, boolean>(),
  })

  cleanupHandler: (() => void) | undefined

  declare toolManager: ToolManager

  constructor(
    readonly historyManager: HistoryManager,
    model?: string,
    threadID?: string,
  ) {
    let messages: Message[] = []
    let systemPrompt: string | undefined
    let temperature: number = DEFAULT_TEMP
    let topP: number = DEFAULT_TOP_P

    if (threadID) {
      const thread = historyManager.getThread(threadID)
      messages = thread?.messages || []
      systemPrompt = thread?.systemPrompt
      if (thread?.temperature) temperature = thread?.temperature
      if (thread?.topP) topP = thread?.topP
    }

    this._state.update((state) => ({
      ...state,
      messages,
      currentThreadID: threadID,
      currentModel: model,
      currentSystemPrompt: systemPrompt,
      currentTopP: topP,
      currentTemperature: temperature,
    }))
  }

  handleChatToken = (token: string, messageID: string) => {
    const threadID = this.state.currentThreadID
    if (!threadID) {
      return
    }

    const currentMessage = this.historyManager.state.messages.get(messageID)
    if (!currentMessage) {
      return
    }

    this.historyManager.editMessage({
      threadID,
      messageID,
      contents:
        currentMessage.state === 'pending'
          ? token
          : currentMessage.message + token,
      state: 'sent',
    })
  }

  initialize() {
    this.cleanupHandler = window.chats.onToken(this.handleChatToken)
  }

  destroy() {
    this.cleanupHandler?.()
  }

  get state() {
    return this._state.value
  }

  setRunningPrompt(threadID: string, isGenerating: boolean) {
    this._state.update((state) => {
      state.runningPrompts.set(threadID, isGenerating)
      return {
        ...state,
      }
    })
  }

  async sendMessage({
    message,
    model,
    threadID,
    promptOptions,
    selectedFile,
  }: {
    message: string
    threadID?: string
    model?: string
    promptOptions?: PromptOptions
    selectedFile?: string
    addToHistory?: boolean
  }) {
    if (threadID) {
      this.setRunningPrompt(threadID, true)
    }

    try {
      let currentSystemPrompt = 'You are a helpful AI assistant.'
      if (!model || !this.model) {
        // eslint-disable-next-line no-console
        console.error('No model selected')
        return
      }

      const modelPath = model || this.model

      const newUserMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        message: message,
        state: 'sent',
        date: new Date().toISOString(),
      }

      // You always message on a thread, so we are starting a new one if its not provided
      if (!threadID) {
        const thread = this.historyManager.addThread({
          systemPrompt: currentSystemPrompt,
          createdAt: new Date(),
          modelID: modelPath,
          title: message.substring(0, 36),
          messages: [newUserMessage],
          topP: promptOptions?.topP ?? DEFAULT_TOP_P,
          temperature: promptOptions?.temperature ?? DEFAULT_TEMP,
        })
        threadID = thread.id
      } else {
        const thread = this.historyManager.getThread(threadID)
        if (thread?.systemPrompt) currentSystemPrompt = thread.systemPrompt
        // If the thread's title is 'New Thread' or a new thread, we rename it using the last message's text
        const isUnnamedThread =
          thread?.messages.length === 0 || thread?.title === 'New Thread'

        if (isUnnamedThread) {
          this.historyManager.renameThread(threadID, message.substring(0, 100))
        }

        this.historyManager.addMessage({ threadID, message: newUserMessage })
      }

      let sendMessage = !this.toolManager.hasActiveTools
      if (this.toolManager.hasActiveTools) {
        console.log('Checking if prompt can be handled by a tool')
        const possibleTools = await this.toolManager.getToolsForPrompt(message)
        if (possibleTools && possibleTools.length > 0) {
          console.log('Found a tools:', possibleTools)

          let result: unknown
          const previousToolCalls: { id: string; result: unknown }[] = []

          let assistantMessageID: string

          for (const [_idx, possibleTool] of possibleTools.entries()) {
            console.log(
              'running tool:',
              possibleTool.tool.id,
              possibleTool.parameters,
            )

            assistantMessageID = crypto.randomUUID()
            const newAssistantMessage: Message = {
              id: assistantMessageID,
              role: 'tool',
              message: '',
              state: 'pending',
              toolID: possibleTool.tool.id,
              date: new Date().toISOString(),
            }

            this.historyManager.addMessage({
              threadID,
              message: newAssistantMessage,
            })

            const ctx = {
              assistantMessageID,
              threadID,
              modelPath,
              promptOptions,
              previousToolCalls,
            }

            result = await possibleTool.tool.run(
              ctx,
              ...(possibleTool.parameters as unknown[]),
            )

            this.historyManager.addToolCall({
              threadID,
              toolID: possibleTool.tool.id,
              parameters: possibleTool.parameters as Record<string, unknown>[],
              messageID: assistantMessageID,
            })

            this.historyManager.editMessage({
              threadID,
              role: 'tool',
              messageID: assistantMessageID,
              contents: String(result),
              state: 'sent',
            })

            previousToolCalls.push({
              id: possibleTool.tool.id,
              result,
            })
          }
        } else {
          sendMessage = true
        }
      }

      // If something fails during the tool run, we still want to send the message so the user
      // isnt stuck
      if (sendMessage) {
        const assistantMessageID = crypto.randomUUID()
        const newAssistantMessage: Message = {
          id: assistantMessageID,
          role: 'assistant',
          message: '',
          state: 'pending',
          date: new Date().toISOString(),
        }

        this.historyManager.addMessage({
          threadID,
          message: newAssistantMessage,
        })

        const response = await window.chats.sendMessage({
          systemPrompt: currentSystemPrompt,
          messageID: newUserMessage.id,
          assistantMessageID,
          message,
          modelPath,
          threadID,
          promptOptions,
          selectedFile,
        })

        this.historyManager.editMessage({
          threadID,
          messageID: assistantMessageID,
          contents: response,
        })
      }
    } catch (e) {
      const error = e as Error
      // eslint-disable-next-line no-console
      console.error('Error sending message:', error)
    } finally {
      if (threadID) {
        this.setRunningPrompt(threadID, false)
      }
    }
  }

  async regenerateMessage({
    threadID,
    messageID,
  }: {
    threadID: string
    messageID: string
  }) {
    if (threadID) {
      this.setRunningPrompt(threadID, true)
    }

    try {
      const thread = this.historyManager.getThread(threadID)
      if (!thread) {
        // eslint-disable-next-line no-console
        console.error(
          'Cannot regenerate a message without a valid thread (this should be an impossible state).',
        )
        return
      }

      this.historyManager.editMessage({
        threadID,
        messageID,
        contents: '',
        state: 'pending',
      })

      const response = await window.chats.regenerateMessage({
        systemPrompt: thread.systemPrompt,
        messageID,
        threadID,
        modelPath: thread.modelID,
      })

      this.historyManager.editMessage({
        threadID,
        messageID,
        contents: response,
      })
    } catch (e) {
      const error = e as Error
      // eslint-disable-next-line no-console
      console.error('Error regenerating message:', error)
    } finally {
      if (threadID) {
        this.setRunningPrompt(threadID, false)
      }
    }
  }

  abort(threadID: string) {
    if (this.state.runningPrompts.get(threadID)) {
      window.chats.abort(threadID)
      this.setRunningPrompt(threadID, false)
    }
  }

  setModel(model: string) {
    const currentThreadID = this.state.currentThreadID
    if (currentThreadID) {
      this.historyManager.changeThreadModel(currentThreadID, model)
    }
    this._state.update((state) => {
      return {
        ...state,
        currentModel: model,
      }
    })
  }

  setSystemPrompt(systemPrompt: string) {
    const currentThreadID = this.state.currentThreadID
    if (currentThreadID) {
      this.historyManager.changeSystemPrompt(currentThreadID, systemPrompt)
    }
    this._state.update((state) => {
      return {
        ...state,
        currentSystemPrompt: systemPrompt,
      }
    })
  }

  setTemperature(temperature: number) {
    const currentThreadID = this.state.currentThreadID
    if (currentThreadID) {
      this.historyManager.changeTemperature(currentThreadID, temperature)
    }
    this._state.update((state) => {
      return {
        ...state,
        currentTemperature: temperature,
      }
    })
  }

  setTopP(topP: number) {
    const currentThreadID = this.state.currentThreadID
    if (currentThreadID) {
      this.historyManager.changeTopP(currentThreadID, topP)
    }
    this._state.update((state) => {
      return {
        ...state,
        currentTopP: topP,
      }
    })
  }

  async setCurrentThread(threadID?: string) {
    if (!threadID) {
      return
    }

    if (this.state.currentThreadID === threadID) {
      return
    }

    const currentThread = this.historyManager.getThread(
      this.state.currentThreadID,
    )
    if (currentThread) {
      await window.chats.cleanupSession({
        modelPath: currentThread.modelID,
        threadID: currentThread.id,
      })
    }

    const thread = this.historyManager.getThread(threadID)
    const messages = thread?.messages ?? []
    const systemPrompt =
      thread?.systemPrompt ?? 'You are a helpful AI assistant.'
    const topP = thread?.topP ?? DEFAULT_TOP_P
    const temperature = thread?.temperature ?? DEFAULT_TEMP

    if (thread) {
      window.chats.loadMessageList({
        modelPath: thread.modelID,
        threadID: thread.id,
        messages,
      })
    }

    this.loadMessageList(threadID)

    this._state.update((state) => {
      return {
        ...state,
        messages,
        currentThreadID: threadID,
        currentSystemPrompt: systemPrompt,
        currentTopP: topP,
        currentTemperature: temperature,
      }
    })
  }

  async loadMessageList(threadID: string) {
    const thread = this.historyManager.getThread(threadID)

    if (thread) {
      window.chats.loadMessageList({
        modelPath: thread.modelID,
        threadID: thread.id,
        messages: thread.messages,
      })
    }
  }

  async editMessage({
    threadID,
    messageID,
    contents,
    state,
  }: {
    threadID: string
    messageID: string
    contents: string
    state?: 'sent' | 'pending'
  }) {
    this.historyManager.editMessage({
      threadID,
      messageID,
      contents,
      state,
    })
    await this.loadMessageList(threadID)
  }

  async deleteMessage({
    threadID,
    messageID,
  }: {
    threadID: string
    messageID: string
  }) {
    this.historyManager.deleteMessage({ threadID, messageID })
    await this.loadMessageList(threadID)
  }

  async cleanupChatSession(threadID: string) {
    const thread = this.historyManager.getThread(threadID)
    if (!thread) {
      return
    }

    const modelPath = thread.modelID
    await window.chats.cleanupSession({ modelPath, threadID: thread.id })
  }

  // kind of gross, but there is a cyclic dep at the moment that we need to break eventually
  setToolManager(toolManager: ToolManager) {
    this.toolManager = toolManager
  }

  @computed
  get messages() {
    return this.state.messages
  }

  @computed
  get model() {
    return this.state.currentModel
  }

  @computed
  get paused() {
    return false
  }
}

export const ChatManagerContext = createContext(
  new ChatManager(new HistoryManager()),
)

export function useChatManager() {
  return useContext(ChatManagerContext)
}

export function useCurrentModel() {
  const chatManager = useChatManager()
  const currentThreadID = useCurrentThreadID()
  return useThread(currentThreadID)?.modelID ?? chatManager.model
}

export function useCurrentTemperature() {
  const chatManager = useChatManager()
  return useValue(
    'changeTemperature',
    () => chatManager.state.currentTemperature,
    [chatManager],
  )
}

export function useCurrentTopP() {
  const chatManager = useChatManager()
  return useValue('changeTopP', () => chatManager.state.currentTopP, [
    chatManager,
  ])
}

export function useCurrentThreadID() {
  const chatManager = useChatManager()
  return useValue(
    'useCurrentThreadID',
    () => chatManager.state.currentThreadID,
    [chatManager.state.currentThreadID],
  )
}

export function useCurrentSystemPrompt() {
  const chatManager = useChatManager()
  return useValue(
    'useCurrentSystemPrompt',
    () => chatManager.state.currentSystemPrompt,
    [chatManager],
  )
}

export function useIsCurrentThreadGenerating(threadID?: string) {
  const chatManager = useChatManager()
  return useValue(
    'useIsCurrentThreadGenerating',
    () => {
      return chatManager.state.runningPrompts.get(threadID!) || false
    },
    [chatManager, threadID],
  )
}
