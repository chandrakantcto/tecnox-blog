import type { NextRequest } from 'next/server';

interface RateLimitConfig {
  points: number;
  duration: number; // seconds
}

const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const resetTime = now + config.duration * 1000;

  const existing = inMemoryStore.get(key);

  if (!existing || existing.resetTime < now) {
    inMemoryStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: config.points - 1, resetTime };
  }

  if (existing.count >= config.points) {
    return { allowed: false, remaining: 0, resetTime: existing.resetTime };
  }

  existing.count++;
  inMemoryStore.set(key, existing);
  return {
    allowed: true,
    remaining: config.points - existing.count,
    resetTime: existing.resetTime,
  };
}
