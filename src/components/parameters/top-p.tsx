import { SliderProps } from '@radix-ui/react-slider'
import { LucideInfo } from 'lucide-react'
import React from 'react'

import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'

interface TopPSelectorProps {
  defaultValue: SliderProps['defaultValue']
}

export function TopPSelector({ defaultValue }: TopPSelectorProps) {
  const [value, setValue] = React.useState(defaultValue)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Label className="text-xs">Top P</Label>
          <Popover>
            <PopoverTrigger>
              <LucideInfo className="h-3 w-3" />
              <span className="sr-only">Top P</span>
            </PopoverTrigger>
            <PopoverContent
              className="space-y-3 rounded-[0.5rem] text-sm"
              side="right"
              align="start"
              alignOffset={-20}
            >
              <p>
                Dynamically selects the smallest set of tokens whose cumulative
                probability exceeds the threshold P, and samples the next token
                only from this set. A float number between `0` and `1`. Set to
                `1` to disable. Only relevant when `temperature` is set to a
                value greater than `0`.
              </p>
            </PopoverContent>
          </Popover>
        </div>
        <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
          {value}
        </span>
      </div>
      <div className="grid gap-4">
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
    </div>
  )
}
