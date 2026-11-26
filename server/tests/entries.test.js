const request = require('supertest');
const app = require('../index');
const { DiaryEntry } = require('../config/models');

describe('Diary Entries API & Data Integrity', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Journaler', email: 'journaler@test.com', password: 'Password123' , ageConfirmed: true});
    token = res.body.token;
  });

  it('full CRUD lifecycle: create, read, update, delete with encrypted storage', async () => {
    // 1. Create
    const createRes = await request(app)
      .post('/api/diary/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Full CRUD Entry',
        content: '<p>A deep reflection on growth.</p>',
        mood: 'peaceful'
      });
    expect(createRes.status).toBe(201);
    const entryId = createRes.body.data.id || createRes.body.data._id;

    // 2. Read
    const readRes = await request(app)
      .get(`/api/diary/entries/${entryId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.data.title).toBe('Full CRUD Entry');
    expect(readRes.body.data.content).toContain('A deep reflection on growth.');

    // 3. Update
    const updateRes = await request(app)
      .put(`/api/diary/entries/${entryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated CRUD Entry',
        content: '<p>Updated reflection with deeper gratitude.</p>',
        mood: 'happy'
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Updated CRUD Entry');
    expect(updateRes.body.data.content).toContain('Updated reflection with deeper gratitude.');

    // 4. Delete
    const deleteRes = await request(app)
      .delete(`/api/diary/entries/${entryId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    // Verify 404 after deletion
    const verifyNotFound = await request(app)
      .get(`/api/diary/entries/${entryId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(verifyNotFound.status).toBe(404);
  });

  it('XSS is stripped from entry content', async () => {
    const dirty = '<p>Normal text</p><script>alert("xss")</script><img src="test.jpg" onerror="alert(1)" />';
    const res = await request(app)
      .post('/api/diary/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'XSS Test Entry',
        content: dirty,
        mood: 'happy'
      });
    expect(res.status).toBe(201);
    expect(res.body.data.content).not.toContain('<script>');
    expect(res.body.data.content).not.toContain('onerror');
    expect(res.body.data.content).toContain('<p>Normal text</p>');
    expect(res.body.data.content).toContain('src="test.jpg"');
  });

  it('tags are validated and cleaned', async () => {
    const res = await request(app)
      .post('/api/diary/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tagged Entry',
        content: '<p>Testing tags</p>',
        mood: 'peaceful',
        tags: ['mindfulness', '  nature  ', '#reflection']
      });
    expect(res.status).toBe(201);
    expect(res.body.data.tags).toContain('mindfulness');
    expect(res.body.data.tags).toContain('nature');
  });

  it('date is preserved on update when not explicitly provided', async () => {
    const originalDate = new Date('2025-05-15T10:00:00.000Z');
    const createRes = await request(app)
      .post('/api/diary/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Original Title',
        content: '<p>Original content</p>',
        mood: 'peaceful',
        entryDate: originalDate.toISOString()
      });
    expect(createRes.status).toBe(201);
    const entryId = createRes.body.data.id || createRes.body.data._id;

    // Update title and content without changing date
    const updateRes = await request(app)
      .put(`/api/diary/entries/${entryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated Title',
        content: '<p>Updated content</p>',
        mood: 'happy'
      });
    expect(updateRes.status).toBe(200);

    // Verify date is still the original date
    const updatedEntry = await DiaryEntry.findById(entryId);
    expect(new Date(updatedEntry.entryDate).toISOString()).toBe(originalDate.toISOString());
  });

  it('search works on encrypted content', async () => {
    await request(app)
      .post('/api/diary/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'A Walk in the Woods',
        content: '<p>Finding tranquility near the tranquilMountainBrook today.</p>',
        mood: 'peaceful'
      });

    await request(app)
      .post('/api/diary/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Busy Workday',
        content: '<p>Coding all afternoon and reviewing pull requests.</p>',
        mood: 'neutral'
      });

    // Search query
    const searchRes = await request(app)
      .get('/api/diary/entries?search=tranquilMountainBrook')
      .set('Authorization', `Bearer ${token}`);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].title).toBe('A Walk in the Woods');
  });

  it('pagination metadata returns expected count and limit', async () => {
    // Create 4 entries
    for (let i = 1; i <= 4; i++) {
      await request(app)
        .post('/api/diary/entries')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: `Entry ${i}`,
          content: `<p>Content for entry ${i}</p>`,
          mood: 'happy'
        });
    }

    const res = await request(app)
      .get('/api/diary/entries?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(4);
    expect(res.body.pagination.pages).toBe(2);
    expect(res.body.pagination.page).toBe(1);
  });

  it('media validation rejects media belonging to another user', async () => {
    const maliciousMedia = [
      {
        url: 'https://res.cloudinary.com/mydiary/image/upload/v1/mydiary/user_attacker999/hack.jpg',
        publicId: 'mydiary/user_attacker999/hack',
        type: 'image'
      }
    ];

    const res = await request(app)
      .post('/api/diary/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Entry with foreign media',
        content: '<p>Attempting unauthorized media attach</p>',
        mood: 'neutral',
        media: maliciousMedia
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Media');
  });
});
