import { app, BrowserWindow, ipcMain } from 'electron'
import { type LlamaContext } from 'node-llama-cpp'
import { LLamaChatPromptOptions, LlamaChatSession } from 'node-llama-cpp'
import path from 'path'

// we should probably store this in a shared location, tbh
import { MODELS } from '../../../src/providers/models/model-list'
import { ChatMessage } from '../message-list/base'
import { BasicMessageList } from '../message-list/basic'
import {
  BasePromptWrapper,
  LlamaPromptWrapper,
  MistralPromptWrapper,
  OpenFunctionsPromptWrapper,
  PhindPromptWrapper,
  SimplePromptWrapper,
  ZephyrPromptWrapper,
} from '../prompt-wrappers'
import { EmbeddingsManager } from './embeddings'

const SYSTEM_PROMPT = `You are a helpful AI assistant.`

export type ChatSession = {
  modelName: string
  session: LlamaChatSession
  context: LlamaContext
  messageList: BasicMessageList
}

const DEFAULT_MAX_OUTPUT_TOKENS = 512
const DEFAULT_CONTEXT_SIZE = 4096

export class ElectronChatManager {
  private lastSessionKey?: string | null
  private chatSession?: ChatSession | null
  private abortControllers = new Map<string, AbortController>()
  // private sessions: Map<string, ChatSession> = new Map<string, ChatSession>()

  constructor(
    readonly window: BrowserWindow,
    readonly embeddingsManager: EmbeddingsManager,
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

    const {
      LlamaContext,
      LlamaChatSession,
      LlamaModel,
      EmptyChatPromptWrapper,
    } = await import('node-llama-cpp')

    const modelName = modelPath.split('/').pop() as string
    const promptWrapper = this.getPromptWrapper(modelName)

    const model = new LlamaModel({
      modelPath,
      batchSize: DEFAULT_CONTEXT_SIZE,
      contextSize: DEFAULT_CONTEXT_SIZE,
    })
    const context = new LlamaContext({
      model,
      batchSize: DEFAULT_CONTEXT_SIZE,
      contextSize: DEFAULT_CONTEXT_SIZE,
    })

    const chatSession = {
      modelName,
      session: new LlamaChatSession({
        context,
        systemPrompt: SYSTEM_PROMPT,
        promptWrapper: new (class extends EmptyChatPromptWrapper {
          wrapPrompt(prompt: string): string {
            return prompt
          }
          getStopStrings(): string[] {
            return ['</s>']
          }
        })(),
      }),
      context,
      messageList:
        messageList ||
        new BasicMessageList({
          messageList: [],
          promptWrapper,
        }),
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
    const { context, messageList } = await this.initializeSession({
      modelPath,
      threadID,
      alwaysInit,
      messageList: newMessageList,
    })

    if (messageList.offsetLength < 1) {
      throw new Error(
        `message exceeded max token size: ${context.getContextSize()}`,
      )
    }

    const estimatedTokenCount =
      context.encode(messageList.format({ systemPrompt: systemPrompt }))
        .length + 16 // 16 is just a random buffer number

    if (estimatedTokenCount > context.getContextSize() - maxTokens) {
      messageList.setOffset(messageList.offsetIndex + 1)
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
    promptOptions?: LLamaChatPromptOptions
    modelPath: string
    selectedFile?: string
    onToken: (token: string) => void
  }) {
    const abortController = this.getAbortController(threadID)

    const { messageList, session } = await this.initializeSession({
      modelPath,
      threadID,
    })

    let messageEnd = 0

    messageList.add({ role: 'user', message, id: messageID })
    await this.shiftMessageWindow({
      systemPrompt,
      modelPath,
      threadID,
      maxTokens: promptOptions?.maxTokens,
    })

    // If we are chatting with a file, let's get the context and use a custom prompt
    if (selectedFile) {
      systemPrompt = await this.generateSystemPromptForFile({
        selectedFile,
        message,
        systemPrompt,
      })
    }

    const response = await session.prompt(
      messageList.format({ systemPrompt }),
      {
        topK: 20,
        topP: 0.3,
        temperature: 0.5,
        maxTokens: DEFAULT_MAX_OUTPUT_TOKENS,
        ...promptOptions,
        signal: abortController.signal,
        onToken: (chunks) => {
          if (!messageEnd) messageEnd = performance.now()
          onToken(session.context.decode(chunks))
        },
      },
    )

    messageList.add({
      role: 'assistant',
      message: response,
      id: assistantMessageID,
    })
    return response
  }

  // Note: Only regenerate messages for the last message for now...
  // We can update this later on, but will be more expensive calculating the correct context window.
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
    promptOptions?: LLamaChatPromptOptions
    modelPath: string
    selectedFile?: string
    onToken: (token: string) => void
  }) {
    const abortController = this.getAbortController(threadID)

    const { messageList: newMessageList } = await this.initializeSession({
      modelPath,
      threadID,
    })

    // Prevent KV buffer overflow by always starting a new session
    const { messageList, session } = await this.initializeSession({
      modelPath,
      threadID,
      alwaysInit: true,
      messageList: newMessageList,
    })

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

    const index = messageList.delete(messageID)
    const response = await session.prompt(
      messageList.format({
        systemPrompt,
        endOffset: index,
      }),
      {
        topK: 20,
        topP: 0.3,
        temperature: 0.5,
        ...promptOptions,
        signal: abortController.signal,
        onToken: (chunks) => onToken(session.context.decode(chunks)),
      },
    )
    messageList.add(
      { role: 'assistant', message: response, id: messageID },
      index,
    )
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
            this.window.webContents.send('token', {
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
            this.window.webContents.send('token', { token, messageID })
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
}
