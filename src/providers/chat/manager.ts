import { SliderProps } from '@radix-ui/react-slider'
import { LLamaChatPromptOptions } from 'node-llama-cpp/dist/llamaEvaluator/LlamaChatSession'
import { createContext, useContext } from 'react'
import { atom, computed } from 'signia'
import { useValue } from 'signia-react'

import { Message } from '@/providers/chat/types'
import { HistoryManager, useThread } from '@/providers/history/manager'

type ModelState = {
  messages: Message[]
  currentModel?: string
  currentThreadID?: string
  currentTemperature?: SliderProps['value']
  currentTopP?: SliderProps['value']
}

export class ChatManager {
  private readonly _state = atom<ModelState>('ChatManager._state', {
    messages: [],
    currentThreadID: undefined,
    currentModel: undefined,
    currentTemperature: [1],
    currentTopP: [1],
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
      currentThreadID: threadID,
      currentModel: model,
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

  async sendMessage({
    message,
    model,
    threadID,
    promptOptions,
  }: {
    message: string
    threadID?: string
    model?: string
    promptOptions?: LLamaChatPromptOptions
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
      date: new Date().toISOString(),
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
      // If the thread's title is 'New Thread' or a new thread, we rename it using the last message's text
      const isUnnamedThread =
        this.historyManager.getThread(threadID)?.messages.length === 0 ||
        this.historyManager.getThread(threadID)?.title === 'New Thread'

      if (isUnnamedThread) {
        this.historyManager.renameThread(threadID, message.substring(0, 100))
      }

      this.historyManager.addMessage({ threadID, message: newUserMessage })
    }

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
      messageID: newUserMessage.id,
      assistantMessageID,
      message,
      modelPath,
      threadID,
      promptOptions,
    })

    this.historyManager.editMessage({
      threadID,
      messageID: assistantMessageID,
      contents: response,
    })
  }

  async regenerateMessage({
    threadID,
    messageID,
  }: {
    threadID: string
    messageID: string
  }) {
    const thread = this.historyManager.getThread(threadID)
    if (!thread) {
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
      messageID,
      threadID,
      modelPath: thread.modelID,
    })

    this.historyManager.editMessage({
      threadID,
      messageID,
      contents: response,
    })
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

  setTemperature(temperature: number[]) {
    this._state.update((state) => {
      return {
        ...state,
        currentTemperature: temperature,
      }
    })
  }

  setTopP(topP: number[]) {
    this._state.update((state) => {
      return {
        ...state,
        currentTopP: topP,
      }
    })
  }

  setCurrentThread(threadID?: string) {
    if (!threadID) {
      return
    }

    const messages = this.historyManager.getThread(threadID)?.messages ?? []
    const thread = this.historyManager.getThread(threadID)

    if (thread) {
      this.resetParameters()

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
      }
    })
  }

  async loadMessageList(threadID: string) {
    const thread = this.historyManager.getThread(threadID)

    if (thread) {
      console.log('messages', thread.messages)
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

  private resetParameters() {
    this._state.update((state) => {
      return {
        ...state,
        currentTemperature: [1],
        currentTopP: [1],
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
    [chatManager],
  )
}
