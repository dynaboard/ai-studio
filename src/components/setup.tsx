import { useState } from 'react'
import { useValue } from 'signia-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useModelManager } from '@/providers/models/manager'

export function Setup({ onComplete }: { onComplete: () => void }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const modelManager = useModelManager()

  const download = useValue(
    'downloads',
    () =>
      Array.from(modelManager.state.downloads.values()).find((d) =>
        d.filename.includes('mistral'),
      ),
    [modelManager],
  )

  const progress = download
    ? ((download.receivedBytes / download.totalBytes) * 100).toPrecision(3)
    : 0

  return (
    <div className="h-[75vh] max-h-[600px] w-[75vh] max-w-[500px] rounded-md border bg-background shadow-md">
      <div className="flex h-full w-full flex-col justify-between gap-4 pt-8">
        <div className="mx-auto">
          D Logo <span className="text-xs">(imagination)</span>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-auto p-6">
          <p>
            Use entirely local language and embedding models to answer
            questions, parse documents, generate code, and more!
          </p>
          <p>
            To get started you&rsquo;ll need to download ~4.5 GB worth of model
            files including BGE Large v1.5 and Mistral 7B Instruct.
          </p>
        </div>
        <div className="w-100 flex flex-col items-center justify-center gap-4 px-6 pb-8">
          {isDownloading ? <Progress value={Number(progress)} /> : null}
          <Button
            asChild
            onClick={(e) => {
              if (isDownloading) {
                e.preventDefault()
                return
              }
              // we dont track this because it will be completed by the time Mistral is done downloading (300mb)
              window.embeddings.loadModel('Xenova/bge-large-en-v1.5')
              setIsDownloading(true)
              const removeHandler = modelManager.onDownloadComplete(() => {
                modelManager.toggleStatus()
                removeHandler()
                setIsDownloading(false)
                onComplete()
              })
            }}
          >
            <a
              href="https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf?download=true"
              download
            >
              {isDownloading ? 'Downloading...' : 'Get Started'}
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
