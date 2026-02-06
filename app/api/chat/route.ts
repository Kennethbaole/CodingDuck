import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';

const model = google('gemini-2.5-flash');

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
        model,
        messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
}