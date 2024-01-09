import { PromptOptions } from './chats'

export type ToolParameter = {
  name: string
  description: string
  type: 'string' | 'number' | 'boolean'
}

export type Tool = {
  id: string
  name: string
  path: string
  main: string
  description: string
  parameters: ToolParameter[]
  requiredModels: string[]
}

export type ToolCallingContext = {
  assistantMessageID: string
  threadID: string
  modelPath: string
  promptOptions: PromptOptions | undefined
  previousToolCalls: {
    id: string
    result: unknown
  }[]
}
