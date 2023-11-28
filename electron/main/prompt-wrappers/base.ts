import { ChatMessage } from 'electron/main/message-list/base'

export type GetPromptOptions = {
  systemPrompt: string
  messages: ChatMessage[]
}

export abstract class BasePromptWrapper {
  abstract getPrompt(options: GetPromptOptions): string
}
