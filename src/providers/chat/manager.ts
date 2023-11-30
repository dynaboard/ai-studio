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
  currentSystemPrompt?: string
  isGenerating: boolean
}

export class ChatManager {
  private readonly _state = atom<ModelState>('ChatManager._state', {
    messages: [],
    currentThreadID: undefined,
    currentModel: undefined,
    currentTemperature: [1],
    currentTopP: [1],
    isGenerating: false,
  })

  cleanupHandler: (() => void) | undefined

  constructor(
    readonly historyManager: HistoryManager,
    model?: string,
    threadID?: string,
  ) {
    let messages: Message[] = []
    let systemPrompt: string | undefined
    let temperature: number = 1
    let topP: number = 1

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
      currentTopP: [topP],
      currentTemperature: [temperature],
    }))
  }

  handleChatToken = (token: string, messageID: string) => {
    const threadID = this.state.currentThreadID
    if (!threadID) {
      // eslint-disable-next-line no-console
      console.error('No thread selected')
      return
    }

    const currentMessage = this.historyManager.state.messages.get(messageID)
    if (!currentMessage) {
      // eslint-disable-next-line no-console
      console.error('No current message found')
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
    try {
      this.setGenerating(true)

      let currentSystemPrompt = 'You are a helpful AI assistant.'
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
          systemPrompt: currentSystemPrompt,
          createdAt: new Date(),
          modelID: modelPath,
          title: message.substring(0, 36),
          messages: [newUserMessage],
          topP: promptOptions?.topP ?? 1,
          temperature: promptOptions?.temperature ?? 1,
        })
        threadID = thread.id
      } else {
        // Rename the thread if it is unnamed
        const thread = this.historyManager.getThread(threadID)
        if (thread?.systemPrompt) currentSystemPrompt = thread.systemPrompt
        const isUnnamedThread =
          thread?.messages.length === 0 || thread?.title === 'New Thread'

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
        systemPrompt: currentSystemPrompt,
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
    } catch {
      // eslint-disable-next-line no-console
      console.error('Error sending message in ChatManager')
    } finally {
      this.setGenerating(false)
    }
  }

  async regenerateMessage({
    threadID,
    messageID,
  }: {
    threadID: string
    messageID: string
  }) {
    try {
      this.setGenerating(true)

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
    } catch {
      // eslint-disable-next-line no-console
      console.error('Error regenerating message in ChatManager')
    } finally {
      this.setGenerating(false)
    }
  }

  async abortMessage() {
    await window.chats.abortMessage()
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
        currentTemperature: [temperature],
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
        currentTopP: [topP],
      }
    })
  }

  setCurrentThread(threadID?: string) {
    if (!threadID) {
      return
    }

    const thread = this.historyManager.getThread(threadID)
    const messages = thread?.messages ?? []
    const systemPrompt =
      thread?.systemPrompt ?? 'You are a helpful AI assistant.'
    const topP = [thread?.topP ?? 1]
    const temperature = [thread?.temperature ?? 1]

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

  setGenerating(loading: boolean) {
    this._state.update((state) => {
      return {
        ...state,
        isGenerating: loading,
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

  // async cleanupChatSession(threadID: string) {
  //   const thread = this.historyManager.getThread(threadID)
  //   if (!thread) {
  //     return
  //   }

  //   const modelPath = thread.modelID
  //   await window.chats.cleanupSession({ modelPath, threadID: thread.id })
  // }

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

export function useCurrentSystemPrompt() {
  const chatManager = useChatManager()
  return useValue(
    'useCurrentSystemPrompt',
    () => chatManager.state.currentSystemPrompt,
    [chatManager],
  )
}

export function useIsMessageGenerating() {
  const chatManager = useChatManager()
  return useValue(
    'useIsMessageGenerating',
    () => chatManager.state.isGenerating,
    [chatManager],
  )
}
