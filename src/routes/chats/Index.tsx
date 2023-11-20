import { Outlet } from 'react-router-dom'

import { ThreadsSidebar } from '@/components/chat-sidebar'
import { ModelDownloader } from '@/components/downloads/model-downloader'
// import { Header } from '@/components/header'
import { ChatManagerProvider } from '@/providers'
import { useAvailableModels } from '@/providers/models/manager'

export function ChatsIndex() {
  const availableModels = useAvailableModels()

  console.log('Local models & files', availableModels)

  return (
    <ChatManagerProvider model={availableModels[0]?.files?.[0].name}>
      <div className="grid h-full w-screen grid-cols-12">
        {availableModels.length > 0 ? (
          <div className="col-start-1 col-end-3 overflow-hidden">
            <div className="h-full w-auto border-r">
              <ThreadsSidebar />
            </div>
            {/* <div className="grid h-full w-full grid-rows-[minmax(0,_1fr),_min-content]"> */}
            <Outlet />
            {/* </div> */}
          </div>
        ) : (
          // <div className="flex h-full flex-col gap-2 overflow-hidden">
          <ModelDownloader subtitle="Download a model to get started." />
          // </div>
        )}
      </div>
    </ChatManagerProvider>
  )
}
