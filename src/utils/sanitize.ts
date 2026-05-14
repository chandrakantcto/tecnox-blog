export function sanitizeHtml(dirty: string): string {
  // Server-side HTML sanitization using regex approach
  // (jsdom/dompurify are used when the package is available)
  const allowedTags = new Set([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'hr', 'div', 'span',
  ]);

  const allowedAttributes: Record<string, string[]> = {
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan'],
    code: ['class'],
    pre: ['class'],
    div: ['class'],
    span: ['class'],
  };

  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<(\/?)([\w-]+)([^>]*)>/g, (match, slash, tag, attrs) => {
      const lowerTag = tag.toLowerCase();
      if (!allowedTags.has(lowerTag)) return '';

      if (slash) return `</${lowerTag}>`;

      const allowedAttrs = allowedAttributes[lowerTag] || [];
      const filteredAttrs = attrs
        .replace(/(\w+)\s*=\s*["']([^"']*)["']/g, (attrMatch: string, name: string, value: string) => {
          const lowerName = name.toLowerCase();
          if (!allowedAttrs.includes(lowerName)) return '';
          if (lowerName === 'href' && value.toLowerCase().startsWith('javascript:')) return '';
          return `${lowerName}="${value}"`;
        })
        .trim();

      return `<${lowerTag}${filteredAttrs ? ' ' + filteredAttrs : ''}>`;
    });
}
