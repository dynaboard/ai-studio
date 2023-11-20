import { BaseMessageList, MessageListInput } from './base'

export type BasicMessageListInput = {
  messageList: MessageListInput[]
}

export class BasicMessageList extends BaseMessageList {
  messageList: MessageListInput[]

  constructor(input?: BasicMessageListInput) {
    super()
    this.messageList = input?.messageList || []
  }

  format(): string {
    return this.messageList
      .map(({ role, message }) => `\n### ${role}:\n${message}`)
      .join('\n')
  }

  add(chatMessage: MessageListInput) {
    this.messageList.push(chatMessage)
  }

  clear() {
    this.messageList = []
  }
}
