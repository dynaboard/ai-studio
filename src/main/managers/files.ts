import { app, ipcMain } from 'electron'
import { existsSync, promises as fsPromises } from 'fs'
import { readdir } from 'fs/promises'
import path, { join } from 'node:path'

import { FileChannel } from '../../preload/events'

export class ElectronFilesManager {
  async readDir(folderName: string) {
    try {
      const files = await readdir(`${app.getPath('userData')}/${folderName}`, {
        withFileTypes: true,
      })

      // Strictly return only directories that end with '-index'
      const filteredFiles = files.filter((file) => {
        return file.isDirectory() && file.name.endsWith('-index')
      })

      return filteredFiles
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error reading the directory:', error)
      return []
    }
  }

  async readFile(dir: string, filename: string) {
    const embeddingsMetaPath = join(
      path.join(app.getPath('userData'), dir),
      filename,
    )

    const embeddingsIndexes = await this.readDir('embeddings')

    if (!existsSync(embeddingsMetaPath)) {
      await fsPromises.writeFile(embeddingsMetaPath, '[]', 'utf-8')
      // eslint-disable-next-line no-console
      console.log('Created empty file:', embeddingsMetaPath)
    }

    const data = await fsPromises.readFile(embeddingsMetaPath, 'utf-8')
    const metaArray = JSON.parse(data)

    if (embeddingsIndexes.length !== metaArray.length) {
      // eslint-disable-next-line no-console
      console.warn(
        `Warning: Embeddings indexes count (${embeddingsIndexes.length}) does not match _meta.json items count (${metaArray.length}).`,
      )

      await this.reindexEmbeddingsMeta()
    }

    return metaArray
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
    ipcMain.handle(FileChannel.ReadDir, async (_, folderName) => {
      return this.readDir(folderName)
    })

    ipcMain.handle(FileChannel.ReadFile, async (_, dir, filename) => {
      return this.readFile(dir, filename)
    })

    ipcMain.handle(FileChannel.DeleteFile, async (_, dir, filename) => {
      await this.deleteFileOrFolder(dir, filename)
    })
  }

  private async reindexEmbeddingsMeta() {
    try {
      const metaPath = join(
        path.join(app.getPath('userData'), 'embeddings'),
        '_meta.json',
      )
      const data = await fsPromises.readFile(metaPath, 'utf-8')
      const metaArray = JSON.parse(data)

      const embeddingsIndexes = await this.readDir('embeddings')

      const missingIndexes = embeddingsIndexes
        .filter((index) => {
          const indexName = index.name.replace('-index', '')
          return !metaArray.some((metaItem) => metaItem.name === indexName)
        })
        .map((missingIndex) => {
          const missingIndexName = missingIndex.name.replace('-index', '')
          const missingIndexDir = join(
            path.join(app.getPath('userData'), 'embeddings'),
            missingIndexName,
          )
          return {
            name: missingIndexName,
            indexDir: missingIndexDir,
          }
        })

      for (const missingIndex of missingIndexes) {
        // eslint-disable-next-line no-console
        console.log(
          `Adding missing embedding index to _meta.json: ${missingIndex.indexDir}`,
        )
        metaArray.push({
          name: missingIndex.name,
          path: '',
          indexDir: missingIndex.indexDir,
        })
      }

      // Write the updated _meta.json back to the file
      const updatedMetaJSON = JSON.stringify(metaArray, null, 2)
      await fsPromises.writeFile(metaPath, updatedMetaJSON, 'utf-8')

      // eslint-disable-next-line no-console
      console.log('Reindexed _meta.json successfully.')
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error reindexing _meta.json:', error)
      throw error
    }
  }
}
