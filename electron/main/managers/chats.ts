import { app, BrowserWindow, ipcMain } from 'electron'
import { type LlamaContext, Token } from 'node-llama-cpp'
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
  private abortController: AbortController = new AbortController()
  // private sessions: Map<string, ChatSession> = new Map<string, ChatSession>()

  constructor(readonly window: BrowserWindow) {}

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

    if (messageList.length < 1) {
      throw new Error(
        `message exceeded max token size: ${context.getContextSize()}`,
      )
    }

    const estimatedTokenCount =
      context.encode(messageList.format({ systemPrompt: systemPrompt }))
        .length + 16 // 16 is just a random buffer number

    if (estimatedTokenCount > context.getContextSize() - maxTokens) {
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

  async sendMessage({
    systemPrompt,
    message,
    messageID,
    assistantMessageID,
    threadID,
    promptOptions,
    modelPath,
    onToken,
  }: {
    systemPrompt: string
    message: string
    messageID: string
    assistantMessageID: string
    threadID: string
    promptOptions?: LLamaChatPromptOptions
    modelPath: string
    onToken: (token: string) => void
  }) {
    let responseTokens: string = ''

    try {
      const { messageList, session } = await this.initializeSession({
        modelPath,
        threadID,
      })

      messageList.add({ role: 'user', message, id: messageID })

      await this.shiftMessageWindow({
        systemPrompt,
        modelPath,
        threadID,
        maxTokens: promptOptions?.maxTokens,
      })

      await session.prompt(
        messageList.format({ systemPrompt: SYSTEM_PROMPT }),
        {
          ...promptOptions,
          maxTokens: DEFAULT_MAX_OUTPUT_TOKENS,
          signal: this.abortController.signal,
          onToken: (chunks: Token[]) => {
            const token = session.context.decode(chunks)
            onToken(token)
            responseTokens += token
          },
        },
      )

      messageList.add({
        role: 'assistant',
        message: responseTokens,
        id: assistantMessageID,
      })

      await this.shiftMessageWindow({
        systemPrompt,
        modelPath,
        threadID,
        alwaysInit: true,
        newMessageList: messageList,
        maxTokens: promptOptions?.maxTokens,
      })
    } catch (e: unknown) {
      const error = e as Error
      if (error.name === 'AbortError') {
        console.error('The operation was aborted:', error)
      } else {
        // console.error('Error sending message in ElectronChatManager:', error)
      }
    } finally {
      this.resetAbortController()
    }

    return responseTokens
  }

  async regenerateMessage({
    systemPrompt,
    messageID,
    threadID,
    promptOptions,
    modelPath,
    onToken,
  }: {
    systemPrompt: string
    messageID: string
    threadID: string
    promptOptions?: LLamaChatPromptOptions
    modelPath: string
    onToken: (token: string) => void
  }) {
    let responseTokens: string = ''

    try {
      const { messageList, session } = await this.initializeSession({
        modelPath,
        threadID,
      })

      messageList.delete(messageID)

      await session.prompt(
        messageList.format({ systemPrompt: SYSTEM_PROMPT }),
        {
          ...promptOptions,
          signal: this.abortController.signal,
          onToken: (chunks: Token[]) => {
            const token = session.context.decode(chunks)
            onToken(token)
            responseTokens += token
          },
        },
      )
      messageList.add({
        role: 'assistant',
        message: responseTokens,
        id: messageID,
      })
      await this.shiftMessageWindow({
        systemPrompt,
        modelPath,
        threadID,
        maxTokens: promptOptions?.maxTokens,
      })
    } catch (e: unknown) {
      const error = e as Error
      if (error.name === 'AbortError') {
        console.error('The operation was aborted:', error)
      } else {
        // console.error(
        //   'Error regenerating message in ElectronChatManager:',
        //   error,
        // )
      }
    } finally {
      this.resetAbortController()
    }

    return responseTokens
  }

  async abortMessage() {
    this.abortController.abort()
  }

  resetAbortController() {
    if (this.abortController.signal.aborted) {
      this.abortController = new AbortController()
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
        { systemPrompt, messageID, threadID, promptOptions, modelPath },
      ) => {
        const fullPath = path.join(app.getPath('userData'), 'models', modelPath)
        return this.regenerateMessage({
          systemPrompt,
          messageID,
          threadID,
          promptOptions,
          modelPath: fullPath,
          onToken: (token) => {
            this.window.webContents.send('token', { token, messageID })
          },
        })
      },
    )

    ipcMain.handle('chats:abortMessage', async () => {
      this.abortMessage()
    })

    // ipcMain.handle(
    //   'chats:cleanupSession',
    //   async (_, { modelPath, threadID }) => {
    //     const fullPath = path.join(app.getPath('userData'), 'models', modelPath)
    //     const key = this.getSessionKey(fullPath, threadID)
    //     const session = this.sessions.get(key)
    //     if (session) {
    //       this.sessions.delete(key)
    //     }
    //   },
    // )

    ipcMain.handle(
      'chats:loadMessageList',
      async (_, { modelPath, threadID, messages }) => {
        const fullPath = path.join(app.getPath('userData'), 'models', modelPath)
        return this.loadMessageList({ modelPath: fullPath, threadID, messages })
      },
    )
  }

  getPromptWrapper(modelName: string): BasePromptWrapper {
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

  getPromptTemplateName(modelName: string) {
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
