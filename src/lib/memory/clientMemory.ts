import type { ChatMessage } from '../types';
import { clampMessages } from '../utils';

const MAX_MESSAGES = 20;

const storageKey = (userId: string) => `cw-memory::${userId}`;

const hasWindow = () => typeof window !== 'undefined';

export const loadClientMemory = (userId: string): ChatMessage[] => {
  if (!hasWindow()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) {
      return [];
    }
    const messages = JSON.parse(raw) as ChatMessage[];
    return clampMessages(messages, MAX_MESSAGES);
  } catch (error) {
    console.warn('[widget] Failed to load client memory', error);
    return [];
  }
};

export const persistClientMemory = (userId: string, messages: ChatMessage[]) => {
  if (!hasWindow()) {
    return;
  }
  try {
    const trimmed = clampMessages(messages, MAX_MESSAGES);
    window.localStorage.setItem(storageKey(userId), JSON.stringify(trimmed));
  } catch (error) {
    console.warn('[widget] Failed to persist client memory', error);
  }
};

export const clearClientMemory = (userId: string) => {
  if (!hasWindow()) {
    return;
  }
  try {
    window.localStorage.removeItem(storageKey(userId));
  } catch (error) {
    console.warn('[widget] Failed to clear client memory', error);
  }
};
