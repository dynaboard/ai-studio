import { useLocation } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { useThread } from '@/providers/history/manager'
import { useIsSidebarClosed } from '@/providers/sidebar'

function toCapitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function Titlebar() {
  const isClosed = useIsSidebarClosed()

  const { pathname } = useLocation()
  const currentPageName = pathname.split('/').pop() || 'Chats'
  const currentThread = useThread(currentPageName)
  const currentThreadTitle = currentThread?.title

  return (
    <div className={cn('top-0 z-10 h-9 w-full border-b')}>
      <div
        id="drag"
        className={cn(
          'titlebar flex h-full items-center justify-between',
          isClosed ? 'ml-28' : null,
        )}
      >
        <div className=" grid flex-1 place-items-center text-sm font-medium">
          {currentThreadTitle ?? toCapitalize(String(currentPageName))}
        </div>
      </div>
    </div>
  )
}
