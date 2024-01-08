import './models'
import './usage'
import './embeddings'
import './browser-window'
import './tools'
import './files'
import './downloads'

import { PromptOptions } from '@shared/chats'
import { type ChatMessage } from '@shared/message-list/base'
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('chats', {
  sendMessage: (message) => {
    return ipcRenderer.invoke('chats:sendMessage', message)
  },
  regenerateMessage: (message) => {
    return ipcRenderer.invoke('chats:regenerateMessage', message)
  },
  abort: (threadID) => {
    return ipcRenderer.invoke('chats:abort', threadID)
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
  loadMessageList: ({ modelPath, threadID, messages }) => {
    return ipcRenderer.invoke('chats:loadMessageList', {
      modelPath,
      threadID,
      messages,
    })
  },

  cleanupSession: ({ modelPath, threadID }) => {
    return ipcRenderer.invoke('chats:cleanupSession', {
      modelPath,
      threadID,
    })
  },
} satisfies ChatsAPI)

export interface ChatsAPI {
  sendMessage: (args: {
    systemPrompt: string
    message: string
    messageID: string
    assistantMessageID: string
    threadID: string
    promptOptions?: PromptOptions
    modelPath: string
    selectedFile?: string
    outOfBand?: boolean
  }) => Promise<string>

  regenerateMessage: (args: {
    systemPrompt: string
    messageID: string
    threadID: string
    promptOptions?: PromptOptions
    modelPath: string
    selectedFile?: string
  }) => Promise<string>

  abort: (threadID: string) => void

  cleanupSession: ({
    modelPath,
    threadID,
  }: {
    modelPath: string
    threadID: string
  }) => Promise<void>

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
