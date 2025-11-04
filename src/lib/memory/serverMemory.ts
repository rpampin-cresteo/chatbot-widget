import { env } from '../env';

type RedisClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { ex?: number }) => Promise<unknown>;
};

let cachedClient: RedisClient | undefined;

const ensureRedisClient = async (): Promise<RedisClient | null> => {
  if (!env.SERVER_MEMORY_ENABLED) {
    return null;
  }
  if (!env.REDIS_URL || !env.REDIS_TOKEN) {
    console.warn('[widget] SERVER_MEMORY_ENABLED but REDIS_URL/REDIS_TOKEN missing');
    return null;
  }
  if (cachedClient) {
    return cachedClient;
  }
  try {
    const mod = await import('@upstash/redis');
    const client = new mod.Redis({
      url: env.REDIS_URL,
      token: env.REDIS_TOKEN
    });
    cachedClient = client;
    return client;
  } catch (error) {
    console.warn('[widget] Failed to initialize Redis client', error);
    return null;
  }
};

const memoryKey = (userId: string) => `cw:memory:${userId}`;

export const fetchServerMemory = async (userId: string): Promise<string | null> => {
  const client = await ensureRedisClient();
  if (!client) {
    return null;
  }
  try {
    return await client.get(memoryKey(userId));
  } catch (error) {
    console.warn('[widget] Failed to fetch server memory', error);
    return null;
  }
};

export const persistServerMemory = async (userId: string, summary: string) => {
  const client = await ensureRedisClient();
  if (!client) {
    return;
  }
  try {
    await client.set(memoryKey(userId), summary, { ex: 60 * 60 * 24 * 30 });
  } catch (error) {
    console.warn('[widget] Failed to persist server memory', error);
  }
};
