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

interface MaxTokensSelectorProps {
  defaultValue: SliderProps['defaultValue']
}

export function MaxTokensSelector({ defaultValue }: MaxTokensSelectorProps) {
  const [value, setValue] = React.useState(defaultValue)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Label className="text-xs">Maximum Tokens</Label>
          <Popover>
            <PopoverTrigger>
              <LucideInfo className="h-3 w-3" />
              <span className="sr-only">Maximum Tokens</span>
            </PopoverTrigger>
            <PopoverContent
              className="space-y-3 rounded-[0.5rem] text-sm"
              side="right"
              align="start"
              alignOffset={-20}
            >
              <p>
                The maximum number of tokens to generate. Requests can use up to
                2,048 or 4,096 tokens, shared between prompt and completion. The
                exact limit varies by model.
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
          id="maxlength"
          max={4029}
          defaultValue={value}
          step={10}
          onValueChange={setValue}
          className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
          aria-label="Maximum Length"
        />
      </div>
    </div>
  )
}
