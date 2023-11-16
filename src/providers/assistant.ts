import { createContext, useContext } from 'react'
import { atom, computed } from 'signia'

type Message = {
  role: 'user' | 'system' | 'assistant'
  message: string
}

type ModelState = {
  currentModel?: string
  sendingMessage: boolean
  messages: Message[]
  loadingText: string
}

export class AssistantManager {
  private readonly _state = atom<ModelState>('AssistantManager._state', {
    currentModel: undefined,
    sendingMessage: false,
    messages: [],
    loadingText: '',
  })

  constructor(model?: string) {
    this._state.update((state) => ({
      ...state,
      currentModel: model,
    }))
  }

  get state() {
    return this._state.value
  }

  get loadingText() {
    return this.state.loadingText
  }

  async sendMessage({ message, model }: { message: string; model?: string }) {
    if (!model) {
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

    if (model) {
      const modelOptions = {
        modelPath: model,
      }

      const response = await window.chats.sendMessage({
        message,
        modelPath: modelOptions.modelPath,
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
  get model() {
    return this.state.currentModel
  }

  @computed
  get paused() {
    return false
  }
}

export const AssistantContext = createContext(new AssistantManager())

export function useAssistantManager() {
  return useContext(AssistantContext)
}
