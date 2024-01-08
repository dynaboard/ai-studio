import { DynaboardAIStudio } from '../dynaboard.ts'

const maxInput = 10
const minInput = 1

const range = maxInput - minInput
const buffer = new Uint32Array(1)
crypto.getRandomValues(buffer)
const randomNumber = (buffer[0] / 0xffffffff) * range + minInput

await new DynaboardAIStudio().send({
  randomNumber: Math.round(randomNumber),
})

Deno.exit(0)
