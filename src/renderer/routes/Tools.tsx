import { Model } from '@shared/model-list'

import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAvailableModels } from '@/providers/models/manager'
import { useAllTools } from '@/providers/tools/manager'
import { BaseTool } from '@/tools/base'

export function ToolsPage() {
  const allTools = useAllTools()

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
      <div className="h-full overflow-hidden bg-slate-50 p-4 dark:bg-slate-900">
        <ScrollArea className="h-full">
          <div className="grid h-full grid-flow-row grid-cols-3 gap-4">
            {allTools.map((tool) => {
              return <ToolEntry key={tool.id} tool={tool} />
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function ToolEntry({ tool }: { tool: BaseTool }) {
  const localModels = useAvailableModels()

  const requiredModels = tool.requiredModels
    .map((modelName) => {
      return localModels.find((model) => model.name === modelName)
    })
    .filter((m) => !!m) as Model[]

  const hasModelInstalled = tool.requiredModels.every((modelName) =>
    localModels.some((model) => model.name === modelName),
  )

  return (
    <div
      key={tool.id}
      className="flex min-h-[7rem] flex-col justify-between gap-1 rounded-lg border bg-card p-3 text-card-foreground shadow-sm"
    >
      <div>
        <Label className="font-semibold leading-none tracking-tight">
          {tool.name}
        </Label>
        <p className="truncate text-xs leading-normal text-muted-foreground">
          {tool.longDescription ?? tool.description}
        </p>
      </div>
      {hasModelInstalled && (
        <div className="flex flex-col gap-1">
          <span className="w-fit">
            {requiredModels.map((model, _idx) => {
              return (
                <Badge key={model.name} variant="outline">
                  {model.name}
                </Badge>
              )
            })}
          </span>
        </div>
      )}
    </div>
  )
}
