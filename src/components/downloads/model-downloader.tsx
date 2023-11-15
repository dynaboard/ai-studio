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
import { useModelManager } from '@/providers/models/provider'

export function ModelDownloader({
  displayTitle = true,
}: {
  displayTitle?: boolean
}) {
  const [showExistingFileDialog, setShowExistingFileDialog] = useState(false)

  const modelManager = useModelManager()

  const availableModels = useValue(
    'availableModels',
    () => modelManager.availableModels,
    [modelManager],
  )

  return (
    <div className="flex h-full w-full flex-col">
      <AlertDialog open={showExistingFileDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Model Downloaded</AlertDialogTitle>
            <AlertDialogDescription>
              You&rsquo;ve already downloaded this model. If you need to
              redownload for any reason, please delete the existing model file
              and try again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowExistingFileDialog(false)}>
              Ok
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {displayTitle ? (
        <p className="mb-4 mt-6 w-full text-center text-2xl font-bold">
          Download a model to get started
        </p>
      ) : null}
      <div className="grid h-full w-full gap-4 overflow-auto">
        <div className="mx-auto mb-4 flex w-1/2 flex-1 flex-col gap-4">
          {modelManager.allModels.map((model) => {
            return (
              <div
                key={model.name}
                className="grid grid-rows-[min-content,_min-content,_80px] gap-1"
              >
                <span>{model.name}</span>
                <p className="mb-2 text-xs leading-normal text-muted-foreground">
                  {model.description}
                </p>
                <div className="flex gap-2">
                  {model.files.map((file) => {
                    return (
                      <a
                        href={file.url}
                        key={file.name}
                        className="flex flex-1 flex-col rounded-md border bg-secondary px-2 py-1"
                        download={file.name}
                        onClickCapture={(event) => {
                          const hasLocalFile = availableModels.some((model) =>
                            model.files.some(
                              (localFile) => localFile.name === file.name,
                            ),
                          )
                          if (hasLocalFile) {
                            event.preventDefault()
                            event.stopPropagation()

                            setShowExistingFileDialog(true)
                          }
                        }}
                      >
                        <span className="text-xs">Faster, less accurate</span>
                        <span className="text-xs">
                          Quantization: {file.quantization}
                        </span>
                        <span className="text-xs">
                          Size: {prettyBytes(file.sizeBytes)}
                        </span>
                      </a>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
