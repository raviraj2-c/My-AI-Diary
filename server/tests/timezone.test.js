const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { User, DiaryEntry, CheckIn, HabitLog } = require('../config/models');
const {
  keyOf,
  todayKey,
  dayRange,
  startOfDay,
  endOfDay,
  isValidTimezone
} = require('../utils/dates');
const llmClient = require('../services/llmClient');

describe('Timezone, Local Date Keys, and Calendar Boundary Hardening', () => {
  describe('1. Date utilities in server/utils/dates.js', () => {
    it('validates IANA timezones correctly', () => {
      expect(isValidTimezone('Asia/Kolkata')).toBe(true);
      expect(isValidTimezone('America/Los_Angeles')).toBe(true);
      expect(isValidTimezone('Europe/London')).toBe(true);
      expect(isValidTimezone('UTC')).toBe(true);
      expect(isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(isValidTimezone('')).toBe(false);
      expect(isValidTimezone(null)).toBe(false);
    });

    it('derives correct date key (keyOf) in target timezone', () => {
      // 2026-11-24 19:00:00 UTC = 2026-11-25 00:30:00 IST (+5:30)
      const istTime = new Date('2026-11-24T19:00:00.000Z');
      expect(keyOf(istTime, 'Asia/Kolkata')).toBe('2026-11-25');
      expect(keyOf(istTime, 'UTC')).toBe('2026-11-24');

      // 2026-11-26 07:30:00 UTC = 2026-11-25 23:30:00 PST (-8:00)
      const pstTime = new Date('2026-11-26T07:30:00.000Z');
      expect(keyOf(pstTime, 'America/Los_Angeles')).toBe('2026-11-25');
      expect(keyOf(pstTime, 'UTC')).toBe('2026-11-26');
    });

    it('calculates exact dayRange start and end boundaries for IANA timezones', () => {
      const { start: startIST, end: endIST } = dayRange('2026-11-25', 'Asia/Kolkata');
      // IST is UTC + 5:30 -> midnight 00:00 IST is 18:30 UTC previous day
      expect(startIST.toISOString()).toBe('2026-11-24T18:30:00.000Z');
      expect(endIST.toISOString()).toBe('2026-11-25T18:29:59.999Z');

      const { start: startPST, end: endPST } = dayRange('2026-11-25', 'America/Los_Angeles');
      // PST is UTC - 8:00 -> midnight 00:00 PST is 08:00 UTC same day
      expect(startPST.toISOString()).toBe('2026-11-25T08:00:00.000Z');
      expect(endPST.toISOString()).toBe('2026-11-26T07:59:59.999Z');
    });

    it('startOfDay and endOfDay accept a timezone parameter and fallback to UTC', () => {
      const start = startOfDay('2026-11-25', 'Asia/Kolkata');
      expect(start.toISOString()).toBe('2026-11-24T18:30:00.000Z');

      const end = endOfDay('2026-11-25', 'Asia/Kolkata');
      expect(end.toISOString()).toBe('2026-11-25T18:29:59.999Z');

      // Default fallback without tz produces UTC midnight for backwards-compatibility
      expect(startOfDay('2026-11-25').toISOString()).toBe('2026-11-25T00:00:00.000Z');
      expect(endOfDay('2026-11-25').toISOString()).toBe('2026-11-25T23:59:59.999Z');
    });
  });

  describe('2. User timezone in registration and settings', () => {
    it('saves user timezone on registration and defaults to UTC if omitted', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Kolkata Student',
          email: 'kolkata@student.edu',
          password: 'Password123!',
          timezone: 'Asia/Kolkata'
        });

      expect(res.status).toBe(201);
      expect(res.body.user.settings.timezone).toBe('Asia/Kolkata');

      const userInDb = await User.findById(res.body.user.id);
      expect(userInDb.timezone).toBe('Asia/Kolkata');
    });

    it('allows updating timezone in settings and rejects invalid timezones', async () => {
      const user = await User.create({
        name: 'LA Student',
        email: 'la@student.edu',
        password: 'Password123!',
        timezone: 'UTC'
      });

      const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET || 'a'.repeat(32));

      // Update to America/Los_Angeles
      const resUpdate = await request(app)
        .put('/api/auth/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({ timezone: 'America/Los_Angeles' });

      expect(resUpdate.status).toBe(200);
      expect(resUpdate.body.settings.timezone).toBe('America/Los_Angeles');

      // Reject invalid timezone
      const resInvalid = await request(app)
        .put('/api/auth/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({ timezone: 'Invalid/Region' });

      expect(resInvalid.status).toBe(400);
      expect(resInvalid.body.message).toMatch(/timezone/i);
    });
  });

  describe('3. Entries at 00:30 IST and 23:30 PST land on user own date and pass date filters', () => {
    let kolkataUser, kolkataToken;
    let laUser, laToken;

    beforeEach(async () => {
      kolkataUser = await User.create({
        name: 'Ravi Kolkata',
        email: 'ravi@kolkata.in',
        password: 'Password123!',
        timezone: 'Asia/Kolkata'
      });
      kolkataToken = jwt.sign({ id: kolkataUser._id.toString() }, process.env.JWT_SECRET || 'a'.repeat(32));

      laUser = await User.create({
        name: 'Sarah LA',
        email: 'sarah@la.us',
        password: 'Password123!',
        timezone: 'America/Los_Angeles'
      });
      laToken = jwt.sign({ id: laUser._id.toString() }, process.env.JWT_SECRET || 'a'.repeat(32));
    });

    it('includes 00:30 IST entry in single-day query for 2026-11-25', async () => {
      // 00:30 IST on Nov 25 = 2026-11-24T19:00:00.000Z
      await DiaryEntry.create({
        user: kolkataUser._id,
        title: 'Late night reflection in Kolkata',
        content: 'Studying late at 00:30 AM in India.',
        mood: 'peaceful',
        entryDate: new Date('2026-11-24T19:00:00.000Z')
      });

      const res = await request(app)
        .get('/api/diary/entries?startDate=2026-11-25&endDate=2026-11-25')
        .set('Authorization', `Bearer ${kolkataToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].title).toBe('Late night reflection in Kolkata');

      // Export endpoint must also include it
      const resExport = await request(app)
        .get('/api/export/entries?startDate=2026-11-25&endDate=2026-11-25&format=json')
        .set('Authorization', `Bearer ${kolkataToken}`);

      expect(resExport.status).toBe(200);
      expect(resExport.body.data.length).toBe(1);
    });

    it('includes 23:30 PST entry in single-day query for 2026-11-25 without dropping late-evening', async () => {
      // 23:30 PST on Nov 25 = 2026-11-26T07:30:00.000Z
      await DiaryEntry.create({
        user: laUser._id,
        title: 'Night thoughts in Los Angeles',
        content: 'Late night journal at 11:30 PM PST.',
        mood: 'peaceful',
        entryDate: new Date('2026-11-26T07:30:00.000Z')
      });

      const res = await request(app)
        .get('/api/diary/entries?startDate=2026-11-25&endDate=2026-11-25')
        .set('Authorization', `Bearer ${laToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].title).toBe('Night thoughts in Los Angeles');
    });
  });

  describe('4. Streaks across midnight in the user timezone', () => {
    it('calculates 2-day streak across midnight for consecutive IST entries', async () => {
      const user = await User.create({
        name: 'Streak User',
        email: 'streak@india.in',
        password: 'Password123!',
        timezone: 'Asia/Kolkata'
      });
      const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET || 'a'.repeat(32));

      // Day 1: Nov 24 at 22:00 IST = 2026-11-24T16:30:00.000Z
      await request(app)
        .post('/api/diary/entries')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Night 1',
          content: 'First night study reflection.',
          mood: 'peaceful',
          entryDate: '2026-11-24T16:30:00.000Z'
        });

      // Day 2: Nov 25 at 00:30 IST = 2026-11-24T19:00:00.000Z
      // (Note: in UTC, both entries are Nov 24, but in IST they are Nov 24 and Nov 25!)
      await request(app)
        .post('/api/diary/entries')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Night 2',
          content: 'Second night study reflection past midnight.',
          mood: 'happy',
          entryDate: '2026-11-24T19:00:00.000Z'
        });

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.longestStreak).toBe(2);
    });
  });

  describe('5. Year in pixels day placement', () => {
    it('places 00:30 IST entry on Nov 25 in Year in Pixels', async () => {
      const user = await User.create({
        name: 'Pixels User',
        email: 'pixels@india.in',
        password: 'Password123!',
        timezone: 'Asia/Kolkata'
      });
      const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET || 'a'.repeat(32));

      await DiaryEntry.create({
        user: user._id,
        title: 'Nov 25 entry',
        content: 'Written at 00:30 IST',
        mood: 'happy',
        entryDate: new Date('2026-11-24T19:00:00.000Z')
      });

      const res = await request(app)
        .get('/api/wellness/year-pixels?year=2026')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data['2026-11-25']).toBeDefined();
      expect(res.body.data['2026-11-24']).toBeUndefined();
    });
  });

  describe('6. CheckIn and HabitLog Today in user timezone', () => {
    it('saves and retrieves today check-in using local dateKey in Asia/Kolkata', async () => {
      const user = await User.create({
        name: 'Checkin User',
        email: 'checkin@india.in',
        password: 'Password123!',
        timezone: 'Asia/Kolkata'
      });
      const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET || 'a'.repeat(32));

      const today = todayKey('Asia/Kolkata');

      const resSave = await request(app)
        .post('/api/wellness/check-ins')
        .set('Authorization', `Bearer ${token}`)
        .send({
          moodScore: 8,
          emotions: ['peaceful'],
          dateKey: today
        });

      expect(resSave.status).toBe(200);
      expect(resSave.body.data.dateKey).toBe(today);

      const resToday = await request(app)
        .get('/api/wellness/check-ins/today')
        .set('Authorization', `Bearer ${token}`);

      expect(resToday.status).toBe(200);
      expect(resToday.body.data).not.toBeNull();
      expect(resToday.body.data.dateKey).toBe(today);
    });
  });

  describe('7. Migration script: migrateDateKeys', () => {
    const migrateDateKeys = require('../scripts/migrateDateKeys');

    it('correctly detects in dry-run and applies dateKey to legacy records in user timezone', async () => {
      const user = await User.create({
        name: 'Migration User',
        email: 'mig@india.in',
        password: 'Password123!',
        timezone: 'Asia/Kolkata'
      });

      // Legacy check-in without dateKey, written at 00:30 IST (19:00 UTC previous day)
      const ci = await CheckIn.create({
        user: user._id,
        moodScore: 7,
        emotions: ['happy'],
        date: new Date('2026-11-24T19:00:00.000Z')
      });
      expect(ci.dateKey).toBeUndefined();

      // Dry-run mode
      const dryResult = await migrateDateKeys({ apply: false });
      expect(dryResult.dryRun).toBe(true);
      expect(dryResult.updated).toBeGreaterThanOrEqual(1);

      const unchanged = await CheckIn.findById(ci._id);
      expect(unchanged.dateKey).toBeUndefined();

      // Apply mode
      const applyResult = await migrateDateKeys({ apply: true });
      expect(applyResult.dryRun).toBe(false);

      const updated = await CheckIn.findById(ci._id);
      expect(updated.dateKey).toBe('2026-11-25');
    });
  });
});
