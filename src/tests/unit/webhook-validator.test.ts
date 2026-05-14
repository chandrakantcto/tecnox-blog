import { describe, it, expect } from 'vitest';
import { validateDifyWebhook } from '@/lib/webhook-validator';
import { createHmac } from 'crypto';

const TEST_SECRET = 'test-webhook-secret-12345';

function createSignature(body: string, secret: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
}

describe('validateDifyWebhook', () => {
  it('returns true for a valid HMAC signature', () => {
    const body = JSON.stringify({ workflow_run_id: 'abc123', status: 'succeeded' });
    const signature = createSignature(body, TEST_SECRET);
    expect(validateDifyWebhook(body, signature, TEST_SECRET)).toBe(true);
  });

  it('returns false for an invalid signature', () => {
    const body = JSON.stringify({ workflow_run_id: 'abc123' });
    const badSig = 'sha256=invalidsignaturevalue';
    expect(validateDifyWebhook(body, badSig, TEST_SECRET)).toBe(false);
  });

  it('returns false when signature is missing', () => {
    const body = '{}';
    expect(validateDifyWebhook(body, '', TEST_SECRET)).toBe(false);
  });

  it('returns false for tampered body', () => {
    const body = JSON.stringify({ workflow_run_id: 'abc123' });
    const signature = createSignature(body, TEST_SECRET);
    const tamperedBody = JSON.stringify({ workflow_run_id: 'hacked' });
    expect(validateDifyWebhook(tamperedBody, signature, TEST_SECRET)).toBe(false);
  });

  it('returns false when secret is empty', () => {
    const body = '{"test": true}';
    const signature = createSignature(body, TEST_SECRET);
    expect(validateDifyWebhook(body, signature, '')).toBe(false);
  });
});
