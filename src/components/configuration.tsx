import { LucideSettings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { SystemPrompt } from './parameters/system-prompt'
import { TemperatureSelector } from './parameters/temperature'
import { TopPSelector } from './parameters/top-p'

export function ParametersConfig() {
  return (
    <div className="flex items-center space-x-2">
      <div className="hidden md:flex">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8">
              <LucideSettings className="mr-2 h-4 w-4" />
              Customize
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="z-40 w-[340px] rounded-[0.5rem] bg-white p-6 px-4 dark:bg-zinc-950"
          >
            <div className="flex flex-col">
              <div className="flex items-start">
                <div className="space-y-1 pr-2">
                  <div className="font-semibold leading-none tracking-tight">
                    Customize
                  </div>
                  <div className="prose text-xs text-muted-foreground">
                    Fine-tune parameters to get the best results for your use
                    case.
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-1 flex-col gap-4">
                <SystemPrompt />
                <TemperatureSelector />
                <TopPSelector />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
