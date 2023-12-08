import { useCallback, useState } from 'react'
import { Outlet, useLoaderData, useNavigate } from 'react-router-dom'
import { suspend } from 'suspend-react'

import { DownloadStatus } from '@/components/downloads/download-status'
import { Setup } from '@/components/setup'
import { StatusBar } from '@/components/status-bar'
import { useHistoryManager } from '@/providers/history/manager'
import { DEFAULT_MODEL, useModelManager } from '@/providers/models/manager'

import { Sidebar } from './components/sidebar'
import { Titlebar } from './components/titlebar'
import { useMatchMediaEffect } from './lib/hooks/use-match-media'
import { ResizablePanel } from './components/panels'

export function App() {
  const modelManager = useModelManager()
  const historyManager = useHistoryManager()

  const navigate = useNavigate()

  const { needsSetup } = useLoaderData() as { needsSetup: boolean }

  const [open, setOpen] = useState(false)

  const [needsLocalModels, setNeedsLocalModels] = useState(needsSetup)

  useMatchMediaEffect(
    '(min-width: 768px)',
    useCallback((matches) => {
      if (matches) {
        setOpen(true)
      } else {
        setOpen(false)
      }
    }, []),
  )

  suspend(async () => {
    await modelManager.loadAvailableModels()
  }, [modelManager])

  return (
    <>
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
      <div className="h-screen w-screen overflow-hidden">
        <div className="grid h-full grid-rows-[36px,auto,24px]">
          <Titlebar open={open} setOpen={setOpen} />

          <div className="grid min-h-full grid-cols-[min-content,_minmax(0,_1fr)]">
            {open ? (
              <ResizablePanel defaultWidth={175} minWidth={175} maxWidth={250}>
                <Sidebar />
              </ResizablePanel>
            ) : (
              <div />
            )}

            <div className="h-full w-full">
              <Outlet />
            </div>
          </div>

          <StatusBar />

          <DownloadStatus />
        </div>
      </div>
    </>
  )
}

export default App
