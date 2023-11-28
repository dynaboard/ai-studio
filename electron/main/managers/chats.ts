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

const SYSTEM_PROMPT = `You are a helpful AI assistant.`

export type ChatSession = {
  modelName: string
  session: LlamaChatSession
  context: LlamaContext
  messageList: BasicMessageList
}

class AbortError extends Error {
  constructor() {
    super('Aborted')
  }
}

export class ElectronChatManager {
  private sessions: Map<string, ChatSession> = new Map<string, ChatSession>()

  private abortController = new AbortController()

  constructor(readonly window: BrowserWindow) {}

  close() {
    this.sessions.clear()
  }

  // Assumes one model per thread for now.
  private async initializeSession(modelPath: string, threadID: string) {
    const key = `${modelPath}-${threadID}`
    const session = this.sessions.get(key)
    if (!session) {
      const {
        LlamaContext,
        LlamaChatSession,
        LlamaModel,
        EmptyChatPromptWrapper,
      } = await import('node-llama-cpp')

      const modelName = modelPath.split('/').pop() as string
      const promptWrapper = this.getPromptWrapper(modelName)

      const model = new LlamaModel({ modelPath })
      const context = new LlamaContext({ model })
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
        messageList: new BasicMessageList({
          messageList: [],
          promptWrapper,
        }),
        abortController: new AbortController(),
      }

      this.sessions.set(key, chatSession)
      return chatSession
    }
    return session
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
    const { messageList } = await this.initializeSession(modelPath, threadID)

    messageList.clear()
    messages.forEach(({ role, message, id }) => {
      messageList.add({
        id,
        role,
        message,
      })
    })
  }

  async sendMessage({
    message,
    messageID,
    assistantMessageID,
    threadID,
    promptOptions,
    modelPath,
    onToken,
  }: {
    message: string
    messageID: string
    assistantMessageID: string
    threadID: string
    promptOptions?: LLamaChatPromptOptions
    modelPath: string
    onToken: (token: string) => void
  }) {
    const { messageList, session } = await this.initializeSession(
      modelPath,
      threadID,
    )

    messageList.add({ role: 'user', message, id: messageID })
    const response = await session.prompt(
      messageList.format({ systemPrompt: SYSTEM_PROMPT }),
      {
        ...promptOptions,
        signal: this.abortController.signal,
        onToken: (chunks) => onToken(session.context.decode(chunks)),
      },
    )

    messageList.add({
      role: 'assistant',
      message: response,
      id: assistantMessageID,
    })
    return response
  }

  async regenerateMessage({
    messageID,
    threadID,
    promptOptions,
    modelPath,
    onToken,
  }: {
    messageID: string
    threadID: string
    promptOptions?: LLamaChatPromptOptions
    modelPath: string
    onToken: (token: string) => void
  }) {
    const { messageList, session } = await this.initializeSession(
      modelPath,
      threadID,
    )

    messageList.delete(messageID)

    const response = await session.prompt(
      messageList.format({ systemPrompt: SYSTEM_PROMPT }),
      {
        ...promptOptions,
        signal: this.abortController.signal,
        onToken: (chunks) => onToken(session.context.decode(chunks)),
      },
    )
    messageList.add({ role: 'assistant', message: response, id: messageID })
    return response
  }

  async abortMessage() {
    this.abortController.abort()
  }

  async resetAbortController() {
    this.abortController = new AbortController()
  }

  async getAbortController() {
    return this.abortController
  }

  addClientEventHandlers() {
    ipcMain.handle(
      'chats:sendMessage',
      async (
        _,
        {
          message,
          threadID,
          messageID,
          assistantMessageID,
          promptOptions,
          modelPath,
        },
      ) => {
        const fullPath = path.join(app.getPath('userData'), 'models', modelPath)

        // try {
        return this.sendMessage({
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
        // } catch (error) {
        //   if (error instanceof AbortError) {
        //     console.error('AbortError occurred')
        //     return
        //   }
        // }
      },
    )

    ipcMain.handle(
      'chats:regenerateMessage',
      async (_, { messageID, threadID, promptOptions, modelPath }) => {
        const fullPath = path.join(app.getPath('userData'), 'models', modelPath)

        try {
          return this.regenerateMessage({
            messageID,
            threadID,
            promptOptions,
            modelPath: fullPath,
            onToken: (token) => {
              this.window.webContents.send('token', { token, messageID })
            },
          })
        } catch (error) {
          if (error instanceof AbortError) {
            console.error('AbortError occurred')
            return
          }
        }
      },
    )

    ipcMain.handle('chats:abortMessage', async () => {
      this.abortMessage()
    })

    ipcMain.handle('chats:resetAbortController', async () => {
      this.resetAbortController()
    })

    ipcMain.handle('chats:getAbortController', async () => {
      return this.getAbortController()
    })

    ipcMain.handle(
      'chats:cleanupSession',
      async (_, { modelPath, threadID }) => {
        const fullPath = path.join(app.getPath('userData'), 'models', modelPath)
        const key = `${fullPath}-${threadID}`
        const session = this.sessions.get(key)
        if (session) {
          this.sessions.delete(key)
        }
      },
    )

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
