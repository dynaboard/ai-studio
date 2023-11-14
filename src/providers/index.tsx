'use client'

import { useEffect, useMemo } from 'react'

import { Assistant } from '@/lib/openai'
import { AssistantContext, AssistantManager } from '@/providers/assistant'
import { ModelManager, ModelManagerContext } from '@/providers/models'

export function AssistantManagerProvider({
  children,
  assistant,
}: {
  children: React.ReactNode
  assistant?: Assistant
}) {
  const manager = useMemo(() => {
    return new AssistantManager(assistant)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistant?.id])

  return (
    <AssistantContext.Provider value={manager}>
      {children}
    </AssistantContext.Provider>
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
    manager.destroy()
  }, [manager])

  return (
    <ModelManagerContext.Provider value={manager}>
      {children}
    </ModelManagerContext.Provider>
  )
}
