export type Message = {
  role: 'user' | 'system' | 'assistant'
  message: string
  id: string
  state: 'pending' | 'sent'
}
