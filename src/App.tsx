import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { suspend } from 'suspend-react'

import { DownloadStatus } from '@/components/downloads/download-status'
import { StatusBar } from '@/components/status-bar'
import { useModelManager } from '@/providers/models/manager'

import { Sidebar } from './components/sidebar'
import { Titlebar } from './components/titlebar'
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
      <div className="grid h-full grid-rows-[36px,auto,24px]">
        <Titlebar open={open} setOpen={setOpen} />

        <div className="grid min-h-full grid-cols-12">
          {open && <Sidebar />}

          <div
            className={
              open ? 'col-start-3 col-end-[-1]' : 'col-start-1 col-end-[-1]'
            }
          >
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
