import { PanelLeft } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useIsActiveWindow, useIsFullScreen } from '@/providers/browser-window'
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
  const currentPageName = pathname.split('/').pop() || 'Chats'
  const currentThread = useThread(currentPageName)
  const currentThreadTitle = currentThread?.title

  const isFullScreen = useIsFullScreen()
  const isWindowActive = useIsActiveWindow()

  return (
    <div
      className={cn(
        'titlebar sticky top-0 z-50 flex h-9 w-full items-center justify-between border-b',
        isFullScreen ? 'px-2' : 'pl-[76px]',
      )}
    >
      {isWindowActive ? (
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'col-start-1 col-end-3 mt-[3px] flex items-center justify-end',
                )}
                id="drag"
              >
                <PanelLeft
                  className="h-4 w-4 cursor-pointer text-muted-foreground"
                  id="no-drag"
                  onClick={() => setOpen(!open)}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="px-2 py-1">
              <span className="text-xs font-medium">Toggle sidebar</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <div className="w-4" />
      )}
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
