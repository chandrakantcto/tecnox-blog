import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';

describe('checkRateLimit (in-memory store)', () => {
  beforeEach(() => {
    // Nothing to reset since the Map is module-level
  });

  it('allows requests below the limit', async () => {
    const key = `test-${Date.now()}-allow`;
    const result = await checkRateLimit(key, { points: 5, duration: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks when limit is exceeded', async () => {
    const key = `test-${Date.now()}-block`;
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(key, { points: 3, duration: 60 });
    }
    const result = await checkRateLimit(key, { points: 3, duration: 60 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns decreasing remaining count', async () => {
    const key = `test-${Date.now()}-remaining`;
    const first = await checkRateLimit(key, { points: 5, duration: 60 });
    expect(first.remaining).toBe(4);

    const second = await checkRateLimit(key, { points: 5, duration: 60 });
    expect(second.remaining).toBe(3);
  });

  it('resets after duration expires', async () => {
    const key = `test-${Date.now()}-reset`;
    // Use very short duration (0 seconds will make it expire immediately on next call)
    await checkRateLimit(key, { points: 1, duration: 0 });
    // Next call should reset since duration is 0 (already expired)
    await new Promise((r) => setTimeout(r, 5));
    const result = await checkRateLimit(key, { points: 1, duration: 0 });
    expect(result.allowed).toBe(true);
  });
});
