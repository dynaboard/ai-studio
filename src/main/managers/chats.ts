// we should probably store this in a shared location, tbh
import { PromptOptions } from '@shared/chats'
import { ChatMessage } from '@shared/message-list/base'
import { BasicMessageList } from '@shared/message-list/basic'
import { ModelFile, MODELS } from '@shared/model-list'
import { app, BrowserWindow, ipcMain } from 'electron'
import { readFile } from 'fs/promises'
import path from 'path'

import { ElectronLlamaServerManager } from '@/managers/llama-server'
import { sendToRenderer } from '@/webcontents'

import {
  BasePromptWrapper,
  LlamaPromptWrapper,
  MistralPromptWrapper,
  OpenFunctionsPromptWrapper,
  PhindPromptWrapper,
  SimplePromptWrapper,
  ZephyrPromptWrapper,
} from '../../shared/prompt-wrappers'
import { EmbeddingsManager } from './embeddings'

export type ChatSession = {
  modelName: string
  // session: LlamaChatSession
  // context: LlamaContext
  parameters: {
    contextSize: number
    modelPath: string
  }
  messageList: BasicMessageList
}

const DEFAULT_MAX_OUTPUT_TOKENS = 512

export class ElectronChatManager {
  private lastSessionKey?: string | null
  private chatSession?: ChatSession | null
  private abortControllers = new Map<string, AbortController>()
  // private sessions: Map<string, ChatSession> = new Map<string, ChatSession>()

  constructor(
    readonly window: BrowserWindow,
    readonly embeddingsManager: EmbeddingsManager,
    readonly llamaServerManager: ElectronLlamaServerManager,
  ) {}

  close() {
    this.lastSessionKey = null
    this.chatSession = null
  }

  // Assumes one model per thread for now.
  private getSessionKey(modelPath: string, threadID: string): string {
    return `${modelPath}-${threadID}`
  }

  private async initializeSession({
    modelPath,
    threadID,
    alwaysInit,
    messageList,
  }: {
    modelPath: string
    threadID: string
    alwaysInit?: boolean
    messageList?: BasicMessageList
  }) {
    const key = this.getSessionKey(modelPath, threadID)

    if (!alwaysInit && this.lastSessionKey === key && this.chatSession) {
      return this.chatSession
    }

    const modelName = modelPath.split('/').pop() as string
    const promptWrapper = this.getPromptWrapper(modelName)

    const modelFile = this.getModelFile(modelName)
    let mmprojPath = ''
    if (modelFile?.multimodal && modelFile?.supportingFiles?.[0]) {
      mmprojPath = path.join(
        app.getPath('userData'),
        'models',
        modelFile.supportingFiles[0].name,
      )
    }

    await this.llamaServerManager.launchServer({
      modelPath,
      mmprojPath: mmprojPath,
      multimodal: modelFile?.multimodal,
    })

    const modelParameters = await this.llamaServerManager.getModelParameters()

    const chatSession = {
      modelName,
      messageList:
        messageList ||
        new BasicMessageList({
          messageList: [],
          promptWrapper,
        }),
      parameters: modelParameters,
    }

    this.lastSessionKey = key
    this.chatSession = chatSession

    return this.chatSession
  }

  async loadMessageList({
    threadID,
    modelPath,
    messages,
  }: {
    threadID: string
    modelPath: string
    messages: ChatMessage[]
  }): Promise<void> {
    const { messageList } = await this.initializeSession({
      modelPath,
      threadID,
    })

    messageList.clear()
    messages.forEach(({ role, message, id }) => {
      messageList.add({
        id,
        role,
        message,
      })
    })
  }

