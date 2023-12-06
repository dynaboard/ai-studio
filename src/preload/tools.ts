import { contextBridge, ipcRenderer } from 'electron'

import { ToolChannel } from './events'

contextBridge.exposeInMainWorld('tools', {
  getTool(prompt: string, tools: Record<string, unknown>[]) {
    return ipcRenderer.invoke(ToolChannel.GetTool, {
      prompt,
      tools,
    })
  },
} satisfies ToolsAPI)

export interface ToolsAPI {
  getTool: (prompt: string, tools: Record<string, unknown>[]) => Promise<string>
}

declare global {
  interface Window {
    tools: ToolsAPI
  }
}
