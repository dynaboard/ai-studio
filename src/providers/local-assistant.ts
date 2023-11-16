import { randomUUID } from 'crypto'
import { createContext, useContext } from 'react'
import { atom, computed } from 'signia'

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
  currentModel?: string
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
    currentModel: undefined,
    sendingMessage: false,
    messages: [],
    threads: [],
    loadingText: '',
  })

  get state() {
    return this._state.value
  }

  get loadingText() {
    return this.state.loadingText
  }

  async sendMessage({
    message,
    thread,
    model,
  }: {
    message: string
    thread?: string
    model?: string
  }) {
    if (!model && !thread) {
      console.error('No assistant selected')
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
    if (!thread && model) {
      const modelOptions = {
        modelPath: model,
      }

      const thread = {
        id: crypto.randomUUID(),
        name: `${model}`,
        modelOptions,
      }

      const response = await window.chats.sendMessage({
        message,
        modelPath: thread.modelOptions.modelPath,
      })

      // Save the thread ID to local storage to load later
      const threads = this.localThreads
      threads.push(thread)
      localStorage.setItem('threadIDs', JSON.stringify(threads))

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
    } else if (thread) {
      const existingThread = this.getThread(thread)
      if (existingThread) {
        // Or we've got an existing thread we want to continue, so we'll just add a new message
        const response = await window.chats.sendMessage({
          message,
          modelPath: existingThread.thread.modelOptions.modelPath,
        })

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
  }

  getThreads() {
    if (typeof window === 'undefined') {
      return []
    }

    const threads = this.localThreads.map((localThread) => {
      const messages: Message[] = []

      return {
        ...localThread,
        messages,
      }
    })

    return threads
  }

  getThread(id: string):
    | {
        thread: ModelThread
        messages: Message[]
      }
    | undefined {
    return this.threads.find((thread) => thread.thread.id === id)
  }

  setModel(model: string) {
    this._state.update((state) => {
      return {
        ...state,
        currentModel: model,
      }
    })
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
  get model() {
    return this.state.currentModel
  }

  @computed
  get paused() {
    return false
  }

  get localThreads(): {
    id: string
    name: string
    modelOptions: { modelPath: string }
  }[] {
    const threads = localStorage.getItem('threads')
    try {
      return JSON.parse(threads || '[]')
    } catch {
      return []
    }
  }
}

export const AssistantContext = createContext(new AssistantManager())

export function useAssistantManager() {
  return useContext(AssistantContext)
}