  private async shiftMessageWindow({
    systemPrompt,
    modelPath,
    threadID,
    alwaysInit,
    newMessageList,
    maxTokens = DEFAULT_MAX_OUTPUT_TOKENS,
  }: {
    systemPrompt: string
    modelPath: string
    threadID: string
    alwaysInit?: boolean
    newMessageList?: BasicMessageList
    maxTokens?: number
  }): Promise<void> {
    const {
      messageList,
      parameters: { contextSize },
    } = await this.initializeSession({
      modelPath,
      threadID,
      alwaysInit,
      messageList: newMessageList,
    })

    if (messageList.length < 1) {
      throw new Error(`message exceeded max token size: ${contextSize}`)
    }

    const prompt = messageList.format({ systemPrompt: systemPrompt })
    const encoded = await this.llamaServerManager.encode(prompt)

    const estimatedTokenCount = encoded.length + 16 // 16 is just a random buffer number

    if (estimatedTokenCount > contextSize - maxTokens) {
      messageList.dequeue()
      await this.shiftMessageWindow({
        systemPrompt,
        modelPath,
        threadID,
        alwaysInit: true,
        newMessageList: messageList,
        maxTokens,
      })
    }
  }

  private getAbortController(threadID: string): AbortController {
    if (!this.abortControllers.has(threadID)) {
      this.abortControllers.set(threadID, new AbortController())
    }
    return this.abortControllers.get(threadID)!
  }

  async sendMessage({
    systemPrompt,
    message,
    messageID,
    assistantMessageID,
    threadID,
    promptOptions,
    modelPath,
    selectedFile,
    onToken,
  }: {
    systemPrompt: string
    message: string
    messageID: string
    assistantMessageID: string
    threadID: string
    promptOptions?: PromptOptions
    modelPath: string
    selectedFile?: string
    onToken: (token: string) => void
  }) {
    const abortController = this.getAbortController(threadID)

    const { messageList } = await this.initializeSession({
      modelPath,
      threadID,
    })

    let imageData: { data: string; id: number } | undefined
    let messageWithImage: string | undefined

    // If we are chatting with a file, let's get the context and use a custom prompt
    if (selectedFile) {
      if (selectedFile.endsWith('.pdf')) {
        systemPrompt = await this.generateSystemPromptForFile({
          selectedFile,
          message,
          systemPrompt,
        })
      } else if (
        selectedFile.endsWith('.png') ||
        selectedFile.endsWith('.jpg') ||
        selectedFile.endsWith('.jpeg')
      ) {
        // We can chat with an image using a multimodal model like LLAVA
        const imageID = Math.round(Math.random() * 100)
        imageData = {
          data: await readFile(selectedFile, { encoding: 'base64' }),
          id: imageID,
        }
        messageWithImage = `[img-${imageID}]${message}`
      }
    }

    messageList.add({ role: 'user', message, id: messageID })
    await this.shiftMessageWindow({
      systemPrompt,
      modelPath,
      threadID,
      maxTokens: promptOptions?.maxTokens,
    })

    const prompt = messageList.format({
      systemPrompt,
      includeHistory: !messageWithImage,
    })

    let response = ''
    for await (const chunk of this.llama(
      prompt,
      {
        top_k: 20,
        top_p: 0.3,
        temperature: 0.5,
        image_data: imageData ? [imageData] : undefined,
      },
      {
        controller: abortController,
      },
    )) {
      if (chunk.data) {
        onToken(chunk.data.content)
        response += chunk.data.content
      }
    }

    messageList.add({
      role: 'assistant',
      message: response,
      id: assistantMessageID,
    })

    return response
  }

