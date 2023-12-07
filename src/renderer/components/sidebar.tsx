import {
  LucideFileBox,
  LucideFiles,
  LucideIcon,
  LucideMessageCircle,
  LucideWrench,
} from 'lucide-react'
import React from 'react'
import { Link as BaseLink, useMatches } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEmbeddingsMeta } from '@/providers/files/manager'

function Link({
  icon: Icon,
  children,
  ...props
}: { icon: LucideIcon } & React.ComponentProps<typeof BaseLink>) {
  const matches = useMatches()
  const active = matches[matches.length - 1]?.pathname === props.to

  return (
    <BaseLink
      className={cn(
        buttonVariants({
          variant: 'ghost',
        }),
        'h-8 w-full justify-start gap-x-3',
        active ? 'bg-accent' : '',
      )}
      {...props}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {children}
    </BaseLink>
  )
}

export function Sidebar() {
  const files = useEmbeddingsMeta()

  const haveFiles = files.length > 0

  return (
    <nav className="h-full w-full">
      <div className={cn('space-y-[1px] p-2')}>
        <Link to="/chats" icon={LucideMessageCircle}>
          <span className="select-none">Chats</span>
        </Link>
        <Link to="/models" icon={LucideFileBox}>
          <span className="select-none">Models</span>
        </Link>
        <Link to="/tools" icon={LucideWrench}>
          <span className="select-none">Tools</span>
        </Link>
        {/* TODO: can remove when we allow indexing files in the Files tab */}
        {haveFiles ? (
          <Link to="/files" icon={LucideFiles}>
            <span className="select-none">Files</span>
          </Link>
        ) : (
          <></>
        )}
      </div>
    </nav>
  )
}
