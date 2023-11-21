import { PanelLeft } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { cn } from '@/lib/utils'

export function Titlebar({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const { pathname } = useLocation()
  const currentPageName = pathname.split('/').pop()

  return (
    <div className="titlebar fixed top-0 z-50 grid h-9 w-full grid-cols-12 border-b">
      <div
        className={cn(
          'bg-background col-start-2 col-end-3 flex items-center',
          // open ? 'border-r' : '',
          // open ? 'justify-end pr-2' : 'justify-end',
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
        {/* TODO: use thread name if thread is selected */}
        {currentPageName}
      </div>
    </div>
  )
}
