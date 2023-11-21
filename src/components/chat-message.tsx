import {
  LucideBot,
  LucideCopy,
  LucidePencil,
  LucideTrash2,
  LucideUser2,
} from 'lucide-react'
import React from 'react'
import ReactDOM from 'react-dom'
import Textarea from 'react-textarea-autosize'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { cn } from '@/lib/utils'
import { useCurrentThreadID } from '@/providers/chat/manager'
import { useHistoryManager, useMessage } from '@/providers/history/manager'

import { CodeBlock } from './codeblock'
import { MemoizedReactMarkdown } from './markdown'

export function ChatMessage({ messageID }: { messageID: string }) {
  const historyManager = useHistoryManager()
  const possibleMessage = useMessage(messageID)
  const currentThreadID = useCurrentThreadID()

  const [editing, setEditing] = React.useState(false)

  const { isCopied, copyToClipboard } = useCopyToClipboard({
    timeout: 1000,
  })

  const { formRef, onKeyDown } = useEnterSubmit({
    onKeyDown(event) {
      if (event.key === 'Escape') {
        setEditing(false)
      }
    },
  })

  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  const message = possibleMessage.value

  if (!message || !currentThreadID) {
    return null
  }

  return (
    <div className="grid-cols group mb-1 grid grid-cols-[24px,1fr] gap-3 px-4 py-2 first:pt-4 hover:bg-secondary/75">
      <div className="mt-[3px]">
        <span className="bg-secondary text-xs text-muted-foreground">
          {message.role === 'user' ? (
            <LucideUser2 size={18} />
          ) : (
            <LucideBot size={18} />
          )}
        </span>
      </div>
      <div className=" grid grid-rows-[min-content,_16px]">
        <div className="flex flex-col">
          {editing ? (
            <form
              ref={formRef}
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                if (formData.has('message')) {
                  const message = formData.get('message') as string
                  if (message.trim().length > 0) {
                    historyManager.editMessage({
                      threadID: currentThreadID,
                      messageID: messageID,
                      contents: message,
                    })
                  }
                }
                setEditing(false)
              }}
            >
              <Textarea
                name="message"
                ref={inputRef}
                className="mb-1 flex min-h-[60px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                tabIndex={0}
                onKeyDown={onKeyDown}
                rows={1}
                spellCheck={false}
              />
            </form>
          ) : (
            <MemoizedReactMarkdown
              className="markdown prose max-w-none text-sm prose-p:text-gray-900 prose-pre:bg-transparent prose-pre:p-0 prose-ol:text-gray-900 prose-ul:text-gray-900 prose-li:text-gray-900"
              remarkPlugins={[remarkGfm, remarkMath]}
              components={{
                p({ children }) {
                  return (
                    <p className="mb-2 leading-relaxed last:mb-0">{children}</p>
                  )
                },
                code({ inline, className, children, ...props }) {
                  if (children.length) {
                    if (children[0] == '▍') {
                      return (
                        <span className="mt-1 animate-pulse cursor-default">
                          ▍
                        </span>
                      )
                    }

                    children[0] = (children[0] as string).replace('`▍`', '▍')
                  }

                  const match = /language-(\w+)/.exec(className || '')
                  const value = String(children).replace(/\n$/, '')

                  return !inline ? (
                    <CodeBlock
                      key={Math.random()}
                      language={(match && match[1]) || ''}
                      value={value}
                      {...props}
                    />
                  ) : (
                    <code
                      className={cn(
                        className,
                        'inline-flex h-5 items-center rounded border border-neutral-200 bg-neutral-50 p-[1px] text-xs leading-7 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100',
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
              }}
            >
              {message.role === 'assistant' && message.state === 'pending'
                ? 'Thinking...'
                : message.message}
            </MemoizedReactMarkdown>
          )}
        </div>
        <div
          className={cn(
            'flex gap-2 opacity-0',
            editing ? 'opacity-100' : 'group-hover:opacity-100',
          )}
        >
          {editing ? (
            <span className="text-xs text-muted-foreground">
              Submit new message using Enter
            </span>
          ) : (
            <MessageControls
              isCopied={isCopied}
              onEdit={() => {
                // we can avoid a useEffect
                ReactDOM.flushSync(() => {
                  setEditing(true)
                })

                if (inputRef.current) {
                  inputRef.current.value = message.message
                  inputRef.current?.focus()
                }
              }}
              onDelete={() =>
                historyManager.deleteMessage({
                  threadID: currentThreadID,
                  messageID,
                })
              }
              onCopy={() => {
                copyToClipboard(message.message)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function MessageControls({
  isCopied,
  onEdit,
  onDelete,
  onCopy,
}: {
  isCopied: boolean
  onEdit: () => void
  onDelete: () => void
  onCopy: () => void
}) {
  return (
    <TooltipProvider>
      <MessageControlTooltip description="Edit">
        <Button
          variant="iconButton"
          className="h-4 p-0 text-muted-foreground"
          onClick={onEdit}
        >
          <LucidePencil size={14} />
        </Button>
      </MessageControlTooltip>
      <MessageControlTooltip description="Delete">
        <Button
          variant="iconButton"
          className="h-4 p-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <LucideTrash2 size={14} />
        </Button>
      </MessageControlTooltip>
      <MessageControlTooltip
        open={isCopied}
        description={isCopied ? 'Copied' : 'Copy'}
      >
        <Button
          variant="iconButton"
          className="h-4 p-0 text-muted-foreground"
          onClick={onCopy}
        >
          <LucideCopy size={14} />
        </Button>
      </MessageControlTooltip>
    </TooltipProvider>
  )
}

function MessageControlTooltip({
  description,
  children,
  open,
}: {
  description: string
  children: React.ReactNode
  open?: boolean
}) {
  return (
    <Tooltip open={open} delayDuration={300}>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent side="bottom">
        <span>{description}</span>
      </TooltipContent>
    </Tooltip>
  )
}
