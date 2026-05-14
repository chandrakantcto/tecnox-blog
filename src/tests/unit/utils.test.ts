import { describe, it, expect } from 'vitest';
import { generateSlug, isValidSlug } from '@/utils/slug';
import { calculateReadingTime } from '@/utils/reading-time';
import { generateExcerpt } from '@/utils/excerpt';
import { buildPagination, parsePaginationParams } from '@/utils/pagination';
import { formatDate, formatRelativeDate } from '@/utils/date';
import { zodErrorToDetails } from '@/utils/api-response';

// ── Slug Utils ──────────────────────────────────────────────────────────────

describe('generateSlug', () => {
  it('converts a title to a slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(generateSlug('Hello, World! @2024')).toBe('hello-world-2024');
  });

  it('collapses multiple hyphens', () => {
    expect(generateSlug('foo  bar   baz')).toBe('foo-bar-baz');
  });

  it('handles empty string gracefully', () => {
    const result = generateSlug('');
    expect(typeof result).toBe('string');
  });

  it('trims leading and trailing hyphens', () => {
    expect(generateSlug('  Hello World  ')).toBe('hello-world');
  });
});

describe('isValidSlug', () => {
  it('returns true for valid slug', () => {
    expect(isValidSlug('hello-world-123')).toBe(true);
  });

  it('returns false for slug with uppercase', () => {
    expect(isValidSlug('Hello-World')).toBe(false);
  });

  it('returns false for slug with spaces', () => {
    expect(isValidSlug('hello world')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidSlug('')).toBe(false);
  });
});

// ── Reading Time ─────────────────────────────────────────────────────────────

describe('calculateReadingTime', () => {
  it('returns at least 1 for short content', () => {
    expect(calculateReadingTime('Short text.')).toBeGreaterThanOrEqual(1);
  });

  it('calculates approximately 200 words per minute', () => {
    const words = Array(400).fill('word').join(' ');
    const time = calculateReadingTime(words);
    expect(time).toBe(2);
  });

  it('handles empty string', () => {
    expect(calculateReadingTime('')).toBeGreaterThanOrEqual(1);
  });

  it('strips HTML tags before counting words', () => {
    const html = '<p>Hello <strong>World</strong></p>';
    const plain = 'Hello World';
    expect(calculateReadingTime(html)).toBe(calculateReadingTime(plain));
  });
});

// ── Excerpt ──────────────────────────────────────────────────────────────────

describe('generateExcerpt', () => {
  it('strips HTML and truncates text', () => {
    const html = '<p>' + 'word '.repeat(100) + '</p>';
    const excerpt = generateExcerpt(html);
    expect(excerpt.length).toBeLessThan(html.length);
    expect(excerpt).not.toContain('<p>');
  });

  it('does not exceed the specified max length', () => {
    const longText = 'a '.repeat(300);
    const excerpt = generateExcerpt(longText, 100);
    expect(excerpt.length).toBeLessThanOrEqual(103); // includes ellipsis
  });

  it('returns empty string for empty input', () => {
    const result = generateExcerpt('');
    expect(typeof result).toBe('string');
  });
});

// ── Pagination ───────────────────────────────────────────────────────────────

describe('buildPagination', () => {
  it('calculates totalPages correctly', () => {
    const p = buildPagination(1, 10, 100);
    expect(p.totalPages).toBe(10);
    expect(p.total).toBe(100);
    expect(p.page).toBe(1);
    expect(p.limit).toBe(10);
  });

  it('sets hasNextPage and hasPrevPage correctly', () => {
    const middle = buildPagination(2, 10, 50);
    expect(middle.hasNextPage).toBe(true);
    expect(middle.hasPrevPage).toBe(true);

    const first = buildPagination(1, 10, 50);
    expect(first.hasPrevPage).toBe(false);

    const last = buildPagination(5, 10, 50);
    expect(last.hasNextPage).toBe(false);
  });

  it('handles 0 total items', () => {
    const p = buildPagination(1, 10, 0);
    expect(p.totalPages).toBe(0);
    expect(p.hasNextPage).toBe(false);
  });
});

describe('parsePaginationParams', () => {
  it('parses valid page and limit from URL', () => {
    const url = new URL('http://localhost?page=2&limit=20');
    const params = parsePaginationParams(url.searchParams);
    expect(params.page).toBe(2);
    expect(params.limit).toBe(20);
  });

  it('returns defaults for missing params', () => {
    const url = new URL('http://localhost');
    const params = parsePaginationParams(url.searchParams);
    expect(params.page).toBe(1);
    expect(params.limit).toBeGreaterThan(0);
  });

  it('clamps negative page to 1', () => {
    const url = new URL('http://localhost?page=-5');
    const params = parsePaginationParams(url.searchParams);
    expect(params.page).toBeGreaterThanOrEqual(1);
  });
});

// ── Date Utils ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a date to a readable string', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const formatted = formatDate(date);
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('handles string date input', () => {
    const formatted = formatDate('2024-06-01');
    expect(typeof formatted).toBe('string');
  });
});

describe('formatRelativeDate', () => {
  it('returns a relative string for recent dates', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const result = formatRelativeDate(oneHourAgo);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── zodErrorToDetails ────────────────────────────────────────────────────────

describe('zodErrorToDetails', () => {
  it('maps zod issues to field/message pairs', () => {
    const issues = [
      { path: ['title'], message: 'Required' },
      { path: ['content', 'body'], message: 'Too short' },
    ];
    const details = zodErrorToDetails(issues);
    expect(details).toHaveLength(2);
    expect(details[0]).toEqual({ field: 'title', message: 'Required' });
    expect(details[1]).toEqual({ field: 'content.body', message: 'Too short' });
  });

  it('handles empty issues array', () => {
    expect(zodErrorToDetails([])).toEqual([]);
  });
});
