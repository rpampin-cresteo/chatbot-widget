import { z } from 'zod';

const DEFAULT_CHAT_API_URL = 'http://127.0.0.1:6060/api/chat';
const DEFAULT_WIDGET_BASE_URL = 'http://127.0.0.1:3003';
const DEFAULT_SESSION_SECRET = 'development-session-secret-change-me';

const envSchema = z
  .object({
    CHAT_API_URL: z.string().trim().url().optional(),
    CHAT_API_URL_RUNTIME: z.string().trim().url().optional(),
    AZURE_OPENAI_ENDPOINT: z.string().trim().optional(),
    AZURE_OPENAI_API_KEY: z.string().trim().optional(),
    AZURE_OPENAI_DEPLOYMENT: z.string().trim().optional(),
    AZURE_OPENAI_API_VERSION: z.string().trim().default('2024-08-01-preview'),
    WIDGET_BASE_URL: z.string().trim().url().optional(),
    WIDGET_BASE_URL_RUNTIME: z.string().trim().url().optional(),
    ALLOWED_ORIGINS: z.string().trim().default(''),
    ALLOWED_ORIGINS_RUNTIME: z.string().trim().optional(),
    REDIS_URL: z.string().trim().optional(),
    REDIS_TOKEN: z.string().trim().optional(),
    SERVER_MEMORY_ENABLED: z.string().trim().optional().default('false'),
    SESSION_COOKIE_NAME: z.string().trim().default('cw_session'),
    SESSION_COOKIE_SECRET: z.string().trim().min(16, 'Session cookie secret must be strong').optional(),
    SESSION_COOKIE_MAX_AGE_DAYS: z.coerce.number().int().min(1).default(30),
    LOG_PII: z.string().trim().optional().default('false')
  })
  .transform((raw) => {
    const isProduction = process.env.NODE_ENV === 'production';

    const chatApiUrl =
      raw.CHAT_API_URL_RUNTIME ?? raw.CHAT_API_URL ?? process.env.CHAT_PORT
        ? `http://127.0.0.1:${process.env.CHAT_PORT}/api/chat`
        : DEFAULT_CHAT_API_URL;
    const widgetBaseUrl =
      raw.WIDGET_BASE_URL_RUNTIME ?? raw.WIDGET_BASE_URL ?? DEFAULT_WIDGET_BASE_URL;
    const allowedOrigins =
      raw.ALLOWED_ORIGINS_RUNTIME ?? raw.ALLOWED_ORIGINS ?? '';
    const sessionSecret =
      raw.SESSION_COOKIE_SECRET ??
      (isProduction ? undefined : DEFAULT_SESSION_SECRET);

    if (isProduction) {
      if (!raw.CHAT_API_URL) {
        throw new Error('CHAT_API_URL must be configured in production.');
      }
      if (!sessionSecret) {
        throw new Error('SESSION_COOKIE_SECRET must be configured in production.');
      }
    }

    return {
      ...raw,
      CHAT_API_URL: chatApiUrl,
      WIDGET_BASE_URL: widgetBaseUrl,
      SESSION_COOKIE_SECRET: sessionSecret ?? DEFAULT_SESSION_SECRET,
      SERVER_MEMORY_ENABLED: raw.SERVER_MEMORY_ENABLED.toLowerCase() === 'true',
      LOG_PII: raw.LOG_PII?.toLowerCase() === 'true',
      allowedOrigins: allowedOrigins
        ? allowedOrigins.split(',').map((origin) => origin.trim()).filter(Boolean)
        : []
    };
  });

export const env = envSchema.parse({
  CHAT_API_URL: process.env.CHAT_API_URL,
  CHAT_API_URL_RUNTIME: process.env.CHAT_API_URL_RUNTIME,
  AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_DEPLOYMENT: process.env.AZURE_OPENAI_DEPLOYMENT,
  AZURE_OPENAI_API_VERSION: process.env.AZURE_OPENAI_API_VERSION,
  WIDGET_BASE_URL: process.env.WIDGET_BASE_URL,
  WIDGET_BASE_URL_RUNTIME: process.env.WIDGET_BASE_URL_RUNTIME,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  ALLOWED_ORIGINS_RUNTIME: process.env.ALLOWED_ORIGINS_RUNTIME,
  REDIS_URL: process.env.REDIS_URL,
  REDIS_TOKEN: process.env.REDIS_TOKEN,
  SERVER_MEMORY_ENABLED: process.env.SERVER_MEMORY_ENABLED,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
  SESSION_COOKIE_SECRET: process.env.SESSION_COOKIE_SECRET,
  SESSION_COOKIE_MAX_AGE_DAYS: process.env.SESSION_COOKIE_MAX_AGE_DAYS,
  LOG_PII: process.env.LOG_PII
});

export type Environment = typeof env;
