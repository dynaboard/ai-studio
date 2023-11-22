import { MessageListInput } from 'electron/main/message-list/base'

export type GetPromptOptions = {
  systemPrompt: string
  messages: MessageListInput[]
}

export abstract class BasePromptWrapper {
  abstract getPrompt(options: GetPromptOptions): string
}
