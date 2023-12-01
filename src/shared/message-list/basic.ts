import { BasePromptWrapper } from '@shared/prompt-wrappers'

import { BaseMessageList, ChatMessage, FormatOptions } from './base'

export type BasicMessageListInput = {
  messageList?: ChatMessage[]
  promptWrapper: BasePromptWrapper
}

export class BasicMessageList extends BaseMessageList {
  messages: ChatMessage[]
  promptWrapper: BasePromptWrapper

  constructor(input: BasicMessageListInput) {
    super()
    this.messages = input.messageList || []
    this.promptWrapper = input.promptWrapper
  }

  format({ systemPrompt }: FormatOptions): string {
    return this.promptWrapper.getPrompt({
      messages: this.messages,
      systemPrompt: systemPrompt,
    })
  }

  get length() {
    return this.messages.length
  }

  add(chatMessage: ChatMessage) {
    this.messages.push(chatMessage)
  }

  delete(messageID: string) {
    this.messages = this.messages.filter((message) => message.id !== messageID)
  }

  dequeue(): ChatMessage | undefined {
    return this.messages.shift()
  }

  clear() {
    this.messages = []
  }
}
