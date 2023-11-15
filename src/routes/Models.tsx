import { LucidePlusCircle, LucideTrash } from 'lucide-react'
import { useValue } from 'signia-react'

import { ModelDownloader } from '@/components/downloads/model-downloader'
import React, { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { useModelManager } from '@/providers/models/provider'

export function ModelsPage() {
  const modelManager = useModelManager()
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const availableModels = useValue(
    'availableModels',
    () => modelManager.availableModels,
    [modelManager],
  )

  return (
    <div
      className={cn(
        'flex h-full w-full',
        availableModels.length > 0 ? 'flex-col' : null,
      )}
    >
      {availableModels.length > 0 ? (
        <div className="flex flex-col gap-2 p-2">
          {availableModels.map((model) => {
            return (
              <div key={model.name} className="flex flex-col gap-1">
                <p className="text-lg">{model.name}</p>
                <div className="grid grid-cols-2 gap-2">
                  {model.files.map((file) => {
                    return (
                      <div
                        key={file.name}
                        className="flex justify-between gap-1 rounded-md border bg-secondary p-2"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{file.name}</span>
                          <span className="text-sm">
                            Quantization: {file.quantization}
                          </span>
                        </div>

                        <div>
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
                                  This action cannot be undone. This model will
                                  no longer be accessible by you.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    modelManager.deleteModelFile(file.name)
                                    setShowDeleteDialog(false)
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
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
      <div className="flex h-full w-full p-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button>
              <LucidePlusCircle size={16} />
              <span className="pl-4">Add Model</span>
            </Button>
          </SheetTrigger>

          <SheetContent>
            <SheetHeader>
              <SheetTitle>Download Model</SheetTitle>
            </SheetHeader>

            <div className="h-full w-full">
              <ModelDownloader />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
