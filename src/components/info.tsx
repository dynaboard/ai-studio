import { LucideInfo } from 'lucide-react'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function InfoMarker({
  children,
  side,
}: {
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          <LucideInfo className="hover:cursor-help" size={12} />
        </TooltipTrigger>
        <TooltipContent
          className="max-w-[75vw] bg-foreground dark:bg-background"
          side={side}
        >
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
