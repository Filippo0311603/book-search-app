import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['p', 'br', 'b', 'i', 'em', 'strong', 'u', 'ul', 'ol', 'li'];

/** Keeps a small formatting subset and drops everything else (scripts, links, handlers...). */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] });
}

/** Converts an HTML fragment to plain text. Block boundaries become spaces. */
export function htmlToText(html: string): string {
  const withBreaks = html.replace(/<\s*(br|\/p|\/li|\/div)\s*\/?>/gi, ' ');
  // DOMParser builds an inert document: nothing is executed or fetched.
  const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
  doc.querySelectorAll('script, style').forEach((node) => node.remove());
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}
