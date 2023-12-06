import { DEFAULT_MODEL } from '@/providers/models/manager'
import { BaseTool, ToolParameter } from '@/tools/base'

export default class RandomNumberTool extends BaseTool {
  name = 'Random Number Generator'
  description = 'Generate a random number'
  requiredModels = [DEFAULT_MODEL]

  parameters: ToolParameter[] = []

  async run() {
    return crypto.getRandomValues(new Uint32Array(1))[0]
  }
}
