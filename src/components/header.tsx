import { useThread } from '@/providers/history/manager'
import { type Model } from '@/providers/models/model-list'

import { ModelSwitcher } from './model-switcher'

export function Header({
  models,
  currentThreadID,
}: {
  models: Model[]
  currentThreadID?: string
}) {
  const currentThread = useThread(currentThreadID)

  return (
    <div
      className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex h-16 w-full items-center gap-4 border-b px-4 backdrop-blur"
      id="drag"
    >
      <div className="flex h-full items-center gap-4" id="no-drag">
        <ModelSwitcher models={models} />

        {currentThread ? (
          <div>
            <span className="text-muted-foreground text-sm font-medium">
              {currentThread.title}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
