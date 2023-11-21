import React from 'react'

import { ModelDownloader } from '@/components/downloads/model-downloader'
import { cn } from '@/lib/utils'
import { useAvailableModels } from '@/providers/models/manager'

export function ModelsPage() {
  const availableModels = useAvailableModels()

  return (
    <div className={cn('flex h-full w-full overflow-scroll')}>
      <ModelDownloader />
    </div>
  )
}
