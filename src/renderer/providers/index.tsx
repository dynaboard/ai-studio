import { useEffect, useMemo } from 'react'

import {
  ChatManager,
  ChatManagerContext,
  useChatManager,
} from '@/providers/chat/manager'
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
import { ToolManager, ToolManagerContext } from '@/providers/tools/manager'

import {
  BrowserWindowManager,
  BrowserWindowManagerContext,
  useBrowserWindowManager,
} from './browser-window'
import { FilesManager, FilesManagerContext } from './files/manager'

export function ChatManagerProvider({
  children,
  model,
}: {
  children: React.ReactNode
  model?: string
}) {
  const historyManager = useHistoryManager()

  const manager = useMemo(() => {
    // we dont use the router here because we want the threadID as fast as possible
    const url = new URL(window.location.href)
    let threadID: string | undefined = undefined
    if (url.pathname.startsWith('/chats')) {
      const splitName = url.pathname.split('/')
      threadID = splitName[splitName.length - 1]
    }

    return new ChatManager(historyManager, model, threadID)
  }, [model, historyManager])

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
  const chatManager = useChatManager()

  const manager = useMemo(() => {
    const toolManager = new ToolManager({
      browserWindowManager,
      historyManager,
      chatManager,
    })

    return toolManager
  }, [browserWindowManager, chatManager, historyManager])

  useEffect(() => {
    chatManager.setToolManager(manager)
  }, [chatManager, manager])

  return (
    <ToolManagerContext.Provider value={manager}>
      {children}
    </ToolManagerContext.Provider>
  )
}

export function FilesManagerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const manager = useMemo(() => {
    return new FilesManager()
  }, [])

  return (
    <FilesManagerContext.Provider value={manager}>
      {children}
    </FilesManagerContext.Provider>
  )
}
