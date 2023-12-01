import type { Model } from '@shared/model-list'
import {
  LucideChevronDownSquare,
  LucidePauseCircle,
  LucidePlayCircle,
  LucideXCircle,
} from 'lucide-react'
import prettyBytes from 'pretty-bytes'
import { useMemo } from 'react'
import { useValue } from 'signia-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useModelManager } from '@/providers/models/manager'
import { ActiveDownload } from '@/providers/models/types'

export function DownloadStatus() {
  const modelManager = useModelManager()

  const isVisible = useValue('isVisible', () => modelManager.isStatusVisible, [
    modelManager,
  ])

  const downloads = useValue('downloads', () => modelManager.downloads, [
    modelManager,
  ])

  return isVisible ? (
    <div className="fixed bottom-0 left-0 z-50">
      <div className="flex min-h-[160px] w-screen flex-col gap-2 border-t border-t-border bg-background/80 p-4 backdrop-blur-sm">
        {downloads.map((download) => {
          return <Download download={download} key={download.filename} />
        })}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 m-0 h-auto p-1 hover:bg-transparent"
        onClick={() => modelManager.toggleStatus()}
      >
        <LucideChevronDownSquare size={16} />
      </Button>
    </div>
  ) : null
}

function Download({ download }: { download: ActiveDownload }) {
  const modelManager = useModelManager()

  const progress = (
    (download.receivedBytes / download.totalBytes) *
    100
  ).toPrecision(3)

  const modelData = useMemo(() => {
    let file: Model['files'][number] | undefined
    const model = modelManager.allModels.find((model) => {
      const foundFile = model.files.find(
        (file) => file.name === download.filename,
      )
      file = foundFile
      return !!foundFile
    })
    return {
      model,
      file,
    }
  }, [modelManager, download])

  return (
    <div key={download.filename} className="flex w-full items-center gap-2">
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-xs">
          {modelData.model?.name} ({modelData.file?.quantization})
        </span>
        <span className="text-xs text-foreground/50">{download.filename}</span>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <Progress value={Number(progress)} />
        <div className="flex justify-between gap-2">
          <span className="text-xs text-foreground/50">
            {download.status === 'downloading' ? `${progress}%` : 'Paused'}
          </span>
          <span className="text-xs text-foreground/50">
            {prettyBytes(download.totalBytes)}
          </span>
        </div>
      </div>

      <div className="flex">
        <Button
          variant="iconButton"
          size="sm"
          onClick={() => {
            if (download.status === 'paused') {
              modelManager.resumeDownload(download.filename)
            } else {
              modelManager.pauseDownload(download.filename)
            }
          }}
        >
          {download.status === 'downloading' ? (
            <LucidePauseCircle size={16} />
          ) : (
            <LucidePlayCircle size={16} />
          )}
        </Button>
        <Button
          variant="iconButton"
          size="sm"
          className="hover:text-destructive"
          onClick={() => modelManager.cancelDownload(download.filename)}
        >
          <LucideXCircle size={16} />
        </Button>
      </div>
    </div>
  )
}
