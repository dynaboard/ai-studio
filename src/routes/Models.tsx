import React from 'react'
import { useValue } from 'signia-react'

import { ModelDownloader } from '@/components/downloads/model-downloader'
import { cn } from '@/lib/utils'
import { useModelManager } from '@/providers/models/provider'

export function ModelsPage() {
  const modelManager = useModelManager()

  const availableModels = useValue(
    'availableModels',
    () => modelManager.availableModels,
    [modelManager],
  )

  return (
    <div
      className={cn(
        'flex h-full w-full p-4 pr-1',
        availableModels.length > 0 ? 'flex-col' : null,
      )}
    >
      <ModelDownloader />
    </div>
  )
}
