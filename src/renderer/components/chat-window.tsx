import {
  LucideLoader2,
  LucidePaperclip,
  LucideStopCircle,
  LucideTrash2,
} from 'lucide-react'
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Textarea from 'react-textarea-autosize'
import { useValue } from 'signia-react'
import { toast } from 'sonner'

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
  useIsCurrentThreadGenerating,
} from '@/providers/chat/manager'
import { useFilesManager } from '@/providers/files/manager'
import {
  useHistoryManager,
  useThreadFilePath,
  useThreadMessages,
} from '@/providers/history/manager'
import { useAvailableModels, useModel } from '@/providers/models/manager'
import { useTransformersManager } from '@/providers/transformers'

import { ChatMessage } from './chat-message'
import { Header } from './header'

function StatusIndicatorText({
  text,
  spinner,
  className,
}: {
  text: string
  spinner?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex select-none items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium text-muted-foreground',
        className,
      )}
    >
      {spinner && (
        <LucideLoader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {text}
    </span>
  )
}

export function ChatWindow({ id }: { id?: string }) {
  const chatManager = useChatManager()
  const historyManager = useHistoryManager()
  const transformersManager = useTransformersManager()
  const filesManager = useFilesManager()

  const availableModels = useAvailableModels()
  const currentModel = useCurrentModel()
  const currentTemperature = useCurrentTemperature()
  const currentTopP = useCurrentTopP()
  const isCurrentThreadGenerating = useIsCurrentThreadGenerating(id)

  const modelData = useModel(currentModel)

  const messages = useThreadMessages(id)
  const disabled = useValue('disabled', () => chatManager.paused, [chatManager])

  const currentThreadFilePath = useThreadFilePath(id)

  const { formRef, onKeyDown } = useEnterSubmit()

  const [userScrolled, setUserScrolled] = useState(false)
  const [runningEmbeddings, setRunningEmbeddings] = useState(false)
  const [shouldRefocusTextarea, setShouldRefocusTextarea] = useState(false)
  const [hasMessage, setHasMessage] = useState(false)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [base64Image, setBase64Image] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textAreaInputRef = useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const supportsImages = modelData?.capabilities?.includes('images') ?? false

  const fileTypes = supportsImages
    ? ['application/pdf', 'image/png', 'image/jpeg']
    : ['application/pdf']

  const handleFilesDrop = useCallback(
    async (files: File[]) => {
      if (!id) {
        return
      }

      // Only process a single file for now
      const file = files[0]

      setSelectedFile(file)

      if (file.name.endsWith('.pdf')) {
        setRunningEmbeddings(true)

        await transformersManager.embedDocument(file.path)
        await filesManager.loadFiles()
        historyManager.changeThreadFilePath(id, file.path)

        setRunningEmbeddings(false)
        toast.success(`Embeddings generated for ${file.name}`)

        // Rely on useState to refocus the textarea
        setShouldRefocusTextarea(true)
      } else if (
        file.name.endsWith('.png') ||
        file.name.endsWith('.jpg') ||
        file.name.endsWith('.jpeg')
      ) {
        const image = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        setBase64Image(image as string)
      }
    },
    [id, historyManager, transformersManager, filesManager],
  )

  const handleFilesChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      if (files && files.length > 0) {
        void handleFilesDrop(files)
      }
    },
    [handleFilesDrop],
  )

  const handleFilesAttach = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }, [])

  const { draggedOver, setTargetElement } = useDragAndDrop({
    fileTypes,
    onDrop: handleFilesDrop,
  })

  const scrollToBottom = useCallback(
    (behavior?: ScrollBehavior, force?: boolean) => {
      const scrollHeight = scrollAreaRef.current?.querySelector(
        '[data-radix-scroll-area-viewport]',
      )?.scrollHeight
      if (force || !userScrolled) {
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

  const handleFormSubmit = useCallback(
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

  const handleFormChange = useCallback((e) => {
    const data = new FormData(e.currentTarget)
    const message = data.get('message') as string | undefined
    setHasMessage(!!message)
  }, [])

  const handleFormClick = useCallback(() => {
    if (textAreaInputRef.current) {
      textAreaInputRef.current.focus()
    }
  }, [])

  const handleAbort = useCallback(() => {
    if (id) {
      chatManager.abort(id)
    }
  }, [chatManager, id])

  const fileName = useMemo(() => {
    if (currentThreadFilePath) {
      return currentThreadFilePath.split('/').pop()
    }
    if (selectedFile) {
      return selectedFile.name
    }
    return undefined
  }, [currentThreadFilePath, selectedFile])

  useLayoutEffect(() => {
    if (id && !isCurrentThreadGenerating && textAreaInputRef.current) {
      textAreaInputRef.current.focus()
    }
    if (shouldRefocusTextarea && textAreaInputRef.current) {
      textAreaInputRef.current.focus()
      setShouldRefocusTextarea(false)
    }
  }, [isCurrentThreadGenerating, id, shouldRefocusTextarea])

  useEffect(() => {
    if (id) {
      scrollToBottom('auto', true)
    }
  }, [id, messages, scrollToBottom])

  useEffect(() => {
    if (id) {
      setSelectedFile(null)
      setBase64Image(null)
      formRef.current?.reset()
    }
  }, [id, formRef])

  const isFormDisabled =
    disabled ||
    isCurrentThreadGenerating ||
    runningEmbeddings ||
    (fileName !== undefined &&
      !base64Image &&
      filesManager.isFileArchived(fileName!))

  return (
    // 36px - titlebar height
    // 24px - statusbar height
    <div className="chat-window flex-no-wrap flex h-[calc(100vh-36px-24px)] flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <Header models={availableModels} fileName={fileName} />

      {/* Possible states */}
      {/* fileName && messages.length === 0 - chat with filename */}
      {/* fileName && messages.length !== 0 - thread filename, no messages */}
      {/* image && messages.length === 0 - ephemeral image, no messages */}
      {/* image && messages.length !== 0 - ephemeral image, messages */}
      {/* draggedOver - dragging a file */}
      {/* messages.length === 0 && !fileName - no messages, no thread filename */}

      {messages.length === 0 && !fileName ? (
        <div
          ref={setTargetElement}
          className={cn(
            'flex h-screen flex-col items-center justify-center gap-2',
            draggedOver ? 'm-4 cursor-copy rounded border-2 border-dashed' : '',
          )}
        >
          {!selectedFile && (
            <>
              <StatusIndicatorText
                text={
                  draggedOver
                    ? 'Drop your file here'
                    : supportsImages
                      ? 'Say something, drop a PDF, or drop an image to get started'
                      : 'Say something or drop a PDF to get started'
                }
              />

              <input
                ref={fileInputRef}
                className="hidden"
                title="drop a pdf"
                type="file"
                onChange={handleFilesChange}
                accept={fileTypes.join(',')}
                multiple={false}
              />
            </>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'grid h-full overflow-hidden py-0',
            fileName ? 'grid-rows-[min-content,_1fr]' : 'grid-rows-1',
          )}
        >
          {base64Image ? (
            <div className="flex h-20 w-full items-center border-b px-2 text-xs">
              <span>Current image:</span>&nbsp;
              <img src={base64Image} className="h-full p-1" />
              <Button
                variant="iconButton"
                size="sm"
                className="ml-2"
                onClick={() => {
                  setBase64Image(null)
                  setSelectedFile(null)
                }}
              >
                <LucideTrash2 size={14} />
              </Button>
            </div>
          ) : null}

          {fileName && !base64Image ? (
            <div className="flex h-8 w-full items-center border-b px-2 text-xs">
              <span>Current file:</span>&nbsp;
              <span
                className="cursor-copy font-bold"
                onClick={() => {
                  window.files.openPath(currentThreadFilePath!)
                }}
              >
                {fileName}
              </span>
              {filesManager.isFileArchived(fileName!) && !runningEmbeddings && (
                <span className="ml-1">(removed)</span>
              )}
            </div>
          ) : null}

          {fileName && messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              {runningEmbeddings && selectedFile ? (
                <StatusIndicatorText
                  text={`Processing ${selectedFile.name}`}
                  className="cursor-progress"
                  spinner
                />
              ) : (
                <StatusIndicatorText text={`Chat with ${fileName}`} />
              )}
            </div>
          )}

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

      <div className="relative flex h-fit items-center p-4 pt-2">
        {isCurrentThreadGenerating ? (
          <div className="absolute left-0 z-10 mb-2 flex h-fit w-full -translate-y-16 items-center justify-center">
            <Button size="sm" onClick={handleAbort}>
              <LucideStopCircle size={14} className="mr-2" />
              <span className="select-none">Stop generating</span>
            </Button>
          </div>
        ) : null}

        <form
          className="relative w-full overflow-hidden rounded-md border border-input"
          onSubmit={handleFormSubmit}
          onChange={handleFormChange}
          ref={formRef}
        >
          <Textarea
            name="message"
            ref={textAreaInputRef}
            className="relative flex min-h-[40px] w-full flex-1 resize-none bg-background p-2 px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            tabIndex={0}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Say something..."
            spellCheck={false}
            disabled={isFormDisabled}
          />
          <div
            className="flex cursor-text items-center justify-end gap-1 p-2"
            onClick={handleFormClick}
          >
            {messages.length === 0 && (
              <Button
                variant="iconButton"
                size="sm"
                type="button"
                disabled={isFormDisabled}
                onClick={handleFilesAttach}
              >
                <LucidePaperclip className="h-4 w-4 cursor-pointer text-muted-foreground" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="group hover:bg-transparent"
              type="submit"
              disabled={isFormDisabled || !hasMessage}
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
