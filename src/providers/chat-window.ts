import { createContext, useContext } from 'react'
import { atom, computed } from 'signia'

export type Message = {
  role: 'user' | 'system' | 'assistant'
  message: string
}

type ModelState = {
  currentModel?: string
  sendingMessage: boolean
  messages: Message[]
  loadingText: string
}

export class ChatWindowManager {
  private readonly _state = atom<ModelState>('ChatWindowManager._state', {
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
    if (!model && !this.model) {
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

    const modelPath = (model || this.model)!

    const response = await window.chats.sendMessage({
      message,
      modelPath,
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

export const ChatWindowContext = createContext(new ChatWindowManager())

export function useChatWindowManager() {
  return useContext(ChatWindowContext)
}
