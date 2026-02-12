'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Loader2 } from 'lucide-react';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/50 via-slate-950 to-purple-950/30 pointer-events-none" />

      <div className="relative max-w-xl mx-auto h-[calc(100vh-2rem)] flex flex-col">

        {/* Minimal Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-slate-400">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium tracking-wide">duckling</span>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-6 pb-4">
            {messages.length === 0 && (
              <div className="text-center py-20">
                <p className="text-slate-500 text-sm">what are you debugging today?</p>
              </div>
            )}

            {messages.map(message => (
              <div key={message.id} className="space-y-2">
                {message.parts.map((part, i) => {
                  if (part.type === 'text') {
                    return (
                      <div
                        key={`${message.id}-${i}`}
                        className={`${message.role === 'user' ? 'flex justify-end' : ''}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            message.role === 'user'
                              ? 'bg-violet-600/80 text-violet-50'
                              : 'bg-slate-800/80 text-slate-200'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{part.text}</p>
                        </div>
                      </div>
                    );
                  }

                  if (part.type.startsWith('tool-')) {
                    const toolPart = part as { type: string; state?: string; output?: unknown };
                    const toolName = part.type.replace('tool-', '');

                    return (
                      <div
                        key={`${message.id}-${i}`}
                        className="max-w-[85%] rounded-xl px-3 py-2 bg-slate-900/60 border border-slate-800/50"
                      >
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {toolPart.state === 'result' ? (
                            <span className="text-emerald-500">●</span>
                          ) : (
                            <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
                          )}
                          <span className="font-mono">{toolName}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-1 px-4 py-3 w-fit rounded-2xl bg-slate-800/80">
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse [animation-delay:300ms]" />
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="pt-4 pb-2">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (input.trim() && !isLoading) {
                sendMessage({ text: input });
                setInput('');
              }
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              placeholder="describe your bug..."
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-slate-900/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/50"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
              className="bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-30"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
