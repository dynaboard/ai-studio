import { Outlet } from 'react-router-dom'

import { ThreadsSidebar } from '@/components/chat-sidebar'
import { ModelDownloader } from '@/components/downloads/model-downloader'
import { ResizablePanel } from '@/components/panels'
import { cn } from '@/lib/utils'
import { useCurrentThreadID } from '@/providers/chat/manager'
import { useThreads } from '@/providers/history/manager'
import { useAvailableModels } from '@/providers/models/manager'

export function ChatsIndex() {
  const availableModels = useAvailableModels()
  const currentThreadID = useCurrentThreadID()
  const threads = useThreads()

  const haveModels = availableModels.length > 0
  const haveThreads = threads.length > 0

  return (
    <div
      className={cn(
        'grid h-full w-full',
        haveModels ? 'grid-cols-[175px,_minmax(0,_1fr)]' : 'grid-cols-1',
      )}
    >
      {haveModels ? (
        <>
          <div className="h-full w-full">
            <ResizablePanel defaultWidth={175} maxWidth={300} minWidth={175}>
              <ThreadsSidebar />
            </ResizablePanel>
          </div>
          <div className="h-full w-full overflow-hidden">
            <Outlet />

            {!currentThreadID && (
              <div className="flex h-full flex-col items-center justify-center">
                <span className="inline-flex select-none items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                  {haveThreads
                    ? 'Select a thread or start a new thread'
                    : 'Start a new thread'}
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <ModelDownloader subtitle="Download a model to get started." />
      )}
    </div>
  )
}
