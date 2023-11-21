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
    <div className="titlebar sticky top-0 z-50 grid h-9 w-full grid-cols-12 border-b">
      <div
        className={cn(
          'bg-background col-start-1 col-end-3 flex items-center justify-end pr-2',
          open ? 'border-r' : '',
        )}
        id="drag"
      >
        <PanelLeft
          className="text-muted-foreground h-4 w-4 cursor-pointer"
          id="no-drag"
          onClick={() => setOpen(!open)}
        />
      </div>
      <div
        className="col-span-10 grid place-items-center text-sm font-medium"
        id="drag"
      >
        {currentThreadTitle ?? toCapitalize(String(currentPageName))}
      </div>
    </div>
  )
}
