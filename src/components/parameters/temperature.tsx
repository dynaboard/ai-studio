import { LucideInfo } from 'lucide-react'
import React from 'react'

import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import {
  DEFAULT_TEMP,
  useChatManager,
  useCurrentTemperature,
} from '@/providers/chat/manager'

export function TemperatureSelector() {
  const chatManager = useChatManager()
  const currentTemperature = useCurrentTemperature()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Label className="text-xs">Temperature</Label>
          <Popover>
            <PopoverTrigger>
              <LucideInfo className="h-3 w-3" />
              <span className="sr-only">Temperature</span>
            </PopoverTrigger>
            <PopoverContent
              className="space-y-3 rounded-[0.5rem] text-sm"
              side="right"
              align="start"
              alignOffset={-20}
            >
              <p>
                Temperature is a hyperparameter that controls the randomness of
                the generated text. It affects the probability distribution of
                the model&apos;s output tokens. A higher temperature (e.g., 1.5)
                makes the output more random and creative, while a lower
                temperature (e.g., 0.5) makes the output more focused,
                deterministic, and conservative. The suggested temperature is
                0.8, which provides a balance between randomness and
                determinism. At the extreme, a temperature of 0 will always pick
                the most likely next token, leading to identical outputs in each
                run.
              </p>
            </PopoverContent>
          </Popover>
        </div>
        <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
          {currentTemperature}
        </span>
      </div>
      <div className="grid gap-4">
        <Slider
          id="temperature"
          max={1}
          defaultValue={[currentTemperature ?? DEFAULT_TEMP]}
          step={0.1}
          onValueChange={(value) => {
            chatManager.setTemperature(value[0])
          }}
          className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
          aria-label="Temperature"
        />
      </div>
    </div>
  )
}