  async regenerateMessage({
    systemPrompt,
    messageID,
    threadID,
    promptOptions,
    modelPath,
    selectedFile,
    onToken,
  }: {
    systemPrompt: string
    messageID: string
    threadID: string
    promptOptions?: PromptOptions
    modelPath: string
    selectedFile?: string
    onToken: (token: string) => void
  }) {
    const abortController = this.getAbortController(threadID)
    const { messageList } = await this.initializeSession({
      modelPath,
      threadID,
    })

    messageList.delete(messageID)

    // If we are chatting with a file, let's get the context and use a custom prompt
    if (selectedFile) {
      // Last user message
      const message =
        messageList.messages[messageList.messages.length - 1].message
      systemPrompt = await this.generateSystemPromptForFile({
        selectedFile,
        message,
        systemPrompt,
      })
    }

    let response = ''
    for await (const chunk of this.llama(
      messageList.format({ systemPrompt }),
      {
        top_k: 20,
        top_p: 0.3,
        temperature: 0.5,
      },
      {
        controller: abortController,
      },
    )) {
      if (chunk.data) {
        onToken(chunk.data.content)
        response += chunk.data.content
      }
    }

    messageList.add({ role: 'assistant', message: response, id: messageID })
    await this.shiftMessageWindow({
      systemPrompt,
      modelPath,
      threadID,
      maxTokens: promptOptions?.maxTokens,
    })
    return response
  }

  abort(threadID: string) {
    if (this.abortControllers.has(threadID)) {
      const controller = this.abortControllers.get(threadID)
      if (controller) {
        controller.abort()
        this.abortControllers.delete(threadID)
      } else {
        // eslint-disable-next-line no-console
        console.log(`No AbortController found for threadID: ${threadID}`)
      }
    }
  }

  addClientEventHandlers() {
    ipcMain.handle(
      'chats:sendMessage',
      async (
        _,
        {
          systemPrompt,
          message,
          threadID,
          messageID,
          assistantMessageID,
          promptOptions,
          modelPath,
          selectedFile,
        },
      ) => {
        const fullPath = path.join(app.getPath('userData'), 'models', modelPath)
        return this.sendMessage({
          systemPrompt,
          message,
          messageID,
          assistantMessageID,
          threadID,
          promptOptions,
          modelPath: fullPath,
          selectedFile,
          onToken: (token) => {
            sendToRenderer(this.window.webContents, 'token', {
              token,
              messageID: assistantMessageID,
            })
          },
        })
      },
    )

    ipcMain.handle(
      'chats:regenerateMessage',
      async (
        _,
        {
          systemPrompt,
          messageID,
          threadID,
          promptOptions,
          modelPath,
          selectedFile,
        },
      ) => {
        const fullPath = path.join(app.getPath('userData'), 'models', modelPath)
        return this.regenerateMessage({
          systemPrompt,
          messageID,
          threadID,
          promptOptions,
          modelPath: fullPath,
          selectedFile,
          onToken: (token) => {
            sendToRenderer(this.window.webContents, 'token', {
              token,
              messageID,
            })
          },
        })
      },
    )

    ipcMain.handle('chats:abort', (_, threadID) => {
      this.abort(threadID)
    })

    ipcMain.handle(
      'chats:loadMessageList',
      async (_, { modelPath, threadID, messages }) => {
        const fullPath = path.join(app.getPath('userData'), 'models', modelPath)
        return this.loadMessageList({ modelPath: fullPath, threadID, messages })
      },
    )

    ipcMain.handle(
      'chats:cleanupSession',
      async (_, { modelPath, threadID }) => {
        console.log('Cleaning up chat session:', { threadID, modelPath })
        const fullPath = path.join(app.getPath('userData'), 'models', modelPath)
        this.llamaServerManager.cleanupProcess(fullPath)
      },
    )
  }

  private async generateSystemPromptForFile({
    selectedFile,
    message,
    systemPrompt,
  }: {
    selectedFile: string
    message: string
    systemPrompt: string
  }) {
    console.log('Answering the prompt using file context:', selectedFile)
    const results = await this.embeddingsManager.search({
      filePath: selectedFile,
      query: message,
      topK: 8,
    })

    if (results) {
      let contents = `FILE PATH: ${selectedFile}\n\n`
      results.forEach((result) => {
        contents += `PAGE: ${result.item.metadata.page}\nCONTENTS: ${result.item.metadata.contents}\n\n-----------------\n\n`
      })
      systemPrompt = `The following pieces of context are from a FILE the user provided. Use them to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer. Always include the PAGE of the CONTENTS used for the answer.

File Context:
${contents}

Question: ${message}
Helpful Answer:
`
    }

    return systemPrompt
  }

