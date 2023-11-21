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
    <div className="titlebar sticky top-0 z-50 grid h-9 w-full grid-cols-12 ">
      <div
        className={cn(
          // TODO: handle fullscreen positioning with the empty traffic lights
          'col-start-1 col-end-3 flex items-center justify-end bg-gray-100 pr-3',
          !open ? 'border-b' : '',
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
          'col-span-10 grid place-items-center border-b bg-gray-100 text-sm font-medium ',
          // !open ? '' : 'border-l',
        )}
        id="drag"
      >
        {currentThreadTitle ?? toCapitalize(String(currentPageName))}
      </div>
    </div>
  )
}
