import { LucideInfo } from 'lucide-react'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function InfoMarker({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          <LucideInfo className="hover:cursor-help" size={12} />
        </TooltipTrigger>
        <TooltipContent className="bg-foreground dark:bg-background max-w-[75vw]">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
