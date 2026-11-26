const request = require('supertest');
const app = require('../index');
const {
  Storybook,
  ChatMessage
} = require('../config/models');

describe('Resource Ownership Enforcement (User B cannot access User A data)', () => {
  let userA, tokenA, userB, tokenB;

  beforeEach(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User A', email: 'userA@test.com', password: 'Password123' });
    userA = resA.body.user;
    tokenA = resA.body.token;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User B', email: 'userB@test.com', password: 'Password123' });
    userB = resB.body.user;
    tokenB = resB.body.token;
  });

  it('Diary Entries: User B cannot read, update, or delete User A entry', async () => {
    const createRes = await request(app)
      .post('/api/diary/entries')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Secret Diary of User A',
        content: '<p>This is private to User A</p>',
        mood: 'happy'
      });
    expect(createRes.status).toBe(201);
    const entryId = createRes.body.data.id || createRes.body.data._id;

    // User B attempts GET
    const getRes = await request(app)
      .get(`/api/diary/entries/${entryId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect([403, 404]).toContain(getRes.status);

    // User B attempts PUT
    const putRes = await request(app)
      .put(`/api/diary/entries/${entryId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hacked by User B', content: '<p>Malicious update</p>', mood: 'happy' });
    expect([403, 404]).toContain(putRes.status);

    // User B attempts DELETE
    const delRes = await request(app)
      .delete(`/api/diary/entries/${entryId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect([403, 404]).toContain(delRes.status);
  });

  it('Check-Ins: User B cannot view or delete User A check-in', async () => {
    const checkInRes = await request(app)
      .post('/api/wellness/checkins')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        moodScore: 8,
        emotions: ['Joyful'],
        sleepHours: 8,
        note: 'User A private note'
      });
    expect([200, 201]).toContain(checkInRes.status);
    const checkInId = checkInRes.body.data.id || checkInRes.body.data._id;

    // User B list should not include User A's checkin
    const listRes = await request(app)
      .get('/api/wellness/checkins')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(listRes.status).toBe(200);
    const ids = (listRes.body.data || []).map((c) => c._id || c.id);
    expect(ids).not.toContain(checkInId);

    // User B cannot delete User A checkin
    const delRes = await request(app)
      .delete(`/api/wellness/checkins/${checkInId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect([403, 404]).toContain(delRes.status);
  });

  it('Habits: User B cannot delete User A habit log', async () => {
    const habitRes = await request(app)
      .post('/api/wellness/habits')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        waterGlasses: 8,
        exerciseMinutes: 30,
        screenTimeHours: 4
      });
    expect([200, 201]).toContain(habitRes.status);
    const habitId = habitRes.body.data.id || habitRes.body.data._id;

    // User B cannot delete User A habit
    const delRes = await request(app)
      .delete(`/api/wellness/habits/${habitId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect([403, 404]).toContain(delRes.status);
  });

  it('Gratitude: User B cannot delete User A gratitude entry', async () => {
    const res = await request(app)
      .post('/api/wellness/gratitude')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ items: ['Morning sunlight', 'Warm tea'] });
    expect(res.status).toBe(201);
    const id = res.body.data.id || res.body.data._id;

    const delRes = await request(app)
      .delete(`/api/wellness/gratitude/${id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect([403, 404]).toContain(delRes.status);
  });

  it('Thought Records: User B cannot delete User A thought record', async () => {
    const res = await request(app)
      .post('/api/ai/thoughts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        situation: 'Public speaking',
        thought: 'I will mess up',
        balancedThought: 'I have prepared well'
      });
    expect(res.status).toBe(201);
    const id = res.body.data.id || res.body.data._id;

    const delRes = await request(app)
      .delete(`/api/ai/thoughts/${id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect([403, 404]).toContain(delRes.status);
  });

  it('Chat Messages: User B cannot read User A chat messages', async () => {
    await ChatMessage.create({
      user: userA.id,
      role: 'user',
      content: 'User A private confidential thought'
    });

    const getRes = await request(app)
      .get('/api/chat/messages')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(getRes.status).toBe(200);
    const messages = (getRes.body.data || []).map((m) => m.content);
    expect(messages).not.toContain('User A private confidential thought');
  });

  it('Storybooks: User B cannot view, edit or delete User A storybook', async () => {
    const storybook = await Storybook.create({
      user: userA.id,
      title: 'Journey of Courage',
      theme: 'adventure',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-07'),
      generatedContent: 'Once upon a time User A overcame the odds...'
    });

    const getRes = await request(app)
      .get(`/api/ai/storybooks/${storybook._id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect([403, 404]).toContain(getRes.status);

    const putRes = await request(app)
      .put(`/api/ai/storybooks/${storybook._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hacked Title' });
    expect([403, 404]).toContain(putRes.status);

    const delRes = await request(app)
      .delete(`/api/ai/storybooks/${storybook._id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect([403, 404]).toContain(delRes.status);
  });

  it('Exams & Small Wins: User B cannot delete User A exam or read User A small wins', async () => {
    // Exam
    const examRes = await request(app)
      .post('/api/student/exams')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ subject: 'Mathematics', date: '2026-12-15' });
    expect(examRes.status).toBe(201);
    const examId = examRes.body.data.id || examRes.body.data._id;

    const delExamRes = await request(app)
      .delete(`/api/student/exams/${examId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect([403, 404]).toContain(delExamRes.status);

    // Small Wins
    await request(app)
      .post('/api/student/small-wins')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        dateKey: '2026-11-19',
        tasks: [{ text: 'User A exclusive secret task', completed: true }]
      });

    const winsRes = await request(app)
      .get('/api/student/small-wins?date=2026-11-19')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(winsRes.status).toBe(200);
    const texts = (winsRes.body.data.tasks || []).map((t) => t.text);
    expect(texts).not.toContain('User A exclusive secret task');
  });

  it('Self-Checks: User B cannot view User A clinical self-checks', async () => {
    const postRes = await request(app)
      .post('/api/wellness/self-checks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'PHQ-9',
        score: 12,
        severity: 'Moderate',
        answers: [1, 2, 1, 1, 1, 2, 2, 1, 1]
      });
    expect(postRes.status).toBe(201);
    const selfCheckId = postRes.body.data._id || postRes.body.data.id;

    // User B listing self-checks
    const listRes = await request(app)
      .get('/api/wellness/self-checks?type=PHQ-9')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(listRes.status).toBe(200);
    const ids = (listRes.body.data || []).map((c) => String(c._id || c.id));
    expect(ids).not.toContain(String(selfCheckId));
  });

  it('Media Delete: User B cannot delete User A Cloudinary media asset', async () => {
    const userAPublicId = `mydiary/user_${userA.id}/sample_photo_123`;
    const res = await request(app)
      .delete(`/api/upload/${encodeURIComponent(userAPublicId)}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  it('Counselor Share Lifecycle: valid link contains no diary text, expires after 7 days, and revoked returns 404', async () => {
    // 1. User A creates counselor share
    const createShareRes = await request(app)
      .post('/api/wellness/counselor-share')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ range: 'month', includeName: true });
    expect(createShareRes.status).toBe(201);
    const rawToken = createShareRes.body.data.token;
    expect(rawToken).toBeDefined();

    // 2. Fetch shared report via public endpoint
    const viewRes = await request(app)
      .get(`/api/wellness/shared/${rawToken}`);
    expect(viewRes.status).toBe(200);
    const summary = viewRes.body.data;
    expect(summary).toBeDefined();

    // Verify: contains NO diary text, content, or reflection entries
    expect(summary.entries).toBeUndefined();
    expect(summary.content).toBeUndefined();
    expect(summary.diary).toBeUndefined();
    expect(summary.totalCheckIns).toBeDefined();

    // 3. Expired after 7 days returns 404
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const { CounselorReport } = require('../config/models');
    
    await CounselorReport.updateOne(
      { token: tokenHash },
      { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );

    const expiredRes = await request(app)
      .get(`/api/wellness/shared/${rawToken}`);
    expect(expiredRes.status).toBe(404);

    // 4. Revoked (active: false) returns 404
    await CounselorReport.updateOne(
      { token: tokenHash },
      { $set: { expiresAt: new Date(Date.now() + 86400000), active: false } }
    );

    const revokedRes = await request(app)
      .get(`/api/wellness/shared/${rawToken}`);
    expect(revokedRes.status).toBe(404);
  });

  it('Counselor Share: non-existent token returns 404', async () => {
    const res = await request(app)
      .get('/api/wellness/shared/non-existent-share-token-xyz');
    expect(res.status).toBe(404);
  });
});
