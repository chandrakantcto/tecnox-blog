import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '@/utils/sanitize';

describe('sanitizeHtml', () => {
  it('allows safe HTML tags like <p>, <strong>, <em>', () => {
    const input = '<p>Hello <strong>world</strong></p>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
  });

  it('strips script tags', () => {
    const input = '<p>Safe</p><script>alert("xss")</script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
  });

  it('strips event handler attributes', () => {
    const input = '<p onclick="steal()">Click me</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onclick');
  });

  it('strips iframe tags', () => {
    const input = '<iframe src="https://evil.com"></iframe>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<iframe>');
    expect(result).not.toContain('evil.com');
  });

  it('preserves text content', () => {
    const input = '<p>Important content here</p>';
    const result = sanitizeHtml(input);
    expect(result).toContain('Important content here');
  });

  it('handles empty string', () => {
    const result = sanitizeHtml('');
    expect(typeof result).toBe('string');
    expect(result.length).toBe(0);
  });

  it('allows href attributes on anchor tags', () => {
    const input = '<a href="https://example.com">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain('href');
    expect(result).toContain('example.com');
  });

  it('strips javascript: href', () => {
    const input = '<a href="javascript:alert(1)">Bad link</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
  });
});
