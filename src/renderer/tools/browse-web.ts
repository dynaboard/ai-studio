import { DEFAULT_MODEL } from '@/providers/models/manager'
import { BaseTool, ToolParameter } from '@/tools/base'

export default class BrowseWebTool extends BaseTool {
  name = 'Browse Web'
  description = 'Browse the web and take screenshots'
  requiredModels = [DEFAULT_MODEL]

  parameters: ToolParameter[] = [
    {
      name: 'URL',
      description: 'URL to browse to',
      type: 'string',
      required: true,
    },
  ]

  async run() {
    console.log('BrowseWebTool.run()')
  }
}
