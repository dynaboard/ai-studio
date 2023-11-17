import { SendHorizonal } from 'lucide-react'
import React from 'react'
import Textarea from 'react-textarea-autosize'
import { useValue } from 'signia-react'

import { Button } from '@/components/ui/button'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { useChatWindowManager } from '@/providers/chat-window'
import { type Model } from '@/providers/models/model-list'

import { ChatMessage } from './chat-message'
import { Header } from './header'

export function ChatWindow({ models }: { models: Model[] }) {
  const chatWindowManager = useChatWindowManager()
  const { formRef, onKeyDown } = useEnterSubmit()

  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
    chatWindowManager.setModel(models[0].files[0].name)
  }, [chatWindowManager, models])

  const handleMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const message = data.get('message') as string | undefined
    if (!message) {
      return
    }

    void chatWindowManager.sendMessage({
      message,
    })
    event.currentTarget.reset()
  }

  const disabled = useValue('disabled', () => chatWindowManager.paused, [
    chatWindowManager,
  ])

  const messages = useValue('messages', () => chatWindowManager.messages, [
    chatWindowManager,
  ])

  return (
    <div className="grid h-full grid-rows-[_min-content,1fr,_min-content] overflow-hidden">
      <Header models={models} />
      <div className="h-full w-full overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <span className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              Say something to get started
            </span>
          </div>
        ) : (
          <>
            {messages.map((message, idx) => {
              return <ChatMessage key={idx} message={message} />
            })}
            {chatWindowManager.loadingText !== '' && (
              <span className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {chatWindowManager.loadingText}
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex items-center p-4">
        <form
          className="relative w-full"
          onSubmit={handleMessage}
          ref={formRef}
        >
          <Textarea
            name="message"
            ref={inputRef}
            className="flex min-h-[60px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
