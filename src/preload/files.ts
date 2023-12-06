import { contextBridge, ipcRenderer } from 'electron'
import { Dirent } from 'node:fs'

import { FileChannel } from './events'

contextBridge.exposeInMainWorld('files', {
  listFilesInFolder(folderName) {
    return ipcRenderer.invoke(FileChannel.ListFilesInFolder, folderName)
  },
  // deleteFile(filename) {
  //   return ipcRenderer.invoke(FileChannel.DeleteFile, filename)
  // },
  // getFilePath(filename) {
  //   return ipcRenderer.invoke(FileChannel.GetFilePath, filename)
  // },
} satisfies FilesAPI)

export interface FilesAPI {
  listFilesInFolder: (folderName: string) => Promise<Dirent[]>
  // deleteFile: (filename: string) => Promise<void>
  // getFilePath: (filename: string) => Promise<string | null>
}

declare global {
  interface Window {
    files: FilesAPI
  }
}
