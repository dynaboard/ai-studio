import { Tool, ToolCallingContext, ToolParameter } from '@shared/tools'
import { contextBridge, ipcRenderer } from 'electron'

import { Image, Text } from '../main/tools/search'
import { ToolChannel } from './events'

contextBridge.exposeInMainWorld('tools', {
  getAvailableTools() {
    return ipcRenderer.invoke(ToolChannel.GetAvailableTools)
  },

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

  async spawnTool(
    toolName: string,
    context: ToolCallingContext,
    parameters: ToolParameter[],
  ) {
    return ipcRenderer.invoke(ToolChannel.SpawnTool, {
      toolName,
      context,
      parameters,
    })
  },
} satisfies ToolsAPI)

export interface ToolsAPI {
  getAvailableTools: () => Promise<Tool[]>

  getTool: (prompt: string, tools: Record<string, unknown>[]) => Promise<string>

  fetch: (
    url: string,
    request: NodeJS.fetch.RequestInit,
    result: 'text' | 'json',
  ) => Promise<string | Record<string, unknown>>

  crawlImages: (query: string, limit: number) => Promise<Image[]>
  crawlWebsites: (query: string, limit: number) => Promise<Text[]>

  hasToolRunner: () => Promise<boolean>

  spawnTool: (
    toolID: string,
    context: ToolCallingContext,
    parameters: ToolParameter[],
  ) => Promise<unknown>
}

declare global {
  interface Window {
    tools: ToolsAPI
  }
}
