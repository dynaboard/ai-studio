import { Check, Clipboard } from 'lucide-react'
import { FC, memo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'

import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'

import { Button } from './ui/button'

interface Props {
  language: string
  value: string
}

export const CodeBlock: FC<Props> = memo(({ language, value }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })

  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(value)
  }

  return (
    <div className="codeblock group relative my-3 w-full font-sans text-xs">
      <div className="relative flex items-center justify-between">
        <div className="mt-2 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-2 text-xs text-muted-foreground opacity-0 hover:bg-inherit hover:text-gray-900 focus-visible:ring-1 focus-visible:ring-slate-700 focus-visible:ring-offset-0 group-hover:opacity-100"
            onClick={onCopy}
          >
            {isCopied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Clipboard className="h-3 w-3 cursor-pointer" onClick={onCopy} />
            )}
            <span className="sr-only">Copy code</span>
          </Button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: 'var(--radius)' }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'
