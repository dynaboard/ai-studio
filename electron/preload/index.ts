import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { LLamaChatPromptOptions } from 'node-llama-cpp/dist/llamaEvaluator/LlamaChatSession'
import { ModelChannel, ModelEvent } from './events'

contextBridge.exposeInMainWorld('models', {
  onDownloadProgress(callback) {
    ipcRenderer.on(ModelEvent.DownloadProgress, callback)
    return () => {
      ipcRenderer.off(ModelEvent.DownloadProgress, callback)
    }
  },
  onDownloadComplete(callback) {
    ipcRenderer.on(ModelEvent.DownloadComplete, callback)
    return () => {
      ipcRenderer.off(ModelEvent.DownloadComplete, callback)
    }
  },

  resumeDownload(filename) {
    return ipcRenderer.invoke(ModelChannel.ResumeDownload, filename)
  },
  cancelDownload(filename) {
    return ipcRenderer.invoke(ModelChannel.CancelDownload, filename)
  },
  pauseDownload(filename) {
    return ipcRenderer.invoke(ModelChannel.PauseDownload, filename)
  },

  deleteModelFile(filename) {
    return ipcRenderer.invoke(ModelChannel.DeleteModelFile, filename)
  },
  getFilePath(filename) {
    return ipcRenderer.invoke(ModelChannel.GetFilePath, filename)
  },
} satisfies ModelsAPI)

contextBridge.exposeInMainWorld('chats', {
  sendMessage: (message) => {
    return ipcRenderer.invoke('chats:sendMessage', message)
  },
} satisfies ChatsAPI)

export interface ModelsAPI {
  onDownloadProgress: (
    cb: (
      event: IpcRendererEvent,
      data: { filename: string; receivedBytes: number; totalBytes: number },
    ) => void,
  ) => () => void
  onDownloadComplete: (
    cb: (
      event: IpcRendererEvent,
      data: {
        filename: string
        receivedBytes: number
        totalBytes: number
        state: 'completed' | 'cancelled' | 'interrupted'
      },
    ) => void,
  ) => () => void
  resumeDownload: (filename: string) => Promise<void>
  pauseDownload: (filename: string) => Promise<void>
  cancelDownload: (filename: string) => Promise<void>
  deleteModelFile: (filename: string) => Promise<void>
  getFilePath: (filename: string) => Promise<string | null>
}

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
    models: ModelsAPI
    chats: ChatsAPI
  }
}
