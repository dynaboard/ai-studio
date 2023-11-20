import { app, BrowserWindow, ipcMain } from 'electron'
import {
  LLamaChatPromptOptions,
  LlamaChatSession,
} from 'node-llama-cpp/dist/llamaEvaluator/LlamaChatSession'
import path from 'path'

export class ElectronChatManager {
  private sessions: Map<string, LlamaChatSession> = new Map<
    string,
    LlamaChatSession
  >()

  constructor(readonly window: BrowserWindow) {}

  close() {
    this.sessions.clear()
  }

  // Assumes one model per thread for now.
  private async initializeSession(modelPath: string, threadID: string) {
    const key = `${modelPath}-${threadID}`
    const session = this.sessions.get(key)
    if (!session) {
      const { LlamaContext, LlamaChatSession, LlamaModel } = await import(
        'node-llama-cpp'
      )
      const model = new LlamaModel({ modelPath })
      const context = new LlamaContext({ model })
      const newSession = new LlamaChatSession({
        context,
      })
      this.sessions.set(key, newSession)
      return newSession
    }
    return session
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
    const session = await this.initializeSession(modelPath, threadID)
    const response = await session.prompt(message, {
      ...promptOptions,
      onToken: (chunks) => onToken(session.context.decode(chunks)),
    })
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
  }
}
