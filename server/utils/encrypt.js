const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Validates and converts a 64-hex key string into a 32-byte Buffer.
 */
function parseKeyHex(hexStr) {
  if (!hexStr || typeof hexStr !== 'string' || !/^[0-9a-fA-F]{64}$/.test(hexStr)) {
    throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)');
  }
  return Buffer.from(hexStr, 'hex');
}

/**
 * Derives a 32-byte Buffer key from the environment variable ENCRYPTION_KEY.
 * In test mode only, falls back to a deterministic 64-hex test key.
 */
function getEncryptionKey() {
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    if (process.env.NODE_ENV === 'test') {
      return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
    }
    throw new Error('ENCRYPTION_KEY environment variable is required (64 hex characters)');
  }
  return parseKeyHex(envKey);
}

/**
 * Retrieves the encryption key Buffer for a given Key ID (kid).
 * Supports key rings for seamless key rotation.
 */
function getKeyForId(kid) {
  const activeKid = process.env.ENCRYPTION_KEY_ID || 'k1';
  if (!kid || kid === activeKid || kid === 'v1' || kid === 'default') {
    return getEncryptionKey();
  }

  if (process.env.ENCRYPTION_KEY_RING) {
    try {
      const ring = typeof process.env.ENCRYPTION_KEY_RING === 'string'
        ? JSON.parse(process.env.ENCRYPTION_KEY_RING)
        : process.env.ENCRYPTION_KEY_RING;
      if (ring && ring[kid]) {
        return parseKeyHex(ring[kid]);
      }
    } catch (err) {
      console.error('Failed to parse ENCRYPTION_KEY_RING:', err.message);
    }
  }

  // Fallback to active key if not found in ring
  return getEncryptionKey();
}

/**
 * Checks if a string is already encrypted in either v1 or v2 format.
 */
function isEncrypted(text) {
  return typeof text === 'string' && (text.startsWith('enc:v1:') || text.startsWith('enc:v2:'));
}

/**
 * Encrypts plain text with AES-256-GCM using enc:v2 format with key identifier.
 * Stored string format: `enc:v2:<kid>:<iv_hex>:<authTag_hex>:<cipher_hex>`
 *
 * @param {string} text - Raw unencrypted text
 * @param {string} [keyId] - Key identifier (defaults to ENCRYPTION_KEY_ID or 'k1')
 * @returns {string} - Encrypted string package
 */
function encryptText(text, keyId = process.env.ENCRYPTION_KEY_ID || 'k1') {
  if (text == null || typeof text !== 'string') return text;
  if (!text) return '';

  // Avoid double encryption
  if (isEncrypted(text)) {
    return text;
  }

  const key = getKeyForId(keyId);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  const ivHex = iv.toString('hex');

  return `enc:v2:${keyId}:${ivHex}:${authTag}:${encrypted}`;
}

/**
 * Decrypts text previously encrypted with AES-256-GCM.
 * Seamlessly supports both `enc:v2:<kid>:<iv>:<tag>:<cipher>` and legacy `enc:v1:<iv>:<tag>:<cipher>`.
 * Gracefully handles unencrypted legacy text.
 *
 * @param {string} encryptedPackage - String starting with `enc:v1:...` or `enc:v2:...` or raw text
 * @returns {string} - Decrypted plaintext or '[could not decrypt]' placeholder
 */
function decryptText(encryptedPackage) {
  if (encryptedPackage == null || typeof encryptedPackage !== 'string') {
    return encryptedPackage;
  }

  // If not encrypted, return as-is (legacy compatibility)
  if (!isEncrypted(encryptedPackage)) {
    return encryptedPackage;
  }

  try {
    const parts = encryptedPackage.split(':');

    // enc:v2:<kid>:<iv>:<tag>:<cipher> (6 parts)
    if (parts[1] === 'v2') {
      if (parts.length !== 6) {
        return '[could not decrypt]';
      }

      const kid = parts[2];
      const ivHex = parts[3];
      const authTagHex = parts[4];
      const cipherHex = parts[5];

      const key = getKeyForId(kid);
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    }

    // enc:v1:<iv>:<tag>:<cipher> (5 parts)
    if (parts[1] === 'v1') {
      if (parts.length !== 5) {
        return '[could not decrypt]';
      }

      const ivHex = parts[2];
      const authTagHex = parts[3];
      const cipherHex = parts[4];

      const key = getKeyForId('v1');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    }

    return '[could not decrypt]';
  } catch (error) {
    console.error('Decryption failed for record. Returning placeholder.', error.message);
    return '[could not decrypt]';
  }
}

/**
 * Helper to encrypt an array of strings (e.g. gratitude items)
 */
function encryptArray(arr, keyId) {
  if (!Array.isArray(arr)) return arr;
  return arr.map((item) => (typeof item === 'string' ? encryptText(item, keyId) : item));
}

/**
 * Helper to decrypt an array of strings
 */
function decryptArray(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.map((item) => (typeof item === 'string' ? decryptText(item) : item));
}

module.exports = {
  encryptText,
  decryptText,
  encrypt: encryptText,
  decrypt: decryptText,
  encryptArray,
  decryptArray,
  getEncryptionKey,
  getKeyForId,
  isEncrypted
};
