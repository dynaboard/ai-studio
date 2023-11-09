import { openai } from '@/lib/openai';
import { z } from 'zod';

const createThreadSchema = z.object({
  message: z.string(),
  assistantID: z.string(),
  additionalInstructions: z.string().optional(),
  model: z.string().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);

  const threadIDs = url.searchParams.getAll('threadID[]');

  const threads = await Promise.all(
    threadIDs.map(async (id) => {
      const thread = await openai.beta.threads.retrieve(id);

      const messages = await openai.beta.threads.messages.list(id, {
        order: 'asc',
      });
      const runs = await openai.beta.threads.runs.list(id, {
        order: 'asc',
      });

      return {
        thread,
        messages: messages.data,
        runs: runs.data,
      };
    })
  );

  return Response.json({
    threads,
  });
}

export async function POST(request: Request) {
  const data = createThreadSchema.parse(await request.json());
  const thread = await openai.beta.threads.create({
    messages: [
      {
        content: data.message,
        role: 'user',
        file_ids: [],
      },
    ],
  });
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: data.assistantID,
    instructions: data.additionalInstructions,
    model: data.model || 'gpt-3.5-turbo-1106',
  });

  return Response.json({
    thread,
    run,
  });
}
