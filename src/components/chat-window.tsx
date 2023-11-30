import { SendHorizonal } from 'lucide-react'
import prettyBytes from 'pretty-bytes'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { useValue } from 'signia-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDragAndDrop } from '@/lib/hooks/use-drag-and-drop'
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

  const [userScrolled, setUserScrolled] = useState(false)
  const [runningEmbeddings, setRunningEmbeddings] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textAreaInputRef = React.useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  const disabled = useValue('disabled', () => chatManager.paused, [chatManager])

  const messages = useThreadMessages(currentThreadID)

  const handleFiles = useCallback(async (files: File[]) => {
    // Handle single file for now
    setSelectedFile(files[0])
  }, [])

  const handleFileInputClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }, [])

  const handleFilesChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      if (files && files.length > 0) {
        void handleFiles(files)
      }
    },
    [handleFiles],
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

  const { draggedOver, setTargetElement } = useDragAndDrop({
    fileTypes: ['application/pdf'],
    onDrop: handleFiles,
  })

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
      currentTemperature,
      currentTopP,
      currentThreadID,
    ],
  )

  const handleEmbedFile = useCallback(async () => {
    if (!selectedFile) {
      return
    }

    setRunningEmbeddings(true)
    await transformersManager.embedDocument(selectedFile.path)
    setRunningEmbeddings(false)
  }, [selectedFile, transformersManager])

  useEffect(() => {
    if (textAreaInputRef.current) {
      textAreaInputRef.current.focus()
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
        <div className="flex h-full flex-col items-center justify-center gap-2">
          {!selectedFile && (
            <span className="inline-flex select-none items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              Say something or drop a PDF to get started
            </span>
          )}
          {selectedFile && (
            <div className="flex flex-col gap-2">
              <span
                className="mb-4 font-medium text-muted-foreground"
                onClick={handleFileInputClick}
              >
                {selectedFile
                  ? `${selectedFile.name} ⋅ ${prettyBytes(selectedFile.size)}`
                  : 'Drop a PDF'}
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
          )}
          {!selectedFile && (
            <div
              className="flex h-80 w-80 cursor-pointer items-center justify-center rounded-full border-2 border-dashed bg-transparent"
              ref={setTargetElement}
            >
              <input
                ref={fileInputRef}
                className="hidden"
                title="drop a pdf"
                type="file"
                onChange={handleFilesChange}
                accept=".pdf"
                multiple={false}
              />

              {draggedOver ? (
                <span
                  className="font-medium text-muted-foreground"
                  onClick={handleFileInputClick}
                >
                  Drop, drop, drop
                </span>
              ) : (
                <div className="flex flex-col gap-2">
                  <span
                    className="mb-4 font-medium text-muted-foreground"
                    onClick={handleFileInputClick}
                  >
                    Drop a PDF
                  </span>
                </div>
              )}
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
            ref={textAreaInputRef}
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
