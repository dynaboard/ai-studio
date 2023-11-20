import { motion } from 'framer-motion'
import { LucideFileBox, LucideIcon, LucideMessageCircle } from 'lucide-react'
import React from 'react'
import { Link as BaseLink, useMatches } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

export function Sidebar({ open }: { open: boolean }) {
  return (
    <motion.div
      className="h-full w-[220px]"
      initial={{
        width: '220px',
      }}
      animate={{
        width: open ? '220px' : '52px',
      }}
      transition={{ ease: [0.165, 0.84, 0.44, 1] }}
    >
      {/* <div
        className={cn(
          'flex h-16 items-center border-r px-2',
          !open ? 'hidden' : undefined,
        )}
      >
        <strong key="title" className="text-bold flex-1 overflow-hidden">
          Playground
        </strong>
      </div> */}
      <nav className="h-full w-full border-r" data-menu-open={open}>
        <div className={cn('space-y-[1px] p-2', !open ? 'p-0' : '')}>
          <Link to="/chats" icon={LucideMessageCircle}>
            <span className={cn(!open ? 'hidden' : undefined)}>Chats</span>
          </Link>
          <Link to="/models" icon={LucideFileBox}>
            <span className={cn(!open ? 'hidden' : undefined)}>Models</span>
          </Link>
        </div>
      </nav>
    </motion.div>
  )
}
