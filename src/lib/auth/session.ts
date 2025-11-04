import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createHmac, randomUUID } from 'node:crypto';

import { env } from '../env';
import type { SessionPayload } from '../types';

const DISPLAY_NAME_COOKIE = 'cw_display_name';
const BASE64_REGEX = /^[A-Za-z0-9_-]+$/;

const encodePayload = (payload: SessionPayload) =>
  Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');

const decodePayload = (encoded: string): SessionPayload | null => {
  if (!BASE64_REGEX.test(encoded)) {
    return null;
  }
  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf8');
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
};

const sign = (value: string) =>
  createHmac('sha256', env.SESSION_COOKIE_SECRET).update(value).digest('base64url');

const buildCookieValue = (payload: SessionPayload) => {
  const encoded = encodePayload(payload);
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
};

const parseCookieValue = (value: string | undefined): SessionPayload | null => {
  if (!value) {
    return null;
  }
  const [encoded, signature] = value.split('.');
  if (!encoded || !signature) {
    return null;
  }
  if (sign(encoded) !== signature) {
    return null;
  }
  return decodePayload(encoded);
};

const maxAgeSeconds = env.SESSION_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;

export const ensureSession = (request: NextRequest): SessionPayload => {
  const cookieStore = cookies();
  const existing = parseCookieValue(cookieStore.get(env.SESSION_COOKIE_NAME)?.value);

  if (existing?.userId) {
    return existing;
  }

  const freshSession: SessionPayload = {
    userId: randomUUID()
  };

  cookieStore.set(env.SESSION_COOKIE_NAME, buildCookieValue(freshSession), {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeSeconds,
    path: '/'
  });

  return freshSession;
};

export const refreshSessionCookie = (payload: SessionPayload, secure: boolean) => {
  cookies().set(env.SESSION_COOKIE_NAME, buildCookieValue(payload), {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: maxAgeSeconds,
    path: '/'
  });
};

export const readDisplayName = (): string | undefined => {
  const value = cookies().get(DISPLAY_NAME_COOKIE)?.value;
  return value ? Buffer.from(value, 'base64url').toString('utf8') : undefined;
};

export const writeDisplayName = (displayName: string | undefined, secure: boolean) => {
  const cookieStore = cookies();
  if (!displayName) {
    cookieStore.delete(DISPLAY_NAME_COOKIE);
    return;
  }
  const encoded = Buffer.from(displayName, 'utf8').toString('base64url');
  cookieStore.set(DISPLAY_NAME_COOKIE, encoded, {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    maxAge: maxAgeSeconds,
    path: '/'
  });
};
