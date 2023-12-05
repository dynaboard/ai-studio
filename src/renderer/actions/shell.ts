import { z } from 'zod'

import { Action } from '@/actions/base'

const Input = z.object({
  bashScript: z.string(),
})

type Input = z.infer<typeof Input>

const Output = z.object({
  result: z.string(),
})

type Output = z.infer<typeof Output>

export class ShellScriptAction extends Action<Input, Output> {
  id = 'shell'
  name = 'Shell Script'
  description = 'Run a shell script.'
  dangerous = true

  input = Input
  output = Output

  getParameters(): Promise<{ bashScript: string }> {
    throw new Error('Method not implemented.')
  }

  async run(args: Input) {
    console.log('Running bash script', args)

    try {
      const result = 'bogus result, actually replace with logic here'
      console.log('shell result', result)
      return {
        result,
      }
    } catch (e) {
      return {
        result: `Error: ${(e as Error).toString()}`,
      }
    }
  }
}
