import { openai } from '@/lib/openai';
import { z } from 'zod';

const createRunSchema = z.object({
  threadID: z.string(),
  assistantID: z.string(),
  additionalInstructions: z.string().optional(),
});

export async function POST(request: Request) {
  const data = createRunSchema.parse(await request.json());
  const run = await openai.beta.threads.runs.create(data.threadID, {
    assistant_id: data.assistantID,
    instructions: data.additionalInstructions,
  });
  return Response.json({
    run,
  });
}
