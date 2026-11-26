import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import app from '../app.js';
import { User, DiaryEntry, CheckIn, FutureLetter, CopingPlan } from '../config/models.js';
import { encryptText, decryptText, getEncryptionKey } from '../utils/encrypt.js';
import { isValidPassword } from '../utils/validate.js';
import { isValidCloudinaryUrl, cloudinary } from '../config/cloudinary.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { runKeyRotation } from '../scripts/rotateKeys.js';

describe('Security Hardening Tests', () => {
  let userToken;
  let userId;
  const testEmail = 'security_test@example.com';
  const testPassword = 'Password123!';
  const testPin = '1234';

  beforeEach(async () => {
    await User.deleteMany({ email: { $in: [testEmail, 'nonexistent@example.com', 'del_user@example.com'] } });
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        name: 'Security User'
      });
    userToken = res.body.token;
    userId = res.body.user.id;

    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(testPin, salt);
    await User.findByIdAndUpdate(userId, {
      appLockEnabled: true,
      appLockPinHash: pinHash,
      appLockFailedAttempts: 0,
      appLockLockedUntil: null
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: [testEmail, 'del_user@example.com'] } });
  });

  describe('1. Password byte length & validation', () => {
    test('rejects passwords exceeding 72 bytes even if character count <= 72', () => {
      // 25 characters of 3-byte unicode = 75 bytes
      const multiBytePass = '€'.repeat(25) + 'A1!';
      expect(multiBytePass.length).toBe(28); // 28 chars
      expect(Buffer.byteLength(multiBytePass, 'utf8')).toBe(78); // 78 bytes
      expect(isValidPassword(multiBytePass)).toBe(false);
    });

    test('accepts valid password under or equal to 72 bytes', () => {
      const validPass = 'ValidPassword123!€';
      expect(Buffer.byteLength(validPass, 'utf8')).toBeLessThanOrEqual(72);
      expect(isValidPassword(validPass)).toBe(true);
    });
  });

  describe('2. Cloudinary URL prefix verification', () => {
    test('rejects URL containing cloud name elsewhere in path if not starting with proper origin', () => {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'demo';
      const spoofedUrl = `https://evil-site.com/res.cloudinary.com/${cloudName}/image/upload/v1/test.jpg`;
      expect(isValidCloudinaryUrl(spoofedUrl)).toBe(false);

      const attackerCloudUrl = `https://res.cloudinary.com/attacker/res.cloudinary.com/${cloudName}/test.jpg`;
      expect(isValidCloudinaryUrl(attackerCloudUrl)).toBe(false);
    });

    test('accepts valid Cloudinary URL with correct prefix', () => {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'demo';
      const validUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v12345/mydiary/user_123/sample.jpg`;
      expect(isValidCloudinaryUrl(validUrl)).toBe(true);
    });
  });

  describe('3. Settings validation (country, reminderTime, trustedContact)', () => {
    test('rejects invalid country code', async () => {
      const res = await request(app)
        .put('/api/auth/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ country: 'INVALID' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/country/i);
    });

    test('accepts valid country code from helpline list', async () => {
      const res = await request(app)
        .put('/api/auth/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ country: 'IN' });
      expect(res.status).toBe(200);
      expect(res.body.settings.country).toBe('IN');
    });

    test('rejects invalid reminderTime format', async () => {
      const res = await request(app)
        .put('/api/auth/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reminderTime: '25:99' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/reminder/i);
    });

    test('accepts valid reminderTime format HH:MM', async () => {
      const res = await request(app)
        .put('/api/auth/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reminderTime: '21:30' });
      expect(res.status).toBe(200);
      expect(res.body.settings.reminderTime).toBe('21:30');
    });

    test('rejects trustedContact with invalid phone characters', async () => {
      const res = await request(app)
        .put('/api/auth/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          trustedContact: {
            name: 'Friend',
            relation: 'Friend',
            phone: '123-abc-789'
          }
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/phone/i);
    });
  });

  describe('4. Login timing protection with dummy hash', () => {
    test('login with nonexistent user runs bcrypt compare and takes comparable time to existing user with wrong password', async () => {
      const startNonexistent = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent_user_98765@example.com', password: 'WrongPassword123!' });
      const timeNonexistent = Date.now() - startNonexistent;

      const startExisting = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'WrongPassword123!' });
      const timeExisting = Date.now() - startExisting;

      // Both run bcrypt compare, ratio should be well under 3.5
      const ratio = Math.max(timeNonexistent, timeExisting) / Math.max(Math.min(timeNonexistent, timeExisting), 1);
      expect(ratio).toBeLessThan(3.5);
    });
  });

  describe('5. App Lock persistence in MongoDB', () => {
    test('persists failed attempts and lockUntil in MongoDB, granting 5 fresh tries after lock expires', async () => {
      for (let i = 1; i <= 4; i++) {
        const res = await request(app)
          .post('/api/auth/app-lock/verify')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ pin: '9999' });
        expect(res.status).toBe(401);
      }

      let userInDb = await User.findById(userId);
      expect(userInDb.appLockFailedAttempts).toBe(4);

      // 5th wrong attempt triggers freeze and 429
      const resFifth = await request(app)
        .post('/api/auth/app-lock/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ pin: '9999' });
      expect(resFifth.status).toBe(429);

      userInDb = await User.findById(userId);
      expect(userInDb.appLockLockedUntil).not.toBeNull();
      expect(new Date(userInDb.appLockLockedUntil).getTime()).toBeGreaterThan(Date.now());

      // While locked, returns 429
      const resLocked = await request(app)
        .post('/api/auth/app-lock/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ pin: testPin });
      expect(resLocked.status).toBe(429);

      // Simulate lock expiration
      await User.findByIdAndUpdate(userId, {
        appLockLockedUntil: new Date(Date.now() - 1000)
      });

      // Now correct PIN succeeds and resets counters
      const resSuccess = await request(app)
        .post('/api/auth/app-lock/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ pin: testPin });
      expect(resSuccess.status).toBe(200);

      userInDb = await User.findById(userId);
      expect(userInDb.appLockFailedAttempts).toBe(0);
      expect(userInDb.appLockLockedUntil).toBeNull();
    });
  });

  describe('6. Encryption v2 format, v1 compatibility & Key Rotation', () => {
    test('encrypts using enc:v2 format with key id', () => {
      const plaintext = 'Secret diary thoughts';
      const ciphertext = encryptText(plaintext);
      expect(ciphertext).toMatch(/^enc:v2:[a-zA-Z0-9_\-]+:[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
      const decrypted = decryptText(ciphertext);
      expect(decrypted).toBe(plaintext);
    });

    test('decrypts legacy enc:v1 format transparently', () => {
      const key = getEncryptionKey();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      let enc = cipher.update('Legacy v1 secret message', 'utf8', 'hex');
      enc += cipher.final('hex');
      const tag = cipher.getAuthTag().toString('hex');
      const v1Ciphertext = `enc:v1:${iv.toString('hex')}:${tag}:${enc}`;

      const decrypted = decryptText(v1Ciphertext);
      expect(decrypted).toBe('Legacy v1 secret message');
    });

    test('runKeyRotation migrates legacy v1 records to active v2 key id', async () => {
      const key = getEncryptionKey();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      let enc = cipher.update('Pre-rotation entry text', 'utf8', 'hex');
      enc += cipher.final('hex');
      const tag = cipher.getAuthTag().toString('hex');
      const v1Text = `enc:v1:${iv.toString('hex')}:${tag}:${enc}`;

      const entry = await DiaryEntry.create({
        user: userId,
        title: 'Legacy Entry',
        content: v1Text,
        mood: 'peaceful'
      });

      // Run rotation to kid 'k2'
      const rotationResult = await runKeyRotation({ targetKid: 'k2' });
      expect(rotationResult.diaryentries).toBeGreaterThan(0);

      const rawRotated = await mongoose.connection.collection('diaryentries').findOne({ _id: entry._id });
      expect(rawRotated.content.startsWith('enc:v2:k2:')).toBe(true);

      const decrypted = decryptText(rawRotated.content);
      expect(decrypted).toBe('Pre-rotation entry text');
    });
  });

  describe('7. Production log capture contains no token', () => {
    test('sendPasswordResetEmail logs NO token or reset URL in production mode', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const logs = [];
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;

      console.log = (...args) => logs.push(args.join(' '));
      console.warn = (...args) => logs.push(args.join(' '));
      console.error = (...args) => logs.push(args.join(' '));

      try {
        process.env.NODE_ENV = 'production';
        const dummyToken = 'secret-token-abcdef1234567890';
        await sendPasswordResetEmail('prod_user@example.com', dummyToken);

        const captured = logs.join('\n');
        expect(captured).not.toContain(dummyToken);
        expect(captured).not.toContain('reset-password');
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
        console.log = originalLog;
        console.warn = originalWarn;
        console.error = originalError;
      }
    });

    test('forgotPassword endpoint responds immediately without waiting for email send', async () => {
      const start = Date.now();
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail });
      const elapsed = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/reset instructions have been sent/i);
      expect(elapsed).toBeLessThan(500); // Immediate response
    });
  });

  describe('8. deleteAccount removes whole Cloudinary user folder and child documents', () => {
    test('deleteAccount calls delete_resources_by_prefix for user folder, deletes children, and deletes user last', async () => {
      const delRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'del_user@example.com',
          password: 'Password123!',
          name: 'Delete User'
        });
      const delToken = delRes.body.token;
      const delUserId = delRes.body.user.id;

      await DiaryEntry.create({
        user: delUserId,
        title: 'Entry to delete',
        content: 'content',
        mood: 'happy'
      });
      await CheckIn.create({
        user: delUserId,
        date: new Date(),
        moodScore: 8,
        energyLevel: 'medium',
        stressLevel: 'low',
        sleepHours: 8
      });

      // Mock Cloudinary API
      const deletedPrefixes = [];
      cloudinary.api.delete_resources_by_prefix = async (prefix, opts) => {
        deletedPrefixes.push({ prefix, opts });
        return { deleted: {} };
      };
      cloudinary.api.delete_folder = async (folder) => {
        return { deleted: [folder] };
      };

      const res = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${delToken}`)
        .send({ password: 'Password123!' });

      expect(res.status).toBe(200);

      // Verify Cloudinary was called with user prefix
      expect(deletedPrefixes.some(p => p.prefix === `mydiary/user_${delUserId}/`)).toBe(true);

      // Verify child entries deleted
      const remainingEntries = await DiaryEntry.find({ user: delUserId });
      expect(remainingEntries.length).toBe(0);
      const remainingCheckIns = await CheckIn.find({ user: delUserId });
      expect(remainingCheckIns.length).toBe(0);

      // Verify user deleted
      const remainingUser = await User.findById(delUserId);
      expect(remainingUser).toBeNull();
    });
  });

  describe('9. Health endpoint is not rate limited & Global JSON limit', () => {
    test('GET /api/health responds with 200 without rate limit block', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    test('rejects payload exceeding 100kb limit with 413 Payload Too Large', async () => {
      // 102 KB payload
      const bigString = 'x'.repeat(102 * 1024);
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ email: testEmail, password: bigString }));
      expect(res.status).toBe(413);
    });
  });
});
