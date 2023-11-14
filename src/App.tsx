import { Suspense } from 'react'
import { suspend } from 'suspend-react'

import { ChatWindow } from '@/components/chat-window'
import { DownloadStatus } from '@/components/downloads/download-status'
import { ModelDownloader } from '@/components/downloads/model-downloader'
import { StatusBar } from '@/components/status-bar'
import { useModelManager } from '@/providers/models'

function App() {
  const downloadManager = useModelManager()

  const models = suspend(async () => {
    return await downloadManager.loadAvailableModels()
  }, [])

  console.log('Local models & files', models)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="h-screen w-screen overflow-hidden">
        <div className="grid h-full w-full grid-rows-[1fr,_24px]">
          {models.length > 0 ? <ChatWindow /> : <ModelDownloader />}

          <StatusBar />
        </div>

        <DownloadStatus />
      </div>
    </Suspense>
  )
}

export default App
