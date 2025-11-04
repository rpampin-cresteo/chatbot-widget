export type MessageRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  pending?: boolean;
}

export interface ChatRequestMessage {
  role: MessageRole;
  content: string;
}

export interface ChatMetadata {
  displayName?: string;
  userId?: string;
}

export interface ChatRequestPayload {
  messages: ChatRequestMessage[];
  metadata?: ChatMetadata;
}

export interface SourceCitation {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  sourceType?: string;
}

export interface AssistantFeedback {
  rating: 'positive' | 'negative' | 'neutral';
  messageId: string;
  userId: string;
  comment?: string;
}

export interface SessionPayload {
  userId: string;
  displayName?: string;
}
