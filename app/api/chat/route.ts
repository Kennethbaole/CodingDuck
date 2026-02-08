// Import tool function from ai package and z from zod for schema validation
import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const model = google('gemini-2.5-flash');

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
        system: "Guide the user through debugging instead of simply giving the answer. Make sure to ask clarifying questions and to help the user think through problems step by step",
        model,
        messages: await convertToModelMessages(messages),
        // Allow up to 3 steps: tool call -> tool result -> text response
        stopWhen: stepCountIs(3),
        // Define tools object with available tools for the model
        tools: {
            logDebugStep: tool({
                // tells ai when to use 
                description: 'Logs debugging process',
                // defines data ai must provide (validated by Zod)
                inputSchema: z.object({
                    step: z.string().describe('the debugging step that user complete'),
                    finding: z.string().describe('What the user discovered in this step')
                }),
                // Execute function runs on the server - can fetch real data from external APIs
                execute: async ({ step, finding }) => {
                    return {
                        step,
                        finding,
                    };
                },
            }),
        },
        // Note: If you see blank responses in the UI, the model generated a tool call
        // instead of text. Access tool results via message.parts with type 'tool-invocation'
    });

    return result.toUIMessageStreamResponse();
}