import { ipcMain } from 'electron'
import { existsSync } from 'node:fs'
import path from 'node:path'

export class TransformersManager {
  modelPath = './.cache'
  modelName = 'Xenova/bge-large-en-v1.5'

  // TODO: omar to add local model initialization
  needsInitialization(modelName: string) {
    return !existsSync(path.join(this.modelPath, modelName))
  }

  // TODO: parse PDF using pdf-parse

  async embed(fileContent: string) {
    const { pipeline } = await import('@xenova/transformers')
    const pipe = await pipeline('feature-extraction', this.modelName, {
      cache_dir: this.modelPath,
    })

    const embeddings = await pipe(fileContent, {
      pooling: 'mean',
      normalize: true,
    })

    return await embeddings
  }

  addClientEventHandlers() {
    ipcMain.handle('transformers:embed', (_, fileContent) => {
      return this.embed(fileContent)
    })

    // TODO: transformers:parse
  }
}
