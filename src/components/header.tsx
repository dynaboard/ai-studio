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
      style={{
        // @ts-expect-error this is an electron specific property, so we can drag the window around, but it's not in any types
        WebkitAppRegion: 'drag',
      }}
      className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex h-16 w-full items-center gap-4 border-b p-2 backdrop-blur"
    >
      <div
        className="flex h-full items-center gap-4"
        style={{
          // @ts-expect-error same as above
          WebkitAppRegion: 'no-drag',
        }}
      >
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
