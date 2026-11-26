const request = require('supertest');
const app = require('../app');
const { DiaryEntry, CheckIn, FutureLetter } = require('../config/models');
const { computeMoodDays, MOOD_SCORE_MAP } = require('../utils/moodScale');

describe('Part U1: Unified Mood Scale, Calendar, Pagination & Home Summary', () => {
  let token;
  let userId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'U1 Tester',
        email: 'u1@example.com',
        password: 'Password123',
        timezone: 'Asia/Kolkata',
        ageConfirmed: true
      });
    token = res.body.token;
    userId = res.body.user.id;
  });

  describe('U1.1 mood-days rule (check-in wins; entry fallback; no data)', () => {
    it('computeMoodDays prefers check-in score over entry mood and averages multiple entries', () => {
      const days = computeMoodDays({
        checkIns: [{ dateKey: '2026-11-10', moodScore: 9, emotions: ['joy'] }],
        entries: [
          { dateKey: '2026-11-10', mood: 'sad' }, // overridden by check-in
          { dateKey: '2026-11-11', mood: 'happy' }, // 8
          { dateKey: '2026-11-11', mood: 'anxious' } // 4 -> avg 6
        ],
        tz: 'Asia/Kolkata'
      });

      expect(days).toEqual([
        { date: '2026-11-10', score: 9, source: 'checkin', emotions: ['joy'] },
        { date: '2026-11-11', score: 6, source: 'entry', emotions: ['happy', 'anxious'] }
      ]);
      expect(MOOD_SCORE_MAP.excited).toBe(9);
      expect(MOOD_SCORE_MAP.sad).toBe(3);
    });

    it('GET /api/wellness/mood-days returns unified day moods and empty array when no data', async () => {
      const emptyRes = await request(app)
        .get('/api/wellness/mood-days?from=2026-10-01&to=2026-10-07')
        .set('Authorization', `Bearer ${token}`);
      expect(emptyRes.status).toBe(200);
      expect(emptyRes.body.data).toEqual([]);

      await DiaryEntry.create({
        user: userId,
        title: 'Peaceful day',
        content: 'Quiet afternoon',
        mood: 'peaceful',
        entryDate: new Date('2026-11-05T10:00:00Z'),
        dateKey: '2026-11-05'
      });
      await CheckIn.create({
        user: userId,
        moodScore: 4,
        emotions: ['tired'],
        date: new Date('2026-11-06T10:00:00Z'),
        dateKey: '2026-11-06'
      });

      const res = await request(app)
        .get('/api/wellness/mood-days?from=2026-11-05&to=2026-11-06')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([
        { date: '2026-11-05', score: 7, source: 'entry', emotions: ['peaceful'] },
        { date: '2026-11-06', score: 4, source: 'checkin', emotions: ['tired'] }
      ]);
    });

    it('GET /api/wellness/insights counts 7 diary-only days as enough data', async () => {
      const now = Date.now();
      for (let i = 0; i < 7; i++) {
        await DiaryEntry.create({
          user: userId,
          title: `Day ${i}`,
          content: 'Diary only day',
          mood: 'happy',
          entryDate: new Date(now - i * 86400000)
        });
      }

      const res = await request(app)
        .get('/api/wellness/insights?range=month')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.hasEnoughData).toBe(true);
      expect(res.body.data.averageMood).toBe(8);
    });
  });

  describe('U1.2 calendar endpoint and entries pagination', () => {
    it('GET /api/diary/calendar returns older month dates without decrypting content', async () => {
      await DiaryEntry.create({
        user: userId,
        title: 'Six months ago',
        content: 'Secret encrypted content from May',
        mood: 'peaceful',
        entryDate: new Date('2026-05-14T10:00:00Z'),
        dateKey: '2026-05-14'
      });

      const res = await request(app)
        .get('/api/diary/calendar?month=2026-05')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([
        { date: '2026-05-14', count: 1, mood: 'peaceful', hasMedia: false }
      ]);
      expect(res.body.data[0].content).toBeUndefined();
    });

    it('GET /api/diary/entries uses DB pagination without search and returns searchNote with search', async () => {
      for (let i = 0; i < 5; i++) {
        await DiaryEntry.create({
          user: userId,
          title: `Entry ${i}`,
          content: i === 2 ? 'Special needle phrase' : `Routine content ${i}`,
          mood: 'neutral',
          entryDate: new Date(Date.UTC(2026, 10, 1 + i))
        });
      }

      const pageRes = await request(app)
        .get('/api/diary/entries?page=2&limit=2')
        .set('Authorization', `Bearer ${token}`);
      expect(pageRes.status).toBe(200);
      expect(pageRes.body.data).toHaveLength(2);
      expect(pageRes.body.pagination.total).toBe(5);
      expect(pageRes.body.searchNote).toBeUndefined();

      const searchRes = await request(app)
        .get('/api/diary/entries?search=needle')
        .set('Authorization', `Bearer ${token}`);
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data).toHaveLength(1);
      expect(searchRes.body.searchNote).toBe('searched the latest 500 entries');
    });
  });

  describe('U1.3 home-summary shape & streak definition', () => {
    it('returns expected home-summary shape with 7 weekDays and streakDays', async () => {
      const now = new Date();
      await DiaryEntry.create({
        user: userId,
        title: 'Latest reflection',
        content: 'Today thought',
        mood: 'happy',
        entryDate: now
      });
      await FutureLetter.create({
        user: userId,
        title: 'Past self note',
        content: 'You got this',
        writtenOn: new Date(Date.now() - 86400000 * 5),
        deliverOn: new Date(Date.now() - 1000)
      });

      const res = await request(app)
        .get('/api/wellness/home-summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.todayDone).toBe(false);
      expect(res.body.data.todayScore).toBe(8);
      expect(res.body.data.weekDays).toHaveLength(7);
      expect(res.body.data.streakDays).toBe(1);
      expect(res.body.data.lastEntry).toMatchObject({
        title: 'Latest reflection',
        mood: 'happy'
      });
      expect(res.body.data.dueLetters).toBe(1);
    });
  });
});
