import './models'
import './usage'

import { contextBridge, ipcRenderer } from 'electron'
import { LLamaChatPromptOptions } from 'node-llama-cpp/dist/llamaEvaluator/LlamaChatSession'

contextBridge.exposeInMainWorld('chats', {
  sendMessage: (message) => {
    return ipcRenderer.invoke('chats:sendMessage', message)
  },
  cleanupSession: ({ modelPath, threadID }) => {
    return ipcRenderer.invoke('chats:cleanupSession', { modelPath, threadID })
  },
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
} satisfies ChatsAPI)

export interface ChatsAPI {
  sendMessage: ({
    message,
    messageID,
    threadID,
    promptOptions,
    modelPath,
  }: {
    message: string
    messageID: string
    threadID: string
    promptOptions?: LLamaChatPromptOptions
    modelPath: string
  }) => Promise<string>

  cleanupSession: ({
    modelPath,
    threadID,
  }: {
    modelPath: string
    threadID: string
  }) => Promise<void>

  onToken: (callback: (token: string, messageID: string) => void) => () => void
}

declare global {
  interface Window {
    chats: ChatsAPI
  }
}
