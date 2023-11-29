import { Tensor } from '@xenova/transformers'
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('transformers', {
  embed: (fileContent) => ipcRenderer.invoke('transformers:embed', fileContent),
  parse: (filePath) => ipcRenderer.invoke('transformers:parse', filePath),
} satisfies TransfomersAPI)

export interface TransfomersAPI {
  embed: (fileContent: string) => Promise<Tensor>
  parse: (filePath: string) => Promise<string>
}

declare global {
  interface Window {
    transformers: TransfomersAPI
  }
}
