import {
  LucideFileBox,
  LucideFiles,
  LucideIcon,
  LucideMessageCircle,
  LucidePanelLeft,
  LucideWrench,
} from 'lucide-react'
import React, { useCallback } from 'react'
import { Link as BaseLink, useMatches } from 'react-router-dom'

import { ResizablePanel } from '@/components/panels'
import { buttonVariants } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useMatchMediaEffect } from '@/lib/hooks/use-match-media'
import { cn } from '@/lib/utils'
import { useIsFullScreen } from '@/providers/browser-window'
import { useEmbeddingsMeta } from '@/providers/files/manager'
import { useIsSidebarClosed, useSidebarManager } from '@/providers/sidebar'

function Link({
  icon: Icon,
  children,
  to,
  ...props
}: React.ComponentProps<typeof BaseLink> & { icon: LucideIcon; to: string }) {
  const matches = useMatches()
  const active = matches[1]?.pathname === to

  return (
    <BaseLink
      to={to}
      className={cn(
        buttonVariants({
          variant: 'ghost',
        }),
        'h-8 w-full justify-start gap-x-3 hover:bg-primary/10',
        active ? 'bg-primary/5' : '',
      )}
      {...props}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {children}
    </BaseLink>
  )
}

export function Sidebar() {
  const sidebarManager = useSidebarManager()
  const files = useEmbeddingsMeta()
  const isFullScreen = useIsFullScreen()

  const isClosed = useIsSidebarClosed()

  useMatchMediaEffect(
    '(min-width: 768px)',
    useCallback(
      (matches) => {
        sidebarManager.setIsClosed(!matches)
      },
      [sidebarManager],
    ),
  )

  const haveFiles = files.length > 0

  return (
    <ResizablePanel
      defaultWidth={175}
      minWidth={175}
      maxWidth={250}
      isClosed={isClosed}
    >
      <div className="grid h-full w-full grid-rows-[36px,_1fr] bg-primary/5">
        <div
          id="no-drag"
          className={cn(
            'mr-2 mt-[3px] flex items-center justify-end',
            isClosed ? 'fixed z-20 ml-20 translate-y-1/2' : null,
            isClosed && isFullScreen ? 'ml-2' : null,
          )}
        >
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <LucidePanelLeft
                  className="relative h-4 w-4 cursor-pointer text-muted-foreground"
                  id="no-drag"
                  onClick={() => sidebarManager.toggle()}
                />
              </TooltipTrigger>
              <TooltipContent side="right" className="px-2 py-1">
                <span className="text-xs font-medium">Toggle sidebar</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {!isClosed ? (
          <nav className="h-full w-full">
            <div className={cn('space-y-[1px] p-2')}>
              <Link to="/chats" icon={LucideMessageCircle}>
                <span className="select-none">Chats</span>
              </Link>
              <Link to="/models" icon={LucideFileBox}>
                <span className="select-none">Models</span>
              </Link>
              <Link to="/tools" icon={LucideWrench}>
                <span className="select-none">Tools</span>
              </Link>
              {/* TODO: can remove when we allow indexing files in the Files tab */}
              {haveFiles ? (
                <Link to="/files" icon={LucideFiles}>
                  <span className="select-none">Files</span>
                </Link>
              ) : (
                <></>
              )}
            </div>
          </nav>
        ) : null}
      </div>
    </ResizablePanel>
  )
}
