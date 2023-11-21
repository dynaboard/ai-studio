// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MessageListInput = {
  role: 'user' | 'assistant' | 'system'
  // TODO: Currently store messages as string, but maybe use rich text implementation
  // text, entities: { offset, length, value } or {{ }} impl could work as well
  message: string
}

export abstract class BaseMessageList {
  abstract format(): string
  abstract add(value: MessageListInput): void
  abstract clear(): void
}
