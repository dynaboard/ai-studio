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
}

export abstract class BaseMessageList {
  abstract format(opts: FormatOptions): string
  abstract add(value: ChatMessage): void
  abstract clear(): void
}
