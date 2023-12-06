import { app, ipcMain } from 'electron'
import { promises as fsPromises } from 'fs'
import { readdir } from 'fs/promises'
import path, { join } from 'node:path'

import { FileChannel } from '../../preload/events'

export class ElectronFilesManager {
  private embeddingsPath = path.join(app.getPath('userData'), 'embeddings')

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

  async readFile(filename: string) {
    const embeddingsJsonPath = join(this.embeddingsPath, filename)
    const data = await fsPromises.readFile(embeddingsJsonPath, 'utf-8')
    return JSON.parse(data)
  }

  async deleteFileOrFolder(file: string) {
    const fileOrFolderPath = `${app.getPath('userData')}/embeddings/${file}`
    const stats = await fsPromises.stat(fileOrFolderPath)

    // Remove file or folder
    if (stats.isDirectory()) {
      await fsPromises.rm(fileOrFolderPath, { recursive: true, force: true })
    } else if (stats.isFile()) {
      await fsPromises.unlink(fileOrFolderPath)
    }

    // Read and update the _meta.json file
    try {
      const metaPath = join(this.embeddingsPath, '_meta.json')
      const data = await fsPromises.readFile(metaPath, 'utf-8')
      const metaArray = JSON.parse(data)

      // Find the index of the entry to remove based on 'filename'
      const filenameWithoutIndex = file.replace('-index', '')
      const indexToRemove = metaArray.findIndex(
        (entry) => entry.name === filenameWithoutIndex,
      )

      console.log(
        'Removing entry at index:',
        filenameWithoutIndex,
        indexToRemove,
      )

      if (indexToRemove !== -1) {
        metaArray.splice(indexToRemove, 1)
        const updatedMetaJSON = JSON.stringify(metaArray, null, 2)
        console.log('Updating _meta.json with:', updatedMetaJSON)
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

    ipcMain.handle(FileChannel.ReadFile, async (_, filename) => {
      return this.readFile(filename)
    })

    ipcMain.handle(FileChannel.DeleteFile, async (_, filename) => {
      await this.deleteFileOrFolder(filename)
    })
  }
}
