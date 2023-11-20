import { Outlet } from 'react-router-dom'

import { ThreadsSidebar } from '@/components/chat-sidebar'
import { ModelDownloader } from '@/components/downloads/model-downloader'
import { Header } from '@/components/header'
import { ChatManagerProvider } from '@/providers'
import { useAvailableModels } from '@/providers/models/manager'

export function ChatsIndex() {
  const availableModels = useAvailableModels()

  console.log('Local models & files', availableModels)

  return (
    <ChatManagerProvider model={availableModels[0]?.files?.[0].name}>
      <div className="grid h-full w-full">
        {availableModels.length > 0 ? (
          <div className="grid h-full w-full grid-rows-[min-content,_minmax(0,1fr)] overflow-hidden">
            <Header models={availableModels} currentThreadID={undefined} />
            <div className="flex h-full w-full">
              <div className="h-full w-[250px] border-r">
                <ThreadsSidebar />
              </div>
              <div className="grid h-full w-full flex-1 grid-rows-[minmax(0,_1fr),_min-content]">
                <Outlet />
              </div>
            </div>
          </div>
        ) : (
          // TODO: revisit to improve this getting started flow
          <div className="flex h-full flex-col gap-2 overflow-hidden">
            <ModelDownloader subtitle="Download a model to get started." />
          </div>
        )}
      </div>
    </ChatManagerProvider>
  )
}
