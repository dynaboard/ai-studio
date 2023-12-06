import { createContext, useContext } from 'react'
import { atom } from 'signia'
import { useValue } from 'signia-react'

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

      console.log('Tools loaded:', this.toolJSON)
    })
  }

  async getToolForPrompt(
    prompt: string,
  ): Promise<{ tool: BaseTool; parameters: unknown } | null> {
    const response = await window.tools.getTool(prompt, this.activeToolJSON)
    try {
      const possibleTool = JSON.parse(response)
      if (possibleTool.id === 'invalid-tool') {
        return null
      }
      const tool = this.state.tools.find((tool) => tool.id === possibleTool.id)
      if (!tool) {
        return null
      }

      return {
        tool: tool,
        parameters: possibleTool.parameters,
      }
    } catch (err) {
      console.error('Could not parse tool response:', err)
      return null
    }
  }

  enableTool(toolID: string) {
    this._state.update((state) => {
      if (state.activeToolIDs.has(toolID)) {
        return state
      }
      return {
        ...state,
        activeToolIDs: new Set([...state.activeToolIDs, toolID]),
      }
    })
  }

  disableTool(toolID: string) {
    this._state.update((state) => {
      if (!state.activeToolIDs.has(toolID)) {
        return state
      }
      return {
        ...state,
        activeToolIDs: new Set(
          Array.from(state.activeToolIDs).filter((id) => id !== toolID),
        ),
      }
    })
  }

  get toolJSON() {
    return this.state.tools.map((tool) => ({
      name: tool.name,
      id: tool.id,
      description: tool.description,
      parameters: tool.parameters,
    }))
  }

  get activeToolJSON() {
    return this.state.tools
      .filter((tool) => this.state.activeToolIDs.has(tool.id))
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

export function useActiveTools() {
  const toolManager = useToolManager()
  return useValue(
    'useActiveTools',
    () =>
      toolManager.state.tools.filter((tool) =>
        toolManager.state.activeToolIDs.has(tool.id),
      ),
    [toolManager.state],
  )
}
