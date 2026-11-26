const request = require('supertest');
const app = require('../index');
const {
  User,
  DiaryEntry,
  CheckIn,
  HabitLog,
  GratitudeEntry,
  ThoughtRecord,
  Exam
} = require('../config/models');

describe('Account Export and Deletion Flow', () => {
  let token;
  let user;
  const userPassword = 'ExportPassword123!';

  beforeEach(async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Export Tester',
        email: `export-${Date.now()}@example.com`,
        password: userPassword
      , ageConfirmed: true});

    token = regRes.body.token;
    user = regRes.body.user;

    // Seed data across multiple collections
    await DiaryEntry.create({
      user: user.id,
      title: 'Secret Thoughts',
      content: '<p>Personal journal memory</p>',
      mood: 'happy',
      entryDate: new Date()
    });

    await CheckIn.create({
      user: user.id,
      date: '2026-11-19',
      moodScore: 4,
      stressLevel: 2,
      sleepHours: 7.5,
      note: 'Feeling peaceful today'
    });

    await HabitLog.create({
      user: user.id,
      date: '2026-11-19',
      habits: { meditation: true, exercise: false }
    });

    await GratitudeEntry.create({
      user: user.id,
      items: ['Warm cup of tea', 'Quiet morning']
    });

    await ThoughtRecord.create({
      user: user.id,
      situation: 'Preparing for tests',
      thought: 'What if I fail?',
      emotion: 'anxious',
      intensity: 75
    });

    await Exam.create({
      user: user.id,
      subject: 'Computer Science',
      date: new Date('2026-12-15')
    });
  });

  it('GET /api/auth/export-data returns full decrypted archive of all user data', async () => {
    const res = await request(app)
      .get('/api/auth/export-data')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.headers['content-disposition']).toContain('minddiary_complete_backup.json');

    // Archive contents verification
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.entries).toHaveLength(1);
    expect(res.body.entries[0].title).toBe('Secret Thoughts');
    expect(res.body.entries[0].content).toContain('Personal journal memory');
    expect(res.body.checkIns).toHaveLength(1);
    expect(res.body.checkIns[0].note).toBe('Feeling peaceful today');
    expect(res.body.gratitudes).toHaveLength(1);
    expect(res.body.gratitudes[0].items).toContain('Warm cup of tea');
    expect(res.body.thoughtRecords).toHaveLength(1);
    expect(res.body.thoughtRecords[0].thought).toBe('What if I fail?');
    expect(res.body.exams).toHaveLength(1);
    expect(res.body.exams[0].subject).toBe('Computer Science');
  });

  it('POST /api/auth/delete-account requires correct password and cascades removal across all collections', async () => {
    // 1. Wrong password rejected with 401
    const wrongRes = await request(app)
      .post('/api/auth/delete-account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'WrongPassword' });

    expect(wrongRes.status).toBe(401);
    expect(wrongRes.body.success).toBe(false);

    // 2. Correct password deletes account
    const okRes = await request(app)
      .post('/api/auth/delete-account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: userPassword });

    expect(okRes.status).toBe(200);
    expect(okRes.body.success).toBe(true);

    // 3. User document is gone
    const deletedUser = await User.findById(user.id);
    expect(deletedUser).toBeNull();

    // 4. Cascade check: all records across collections are gone
    const [entries, checkIns, habits, gratitudes, thoughts, exams] = await Promise.all([
      DiaryEntry.find({ user: user.id }),
      CheckIn.find({ user: user.id }),
      HabitLog.find({ user: user.id }),
      GratitudeEntry.find({ user: user.id }),
      ThoughtRecord.find({ user: user.id }),
      Exam.find({ user: user.id })
    ]);

    expect(entries).toHaveLength(0);
    expect(checkIns).toHaveLength(0);
    expect(habits).toHaveLength(0);
    expect(gratitudes).toHaveLength(0);
    expect(thoughts).toHaveLength(0);
    expect(exams).toHaveLength(0);
  });
});
