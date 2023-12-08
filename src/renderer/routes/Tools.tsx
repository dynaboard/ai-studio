import { ModelFile, MODELS } from '@shared/model-list'
import { LucideArrowRightCircle } from 'lucide-react'
import { useCallback, useState } from 'react'

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
import { useIsLeftSidebarOpen } from '@/providers/browser-window'
import { useAvailableModels, useDownloads } from '@/providers/models/manager'
import { useAllTools } from '@/providers/tools/manager'
import { BaseTool } from '@/tools/base'

function getModelFile(modelName: string) {
  let modelFile: ModelFile | undefined
  MODELS.forEach((m) => (modelFile = m.files.find((f) => f.name === modelName)))
  return modelFile
}

export function ToolsPage() {
  const allTools = useAllTools()
  const isLeftSideBarOpen = useIsLeftSidebarOpen()

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
          <div className="grid h-full grid-flow-row grid-cols-3 gap-4 p-4">
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
                isLeftSideBarOpen ? 'w-[calc(100%-175px)]' : 'w-full',
              )}
            >
              <Button
                className="rounded-3xl drop-shadow-md"
                onClick={() => {
                  console.log('start chat with tools: ', selectedTools)
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
  const downloads = useDownloads()

  const [modelDownloadConfirmDialog, setModelDownloadConfirmDialog] =
    useState<boolean>(false)

  const isDownloading = !!downloads.find((download) =>
    tool.requiredModels.includes(download.filename),
  )

  const hasModelInstalled = tool.requiredModels.every((modelName) =>
    localModels.some((model) => model.name === modelName),
  )

  const handleToolClick = useCallback(() => {
    if (!hasModelInstalled) {
      // eslint-disable-next-line no-console
      console.log(`Open download confirmation dialog: ${tool.requiredModels}`)
      setModelDownloadConfirmDialog(true)
    } else {
      const newSelectedTools = selectedTools.includes(tool.id)
        ? selectedTools.filter((selectedTool) => selectedTool !== tool.id)
        : [...selectedTools, tool.id]

      setSelectedTools(newSelectedTools)
    }
  }, [selectedTools, setSelectedTools, tool, hasModelInstalled])

  const handleModelDownload = useCallback(
    (e) => {
      e.stopPropagation()

      if (isDownloading) {
        // eslint-disable-next-line no-console
        console.log('Already downloading models:', tool.requiredModels)
        setModelDownloadConfirmDialog(false)
        return
      }

      // Assuming there's only 1 model for now
      const toDownloadFile = getModelFile(tool.requiredModels[0])

      // TODO: Start download process here
      console.log('Downloading model:', toDownloadFile)

      setModelDownloadConfirmDialog(false)
    },
    [isDownloading, tool.requiredModels],
  )

  return (
    <div
      key={tool.id}
      className={cn(
        'flex min-h-[7rem] cursor-pointer flex-col justify-between gap-1 rounded-lg border-2 bg-card p-3 text-card-foreground shadow-sm transition-all',
        selectedTools.includes(tool.id) ? 'border-primary' : '',
        !hasModelInstalled ? 'border-dashed' : '',
      )}
      onClick={handleToolClick}
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

      <AlertDialog open={modelDownloadConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Download</AlertDialogTitle>
            <AlertDialogDescription>
              This tool requires the following model(s):{' '}
              {tool.requiredModels.join(', ')}. Do you want to proceed with the
              installation?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={(e) => {
                e.stopPropagation()
                setModelDownloadConfirmDialog(false)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <Button variant="default" onClick={handleModelDownload}>
              Download
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
