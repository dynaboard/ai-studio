import { Suspense } from 'react'
import { suspend } from 'suspend-react'

import { ChatWindow } from '@/components/chat-window'
import { DownloadStatus } from '@/components/downloads/download-status'
import { ModelDownloader } from '@/components/downloads/model-downloader'
import { useModelManager } from '@/providers/models/provider'

export function HomePage() {
  const modelManager = useModelManager()

  const models = suspend(async () => {
    return await modelManager.loadAvailableModels()
  }, [])

  console.log('Local models & files', models)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="grid h-full w-full">
        {models.length > 0 ? (
          <ChatWindow models={models} />
        ) : (
          <ModelDownloader />
        )}
      </div>

      <DownloadStatus />
    </Suspense>
  )
}
