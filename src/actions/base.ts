import { ZodType, z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

export abstract class Action<
  InputType extends z.TypeOf<ZodType>,
  OutputType extends z.TypeOf<ZodType>,
> {
  abstract id: string
  abstract name: string
  abstract description: string

  abstract input: ZodType
  abstract output: ZodType

  dangerous = false

  component: React.FC<OutputType> | undefined = undefined

  abstract getParameters(): Promise<InputType>

  abstract run(args: InputType): Promise<OutputType>

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      dangerous: this.dangerous,
      inputSchema: zodToJsonSchema(this.input),
      outputSchema: zodToJsonSchema(this.output),
    }
  }
}
