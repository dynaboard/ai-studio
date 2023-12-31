import prettyBytes from 'pretty-bytes'

import { useModelManager } from '@/providers/models/manager'
import { useSystemUsage } from '@/providers/system-usage'

export function StatusBar() {
  const downloadManager = useModelManager()

  const usage = useSystemUsage()

  return (
    <div className="border-t-border bg-background fixed bottom-0 left-0 z-50 h-6 w-screen border-t">
      <div className="flex h-full items-center justify-between px-4">
        <span className="text-xs">
          RAM usage:{' '}
          {prettyBytes((usage.memory.private + usage.memory.shared) * 1000)} /
          CPU usage: {usage.cpu.percentCPUUsage.toPrecision(2)}%
        </span>
        <span
          className="cursor-pointer text-xs"
          onClick={() => downloadManager.toggleStatus()}
        >
          Downloads
        </span>
      </div>
    </div>
  )
}
