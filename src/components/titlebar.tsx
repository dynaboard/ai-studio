import { PanelLeft } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { useThread } from '@/providers/history/manager'

function toCapitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function Titlebar({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const { pathname } = useLocation()
  const currentPageName = pathname.split('/').pop()
  const currentThread = useThread(currentPageName)
  const currentThreadTitle = currentThread?.title

  return (
    // TODO: detect is full screen then pl to 0
    <div className="titlebar sticky top-0 z-50 flex h-9 w-full items-center justify-between border-b pl-[76px]">
      <div
        className={cn(
          'col-start-1 col-end-3 mt-[2px] flex items-center justify-end',
        )}
        id="drag"
      >
        <PanelLeft
          className="h-4 w-4 cursor-pointer text-muted-foreground"
          id="no-drag"
          onClick={() => setOpen(!open)}
        />
      </div>
      <div
        className={cn(
          'col-span-10 grid flex-1 place-items-center text-sm font-medium',
        )}
        id="drag"
      >
        {currentThreadTitle ?? toCapitalize(String(currentPageName))}
      </div>
    </div>
  )
}
