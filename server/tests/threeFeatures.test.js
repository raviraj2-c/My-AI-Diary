const request = require('supertest');
const app = require('../index');
const {
  User,
  DiaryEntry,
  CheckIn,
  FutureLetter,
  CopingPlan
} = require('../config/models');

describe('Three Small Features: Year in Pixels, Letters to Future Self, Coping Plan', () => {
  let userA, tokenA, userB, tokenB;
  const userPassword = 'TestPassword123!';

  beforeEach(async () => {
    const resA = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User A', email: `userA-${Date.now()}@test.com`, password: userPassword });
    userA = resA.body.user;
    tokenA = resA.body.token;

    const resB = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User B', email: `userB-${Date.now()}@test.com`, password: userPassword });
    userB = resB.body.user;
    tokenB = resB.body.token;
  });

  describe('1. Year in Pixels (GET /api/wellness/year-pixels)', () => {
    it('rejects invalid year with 400', async () => {
      const res1 = await request(app)
        .get('/api/wellness/year-pixels?year=1999')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get('/api/wellness/year-pixels?year=2101')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res2.status).toBe(400);

      const res3 = await request(app)
        .get('/api/wellness/year-pixels?year=invalid')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res3.status).toBe(400);
    });

    it('returns pixel data preferring CheckIn moodScore, falling back to mapped DiaryEntry mood', async () => {
      const year = 2026;
      // Day 1: Only CheckIn (moodScore = 9)
      await CheckIn.create({
        user: userA.id,
        date: new Date(Date.UTC(year, 2, 10)),
        moodScore: 9,
        emotions: ['Joyful']
      });

      // Day 2: Only DiaryEntry (mood = 'sad' -> score 2)
      await DiaryEntry.create({
        user: userA.id,
        title: 'Gloomy day',
        content: 'Felt down today',
        mood: 'sad',
        entryDate: new Date(Date.UTC(year, 2, 11))
      });

      // Day 3: Both CheckIn (moodScore = 4) and DiaryEntry (mood = 'happy' -> score 9) -> CheckIn wins (score 4)
      const bothEntry = await DiaryEntry.create({
        user: userA.id,
        title: 'Mixed feelings',
        content: 'Long reflection',
        mood: 'happy',
        entryDate: new Date(Date.UTC(year, 2, 12))
      });
      await CheckIn.create({
        user: userA.id,
        date: new Date(Date.UTC(year, 2, 12)),
        moodScore: 4,
        emotions: ['Tired']
      });

      const res = await request(app)
        .get(`/api/wellness/year-pixels?year=${year}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const pixels = res.body.data.pixels;

      // Day 1
      expect(pixels['2026-03-10']).toBeDefined();
      expect(pixels['2026-03-10'].score).toBe(9);
      expect(pixels['2026-03-10'].source).toBe('checkin');

      // Day 2
      expect(pixels['2026-03-11']).toBeDefined();
      expect(pixels['2026-03-11'].score).toBe(2);
      expect(pixels['2026-03-11'].source).toBe('diary');
      expect(pixels['2026-03-11'].title).toBe('Gloomy day');

      // Day 3
      expect(pixels['2026-03-12']).toBeDefined();
      expect(pixels['2026-03-12'].score).toBe(4);
      expect(pixels['2026-03-12'].source).toBe('checkin');
      expect(pixels['2026-03-12'].entryId).toBe(bothEntry._id.toString());

      // User B cannot see User A's pixels
      const resB = await request(app)
        .get(`/api/wellness/year-pixels?year=${year}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(resB.status).toBe(200);
      expect(Object.keys(resB.body.data.pixels)).toHaveLength(0);
    });
  });

  describe('2. Letters to Future Self (/api/letters)', () => {
    it('rejects deliverOn in the past or less than 1 day in the future with 400', async () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      const resPast = await request(app)
        .post('/api/letters')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Past Letter', content: 'Hello', deliverOn: pastDate });
      expect(resPast.status).toBe(400);

      const nearDate = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes away
      const resNear = await request(app)
        .post('/api/letters')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Near Letter', content: 'Hello', deliverOn: nearDate });
      expect(resNear.status).toBe(400);
    });

    it('enforces strict server-side projection: content absent before deliverOn, and 403 on individual fetch', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ahead
      const createRes = await request(app)
        .post('/api/letters')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Letter to Future Me',
          content: 'Secret hope that should not leak before time',
          deliverOn: futureDate
        });

      expect(createRes.status).toBe(201);
      const letterId = createRes.body.data.id;

      // In the listing, content MUST be completely omitted
      const listRes = await request(app)
        .get('/api/letters')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(listRes.status).toBe(200);
      const letterInList = listRes.body.data.find(l => l.id.toString() === letterId.toString());
      expect(letterInList).toBeDefined();
      expect(letterInList.isLocked).toBe(true);
      expect(letterInList.content).toBeUndefined();

      // Direct fetch of locked letter returns 403
      const getRes = await request(app)
        .get(`/api/letters/${letterId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(getRes.status).toBe(403);
      expect(getRes.body.message).toContain('locked');

      // User B cannot access User A letter (404/403)
      const userBRes = await request(app)
        .get(`/api/letters/${letterId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect([403, 404]).toContain(userBRes.status);
    });

    it('delivers letter when deliverOn is reached, stamps openedAt, and allows delete', async () => {
      // Create a letter that is already mature
      const matureLetter = await FutureLetter.create({
        user: userA.id,
        title: 'Already arrived letter',
        content: 'Welcome to the future!',
        writtenOn: new Date(Date.now() - 48 * 3600000),
        deliverOn: new Date(Date.now() - 24 * 3600000)
      });

      // Check due letters
      const dueRes = await request(app)
        .get('/api/letters/due')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(dueRes.status).toBe(200);
      expect(dueRes.body.data.some(l => l._id.toString() === matureLetter._id.toString())).toBe(true);

      // Open the letter
      const openRes = await request(app)
        .get(`/api/letters/${matureLetter._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(openRes.status).toBe(200);
      expect(openRes.body.data.content).toBe('Welcome to the future!');
      expect(openRes.body.data.openedAt).toBeDefined();

      // Owner can delete the letter
      const delRes = await request(app)
        .delete(`/api/letters/${matureLetter._id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(delRes.status).toBe(200);

      const checkGone = await FutureLetter.findById(matureLetter._id);
      expect(checkGone).toBeNull();
    });

    it('triggers safety warning on high risk while saving the letter', async () => {
      const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/letters')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'A dark note',
          content: 'I want to commit suicide and end everything',
          deliverOn: futureDate
        });

      expect(res.status).toBe(201);
      expect(res.body.safety?.level).toBe('high');
      expect(res.body.data.id).toBeDefined();
    });
  });

  describe('3. Coping Plan (/api/wellness/coping-plan)', () => {
    it('returns empty lists when no plan has been created yet', async () => {
      const res = await request(app)
        .get('/api/wellness/coping-plan')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.warningSigns).toEqual([]);
      expect(res.body.data.copingStrategies).toEqual([]);
    });

    it('saves and sanitizes coping plan, enforcing limits and encrypting fields', async () => {
      const planPayload = {
        warningSigns: ['<script>alert(1)</script>Can not sleep', 'Isolating myself'],
        copingStrategies: ['5-4-3-2-1 grounding', 'Go for a walk'],
        peopleToContact: [{ name: 'Mom', phone: '1234567890' }],
        safePlaces: ['My bedroom with lights dimmed'],
        reasonsToKeepGoing: ['My sister', 'Traveling next year']
      };

      const saveRes = await request(app)
        .put('/api/wellness/coping-plan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(planPayload);

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.success).toBe(true);
      expect(saveRes.body.data.warningSigns[0]).toBe('Can not sleep'); // script tag stripped

      // Direct DB inspection confirms encryption (enc:v1:)
      const mongoose = require('mongoose');
      const rawDoc = await CopingPlan.collection.findOne({ user: new mongoose.Types.ObjectId(userA.id) });
      expect(rawDoc).not.toBeNull();
      expect(rawDoc.warningSigns).toMatch(/^enc:(v1|v2)/);
      expect(rawDoc.copingStrategies).toMatch(/^enc:(v1|v2)/);
      expect(rawDoc.safePlaces).toMatch(/^enc:(v1|v2)/);
      expect(rawDoc.reasonsToKeepGoing).toMatch(/^enc:(v1|v2)/);

      // API returns readable plain text / objects
      const getResA = await request(app)
        .get('/api/wellness/coping-plan')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(getResA.status).toBe(200);
      expect(getResA.body.data.warningSigns).toEqual(['Can not sleep', 'Isolating myself']);
      expect(getResA.body.data.copingStrategies).toEqual(['5-4-3-2-1 grounding', 'Go for a walk']);
      expect(getResA.body.data.peopleToContact).toEqual([{ name: 'Mom', phone: '1234567890' }]);
      expect(getResA.body.data.safePlaces).toEqual(['My bedroom with lights dimmed']);
      expect(getResA.body.data.reasonsToKeepGoing).toEqual(['My sister', 'Traveling next year']);

      // User B cannot access User A coping plan
      const resB = await request(app)
        .get('/api/wellness/coping-plan')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(resB.status).toBe(200);
      expect(resB.body.data.warningSigns).toEqual([]);
    });
  });

  describe('4. Master Rules: Export and Account Deletion Integration', () => {
    it('includes FutureLetters and CopingPlan in export-data, and deletes them upon account deletion', async () => {
      // Create a letter and coping plan for User A
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      await request(app)
        .post('/api/letters')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Export My Letter',
          content: 'My secret letter for the future',
          deliverOn: futureDate
        });

      await request(app)
        .put('/api/wellness/coping-plan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          warningSigns: ['Heart racing'],
          copingStrategies: ['Box breathing'],
          peopleToContact: ['Doc Smith'],
          safePlaces: ['Balcony'],
          reasonsToKeepGoing: ['Hope for tomorrow']
        });

      // 1. Export Data check
      const exportRes = await request(app)
        .get('/api/auth/export-data')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(exportRes.status).toBe(200);
      expect(exportRes.body.futureLetters).toHaveLength(1);
      expect(exportRes.body.futureLetters[0].title).toBe('Export My Letter');
      expect(exportRes.body.futureLetters[0].content).toBe('My secret letter for the future');
      expect(exportRes.body.copingPlan).toBeDefined();
      expect(exportRes.body.copingPlan.warningSigns).toContain('Heart racing');

      // 2. Delete Account check
      const delRes = await request(app)
        .post('/api/auth/delete-account')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ password: userPassword });

      expect(delRes.status).toBe(200);

      // Verify cascading deletion
      const [remainingLetters, remainingPlan] = await Promise.all([
        FutureLetter.find({ user: userA.id }),
        CopingPlan.find({ user: userA.id })
      ]);

      expect(remainingLetters).toHaveLength(0);
      expect(remainingPlan).toHaveLength(0);
    });
  });
});
