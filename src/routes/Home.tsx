import { Suspense } from 'react'
import { useValue } from 'signia-react'

import { ChatWindow } from '@/components/chat-window'
import { ModelDownloader } from '@/components/downloads/model-downloader'
import { useModelManager } from '@/providers/models/provider'

export function HomePage() {
  const modelManager = useModelManager()

  const availableModels = useValue(
    'availableModels',
    () => modelManager.availableModels,
    [modelManager],
  )

  console.log('Local models & files', availableModels)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="grid h-full w-full">
        {availableModels.length > 0 ? (
          <ChatWindow models={availableModels} />
        ) : (
          // TODO: revisit to improve this getting started flow
          <div className="flex h-full flex-col gap-2 overflow-hidden">
            <ModelDownloader subtitle="Download a model to get started." />
          </div>
        )}
      </div>
    </Suspense>
  )
}
