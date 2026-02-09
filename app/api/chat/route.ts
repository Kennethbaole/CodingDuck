// Import tool function from ai package and z from zod for schema validation
import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { Octokit } from 'octokit';

const model = google('gemini-2.5-flash');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
        system: "Guide the user through debugging instead of simply giving the answer. Make sure to ask clarifying questions and to help the user think through problems step by step",
        model,
        messages: await convertToModelMessages(messages),
        // Allow up to 3 steps: tool call -> tool result -> text response
        stopWhen: stepCountIs(5),
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
                    try {
                        return {
                            success: true, 
                            step,
                            finding,
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: String(error),
                        }
                    }
                },
            }),
            getIssue: tool({
                description: 'Get any issues from user inputted repo information',
                inputSchema: z.object({
                    owner: z.string().describe('Who owns the repo'),
                    repo: z.string().describe('The name of the repository'),
                    issueNumber: z.number().describe('The issue number')
                }),
                execute: async ({ owner, repo, issueNumber }) => {
                    try {
                        const response = await octokit.rest.issues.get({
                            owner,
                            repo, 
                            issue_number: issueNumber 
                        })
                        return {
                            success: true, 
                            title: response.data.title, 
                            body: response.data.body,
                            state: response.data.state, 
                        }
                    } catch (error) {
                        return {
                            success: false,
                            error: String(error)
                        }
                    }
                },
            }),
        },
        // Note: If you see blank responses in the UI, the model generated a tool call
        // instead of text. Access tool results via message.parts with type 'tool-invocation'
    });

    return result.toUIMessageStreamResponse();
}