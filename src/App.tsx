import { PanelLeft } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { suspend } from 'suspend-react'

import { DownloadStatus } from '@/components/downloads/download-status'
import { StatusBar } from '@/components/status-bar'
import { useModelManager } from '@/providers/models/manager'

import { Sidebar } from './components/sidebar'
import { useMatchMediaEffect } from './lib/hooks/use-match-media'
import { cn } from './lib/utils'

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
      <div className="grid h-full w-full grid-rows-[_36px,1fr,_24px]">
        <div className="titlebar grid grid-cols-12">
          <div
            className={cn(
              'bg-background col-start-2 col-end-3 flex h-9 items-center',
              open ? 'border-r' : '',
            )}
            id="drag"
          >
            <PanelLeft
              className="text-muted-foreground h-4 w-4 cursor-pointer"
              id="no-drag"
              onClick={() => setOpen(!open)}
            />
          </div>
          <div className="col-span-10 grid place-items-center">title</div>
        </div>

        <div className="grid grid-cols-12">
          {open && <Sidebar />}
          <div
            className={
              (cn(''),
              open ? 'col-start-3 col-end-[-1]' : 'col-start-1 col-end-[-1]')
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
