import prettyBytes from 'pretty-bytes'

import { useModelManager } from '@/providers/models/provider'

export function ModelDownloader() {
  const downloadManager = useModelManager()

  return (
    <div className="flex h-full w-full flex-col">
      <p className="mb-4 mt-6 w-full text-center text-2xl font-bold">
        Download a model to get started
      </p>
      <div className="grid h-full w-full gap-4 overflow-auto">
        <div className="mx-auto mb-4 flex w-1/2 flex-1 flex-col gap-4">
          {downloadManager.allModels.map((model) => {
            return (
              <div
                key={model.name}
                className="grid grid-rows-[min-content,_min-content,_80px] gap-1"
              >
                <span>{model.name}</span>
                <p className="mb-2 text-xs text-primary/70">
                  {model.description}
                </p>
                <div className="flex gap-2">
                  {model.files.map((file) => {
                    return (
                      <a
                        href={file.url}
                        key={file.name}
                        className="flex flex-1 flex-col rounded-md border bg-secondary px-2 py-1"
                        download={file.name}
                      >
                        <span className="text-xs">Faster, less accurate</span>
                        <span className="text-xs">
                          Quantization: {file.quantization}
                        </span>
                        <span className="text-xs">
                          Size: {prettyBytes(file.sizeBytes)}
                        </span>
                      </a>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
