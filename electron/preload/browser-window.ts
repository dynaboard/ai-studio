import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

contextBridge.exposeInMainWorld('browserWindow', {
  onFullScreenChange: (callback: (isFullScreen: boolean) => void) => {
    const cb = (_: IpcRendererEvent, isFullScreen: boolean) => {
      callback(isFullScreen)
    }

    ipcRenderer.on('full-screen-change', cb)
    return () => {
      ipcRenderer.off('full-screen-change', cb)
    }
  },
} satisfies UsageAPI)

export interface UsageAPI {
  onFullScreenChange: (callback: (isFullScreen: boolean) => void) => void
}

declare global {
  interface Window {
    browserWindow: UsageAPI
  }
}
