import { LucideTrash } from 'lucide-react'
import { useValue } from 'signia-react'

import { ModelDownloader } from '@/components/downloads/model-downloader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useModelManager } from '@/providers/models/provider'

export function ModelsPage() {
  const modelManager = useModelManager()

  const availableModels = useValue(
    'availableModels',
    () => modelManager.availableModels,
    [modelManager],
  )

  return (
    <div
      className={cn(
        'grid h-full w-full',
        availableModels.length > 0 ? 'grid-rows-2' : 'grid-rows-1',
      )}
    >
      {availableModels.length > 0 ? (
        <div className="flex flex-col gap-2 p-2">
          {availableModels.map((model) => {
            return (
              <div key={model.name} className="flex flex-col gap-1">
                <p className="text-lg">{model.name}</p>
                <div className="grid grid-cols-2 gap-2">
                  {model.files.map((file) => {
                    return (
                      <div
                        key={file.name}
                        className="flex justify-between gap-1 rounded-md border bg-secondary p-2"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{file.name}</span>
                          <span className="text-sm">
                            Quantization: {file.quantization}
                          </span>
                        </div>

                        <div>
                          <Button
                            size="sm"
                            variant="iconButton"
                            className="p-0 hover:text-destructive"
                            onClick={() =>
                              modelManager.deleteModelFile(file.name)
                            }
                          >
                            <LucideTrash size={16} />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
      <div className="flex h-full w-full flex-col border-t p-2">
        <p className="text-2xl font-bold">Download more models</p>
        <ModelDownloader displayTitle={false} />
      </div>
    </div>
  )
}
