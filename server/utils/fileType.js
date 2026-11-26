/**
 * Buffer magic byte and MIME validator for uploaded media files.
 * Ensures that files disguised with deceptive extensions (e.g., .exe renamed to .jpg)
 * are rejected before reaching Cloudinary or storage.
 */

const MAX_SIZES = {
  image: 5 * 1024 * 1024,   // 5 MB
  video: 50 * 1024 * 1024,  // 50 MB
  audio: 10 * 1024 * 1024   // 10 MB
};

/**
 * Checks whether a buffer matches a specific byte sequence starting at an offset.
 */
function matchesBytes(buffer, bytes, offset = 0) {
  if (buffer.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[offset + i] !== bytes[i]) return false;
  }
  return true;
}

/**
 * Detects the real type and format from the buffer magic bytes.
 * @param {Buffer} buffer
 * @param {string} declaredMime
 * @returns {{ type: 'image'|'video'|'audio', format: string, mime: string } | null}
 */
function detectFileType(buffer, declaredMime = '') {
  if (!buffer || buffer.length < 4) return null;

  // Immediate block for executables and dangerous scripts
  if (matchesBytes(buffer, [0x4d, 0x5a])) {
    // Windows PE / EXE / DLL
    return null;
  }
  if (matchesBytes(buffer, [0x7f, 0x45, 0x4c, 0x46])) {
    // Linux ELF
    return null;
  }
  if (matchesBytes(buffer, [0x21, 0x3c, 0x61, 0x72, 0x63, 0x68, 0x3e])) {
    // Unix archive
    return null;
  }
  if (matchesBytes(buffer, [0x25, 0x50, 0x44, 0x46])) {
    // PDF document (not allowed in media uploader)
    return null;
  }

  // --- IMAGES ---

  // JPEG / JPG: FF D8 FF
  if (matchesBytes(buffer, [0xff, 0xd8, 0xff])) {
    return { type: 'image', format: 'jpg', mime: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (matchesBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { type: 'image', format: 'png', mime: 'image/png' };
  }

  // GIF: GIF87a (47 49 46 38 37 61) or GIF89a (47 49 46 38 39 61)
  if (
    matchesBytes(buffer, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    matchesBytes(buffer, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return { type: 'image', format: 'gif', mime: 'image/gif' };
  }

  // WEBP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  if (
    matchesBytes(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    matchesBytes(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return { type: 'image', format: 'webp', mime: 'image/webp' };
  }

  // --- AUDIO ---

  // MP3: ID3 tag or frame sync header (0xFF 0xFB, 0xFF 0xF3, 0xFF 0xF2)
  if (
    matchesBytes(buffer, [0x49, 0x44, 0x33]) ||
    matchesBytes(buffer, [0xff, 0xfb]) ||
    matchesBytes(buffer, [0xff, 0xf3]) ||
    matchesBytes(buffer, [0xff, 0xf2])
  ) {
    return { type: 'audio', format: 'mp3', mime: 'audio/mpeg' };
  }

  // WAV: RIFF (bytes 0-3) + WAVE (bytes 8-11)
  if (
    matchesBytes(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    matchesBytes(buffer, [0x57, 0x41, 0x56, 0x45], 8)
  ) {
    return { type: 'audio', format: 'wav', mime: 'audio/wav' };
  }

  // --- VIDEO / AUDIO (ISO Media / EBML) ---

  // EBML Header (1A 45 DF A3): Used by WebM (video or audio) and Matroska
  if (matchesBytes(buffer, [0x1a, 0x45, 0xdf, 0xa3])) {
    const isAudio = declaredMime.toLowerCase().includes('audio');
    return {
      type: isAudio ? 'audio' : 'video',
      format: 'webm',
      mime: isAudio ? 'audio/webm' : 'video/webm'
    };
  }

  // ISO Base Media File Format (MP4, M4A, MOV): bytes 4-7 = 'ftyp' (66 74 79 70)
  if (matchesBytes(buffer, [0x66, 0x74, 0x79, 0x70], 4)) {
    // Check brand for M4A audio
    const brand = buffer.toString('ascii', 8, 12);
    if (brand.startsWith('M4A') || declaredMime.toLowerCase().includes('audio')) {
      return { type: 'audio', format: 'm4a', mime: 'audio/mp4' };
    }
    if (brand.startsWith('qt  ')) {
      return { type: 'video', format: 'mov', mime: 'video/quicktime' };
    }
    return { type: 'video', format: 'mp4', mime: 'video/mp4' };
  }

  // QuickTime MOV without ftyp (moov/mdat/wide at bytes 4-7)
  if (
    matchesBytes(buffer, [0x6d, 0x6f, 0x6f, 0x76], 4) ||
    matchesBytes(buffer, [0x6d, 0x64, 0x61, 0x74], 4) ||
    matchesBytes(buffer, [0x77, 0x69, 0x64, 0x65], 4)
  ) {
    return { type: 'video', format: 'mov', mime: 'video/quicktime' };
  }

  return null;
}

/**
 * Validates file buffer, declared mimetype, and size limits.
 * @param {Buffer} buffer
 * @param {string} declaredMime
 * @param {number} size
 * @returns {{ valid: boolean, type?: 'image'|'video'|'audio', format?: string, mime?: string, error?: string }}
 */
function validateMediaFile(buffer, declaredMime, size) {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'File is empty' };
  }

  const detected = detectFileType(buffer, declaredMime);
  if (!detected) {
    return {
      valid: false,
      error: 'Unsupported or deceptive file format. Allowed: JPG, PNG, WEBP, GIF, MP4, WEBM, MOV, MP3, M4A, WAV.'
    };
  }

  const maxSize = MAX_SIZES[detected.type];
  if (size > maxSize) {
    const mbLimit = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `${detected.type.charAt(0).toUpperCase() + detected.type.slice(1)} files cannot exceed ${mbLimit} MB.`
    };
  }

  return {
    valid: true,
    type: detected.type,
    format: detected.format,
    mime: detected.mime
  };
}

module.exports = {
  detectFileType,
  validateMediaFile,
  MAX_SIZES
};
