import { BasePromptWrapper, GetPromptOptions } from './base'

export class OpenFunctionsPromptWrapper extends BasePromptWrapper {
  getPrompt({ systemPrompt, messages }: GetPromptOptions): string {
    let prompt = `${systemPrompt}\n\n`
    messages.forEach(({ role, message }) => {
      if (role === 'user') {
        prompt += `USER: <<question>> ${message} \n`
      } else {
        prompt += `ASSISTANT:${message}\n`
      }
    })
    return prompt
  }
}
