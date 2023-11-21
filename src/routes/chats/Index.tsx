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
      <div className="grid h-full w-full grid-cols-[175px,_minmax(0,_1fr)]">
        {availableModels.length > 0 ? (
          <>
            <div className="h-full w-full overflow-hidden">
              <div className="h-auto w-auto min-w-[150px] border-r">
                <ThreadsSidebar />
              </div>
            </div>
            <div className="h-full w-full overflow-hidden">
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
