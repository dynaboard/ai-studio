import { z } from 'zod'

import { BaseTool, RunContext, ToolParameter } from '@/tools/base'

export default class RandomNumberTool extends BaseTool {
  name = 'Random Number Generator'
  description = 'Generate a random number given a min and max'
  // TODO: undo before shipping
  requiredModels = ['CodeLlama 7B Instruct']

  parameters: ToolParameter[] = [
    {
      name: 'min',
      description: 'The minimum number that can be generated',
      type: 'number',
    },
    {
      name: 'max',
      description: 'The maximum number that can be generated',
      type: 'number',
    },
  ]

  async run(_ctx: RunContext, min: unknown, max: unknown) {
    const { value: minInput } = z
      .object({
        name: z.literal('min'),
        value: z.coerce.number(),
      })
      .parse(min)

    const { value: maxInput } = z
      .object({
        name: z.literal('max'),
        value: z.coerce.number(),
      })
      .parse(max)

    if (minInput >= maxInput) {
      throw new Error('Min must be less than max')
    }
    const range = maxInput - minInput
    const buffer = new Uint32Array(1)
    crypto.getRandomValues(buffer)
    const randomNumber = (buffer[0] / 0xffffffff) * range + minInput
    return Math.floor(randomNumber)
  }
}
