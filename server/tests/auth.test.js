const request = require('supertest');
const app = require('../index');
const { User } = require('../config/models');
const crypto = require('crypto');

describe('Auth API & Security', () => {
  const validUser = {
    name: 'Alice Wonder',
    email: 'alice@example.com',
    password: 'Password123'
  };

  it('rejects registration with missing or invalid fields', async () => {
    // Missing email
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', password: 'Password123' , ageConfirmed: true});
    expect(res1.status).toBe(400);

    // Invalid email format
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'notanemail', password: 'Password123' , ageConfirmed: true});
    expect(res2.status).toBe(400);

    // Short password (< 8 chars)
    const res3 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice2@example.com', password: 'short' , ageConfirmed: true});
    expect(res3.status).toBe(400);

    // Long password (> 72 chars)
    const res4 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice3@example.com', password: 'A1' + 'a'.repeat(71) , ageConfirmed: true});
    expect(res4.status).toBe(400);

    // Password without number
    const res5 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice4@example.com', password: 'PasswordOnly' , ageConfirmed: true});
    expect(res5.status).toBe(400);

    // Password without letter
    const res6 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice5@example.com', password: '1234567890' , ageConfirmed: true});
    expect(res6.status).toBe(400);
  });

  it('rejects duplicate email registration with 400', async () => {
    // First registration
    const firstRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Original', email: 'duplicate@example.com', password: 'Password123' , ageConfirmed: true});
    expect(firstRes.status).toBe(201);

    // Duplicate registration attempt
    const secondRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Imposter', email: 'duplicate@example.com', password: 'Password999' , ageConfirmed: true});
    expect(secondRes.status).toBe(400);
    expect(secondRes.body.message).toMatch(/already exists/i);
  });

  it('rejects NoSQL object injection on registration and login', async () => {
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Attacker',
        email: { $gt: '' },
        password: 'Password123'
      , ageConfirmed: true});
    expect(res1.status).toBe(400);

    const res2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: { $gt: '' },
        password: { $gt: '' }
      });
    expect(res2.status).toBe(400);
  });

  it('registers a new user and logs in successfully', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, ageConfirmed: true });
    expect(regRes.status).toBe(201);
    expect(regRes.body.token).toBeDefined();
    expect(regRes.body.user.email).toBe(validUser.email);

    // Login with valid credentials
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();

    // Login with wrong password gives generic message
    const wrongRes = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'WrongPassword999' });
    expect(wrongRes.status).toBe(401);
    expect(wrongRes.body.message).toMatch(/Invalid credentials/i);
  });

  it('forgot-password response never reveals whether the email exists', async () => {
    // Registered user
    const res1 = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: validUser.email });
    expect(res1.status).toBe(200);
    expect(res1.body.message).toMatch(/If an account exists with that email, reset instructions have been sent\./i);

    // Non-existent email gets the EXACT same generic response
    const res2 = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost_nonexistent_user@example.com' });
    expect(res2.status).toBe(200);
    expect(res2.body.message).toMatch(/If an account exists with that email, reset instructions have been sent\./i);
  });

  it('password reset: token generation, 30-min expiry, single-use enforcement, and old password invalidation', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Charlie', email: 'charlie@example.com', password: 'OldPassword123' , ageConfirmed: true});

    // Request password reset
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'charlie@example.com' });
    expect(forgotRes.status).toBe(200);

    // Retrieve the reset token directly from database
    const user = await User.findOne({ email: 'charlie@example.com' });
    expect(user.resetPasswordToken).toBeDefined();
    expect(user.resetPasswordExpires).toBeDefined();

    // Verify token expiry: expired token is rejected with 400
    const rawExpiredToken = crypto.randomBytes(32).toString('hex');
    const hashedExpiredToken = crypto.createHash('sha256').update(rawExpiredToken).digest('hex');
    user.resetPasswordToken = hashedExpiredToken;
    user.resetPasswordExpires = Date.now() - 1000; // already expired
    await user.save();

    const expiredRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawExpiredToken, password: 'NewPassword123' });
    expect(expiredRes.status).toBe(400);
    expect(expiredRes.body.message).toMatch(/expired|invalid/i);

    // For valid testing, generate a known raw token and store its sha256 hash in DB
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    // Reset password using the raw token
    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawResetToken, password: 'NewPassword123' });
    expect(resetRes.status).toBe(200);

    // Single use: reusing the exact same reset token fails
    const reuseRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawResetToken, password: 'AnotherPassword123' });
    expect(reuseRes.status).toBe(400);

    // Old password stops working
    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'charlie@example.com', password: 'OldPassword123' });
    expect(oldLogin.status).toBe(401);

    // New password works
    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'charlie@example.com', password: 'NewPassword123' });
    expect(newLogin.status).toBe(200);
  });

  it('rate limiting on login triggers 429 when max attempts reached', async () => {
    // Attempt 1
    await request(app)
      .post('/api/auth/login')
      .set('x-test-rate-limit', 'true')
      .send({ email: 'ratelimit@example.com', password: 'Password123' });

    // Attempt 2
    await request(app)
      .post('/api/auth/login')
      .set('x-test-rate-limit', 'true')
      .send({ email: 'ratelimit@example.com', password: 'Password123' });

    // Attempt 3 exceeds limit (max 2 for test limiter)
    const res = await request(app)
      .post('/api/auth/login')
      .set('x-test-rate-limit', 'true')
      .send({ email: 'ratelimit@example.com', password: 'Password123' });

    expect(res.status).toBe(429);
  });

  describe('Settings Handling, Language Validation & Secrets Protection', () => {
    let authToken;

    beforeEach(async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Settings User', email: 'settingsuser@example.com', password: 'Password123' , ageConfirmed: true});
      authToken = reg.body.token;
    });

    it('accepts language "hi" and updates settings', async () => {
      const res = await request(app)
        .put('/api/auth/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ settings: { language: 'hi' } });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.settings.language).toBe('hi');
    });

    it('rejects unsupported language "xx" with 400', async () => {
      const res = await request(app)
        .put('/api/auth/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ settings: { language: 'xx' } });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid value for language/i);
    });

    it('speechLanguage "es" is accepted', async () => {
      const res = await request(app)
        .put('/api/auth/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ settings: { speechLanguage: 'es' } });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.settings.speechLanguage).toBe('es');
    });

    it('GET /api/auth/me returns the full settings object and no secrets', async () => {
      await request(app)
        .put('/api/auth/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ settings: { language: 'hi', speechLanguage: 'es' } });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = res.body.user;
      expect(user).toBeDefined();

      // Check full settings object returned
      expect(user.settings).toBeDefined();
      expect(user.settings.theme).toBeDefined();
      expect(user.settings.fontSize).toBeDefined();
      expect(user.settings.fontFamily).toBeDefined();
      expect(user.settings.language).toBe('hi');
      expect(user.settings.speechLanguage).toBe('es');
      expect(user.settings.country).toBeDefined();
      expect(user.settings.trustedContact).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          phone: expect.any(String),
          relation: expect.any(String)
        })
      );
      expect(user.settings.reminderEnabled).toBeDefined();
      expect(user.settings.reminderTime).toBeDefined();
      expect(user.settings.allowAIFeatures).toBeDefined();

      // Ensure no secrets are leaked
      expect(user.password).toBeUndefined();
      expect(user.appLockPinHash).toBeUndefined();
      expect(user.resetPasswordToken).toBeUndefined();
      expect(user.resetPasswordExpires).toBeUndefined();
      expect(user.settings.password).toBeUndefined();
      expect(user.settings.appLockPinHash).toBeUndefined();
    });
  });

  describe('Machine Error Codes & Resilience (Auth Failures & DB Errors)', () => {
    it('returns 401 TOKEN_INVALID when token is missing or malformed', async () => {
      const res1 = await request(app).get('/api/auth/me');
      expect(res1.status).toBe(401);
      expect(res1.body.code).toBe('TOKEN_INVALID');

      const res2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-string');
      expect(res2.status).toBe(401);
      expect(res2.body.code).toBe('TOKEN_INVALID');
    });

    it('returns 401 BAD_CREDENTIALS on wrong login credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'WrongPassword999' });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('BAD_CREDENTIALS');
    });

    it('returns 401 TOKEN_EXPIRED on tokenVersion mismatch (session revoked/expired)', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Bob Version', email: 'bob.version@example.com', password: 'Password123' , ageConfirmed: true});
      const bobToken = regRes.body.token;

      // Bump tokenVersion directly in database
      await User.findByIdAndUpdate(regRes.body.user.id, { tokenVersion: 99 });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${bobToken}`);
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_EXPIRED');
    });

    it('returns 503 SERVICE_UNAVAILABLE when database throws in auth middleware without wiping session', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'DB Error User', email: 'db.error@example.com', password: 'Password123' , ageConfirmed: true});
      const dbToken = regRes.body.token;

      // Mock User.findById to simulate database connection drop / timeout
      const origFindById = User.findById;
      User.findById = jest.fn().mockImplementation(() => {
        throw new Error('MongoNetworkTimeoutError: connection timed out');
      });

      try {
        const res = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${dbToken}`);
        expect(res.status).toBe(503);
        expect(res.body.code).toBe('SERVICE_UNAVAILABLE');
        expect(res.body.message).toMatch(/temporarily unavailable/i);
      } finally {
        User.findById = origFindById;
      }
    });

    it('returns 401 BAD_CREDENTIALS on wrong PIN without returning TOKEN_INVALID/TOKEN_EXPIRED', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Pin Tester', email: 'pin.tester@example.com', password: 'Password123' , ageConfirmed: true});
      const pinToken = regRes.body.token;

      // Setup PIN
      await request(app)
        .post('/api/auth/app-lock/setup')
        .set('Authorization', `Bearer ${pinToken}`)
        .send({ pin: '4321', password: 'Password123' });

      // Wrong PIN
      const wrongPinRes = await request(app)
        .post('/api/auth/app-lock/verify')
        .set('Authorization', `Bearer ${pinToken}`)
        .send({ pin: '0000' });

      expect(wrongPinRes.status).toBe(401);
      expect(wrongPinRes.body.code).toBe('BAD_CREDENTIALS');
      expect(wrongPinRes.body.attemptsRemaining).toBe(4);
    });
  });

  describe('18+ Age Confirmation on Registration', () => {
    it('rejects registration with 400 when ageConfirmed is missing or false', async () => {
      const resMissing = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Underage Test', email: 'underage1@example.com', password: 'Password123' });
      expect(resMissing.status).toBe(400);
      expect(resMissing.body.code).toBe('AGE_CONFIRMATION_REQUIRED');

      const resFalse = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Underage Test', email: 'underage2@example.com', password: 'Password123', ageConfirmed: false });
      expect(resFalse.status).toBe(400);
    });

    it('stores ageConfirmedAt on User when ageConfirmed is true', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Adult User', email: 'adult@example.com', password: 'Password123', ageConfirmed: true });
      expect(res.status).toBe(201);
      const dbUser = await User.findById(res.body.user.id);
      expect(dbUser.ageConfirmedAt).toBeInstanceOf(Date);
    });
  });
});
