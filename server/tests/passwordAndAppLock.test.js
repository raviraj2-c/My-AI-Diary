const request = require('supertest');
const app = require('../app');
const {
  User,
  DiaryEntry,
  CheckIn,
  HabitLog,
  GratitudeEntry,
  Exam,
  SmallWin
} = require('../config/models');

describe('User matchPassword, Delete-Account & App Lock Verification', () => {
  let user;
  let token;
  const userPassword = 'TestPassword123!';

  beforeEach(async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Password Tester',
        email: `pwd-tester-${Date.now()}@example.com`,
        password: userPassword
      });

    token = regRes.body.token;
    user = regRes.body.user;
  });

  describe('User Schema matchPassword Method', () => {
    it('returns true for correct plain password and false for incorrect password', async () => {
      const dbUser = await User.findById(user.id).select('+password');
      expect(dbUser).toBeDefined();
      expect(typeof dbUser.matchPassword).toBe('function');

      const isCorrect = await dbUser.matchPassword(userPassword);
      expect(isCorrect).toBe(true);

      const isWrong = await dbUser.matchPassword('WrongPassword999!');
      expect(isWrong).toBe(false);
    });
  });

  describe('delete-account Password Verification & Cascading Removal', () => {
    beforeEach(async () => {
      // Seed data across multiple collections for this user
      await DiaryEntry.create({
        user: user.id,
        title: 'Entry to be deleted',
        content: '<p>Secret thoughts</p>',
        mood: 'happy',
        entryDate: new Date()
      });
      await CheckIn.create({
        user: user.id,
        date: '2026-11-20',
        moodScore: 4,
        stressLevel: 2,
        sleepHours: 8,
        note: 'Good day'
      });
      await HabitLog.create({
        user: user.id,
        date: '2026-11-20',
        habits: { meditation: true }
      });
      await GratitudeEntry.create({
        user: user.id,
        items: ['Family', 'Health']
      });
      await Exam.create({
        user: user.id,
        subject: 'Algorithms',
        date: new Date('2026-12-01')
      });
      await SmallWin.create({
        user: user.id,
        dateKey: '2026-11-20',
        tasks: [{ text: 'Drink water', completed: true }]
      });
    });

    it('rejects deletion with wrong password: returns 401 and deletes nothing', async () => {
      const res = await request(app)
        .post('/api/auth/delete-account')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'WrongPassword999!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);

      // Verify user document still exists
      const existingUser = await User.findById(user.id);
      expect(existingUser).not.toBeNull();

      // Verify all collections still retain user's records
      const [entries, checkIns, habits, gratitudes, exams, smallWins] = await Promise.all([
        DiaryEntry.find({ user: user.id }),
        CheckIn.find({ user: user.id }),
        HabitLog.find({ user: user.id }),
        GratitudeEntry.find({ user: user.id }),
        Exam.find({ user: user.id }),
        SmallWin.find({ user: user.id })
      ]);

      expect(entries).toHaveLength(1);
      expect(checkIns).toHaveLength(1);
      expect(habits).toHaveLength(1);
      expect(gratitudes).toHaveLength(1);
      expect(exams).toHaveLength(1);
      expect(smallWins).toHaveLength(1);
    });

    it('processes deletion with correct password: cascades removal across ALL collections', async () => {
      const res = await request(app)
        .post('/api/auth/delete-account')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: userPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify user is gone
      const deletedUser = await User.findById(user.id);
      expect(deletedUser).toBeNull();

      // Verify all collections have 0 records for user
      const [entries, checkIns, habits, gratitudes, exams, smallWins] = await Promise.all([
        DiaryEntry.find({ user: user.id }),
        CheckIn.find({ user: user.id }),
        HabitLog.find({ user: user.id }),
        GratitudeEntry.find({ user: user.id }),
        Exam.find({ user: user.id }),
        SmallWin.find({ user: user.id })
      ]);

      expect(entries).toHaveLength(0);
      expect(checkIns).toHaveLength(0);
      expect(habits).toHaveLength(0);
      expect(gratitudes).toHaveLength(0);
      expect(exams).toHaveLength(0);
      expect(smallWins).toHaveLength(0);
    });
  });

  describe('App Lock Setup, Verification, 5-Attempt Lockout & Password Reset', () => {
    it('requires correct account password to setup PIN, and rejects invalid PIN formats', async () => {
      // Invalid PIN format (< 4 digits)
      const badPin = await request(app)
        .post('/api/auth/app-lock/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '12', password: userPassword });
      expect(badPin.status).toBe(400);

      // Wrong account password
      const wrongPwd = await request(app)
        .post('/api/auth/app-lock/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '1234', password: 'WrongPassword!' });
      expect(wrongPwd.status).toBe(401);

      // Correct setup
      const okSetup = await request(app)
        .post('/api/auth/app-lock/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '1234', password: userPassword });
      expect(okSetup.status).toBe(200);
      expect(okSetup.body.success).toBe(true);
    });

    it('verifies correct PIN, enforces 60s freeze after 5 wrong attempts, and unlocks/resets via password', async () => {
      // 1. Setup PIN
      await request(app)
        .post('/api/auth/app-lock/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '5678', password: userPassword });

      // 2. Verify with correct PIN
      const correctPinRes = await request(app)
        .post('/api/auth/app-lock/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '5678' });
      expect(correctPinRes.status).toBe(200);
      expect(correctPinRes.body.success).toBe(true);

      // 3. Four incorrect attempts (each returns 401 with decreasing remaining attempts)
      for (let i = 1; i <= 4; i++) {
        const failRes = await request(app)
          .post('/api/auth/app-lock/verify')
          .set('Authorization', `Bearer ${token}`)
          .send({ pin: '0000' });
        expect(failRes.status).toBe(401);
        expect(failRes.body.attemptsRemaining).toBe(5 - i);
      }

      // 4. 5th incorrect attempt triggers 429 lockout frozen for 60 seconds
      const freezeRes = await request(app)
        .post('/api/auth/app-lock/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '0000' });
      expect(freezeRes.status).toBe(429);
      expect(freezeRes.body.lockedSeconds).toBe(60);

      // 5. While locked out, even the correct PIN receives 429
      const lockedRes = await request(app)
        .post('/api/auth/app-lock/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '5678' });
      expect(lockedRes.status).toBe(429);

      // 6. Reset/disable app lock using account password
      const disableRes = await request(app)
        .post('/api/auth/app-lock/disable')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: userPassword });
      expect(disableRes.status).toBe(200);
      expect(disableRes.body.success).toBe(true);

      // 7. Re-setup with new PIN clears previous lockout completely
      await request(app)
        .post('/api/auth/app-lock/setup')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '9999', password: userPassword });

      const newVerify = await request(app)
        .post('/api/auth/app-lock/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '9999' });
      expect(newVerify.status).toBe(200);
      expect(newVerify.body.success).toBe(true);
    });
  });
});
