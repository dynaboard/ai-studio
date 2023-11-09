import { openai } from '@/lib/openai';
import { z } from 'zod';

const submitToolOutputSchema = z.object({
  threadID: z.string(),
  toolOutputs: z.array(
    z.object({
      callID: z.string(),
      output: z.unknown(),
    })
  ),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = submitToolOutputSchema.parse(await request.json());
  const run = await openai.beta.threads.runs.submitToolOutputs(
    data.threadID,
    params.id,
    {
      tool_outputs: data.toolOutputs.map((output) => {
        return {
          output: JSON.stringify(output.output),
          tool_call_id: output.callID,
        };
      }),
    }
  );
  return Response.json({
    run,
  });
}
