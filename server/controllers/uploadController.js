const {
  cloudinary,
  isCloudinaryConfigured,
  deleteCloudinaryMedia,
  generateThumbnailUrl
} = require('../config/cloudinary');
const { validateMediaFile } = require('../utils/fileType');
const { DiaryEntry } = require('../config/models');

/**
 * Uploads a file buffer directly to Cloudinary using upload_stream.
 */
function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
}

/**
 * POST /api/upload
 * Handles authenticated media upload with magic-byte validation and Cloudinary storage.
 */
const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please attach a valid image, video, or audio file.'
      });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary storage is not configured on the server. Please set CLOUDINARY credentials in server/.env.'
      });
    }

    // Validate real file type (magic bytes + MIME) and size limit per type
    const validation = validateMediaFile(
      req.file.buffer,
      req.file.mimetype || '',
      req.file.size
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const { type } = validation;
    const resourceType = type === 'video' || type === 'audio' ? 'video' : 'image';
    const folder = `mydiary/user_${req.user.id}`;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder,
      resource_type: resourceType,
      use_filename: false,
      unique_filename: true,
      overwrite: false
    });

    const thumbnailUrl = generateThumbnailUrl(result.public_id, type) || result.secure_url;

    res.status(200).json({
      success: true,
      message: 'Media uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        type,
        thumbnailUrl,
        bytes: result.bytes || req.file.size,
        format: result.format || validation.format
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/upload/:publicId
 * Deletes a media asset from Cloudinary only if it belongs to the authenticated user.
 */
const deleteMedia = async (req, res, next) => {
  try {
    // publicId may contain slashes (e.g., mydiary/user_123/asset_abc)
    // Route handles wildcard or encoded parameter
    const publicId = req.params[0] || req.params.publicId;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    // Ownership check: must match user's folder prefix OR belong to an existing entry of the user
    const userFolderPrefix = `mydiary/user_${req.user.id}`;
    let isOwner = publicId.startsWith(userFolderPrefix);

    if (!isOwner) {
      const entryWithMedia = await DiaryEntry.findOne({
        user: req.user.id,
        'media.publicId': publicId
      });
      if (entryWithMedia) {
        isOwner = true;
      }
    }

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to delete this file.'
      });
    }

    // Determine resource type if audio/video
    let resourceType = 'image';
    if (req.query.type === 'video' || req.query.type === 'audio') {
      resourceType = 'video';
    }

    await deleteCloudinaryMedia(publicId, resourceType);

    // Also pull the deleted media from any entry that references it
    await DiaryEntry.updateMany(
      { user: req.user.id, 'media.publicId': publicId },
      { $pull: { media: { publicId } } }
    );

    res.json({
      success: true,
      message: 'Media asset deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadMedia,
  deleteMedia
};
