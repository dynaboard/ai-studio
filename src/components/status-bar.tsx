import { useModelManager } from '@/providers/models/provider'

export function StatusBar() {
  const downloadManager = useModelManager()
  return (
    <div className="fixed bottom-0 left-0 h-6 w-screen border-t border-t-border bg-background">
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
