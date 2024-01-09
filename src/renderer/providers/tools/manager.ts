import { Tool, ToolCallingContext, ToolParameter } from '@shared/tools'
import { createContext, useContext } from 'react'
import { atom } from 'signia'
import { useValue } from 'signia-react'

import { useHistoryManager } from '@/providers/history/manager'
import { BaseToolManagers } from '@/tools/base'

type ToolManagerState = {
  tools: Tool[]
  activeToolIDs: Set<string>
  settingUpTools: boolean
}

export class ToolManager {
  private readonly _state = atom<ToolManagerState>('ModelManager._state', {
    tools: [],
    activeToolIDs: new Set(),
    settingUpTools: false,
  })

  private downloadingTools = false

  constructor(readonly managers: Omit<BaseToolManagers, 'toolManager'>) {
    window.tools.getAvailableTools().then((tools) => {
      this._state.update((state) => {
        return {
          ...state,
          tools,
        }
      })
    })
  }

  async getToolsForPrompt(
    prompt: string,
    toolIDs: string[],
  ): Promise<{ tool: Tool; parameters: unknown }[] | null> {
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

  async runTool(
    tool: Tool,
    context: ToolCallingContext,
    parameters: ToolParameter[],
  ) {
    const response = await window.tools.spawnTool(
      tool.name,
      context,
      parameters,
    )
    return response
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

  async hasToolRunner() {
    return window.tools.hasToolRunner()
  }

  async setupTools() {
    if (this.downloadingTools) {
      return
    }
    const haveToolRunner = await this.hasToolRunner()
    if (haveToolRunner) {
      return
    }

    this._state.update((state) => {
      return {
        ...state,
        settingUpTools: true,
      }
    })
    this.downloadingTools = true

    await window.downloads.downloadDeno()

    this.downloadingTools = false
    this._state.update((state) => {
      return {
        ...state,
        settingUpTools: false,
      }
    })
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

export function useIsSettingUpTools() {
  const toolManager = useToolManager()

  return useValue(
    'useIsSettingUpTools',
    () => toolManager.state.settingUpTools,
    [toolManager.state],
  )
}
