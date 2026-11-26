import { MediaItem } from '../types';
import { API_CONFIG } from '../config/api';
import { AuthService } from './authService';

const MAX_SIZES = {
  image: 5 * 1024 * 1024,   // 5 MB
  video: 50 * 1024 * 1024,  // 50 MB
  audio: 10 * 1024 * 1024   // 10 MB
};

const ALLOWED_EXTS: Record<string, 'image' | 'video' | 'audio'> = {
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  webp: 'image',
  gif: 'image',
  mp4: 'video',
  webm: 'video', // may also be audio, checked below
  mov: 'video',
  mp3: 'audio',
  m4a: 'audio',
  wav: 'audio'
};

export class UploadService {
  /**
   * Validates file size and format client-side before sending to server.
   */
  static validateFileLocally(file: File): { valid: boolean; error?: string; type?: 'image' | 'video' | 'audio' } {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let type = ALLOWED_EXTS[ext];

    if (!type) {
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
    }

    // Specialize webm audio if mime says audio
    if (file.type.includes('audio')) {
      type = 'audio';
    }

    if (!type) {
      return {
        valid: false,
        error: 'Unsupported file format. Please upload JPG, PNG, WEBP, GIF, MP4, WEBM, MOV, MP3, M4A, or WAV.'
      };
    }

    const limit = MAX_SIZES[type];
    if (file.size > limit) {
      const mb = Math.round(limit / (1024 * 1024));
      return {
        valid: false,
        error: `${type.charAt(0).toUpperCase() + type.slice(1)} files must be under ${mb} MB (selected: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`
      };
    }

    return { valid: true, type };
  }

  /**
   * Compresses an image if larger than maxDim (1600px) using HTML5 Canvas.
   * Leaves GIFs, videos, and audios untouched.
   */
  static compressImageIfNeeded(file: File, maxDim = 1600): Promise<File> {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') {
      return Promise.resolve(file);
    }

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim) {
          return resolve(file);
        }

        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
              type: 'image/webp'
            });
            resolve(compressed.size < file.size ? compressed : file);
          },
          'image/webp',
          0.85
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  }

  /**
   * Uploads file to /api/upload with real-time progress callbacks.
   */
  static async uploadMedia(rawFile: File, onProgress?: (percent: number) => void): Promise<MediaItem> {
    const file = await this.compressImageIfNeeded(rawFile);
    return new Promise((resolve, reject) => {
      const localCheck = this.validateFileLocally(file);
      if (!localCheck.valid) {
        return reject(new Error(localCheck.error));
      }

      const token = AuthService.getAuthToken() || '';

      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD.UPLOAD}`;
      xhr.open('POST', url);

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            onProgress(pct);
          }
        };
      }

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && response.success) {
            resolve({
              url: response.data.url,
              publicId: response.data.publicId,
              type: response.data.type,
              thumbnailUrl: response.data.thumbnailUrl,
              bytes: response.data.bytes,
              caption: ''
            });
          } else {
            reject(new Error(response.message || `Upload failed with status ${xhr.status}`));
          }
        } catch {
          reject(new Error('Invalid response from server'));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload. Please check your connection.'));
      };

      xhr.send(formData);
    });
  }

  /**
   * Deletes a media asset from Cloudinary.
   */
  static async deleteMedia(publicId: string, type?: 'image' | 'video' | 'audio'): Promise<void> {
    const token = AuthService.getAuthToken() || '';

    const typeQuery = type ? `?type=${type}` : '';
    // Encode publicId components to preserve slashes safely
    const encodedId = publicId.split('/').map(encodeURIComponent).join('/');
    const url = `${API_CONFIG.BASE_URL}/upload/${encodedId}${typeQuery}`;

    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete media asset');
    }
  }
}
