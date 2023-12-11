export type Message = {
  role: 'user' | 'system' | 'assistant' | 'tool'
  message: string
  id: string
  state: 'pending' | 'sent' | 'running-tools'
  date: string
}
