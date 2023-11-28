import { BasePromptWrapper, GetPromptOptions } from './base'

export class LlamaPromptWrapper extends BasePromptWrapper {
  getPrompt({ systemPrompt, messages }: GetPromptOptions): string {
    let prompt = `[INST]<<SYS>>
${systemPrompt}
<</SYS>>

[/INST]\n\n`
    messages.forEach(({ role, message }) => {
      if (role === 'user') {
        prompt += `[INST]${message}[/INST]\n`
      } else {
        prompt += `${message}\n`
      }
    })
    return prompt
  }
}
