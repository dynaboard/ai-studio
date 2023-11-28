import { BasePromptWrapper, GetPromptOptions } from './base'

export class ZephyrPromptWrapper extends BasePromptWrapper {
  getPrompt({ systemPrompt, messages }: GetPromptOptions): string {
    let prompt = `<|system|>\n${systemPrompt}</s>\n`
    messages.forEach(({ role, message }, index) => {
      if (role === 'user') {
        prompt += `<|user|>\n${message}</s>\n`
      } else {
        prompt += `<|assistant|>\n${message}</s>\n`
      }
      if (index === messages.length - 1) {
        prompt += '<|assistant|>\n'
      }
    })
    return prompt
  }
}
