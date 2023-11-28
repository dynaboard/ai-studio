import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import { LocalIndex } from 'vectra'

export class ElectronEmbeddingsManager {
  private initialized = false

  private storagePath = path.join(app.getPath('userData'), 'embeddings')

  initialize() {
    if (this.initialized) {
      return
    }

    if (!existsSync(this.storagePath)) {
      mkdirSync(this.storagePath)
    }
  }

  async insertFileEmbeddings({
    originalFilePath,
    data,
  }: {
    originalFilePath: string
    data: {
      contents: string
      metadata: Record<string, unknown>
      embeddings: number[]
    }[]
  }) {
    const storagePath = this.filePathToStoragePath(originalFilePath)
    const index = new LocalIndex(storagePath)
    if (await index.isIndexCreated()) {
      // no storing the vectors again for now
      console.log('Vectors already stored for:', originalFilePath)
      return
    }

    await index.createIndex()

    for (const chunk of data) {
      await index.insertItem({
        vector: chunk.embeddings,
        metadata: {
          ...chunk.metadata,
          contents: chunk.contents,
        },
        metadataFile: originalFilePath,
      })
    }

    console.log('Wrote embeddings to:', storagePath)
  }

  async search({
    filePath,
    embeddings,
    topK = 10,
  }: {
    filePath: string
    embeddings: number[]
    topK?: number
  }) {
    const storagePath = this.filePathToStoragePath(filePath)
    if (!existsSync(storagePath)) {
      return []
    }

    const index = new LocalIndex(storagePath)
    if (!(await index.isIndexCreated())) {
      console.error('Index not created for:', filePath)
      return
    }

    const results = await index.queryItems(embeddings, topK)
    return results
  }

  close() {}

  private filePathToStoragePath(filePath: string) {
    return path.join(this.storagePath, `${path.basename(filePath)}-index`)
  }
}
