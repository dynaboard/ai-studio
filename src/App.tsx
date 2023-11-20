import { Outlet } from 'react-router-dom'
import { suspend } from 'suspend-react'

import { DownloadStatus } from '@/components/downloads/download-status'
import { Sidebar } from '@/components/sidebar'
import { StatusBar } from '@/components/status-bar'
import { useModelManager } from '@/providers/models/manager'

export function App() {
  const modelManager = useModelManager()

  suspend(async () => {
    return await modelManager.loadAvailableModels()
  }, [modelManager])

  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="grid h-full w-full grid-rows-[minmax(0,_1fr),_24px]">
        <div className="flex transition-all">
          <Sidebar />
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
