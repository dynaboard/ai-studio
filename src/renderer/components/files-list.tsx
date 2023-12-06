import { LucideMessageSquarePlus, LucideTrash } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DEFAULT_TEMP, DEFAULT_TOP_P } from '@/providers/chat/manager'
import { useAvailableFiles, useFilesManager } from '@/providers/files/manager'
import { useHistoryManager } from '@/providers/history/manager'
import { DEFAULT_MODEL } from '@/providers/models/manager'

import { Button } from './ui/button'

export function FilesList() {
  const historyManager = useHistoryManager()
  const filesManager = useFilesManager()
  const navigate = useNavigate()
  const files = useAvailableFiles()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <div className="grid h-[calc(100vh-36px)] grid-cols-1">
      {files.length > 0 ? (
        <>
          <div className="sticky top-0 z-50 border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <h1 className="mb-1 mt-2 text-left text-xl font-bold leading-tight tracking-tighter md:block md:text-2xl lg:leading-[1.1]">
              Files
            </h1>
            <span className="sm:text-md text-md prose text-left text-muted-foreground">
              Start a new thread from an existing file.
            </span>
          </div>
          <div className="h-screen overflow-hidden">
            <Table>
              <TableCaption className="sr-only">
                A list of your recent invoices.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Name</TableHead>
                  <TableHead>Path</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex h-5 items-center rounded border border-neutral-200 bg-neutral-50 p-[1px] font-mono text-xs leading-7 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
                        {file.path}
                      </span>
                    </TableCell>
                    <TableCell>
                      <LucideMessageSquarePlus
                        className="h-5 w-5 cursor-pointer text-muted-foreground"
                        onClick={() => {
                          const newThread = historyManager.addThread({
                            modelID: DEFAULT_MODEL,
                            title: 'New Thread',
                            createdAt: new Date(),
                            messages: [],
                            temperature: DEFAULT_TEMP,
                            topP: DEFAULT_TOP_P,
                            systemPrompt: 'You are a helpful assistant.',
                            filePath: file.path,
                          })

                          navigate(`/chats/${newThread.id}`)
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <AlertDialog open={showDeleteDialog}>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="iconButton"
                            className="block p-0 hover:text-destructive"
                            onClick={() => {
                              setShowDeleteDialog(true)
                            }}
                          >
                            <LucideTrash className="h-5 w-5 text-muted-foreground hover:text-red-600" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you sure absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This index will no
                              longer be accessible by you.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => {
                                setShowDeleteDialog(false)
                              }}
                            >
                              Cancel
                            </AlertDialogCancel>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                const fileIndexName = `${file.name}-index`
                                filesManager.deleteFile(fileIndexName)
                                setShowDeleteDialog(false)
                              }}
                            >
                              Delete
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        // 23px statusbar
        // 36px titlebar
        <div className="flex h-[calc(100vh-23px-36px)] flex-col items-center justify-center">
          <span className="text-md inline-flex select-none items-center font-medium text-muted-foreground">
            No files
          </span>
        </div>
      )}
    </div>
  )
}
