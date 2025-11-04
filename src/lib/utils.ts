import { env } from './env';
import type { ChatMessage, ChatRequestMessage } from './types';

const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]+/g;

export const sanitizeContent = (value: string): string =>
  value.replace(CONTROL_CHARS, '').trim();

export const clampMessages = <T>(messages: T[], limit: number): T[] =>
  messages.slice(Math.max(messages.length - limit, 0));

export const toRequestMessages = (messages: ChatMessage[]): ChatRequestMessage[] =>
  messages.map(({ role, content }) => ({
    role,
    content: sanitizeContent(content)
  }));

export const normalizeOrigin = (origin: string | null): string | null => {
  if (!origin) {
    return null;
  }
  try {
    const url = new URL(origin);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
};

export const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) {
    return true;
  }
  const normalized = normalizeOrigin(origin);
  if (!normalized) {
    return false;
  }
  if (env.allowedOrigins.length === 0) {
    return true;
  }
  return env.allowedOrigins.includes(normalized);
};

export const buildCorsHeaders = (origin: string | null) => {
  const normalized = normalizeOrigin(origin);
  const allowOrigin =
    env.allowedOrigins.length === 0
      ? normalized ?? '*'
      : normalized && env.allowedOrigins.includes(normalized)
        ? normalized
        : env.allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin ?? env.WIDGET_BASE_URL,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers':
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  };
};

export const nowIso = () => new Date().toISOString();
