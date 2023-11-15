import { contextBridge, ipcRenderer } from 'electron'

import { ModelChannel, ModelEvent } from './events'

contextBridge.exposeInMainWorld('models', {
  onDownloadProgress: (callback) => {
    ipcRenderer.on(ModelEvent.DownloadProgress, callback)
    return () => {
      ipcRenderer.off(ModelEvent.DownloadProgress, callback)
    }
  },
  onDownloadComplete: (callback) => {
    ipcRenderer.on(ModelEvent.DownloadComplete, callback)
    return () => {
      ipcRenderer.off(ModelEvent.DownloadComplete, callback)
    }
  },

  resumeDownload: (filename: string) => {
    return ipcRenderer.invoke(ModelChannel.ResumeDownload, filename)
  },
  cancelDownload: (filename: string) => {
    return ipcRenderer.invoke(ModelChannel.CancelDownload, filename)
  },
  pauseDownload: (filename: string) => {
    return ipcRenderer.invoke(ModelChannel.PauseDownload, filename)
  },

  getFilePath: (filename) => {
    return ipcRenderer.invoke(ModelChannel.GetFilePath, filename)
  },
} satisfies ModelsAPI)

export interface ModelsAPI {
  // TODO: type these
  onDownloadProgress: (cb: any) => () => void
  onDownloadComplete: (cb: any) => () => void
  resumeDownload: (filename: string) => Promise<void>
  pauseDownload: (filename: string) => Promise<void>
  cancelDownload: (filename: string) => Promise<void>
  getFilePath: (filename: string) => Promise<string | null>
}

declare global {
  interface Window {
    models: ModelsAPI
  }
}
