import { app, ipcMain } from 'electron'
import { readdir, unlink } from 'fs/promises'

import { FileChannel } from '../../preload/events'

export class ElectronFilesManager {
  async listFilesInFolder(folderName: string) {
    try {
      const files = await readdir(`${app.getPath('userData')}/${folderName}`, {
        withFileTypes: true,
      })
      // Exclude .DS_Store
      const filteredFiles = files.filter((file) => !file.name.startsWith('.'))

      return filteredFiles
    } catch (error) {
      console.error('Error listing files:', error)
      return []
    }
  }

  async deleteFile(filename: string) {
    const modelPath = `${app.getPath('userData')}/embeddings/${filename}`
    await unlink(modelPath)
  }

  addClientEventHandlers() {
    ipcMain.handle(FileChannel.ListFilesInFolder, async (_, folderName) => {
      return this.listFilesInFolder(folderName)
    })

    // ipcMain.handle(FileChannel.GetFilePath, async (_, filename) => {
    //   const path = `${app.getPath('userData')}/embeddings/${filename}`
    //   try {
    //     await access(path, constants.F_OK)
    //     return path
    //   } catch {
    //     return null
    //   }
    // })

    // ipcMain.handle(FileChannel.DeleteFile, async (_, filename) => {
    //   await this.deleteFile(filename)
    // })
  }
}
