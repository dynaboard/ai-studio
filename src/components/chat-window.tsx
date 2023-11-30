import { SendHorizonal } from 'lucide-react'
import prettyBytes from 'pretty-bytes'
import React, { useCallback } from 'react'
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
import { useTransformersManager } from '@/providers/transformers'

import { ChatMessage } from './chat-message'
import { Header } from './header'

export function ChatWindow({ models }: { models: Model[] }) {
  const chatManager = useChatManager()
  const currentModel = useCurrentModel()
  const currentTemperature = useCurrentTemperature()
  const currentTopP = useCurrentTopP()
  const currentThreadID = useCurrentThreadID()
  const transformersManager = useTransformersManager()

  const { formRef, onKeyDown } = useEnterSubmit()

  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  const [userScrolled, setUserScrolled] = React.useState(false)

  // TODO: move this to transformersManager
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [runningEmbeddings, setRunningEmbeddings] = React.useState(false)

  const disabled = useValue('disabled', () => chatManager.paused, [chatManager])

  const messages = useThreadMessages(currentThreadID)

  const scrollToBottom = React.useCallback(
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
      currentTemperature,
      currentTopP,
      currentThreadID,
    ],
  )

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) {
        return
      }

      setSelectedFile(file)
    },
    [],
  )

  const handleEmbedFile = useCallback(async () => {
    if (!selectedFile) {
      return
    }

    setRunningEmbeddings(true)
    await transformersManager.embedDocument(selectedFile.path)
    setRunningEmbeddings(false)
  }, [selectedFile, transformersManager])

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [chatManager, models])

  React.useEffect(() => {
    scrollToBottom('auto')
  }, [messages, scrollToBottom])

  const availableModels = useAvailableModels()

  return (
    // 36px - titlebar height
    // 24px - statusbar height
    <div className="chat-window flex-no-wrap flex h-[calc(100vh-36px-24px)] flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <Header models={availableModels} />
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-2">
          {!selectedFile && (
            <span className="inline-flex select-none items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              Say something to get started
            </span>
          )}
          {selectedFile ? (
            <div className="flex flex-col gap-2">
              <span className="inline-flex select-none items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                Selected PDF ({selectedFile.name} &sdot;{' '}
                {prettyBytes(selectedFile.size)})
              </span>
              <Button
                size="sm"
                onClick={handleEmbedFile}
                disabled={runningEmbeddings}
              >
                {runningEmbeddings ? 'Processing...' : 'Embed'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedFile(null)}
              >
                Clear
              </Button>
            </div>
          ) : (
            <div>
              <label
                htmlFor="file-browse"
                className="inline-flex cursor-pointer select-none items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium text-muted-foreground"
              >
                Browse for a PDF
              </label>
              <input
                id="file-browse"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                multiple={false}
              />
            </div>
          )}
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
