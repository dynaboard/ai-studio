import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '@/lib/utils'
import { Message } from '@/providers/chat-window'

import { CodeBlock } from './codeblock'
import { MemoizedReactMarkdown } from './markdown'

export function ChatMessage({ message }: { message: Message }) {
  return (
    <div className="mb-4 flex flex-col">
      <span className="text-xs text-muted-foreground">
        {message.role === 'user' ? 'You' : 'Assistant'}
      </span>
      <MemoizedReactMarkdown
        className="markdown prose prose-neutral dark:prose-invert w-full break-words text-sm"
        remarkPlugins={[remarkGfm, remarkMath]}
        components={{
          p({ children }) {
            return <p className="my-2 first:mt-0 last:mb-0">{children}</p>
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
                  'inline-flex items-center rounded border border-neutral-200 bg-neutral-50 p-1 text-xs leading-4 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100',
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
