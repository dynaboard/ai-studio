import { BaseTool, ToolParameter } from '@/tools/base'

export default class RandomNumberTool extends BaseTool {
  name = 'Random Number Generator'
  description = 'Generate a random number'
  requiredModels = ['Mistral 7B Instruct v0.1']

  parameters: ToolParameter[] = []

  async run() {
    return crypto.getRandomValues(new Uint32Array(1))[0]
  }
}
