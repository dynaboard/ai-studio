import { useModelManager } from '@/providers/models'

export function ModelDownloader() {
  const downloadManager = useModelManager()

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <p className="w-full text-center text-2xl font-bold">
        Download a model to get started
      </p>
      <div className="flex w-[440px] flex-col gap-4">
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
                      <span className="text-sm">Faster, less accurate</span>
                      <span className="text-sm">
                        Quantization: {file.quantization}
                      </span>
                      <span className="text-sm">Size: TODO GB</span>
                    </a>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
