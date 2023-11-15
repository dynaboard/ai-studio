import { motion } from 'framer-motion'
import { LucideFileBox, LucideHome, LucideIcon, LucideMenu } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { Link as BaseLink, useMatches } from 'react-router-dom'

import { Button } from '@/components/ui/button'
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
        'flex items-center gap-x-3 rounded-md px-4 py-2 text-sm font-semibold leading-6 hover:bg-secondary',
        active ? 'text-primary' : '',
      )}
      {...props}
    >
      <Icon size={16} className="h-6 shrink-0" aria-hidden="true" />
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
    >
      <div className="flex h-16 items-center gap-2 border-r p-2">
        <Button
          size="sm"
          variant="iconButton"
          className="p-2"
          onClick={() => setOpen(!open)}
        >
          <LucideMenu size={16} />
        </Button>

        <strong key="title" className="text-bold flex-1 overflow-hidden">
          Playground
        </strong>
      </div>
      <nav className="h-full w-full border-r" data-menu-open={open}>
        <ul>
          <li>
            <Link to="/" icon={LucideHome}>
              <span className={!open ? 'hidden' : undefined}>Home</span>
            </Link>
          </li>
          <li>
            <Link to="/models" icon={LucideFileBox}>
              <span className={!open ? 'hidden' : undefined}>Models</span>
            </Link>
          </li>
        </ul>
      </nav>
    </motion.div>
  )
}
