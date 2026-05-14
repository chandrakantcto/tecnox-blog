export const BLOG_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export const BLOG_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
} as const;

export const BLOG_DEFAULTS = {
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  MAX_TITLE_LENGTH: 200,
  MAX_EXCERPT_LENGTH: 500,
  MIN_CONTENT_LENGTH: 100,
  MAX_META_TITLE_LENGTH: 60,
  MAX_META_DESCRIPTION_LENGTH: 160,
  MAX_TAGS: 10,
  MAX_KEYWORDS: 10,
  WORDS_PER_MINUTE: 200,
} as const;
