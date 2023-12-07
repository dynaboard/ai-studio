import { Model } from '@shared/model-list'

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
          Explore the tools available in Dynaboard AI Studio. Tools are intended
          to augment the abilities of your AI assistant, providing a natural
          language interface to a variety of tasks.
        </span>
      </div>
      <div className="h-full overflow-hidden bg-slate-50 p-4 dark:bg-slate-900">
        <ScrollArea className="h-full">
          <div className="grid h-full grid-flow-row grid-cols-2 gap-8">
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

  return (
    <div
      key={tool.id}
      className="grid grid-rows-[min-content,_min-content,_min-content] gap-1 rounded-lg border bg-card p-2 text-card-foreground shadow-sm"
    >
      <Label className="font-semibold leading-none tracking-tight">
        {tool.name}
      </Label>
      <p className="mb-2 text-xs leading-normal text-muted-foreground">
        {tool.longDescription ?? tool.description}
      </p>
      <div className="flex flex-col">
        <p className="text-xs font-bold">Required models</p>
        <p>
          {requiredModels.map((model) => {
            return (
              <span
                key={model.name}
                className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground"
              >
                {model.name}
              </span>
            )
          })}
        </p>
      </div>
    </div>
  )
}