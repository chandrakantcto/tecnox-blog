const SITE_NAME = 'AI Blog Platform';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function buildCanonicalUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

export function buildOgImageUrl(imageUrl?: string): string {
  return imageUrl || `${BASE_URL}/og-default.jpg`;
}

export function truncateMetaTitle(title: string, siteName = SITE_NAME): string {
  const full = `${title} | ${siteName}`;
  return full.length <= 60 ? full : title.slice(0, 57) + '...';
}

export function truncateMetaDescription(desc: string): string {
  return desc.length <= 160 ? desc : desc.slice(0, 157) + '...';
}

export { SITE_NAME, BASE_URL };
