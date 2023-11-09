import { OpenAI } from 'openai'

export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY as string,
  dangerouslyAllowBrowser: true,
})

export type Assistant = OpenAI.Beta.Assistant
export type Thread = OpenAI.Beta.Thread
export type Run = OpenAI.Beta.Threads.Run
export type Message = OpenAI.Beta.Threads.ThreadMessage
