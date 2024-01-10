import { ToolChannel } from '@preload/events'
import { Tool, ToolCallingContext } from '@shared/tools'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { randomUUID } from 'crypto'
import { app, ipcMain } from 'electron'
import { existsSync, readFileSync } from 'fs'
import { readdir, readFile, stat } from 'fs/promises'
import { createServer, Server } from 'net'
import { tmpdir } from 'os'
import path from 'path'

import { ElectronChatManager } from '@/managers/chats'
import {
  CompletionParams,
  ElectronLlamaServerManager,
} from '@/managers/llama-server'

import multiToolGrammar from '../../../resources/grammars/multi-tool.gbnf?asset'
import { BASE_TOOL_PATHS } from '../tools/base-tools'
import { Image, SearchApi } from '../tools/search'

const SERVER_ID = 'TOOL_SERVER'

export class ElectronToolManager {
  private serverReady: Promise<unknown>

  private conn: Server

  toolCalls = new Map<
    string,
    {
      resolver: (...args: unknown[]) => void
      process: ChildProcessWithoutNullStreams
    }
  >()

  constructor(
    readonly llamaServerManager: ElectronLlamaServerManager,
    readonly chatManager: ElectronChatManager,
  ) {
    this.serverReady = llamaServerManager.launchServer({
      id: SERVER_ID,
      modelPath: path.join(
        app.getPath('userData'),
        'models',
        'mistral-7b-instruct-v0.1.Q4_K_M.gguf',
      ),
      port: '8001',
    })

    this.conn = createServer(
      {
        keepAlive: true,
      },
      (socket) => {
        socket.on('data', async (data) => {
          try {
            const json = JSON.parse(data.toString())

            if (json.type === 'reply') {
              const call = this.toolCalls.get(json.id)
              if (!call) {
                console.error('Unknown tool call:', json)
              } else {
                call.resolver(json.message)
                call.process.kill()
                this.toolCalls.delete(json.id)
              }
            } else if (json.type === 'chat-message') {
              const message = json.message

              // we need to set the full model path
              if (message.modelPath) {
                message.modelPath = path.join(
                  app.getPath('userData'),
                  'models',
                  json.modelPath,
                )
              }

              if (json.message.outOfBand) {
                const response = await chatManager.sendOutOfBandMessage(
                  json.message,
                )
                socket.write(
                  JSON.stringify({
                    type: 'host',
                    message: response,
                    id: json.id,
                  }),
                )
              } else {
                const response = chatManager.sendMessage(json.message)
                socket.write(
                  JSON.stringify({
                    type: 'host',
                    message: response,
                    id: json.id,
                  }),
                )
              }
            } else {
              console.error('Unknown message type:', json)
            }
          } catch {
            // ignore invalid JSON for now
          }
        })
      },
    )

    this.conn.listen(path.join(tmpdir(), 'dynaboard.sock'))
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

  async hasToolRunner() {
    return existsSync(path.join(app.getPath('userData'), 'tools', 'deno'))
  }

  async spawnTool(
    toolName: string,
    context: ToolCallingContext,
    params: Record<string, unknown>,
  ) {
    const socketPath = path.join(tmpdir(), 'dynaboard.sock')

    const tools = [
      ...(await this.findLocalTools()),
      ...(await this.loadBaseTools()),
    ]

    const tool = tools.find((t) => t.name === toolName)

    if (!tool) {
      throw new Error(`Tool "${toolName}" not found`)
    }

    return new Promise((resolve) => {
      const id = randomUUID()
      const process = spawn(
        path.join(app.getPath('userData'), 'tools', 'deno'),
        [
          'run',
          '-A',
          '--unstable',
          path.join(tool.path, tool.main),
          '--socket',
          socketPath,
          '--params',
          JSON.stringify(params),
          '--context',
          JSON.stringify(context),
          '--resolverID',
          id,
        ],
      )

      process.stdout.on('data', (data) => {
        console.log(`${data}`)
      })

      process.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`)
      })

      this.toolCalls.set(id, {
        resolver: resolve,
        process,
      })
    })
  }

  private async findLocalTools() {
    const dir = await readdir(path.join(app.getPath('userData'), 'tools'))
    const tools: Tool[] = []

    for (const entry of dir) {
      const entryPath = path.join(app.getPath('userData'), 'tools', entry)
      const stats = await stat(entryPath)
      if (stats.isDirectory()) {
        // check for manifest.json
        if (existsSync(path.join(entryPath, 'manifest.json'))) {
          const manifest = JSON.parse(
            await readFile(path.join(entryPath, 'manifest.json'), 'utf-8'),
          )
          tools.push({
            id: manifest.name.replace(/\s/g, '-').toLowerCase(),
            name: manifest.name,
            description: manifest.description,
            path: entryPath,
            main: manifest.main,
            requiredModels: manifest.requiredModels,
            parameters: manifest.parameters,
          })
        }
      }
    }

    return tools
  }

  private async loadBaseTools() {
    const tools: Tool[] = []

    for (const tool of BASE_TOOL_PATHS) {
      const manifest = JSON.parse(await readFile(tool.manifestPath, 'utf-8'))
      tools.push({
        id: manifest.name.replace(/\s/g, '-').toLowerCase(),
        name: manifest.name,
        path: path.dirname(tool.toolPath),
        description: manifest.description,
        main: manifest.main,
        requiredModels: manifest.requiredModels,
        parameters: manifest.parameters,
      })
    }

    return tools
  }

  async getAvailableTools() {
    return [...(await this.findLocalTools()), ...(await this.loadBaseTools())]
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

    ipcMain.handle(ToolChannel.HasToolRunner, async () => {
      return this.hasToolRunner()
    })

    ipcMain.handle(
      ToolChannel.SpawnTool,
      async (_, { toolName, context, parameters }) => {
        return this.spawnTool(toolName, context, parameters)
      },
    )

    ipcMain.handle(ToolChannel.GetAvailableTools, async () => {
      return this.getAvailableTools()
    })
  }
}
