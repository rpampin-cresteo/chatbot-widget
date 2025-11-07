'use client';

import { Message, useChat } from 'ai/react';
import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';

import { clearClientMemory, loadClientMemory, persistClientMemory } from '@/lib/memory/clientMemory';
import type { ChatMessage, SessionPayload, SourceCitation } from '@/lib/types';
import { nowIso } from '@/lib/utils';

import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Composer } from './Composer';
import { Feedback } from './Feedback';
import { Header } from './Header';
import { MessageList } from './MessageList';
import { Sources } from './Sources';
import { useWidgetStore } from './store';

type ChatWidgetProps = {
  mode?: 'embedded' | 'floating';
};


const ensureMessageId = (message: Message): string => {
  if (message.id) {
    return message.id;
  }
  const id = uuid();
  message.id = id;
  return id;
};

const ChatWidgetPanel = ({
  className,
  children,
  id
}: {
  className?: string;
  id?: string;
  children: React.ReactNode;
}) => (
  <section
    id={id}
    aria-label="AI assistant conversation panel"
    className={clsx(
      'flex h-full w-full max-w-[420px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition dark:border-slate-800 dark:bg-slate-950',
      className
    )}
  >
    {children}
  </section>
);

export const ChatWidget = ({ mode = 'embedded' }: ChatWidgetProps) => {
  const {
    floatingOpen,
    setFloatingOpen,
    session,
    setSession,
    sources,
    setSources,
    setFeedback
  } = useWidgetStore();

  const [displayName, setDisplayName] = useState('');
  const [loadingSession, setLoadingSession] = useState(true);
  const createdAtRef = useRef<Map<string, string>>(new Map());
  const hasHydratedHistory = useRef(false);

  const pendingPromptRef = useRef('');

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    reload,
    setMessages,
    setInput,
    data
  } = useChat({
    api: '/api/chat',
    body: {
      metadata: {
        displayName: displayName.trim() || undefined
      }
    },
    onResponse: () => {
      setSources([]);
      setFeedback(null);
      pendingPromptRef.current = '';
    },
    onFinish: (assistantMessage) => {
      ensureMessageId(assistantMessage);
      setFeedback({ messageId: assistantMessage.id, rating: 'neutral' });
      pendingPromptRef.current = '';
    },
    onError: (error) => {
      console.error('[widget] Chat request failed', error);
      const pendingPrompt = pendingPromptRef.current;
      setInput(pendingPrompt);
      setMessages((current) => {
        const restored = [...current];
        const hasUserMessage =
          pendingPrompt &&
          restored.some((message) => message.role === 'user' && message.content === pendingPrompt);
        if (!hasUserMessage && pendingPrompt) {
          restored.push({
            id: uuid(),
            role: 'user',
            content: pendingPrompt,
            createdAt: nowIso()
          });
        }
        restored.push({
          id: uuid(),
          role: 'assistant',
          content:
            'I could not reach the chat service right now. Please check that /packages/06-chat is running with valid Azure credentials and try again.',
          createdAt: nowIso()
        });
        return restored;
      });
      pendingPromptRef.current = '';
    }
  });

  const updateCreatedAtCache = useCallback((message: ChatMessage) => {
    createdAtRef.current.set(message.id, message.createdAt);
  }, []);

  const mapToChatMessage = useCallback(
    (message: Message, pending = false): ChatMessage => {
      const id = ensureMessageId(message);
      const cached = createdAtRef.current.get(id);
      const createdAt =
        typeof message.createdAt === 'string'
          ? message.createdAt
          : cached ?? (() => {
              const timestamp = nowIso();
              createdAtRef.current.set(id, timestamp);
              return timestamp;
            })();

      return {
        id,
        role: message.role as ChatMessage['role'],
        content: message.content,
        createdAt,
        pending
      };
    },
    []
  );

  const messagesForDisplay = useMemo<ChatMessage[]>(() => {
    if (messages.length === 0) {
      return [];
    }
    return messages.map((message, index) =>
      mapToChatMessage(message, isLoading && index === messages.length - 1)
    );
  }, [isLoading, mapToChatMessage, messages]);

  const commitDisplayName = useCallback(
    async (value: string) => {
      const next = value.trim();
      setDisplayName(next);
      try {
        const response = await fetch('/api/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(next ? { displayName: next } : {})
        });
        if (!response.ok) {
          throw new Error(`Failed to update display name: ${response.statusText}`);
        }
        const payload = (await response.json()) as SessionPayload;
        setSession(payload);
      } catch (error) {
        console.error('[widget] Unable to persist display name', error);
      }
    },
    [setSession]
  );

  const loadSession = useCallback(async () => {
    setLoadingSession(true);
    try {
      const response = await fetch('/api/session', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Session request failed: ${response.statusText}`);
      }
      const payload = (await response.json()) as SessionPayload;
      setSession(payload);
      setDisplayName(payload.displayName ?? '');
      if (payload.userId && !hasHydratedHistory.current) {
        const history = loadClientMemory(payload.userId);
        if (history.length > 0) {
          history.forEach(updateCreatedAtCache);
          setMessages(
            history.map((message) => ({
              id: message.id,
              role: message.role,
              content: message.content,
              createdAt: message.createdAt
            }))
          );
        }
        hasHydratedHistory.current = true;
      }
    } catch (error) {
      console.error('[widget] Failed to establish session', error);
    } finally {
      setLoadingSession(false);
    }
  }, [setSession, setMessages, updateCreatedAtCache]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!session || isLoading) {
      return;
    }
    const history = messages.map((message) => mapToChatMessage(message));
    history.forEach(updateCreatedAtCache);
    persistClientMemory(session.userId, history);
  }, [isLoading, mapToChatMessage, messages, session, updateCreatedAtCache]);

  useEffect(() => {
    if (!Array.isArray(data)) {
      return;
    }
    const collected: SourceCitation[] = [];
    data.forEach((entry: any) => {
      if (entry && entry.type === 'sources') {
        const value = entry.value ?? entry.data ?? entry.sources;
        if (Array.isArray(value)) {
          collected.push(...value);
        }
      }
    });
    if (collected.length > 0) {
      setSources(collected);
    }
  }, [data, setSources]);

  const submit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!input.trim()) {
        return;
      }
      pendingPromptRef.current = input.trim();
      handleSubmit(event);
    },
    [handleSubmit, input]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    createdAtRef.current.clear();
    if (session?.userId) {
      clearClientMemory(session.userId);
    }
    setSources([]);
    setFeedback(null);
  }, [session, setMessages, setSources, setFeedback]);

  const toggleFloating = () => {
    setFloatingOpen(!floatingOpen);
  };

  const handleCloseFloating = () => {
    setFloatingOpen(false);
  };

  const showFloatingLauncher = mode === 'floating';
  const showPanel = mode === 'embedded' || floatingOpen;
  const handleRetry = () => {
    reload();
  };

  const displayNameGreeting = displayName || session?.displayName || 'there';
  const canRetry = messagesForDisplay.some((message) => message.role === 'assistant');

  const renderWidget = (
    <ChatWidgetPanel
      id={mode === 'floating' ? 'chatbot-widget-panel' : undefined}
      className={mode === 'floating' ? 'h-[540px]' : 'min-h-[480px]'}
    >
      <Header
        displayName={displayName}
        greetingName={displayNameGreeting}
        onDisplayNameCommit={commitDisplayName}
        onClearHistory={clearHistory}
        onClose={mode === 'floating' ? handleCloseFloating : undefined}
        disabled={loadingSession}
      />
      <MessageList messages={messagesForDisplay} isLoading={isLoading || loadingSession} />
      <Sources sources={sources} />
      <Feedback
        disabled={isLoading || messagesForDisplay.length === 0}
        lastAssistantMessage={messagesForDisplay.filter((message) => message.role === 'assistant').at(-1)}
      />
      <Composer
        input={input}
        onInputChange={(event) => handleInputChange(event)}
        onSubmit={submit}
        onStop={stop}
        onRetry={handleRetry}
        onClear={clearHistory}
        disabled={loadingSession}
        isLoading={isLoading}
        canRetry={canRetry}
      />
    </ChatWidgetPanel>
  );

  return (
    <>
      {showPanel && (
        <div
          className={clsx(
            mode === 'floating'
              ? 'fixed bottom-6 right-6 z-50 flex w-full max-w-[420px]'
              : 'w-full'
          )}
        >
          {renderWidget}
        </div>
      )}
      {showFloatingLauncher && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
          <Button
            className="shadow-lg"
            aria-haspopup="dialog"
            aria-expanded={floatingOpen}
            aria-controls="chatbot-widget-panel"
            onClick={toggleFloating}
            variant="primary"
          >
            {floatingOpen ? 'Close Assistant' : 'Ask our Assistant'}
          </Button>
        </div>
      )}
    </>
  );
};
