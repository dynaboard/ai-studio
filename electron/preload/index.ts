import './models'
import './usage'
import './embeddings'

import { contextBridge, ipcRenderer } from 'electron'
import { ChatMessage } from 'electron/main/message-list/base'
import { LLamaChatPromptOptions } from 'node-llama-cpp/dist/llamaEvaluator/LlamaChatSession'

contextBridge.exposeInMainWorld('chats', {
  sendMessage: (message) => {
    return ipcRenderer.invoke('chats:sendMessage', message)
  },
  regenerateMessage: (message) => {
    return ipcRenderer.invoke('chats:regenerateMessage', message)
  },
  // cleanupSession: ({ modelPath, threadID }) => {
  //   return ipcRenderer.invoke('chats:cleanupSession', { modelPath, threadID })
  // },
  onToken: (callback) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      { token, messageID }: { token: string; messageID: string },
    ) => {
      callback(token, messageID)
    }

    ipcRenderer.on('token', handler)

    return () => {
      ipcRenderer.off('token', handler)
    }
  },
  loadMessageList: ({ modelPath, threadID, messages }) => {
    return ipcRenderer.invoke('chats:loadMessageList', {
      modelPath,
      threadID,
      messages,
    })
  },
} satisfies ChatsAPI)

export interface ChatsAPI {
  sendMessage: ({
    systemPrompt,
    message,
    messageID,
    assistantMessageID,
    threadID,
    promptOptions,
    modelPath,
  }: {
    systemPrompt: string
    message: string
    messageID: string
    assistantMessageID: string
    threadID: string
    promptOptions?: LLamaChatPromptOptions
    modelPath: string
  }) => Promise<string>

  regenerateMessage: ({
    systemPrompt,
    messageID,
    threadID,
    promptOptions,
    modelPath,
  }: {
    systemPrompt: string
    messageID: string
    threadID: string
    promptOptions?: LLamaChatPromptOptions
    modelPath: string
  }) => Promise<string>

  // cleanupSession: ({
  //   modelPath,
  //   threadID,
  // }: {
  //   modelPath: string
  //   threadID: string
  // }) => Promise<void>

  onToken: (callback: (token: string, messageID: string) => void) => () => void

  loadMessageList: ({
    modelPath,
    threadID,
    messages,
  }: {
    modelPath: string
    threadID: string
    messages: ChatMessage[]
  }) => Promise<void>
}

declare global {
  interface Window {
    chats: ChatsAPI
  }
}
