import { PanelLeft } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { suspend } from 'suspend-react'

import { DownloadStatus } from '@/components/downloads/download-status'
import { StatusBar } from '@/components/status-bar'
import { useModelManager } from '@/providers/models/manager'

import { Sidebar } from './components/sidebar'
import { useMatchMediaEffect } from './lib/hooks/use-match-media'

export function App() {
  const modelManager = useModelManager()

  const [open, setOpen] = useState(false)

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
    return await modelManager.loadAvailableModels()
  }, [modelManager])

  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="grid h-full w-full grid-rows-[1fr,_24px]">
        <div
          className="bg-background fixed top-0 my-[3px] flex h-8 w-screen items-center space-x-4 pl-[74px]"
          id="drag"
        >
          <PanelLeft
            className="text-muted-foreground ml-2 h-4 w-4 cursor-pointer"
            id="no-drag"
            onClick={() => setOpen(!open)}
          />
        </div>

        <div className="mt-8 flex transition-all">
          <Sidebar open={open} />
          <div className="flex-1">
            <Outlet />
          </div>
        </div>

        <StatusBar />

        <DownloadStatus />
      </div>
    </div>
  )
}

export default App
