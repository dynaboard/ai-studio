import { ipcMain } from 'electron'
import { existsSync } from 'node:fs'
import path from 'node:path'

export class TransformersManager {
  // TODO: use local model in /models
  modelPath = './.cache'
  modelName = 'BAAI/bge-large-en-v1.5'

  needsInitialization(modelName: string) {
    return !existsSync(path.join(this.modelPath, modelName))
  }

  async embed(fileContent: string) {
    const { pipeline, env } = await import('@xenova/transformers')
    const pipe = await pipeline('feature-extraction', this.modelName)
    env.cacheDir = this.modelPath

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
  }
}
