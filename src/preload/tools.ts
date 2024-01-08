import { contextBridge, ipcRenderer } from 'electron'

import { Image, Text } from '../main/tools/search'
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

  async crawlImages(query: string, limit: number) {
    return ipcRenderer.invoke(ToolChannel.CrawlImages, {
      query,
      limit,
    })
  },

  async crawlWebsites(query: string, limit: number) {
    return ipcRenderer.invoke(ToolChannel.CrawlWebsites, {
      query,
      limit,
    })
  },

  async hasToolRunner() {
    return ipcRenderer.invoke(ToolChannel.HasToolRunner)
  },

  async spawnTool(toolName: string) {
    return ipcRenderer.invoke(ToolChannel.SpawnTool, { toolName })
  },
} satisfies ToolsAPI)

export interface ToolsAPI {
  getTool: (prompt: string, tools: Record<string, unknown>[]) => Promise<string>

  fetch: (
    url: string,
    request: NodeJS.fetch.RequestInit,
    result: 'text' | 'json',
  ) => Promise<string | Record<string, unknown>>

  crawlImages: (query: string, limit: number) => Promise<Image[]>
  crawlWebsites: (query: string, limit: number) => Promise<Text[]>

  hasToolRunner: () => Promise<boolean>

  spawnTool: (toolName: string) => Promise<void>
}

declare global {
  interface Window {
    tools: ToolsAPI
  }
}
