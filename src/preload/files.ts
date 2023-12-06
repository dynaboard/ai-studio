import { contextBridge, ipcRenderer } from 'electron'
import { Dirent } from 'node:fs'

import { FileChannel } from './events'

contextBridge.exposeInMainWorld('files', {
  listFilesInFolder(folderName) {
    return ipcRenderer.invoke(FileChannel.ListFilesInFolder, folderName)
  },
  readMetaFile() {
    return ipcRenderer.invoke(FileChannel.ReadFile)
  },
  deleteFile(filename) {
    return ipcRenderer.invoke(FileChannel.DeleteFile, filename)
  },
} satisfies FilesAPI)

export interface FilesAPI {
  listFilesInFolder: (folderName: string) => Promise<Dirent[]>
  readMetaFile: () => Promise<
    {
      filename: string
      filePath: string
      indexDir: string
    }[]
  >
  deleteFile: (filename: string) => Promise<void>
}

declare global {
  interface Window {
    files: FilesAPI
  }
}
