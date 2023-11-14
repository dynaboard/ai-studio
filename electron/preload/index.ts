import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('models', {
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', callback)
    return () => {
      ipcRenderer.off('download-progress', callback)
    }
  },
  onDownloadComplete: (callback) => {
    ipcRenderer.on('download-complete', callback)
    return () => {
      ipcRenderer.off('download-complete', callback)
    }
  },

  cancelDownload: (filename) => {
    return ipcRenderer.invoke('models:cancelDownload', filename)
  },

  getFilePath: (filename) => {
    return ipcRenderer.invoke('models:getFilePath', filename)
  },
} satisfies ModelsAPI)

export interface ModelsAPI {
  // TODO: type these
  onDownloadProgress: (cb: any) => () => void
  onDownloadComplete: (cb: any) => () => void
  cancelDownload: (filename: string) => Promise<void>
  getFilePath: (filename: string) => Promise<string | null>
}

declare global {
  interface Window {
    models: ModelsAPI
  }
}
