import { PromptOptions } from '@shared/chats'

import type { BrowserWindowManager } from '@/providers/browser-window'
import type { ChatManager } from '@/providers/chat/manager'
import type { HistoryManager } from '@/providers/history/manager'
import type { ToolManager } from '@/providers/tools/manager'

export type BaseToolManagers = {
  historyManager: HistoryManager
  browserWindowManager: BrowserWindowManager
  toolManager: ToolManager
  chatManager: ChatManager
}

export type RunContext = {
  assistantMessageID: string
  threadID: string
  modelPath: string
  previousToolCalls: { id: string; result: unknown }[]
  promptOptions?: PromptOptions
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

  longDescription?: string

  constructor(readonly managers: BaseToolManagers) {
    // empty
  }

  abstract run(context: RunContext, ...parameters: unknown[]): Promise<unknown>

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
