'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  // AI SDK v6 uses sendMessage instead of handleSubmit
  // We manage input state separately with useState
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();

  // Check if currently loading
  const isLoading = status === 'streaming' || status === 'submitted';

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {/* Render each message in the conversation */}
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap mb-4">
          {/* Label messages by role */}
          <span className="font-bold">
            {message.role === 'user' ? 'You: ' : 'Duckling: '}
          </span>
          {/* Render message parts - can be text or tool calls */}
          {message.parts.map((part, i) => {
            // Text parts
            if (part.type === 'text') {
              return <span key={`${message.id}-${i}`}>{part.text}</span>;
            }
            // Tool parts (type is 'tool-{toolName}')
            if (part.type.startsWith('tool-')) {
              const toolPart = part as { type: string; state?: string; output?: unknown };
              return (
                <div key={`${message.id}-${i}`} className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded mt-2 text-sm">
                  <div className="text-zinc-500">Tool: {part.type.replace('tool-', '')}</div>
                  {toolPart.state === 'result' && toolPart.output !== undefined && (
                    <div className="text-green-600 dark:text-green-400">
                      Result: {String(JSON.stringify(toolPart.output))}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="text-zinc-500 mb-4">Duckling is thinking...</div>
      )}

      {/* Chat input form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput('');
          }
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Ask Duckling something..."
          onChange={e => setInput(e.target.value)}
          disabled={isLoading}
        />
      </form>
    </div>
  );
}