import './models'
import './usage'

import { contextBridge, ipcRenderer } from 'electron'
import { LLamaChatPromptOptions } from 'node-llama-cpp/dist/llamaEvaluator/LlamaChatSession'

contextBridge.exposeInMainWorld('chats', {
  sendMessage: (message) => {
    return ipcRenderer.invoke('chats:sendMessage', message)
  },
} satisfies ChatsAPI)

export interface ChatsAPI {
  sendMessage: ({
    message,
    promptOptions,
    modelPath,
  }: {
    message: string
    promptOptions?: LLamaChatPromptOptions
    modelPath: string
  }) => Promise<string>
}

declare global {
  interface Window {
    chats: ChatsAPI
  }
}
