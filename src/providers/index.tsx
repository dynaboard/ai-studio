import { useEffect, useMemo } from 'react'

import { AssistantContext, AssistantManager } from '@/providers/assistant'
import { ModelManager, ModelManagerContext } from '@/providers/models/provider'

export function AssistantManagerProvider({
  children,
  model,
}: {
  children: React.ReactNode
  model?: string
}) {
  const manager = useMemo(() => {
    return new AssistantManager(model)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model])

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
    manager.initialize()
    return () => manager.destroy()
  }, [manager])

  return (
    <ModelManagerContext.Provider value={manager}>
      {children}
    </ModelManagerContext.Provider>
  )
}
