import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { ensureSession, readDisplayName, writeDisplayName } from '@/lib/auth/session';
import { env } from '@/lib/env';
import { buildCorsHeaders, isOriginAllowed } from '@/lib/utils';

const payloadSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional()
});

const isSecure = () => process.env.NODE_ENV === 'production';

const withCors = (origin: string | null, response: NextResponse) => {
  const headers = buildCorsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
};

export async function OPTIONS(request: NextRequest) {
  return withCors(request.headers.get('origin'), new NextResponse(null, { status: 204 }));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!isOriginAllowed(origin)) {
    return withCors(origin, new NextResponse('Forbidden', { status: 403 }));
  }

  const session = ensureSession(request);
  const displayName = readDisplayName();

  const response = NextResponse.json(
    {
      userId: session.userId,
      displayName
    },
    {
      status: 200
    }
  );

  if (displayName) {
    response.headers.set('X-Chat-Display-Name', displayName);
  }

  return withCors(origin, response);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!isOriginAllowed(origin)) {
    return withCors(origin, new NextResponse('Forbidden', { status: 403 }));
  }

  const json = await request.json().catch(() => ({}));
  const { displayName } = payloadSchema.parse(json);

  if (displayName) {
    writeDisplayName(displayName, isSecure());
  } else {
    writeDisplayName(undefined, isSecure());
  }

  const session = ensureSession(request);

  return withCors(
    origin,
    NextResponse.json(
      {
        userId: session.userId,
        displayName
      },
      { status: 200 }
    )
  );
}
