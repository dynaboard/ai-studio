import { SliderProps } from '@radix-ui/react-slider'
import React from 'react'

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

interface TemperatureSelectorProps {
  defaultValue: SliderProps['defaultValue']
}

export function TemperatureSelector({
  defaultValue,
}: TemperatureSelectorProps) {
  const [value, setValue] = React.useState(defaultValue)

  return (
    <div className="grid gap-2 pt-2">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature" className="text-xs">
                Temperature
              </Label>
              <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
                {value}
              </span>
            </div>
            <Slider
              id="temperature"
              max={1}
              defaultValue={value}
              step={0.1}
              onValueChange={setValue}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              aria-label="Temperature"
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent
          align="start"
          className="w-[260px] text-sm"
          side="left"
        >
          Temperature is a hyperparameter that controls the randomness of the
          generated text. It affects the probability distribution of the
          model&apos;s output tokens. A higher temperature (e.g., 1.5) makes the
          output more random and creative, while a lower temperature (e.g., 0.5)
          makes the output more focused, deterministic, and conservative. The
          suggested temperature is 0.8, which provides a balance between
          randomness and determinism. At the extreme, a temperature of 0 will
          always pick the most likely next token, leading to identical outputs
          in each run.
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
