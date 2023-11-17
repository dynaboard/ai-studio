import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '@/lib/utils'
import { Message } from '@/providers/chat/types'

import { CodeBlock } from './codeblock'
import { MemoizedReactMarkdown } from './markdown'

export function ChatMessage({ message }: { message: Message }) {
  return (
    <div className="mb-4 flex flex-col">
      <span className="text-xs text-muted-foreground">
        {message.role === 'user' ? 'You' : 'Assistant'}
      </span>
      <MemoizedReactMarkdown
        className="markdown prose dark:prose-invert flex-1 text-xs"
        remarkPlugins={[remarkGfm, remarkMath]}
        components={{
          p({ children }) {
            return <p className="mb-2 text-xs last:mb-0">{children}</p>
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
              <code className={cn(className, 'text-xs')} {...props}>
                {children}
              </code>
            )
          },
          table({ children }) {
            return (
              <table className="border-collapse border border-black px-3 py-1 dark:border-white">
                {children}
              </table>
            )
          },
          th({ children }) {
            return (
              <th className="break-words border border-black bg-gray-500 px-3 py-1 text-white dark:border-white">
                {children}
              </th>
            )
          },
          td({ children }) {
            return (
              <td className="break-words border border-black px-3 py-1 dark:border-white">
                {children}
              </td>
            )
          },
          ol({ children }) {
            return <ol className="list-decimal pl-4">{children}</ol>
          },
          ul({ children }) {
            return <ul className="list-disc pl-4">{children}</ul>
          },
          li({ children }) {
            return <li className="list-inside pb-2">{children}</li>
          },
          h1({ children }) {
            return <h1 className="mb-2 mt-4 text-3xl font-bold">{children}</h1>
          },
          h2({ children }) {
            return (
              <h2 className="mb-2 mt-3 text-2xl font-semibold">{children}</h2>
            )
          },
          h3({ children }) {
            return (
              <h3 className="mb-1 mt-2 text-xl font-semibold">{children}</h3>
            )
          },
          h4({ children }) {
            return (
              <h4 className="mb-1 mt-2 text-lg font-semibold">{children}</h4>
            )
          },
          h5({ children }) {
            return (
              <h5 className="text-md mb-1 mt-2 font-semibold">{children}</h5>
            )
          },
          h6({ children }) {
            return (
              <h6 className="mb-1 mt-2 text-sm font-semibold">{children}</h6>
            )
          },
        }}
      >
        {message.message}
      </MemoizedReactMarkdown>
    </div>
  )
}
