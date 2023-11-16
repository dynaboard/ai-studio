import { useEffect, useMemo } from 'react'

import { ChatWindowContext, ChatWindowManager } from '@/providers/chat-window'
import { ModelManager, ModelManagerContext } from '@/providers/models/provider'
import {
  SystemUsageManager,
  SystemUsageManagerContext,
} from '@/providers/system-usage'

export function ChatWindowProvider({
  children,
  model,
}: {
  children: React.ReactNode
  model?: string
}) {
  const manager = useMemo(() => {
    return new ChatWindowManager(model)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model])

  return (
    <ChatWindowContext.Provider value={manager}>
      {children}
    </ChatWindowContext.Provider>
  )
}

export function ModelManagerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const manager = useMemo(() => {
    return new ModelManager()
  }, [])

  useEffect(() => {
    manager.initialize()
    return () => manager.destroy()
  }, [manager])

  return (
    <ModelManagerContext.Provider value={manager}>
      {children}
    </ModelManagerContext.Provider>
  )
}

export function SystemUsageManagerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const manager = useMemo(() => {
    return new SystemUsageManager()
  }, [])

  useEffect(() => {
    manager.initialize()
    return () => manager.destroy()
  }, [manager])

  return (
    <SystemUsageManagerContext.Provider value={manager}>
      {children}
    </SystemUsageManagerContext.Provider>
  )
}
