import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

import { DynaboardAIStudio } from '../dynaboard.ts'

const studio = new DynaboardAIStudio()

const params = studio.getParams()

const [{ value: minInput }, { value: maxInput }] = z
  .tuple([
    z.object({
      name: z.literal('min'),
      value: z.coerce.number(),
    }),
    z.object({
      name: z.literal('max'),
      value: z.coerce.number(),
    }),
  ])
  .parse(params)

const range = maxInput - minInput
const buffer = new Uint32Array(1)
crypto.getRandomValues(buffer)
const randomNumber = (buffer[0] / 0xffffffff) * range + minInput

await studio.reply(Math.round(randomNumber))

Deno.exit(0)
