import { Suspense } from 'react'
import { suspend } from 'suspend-react'

import { ChatWindow } from '@/components/chat-window'
import { DownloadStatus } from '@/components/downloads/download-status'
import { ModelDownloader } from '@/components/downloads/model-downloader'
import { StatusBar } from '@/components/status-bar'
import { useModelManager } from '@/providers/models'

import { Header } from './components/header'

function App() {
  const downloadManager = useModelManager()

  const models = suspend(async () => {
    return await downloadManager.loadAvailableModels()
  }, [])

  console.log('Local models & files', models)

  return (
    <Suspense fallback={<div>Loading...</div>}>
<<<<<<< HEAD
      <div className="h-screen w-screen overflow-hidden">
        <div className="grid h-full w-full grid-rows-[1fr,_24px]">
=======
      <div className="relative flex h-screen min-h-screen w-screen flex-col">
        <AssistantManagerProvider assistant={coordinatorAssistant}>
>>>>>>> 8cd2e0a (sticky top)
          <Header />
          {models.length > 0 ? <ChatWindow /> : <ModelDownloader />}

          <StatusBar />
        </div>

        <DownloadStatus />
      </div>
    </Suspense>
  )
}

export default App
