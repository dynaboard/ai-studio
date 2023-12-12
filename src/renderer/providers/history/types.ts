import { type Message } from '@/providers/chat/types'

export type Thread = {
  id: string
  title: string
  modelID: string
  createdAt: Date
  messages: Message[]
  topP: number
  temperature: number
  systemPrompt: string
  filePath?: string
  activeToolIDs?: string[]
  toolCalls?: {
    toolID: string
    messageID: string
    parameters: Record<string, unknown>[]
  }[]
}
