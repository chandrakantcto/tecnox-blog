import { BLOG_DEFAULTS } from '@/constants/blog.constants';

export function calculateReadingTime(content: string): number {
  const plainText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const wordCount = plainText.split(' ').filter(Boolean).length;
  const minutes = Math.ceil(wordCount / BLOG_DEFAULTS.WORDS_PER_MINUTE);
  return Math.max(1, minutes);
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}
