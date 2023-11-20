import { motion } from 'framer-motion'
import {
  LucideFileBox,
  LucideIcon,
  LucideMenu,
  LucideMessageCircle,
} from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { Link as BaseLink, useMatches } from 'react-router-dom'

import { Button, buttonVariants } from '@/components/ui/button'
import { useMatchMediaEffect } from '@/lib/hooks/use-match-media'
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

export function Sidebar() {
  const [open, setOpen] = useState(false)

  useMatchMediaEffect(
    '(min-width: 768px)',
    useCallback((matches) => {
      if (matches) {
        setOpen(true)
      } else {
        setOpen(false)
      }
    }, []),
  )

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
      <div className="flex h-16 items-center gap-2 border-r px-2">
        <Button
          size="sm"
          variant="iconButton"
          className="p-2"
          onClick={() => setOpen(!open)}
        >
          <LucideMenu className="h-4 w-4" />
        </Button>

        <strong key="title" className="text-bold flex-1 overflow-hidden">
          Playground
        </strong>
      </div>
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
