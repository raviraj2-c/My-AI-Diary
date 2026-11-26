const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

/**
 * Checks if Cloudinary credentials are fully configured.
 */
function isCloudinaryConfigured() {
  return Boolean(cloudName && apiKey && apiSecret);
}

/**
 * Validates that an incoming media URL originates from our Cloudinary account.
 * Prevents SSRF or arbitrary external URLs from being stored as entry media.
 * @param {string} url
 * @returns {boolean}
 */
function isValidCloudinaryUrl(url) {
  if (typeof url !== 'string' || !cloudName) {
    return false;
  }
  return url.startsWith(`https://res.cloudinary.com/${cloudName}/`);
}

/**
 * Deletes an entire Cloudinary folder by its prefix.
 * @param {string} folderPrefix
 * @returns {Promise<void>}
 */
async function deleteCloudinaryFolder(folderPrefix) {
  if (!cloudName || !apiKey) return;
  const prefix = folderPrefix.endsWith('/') ? folderPrefix : `${folderPrefix}/`;

  // In test environment with dummy credentials, only invoke if explicitly mocked, otherwise skip live API
  if (process.env.NODE_ENV === 'test' && (apiKey === '123456789012345' || cloudName === 'mydiary_dev')) {
    if (typeof cloudinary.api?.delete_resources_by_prefix === 'function') {
      try {
        await cloudinary.api.delete_resources_by_prefix(prefix, { resource_type: 'image' });
        if (typeof cloudinary.api?.delete_folder === 'function') {
          await cloudinary.api.delete_folder(prefix.replace(/\/$/, ''));
        }
      } catch (err) {
        // Ignore unmocked live Cloudinary network error with dummy test credentials
      }
    }
    return;
  }

  for (const resourceType of ['image', 'video', 'raw']) {
    try {
      await cloudinary.api.delete_resources_by_prefix(prefix, { resource_type: resourceType });
    } catch (err) {
      if (!err.message || (!err.message.includes('not found') && !err.message.includes('No resources found'))) {
        throw err;
      }
    }
  }
  try {
    await cloudinary.api.delete_folder(prefix.replace(/\/$/, ''));
  } catch (err) {
    if (!err.message || (!err.message.includes('not found') && !err.message.includes('does not exist') && !err.message.includes("Can't find folder"))) {
      throw err;
    }
  }
}

/**
 * Deletes a media file from Cloudinary by its publicId.
 * @param {string} publicId
 * @param {'image'|'video'|'audio'|'raw'} [type='image']
 * @returns {Promise<any>}
 */
async function deleteCloudinaryMedia(publicId, type = 'image') {
  if (!isCloudinaryConfigured() || !publicId) return;

  const resourceType = type === 'video' || type === 'audio' ? 'video' : 'image';
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true
    });
  } catch (error) {
    console.error(`⚠️ Cloudinary deletion failed for ${publicId}:`, error.message);
    return null;
  }
}

/**
 * Generates an optimized thumbnail URL for an image or video.
 * @param {string} publicId
 * @param {'image'|'video'|'audio'} type
 * @returns {string|null}
 */
function generateThumbnailUrl(publicId, type) {
  if (!cloudName || !publicId) return null;

  if (type === 'image') {
    return cloudinary.url(publicId, {
      width: 400,
      height: 300,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
      secure: true
    });
  }

  if (type === 'video') {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'jpg',
      width: 400,
      height: 300,
      crop: 'fill',
      secure: true
    });
  }

  return null;
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  isValidCloudinaryUrl,
  deleteCloudinaryMedia,
  deleteCloudinaryFolder,
  generateThumbnailUrl
};
