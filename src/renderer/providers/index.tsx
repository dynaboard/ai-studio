import { useEffect, useMemo } from 'react'

import { ChatManager, ChatManagerContext } from '@/providers/chat/manager'
import {
  HistoryManager,
  HistoryManagerContext,
  useHistoryManager,
} from '@/providers/history/manager'
import { ModelManager, ModelManagerContext } from '@/providers/models/manager'
import {
  SystemUsageManager,
  SystemUsageManagerContext,
} from '@/providers/system-usage'
import {
  ToolManager,
  ToolManagerContext,
  useToolManager,
} from '@/providers/tools/manager'

import {
  BrowserWindowManager,
  BrowserWindowManagerContext,
  useBrowserWindowManager,
} from './browser-window'

export function ChatManagerProvider({
  children,
  model,
}: {
  children: React.ReactNode
  model?: string
}) {
  const historyManager = useHistoryManager()
  const toolManager = useToolManager()

  const manager = useMemo(() => {
    // we dont use the router here because we want the threadID as fast as possible
    const url = new URL(window.location.href)
    let threadID: string | undefined = undefined
    if (url.pathname.startsWith('/chats')) {
      const splitName = url.pathname.split('/')
      threadID = splitName[splitName.length - 1]
    }

    return new ChatManager(historyManager, toolManager, model, threadID)
  }, [model, historyManager, toolManager])

  useEffect(() => {
    manager.initialize()
    return () => manager.destroy()
  }, [manager])

  return (
    <ChatManagerContext.Provider value={manager}>
      {children}
    </ChatManagerContext.Provider>
  )
}

export function HistoryManagerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const manager = useMemo(() => {
    return new HistoryManager()
  }, [])

  return (
    <HistoryManagerContext.Provider value={manager}>
      {children}
    </HistoryManagerContext.Provider>
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

export function BrowserWindowManagerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const manager = useMemo(() => {
    return new BrowserWindowManager()
  }, [])

  useEffect(() => {
    manager.initialize()
    return () => manager.destroy()
  }, [manager])

  return (
    <BrowserWindowManagerContext.Provider value={manager}>
      {children}
    </BrowserWindowManagerContext.Provider>
  )
}

export function ToolManagerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const historyManager = useHistoryManager()
  const browserWindowManager = useBrowserWindowManager()

  const manager = useMemo(() => {
    return new ToolManager({
      browserWindowManager,
      historyManager,
    })
  }, [browserWindowManager, historyManager])

  return (
    <ToolManagerContext.Provider value={manager}>
      {children}
    </ToolManagerContext.Provider>
  )
}
