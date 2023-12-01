import { BasePromptWrapper, GetPromptOptions } from './base'

export class PhindPromptWrapper extends BasePromptWrapper {
  getPrompt({ systemPrompt, messages }: GetPromptOptions): string {
    let prompt = `### System Prompt\n${systemPrompt}\n`
    messages.forEach(({ role, message }, index) => {
      if (role === 'user') {
        prompt += `### User Message\n${message}\n`
      } else {
        prompt += `### Assistant\n${message}</s>\n`
      }
      if (index === messages.length - 1) {
        prompt += '### Assistant\n'
      }
    })
    return prompt
  }
}
