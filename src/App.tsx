import { FileBox, MessageCircle, PanelLeft } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { suspend } from 'suspend-react'

import { DownloadStatus } from '@/components/downloads/download-status'
import { StatusBar } from '@/components/status-bar'
import { useModelManager } from '@/providers/models/manager'

import { Sidebar } from './components/sidebar'
import { Separator } from './components/ui/separator'
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
        <div className="fixed top-0 my-[3px] flex h-8 w-screen items-center  space-x-4 bg-background pl-[74px]">
          <PanelLeft
            className="ml-2 h-4 w-4 cursor-pointer text-muted-foreground"
            onClick={() => setOpen(!open)}
          />
          <Separator orientation="vertical" className="h-5" />
          <Link to="/chats">
            <MessageCircle className="h-4 w-4 cursor-pointer text-muted-foreground" />
          </Link>
          <Link to="/models">
            <FileBox className="h-4 w-4 cursor-pointer text-muted-foreground" />
          </Link>
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
