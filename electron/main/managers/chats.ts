import { app, BrowserWindow, ipcMain } from 'electron'
import { LlamaContext } from 'node-llama-cpp'
import {
  LLamaChatPromptOptions,
  LlamaChatSession,
} from 'node-llama-cpp/dist/llamaEvaluator/LlamaChatSession'
import path from 'path'

import { MessageListInput } from '../message-list/base'
import { BasicMessageList } from '../message-list/basic'

export type ChatSession = {
  session: LlamaChatSession
  context: LlamaContext
  messageList: BasicMessageList
}

export class ElectronChatManager {
  private sessions: Map<string, ChatSession> = new Map<string, ChatSession>()

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
        GeneralChatPromptWrapper,
      } = await import('node-llama-cpp')
      const model = new LlamaModel({ modelPath })
      const context = new LlamaContext({ model })
      const chatSession = {
        session: new LlamaChatSession({
          context,
          systemPrompt: `You are a helpful AI assistant that remembers previous conversation between yourself the "assistant" and a human the "user":
### user:
<previous user message>
### assistant:
<previous AI assistant message>

### user:
<new user prompt>

The AI's task is to understand the context and utilize the previous conversation in addressing the user's questions or requests.`,
          promptWrapper: new GeneralChatPromptWrapper({
            instructionName: 'user',
            responseName: 'assistant',
          }),
        }),
        context,
        messageList: new BasicMessageList({
          messageList: [],
        }),
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
    messages: MessageListInput[]
  }): Promise<void> {
    const { messageList } = await this.initializeSession(modelPath, threadID)

    messageList.clear()
    messages.forEach(({ role, message }) => {
      messageList.add({
        role,
        message,
      })
    })
  }

  async sendMessage({
    message,
    threadID,
    promptOptions,
    modelPath,
    onToken,
  }: {
    message: string
    threadID: string
    promptOptions?: LLamaChatPromptOptions
    modelPath: string
    onToken: (token: string) => void
  }) {
    const { messageList, session } = await this.initializeSession(
      modelPath,
      threadID,
    )

    messageList.add({ role: 'user', message })
    const response = await session.prompt(messageList.format(), {
      ...promptOptions,
      onToken: (chunks) => onToken(session.context.decode(chunks)),
    })
    messageList.add({ role: 'assistant', message: response })
    return response
  }

  addClientEventHandlers() {
    ipcMain.handle(
      'chats:sendMessage',
      async (_, { message, threadID, messageID, promptOptions, modelPath }) => {
        const fullPath = path.join(app.getPath('userData'), 'models', modelPath)

        return this.sendMessage({
          message,
          threadID,
          promptOptions,
          modelPath: fullPath,
          onToken: (token) => {
            this.window.webContents.send('token', { token, messageID })
          },
        })
      },
    )

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
}
