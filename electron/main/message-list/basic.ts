import { BasePromptWrapper } from 'electron/main/prompt-wrappers'

import { BaseMessageList, ChatMessage, FormatOptions } from './base'

export type BasicMessageListInput = {
  messageList?: ChatMessage[]
  promptWrapper: BasePromptWrapper
}

export class BasicMessageList extends BaseMessageList {
  messages: ChatMessage[]
  promptWrapper: BasePromptWrapper
  offsetIndex: number

  constructor(input: BasicMessageListInput) {
    super()
    this.messages = input.messageList || []
    this.promptWrapper = input.promptWrapper
    this.offsetIndex = 0
  }

  format({ systemPrompt, startOffset, endOffset }: FormatOptions): string {
    const offset = startOffset || this.offsetIndex

    return this.promptWrapper.getPrompt({
      messages: this.messages.slice(offset, endOffset),
      systemPrompt: systemPrompt,
    })
  }

  get length() {
    return this.messages.length
  }

  get offsetLength() {
    return this.messages.slice(this.offsetIndex).length
  }

  add(chatMessage: ChatMessage, index?: number) {
    if (index !== undefined) {
      this.messages.splice(index, 0, chatMessage)
      if (this.offsetIndex >= index) {
        this.offsetIndex += 1
      }
    } else {
      this.messages.push(chatMessage)
    }
  }

  delete(messageID: string): number | undefined {
    const index = this.messages.findIndex((message) => message.id === messageID)

    if (index !== -1) {
      this.messages.splice(index, 1)
      if (this.offsetIndex >= index) {
        this.offsetIndex -= 1
      }
      return index
    }
  }

  setOffset(offsetIndex: number) {
    this.offsetIndex = offsetIndex
  }

  dequeue(): ChatMessage | undefined {
    return this.messages.shift()
  }

  clear() {
    this.messages = []
    this.offsetIndex = 0
  }
}
