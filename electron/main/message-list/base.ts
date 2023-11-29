// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  id: string
  // TODO: Currently store messages as string, but maybe use rich text implementation
  // text, entities: { offset, length, value } or {{ }} impl could work as well
  message: string
}

export type FormatOptions = {
  systemPrompt: string
  prefix?: string
}

export abstract class BaseMessageList {
  abstract get length(): number
  abstract format(opts: FormatOptions): string
  abstract dequeue(): ChatMessage | undefined
  abstract add(value: ChatMessage): void
  abstract clear(): void
}
