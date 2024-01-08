import { useState } from 'react'
import { Outlet, useLoaderData, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { suspend } from 'suspend-react'

import { Setup } from '@/components/setup'
import { Sidebar } from '@/components/sidebar'
import { Titlebar } from '@/components/titlebar'
import { ChatManagerProvider, ToolManagerProvider } from '@/providers'
import { useHistoryManager } from '@/providers/history/manager'
import {
  DEFAULT_MODEL,
  useAvailableModels,
  useModelManager,
} from '@/providers/models/manager'

import { DownloadStatus } from './components/downloads/download-status'
import { StatusBar } from './components/status-bar'

export function App() {
  const modelManager = useModelManager()
  const historyManager = useHistoryManager()
  const localModals = useAvailableModels()

  const navigate = useNavigate()

  const { needsSetup } = useLoaderData() as { needsSetup: boolean }

  const [needsLocalModels, setNeedsLocalModels] = useState(needsSetup)

  suspend(async () => {
    await modelManager.loadAvailableModels()
  }, [modelManager])

  return (
    <ChatManagerProvider model={localModals[0]?.files?.[0].name}>
      <ToolManagerProvider>
        {needsLocalModels ? (
          <div className="fixed z-[100] flex h-screen w-screen items-center justify-center bg-background/60 p-8 backdrop-blur-lg">
            <Setup
              onComplete={() => {
                const thread = historyManager.addThread({
                  createdAt: new Date(),
                  messages: [],
                  modelID: DEFAULT_MODEL,
                  systemPrompt: 'You are a helpful AI assistant.',
                  temperature: 0.5,
                  topP: 0.3,
                  title: 'New Thread',
                })
                setNeedsLocalModels(false)
                navigate(`/chats/${thread.id}`)
              }}
            />
          </div>
        ) : null}
        <div className="h-[calc(100vh-24px)] w-screen overflow-hidden">
          <div className="grid h-full grid-rows-[auto,24px]">
            <div className="grid min-h-full grid-cols-[min-content,_minmax(0,_1fr)]">
              <Sidebar />

              <div className="grid h-full w-full grid-rows-[36px,_minmax(0,_1fr)]">
                <Titlebar />

                <Outlet />
              </div>
            </div>

            <StatusBar />
            <DownloadStatus />
          </div>
        </div>

        <Toaster />
      </ToolManagerProvider>
    </ChatManagerProvider>
  )
}

export default App
