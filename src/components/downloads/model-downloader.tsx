import { LucideDownload, LucideLoader2, LucideTrash } from 'lucide-react'
import prettyBytes from 'pretty-bytes'
import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  useAvailableModels,
  useDownloads,
  useModelManager,
} from '@/providers/models/manager'
import { ModelFile } from '@/providers/models/model-list'

import { Button } from '../ui/button'
import { Label } from '../ui/label'

export function ModelDownloader({ subtitle }: { subtitle?: string }) {
  const modelManager = useModelManager()

  return (
    <div className="grid h-full w-full grid-cols-1">
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 min-h-min w-full border-b p-4 backdrop-blur">
        <h1 className="mb-1 mt-2 text-left text-xl font-bold leading-tight tracking-tighter md:block md:text-2xl lg:leading-[1.1]">
          Models
        </h1>
        <span className="sm:text-md text-md prose text-muted-foreground text-left">
          {subtitle
            ? subtitle
            : `Explore the OS community's AI chat models. Download ready-to-use models to your machine. Start chatting in seconds.`}
        </span>
      </div>
      <ScrollArea className="grid h-full w-full gap-4 overflow-auto">
        <div className="mx-auto flex flex-1 flex-col gap-8 bg-slate-50 p-4 dark:bg-slate-900">
          {modelManager.allModels.map((model) => {
            return (
              <div
                key={model.name}
                className="grid grid-rows-[min-content,_min-content,_80px] gap-1"
              >
                <Label className="font-semibold leading-none tracking-tight">
                  {model.name}
                </Label>
                <p className="text-muted-foreground mb-2 text-sm leading-normal">
                  {model.description}
                </p>
                <div className="flex gap-2">
                  {model.files.map((file) => (
                    <FileEntry key={file.name} file={file} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

function FileEntry({ file }: { file: ModelFile }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const modelManager = useModelManager()
  const availableModels = useAvailableModels()
  const downloads = useDownloads()

  const hasLocalFile = availableModels.some((model) =>
    model.files.some((localFile) => localFile.name === file.name),
  )

  const isDownloading = !!downloads.find(
    (download) => download.filename === file.name,
  )

  return (
    <a
      href={file.url}
      key={file.name}
      className="bg-card text-card-foreground group flex flex-1 flex-col rounded-lg border p-2 shadow-sm"
      download={file.name}
      onClickCapture={(event) => {
        if (isDownloading) {
          event.preventDefault()
          return
        }

        if (hasLocalFile) {
          event.preventDefault()
          setShowDeleteDialog(true)
        } else {
          event.stopPropagation()
        }
      }}
    >
      <div className="grid h-full grid-cols-[1fr_36px]">
        <div className="flex flex-col justify-between">
          <span className="text-xs">{file.name}</span>
          <div className="flex flex-row gap-2">
            <Badge className="hover:bg-primary">{file.quantization}</Badge>
            <Badge variant="outline">{prettyBytes(file.sizeBytes)}</Badge>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          {hasLocalFile ? (
            <>
              <AlertDialog open={showDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="iconButton"
                    className="hover:text-destructive block p-0"
                    onClick={() => {
                      setShowDeleteDialog(true)
                    }}
                  >
                    <LucideTrash className="text-muted-foreground h-4 w-4 group-hover:text-red-600" />
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This model will no longer be
                      accessible by you.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        setShowDeleteDialog(false)
                      }}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        modelManager.deleteModelFile(file.name)
                        setShowDeleteDialog(false)
                      }}
                    >
                      Delete
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Button
              size="sm"
              variant="iconButton"
              className="hover:text-primary p-0"
            >
              {isDownloading ? (
                <LucideLoader2 className="text-muted-foreground group-hover:text-muted-foreground/80 h-4 w-4 animate-spin" />
              ) : (
                <LucideDownload className="text-muted-foreground group-hover:text-muted-foreground/80 h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </a>
  )
}
