import { dialog } from '@tauri-apps/api'
import { z } from 'zod'

import { Action } from '@/actions/base'

const Input = z.object({
  location: z.string(),
})

type Input = z.infer<typeof Input>

const Output = z.object({
  temperature: z.number(),
  unit: z.string(),
})

type Output = z.infer<typeof Output>

export class WeatherAction extends Action<Input, Output> {
  id = 'weather'
  name = 'Weather'
  description = 'Get the weather for a location.'

  input = Input
  output = Output

  async getParameters() {
    await dialog.ask('What location?')
    let location = 'Charleston, SC'
    return {
      location,
    }
  }

  component = (output: Output) => {
    return (
      <div>
        Temperature: {output.temperature} {output.unit}
      </div>
    )
  }

  async run(_args: Input) {
    console.log('Getting weather for:', _args)
    return {
      temperature: 72,
      unit: 'F',
    }
  }
}
