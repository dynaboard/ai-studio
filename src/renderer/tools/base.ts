import { BrowserWindowManager } from '@/providers/browser-window'
import { HistoryManager } from '@/providers/history/manager'

export type BaseToolManagers = {
  historyManager: HistoryManager
  browserWindowManager: BrowserWindowManager
}

export type ToolParameter = {
  name: string
  description: string
  type: 'string' | 'number' | 'boolean'
}

export abstract class BaseTool {
  abstract name: string
  abstract description: string
  abstract requiredModels: string[]
  abstract parameters: ToolParameter[]

  constructor(readonly managers: BaseToolManagers) {
    // empty
  }

  abstract run(): Promise<unknown>

  protected async ensureRequiredModels() {
    for (const model of this.requiredModels) {
      const isDownloaded = await window.models.isModelDownloaded(model)
      if (!isDownloaded) {
        return false
      }
    }
    return true
  }

  get id() {
    return this.name.replace(/\s/g, '-').toLowerCase()
  }
}

export interface IBaseTool {
  new (managers: BaseToolManagers): BaseTool
}
