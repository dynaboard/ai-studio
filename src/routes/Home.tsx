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
          <div className="flex h-full flex-col gap-2 overflow-hidden p-2">
            <p className="mb-4 mt-6 w-full text-center text-2xl font-bold">
              Download a model to get started
            </p>
            <ModelDownloader />
          </div>
        )}
      </div>
    </Suspense>
  )
}
