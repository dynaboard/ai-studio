import { openai } from '@/lib/openai';
import { z } from 'zod';

const sendMessageSchema = z.object({
  threadID: z.string(),
  message: z.string(),
});

export async function POST(request: Request) {
  const data = sendMessageSchema.parse(await request.json());
  const _message = await openai.beta.threads.messages.create(data.threadID, {
    content: data.message,
    role: 'user',
    file_ids: [],
  });
  const messages = await openai.beta.threads.messages.list(data.threadID, {
    order: 'asc',
  });
  return Response.json({
    messages: messages.data,
  });
}
