import { app, ipcMain } from 'electron'
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

  // Assumes one model per session for now.
  private async initializeSession(modelPath: string) {
    const session = this.sessions.get(modelPath)
    if (!session) {
      const { LlamaContext, LlamaChatSession, LlamaModel } = await import(
        'node-llama-cpp'
      )
      const model = new LlamaModel({ modelPath })
      const context = new LlamaContext({ model })
      const newSession = new LlamaChatSession({
        context,
      })
      this.sessions.set(modelPath, newSession)
      return newSession
    }
    return session
  }

  async sendMessage({
    message,
    promptOptions,
    modelPath,
  }: {
    message: string
    promptOptions?: LLamaChatPromptOptions
    modelPath: string
  }) {
    const session = await this.initializeSession(modelPath)
    const response = await session.prompt(message, promptOptions)
    return response
  }

  addClientEventHandlers() {
    ipcMain.handle(
      'chats:sendMessage',
      async (_, { message, promptOptions, modelPath }) => {
        const fullPath = path.join(app.getPath('userData'), 'models', modelPath)

        return this.sendMessage({
          message,
          promptOptions,
          modelPath: fullPath,
        })
      },
    )
  }
}
