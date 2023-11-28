import { BasePromptWrapper, GetPromptOptions } from './base'

export class MistralPromptWrapper extends BasePromptWrapper {
  userMessagePrefix = '[INST]'
  userMessageSuffix = '[/INST]'
  assistantMessagePrefix = ''
  assistantMessageSuffix = '</s>'

  getPrompt({ systemPrompt, messages }: GetPromptOptions): string {
    let prompt = `<s>[INST] ${systemPrompt} `
    messages.forEach(({ role, message }, idx, messages) => {
      if (role === 'user') {
        prompt += `${idx > 0 ? this.userMessagePrefix : ''}${message}${
          this.userMessageSuffix
        }`
      } else {
        prompt += `${this.assistantMessagePrefix}${message}${
          idx === messages.length - 2 ? this.assistantMessageSuffix : ''
        }`
      }
    })
    return prompt
  }
}
