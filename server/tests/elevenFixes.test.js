const request = require('supertest');
const crypto = require('crypto');
const app = require('../index');
const {
  User,
  DiaryEntry,
  CheckIn,
  HabitLog,
  GratitudeEntry,
  ChatMessage,
  ThoughtRecord,
  SelfCheck,
  CounselorReport,
  Exam,
  SmallWin
} = require('../config/models');
const { stripAllTags } = require('../utils/sanitize');
const { evaluateBurnout } = require('../utils/burnout');

describe('Eleven Reliability, Security & Data Integrity Improvements', () => {
  let user, token;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Tester Eleven',
        email: 'tester.eleven@example.com',
        password: 'Password123'
      });
    user = res.body.user;
    token = res.body.token;

    // Enable AI features for this user
    await User.findByIdAndUpdate(user.id || user._id, {
      allowAIFeatures: true,
      allowDiaryAI: true
    });
  });

  // 1. Maxlength on Encrypted Fields
  describe('1. Maxlength on Encrypted Fields', () => {
    it('saves 500-char English and 200-char Hindi text in CheckIn note and Gratitude items without 400 or ciphertext in error', async () => {
      const englishNote500 = 'A'.repeat(500);
      const checkInRes = await request(app)
        .post('/api/wellness/checkins')
        .set('Authorization', `Bearer ${token}`)
        .send({
          moodScore: 8,
          note: englishNote500
        });
      expect(checkInRes.status).toBe(200);
      expect(checkInRes.body.data.note).toBe(englishNote500);

      // 200-char Hindi text: 50 repetitions of 'नमस्ते ' (7 chars each, total 350 chars sliced to 200)
      const hindi200 = 'नमस्ते मेरा दिन आज बहुत शांत और सुखद रहा '.repeat(6).slice(0, 200);
      const gratitudeRes = await request(app)
        .post('/api/wellness/gratitude')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [hindi200]
        });
      expect(gratitudeRes.status).toBe(201);
      expect(gratitudeRes.body.data.items[0]).toBe(hindi200);

      // Exam notes: 1000 chars English
      const examNotes1000 = 'E'.repeat(1000);
      const examRes = await request(app)
        .post('/api/student/exams')
        .set('Authorization', `Bearer ${token}`)
        .send({
          subject: 'Psychology',
          date: new Date(Date.now() + 86400000).toISOString(),
          notes: examNotes1000
        });
      expect(examRes.status).toBe(201);
      expect(examRes.body.data.notes).toBe(examNotes1000);

      // Reject plaintext exceeding controller character limit cleanly without echoing ciphertext
      const note501 = 'B'.repeat(501);
      const overNoteRes = await request(app)
        .post('/api/wellness/checkins')
        .set('Authorization', `Bearer ${token}`)
        .send({
          moodScore: 7,
          note: note501
        });
      expect(overNoteRes.status).toBe(400);
      expect(overNoteRes.body.message).not.toContain('enc:v1:');
    });
  });

  // 2. ChatMessage list (latest 50 in ascending chronological order)
  describe('2. ChatMessage List Ordering', () => {
    it('returns the latest 50 messages in ascending chronological order', async () => {
      const baseTime = Date.now() - 60 * 60 * 1000;
      const msgsToInsert = [];
      for (let i = 1; i <= 60; i++) {
        msgsToInsert.push({
          user: user.id || user._id,
          role: i % 2 === 1 ? 'user' : 'assistant',
          content: `Message ${i}`,
          mode: 'chat',
          createdAt: new Date(baseTime + i * 1000)
        });
      }
      await ChatMessage.insertMany(msgsToInsert);

      const res = await request(app)
        .get('/api/chat/messages')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const messages = res.body.data;
      expect(messages.length).toBe(50);
      // Oldest 10 (Messages 1 to 10) must NOT be present
      expect(messages[0].content).toBe('Message 11');
      expect(messages[messages.length - 1].content).toBe('Message 60');
      // Must be sorted in ascending order (Message 11 ... Message 60)
      for (let i = 0; i < messages.length - 1; i++) {
        expect(new Date(messages[i].createdAt).getTime()).toBeLessThan(
          new Date(messages[i + 1].createdAt).getTime()
        );
      }
    });
  });

  // 3. saveThoughtRecord intensity parsing & limits
  describe('3. saveThoughtRecord Intensity Parsing & Limits', () => {
    it('accepts intensity 0, clamps 0-100, and caps field lengths', async () => {
      const resZero = await request(app)
        .post('/api/ai/thoughts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          situation: 'Giving a speech',
          thought: 'I might freeze',
          initialIntensity: 0,
          finalIntensity: 0
        });

      expect(resZero.status).toBe(201);
      expect(resZero.body.data.initialIntensity).toBe(0);
      expect(resZero.body.data.finalIntensity).toBe(0);

      // Clamping out-of-range intensities
      const resClamped = await request(app)
        .post('/api/ai/thoughts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          situation: 'Exam day',
          thought: 'Overwhelmed',
          initialIntensity: 150,
          finalIntensity: -20
        });
      expect(resClamped.status).toBe(201);
      expect(resClamped.body.data.initialIntensity).toBe(100);
      expect(resClamped.body.data.finalIntensity).toBe(0);

      // Situation exceeding 2000 chars rejected with 400
      const longSituation = 'S'.repeat(2001);
      const resLong = await request(app)
        .post('/api/ai/thoughts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          situation: longSituation,
          thought: 'Normal thought'
        });
      expect(resLong.status).toBe(400);
    });
  });

  // 4. stripAllTags entity decoding
  describe('4. stripAllTags Entity Decoding', () => {
    it('decodes HTML entities and preserves literal strings like &, <3, quotes', () => {
      expect(stripAllTags('Tom & Jerry <3')).toBe('Tom & Jerry <3');
      expect(stripAllTags('Love & Peace & "Hope"')).toBe('Love & Peace & "Hope"');
      expect(stripAllTags("<script>alert('xss')</script>Hello & welcome")).toBe('Hello & welcome');
    });
  });

  // 5. Counselor Share Security & TTL
  describe('5. Counselor Share Security & TTL', () => {
    it('only accepts raw token and rejects direct lookup by token hash', async () => {
      const shareRes = await request(app)
        .post('/api/wellness/counselor-share')
        .set('Authorization', `Bearer ${token}`)
        .send({ range: 'month' });

      expect(shareRes.status).toBe(201);
      const rawToken = shareRes.body.data.token;
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Looking up with rawToken works
      const validGet = await request(app)
        .get(`/api/wellness/shared/${rawToken}`);
      expect(validGet.status).toBe(200);

      // Looking up with tokenHash directly MUST fail with 404 (prevent leaked DB hash from being used as a link)
      const invalidGet = await request(app)
        .get(`/api/wellness/shared/${tokenHash}`);
      expect(invalidGet.status).toBe(404);
    });
  });

  // 6. Streaks Recomputation
  describe('6. Streaks Recomputation', () => {
    it('recalculates streaks accurately on backdated entries and deletion', async () => {
      const userId = user.id || user._id;

      // 1. Entry for today (UTC)
      const today = new Date();
      await request(app)
        .post('/api/diary/entries')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Today Entry',
          content: '<p>Entry for today</p>',
          mood: 'happy',
          entryDate: today.toISOString()
        });

      let u = await User.findById(userId);
      expect(u.currentStreak).toBe(1);
      expect(u.longestStreak).toBe(1);

      // 2. Backdated entry for yesterday
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const resYesterday = await request(app)
        .post('/api/diary/entries')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Yesterday Entry',
          content: '<p>Entry for yesterday</p>',
          mood: 'peaceful',
          entryDate: yesterday.toISOString()
        });
      const yesterdayId = resYesterday.body.data._id || resYesterday.body.data.id;

      u = await User.findById(userId);
      expect(u.currentStreak).toBe(2);
      expect(u.longestStreak).toBe(2);

      // 3. Delete yesterday's entry -> streak resets to 1 (only today left)
      await request(app)
        .delete(`/api/diary/entries/${yesterdayId}`)
        .set('Authorization', `Bearer ${token}`);

      u = await User.findById(userId);
      expect(u.currentStreak).toBe(1);
      expect(u.longestStreak).toBe(1);
    });
  });

  // 7. Happy Box Queries
  describe('7. Happy Box Prioritizing Favorites and using $expr for On This Day', () => {
    it('prioritizes isFavorite entries and queries On This Day with $expr', async () => {
      const userId = user.id || user._id;

      // Create 5 favorite entries with neutral mood
      for (let i = 1; i <= 5; i++) {
        await DiaryEntry.create({
          user: userId,
          title: `Favorite Entry ${i}`,
          content: `Content ${i}`,
          mood: 'neutral',
          moodScore: 5,
          isFavorite: true,
          entryDate: new Date(Date.now() - i * 1000)
        });
      }

      // Create 20 happy entries (not favorite)
      for (let i = 1; i <= 20; i++) {
        await DiaryEntry.create({
          user: userId,
          title: `Happy Entry ${i}`,
          content: `Happy Content ${i}`,
          mood: 'happy',
          moodScore: 9,
          isFavorite: false,
          entryDate: new Date(Date.now() + i * 1000)
        });
      }

      // Create an "On This Day" entry exactly 1 year ago (same UTC month and day)
      const now = new Date();
      const pastYearDate = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));
      await DiaryEntry.create({
        user: userId,
        title: 'One Year Ago Reflection',
        content: 'Remembering last year',
        mood: 'peaceful',
        entryDate: pastYearDate
      });

      const res = await request(app)
        .get('/api/wellness/happy-box')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const { favorites, onThisDay } = res.body.data;

      // All 5 favorite entries must be present (not crowded out)
      const favoriteTitles = favorites.map(f => f.title);
      for (let i = 1; i <= 5; i++) {
        expect(favoriteTitles).toContain(`Favorite Entry ${i}`);
      }

      // On this day entry must be retrieved
      expect(onThisDay.some(e => e.title === 'One Year Ago Reflection')).toBe(true);
    });
  });

  // 8. saveSelfCheck Server Scoring & Item 9 Risk
  describe('8. saveSelfCheck Server Scoring & Item 9 Risk', () => {
    it('recomputes score/severity on the server and flags high risk on PHQ-9 item 9', async () => {
      // Client sends false score 25 and severity 'Severe', but answers sum to 2
      const answers = [0, 0, 0, 1, 0, 0, 0, 0, 1]; // Item 9 has score 1
      const res = await request(app)
        .post('/api/wellness/self-checks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'PHQ-9',
          score: 25,
          severity: 'Severe',
          answers
        });

      expect(res.status).toBe(201);
      // Server recalculated score should be 2
      expect(res.body.data.score).toBe(2);
      expect(res.body.data.severity.toLowerCase()).toContain('minimal');
      // Safety level must be 'high' because item 9 > 0
      expect(res.body.safety?.level).toBe('high');

      // Invalid answers array rejected with 400
      const invalidRes = await request(app)
        .post('/api/wellness/self-checks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'PHQ-9',
          answers: [1, 2] // only 2 items instead of 9
        });
      expect(invalidRes.status).toBe(400);
    });
  });

  // 9. Burnout 7-Day Window & Sleep Fallback
  describe('9. Burnout 7-Day Window & Sleep Fallback', () => {
    it('formats dynamic message with exact highStressDays and falls back to habit sleep', async () => {
      const checkIns = [
        { stress: 5, sleepHours: 5 },
        { stress: 4, sleepHours: 6 },
        { stress: 5, sleepHours: null }, // missing sleep
        { stress: 4, sleepHours: 5 },
        { stress: 5, sleepHours: 6 },
        { stress: 5, sleepHours: 5 }
      ];
      const result = evaluateBurnout(checkIns);
      expect(result.warning).toBe(true);
      expect(result.highStressDays).toBe(6);
      expect(result.message).toContain('6 of the last 7 days');

      // In studentController getBurnoutStatus, verify fallback to habit log sleep
      const userId = user.id || user._id;
      const today = new Date();
      for (let i = 0; i < 6; i++) {
        const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
        await CheckIn.create({
          user: userId,
          date: d,
          moodScore: 3,
          stress: 5,
          sleepHours: null // no check-in sleep
        });
        await HabitLog.create({
          user: userId,
          date: d,
          sleepHours: 5 // fallback habit sleep
        });
      }

      const statusRes = await request(app)
        .get('/api/student/burnout-status')
        .set('Authorization', `Bearer ${token}`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.warning).toBe(true);
      expect(statusRes.body.data.highStressDays).toBe(6);
      expect(statusRes.body.data.avgSleepHours).toBe(5);
    });
  });

  // 10. Input Validation Limits Across Controllers
  describe('10. Input Validation Limits Across Controllers', () => {
    it('enforces input limits on tags, content, entryDate, dateKey, and storybook pagination', async () => {
      // Tags count limit (max 20)
      const tags21 = Array.from({ length: 21 }, (_, i) => `tag${i}`);
      const tagCountRes = await request(app)
        .post('/api/diary/entries')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Too many tags',
          content: 'Content',
          mood: 'happy',
          tags: tags21
        });
      expect(tagCountRes.status).toBe(400);

      // Tag length limit (max 30 chars per tag)
      const longTag = 'T'.repeat(31);
      const tagLenRes = await request(app)
        .post('/api/diary/entries')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Long tag',
          content: 'Content',
          mood: 'happy',
          tags: [longTag]
        });
      expect(tagLenRes.status).toBe(400);

      // Content length limit (max 100,000 chars)
      const hugeContent = 'C'.repeat(100001);
      const contentRes = await request(app)
        .post('/api/diary/entries')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Huge entry',
          content: hugeContent,
          mood: 'happy'
        });
      expect(contentRes.status).toBe(400);

      // Invalid entryDate returns 400
      const dateRes = await request(app)
        .post('/api/diary/entries')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Bad Date',
          content: 'Content',
          mood: 'happy',
          entryDate: 'invalid-date-string'
        });
      expect(dateRes.status).toBe(400);

      // dateKey format validation in small wins
      const badDateKeyRes = await request(app)
        .get('/api/student/small-wins?date=bad-format')
        .set('Authorization', `Bearer ${token}`);
      expect(badDateKeyRes.status).toBe(400);

      // Clamping pagination in getStorybooks
      const storybooksRes = await request(app)
        .get('/api/ai/storybooks?page=0&limit=999')
        .set('Authorization', `Bearer ${token}`);
      expect(storybooksRes.status).toBe(200);
      expect(storybooksRes.body.pagination.limit).toBeLessThanOrEqual(50);
      expect(storybooksRes.body.pagination.page).toBeGreaterThanOrEqual(1);
    });
  });

  // 11. errorHandler Fixes (CastError and CORS 403 checks)
  describe('11. errorHandler Fixes', () => {
    it('returns 400 with "Invalid resource identifier" on CastError', async () => {
      const res = await request(app)
        .get('/api/diary/entries/invalid-mongo-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid');
    });

    it('preserves custom 403 message instead of overwriting with "Not allowed by CORS"', async () => {
      // Disable AI for user and invoke AI endpoint
      await User.findByIdAndUpdate(user.id || user._id, { allowAIFeatures: false });
      const res = await request(app)
        .post('/api/ai/ask-diary')
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'How was my day?' });

      expect(res.status).toBe(403);
      expect(res.body.message).not.toBe('Not allowed by CORS');
    });
  });
});
