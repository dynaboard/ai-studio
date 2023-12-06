import { app, ipcMain } from 'electron'
import { promises as fsPromises } from 'fs'
import { readdir } from 'fs/promises'
import path, { join } from 'node:path'

import { FileChannel } from '../../preload/events'

export class ElectronFilesManager {
  async listFilesInFolder(folderName: string) {
    try {
      const files = await readdir(`${app.getPath('userData')}/${folderName}`, {
        withFileTypes: true,
      })

      const filteredFiles = files.filter((file) => {
        return file.isDirectory() && file.name.endsWith('-index')
      })

      return filteredFiles
    } catch (error) {
      console.error('Error listing files:', error)
      return []
    }
  }

  async readFile(dir: string, filename: string) {
    const embeddingsJsonPath = join(
      path.join(app.getPath('userData'), dir),
      filename,
    )
    const data = await fsPromises.readFile(embeddingsJsonPath, 'utf-8')
    return JSON.parse(data)
  }

  async deleteFileOrFolder(dir: string, file: string) {
    const fileOrFolderPath = `${app.getPath('userData')}/${dir}/${file}`
    const stats = await fsPromises.stat(fileOrFolderPath)

    // Remove file or folder
    if (stats.isDirectory()) {
      await fsPromises.rm(fileOrFolderPath, { recursive: true, force: true })
      console.log('Removed directory:', fileOrFolderPath)
    } else if (stats.isFile()) {
      await fsPromises.unlink(fileOrFolderPath)
      console.log('Removed file:', fileOrFolderPath)
    }

    // Read and update the _meta.json file
    try {
      const metaPath = join(
        path.join(app.getPath('userData'), dir),
        '_meta.json',
      )
      const data = await fsPromises.readFile(metaPath, 'utf-8')
      const metaArray = JSON.parse(data)

      // Find the index of the entry to remove based on 'filename'
      const filenameWithoutIndex = file.replace('-index', '')
      const indexToRemove = metaArray.findIndex(
        (entry) => entry.name === filenameWithoutIndex,
      )

      if (indexToRemove !== -1) {
        metaArray.splice(indexToRemove, 1)
        const updatedMetaJSON = JSON.stringify(metaArray, null, 2)
        await fsPromises.writeFile(metaPath, updatedMetaJSON, 'utf-8')
      }
    } catch (error) {
      console.error('Error updating _meta.json:', error)
    }
  }

  addClientEventHandlers() {
    ipcMain.handle(FileChannel.ListFilesInFolder, async (_, folderName) => {
      return this.listFilesInFolder(folderName)
    })

    ipcMain.handle(FileChannel.ReadFile, async (_, dir, filename) => {
      return this.readFile(dir, filename)
    })

    ipcMain.handle(FileChannel.DeleteFile, async (_, dir, filename) => {
      await this.deleteFileOrFolder(dir, filename)
    })
  }
}
