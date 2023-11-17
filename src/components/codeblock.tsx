import { Check, Copy } from 'lucide-react'
import { FC, memo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

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
    <div className="codeblock relative my-3 w-full font-sans text-xs">
      {/* rgb(40, 44, 52) is from the default SyntaxHighlighter's bg */}
      <div className="relative flex h-10 items-center justify-between rounded-t-md bg-zinc-800 px-4 py-2 font-sans text-xs text-zinc-100">
        <span className="text-xs lowercase">{language}</span>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="text-xs hover:bg-inherit hover:text-muted-foreground focus-visible:ring-1 focus-visible:ring-slate-700 focus-visible:ring-offset-0"
            onClick={onCopy}
          >
            {isCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copy code</span>
          </Button>
        </div>
      </div>

      <SyntaxHighlighter
        language={language}
        style={oneDark}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius:
            // Essentially `.rounded-b-md`
            '0 0 calc(var(--radius) - 2px) calc(var(--radius) - 2px)',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'
