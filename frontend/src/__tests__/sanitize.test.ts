import { describe, it, expect } from 'vitest';
import { sanitizeHtml, stripHtml } from '../utils/sanitize';

describe('Frontend sanitize utilities', () => {
  it('strips script tags and malicious executable scripts', () => {
    const dirty = '<p>Safe text</p><script>alert("hacked")</script>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('alert');
    expect(clean).toContain('<p>Safe text</p>');
  });

  it('strips inline onerror handlers from images', () => {
    const dirty = '<img src="invalid.jpg" onerror="alert(1)" alt="photo" />';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('onerror');
    expect(clean).toContain('src="invalid.jpg"');
    expect(clean).toContain('alt="photo"');
  });

  it('strips javascript: pseudo-protocol in links', () => {
    const dirty = '<a href="javascript:alert(1)">Click me</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('javascript:');
  });

  it('preserves allowed formatting tags and attributes', () => {
    const html = '<h1>Heading</h1><p>Text with <strong>bold</strong> and <em>italic</em>.</p>';
    const clean = sanitizeHtml(html);
    expect(clean).toContain('<h1>Heading</h1>');
    expect(clean).toContain('<strong>bold</strong>');
    expect(clean).toContain('<em>italic</em>');
  });

  it('stripHtml returns clean plain text without any HTML tags', () => {
    const html = '<div class="content"><p>Hello <b>World</b>!</p></div>';
    const text = stripHtml(html);
    expect(text.trim()).toBe('Hello World!');
  });
});
