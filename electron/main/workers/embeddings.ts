import type { Pipeline, Tensor } from '@xenova/transformers'
import { join } from 'node:path'
import { parentPort } from 'node:worker_threads'

const modelPath = join(
  process.env.HOME!,
  'Library/Application Support/dynaboard-ai-studio/transformers-cache',
)
const modelName = 'Xenova/bge-large-en-v1.5'

let pipeline: Pipeline

  // We are assuming things are downloaded by the time we get here
;(async () => {
  const { pipeline: transformerPipeline } = await import('@xenova/transformers')
  pipeline = await transformerPipeline('feature-extraction', modelName, {
    cache_dir: modelPath,
  })
})()

async function getEmbeddings(content: string) {
  try {
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

const port = parentPort
if (!port) throw new Error('Should not be running in main thread')

type DocumentData = {
  contents: string
  metadata: Record<string, unknown>
}

async function processData(id: string, data: DocumentData[]) {
  const results = await Promise.all(
    data.map(async (chunk) => {
      const embeddings = await getEmbeddings(chunk.contents)
      return {
        ...chunk,
        embeddings,
      }
    }),
  )

  port!.postMessage({
    id,
    data: results,
  })
}

port.on('message', (event: { id: string; data: DocumentData[] }) => {
  processData(event.id, event.data)
})
