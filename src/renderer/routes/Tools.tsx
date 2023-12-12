import { MODELS } from '@shared/model-list'
import { LucideArrowRightCircle } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { DEFAULT_TEMP, DEFAULT_TOP_P } from '@/providers/chat/manager'
import { useHistoryManager } from '@/providers/history/manager'
import {
  DEFAULT_MODEL,
  useAvailableModels,
  useDownloads,
  useModelManager,
} from '@/providers/models/manager'
import { useIsSidebarClosed } from '@/providers/sidebar'
import { useAllTools } from '@/providers/tools/manager'
import { BaseTool } from '@/tools/base'

function getModelFiles(modelName: string) {
  return MODELS.find((model) => model.name === modelName)?.files
}

export function ToolsPage() {
  const allTools = useAllTools()
  const historyManager = useHistoryManager()
  const navigate = useNavigate()
  const isClosed = useIsSidebarClosed()

  const [selectedTools, setSelectedTools] = useState<string[]>([])

  return (
    // 36px titlebar height
    <div className="tool-page grid h-[calc(100vh-36px)] grid-cols-1 grid-rows-[min-content,_1fr]">
      <div className="sticky top-0 z-50 border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="mb-1 mt-2 text-left text-xl font-bold leading-tight tracking-tighter md:block md:text-2xl lg:leading-[1.1]">
          Tools
        </h1>
        <span className="sm:text-md text-md prose text-left text-muted-foreground">
          Choose your tools to augment the abilities of your AI assistant,
          providing a natural language interface to a variety of tasks.
        </span>
      </div>
      <div className="h-full overflow-hidden bg-slate-50 dark:bg-slate-900">
        <ScrollArea className="h-full">
          <div className="grid h-full grid-flow-row grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3">
            {allTools.map((tool) => {
              return (
                <ToolEntry
                  key={tool.id}
                  tool={tool}
                  selectedTools={selectedTools}
                  setSelectedTools={setSelectedTools}
                />
              )
            })}
          </div>
          {selectedTools.length > 0 && (
            <div
              className={cn(
                'group fixed bottom-10 z-50 m-auto flex  items-center justify-center',
                isClosed ? 'w-full' : 'w-[calc(100%-175px)]',
              )}
            >
              <Button
                className="rounded-3xl drop-shadow-md"
                onClick={() => {
                  const newThread = historyManager.addThread({
                    modelID: DEFAULT_MODEL,
                    title: 'New Thread',
                    createdAt: new Date(),
                    messages: [],
                    temperature: DEFAULT_TEMP,
                    topP: DEFAULT_TOP_P,
                    systemPrompt: 'You are a helpful assistant.',
                    activeToolIDs: selectedTools,
                  })

                  navigate(`/chats/${newThread.id}`)
                }}
              >
                Start chat with {selectedTools.length}{' '}
                {selectedTools.length > 1 ? 'tools' : 'tool'}
                <LucideArrowRightCircle className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

function ToolEntry({
  tool,
  selectedTools,
  setSelectedTools,
}: {
  tool: BaseTool
  selectedTools: string[]
  setSelectedTools: (tools: string[]) => void
}) {
  const localModels = useAvailableModels()
  const modelManager = useModelManager()
  const downloads = useDownloads()

  const [confirmDialog, setConfirmDialog] = useState<boolean>(false)

  const modelData = useMemo(() => {
    const model = modelManager.allModels.find((modelData) => {
      return modelData.name === tool.requiredModels[0]
    })

    return model
  }, [modelManager.allModels, tool.requiredModels])

  const isDownloading = downloads.some(
    (download) =>
      modelData?.files.some((file) => file.name === download.filename),
  )

  const hasRequiredToolModel = useMemo(
    () =>
      tool.requiredModels.every((modelName) =>
        localModels.some((model) => model.name === modelName),
      ),
    [tool.requiredModels, localModels],
  )

  // Assuming there's only 1 model for now and downloading the first file's url
  const firstRequiredModel = getModelFiles(tool.requiredModels[0])
  const firstFile = hasRequiredToolModel ? null : firstRequiredModel?.[0]

  const handleToolClick = useCallback(() => {
    if (!hasRequiredToolModel) {
      setConfirmDialog(true)
    } else {
      const newSelectedTools = selectedTools.includes(tool.id)
        ? selectedTools.filter((selectedTool) => selectedTool !== tool.id)
        : [...selectedTools, tool.id]

      setSelectedTools(newSelectedTools)
    }
  }, [selectedTools, setSelectedTools, tool, hasRequiredToolModel])

  const handleDownloadClick = useCallback(
    (e) => {
      e.stopPropagation()

      if (firstFile) {
        const anchorEl = document.createElement('a')
        anchorEl.href = firstFile.url as string
        anchorEl.download = firstFile.name as string
        document.body.appendChild(anchorEl)
        anchorEl.addEventListener('click', (e) => {
          e.stopPropagation()
        })
        anchorEl.click()

        // eslint-disable-next-line no-console
        console.log('Downloading model file: ', firstFile.url)
      }

      setConfirmDialog(false)
    },
    [firstFile, setConfirmDialog],
  )

  return (
    <div
      key={tool.id}
      className={cn(
        'flex min-h-[7rem] flex-col justify-between gap-1 rounded-lg border-2 bg-card p-3 text-card-foreground shadow-sm transition-all',
        selectedTools.includes(tool.id) ? 'border-primary' : 'cursor-pointer',
        !hasRequiredToolModel || isDownloading ? 'border-dashed' : '',
        isDownloading ? 'cursor-not-allowed select-none' : '',
      )}
      onClick={isDownloading ? undefined : handleToolClick}
    >
      <div>
        <Label className="font-semibold leading-none tracking-tight">
          {tool.name}
        </Label>
        <p className="truncate text-xs leading-normal text-muted-foreground">
          {tool.longDescription ?? tool.description}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        {tool.requiredModels.map((model, _idx) => {
          return (
            <Badge key={model} variant="outline" className="w-fit">
              {model}
            </Badge>
          )
        })}
      </div>

      <AlertDialog open={confirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm</AlertDialogTitle>
            <AlertDialogDescription>
              This tool requires the following model(s):{' '}
              {tool.requiredModels.join(', ')}. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={(e) => {
                e.stopPropagation()
                setConfirmDialog(false)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <Button variant="default" onClick={handleDownloadClick}>
              Download
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
