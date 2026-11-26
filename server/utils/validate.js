const validator = require('validator');

function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

function isValidEmail(email) {
  return typeof email === 'string' && validator.isEmail(email.trim());
}

function isValidPassword(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

function isValidMood(mood) {
  const allowedMoods = ['happy', 'sad', 'neutral', 'excited', 'anxious', 'angry', 'peaceful'];
  return typeof mood === 'string' && allowedMoods.includes(mood);
}

function validateTags(tags) {
  if (tags === undefined || tags === null) return [];
  if (typeof tags === 'string') {
    return [tags.trim()].filter(Boolean);
  }
  if (Array.isArray(tags)) {
    return tags.filter(t => typeof t === 'string' && t.trim().length > 0).map(t => t.trim());
  }
  return null;
}

function escapeRegex(string) {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  isNonEmptyString,
  isValidEmail,
  isValidPassword,
  isValidMood,
  validateTags,
  escapeRegex
};
