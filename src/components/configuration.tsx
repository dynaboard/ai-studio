import { LucideSettings } from 'lucide-react'
import React from 'react'
import Textarea from 'react-textarea-autosize'
import { Drawer } from 'vaul'

import { Button } from '@/components/ui/button'
import { DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { MaxTokensSelector } from './parameters/max-token'
import { TemperatureSelector } from './parameters/temperature'
import { TopPSelector } from './parameters/top-p'

const defaultSystemPrompt = `You are a helpful AI assistant that remembers previous conversation between yourself the "assistant" and a human the "user":
### user:
<previous user message>
### assistant:
<previous AI assistant message>

### user:
<new user prompt>

The AI's task is to understand the context and utilize the previous conversation in addressing the user's questions or requests.`

function Configuration() {
  return (
    <div className="flex flex-col space-y-4 md:space-y-6">
      <div className="flex items-start">
        <div className="space-y-1 pr-2">
          <div className="font-semibold leading-none tracking-tight">
            Customize
          </div>
          <div className="prose text-xs text-muted-foreground">
            Fine-tune parameters to get the best results for your use case.
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">System Prompt</Label>
          <div className="grid gap-2">
            <Textarea
              name="message"
              className="mb-1 flex min-h-[60px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              tabIndex={0}
              defaultValue={defaultSystemPrompt}
              rows={1}
              spellCheck={false}
              readOnly
            />
          </div>
        </div>
        <TemperatureSelector defaultValue={[0.7]} />
        <MaxTokensSelector defaultValue={[256]} />
        <TopPSelector defaultValue={[0.9]} />
      </div>
    </div>
  )
}

export function ParametersConfig() {
  return (
    <div className="flex items-center space-x-2">
      <Drawer.Root>
        <DrawerTrigger asChild>
          <Button variant="outline" className="md:hidden">
            <LucideSettings className="mr-2 h-4 w-4" />
            Customize
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85%] p-6 pt-10">
          <Configuration />
        </DrawerContent>
      </Drawer.Root>

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
            className="z-40 w-[340px] rounded-[0.5rem] bg-white p-6 dark:bg-zinc-950"
          >
            <Configuration />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
