import { createContext, useContext } from 'react'
import { atom, computed } from 'signia'

import { getAllActions } from '@/actions'

type ModelThread = {
  id: string
  name: string
  modelOptions: {
    modelPath: string
  }
  sendMessage: (message: string) => Promise<string>
}

type Message = {
  role: 'user' | 'system' | 'assistant'
  message: string
}

type ModelState = {
  model?: string
  currentThread?: ModelThread
  sendingMessage: boolean
  messages: Message[]
  threads: {
    thread: ModelThread
    messages: Message[]
  }[]
  loadingText: string
}

export class AssistantManager {
  private readonly _state = atom<ModelState>('AssistantManager._state', {
    model: undefined,
    currentThread: undefined,
    sendingMessage: false,
    messages: [],
    threads: [],
    loadingText: '',
  })

  private timer: ReturnType<typeof setTimeout> | null = null

  private actions = getAllActions()

  constructor(public model?: string) {
    if (model) {
      this._state.update((state) => ({ ...state, model }))
    }

    this.getThreads().then((data) => {
      this._state.update((state) => ({ ...state, threads: data }))
    })
  }

  get state() {
    return this._state.value
  }

  get loadingText() {
    return this.state.loadingText
  }

  private updateLoadingText(text: string) {
    this._state.update((state) => ({
      ...state,
      loadingText: text,
    }))
  }

  async sendMessage(message: string) {
    if (!this.model) {
      console.error('No model selected')
      return
    }

    this._state.update((state) => {
      const messages = state.messages
      messages.push({
        role: 'user',
        message: message,
      })

      return {
        ...state,
        messages: [...messages],
      }
    })

    // No thread, so we will create a run a thread with an initial message from the user
    if (!this.state.currentThread) {
      const modelOptions = {
        modelPath: 'mistral-7b-instruct-v0.1.Q4_K_M.gguf',
      }

      const thread = {
        id: '1',
        name: 'mistral-7b',
        modelOptions,
        sendMessage: (message: string) => {
          return window.chats.sendMessage(message)
        },
      }

      const response = await thread.sendMessage(message)

      // Save the thread ID to local storage to load later
      const threadIDs = this.localThreadIDs
      threadIDs.push(thread.id)
      localStorage.setItem('threadIDs', JSON.stringify(threadIDs))

      this._state.update((state) => {
        const messages = state.messages
        messages.push({
          role: 'assistant',
          message: response,
        })

        return {
          ...state,
          messages: [...messages],
        }
      })
    } else {
      // Or we've got an existing thread we want to continue, so we'll just add a new message
      const response = await this.state.currentThread.sendMessage(message)

      this._state.update((state) => {
        const messages = state.messages
        messages.push({
          role: 'assistant',
          message: response,
        })

        return {
          ...state,
          messages: [...messages],
        }
      })
    }
  }

  async getThreads() {
    if (typeof window === 'undefined') {
      return []
    }

    const threads = await Promise.all(
      this.localThreadIDs.map(async (id) => {
        const thread = {
          id,
          name: 'mistral-7b',
          modelOptions: {
            modelPath: 'mistral-7b-instruct-v0.1.Q4_K_M.gguf',
          },
          sendMessage: (message: string) => {
            return window.chats.sendMessage(message)
          },
        }

        const messages: Message[] = []

        return {
          thread,
          messages,
        }
      }),
    )

    return threads
  }

  async getThread(id: string): Promise<
    | {
        thread: ModelThread
        messages: Message[]
      }
    | undefined
  > {
    return this.threads.find((thread) => thread.thread.id === id)
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
    return false
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
