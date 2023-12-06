import { LucideSettings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  useActiveTools,
  useAllTools,
  useToolManager,
} from '@/providers/tools/manager'

import { SystemPrompt } from './parameters/system-prompt'
import { TemperatureSelector } from './parameters/temperature'
import { TopPSelector } from './parameters/top-p'

export function ParametersConfig({ fileName }: { fileName?: string }) {
  const allTools = useAllTools()
  const activeTools = useActiveTools()
  const toolManager = useToolManager()

  return (
    <div className="flex items-center space-x-2">
      <div className="hidden md:flex">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8">
              <LucideSettings className="mr-2 h-4 w-4" />
              Customize
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="z-40 w-[340px] rounded-[0.5rem] bg-white p-6 px-4 dark:bg-zinc-950"
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col">
                <div className="flex items-start">
                  <div className="space-y-1 pr-2">
                    <div className="font-semibold leading-none tracking-tight">
                      Customize
                    </div>
                    <div className="prose text-xs text-muted-foreground">
                      Fine-tune parameters to get the best results for your use
                      case.
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-1 flex-col gap-4">
                  {!fileName && <SystemPrompt />}
                  <TemperatureSelector />
                  <TopPSelector />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-start">
                  <div className="space-y-1 pr-2">
                    <div className="font-semibold leading-none tracking-tight">
                      Active Tools
                    </div>
                    <div className="prose text-xs text-muted-foreground">
                      Tools help augment an LLM&rsquo;s capabilities.
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-1 flex-col gap-4">
                  {allTools.map((tool) => (
                    <div key={tool.id} className="flex flex-col">
                      <div className="flex gap-2">
                        <Checkbox
                          id={`tool-${tool.id}`}
                          defaultChecked={activeTools.includes(tool)}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              toolManager.enableTool(tool.id)
                            } else {
                              toolManager.disableTool(tool.id)
                            }
                          }}
                        />
                        <div className="flex flex-col leading-none">
                          <label
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed"
                            htmlFor={`tool-${tool.id}`}
                          >
                            {tool.name}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
