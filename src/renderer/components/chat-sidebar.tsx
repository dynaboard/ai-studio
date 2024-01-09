import { motion } from 'framer-motion'
import { LucidePlusCircle, LucideTrash } from 'lucide-react'
import React from 'react'
import { NodeRendererProps, Tree } from 'react-arborist'
import { Link, useMatches, useNavigate } from 'react-router-dom'
import { useValue } from 'signia-react'
import useResizeObserver from 'use-resize-observer'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  DEFAULT_TEMP,
  DEFAULT_TOP_P,
  useChatManager,
  useCurrentThreadID,
} from '@/providers/chat/manager'
import {
  useHistoryManager,
  useThreadMessages,
} from '@/providers/history/manager'
import { Thread } from '@/providers/history/types'

export function ThreadsSidebar() {
  const historyManager = useHistoryManager()
  const chatManager = useChatManager()
  const navigate = useNavigate()

  const { ref, height } = useResizeObserver()

  const history = useValue('history', () => historyManager.threads, [
    historyManager,
  ])

  return (
    <div className="threads-sidebar flex h-full flex-col gap-2 p-2">
      <div className="flex w-full items-center gap-2">
        <Button
          size="sm"
          className="w-full"
          onClick={() => {
            if (!chatManager.model) {
              console.error('Cannot add a thread when a model is not selected')
              return
            }

            const newThread = historyManager.addThread({
              modelID: chatManager.model,
              title: 'New Thread',
              createdAt: new Date(),
              messages: [],
              temperature: DEFAULT_TEMP,
              topP: DEFAULT_TOP_P,
              systemPrompt: 'You are a helpful assistant.',
            })

            navigate(`/chats/${newThread.id}`)
          }}
        >
          <LucidePlusCircle size={14} className="mr-2" />
          <span className="select-none">New Thread</span>
        </Button>
      </div>
      <div className="group flex-1" ref={ref}>
        <Tree
          className="scrollbar"
          data={history}
          width="100%"
          height={height}
          rowHeight={30}
          onMove={({ dragIds, index }) => {
            historyManager.moveThreads(dragIds, index)
          }}
          onRename={({ id, name }) => {
            if (name.trim().length === 0) {
              return
            }
            historyManager.renameThread(id, name)
          }}
          renderCursor={Cursor}
        >
          {Node}
        </Tree>
      </div>
    </div>
  )
}

const Cursor = React.memo(function Cursor({
  left,
  top,
  indent,
}: {
  left: number
  top: number
  indent: number
}) {
  return (
    <motion.div
      className="pointer-events-none absolute z-10 h-[2px] w-full bg-primary"
      style={{
        left,
        top,
        right: indent,
      }}
    />
  )
})

function Node({ node, style, dragHandle }: NodeRendererProps<Thread>) {
  const historyManager = useHistoryManager()
  const chatManager = useChatManager()
  const currentThreadID = useCurrentThreadID()
  const navigate = useNavigate()

  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const messages = useThreadMessages(currentThreadID)
  const haveMessages = messages.length > 0

  const matches = useMatches()
  const active = matches[matches.length - 1]?.id === 'thread'

  const deleteThread = async (event: React.MouseEvent) => {
    event.preventDefault()

    const firstThread = historyManager.threads.find(
      (t) => t.id !== node.data.id,
    )
    await chatManager.cleanupChatSession(node.data.id)
    historyManager.deleteThread(node.data.id)
    navigate(`/chats/${firstThread?.id ?? ''}`, {
      replace: true,
    })
  }

  return (
    <>
      <div
        ref={dragHandle}
        style={style}
        className={cn(
          'group/node h-full items-center justify-between gap-2 rounded leading-3 transition hover:bg-secondary',
          currentThreadID === node.data.id && active
            ? 'bg-secondary outline outline-1 -outline-offset-1 outline-border'
            : null,
        )}
        onDoubleClickCapture={(event) => {
          event.preventDefault()
          node.edit()
        }}
      >
        {node.isEditing ? (
          <form
            target="_blank"
            className="h-full w-full p-0.5"
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              node.submit(formData.get('title') as string)
            }}
          >
            <Input
              name="title"
              className="h-full w-full px-[5px] py-0 leading-3"
              autoFocus
              placeholder={node.data.title}
              onBlur={(e) =>
                e.currentTarget.value.trim().length > 0
                  ? node.submit(e.currentTarget.value)
                  : node.reset()
              }
              onKeyDown={(e) => e.key === 'Escape' && node.reset()}
            />
          </form>
        ) : (
          <Link
            to={`/chats/${node.data.id}`}
            className="grid h-full group-hover/node:grid-cols-[minmax(0,1fr),_24px]"
          >
            <div className="h-full overflow-hidden truncate px-2">
              <span className="text-sm leading-[30px]">{node.data.title}</span>
            </div>
            <div className="flex h-full items-center">
              <Button
                variant="iconButton"
                className="hidden h-full w-0 p-0 hover:text-destructive group-hover/node:block group-hover/node:w-auto"
                onClick={async (e) => {
                  if (!haveMessages) {
                    await deleteThread(e)
                  } else {
                    setShowDeleteDialog(true)
                  }
                }}
              >
                <LucideTrash size={14} />
              </Button>
            </div>
          </Link>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this thread?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will also delete all messages
              in this thread.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={deleteThread}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
