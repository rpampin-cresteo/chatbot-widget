import { NextRequest, NextResponse } from 'next/server';
import {
  StreamingTextResponse,
  experimental_StreamData as ExperimentalStreamData
} from 'ai';
import { z } from 'zod';

import { ensureSession } from '@/lib/auth/session';
import { env } from '@/lib/env';
import { fetchServerMemory, persistServerMemory } from '@/lib/memory/serverMemory';
import type { ChatRequestMessage, SourceCitation } from '@/lib/types';
import {
  buildCorsHeaders,
  clampMessages,
  isOriginAllowed,
  normalizeOrigin,
  sanitizeContent
} from '@/lib/utils';

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 45;

type RateBucket = { count: number; resetAt: number };

const rateBuckets = new Map<string, RateBucket>();

const messageSchema = z.object({
  role: z.union([z.literal('user'), z.literal('assistant'), z.literal('system')]),
  content: z.string().max(2000)
});

const payloadSchema = z.object({
  messages: z.array(messageSchema).min(1),
  metadata: z
    .object({
      displayName: z.string().trim().max(80).optional()
    })
    .optional()
});

const withCors = (origin: string | null, response: NextResponse) => {
  const headers = buildCorsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
  return response;
};

const getClientId = (request: NextRequest, userId: string) => {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',').map((value) => value.trim())[0] ?? request.ip ?? 'local';
  return `${userId}:${ip}`;
};

const touchRateLimit = (bucketKey: string) => {
  const now = Date.now();
  const bucket = rateBuckets.get(bucketKey);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(bucketKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.max(0, bucket.resetAt - now) };
  }
  bucket.count += 1;
  return { allowed: true };
};

const sanitizeMessages = (messages: z.infer<typeof messageSchema>[]): ChatRequestMessage[] =>
  clampMessages(messages, 20).map((message) => ({
    role: message.role,
    content: sanitizeContent(message.content)
  }));

const forwardChatRequest = async (
  request: NextRequest,
  payload: ReturnType<typeof payloadSchema.parse>,
  userId: string,
  serverMemory: string | null,
  streamData: InstanceType<typeof ExperimentalStreamData>
) => {
  const upstreamResponse = await fetch(env.CHAT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'X-Widget-UserId': userId,
      'X-Widget-Origin': normalizeOrigin(request.headers.get('origin')) ?? ''
    },
    body: JSON.stringify({
      ...payload,
      metadata: {
        ...payload.metadata,
        userId,
        serverMemory
      }
    })
  });

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    const errorText = await upstreamResponse.text().catch(() => upstreamResponse.statusText);
    throw new Error(
      `Upstream chat service responded with ${upstreamResponse.status}: ${errorText}`
    );
  }

  const [forwardStream, inspectStream] = upstreamResponse.body.tee();

  let assistantBuffer = '';

  const inspector = inspectStream.getReader();
  const decoder = new TextDecoder();

  (async () => {
    try {
      let buffer = '';
      while (true) {
        const { value, done } = await inspector.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        let boundary: number;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const dataLines = rawEvent
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.replace(/^data:\s*/, ''));
          if (dataLines.length === 0) {
            continue;
          }
          const payloadLine = dataLines.join('');
          if (payloadLine === '[DONE]') {
            continue;
          }
          try {
            const parsed = JSON.parse(payloadLine) as {
              type?: string;
              data?: string;
              delta?: string;
              sources?: SourceCitation[];
            };
            if (parsed.type === 'sources' && Array.isArray(parsed.sources)) {
              streamData.append('sources', parsed.sources as SourceCitation[]);
              continue;
            }
            const token = parsed.data ?? parsed.delta;
            if (typeof token === 'string') {
              assistantBuffer += token;
            }
          } catch {
            assistantBuffer += payloadLine;
          }
        }
      }
    } catch (error) {
      if (env.LOG_PII) {
        console.warn('[widget] Stream inspector error', error);
      }
    } finally {
      streamData.close();
      if (env.SERVER_MEMORY_ENABLED && assistantBuffer.trim()) {
        await persistServerMemory(
          userId,
          assistantBuffer.trim().slice(-2000) // keep recent context
        );
      }
    }
  })().catch((error) => {
    if (env.LOG_PII) {
      console.warn('[widget] Stream monitor failure', error);
    }
  });

  return { stream: forwardStream };
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

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(
      origin,
      new NextResponse(parsed.error.message, {
        status: 422
      })
    );
  }

  const sanitized = {
    ...parsed.data,
    messages: sanitizeMessages(parsed.data.messages)
  };

  const rateKey = getClientId(request, session.userId);
  const rateStatus = touchRateLimit(rateKey);
  if (!rateStatus.allowed) {
    return withCors(
      origin,
      new NextResponse('Rate limit exceeded', {
        status: 429,
        headers: rateStatus.retryAfter
          ? { 'Retry-After': Math.ceil(rateStatus.retryAfter / 1000).toString() }
          : undefined
      })
    );
  }

  const streamData = new ExperimentalStreamData();
  const serverMemory = await fetchServerMemory(session.userId);

  try {
    const { stream } = await forwardChatRequest(
      request,
      sanitized,
      session.userId,
      serverMemory,
      streamData
    );

    const response = new StreamingTextResponse(stream, {
      status: 200,
      headers: buildCorsHeaders(origin),
      streamData
    });

    return response;
  } catch (error) {
    streamData.close();
    const message =
      error instanceof Error ? error.message : 'Failed to proxy upstream chat request';
    return withCors(origin, new NextResponse(message, { status: 502 }));
  }
}
