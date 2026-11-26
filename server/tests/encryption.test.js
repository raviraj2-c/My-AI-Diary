const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const { runMigration } = require('../scripts/encryptExisting');

describe('Field-Level Encryption at Rest', () => {
  let user, token;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'EncryptUser', email: 'encrypt@test.com', password: 'Password123' });
    user = res.body.user;
    token = res.body.token;
  });

  it('DiaryEntry: raw database document contains "enc:v1:" and no plain text on create and update', async () => {
    const secretContent = 'This is a deeply confidential journal reflection about my life';

    // 1. Create
    const createRes = await request(app)
      .post('/api/diary/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Encryption Verification',
        content: `<p>${secretContent}</p>`,
        mood: 'peaceful'
      });
    expect(createRes.status).toBe(201);
    const entryId = new mongoose.Types.ObjectId(createRes.body.data.id || createRes.body.data._id);

    // Read directly from MongoDB bypassing Mongoose schema getters
    const rawCreated = await mongoose.connection.collection('diaryentries').findOne({ _id: entryId });
    expect(rawCreated.content).toBeDefined();
    expect(rawCreated.content).toMatch(/^enc:(v1|v2:[a-zA-Z0-9_-]+):[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
    expect(rawCreated.content).not.toContain(secretContent);

    // 2. Update
    const updatedSecret = 'Completely updated confidential text that replaces the previous entry';
    const updateRes = await request(app)
      .put(`/api/diary/entries/${entryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated Title',
        content: `<p>${updatedSecret}</p>`,
        mood: 'happy'
      });
    expect(updateRes.status).toBe(200);

    const rawUpdated = await mongoose.connection.collection('diaryentries').findOne({ _id: entryId });
    expect(rawUpdated.content).toMatch(/^enc:(v1|v2:[a-zA-Z0-9_-]+):[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
    expect(rawUpdated.content).not.toContain(updatedSecret);
    expect(rawUpdated.content).not.toBe(rawCreated.content);
  });

  it('CheckIn: raw database document note contains "enc:v1:" and no plain text', async () => {
    const secretNote = 'Secret mental health check-in personal note';
    const res = await request(app)
      .post('/api/wellness/checkins')
      .set('Authorization', `Bearer ${token}`)
      .send({
        moodScore: 8,
        note: secretNote
      });
    expect([200, 201]).toContain(res.status);
    const checkInId = new mongoose.Types.ObjectId(res.body.data.id || res.body.data._id);

    const raw = await mongoose.connection.collection('checkins').findOne({ _id: checkInId });
    expect(raw.note).toBeDefined();
    expect(raw.note).toMatch(/^enc:(v1|v2:[a-zA-Z0-9_-]+):[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
    expect(raw.note).not.toContain(secretNote);
  });

  it('Gratitude & Thoughts: raw items and thoughts are encrypted with "enc:v1:"', async () => {
    // Gratitude
    const secretGratitude = 'Grateful for deep privacy and security';
    const gratRes = await request(app)
      .post('/api/wellness/gratitude')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [secretGratitude] });
    expect(gratRes.status).toBe(201);
    const gratId = new mongoose.Types.ObjectId(gratRes.body.data.id || gratRes.body.data._id);

    const rawGrat = await mongoose.connection.collection('gratitudeentries').findOne({ _id: gratId });
    expect(rawGrat.items[0]).toMatch(/^enc:(v1|v2:[a-zA-Z0-9_-]+):[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
    expect(rawGrat.items[0]).not.toContain(secretGratitude);

    // Thought Record
    const secretThought = 'Intrusive irrational automatic worry';
    const thoughtRes = await request(app)
      .post('/api/ai/thoughts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        situation: 'Work review',
        thought: secretThought,
        balancedThought: 'I am performing well'
      });
    expect(thoughtRes.status).toBe(201);
    const thoughtId = new mongoose.Types.ObjectId(thoughtRes.body.data.id || thoughtRes.body.data._id);

    const rawThought = await mongoose.connection.collection('thoughtrecords').findOne({ _id: thoughtId });
    expect(rawThought.thought).toMatch(/^enc:(v1|v2:[a-zA-Z0-9_-]+):[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
    expect(rawThought.thought).not.toContain(secretThought);
  });

  it('SelfCheck: raw database answers contains "enc:v1:" JSON string, score/severity readable, and API returns decrypted array', async () => {
    const rawAnswers = [3, 2, 1, 0, 3, 2, 1, 0, 2];
    const postRes = await request(app)
      .post('/api/wellness/self-checks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PHQ-9',
        score: 14,
        severity: 'Moderate',
        answers: rawAnswers
      });
    expect(postRes.status).toBe(201);
    const checkId = new mongoose.Types.ObjectId(postRes.body.data._id || postRes.body.data.id);

    // 1. Check raw MongoDB document directly
    const rawDoc = await mongoose.connection.collection('selfchecks').findOne({ _id: checkId });
    expect(typeof rawDoc.answers).toBe('string');
    expect(rawDoc.answers).toMatch(/^enc:(v1|v2:[a-zA-Z0-9_-]+):[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
    expect(rawDoc.score).toBe(14);
    expect(rawDoc.severity).toBe('Moderate');

    // 2. Check API returns decrypted array via getters
    const getRes = await request(app)
      .get('/api/wellness/self-checks?type=PHQ-9')
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.length).toBeGreaterThan(0);
    const found = getRes.body.data.find(c => String(c._id) === String(checkId));
    expect(found).toBeDefined();
    expect(found.answers).toEqual(rawAnswers);
    expect(found.score).toBe(14);
    expect(found.severity).toBe('Moderate');
  });

  it('Exams & SmallWins: raw DB fields contain "enc:v1:" and API returns plain decrypted text', async () => {
    // Exam
    const secretNotes = 'Confidential syllabus focus notes';
    const examRes = await request(app)
      .post('/api/student/exams')
      .set('Authorization', `Bearer ${token}`)
      .send({
        subject: 'Data Privacy',
        date: new Date(Date.now() + 86400000).toISOString(),
        notes: secretNotes
      });
    expect(examRes.status).toBe(201);
    const examId = new mongoose.Types.ObjectId(examRes.body.data._id || examRes.body.data.id);

    const rawExam = await mongoose.connection.collection('exams').findOne({ _id: examId });
    expect(rawExam.notes).toMatch(/^enc:(v1|v2:[a-zA-Z0-9_-]+):[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
    expect(rawExam.notes).not.toContain(secretNotes);

    const getExams = await request(app)
      .get('/api/student/exams')
      .set('Authorization', `Bearer ${token}`);
    expect(getExams.status).toBe(200);
    const returnedExam = getExams.body.data.find(e => String(e._id) === String(examId));
    expect(returnedExam.notes).toBe(secretNotes);

    // SmallWin
    const secretTask = 'Submit thesis privacy audit section';
    const winRes = await request(app)
      .post('/api/student/small-wins')
      .set('Authorization', `Bearer ${token}`)
      .send({
        dateKey: '2026-11-20',
        tasks: [{ text: secretTask, completed: false }]
      });
    expect(winRes.status).toBe(200);

    const rawWin = await mongoose.connection.collection('smallwins').findOne({ dateKey: '2026-11-20' });
    expect(rawWin.tasks[0].text).toMatch(/^enc:(v1|v2:[a-zA-Z0-9_-]+):[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
    expect(rawWin.tasks[0].text).not.toContain(secretTask);

    const getWins = await request(app)
      .get('/api/student/small-wins?date=2026-11-20')
      .set('Authorization', `Bearer ${token}`);
    expect(getWins.status).toBe(200);
    expect(getWins.body.data.tasks[0].text).toBe(secretTask);
  });

  it('GET /api/auth/export-data returns complete decrypted data across all collections', async () => {
    // Add entry & check-in first
    await request(app)
      .post('/api/diary/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Export Title', content: 'Secret Export Content', mood: 'happy' });

    await request(app)
      .post('/api/wellness/checkins')
      .set('Authorization', `Bearer ${token}`)
      .send({ moodScore: 7, note: 'Secret Export CheckIn Note' });

    const exportRes = await request(app)
      .get('/api/auth/export-data')
      .set('Authorization', `Bearer ${token}`);

    expect(exportRes.status).toBe(200);
    const data = exportRes.body;
    expect(data.user).toBeDefined();
    expect(data.entries).toBeDefined();
    expect(data.entries.length).toBeGreaterThan(0);
    expect(data.entries[0].content).not.toMatch(/^enc:v1:/);
    expect(data.entries[0].content).toContain('Secret Export Content');

    expect(data.checkIns).toBeDefined();
    expect(data.checkIns.length).toBeGreaterThan(0);
    expect(data.checkIns[0].note).not.toMatch(/^enc:v1:/);
    expect(data.checkIns[0].note).toContain('Secret Export CheckIn Note');
  });

  it('Password change increments tokenVersion and invalidates previous tokens', async () => {
    const oldToken = token;

    // Change password
    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${oldToken}`)
      .send({
        currentPassword: 'Password123',
        newPassword: 'NewPassword999'
      });
    expect(changeRes.status).toBe(200);
    expect(changeRes.body.token).toBeDefined();
    const newToken = changeRes.body.token;

    // Attempting to use old token fails with 401
    const oldAttempt = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${oldToken}`);
    expect(oldAttempt.status).toBe(401);
    expect(oldAttempt.body.message).toMatch(/Session expired\. Please log in again\./i);

    // New token succeeds
    const newAttempt = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${newToken}`);
    expect(newAttempt.status).toBe(200);
  });

  it('Migration script encryptExisting: dry-run counts without modifying, live run encrypts, second run modifies 0 rows (idempotent)', async () => {
    // Insert a raw unencrypted document into MongoDB directly
    const testDocId = new mongoose.Types.ObjectId();
    const plainLegacyText = 'Plaintext legacy entry that existed before encryption was enabled';
    await mongoose.connection.collection('diaryentries').insertOne({
      _id: testDocId,
      user: new mongoose.Types.ObjectId(user._id || user.id),
      title: 'Legacy Entry',
      content: plainLegacyText,
      mood: 'peaceful',
      entryDate: new Date()
    });

    // 1. Dry run
    const dryRunResults = await runMigration({ dryRun: true, collection: 'diaryentries' });
    expect(dryRunResults.diaryentries).toBeGreaterThan(0);

    // Check DB document was NOT modified during dry-run
    const docAfterDry = await mongoose.connection.collection('diaryentries').findOne({ _id: testDocId });
    expect(docAfterDry.content).toBe(plainLegacyText);

    // 2. Live migration
    const liveResults = await runMigration({ dryRun: false, collection: 'diaryentries' });
    expect(liveResults.diaryentries).toBeGreaterThan(0);

    // Check DB document is now encrypted
    const docAfterLive = await mongoose.connection.collection('diaryentries').findOne({ _id: testDocId });
    expect(docAfterLive.content).toMatch(/^enc:(v1|v2:[a-zA-Z0-9_-]+):[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
    expect(docAfterLive.content).not.toContain(plainLegacyText);

    // 3. Second run must change 0 rows (idempotence)
    const secondRunResults = await runMigration({ dryRun: false, collection: 'diaryentries' });
    expect(secondRunResults.diaryentries).toBe(0);
  });

  it('Migration script encryptExisting: encrypts unencrypted copingplans and is idempotent', async () => {
    const rawPlanId = new mongoose.Types.ObjectId();
    const rawUserId = new mongoose.Types.ObjectId();

    await mongoose.connection.collection('copingplans').insertOne({
      _id: rawPlanId,
      user: rawUserId,
      warningSigns: ['Feeling disconnected', 'Sleep disrupted'],
      copingStrategies: ['Deep breathing', 'Walk outdoors'],
      peopleToContact: [{ name: 'Alex', phone: '555-0100' }],
      safePlaces: ['Cozy reading chair'],
      reasonsToKeepGoing: ['Family', 'Graduation']
    });

    // 1. Dry run
    const dryRun = await runMigration({ dryRun: true, collection: 'copingplans' });
    expect(dryRun.copingplans).toBe(1);

    const docDry = await mongoose.connection.collection('copingplans').findOne({ _id: rawPlanId });
    expect(Array.isArray(docDry.warningSigns)).toBe(true);

    // 2. Live migration
    const liveRun = await runMigration({ dryRun: false, collection: 'copingplans' });
    expect(liveRun.copingplans).toBe(1);

    const docLive = await mongoose.connection.collection('copingplans').findOne({ _id: rawPlanId });
    expect(docLive.warningSigns).toMatch(/^enc:(v1|v2:[a-zA-Z0-9_-]+):[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
    expect(docLive.copingStrategies).toMatch(/^enc:(v1|v2:[a-zA-Z0-9_-]+):[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
    expect(docLive.safePlaces).toMatch(/^enc:(v1|v2:[a-zA-Z0-9_-]+):[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
    expect(docLive.reasonsToKeepGoing).toMatch(/^enc:(v1|v2:[a-zA-Z0-9_-]+):[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);

    // 3. Second run changes 0 rows
    const secondRun = await runMigration({ dryRun: false, collection: 'copingplans' });
    expect(secondRun.copingplans).toBe(0);
  });
});
