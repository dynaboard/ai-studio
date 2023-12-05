import { BasePromptWrapper, GetPromptOptions } from './base'

export class SimplePromptWrapper extends BasePromptWrapper {
  getPrompt({
    systemPrompt,
    messages,
    includeHistory,
  }: GetPromptOptions): string {
    let prompt = `You are a helpful AI assistant that remembers previous conversation between yourself the "ASSISTANT" and a human the "USER":
USER: <previous user message>
ASSISTANT: <previous AI assistant message>

The AI's task is to understand the context and utilize the previous conversation in addressing the user's questions or requests.
${systemPrompt}`
    if (!includeHistory) {
      messages = [messages.at(-1)!]
    }
    messages.forEach(({ role, message }, idx, messages) => {
      if (role === 'user') {
        prompt += `\nUSER:\n${message}`
        if (idx === messages.length - 1) {
          prompt += '\nASSISTANT:\n'
        }
      } else {
        prompt += `\nASSISTANT:\n${message}\n\n`
      }
    })
    return prompt
  }
}
