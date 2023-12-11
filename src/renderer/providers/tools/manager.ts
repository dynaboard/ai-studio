import { createContext, useContext } from 'react'
import { atom } from 'signia'
import { useValue } from 'signia-react'

import { useHistoryManager } from '@/providers/history/manager'
import { BaseTool, BaseToolManagers, IBaseTool } from '@/tools/base'

type ToolManagerState = {
  tools: BaseTool[]
  activeToolIDs: Set<string>
}

export class ToolManager {
  private readonly _state = atom<ToolManagerState>('ModelManager._state', {
    tools: [],
    activeToolIDs: new Set(),
  })

  constructor(readonly managers: Omit<BaseToolManagers, 'toolManager'>) {
    this.getAllTools({
      ...managers,
      toolManager: this,
    }).then((tools) => {
      this._state.update((state) => {
        return {
          ...state,
          tools,
        }
      })

      // console.log('Tools loaded:', this.toolJSON)
    })
  }

  async getToolsForPrompt(
    prompt: string,
    toolIDs: string[],
  ): Promise<{ tool: BaseTool; parameters: unknown }[] | null> {
    const response = await window.tools.getTool(
      prompt,
      this.getToolJSON(toolIDs),
    )
    try {
      const possibleTools = JSON.parse(response) as {
        id: string
        parameters: Record<string, unknown>
      }[]
      if (!Array.isArray(possibleTools)) {
        return null
      }
      const ids = possibleTools.map((tool) => tool.id)
      const tools = this.state.tools.filter((tool) => ids.includes(tool.id))
      if (!tools.length) {
        return null
      }

      return possibleTools.map(({ id, parameters }) => ({
        tool: tools.find((tool) => tool.id === id)!,
        parameters,
      }))
    } catch (err) {
      console.error('Could not parse tool response:', err)
      return null
    }
  }

  enableTool(threadID: string, toolID: string) {
    const thread = this.managers.historyManager.getThread(threadID)
    if (!thread) {
      return
    }
    this.managers.historyManager.updateThreadTools(threadID, [
      ...(thread.activeToolIDs ?? []),
      toolID,
    ])
  }

  disableTool(threadID: string, toolID: string) {
    const thread = this.managers.historyManager.getThread(threadID)
    if (!thread) {
      return
    }
    const existingTools = thread.activeToolIDs ?? []
    this.managers.historyManager.updateThreadTools(
      threadID,
      existingTools.filter((id) => id !== toolID),
    )
  }

  getToolByID(toolID: string) {
    return this.state.tools.find((tool) => tool.id === toolID)
  }

  get allToolJSON() {
    return this.state.tools.map((tool) => ({
      name: tool.name,
      id: tool.id,
      description: tool.description,
      parameters: tool.parameters,
    }))
  }

  getToolJSON(toolIDs: string[]) {
    return this.state.tools
      .filter((tool) => toolIDs.includes(tool.id))
      .map((tool) => ({
        name: tool.name,
        id: tool.id,
        description: tool.description,
        parameters: tool.parameters,
      }))
  }

  get hasActiveTools() {
    return this.state.activeToolIDs.size > 0
  }

  get state() {
    return this._state.value
  }

  private async getAllTools(managers: BaseToolManagers) {
    const result = await Promise.all(
      Object.entries(
        import.meta.glob<false, 'default', { default: IBaseTool }>([
          '../../tools/*.ts',
        ]),
      )
        .filter(([k]) => !k.endsWith('base.ts'))
        .map(([_, v]) => v()),
    )

    return result.map((r) => new r.default(managers))
  }
}

export const ToolManagerContext = createContext(new ToolManager({} as never))

export function useToolManager() {
  return useContext(ToolManagerContext)
}

export function useAllTools() {
  const toolManager = useToolManager()
  return useValue('useAllTools', () => toolManager.state.tools, [
    toolManager.state,
  ])
}

export function useActiveTools(threadID?: string) {
  const toolManager = useToolManager()
  const historyManager = useHistoryManager()

  return useValue(
    'useActiveTools',
    () => {
      const ids = historyManager.getThread(threadID)?.activeToolIDs ?? []
      return toolManager.state.tools.filter((tool) => ids.includes(tool.id))
    },
    [threadID, toolManager.state, historyManager.state],
  )
}
