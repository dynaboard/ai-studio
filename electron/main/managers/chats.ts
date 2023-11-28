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

// const SYSTEM_PROMPT = `You are a helpful AI assistant.`

export type ChatSession = {
  modelName: string
  session: LlamaChatSession
  context: LlamaContext
  messageList: BasicMessageList
}

// TODO: Make this user configurable
const SYSTEM_PROMPT = `You are a helpful AI assistant that remembers previous conversation between yourself the "assistant" and a human the "user":
### user:
<previous user message>
### assistant:
<previous AI assistant message>

The AI's task is to understand the context and utilize the previous conversation in addressing the user's questions or requests.`

export class ElectronChatManager {
  private lastSessionKey?: string | undefined
  private chatSession?: ChatSession | undefined
  // private sessions: Map<string, ChatSession> = new Map<string, ChatSession>()

  constructor(readonly window: BrowserWindow) {}

  // close() {
  //   this.sessions.clear()
  // }

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
      batchSize: 4096,
      contextSize: 4096,
    })
    const context = new LlamaContext({
      model,
      batchSize: 4096,
      contextSize: 4096,
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
      messageList: new BasicMessageList({
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

  private async shiftMessageWindow(
    modelPath: string,
    threadID: string,
    alwaysInit?: boolean,
    newMessageList?: BasicMessageList,
  ): Promise<void> {
    const { context, messageList } = await this.initializeSession({
      modelPath,
      threadID,
      alwaysInit,
      messageList: newMessageList,
    })

    // if (messageList.length < 1) {
    //   throw new Error(
    //     `message exceeded max token size: ${context.getContextSize()}`,
    //   )
    // }

    // This is just an estimate, we can count the exact tokens once we have better control over tokenization and prompt wrappers
    const estimatedTokenCount =
      context.encode(messageList.format({ systemPrompt: SYSTEM_PROMPT }))
        .length + 64 // 64 is just a random buffer number

    if (estimatedTokenCount > context.getContextSize()) {
      console.log('**** Token count exceeded, reinitializing ****')
      messageList.dequeue()
      await this.shiftMessageWindow(modelPath, threadID, true, messageList)
    }
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
    const { messageList, session } = await this.initializeSession({
      modelPath,
      threadID,
    })

    messageList.add({ role: 'user', message, id: messageID })
    this.shiftMessageWindow(modelPath, threadID)
    const response = await session.prompt(
      messageList.format({ systemPrompt: SYSTEM_PROMPT }),
      {
        ...promptOptions,
        onToken: (chunks) => onToken(session.context.decode(chunks)),
      },
    )
    messageList.add({
      role: 'assistant',
      message: response,
      id: assistantMessageID,
    })
    await this.shiftMessageWindow(modelPath, threadID, true, messageList)
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
    const { messageList, session } = await this.initializeSession({
      modelPath,
      threadID,
    })

    messageList.delete(messageID)

    const response = await session.prompt(
      messageList.format({ systemPrompt: SYSTEM_PROMPT }),
      {
        ...promptOptions,
        onToken: (chunks) => onToken(session.context.decode(chunks)),
      },
    )
    messageList.add({ role: 'assistant', message: response, id: messageID })
    await this.shiftMessageWindow(modelPath, threadID)
    return response
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
      },
    )

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

    ipcMain.handle(
      'chats:regenerateMessage',
      async (_, { messageID, threadID, promptOptions, modelPath }) => {
        const fullPath = path.join(app.getPath('userData'), 'models', modelPath)
        return this.regenerateMessage({
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
