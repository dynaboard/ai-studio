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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useModelManager } from '@/providers/models/provider'
import { Button } from '../ui/button'
import { Download, LucideTrash } from 'lucide-react'
import { Label } from '../ui/label'

export function ModelDownloader() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const modelManager = useModelManager()

  const availableModels = useValue(
    'availableModels',
    () => modelManager.availableModels,
    [modelManager],
  )

  return (
    <div className="grid h-full min-h-0 w-full grid-cols-1">

      <ScrollArea className="grid h-full w-full gap-4 overflow-auto">
        <div className="mx-auto mb-4 flex flex-1 flex-col gap-4">
          {modelManager.allModels.map((model) => {
            return (
              <div
                key={model.name}
                className="grid grid-rows-[min-content,_min-content,_80px] gap-1"
              >
                <Label>{model.name}</Label>
                <p className="mb-2 text-xs leading-normal text-muted-foreground">
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
                        className="flex flex-1 flex-col rounded-md border bg-secondary px-2 py-1"
                        download={file.name}
                        onClickCapture={(event) => {
                          if (hasLocalFile) {
                            event.preventDefault()
                            event.stopPropagation()

                            setShowDeleteDialog(true)
                          }
                        }}
                      >
                        <div className="grid grid-cols-[1fr_36px]">
                          <div className="flex flex-col gap-2">
                            <span className="text-xs">
                              Faster, less accurate
                            </span>
                            <span className="text-xs">
                              Quantization: {file.quantization}
                            </span>
                            <span className="text-xs">
                              Size: {prettyBytes(file.sizeBytes)}
                            </span>
                          </div>
                          <div className="flex flex-col justify-center items-center">
                            {hasLocalFile ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="iconButton"
                                  className="p-0 hover:text-destructive"
                                  onClick={() => setShowDeleteDialog(true)}
                                >
                                  <LucideTrash size={16} />
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

                                          // TODO: toast
                                          // toast({
                                          //   description:
                                          //     'This model has been deleted.',
                                          // })
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
                                <Download size={16} />
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
