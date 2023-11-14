import { LucideChevronDownSquare } from 'lucide-react'
import { useComputed, useValue } from 'signia-react'

import { Button } from '@/components/ui/button'
import { useModelManager } from '@/providers/models'

export function DownloadStatus() {
  const modelManager = useModelManager()

  const isVisible = useValue(
    'isVisible',
    () => modelManager.isStatusVisible,
    [],
  )

  const downloads = useComputed(
    'downloads',
    () => Object.values(modelManager.downloads),
    [],
  )

  return isVisible ? (
    <div className="fixed bottom-0 left-0">
      <div className="flex h-32 w-screen flex-col border-t border-t-border bg-background/80 p-4">
        {downloads.value.map((download) => {
          const progress = (download.recievedBytes / download.totalBytes) * 100
          return (
            <div key={download.filename} className="flex w-full">
              <span>{download.filename}</span>
              <span>
                {progress}% ({download.recievedBytes} / {download.totalBytes})
              </span>
              <Button
                variant={'destructive'}
                onClick={() => modelManager.cancelDownload(download.filename)}
              >
                cancel
              </Button>
            </div>
          )
        })}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0"
        onClick={() => modelManager.toggleStatus()}
      >
        <LucideChevronDownSquare size={16} />
      </Button>
    </div>
  ) : null
}
