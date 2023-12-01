import { BasePromptWrapper, GetPromptOptions } from './base'

export class SimplePromptWrapper extends BasePromptWrapper {
  getPrompt({ systemPrompt, messages }: GetPromptOptions): string {
    let prompt = `You are a helpful AI assistant that remembers previous conversation between yourself the "assistant" and a human the "user":
### user:
<previous user message>
### assistant:
<previous AI assistant message>
### user:
<new user prompt>

The AI's task is to understand the context and utilize the previous conversation in addressing the user's questions or requests.
${systemPrompt}`
    messages.forEach(({ role, message }) => {
      if (role === 'user') {
        prompt += `\n### user:\n${message}`
      } else {
        prompt += `\n### assistant:\n${message}\n\n`
      }
    })
    return prompt
  }
}
