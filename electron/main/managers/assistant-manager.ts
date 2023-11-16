import {
  LLamaChatPromptOptions,
  LlamaChatSession,
} from 'node-llama-cpp/dist/llamaEvaluator/LlamaChatSession'

export class AssistantManager {
  private timer: ReturnType<typeof setTimeout> | null = null
  private sessions: Map<string, LlamaChatSession> = new Map<
    string,
    LlamaChatSession
  >()

  constructor() {}

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
}