  private getPromptWrapper(modelName: string): BasePromptWrapper {
    const templateName = this.getPromptTemplateName(modelName)
    switch (templateName) {
      case 'llama':
        return new LlamaPromptWrapper()
      case 'mistral':
        return new MistralPromptWrapper()
      case 'zephyr':
        return new ZephyrPromptWrapper()
      case 'phind':
        return new PhindPromptWrapper()
      case 'openfunctions':
        return new OpenFunctionsPromptWrapper()
      default:
        return new SimplePromptWrapper()
    }
  }

  private getPromptTemplateName(modelName: string) {
    const model = MODELS.find(
      (m) => !!m.files.find((f) => f.name === modelName),
    )
    if (!model) {
      throw new Error(
        `Could not find model (for prompt template): ${modelName}`,
      )
    }

    return model.promptTemplate
  }

  private getModelFile(modelName: string) {
    let modelFile: ModelFile | undefined
    MODELS.forEach(
      (m) => (modelFile = m.files.find((f) => f.name === modelName)),
    )
    return modelFile
  }

  async *llama(
    prompt: string,
    params: {
      temperature?: number
      top_k?: number
      top_p?: number
      min_p?: number
      n_predict?: number
      n_keep?: number
      stop?: string[]
      presence_penalty?: number
      frequency_penalty?: number
      grammar?: string
      seed?: number
      image_data?: { data: string; id: number }[]
    } = {},
    config: {
      controller?: AbortController
    } = {},
  ): AsyncGenerator<{
    data: {
      content: string
      multimodal: boolean
      slot_id: number
      stop: boolean
      generation_settings?: Record<string, unknown>
    }
  }> {
    let controller = config.controller

    if (!controller) {
      controller = new AbortController()
    }

    const paramDefaults = {
      stream: true,
      n_predict: 500,
      temperature: 0.3,
      stop: ['</s>'],
    }

    const completionParams = { ...paramDefaults, ...params, prompt }

    const response = await fetch('http://127.0.0.1:8080/completion', {
      method: 'POST',
      body: JSON.stringify(completionParams),
      headers: {
        Connection: 'keep-alive',
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      signal: controller.signal,
    })

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    let content = ''
    let leftover = '' // Buffer for partially read lines

    try {
      let cont = true

      while (cont) {
        const streamData = await reader?.read()
        if (!streamData || streamData?.done) {
          break
        }

        // Add any leftover data to the current chunk of data
        const text = leftover + decoder.decode(streamData?.value)

        // Check if the last character is a line break
        const endsWithLineBreak = text.endsWith('\n')

        // Split the text into lines
        const lines = text.split('\n')

        // If the text doesn't end with a line break, then the last line is incomplete
        // Store it in leftover to be added to the next chunk of data
        if (!endsWithLineBreak) {
          leftover = lines.pop() ?? ''
        } else {
          leftover = '' // Reset leftover if we have a line break at the end
        }

        // Parse all sse events and add them to result
        const regex = /^(\S+):\s(.*)$/gm
        for (const line of lines) {
          const match = regex.exec(line)
          if (match) {
            streamData[match[1]] = match[2]
            // since we know this is llama.cpp, let's just decode the json in data
            if (match[1] === 'data') {
              const data = JSON.parse(match[2])
              content += data

              // yield
              yield { data }

              // if we got a stop token from server, we will break here
              if (data.stop) {
                cont = false
                break
              }
            }
            if (match[1] === 'error') {
              const error = JSON.parse(match[2])
              console.error(`llama.cpp error: ${error.content}`)
            }
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('llama error: ', e)
      }
      throw e
    }

    return content
  }
}
