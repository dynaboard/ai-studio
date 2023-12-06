import { createContext, useContext } from 'react'
import { atom } from 'signia'

import { BaseTool, BaseToolManagers, IBaseTool } from '@/tools/base'

type ToolManagerState = {
  tools: BaseTool[]
}

export class ToolManager {
  private readonly _state = atom<ToolManagerState>('ModelManager._state', {
    tools: [],
  })

  constructor(readonly managers: BaseToolManagers) {
    this.getAllTools(managers).then((tools) => {
      this._state.update((state) => {
        return {
          ...state,
          tools,
        }
      })

      console.log('Tools loaded:', this.toolJSON)
    })
  }

  get toolJSON() {
    // Get tool JSON format that works with gorilla openfunctions
    return this.state.tools.map((tool) =>
      JSON.stringify({
        name: tool.name,
        id: tool.id,
        description: tool.description,
        parameters: tool.parameters,
      }),
    )
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
