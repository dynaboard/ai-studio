import { app, ipcMain } from 'electron'
import { promises as fsPromises } from 'fs'
import { readdir } from 'fs/promises'

import { FileChannel } from '../../preload/events'

export class ElectronFilesManager {
  // TODO: make this more dynamic, pass in folder name, support models
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

  async deleteFileOrFolder(file: string) {
    const modelPath = `${app.getPath('userData')}/embeddings/${file}`
    const stats = await fsPromises.stat(modelPath)

    if (stats.isDirectory()) {
      await fsPromises.rm(modelPath, { recursive: true, force: true })
    } else if (stats.isFile()) {
      await fsPromises.unlink(modelPath)
    }
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

    ipcMain.handle(FileChannel.DeleteFile, async (_, filename) => {
      await this.deleteFileOrFolder(filename)
    })
  }
}
