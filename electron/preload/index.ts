import './models'
import './usage'

import { contextBridge, ipcRenderer } from 'electron'
import { LLamaChatPromptOptions } from 'node-llama-cpp/dist/llamaEvaluator/LlamaChatSession'

contextBridge.exposeInMainWorld('chats', {
  sendMessage: (message) => {
    return ipcRenderer.invoke('chats:sendMessage', message)
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
    promptOptions,
    modelPath,
  }: {
    message: string
    messageID: string
    promptOptions?: LLamaChatPromptOptions
    modelPath: string
  }) => Promise<string>

  onToken: (callback: (token: string, messageID: string) => void) => () => void
}

declare global {
  interface Window {
    chats: ChatsAPI
  }
}
