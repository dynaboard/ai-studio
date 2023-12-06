import { EmbeddingMeta } from '@shared/meta'
import { contextBridge, ipcRenderer } from 'electron'
import { Dirent } from 'node:fs'

import { FileChannel } from './events'

contextBridge.exposeInMainWorld('files', {
  listFilesInFolder(folderName) {
    return ipcRenderer.invoke(FileChannel.ListFilesInFolder, folderName)
  },
  readFile(filename) {
    return ipcRenderer.invoke(FileChannel.ReadFile, filename)
  },
  deleteFile(filename) {
    return ipcRenderer.invoke(FileChannel.DeleteFile, filename)
  },
} satisfies FilesAPI)

export interface FilesAPI {
  listFilesInFolder: (folderName: string) => Promise<Dirent[]>
  readFile: (filename: string) => Promise<EmbeddingMeta[]>
  deleteFile: (filename: string) => Promise<void>
}

declare global {
  interface Window {
    files: FilesAPI
  }
}
