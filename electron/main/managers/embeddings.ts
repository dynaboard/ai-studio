import { Tensor } from '@xenova/transformers'
import { app, BrowserWindow, ipcMain } from 'electron'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import fs, { existsSync } from 'node:fs'
import { join } from 'node:path'
import { Worker } from 'node:worker_threads'
import pdfParse from 'pdf-parse'

import { ElectronVectorStoreManager } from './vector-store'

export class EmbeddingsManager {
  worker = new Worker(join(__dirname, 'embeddings.js'))

  constructor(
    readonly window: BrowserWindow,
    readonly vectorStoreManager: ElectronVectorStoreManager,
  ) {
    this.worker.on('message', this.handleWorkerMessage)
  }

  doesTransformersCacheExist() {
    return existsSync(join(app.getPath('userData'), 'transformers-cache'))
  }

  async parse(filePath: string): Promise<{ page: number; contents: string }[]> {
    try {
      const dataBuffer = await fs.promises.readFile(filePath)
      const data: { page: number; contents: string }[] = []
      // kind of abusing the pagerender API here to extract the format we want
      await pdfParse(dataBuffer, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pagerender: (async (pageData: any) => {
          // This is the default impl: https://gitlab.com/autokent/pdf-parse/-/blob/master/lib/pdf-parse.js?ref_type=heads
          const options = {
            normalizeWhitespace: false,
            disableCombineTextItems: false,
          }

          const textContent = await pageData.getTextContent(options)
          let lastY,
            text = ''
          for (const item of textContent.items) {
            if (lastY == item.transform[5] || !lastY) {
              text += item.str
            } else {
              text += '\n' + item.str
            }
            lastY = item.transform[5]
          }

          data.push({
            page: pageData.pageNumber,
            contents: text,
          })

          return text
        }) as never,
      })
      return data
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Error parsing PDF:', error)
      return []
    }
  }

  async loadModel({
    modelName,
    onDownloading,
    onComplete,
  }: {
    modelName: string
    onDownloading?: (data: { loaded: number; total: number }) => void
    onComplete?: () => void
  }) {
    console.log('Loading transformer model:', modelName)
    const { pipeline } = await import('@xenova/transformers')
    await pipeline('feature-extraction', modelName, {
      cache_dir: join(app.getPath('userData'), 'transformers-cache'),
      progress_callback: ({
        status,
        loaded,
        total,
        file,
      }: {
        file: string
        status: string
        loaded: number
        total: number
      }) => {
        if (!file || !file.endsWith('onnx')) {
          return
        }

        if (status === 'ready') {
          console.log('Done loading transformer model:', modelName)
          onComplete?.()
        } else if (status === 'progress') {
          onDownloading?.({ loaded, total })
        }
      },
    })
  }

  async embedDocument(filePath: string) {
    const doesIndexExist =
      await this.vectorStoreManager.doesIndexExist(filePath)
    if (doesIndexExist) {
      console.log('Index already exists for:', filePath)
      this.window.webContents.send('embeddings:embeddingsComplete', {
        filePath: filePath,
      })
      return
    }

    const parsedData = await this.parse(filePath)
    const splitter = new RecursiveCharacterTextSplitter({
      chunkOverlap: 32,
      chunkSize: 1024,
    })

    const allData = []
    for (const page of parsedData) {
      const chunks = await splitter.splitText(page.contents)
      for (const chunk of chunks) {
        allData.push({
          contents: chunk,
          metadata: { path: filePath, page: page.page },
        })
      }
    }

    this.worker.postMessage({
      id: filePath,
      data: allData,
    })
  }

  handleWorkerMessage = (message: {
    id: string
    data: {
      contents: string
      embeddings: number[]
      metadata: {
        path: string
        page: number
      }
    }[]
  }) => {
    this.vectorStoreManager
      .insertFileEmbeddings({
        originalFilePath: message.id,
        data: message.data,
      })
      .then(() => {
        this.window.webContents.send('embeddings:embeddingsComplete', {
          filePath: message.id,
        })
      })
  }

  // Do not call this on the main thread unless necessary, use embedDocument instead
  async getEmbeddings(content: string) {
    const modelPath = join(app.getPath('userData'), 'transformers-cache')
    const modelName = 'Xenova/bge-large-en-v1.5'
    try {
      const { pipeline: transformerPipeline } = await import(
        '@xenova/transformers'
      )
      const pipeline = await transformerPipeline(
        'feature-extraction',
        modelName,
        {
          cache_dir: modelPath,
        },
      )
      const embeddings: Tensor = await pipeline(content, {
        pooling: 'mean',
        normalize: true,
      })

      return embeddings.tolist()[0]
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Error during embedding:', error)
      return []
    }
  }

  async search({
    filePath,
    query,
    topK = 10,
  }: {
    filePath: string
    query: string
    topK?: number
  }) {
    const embeddings = await this.getEmbeddings(query)
    return this.vectorStoreManager.search({ filePath, embeddings, topK })
  }

  // TODO: Maybe all this should be on the embeddings manager? We should probably group these two classes.
  addClientEventHandlers() {
    ipcMain.handle('embeddings:parse', (_, filePath) => {
      return this.parse(filePath)
    })

    ipcMain.handle('embeddings:getEmbeddings', (_, filePath) => {
      return this.getEmbeddings(filePath)
    })

    ipcMain.handle('embeddings:embedDocument', (_, filePath) => {
      return this.embedDocument(filePath)
    })

    ipcMain.handle('embeddings:loadModel', (_, { modelName }) => {
      return this.loadModel({ modelName })
    })

    ipcMain.handle('embeddings:doesTransformersCacheExist', () => {
      return this.doesTransformersCacheExist()
    })

    ipcMain.handle('embeddings:search', async (_, { filePath, query }) => {
      return this.search({
        filePath,
        query,
      })
    })
  }
}
