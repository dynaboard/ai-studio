import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('transformers', {
  parse: (filePath) => ipcRenderer.invoke('transformers:parse', filePath),
  embed: (fileContent) => ipcRenderer.invoke('transformers:embed', fileContent),
} satisfies TransfomersAPI)

export interface TransfomersAPI {
  parse: (filePath: string) => Promise<string>
  embed: (fileContent: string) => Promise<unknown[]>
}

declare global {
  interface Window {
    transformers: TransfomersAPI
  }
}
