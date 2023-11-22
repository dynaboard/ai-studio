import { BaseMessageList, MessageListInput } from './base'

export type BasicMessageListInput = {
  messageList: MessageListInput[]
}

export class BasicMessageList extends BaseMessageList {
  messages: MessageListInput[]

  constructor(input?: BasicMessageListInput) {
    super()
    this.messages = input?.messageList || []
  }

  format(): string {
    return this.messages
      .map(({ role, message }) => `\n### ${role}:\n${message}`)
      .join('\n')
  }

  add(chatMessage: MessageListInput) {
    this.messages.push(chatMessage)
  }

  delete(messageID: string) {
    this.messages = this.messages.filter((message) => message.id !== messageID)
  }

  clear() {
    this.messages = []
  }
}
