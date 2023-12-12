import { ToolChannel } from '@preload/events'
import { app, ipcMain } from 'electron'
import { readFileSync } from 'fs'
import path from 'path'

import {
  CompletionParams,
  ElectronLlamaServerManager,
} from '@/managers/llama-server'

import multiToolGrammar from '../../../resources/grammars/multi-tool.gbnf?asset'
import { Image, SearchApi } from '../tools/search'

const SERVER_ID = 'TOOL_SERVER'

export class ElectronToolManager {
  private serverReady: Promise<unknown>

  constructor(readonly llamaServerManager: ElectronLlamaServerManager) {
    this.serverReady = llamaServerManager.launchServer({
      id: SERVER_ID,
      modelPath: path.join(
        app.getPath('userData'),
        'models',
        'mistral-7b-instruct-v0.1.Q4_K_M.gguf',
      ),
      port: '8001',
    })
  }

  async getTool(prompt: string, tools: Record<string, unknown>[]) {
    await this.serverReady

    const systemPrompt = `[INST]You are an AI assistant. You call tools on behalf of a user. Tools have parameters. You must extract those parameters from the user's request. You have access to the following tools, and only these tools:
    ${JSON.stringify(tools)}

    Never call a tool that does not exist. If you cannot find a tool to call, respond with: { "id": "invalid-tool", parameters: [] }`

    const finalPrompt = `${systemPrompt}\n\nUSER: ${prompt}}[/INST]\nASSISTANT:`

    const paramDefaults = {
      stream: true,
      n_predict: 500,
      temperature: 0.2,
      stop: ['</s>', 'USER:', 'ASSISTANT:'],
    }

    const grammar = readFileSync(multiToolGrammar, 'utf-8')

    const params: CompletionParams = {
      temperature: 0.3,
      top_k: 20,
      top_p: 0.5,
      grammar,
      prompt: finalPrompt,
      stream: false,
    }

    const body = JSON.stringify({ ...paramDefaults, ...params })
    const response = await fetch('http://127.0.0.1:8001/completion', {
      method: 'POST',
      body: body,
      headers: {
        Connection: 'keep-alive',
        'Content-Type': 'application/json',
      },
    })

    const json = await response.json()
    return json.content
  }

  async fetch(
    url: string,
    request: NodeJS.fetch.RequestInit,
    resultType: 'text' | 'json',
  ) {
    const response = await fetch(url, request)
    if (resultType === 'text') {
      return await response.text()
    } else {
      return await response.json()
    }
  }

  async crawlImages(query: string, limit: number) {
    const searchApi = new SearchApi()

    const results: Image[] = []
    const images = searchApi.images({ keywords: query, limit })
    for await (const image of images) {
      results.push(image)
    }
    return results
  }

  async crawlWebsites(query: string, limit: number) {
    const searchApi = new SearchApi()

    const results: unknown[] = []
    const websites = searchApi.text({
      keywords: query,
      limit,
    })
    for await (const website of websites) {
      results.push(website)
    }
    return results
  }

  addClientEventHandlers() {
    ipcMain.handle(ToolChannel.GetTool, async (_, { prompt, tools }) => {
      return await this.getTool(prompt, tools)
    })

    ipcMain.handle(
      ToolChannel.Fetch,
      async (_, { url, request, resultType }) => {
        return await this.fetch(url, request, resultType)
      },
    )
    ipcMain.handle(ToolChannel.CrawlImages, async (_, { query, limit }) => {
      return await this.crawlImages(query, limit)
    })
    ipcMain.handle(ToolChannel.CrawlWebsites, async (_, { query, limit }) => {
      return await this.crawlWebsites(query, limit)
    })
  }
}
