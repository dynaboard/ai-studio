import { ChatMessage } from '@shared/message-list/base'

export type GetPromptOptions = {
  systemPrompt: string
  messages: ChatMessage[]
  includeHistory?: boolean
}

export abstract class BasePromptWrapper {
  abstract getPrompt(options: GetPromptOptions): string
}
