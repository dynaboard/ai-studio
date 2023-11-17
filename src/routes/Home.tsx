import { Suspense } from 'react'

import { ChatWindow } from '@/components/chat-window'
import { ModelDownloader } from '@/components/downloads/model-downloader'
import { ChatWindowProvider } from '@/providers'
import { useAvailableModels } from '@/providers/models/provider'

export function HomePage() {
  const availableModels = useAvailableModels()

  console.log('Local models & files', availableModels)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="grid h-full w-full">
        {availableModels.length > 0 ? (
          <ChatWindowProvider model={availableModels[0].files[0].name}>
            <ChatWindow models={availableModels} />
          </ChatWindowProvider>
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
