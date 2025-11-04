import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { ChatMessage } from '@/lib/types';

import { IconButton } from '../ui/IconButton';

type MessageListProps = {
  messages: ChatMessage[];
  isLoading: boolean;
};

const roleStyles: Record<ChatMessage['role'], string> = {
  user: 'ml-auto bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
  assistant: 'mr-auto bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
  system: 'mx-auto bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
};

const roleLabels: Record<ChatMessage['role'], string> = {
  user: 'You',
  assistant: 'Assistant',
  system: 'System'
};

export const MessageList = ({ messages, isLoading }: MessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }
    node.scrollTo({
      top: node.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages]);

  const handleCopy = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch (error) {
      console.warn('[widget] Copy failed', error);
    }
  };

  return (
    <div
      ref={scrollRef}
      className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 pt-5"
      aria-live="polite"
    >
      {messages.length === 0 ? (
        <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
          Ask anything about our docs, search results, or troubleshooting steps. The assistant
          can cite sources and remembers the last 20 turns locally.
        </div>
      ) : null}
      {messages.map((message) => (
        <article
          key={message.id}
          className={`flex max-w-[90%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm shadow-sm ${roleStyles[message.role]}`}
          data-author={message.role}
        >
          <header className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            <span>{roleLabels[message.role]}</span>
            <time className="text-[0.65rem] font-normal uppercase text-slate-400 dark:text-slate-500">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </time>
          </header>
          <div className="prose prose-sm max-w-none text-left text-current dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            {message.pending ? (
              <span className="mt-2 inline-flex items-center gap-2 text-xs text-slate-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden />
                Streaming...
              </span>
            ) : null}
          </div>
          <footer className="flex justify-end">
            <IconButton aria-label="Copy message" onClick={() => handleCopy(message)}>
              Copy
            </IconButton>
          </footer>
        </article>
      ))}
      {isLoading ? (
        <div className="ml-auto flex max-w-[85%] items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-sm dark:bg-slate-100 dark:text-slate-900">
          <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" aria-hidden />
          <span>Thinking...</span>
        </div>
      ) : null}
    </div>
  );
};
