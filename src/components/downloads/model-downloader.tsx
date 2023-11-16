import { Download, LucideTrash } from 'lucide-react'
import prettyBytes from 'pretty-bytes'
import { useState } from 'react'
import { useValue } from 'signia-react'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useModelManager } from '@/providers/models/provider'

import { Button } from '../ui/button'
import { Label } from '../ui/label'

export function ModelDownloader({ subtitle }: { subtitle?: string }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const modelManager = useModelManager()

  const availableModels = useValue(
    'availableModels',
    () => modelManager.availableModels,
    [modelManager],
  )

  return (
    <div className="grid h-full min-h-0 w-full grid-cols-1">
      <div className="sticky top-0 z-50 min-h-min w-full border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="mb-1 mt-2 text-left text-xl font-bold leading-tight tracking-tighter md:block md:text-2xl lg:leading-[1.1]">
          Models
        </h1>
        <span className="sm:text-md text-md prose text-left text-muted-foreground">
          {subtitle
            ? subtitle
            : `Explore the OS community's AI chat models. Download ready-to-use models to your machine. Start chatting in seconds.`}
        </span>
      </div>
      <ScrollArea className="grid h-full w-full gap-4 overflow-auto">
        <div className="mx-auto flex flex-1 flex-col gap-8 bg-zinc-50 p-4 dark:bg-zinc-900">
          {modelManager.allModels.map((model) => {
            return (
              <div
                key={model.name}
                className="grid grid-rows-[min-content,_min-content,_80px] gap-1"
              >
                <Label className="font-semibold leading-none tracking-tight">
                  {model.name}
                </Label>
                <p className="mb-2 text-sm leading-normal text-muted-foreground">
                  {model.description}
                </p>
                <div className="flex gap-2">
                  {model.files.map((file) => {
                    const hasLocalFile = availableModels.some((model) =>
                      model.files.some(
                        (localFile) => localFile.name === file.name,
                      ),
                    )

                    return (
                      <a
                        href={file.url}
                        key={file.name}
                        className="group flex flex-1 flex-col rounded-lg border bg-card p-2 text-card-foreground shadow-sm"
                        download={file.name}
                        onClickCapture={(event) => {
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
                              <Badge className="hover:bg-primary">
                                {file.quantization}
                              </Badge>
                              <Badge variant="outline">
                                {prettyBytes(file.sizeBytes)}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-col items-center justify-center">
                            {hasLocalFile ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="iconButton"
                                  className="p-0 hover:text-destructive"
                                  onClick={() => {
                                    setShowDeleteDialog(true)
                                  }}
                                >
                                  <LucideTrash className="h-4 w-4 text-muted-foreground group-hover:text-red-600" />
                                </Button>
                                <AlertDialog
                                  open={showDeleteDialog}
                                  onOpenChange={setShowDeleteDialog}
                                >
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Are you sure absolutely sure?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This model
                                        will no longer be accessible by you.
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
                                          modelManager.deleteModelFile(
                                            file.name,
                                          )
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
                                className="p-0 hover:text-destructive"
                              >
                                {/* TODO: add animated download indicator */}
                                <Download className="h-4 w-4 text-muted-foreground group-hover:text-muted-foreground/80" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
