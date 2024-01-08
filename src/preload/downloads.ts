import { contextBridge, ipcRenderer } from 'electron'

import { DownloadsChannel } from './events'

contextBridge.exposeInMainWorld('downloads', {
  downloadDeno: async () => {
    return new Promise((resolve) => {
      const downloadHandler = async (_, { url, downloadLocation }) => {
        if (url.includes('deno')) {
          ipcRenderer.off(DownloadsChannel.DownloadComplete, downloadHandler)
          await ipcRenderer.invoke(DownloadsChannel.UnzipDownload, {
            filePath: downloadLocation,
            target: 'tools',
          })
          resolve()
        }
      }

      ipcRenderer.on(DownloadsChannel.DownloadComplete, downloadHandler)

      ipcRenderer.invoke(DownloadsChannel.DownloadFile, {
        url: 'https://github.com/denoland/deno/releases/download/v1.38.5/deno-aarch64-apple-darwin.zip',
      })
    })
  },
} satisfies DownloadsAPI)

export interface DownloadsAPI {
  downloadDeno: () => Promise<void>
}

declare global {
  interface Window {
    downloads: DownloadsAPI
  }
}
