import { Outlet } from 'react-router-dom'

import { ThreadsSidebar } from '@/components/chat-sidebar'
import { ModelDownloader } from '@/components/downloads/model-downloader'
import { ChatManagerProvider } from '@/providers'
import { useAvailableModels } from '@/providers/models/manager'

export function ChatsIndex() {
  const availableModels = useAvailableModels()

  console.log('Local models & files', availableModels)

  return (
    <ChatManagerProvider model={availableModels[0]?.files?.[0].name}>
      <div className="grid h-full w-full grid-cols-12">
        {availableModels.length > 0 ? (
          <>
            <div className="col-span-2 overflow-hidden">
              <div className="h-auto w-auto border-r">
                <ThreadsSidebar />
              </div>
            </div>
            <div className="col-span-10">
              <Outlet />
            </div>
          </>
        ) : (
          <ModelDownloader subtitle="Download a model to get started." />
        )}
      </div>
    </ChatManagerProvider>
  )
}
