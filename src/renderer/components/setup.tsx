import { useState } from 'react'
import { useValue } from 'signia-react'

import AuditIcon from '@/assets/icons/audit.svg'
import MagicCommandIcon from '@/assets/icons/magic-command.svg'
import OfflineIcon from '@/assets/icons/offline.svg'
import PageIcon from '@/assets/icons/page.svg'
import LogoLight from '@/assets/logo-light.svg'
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
    <div className="h-[75vh] max-h-[800px] w-full max-w-[1000px] rounded-md border bg-background shadow-md">
      <div className="flex h-full w-full flex-col gap-4 pt-12">
        <div className="flex w-full flex-1 justify-center px-8">
          <img
            src={LogoLight}
            className="w-full max-w-[300px]"
            alt="Dynaboard AI Studio Logo"
            style={{
              imageRendering: '-webkit-optimize-contrast',
            }}
          />
        </div>

        <div className="flex-2 flex flex-col gap-8 overflow-auto p-12 px-24">
          <div className="grid grid-cols-2 justify-around gap-16">
            <InfoGroup
              title="Keep your data private"
              description="Eliminate data residency, compliance, or privacy concerns with every model running on your machine."
              logo={OfflineIcon}
            />
            <InfoGroup
              title="Use one model or every model"
              description="Not every project is the same. Choose from dozens of models and sizes to find the right one."
              logo={AuditIcon}
            />
          </div>
          <div className="grid grid-cols-2 justify-around gap-16">
            <InfoGroup
              title="Chat with any PDF"
              description="Import PDFs into a local database for easy search, recall, and summarization by your model of choice."
              logo={PageIcon}
            />
            <InfoGroup
              title="Generate text, code, JSON, and more"
              description="Chat is just the beginning. Specify code, JSON, and more as output with validation (coming soon)."
              logo={MagicCommandIcon}
            />
          </div>
        </div>
        <div className="w-100 flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-8">
          {isDownloading ? (
            <div className="w-full max-w-[375px]">
              <Progress value={Number(progress)} />
            </div>
          ) : (
            <span className="text-xs text-slate-600">
              To get started you&rsquo;ll need to download ~4.5 GB worth of
              model files including: BGE Large v1.5 and Mistral 7B.
            </span>
          )}
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
              {isDownloading ? 'Downloading...' : 'Download Now'}
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

function InfoGroup({
  title,
  description,
  logo,
}: {
  title: string
  description: string
  logo: string
}) {
  return (
    <div className="grid grid-cols-[48px,_1fr] gap-4">
      <img src={logo} alt="Audit Logo" className="w-16" />
      <div className="flex flex-col">
        <span className="text-sm font-bold">{title}</span>
        <span className="text-sm font-light">{description}</span>
      </div>
    </div>
  )
}
