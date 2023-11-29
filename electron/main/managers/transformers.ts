import { Tensor } from '@xenova/transformers'
import { ipcMain } from 'electron'
import fs, { existsSync } from 'node:fs'
import path from 'node:path'
import pdfParse from 'pdf-parse'

function formatContentAsString(str: string) {
  return str
    .split('\n')
    .map((line) => line.trim())
    .join(' ')
}

export class TransformersManager {
  modelPath = './.cache'
  modelName = 'Xenova/bge-large-en-v1.5'

  needsInitialization(modelName: string) {
    return !existsSync(path.join(this.modelPath, modelName))
  }

  async parse(filePath: string) {
    try {
      const dataBuffer = await fs.promises.readFile(filePath)
      const data = await pdfParse(dataBuffer)
      return formatContentAsString(data.text)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Error parsing PDF:', error)
      return
    }
  }

  async embed(fileContent: string) {
    try {
      const { pipeline } = await import('@xenova/transformers')
      const pipe = await pipeline('feature-extraction', this.modelName, {
        cache_dir: this.modelPath,
      })

      const embeddings: Tensor = await pipe(fileContent, {
        pooling: 'mean',
        normalize: true,
      })

      return embeddings.tolist()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Error during embedding:', error)
      return
    }
  }

  addClientEventHandlers() {
    ipcMain.handle('transformers:parse', (_, filePath) => {
      return this.parse(filePath)
    })
    ipcMain.handle('transformers:embed', (_, fileContent) => {
      return this.embed(fileContent)
    })
  }
}
