import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

contextBridge.exposeInMainWorld('embeddings', {
  onEmbeddingsComplete: (callback: (data: { filePath: string }) => void) => {
    const cb = (_: IpcRendererEvent, data: { filePath: string }) => {
      callback(data)
    }

    ipcRenderer.on('embeddings:embeddingsComplete', cb)
    return () => {
      ipcRenderer.off('embeddings:embeddingsComplete', cb)
    }
  },

  parse: (filePath) => ipcRenderer.invoke('embeddings:parse', filePath),
  embedDocument: (filePath) =>
    ipcRenderer.invoke('embeddings:embedDocument', filePath),
  loadModel: (modelName) =>
    ipcRenderer.invoke('embeddings:loadModel', { modelName }),
  doesTransformersCacheExist: () =>
    ipcRenderer.invoke('embeddings:doesTransformersCacheExist'),

  search: ({ filePath, query }) =>
    ipcRenderer.invoke('embeddings:search', { filePath, query }),
} satisfies EmbeddingsAPI)

export interface EmbeddingsAPI {
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
    embeddings: EmbeddingsAPI
  }
}
