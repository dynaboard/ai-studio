import { LucideInfo } from 'lucide-react'
import React from 'react'
import Textarea from 'react-textarea-autosize'

import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  useChatManager,
  useCurrentSystemPrompt,
} from '@/providers/chat/manager'

const SYSTEM_PROMPT = `You are a helpful AI assistant.`

export function SystemPrompt() {
  const chatManager = useChatManager()
  const currentSystemPrompt = useCurrentSystemPrompt()

  return (
    <div className="space-y-2">
      <div className="flex w-full items-center gap-1">
        <Label className="text-xs">System Prompt</Label>
        <Popover>
          <PopoverTrigger>
            <LucideInfo className="h-3 w-3" />
            <span className="sr-only">System Prompt</span>
          </PopoverTrigger>
          <PopoverContent
            className="space-y-3 rounded-[0.5rem] text-sm"
            side="right"
            align="start"
            alignOffset={-20}
          >
            <p>
              The default system prompt is a good starting point for most use
              cases. You can customize it to fit your use case.
            </p>
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid">
        <Textarea
          name="message"
          className="mb-1 flex min-h-[60px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
          tabIndex={0}
          defaultValue={currentSystemPrompt || SYSTEM_PROMPT}
          placeholder={SYSTEM_PROMPT}
          onChange={(event) => {
            chatManager.setSystemPrompt(event.target.value)
          }}
          rows={1}
          spellCheck={false}
        />
      </div>
    </div>
  )
}
