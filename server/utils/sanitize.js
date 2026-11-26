const sanitizeHtml = require('sanitize-html');

const SANITIZE_CONTENT_OPTIONS = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'blockquote', 'a', 'img', 'video', 'span'
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    video: ['src', 'controls', 'width', 'height'],
    span: ['class']
  },
  allowedSchemes: ['http', 'https', 'data']
};

function sanitizeContent(html) {
  if (typeof html !== 'string') return '';
  return sanitizeHtml(html, SANITIZE_CONTENT_OPTIONS);
}

function decodeHtmlEntities(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripAllTags(str) {
  if (typeof str !== 'string') return '';
  const stripped = sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} }).trim();
  return decodeHtmlEntities(stripped);
}

module.exports = {
  SANITIZE_CONTENT_OPTIONS,
  sanitizeContent,
  stripAllTags,
  decodeHtmlEntities
};
