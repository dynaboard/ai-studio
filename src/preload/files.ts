import { EmbeddingMeta } from '@shared/meta'
import { contextBridge, ipcRenderer } from 'electron'
import { Dirent } from 'node:fs'

import { FileChannel } from './events'

contextBridge.exposeInMainWorld('files', {
  readDir(folderName) {
    return ipcRenderer.invoke(FileChannel.ReadDir, folderName)
  },
  readFile(dir, filename) {
    return ipcRenderer.invoke(FileChannel.ReadFile, dir, filename)
  },
  deleteFile(dir, filename) {
    return ipcRenderer.invoke(FileChannel.DeleteFile, dir, filename)
  },
  openPath(filePath) {
    ipcRenderer.send('open-path', filePath)
  },
} satisfies FilesAPI)

export interface FilesAPI {
  readDir: (folderName: string) => Promise<Dirent[]>
  readFile: (dir: string, filename: string) => Promise<EmbeddingMeta[]>
  deleteFile: (dir: string, filename: string) => Promise<void>
  openPath: (filePath: string) => void
}

declare global {
  interface Window {
    files: FilesAPI
  }
}
