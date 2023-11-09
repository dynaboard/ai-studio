import { Action } from '@/actions/base';
import { z } from 'zod';

const Input = z.object({
  bashScript: z.string(),
});

type Input = z.infer<typeof Input>;

const Output = z.object({
  result: z.string(),
});

type Output = z.infer<typeof Output>;

export class ShellScriptAction extends Action<Input, Output> {
  id = 'shell';
  name = 'Shell Script';
  description = 'Run a shell script.';
  dangerous = true;

  input = Input;
  output = Output;

  async run(_args: Input) {
    console.log('Running bash script', _args);
    return {
      result: 'success',
    };
  }
}
