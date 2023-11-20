import { createContext, useContext } from 'react'
import { atom, computed } from 'signia'
import { useValue } from 'signia-react'

import { Message } from '@/providers/chat/types'
import { HistoryManager } from '@/providers/history/manager'

type ModelState = {
  currentModel?: string
  currentThread?: string
  sendingMessage: boolean
  messages: Message[]
  loadingText: string
}

export class ChatManager {
  private readonly _state = atom<ModelState>('ChatManager._state', {
    sendingMessage: false,
    messages: [],
    currentThread: undefined,
    currentModel: undefined,
    loadingText: '',
  })

  cleanupHandler: (() => void) | undefined

  constructor(
    readonly historyManager: HistoryManager,
    model?: string,
    threadID?: string,
  ) {
    let messages: Message[] = []
    if (threadID) {
      messages = historyManager.getThread(threadID)?.messages || []
    }

    this._state.update((state) => ({
      ...state,
      messages,
      currentThread: threadID,
      currentModel: model,
    }))
  }

  handleChatToken = (token: string, messageID: string) => {
    const threadID = this.state.currentThread
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

  get loadingText() {
    return this.state.loadingText
  }

  async sendMessage({
    message,
    model,
    threadID,
  }: {
    message: string
    threadID?: string
    model?: string
  }) {
    if (!model || !this.model) {
      console.error('No model selected')
      return
    }

    const modelPath = model || this.model

    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      message: message,
      state: 'sent',
    }

    // You always message on a thread, so we are starting a new one if its not provided
    if (!threadID) {
      const thread = this.historyManager.addThread({
        createdAt: new Date(),
        modelID: modelPath,
        title: message.substring(0, 36),
        messages: [newUserMessage],
      })
      threadID = thread.id
    } else {
      this.historyManager.addMessage({ threadID, message: newUserMessage })
    }

    const assistantMessageID = crypto.randomUUID()
    const newAssistantMessage: Message = {
      id: assistantMessageID,
      role: 'assistant',
      message: '',
      state: 'pending',
    }

    this.historyManager.addMessage({
      threadID,
      message: newAssistantMessage,
    })

    const response = await window.chats.sendMessage({
      messageID: assistantMessageID,
      message,
      modelPath,
      threadID,
    })

    this.historyManager.editMessage({
      threadID,
      messageID: assistantMessageID,
      contents: response,
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

  setCurrentThread(threadID?: string) {
    const messages = threadID
      ? this.historyManager.getThread(threadID)?.messages ?? []
      : []

    this._state.update((state) => {
      return {
        ...state,
        messages,
        currentThread: threadID,
      }
    })
  }

  async cleanupChatSession(threadID: string) {
    const thread = this.historyManager.getThread(threadID)
    if (!thread) {
      return
    }

    const modelPath = thread.modelID
    await window.chats.cleanupSession({ modelPath, threadID: thread.id })
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
  return useValue('useCurrentModel', () => chatManager.model, [chatManager])
}

export function useCurrentThreadID() {
  const chatManager = useChatManager()
  return useValue('useCurrentThreadID', () => chatManager.state.currentThread, [
    chatManager,
  ])
}
