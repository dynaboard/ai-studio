import { contextBridge, ipcRenderer } from 'electron'

import { ToolChannel } from './events'

contextBridge.exposeInMainWorld('tools', {
  getTool(prompt: string, tools: Record<string, unknown>[]) {
    return ipcRenderer.invoke(ToolChannel.GetTool, {
      prompt,
      tools,
    })
  },

  async fetch(
    url: string,
    request: NodeJS.fetch.RequestInit,
    resultType: 'text' | 'json',
  ) {
    return ipcRenderer.invoke(ToolChannel.Fetch, { url, request, resultType })
  },
} satisfies ToolsAPI)

export interface ToolsAPI {
  getTool: (prompt: string, tools: Record<string, unknown>[]) => Promise<string>

  fetch: (
    url: string,
    request: NodeJS.fetch.RequestInit,
    result: 'text' | 'json',
  ) => Promise<string | Record<string, unknown>>
}

declare global {
  interface Window {
    tools: ToolsAPI
  }
}
