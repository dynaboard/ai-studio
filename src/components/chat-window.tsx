import { LucideStopCircle, SendHorizonal } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { useValue } from 'signia-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import {
  useChatManager,
  useCurrentModel,
  useCurrentTemperature,
  useCurrentThreadID,
  useCurrentTopP,
} from '@/providers/chat/manager'
import { useThreadMessages } from '@/providers/history/manager'
import { useAvailableModels } from '@/providers/models/manager'
import { type Model } from '@/providers/models/model-list'

import { ChatMessage } from './chat-message'
import { Header } from './header'

export function ChatWindow({ models }: { models: Model[] }) {
  const chatManager = useChatManager()
  const currentModel = useCurrentModel()
  const currentTemperature = useCurrentTemperature()
  const currentTopP = useCurrentTopP()
  const currentThreadID = useCurrentThreadID()

  const { formRef, onKeyDown } = useEnterSubmit()

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const [userScrolled, setUserScrolled] = useState(false)

  const disabled = useValue('disabled', () => chatManager.paused, [chatManager])

  const messages = useThreadMessages(currentThreadID)

  const scrollToBottom = useCallback(
    (behavior?: ScrollBehavior) => {
      const scrollHeight = scrollAreaRef.current?.querySelector(
        '[data-radix-scroll-area-viewport]',
      )?.scrollHeight
      if (!userScrolled) {
        scrollAreaRef.current
          ?.querySelector('[data-radix-scroll-area-viewport]')
          ?.scrollTo({
            top: scrollHeight,
            behavior: behavior ?? 'smooth',
          })
      }
    },
    [userScrolled],
  )

  const handleMessage = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
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
        promptOptions: {
          temperature: Number(currentTemperature),
          topP: Number(currentTopP),
        },
      })
      event.currentTarget.reset()
    },
    [
      chatManager,
      currentModel,
      currentThreadID,
      currentTemperature,
      currentTopP,
    ],
  )

  const handleAbort = useCallback(() => {
    chatManager.abortMessage()
  }, [chatManager])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [chatManager, models])

  useEffect(() => {
    scrollToBottom('auto')
  }, [messages, scrollToBottom])

  const availableModels = useAvailableModels()

  return (
    // 36px - titlebar height
    // 24px - statusbar height
    <div className="chat-window flex-no-wrap flex h-[calc(100vh-36px-24px)] flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <Header models={availableModels} />
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center">
          <span className="inline-flex select-none items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
            Say something to get started
          </span>
        </div>
      ) : (
        <div className="h-full overflow-hidden py-0">
          <ScrollArea
            className="h-full"
            ref={scrollAreaRef}
            onWheelCapture={() => {
              const scrollArea = scrollAreaRef.current
              const viewport = scrollArea?.querySelector(
                '[data-radix-scroll-area-viewport]',
              )
              if (!viewport || !scrollArea) {
                return
              }
              const scrollTop = viewport.scrollTop
              const scrollHeight = viewport.scrollHeight
              const height = viewport.clientHeight
              if (scrollHeight - scrollTop > height) {
                setUserScrolled(true)
              } else {
                setUserScrolled(false)
              }
            }}
          >
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                messageID={message.id}
                onHeightChange={() => {
                  if (message.id === messages[messages.length - 1].id) {
                    scrollToBottom()
                  }
                }}
              />
            ))}
          </ScrollArea>
        </div>
      )}

      <div className="mb-2 flex h-fit items-center justify-center">
        <Button size="sm" onClick={handleAbort}>
          <LucideStopCircle size={14} className="mr-2" />
          <span className="select-none">Stop generating</span>
        </Button>
      </div>

      <div className="flex h-fit items-center p-4 pt-2">
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
            rows={3}
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
