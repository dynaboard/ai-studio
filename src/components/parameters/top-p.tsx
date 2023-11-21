import { SliderProps } from '@radix-ui/react-slider'
import React from 'react'

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

interface TopPSelectorProps {
  defaultValue: SliderProps['defaultValue']
}

export function TopPSelector({ defaultValue }: TopPSelectorProps) {
  const [value, setValue] = React.useState(defaultValue)

  return (
    <div className="grid gap-2 pt-2">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="top-p" className="text-xs">
                Top P
              </Label>
              <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
                {value}
              </span>
            </div>
            <Slider
              id="top-p"
              max={1}
              defaultValue={value}
              step={0.1}
              onValueChange={setValue}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              aria-label="Top P"
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent
          align="start"
          className="w-[260px] text-sm"
          side="left"
        >
          Dynamically selects the smallest set of tokens whose cumulative
          probability exceeds the threshold P, and samples the next token only
          from this set. A float number between `0` and `1`. Set to `1` to
          disable. Only relevant when `temperature` is set to a value greater
          than `0`.
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
