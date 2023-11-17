import { Check, Clipboard } from 'lucide-react'
import { FC, memo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'

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
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        PreTag="div"
        customStyle={{ margin: 0 }}
      >
        {value}
      </SyntaxHighlighter>

      <div className="relative flex items-center justify-between">
        <div className="mt-2 flex items-center">
          {isCopied ? (
            <Check className="h-3 w-3 text-muted-foreground/80" />
          ) : (
            <Clipboard
              className="h-3 w-3 cursor-pointer text-muted-foreground/80"
              onClick={onCopy}
            />
          )}
          <span className="sr-only">Copy code</span>
        </div>
      </div>
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'
