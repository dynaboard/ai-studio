import { LucideMessageSquarePlus, LucideTrash } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { DEFAULT_TEMP, DEFAULT_TOP_P } from '@/providers/chat/manager'
import { useEmbeddingsMeta, useFilesManager } from '@/providers/files/manager'
import { useHistoryManager } from '@/providers/history/manager'
import { DEFAULT_MODEL } from '@/providers/models/manager'

export function FilesList() {
  const historyManager = useHistoryManager()
  const filesManager = useFilesManager()
  const navigate = useNavigate()
  const files = useEmbeddingsMeta()

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
                      {file.path ? (
                        <span
                          className={cn(
                            'inline-flex h-5 cursor-copy items-center rounded border border-neutral-200 bg-neutral-50 p-[1px] font-mono text-xs leading-7 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100',
                          )}
                          onClick={() => {
                            window.files.openPath(file.path)
                          }}
                        >
                          {file.path}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {file.path && (
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
                      )}
                    </TableCell>
                    <TableCell>
                      <LucideTrash
                        className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-red-600"
                        onClick={() => {
                          filesManager.deleteFile(`${file.name}-index`)
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        // 24px statusbar
        // 36px titlebar
        <div className="flex h-[calc(100vh-24px-36px)] flex-col items-center justify-center">
          <span className="text-md inline-flex select-none items-center font-medium text-muted-foreground">
            No files
          </span>
        </div>
      )}
    </div>
  )
}
