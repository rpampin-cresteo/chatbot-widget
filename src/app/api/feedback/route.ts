import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { ensureSession } from '@/lib/auth/session';
import { env } from '@/lib/env';
import { buildCorsHeaders, isOriginAllowed } from '@/lib/utils';

const feedbackSchema = z.object({
  messageId: z.string().trim().min(1),
  rating: z.union([z.literal('positive'), z.literal('negative'), z.literal('neutral')]),
  comment: z.string().trim().max(500).optional()
});

type FeedbackEntry = z.infer<typeof feedbackSchema> & { userId: string; createdAt: number };

const inMemoryStore = new Map<string, FeedbackEntry>();

const withCors = (origin: string | null, response: NextResponse) => {
  const headers = buildCorsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
  return response;
};

export async function OPTIONS(request: NextRequest) {
  return withCors(request.headers.get('origin'), new NextResponse(null, { status: 204 }));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!isOriginAllowed(origin)) {
    return withCors(origin, new NextResponse('Forbidden', { status: 403 }));
  }

  const session = ensureSession(request);
  const body = await request.json().catch(() => null);
  if (!body) {
    return withCors(origin, new NextResponse('Invalid JSON', { status: 400 }));
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(origin, new NextResponse(parsed.error.message, { status: 422 }));
  }

  if (env.LOG_PII) {
    console.log('[widget] Feedback received', {
      ...parsed.data,
      userId: session.userId,
      createdAt: new Date().toISOString()
    });
  }

  inMemoryStore.set(`${session.userId}:${parsed.data.messageId}`, {
    ...parsed.data,
    userId: session.userId,
    createdAt: Date.now()
  });

  return withCors(origin, new NextResponse(null, { status: 204 }));
}
