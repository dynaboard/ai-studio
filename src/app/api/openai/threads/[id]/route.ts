import { openai } from '@/lib/openai';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const thread = await openai.beta.threads.retrieve(params.id);

  const messages = await openai.beta.threads.messages.list(params.id, {
    order: 'asc',
  });
  const runs = await openai.beta.threads.runs.list(params.id, {
    order: 'asc',
  });

  return Response.json({
    thread,
    messages: messages.data,
    runs: runs.data,
  });
}
