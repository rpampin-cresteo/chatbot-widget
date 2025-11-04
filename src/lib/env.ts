import { z } from 'zod';

const envSchema = z
  .object({
    CHAT_API_URL: z.string().trim().url(),
    AZURE_OPENAI_ENDPOINT: z.string().trim().optional(),
    AZURE_OPENAI_API_KEY: z.string().trim().optional(),
    AZURE_OPENAI_DEPLOYMENT: z.string().trim().optional(),
    AZURE_OPENAI_API_VERSION: z.string().trim().default('2024-08-01-preview'),
    WIDGET_BASE_URL: z.string().trim().url().default('http://localhost:3003'),
    ALLOWED_ORIGINS: z.string().trim().default(''),
    REDIS_URL: z.string().trim().optional(),
    REDIS_TOKEN: z.string().trim().optional(),
    SERVER_MEMORY_ENABLED: z.string().trim().optional().default('false'),
    SESSION_COOKIE_NAME: z.string().trim().default('cw_session'),
    SESSION_COOKIE_SECRET: z.string().trim().min(16, 'Session cookie secret must be strong'),
    SESSION_COOKIE_MAX_AGE_DAYS: z.coerce.number().int().min(1).default(30),
    LOG_PII: z.string().trim().optional().default('false')
  })
  .transform((raw) => ({
    ...raw,
    SERVER_MEMORY_ENABLED: raw.SERVER_MEMORY_ENABLED.toLowerCase() === 'true',
    LOG_PII: raw.LOG_PII?.toLowerCase() === 'true',
    allowedOrigins: raw.ALLOWED_ORIGINS
      ? raw.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
      : []
  }));

export const env = envSchema.parse({
  CHAT_API_URL: process.env.CHAT_API_URL,
  AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_DEPLOYMENT: process.env.AZURE_OPENAI_DEPLOYMENT,
  AZURE_OPENAI_API_VERSION: process.env.AZURE_OPENAI_API_VERSION,
  WIDGET_BASE_URL: process.env.WIDGET_BASE_URL,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  REDIS_URL: process.env.REDIS_URL,
  REDIS_TOKEN: process.env.REDIS_TOKEN,
  SERVER_MEMORY_ENABLED: process.env.SERVER_MEMORY_ENABLED,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
  SESSION_COOKIE_SECRET: process.env.SESSION_COOKIE_SECRET,
  SESSION_COOKIE_MAX_AGE_DAYS: process.env.SESSION_COOKIE_MAX_AGE_DAYS,
  LOG_PII: process.env.LOG_PII
});

export type Environment = typeof env;
