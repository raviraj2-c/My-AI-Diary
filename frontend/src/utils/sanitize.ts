import DOMPurify from 'dompurify';

const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'blockquote', 'a', 'img', 'video', 'span'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'width', 'height', 'controls']
};

export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html, SANITIZE_OPTIONS);
};

export const stripHtml = (html: string): string => {
  if (!html) return '';
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  // In browser, decode entities if needed
  if (typeof document !== 'undefined') {
    const tmp = document.createElement('div');
    tmp.innerHTML = clean;
    return tmp.textContent || tmp.innerText || '';
  }
  return clean.replace(/<[^>]*>/g, '');
};
