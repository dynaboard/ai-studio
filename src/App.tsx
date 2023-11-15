import { Outlet } from 'react-router-dom'

import { Sidebar } from '@/components/sidebar'
import { StatusBar } from '@/components/status-bar'

export function App() {
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
      </div>
    </div>
  )
}

export default App
