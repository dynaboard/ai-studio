import {
  LLamaChatPromptOptions,
  LlamaChatSession,
} from 'node-llama-cpp/dist/llamaEvaluator/LlamaChatSession'

export class AssistantManager {
  private timer: ReturnType<typeof setTimeout> | null = null
  private session: LlamaChatSession | null = null

  constructor(public modelPath: string) {
    // Delay the creation of the session until it's needed
  }

  private async initializeSession() {
    if (!this.session) {
      const { LlamaContext, LlamaChatSession, LlamaModel } = await import(
        'node-llama-cpp'
      )
      const model = new LlamaModel({ modelPath: this.modelPath })
      const context = new LlamaContext({ model })
      this.session = new LlamaChatSession({
        context,
      })
    }
  }

  async sendMessage(message: string, promptOptions?: LLamaChatPromptOptions) {
    await this.initializeSession()

    if (!this.session) {
      console.error('Failed to initialize the session')
      return
    }

    const response = await this.session.prompt(message, promptOptions)
    return response
  }
}
