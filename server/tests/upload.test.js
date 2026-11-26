const request = require('supertest');
const app = require('../index');
const cloudinaryConfig = require('../config/cloudinary');

describe('Media Upload Security & Magic-Byte Validation', () => {
  let user, token;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Uploader', email: 'uploader@test.com', password: 'Password123' });
    user = res.body.user;
    token = res.body.token;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('unauthenticated rejected: returns 401 when Authorization header is missing', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'test.png');

    expect(res.status).toBe(401);
  });

  it('missing file rejected: returns 400 when no file is attached in form-data', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/No file uploaded/i);
  });

  it('wrong magic bytes rejected: rejects plain text file disguised as .jpg', async () => {
    jest.spyOn(cloudinaryConfig, 'isCloudinaryConfigured').mockReturnValue(true);

    const fakeImageBuffer = Buffer.from('This is a plain text file pretending to be an image', 'utf8');

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fakeImageBuffer, { filename: 'malicious.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Unsupported or deceptive file format/i);
  });

  it('wrong magic bytes rejected: rejects Windows PE executable (MZ header) disguised as .png', async () => {
    jest.spyOn(cloudinaryConfig, 'isCloudinaryConfigured').mockReturnValue(true);

    // MZ header: 0x4D, 0x5A
    const peBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', peBuffer, { filename: 'exploit.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Unsupported or deceptive file format/i);
  });

  it('oversize rejected: rejects image larger than 5 MB limit', async () => {
    jest.spyOn(cloudinaryConfig, 'isCloudinaryConfigured').mockReturnValue(true);

    // 5.5 MB buffer starting with PNG magic bytes
    const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const oversizeBuffer = Buffer.alloc(5.5 * 1024 * 1024);
    for (let i = 0; i < pngHeader.length; i++) {
      oversizeBuffer[i] = pngHeader[i];
    }

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', oversizeBuffer, { filename: 'giant.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot exceed 5 MB/i);
  });

  it('valid image magic bytes accepted: uploads to user-isolated folder and returns metadata', async () => {
    jest.spyOn(cloudinaryConfig, 'isCloudinaryConfigured').mockReturnValue(true);

    // Valid PNG buffer with minimum header
    const validPngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89
    ]);

    // Mock upload_stream to return simulated Cloudinary upload response
    const mockUploadResult = {
      public_id: `mydiary/user_${user.id || user._id}/valid_asset_123`,
      secure_url: `https://res.cloudinary.com/testcloud/image/upload/v1/mydiary/user_${user.id || user._id}/valid_asset_123.png`,
      bytes: validPngBuffer.length,
      format: 'png'
    };

    jest.spyOn(cloudinaryConfig.cloudinary.uploader, 'upload_stream').mockImplementation((options, callback) => {
      // Assert folder is user-isolated
      expect(options.folder).toBe(`mydiary/user_${user.id || user._id}`);
      const { Writable } = require('stream');
      const writable = new Writable({
        write(chunk, encoding, cb) {
          cb();
        }
      });
      writable.on('finish', () => {
        callback(null, mockUploadResult);
      });
      return writable;
    });

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', validPngBuffer, { filename: 'sanctuary.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toBe(mockUploadResult.secure_url);
    expect(res.body.data.publicId).toBe(mockUploadResult.public_id);
    expect(res.body.data.type).toBe('image');
  });
});
