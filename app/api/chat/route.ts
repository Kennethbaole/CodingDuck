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
            weather: tool({
                // Description helps the model understand when to use this tool
                description: 'Get the weather in a location (fahrenheit)',
                // Input schema using Zod - model will extract location from conversation
                // If it can't determine the location, it will ask the user
                inputSchema: z.object({
                    location: z.string().describe('The location to get the weather for'),
                }),
                // Execute function runs on the server - can fetch real data from external APIs
                // This simulates weather data with a random temperature
                execute: async ({ location }) => {
                    const temperature = Math.round(Math.random() * (90 - 32) + 32);
                    return {
                        location,
                        temperature,
                    };
                },
            }),
        },
        // Note: If you see blank responses in the UI, the model generated a tool call
        // instead of text. Access tool results via message.parts with type 'tool-invocation'
    });

    return result.toUIMessageStreamResponse();
}