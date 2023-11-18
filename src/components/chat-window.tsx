import { SendHorizonal } from 'lucide-react'
import React from 'react'
import ScrollToBottom from 'react-scroll-to-bottom'
import Textarea from 'react-textarea-autosize'
import { useValue } from 'signia-react'

import { Button } from '@/components/ui/button'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import {
  useChatManager,
  useCurrentModel,
  useCurrentThreadID,
} from '@/providers/chat/manager'
import { useThreadMessages } from '@/providers/history/manager'
import { type Model } from '@/providers/models/model-list'

import { ChatMessage } from './chat-message'

export function ChatWindow({ models }: { models: Model[] }) {
  const chatManager = useChatManager()
  const currentModel = useCurrentModel()
  const currentThreadID = useCurrentThreadID()

  const { formRef, onKeyDown } = useEnterSubmit()

  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
    chatManager.setModel(models[0].files[0].name)
  }, [chatManager, models])

  const handleMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const message = data.get('message') as string | undefined
    if (!message) {
      return
    }

    void chatManager.sendMessage({
      message,
      model: currentModel,
      threadID: currentThreadID ?? undefined, // we will create a new thread ad-hoc if necessary
    })
    event.currentTarget.reset()
  }

  const disabled = useValue('disabled', () => chatManager.paused, [chatManager])

  const messages = useThreadMessages(currentThreadID)

  return (
    <div className="grid h-full flex-1 grid-rows-[1fr,_min-content]">
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center">
          <span className="bg-muted text-muted-foreground inline-flex items-center rounded-lg px-3 py-1 text-sm font-medium">
            Say something to get started
          </span>
        </div>
      ) : (
        <ScrollToBottom
          mode="bottom"
          className="relative h-full w-full overflow-y-auto"
        >
          {messages.map((message) => (
            <ChatMessage key={message.id} messageID={message.id} />
          ))}
        </ScrollToBottom>
      )}

      <div className="flex items-center">
        <form
          className="relative w-full"
          onSubmit={handleMessage}
          ref={formRef}
        >
          <Textarea
            name="message"
            ref={inputRef}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[60px] w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            tabIndex={0}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Say something..."
            spellCheck={false}
            disabled={disabled}
          />
          <Button
            variant="ghost"
            className="group absolute right-0 top-0 hover:bg-transparent"
            type="submit"
            disabled={disabled}
          >
            <SendHorizonal size={16} className="group-hover:text-primary" />
          </Button>
        </form>
      </div>
    </div>
  )
}
