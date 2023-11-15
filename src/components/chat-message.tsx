import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '@/lib/utils'
import { useMessage } from '@/providers/history/manager'

import { CodeBlock } from './codeblock'
import { MemoizedReactMarkdown } from './markdown'

export function ChatMessage({ messageID }: { messageID: string }) {
  const possibleMessage = useMessage(messageID)
  const message = possibleMessage.value

  if (!message) {
    return null
  }

  return (
    <div className="mb-4 flex flex-col">
      <span className="text-muted-foreground text-xs">
        {message.role === 'user' ? 'You' : 'Assistant'}
      </span>
      <MemoizedReactMarkdown
        className="markdown prose prose-p:text-gray-900 prose-pre:bg-transparent prose-pre:p-0 prose-ol:text-gray-900 prose-ul:text-gray-900 prose-li:text-gray-900 max-w-none text-sm"
        remarkPlugins={[remarkGfm, remarkMath]}
        components={{
          p({ children }) {
            return <p className="mb-2 leading-relaxed last:mb-0">{children}</p>
          },
          code({ inline, className, children, ...props }) {
            if (children.length) {
              if (children[0] == '▍') {
                return (
                  <span className="mt-1 animate-pulse cursor-default">▍</span>
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
        {message.message}
      </MemoizedReactMarkdown>
    </div>
  )
}
