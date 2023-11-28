import { Tensor } from '@xenova/transformers'
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('transformers', {
  embed: (fileContent) => ipcRenderer.invoke('transformers:embed', fileContent),
} satisfies TransfomersAPI)

export interface TransfomersAPI {
  embed: (fileContent: string) => Promise<Tensor>
}

declare global {
  interface Window {
    transformers: TransfomersAPI
  }
}
