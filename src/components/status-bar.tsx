import { useModelManager } from '@/providers/models/provider'

export function StatusBar() {
  const downloadManager = useModelManager()
  return (
    <div className="h-full w-full border-t border-t-border">
      <div className="flex h-full items-center justify-between px-4">
        <span className="text-xs">RAM usage: 100 Mb / CPU usage: 40%</span>
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
