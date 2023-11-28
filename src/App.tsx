import { useCallback, useState } from 'react'
import { Outlet, useLoaderData } from 'react-router-dom'
import { suspend } from 'suspend-react'

import { DownloadStatus } from '@/components/downloads/download-status'
import { Setup } from '@/components/setup'
import { StatusBar } from '@/components/status-bar'
import { useModelManager } from '@/providers/models/manager'

import { Sidebar } from './components/sidebar'
import { Titlebar } from './components/titlebar'
import { useMatchMediaEffect } from './lib/hooks/use-match-media'

export function App() {
  const modelManager = useModelManager()

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
        <div className="fixed  z-[100] flex h-screen w-screen items-center justify-center bg-background/60 backdrop-blur-lg">
          <div className="h-[75vh] max-h-[600px] w-[75vh] max-w-[500px] rounded-md border bg-background shadow-md">
            <Setup
              onComplete={() => {
                setNeedsLocalModels(false)
              }}
            />
          </div>
        </div>
      ) : null}
      <div className="h-screen w-screen overflow-hidden">
        <div className="grid h-full grid-rows-[36px,auto,24px]">
          <Titlebar open={open} setOpen={setOpen} />

          <div className="grid min-h-full grid-cols-[min-content,_minmax(0,_1fr)]">
            {open ? (
              <div className="w-[175px] border-r">
                <Sidebar />
              </div>
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
