import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

contextBridge.exposeInMainWorld('transformers', {
  onEmbeddingsComplete: (callback: (data: { filePath: string }) => void) => {
    const cb = (_: IpcRendererEvent, data: { filePath: string }) => {
      callback(data)
    }

    ipcRenderer.on('transformers:embeddingsComplete', cb)
    return () => {
      ipcRenderer.off('transformers:embeddingsComplete', cb)
    }
  },

  parse: (filePath) => ipcRenderer.invoke('transformers:parse', filePath),
  embedDocument: (filePath) =>
    ipcRenderer.invoke('transformers:embedDocument', filePath),
  loadModel: (modelName) =>
    ipcRenderer.invoke('transformers:loadModel', { modelName }),
  doesTransformersCacheExist: () =>
    ipcRenderer.invoke('transformers:doesTransformersCacheExist'),

  search: ({ filePath, query }) =>
    ipcRenderer.invoke('transformers:search', { filePath, query }),
} satisfies TransfomersAPI)

export interface TransfomersAPI {
  onEmbeddingsComplete: (
    callback: (data: { filePath: string }) => void,
  ) => () => void
  parse: (filePath: string) => Promise<{ page: number; contents: string }[]>
  embedDocument: (filePath: string) => Promise<void>
  loadModel: (modelName: string) => Promise<void>
  doesTransformersCacheExist: () => Promise<boolean>
  search: (data: { filePath: string; query: string }) => Promise<number[]>
}

declare global {
  interface Window {
    transformers: TransfomersAPI
  }
}
