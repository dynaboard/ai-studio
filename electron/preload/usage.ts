import { contextBridge, ipcRenderer } from 'electron'

import { UsageChannel } from './events'

contextBridge.exposeInMainWorld('usage', {
  getSystemUsage() {
    return ipcRenderer.invoke(UsageChannel.GetSystemUsage)
  },
} satisfies UsageAPI)

export interface UsageAPI {
  getSystemUsage: () => Promise<Electron.ProcessMemoryInfo>
}

declare global {
  interface Window {
    usage: UsageAPI
  }
}
