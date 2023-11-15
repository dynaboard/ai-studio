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
        'flex h-full w-full p-4',
        availableModels.length > 0 ? 'flex-col' : null,
      )}
    >
      <ModelDownloader />
    </div>
  )
}
