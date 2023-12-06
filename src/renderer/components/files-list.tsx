import { LucideMessageSquarePlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { DEFAULT_TEMP, DEFAULT_TOP_P } from '@/providers/chat/manager'
import { useAvailableFiles } from '@/providers/files/manager'
import { useHistoryManager } from '@/providers/history/manager'
import { DEFAULT_MODEL } from '@/providers/models/manager'

import { Label } from './ui/label'
import { ScrollArea } from './ui/scroll-area'

export function FilesList() {
  const historyManager = useHistoryManager()
  const navigate = useNavigate()
  const files = useAvailableFiles()

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
            <ScrollArea className="h-full">
              <div className="mx-auto flex h-screen flex-1 flex-col gap-4 bg-slate-50 p-4 dark:bg-slate-900">
                {files.map((file) => {
                  return (
                    <div
                      key={file.name}
                      className="flex h-32 cursor-pointer grid-rows-1 flex-col items-center justify-center gap-4 rounded-lg border bg-card text-card-foreground shadow-sm"
                      onClick={() => {
                        const newThread = historyManager.addThread({
                          modelID: DEFAULT_MODEL,
                          title: 'New Thread',
                          createdAt: new Date(),
                          messages: [],
                          temperature: DEFAULT_TEMP,
                          topP: DEFAULT_TOP_P,
                          systemPrompt: 'You are a helpful assistant.',
                          // TODO: create a new file called embeddings.json then write the filePath to the file
                          filePath:
                            '/Users/cyrusgoh/Desktop/PDF/Toolformer.pdf',
                        })

                        navigate(`/chats/${newThread.id}`)
                      }}
                    >
                      <Label className="text-lg font-semibold leading-none tracking-tight">
                        {file.name}
                      </Label>
                      <LucideMessageSquarePlus className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
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
