import { SendHorizonal } from 'lucide-react'
import prettyBytes from 'pretty-bytes'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { useValue } from 'signia-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDragAndDrop } from '@/lib/hooks/use-drag-and-drop'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { cn } from '@/lib/utils'
import {
  useChatManager,
  useCurrentModel,
  useCurrentTemperature,
  useCurrentTopP,
} from '@/providers/chat/manager'
import {
  useHistoryManager,
  useThreadFilePath,
  useThreadMessages,
} from '@/providers/history/manager'
import { useAvailableModels } from '@/providers/models/manager'
import { useTransformersManager } from '@/providers/transformers'

import { ChatMessage } from './chat-message'
import { Header } from './header'

export function ChatWindow({ id }: { id?: string }) {
  const chatManager = useChatManager()
  const historyManager = useHistoryManager()
  const transformersManager = useTransformersManager()

  const availableModels = useAvailableModels()
  const currentModel = useCurrentModel()
  const currentTemperature = useCurrentTemperature()
  const currentTopP = useCurrentTopP()

  const messages = useThreadMessages(id)
  const disabled = useValue('disabled', () => chatManager.paused, [chatManager])

  const currentThreadFilePath = useThreadFilePath(id)

  const { formRef, onKeyDown } = useEnterSubmit()

  const [userScrolled, setUserScrolled] = useState(false)
  const [runningEmbeddings, setRunningEmbeddings] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textAreaInputRef = React.useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!id) {
        return
      }

      // Only process a single file for now
      const file = files[0]

      setSelectedFile(file)

      setRunningEmbeddings(true)
      await transformersManager.embedDocument(file.path)
      historyManager.changeThreadFilePath(id, file.path)
      setRunningEmbeddings(false)

      // TODO: handle lingering selectedFile state
    },
    [id, historyManager, transformersManager],
  )

  const handleFilesChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      if (files && files.length > 0) {
        void handleFiles(files)
      }
    },
    [handleFiles],
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
        threadID: id ?? undefined, // we will create a new thread ad-hoc if necessary
        selectedFile: currentThreadFilePath ?? selectedFile?.path,
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
      currentThreadFilePath,
      currentTopP,
      id,
      selectedFile,
    ],
  )

  const handleFileInputClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }, [])

  const fileName = useMemo(() => {
    if (currentThreadFilePath) {
      return currentThreadFilePath.split('/').pop()
    }
    if (selectedFile) {
      return selectedFile.name
    }
    return undefined
  }, [currentThreadFilePath, selectedFile])

  useEffect(() => {
    if (textAreaInputRef.current) {
      textAreaInputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    scrollToBottom('auto')
  }, [messages, scrollToBottom])

  // Unselect file when switching threads
  useEffect(() => {
    if (id) {
      setSelectedFile(null)
    }
  }, [id])

  return (
    // 36px - titlebar height
    // 24px - statusbar height
    <div className="chat-window flex-no-wrap flex h-[calc(100vh-36px-24px)] flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <Header models={availableModels} />
      {messages.length === 0 ? (
        <div
          ref={setTargetElement}
          className={cn(
            'flex h-screen flex-col items-center justify-center gap-2',
            draggedOver ? 'm-4 cursor-copy rounded border-2 border-dashed' : '',
          )}
        >
          {!selectedFile && (
            <>
              {draggedOver ? (
                <span className="inline-flex select-none items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                  Drop the PDF here
                </span>
              ) : (
                <span className="inline-flex select-none items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                  Say something or&nbsp;
                  <span onClick={handleFileInputClick} className="cursor-copy">
                    drop a PDF
                  </span>
                  &nbsp;to get started
                </span>
              )}

              <input
                ref={fileInputRef}
                className="hidden"
                title="drop a pdf"
                type="file"
                onChange={handleFilesChange}
                accept="application/pdf"
                multiple={false}
              />
            </>
          )}
          {selectedFile && (
            <div className="flex flex-col gap-2">
              <span
                className="mb-4 font-medium text-muted-foreground"
                onClick={handleFileInputClick}
              >
                {selectedFile.name} ⋅ {prettyBytes(selectedFile.size)}
              </span>
              {runningEmbeddings && (
                <Button size="sm" disabled={runningEmbeddings}>
                  Processing...
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'grid h-full overflow-hidden py-0',
            fileName ? 'grid-rows-[32px,_1fr]' : 'grid-rows-1',
          )}
        >
          {fileName ? (
            <div className="flex h-full w-full items-center border-b px-2 text-xs">
              <span>Current file:</span>&nbsp;
              <span className="font-bold">{fileName}</span>
            </div>
          ) : null}
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
