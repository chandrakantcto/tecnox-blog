import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

declare global {
  // eslint-disable-next-line no-var
  var redisClient: Redis | undefined;
}

export function getRedisClient(): Redis {
  if (global.redisClient) return global.redisClient;

  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times) => {
      // Stop retrying after 3 attempts; return null to stop
      if (times > 3) return null;
      return Math.min(times * 500, 2000);
    },
  });

  client.on('error', (err) => {
    // Suppress noisy ECONNREFUSED logs after the first one
    if (err.message.includes('ECONNREFUSED')) {
      console.warn('[Redis] Not reachable — queue features disabled until Redis starts.');
    } else {
      console.error('[Redis] Connection error:', err.message);
    }
  });

  client.on('connect', () => {
    console.info('[Redis] Connected');
  });

  if (process.env.NODE_ENV !== 'production') {
    global.redisClient = client;
  }

  return client;
}

export default getRedisClient;
