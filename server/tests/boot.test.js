const request = require('supertest');
const app = require('../index');

describe('Smoke Test & Boot Check', () => {
  it('GET /api/health responds with JSON and Cache-Control: no-store', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.message).toBeDefined();
  });

  it('GET unknown API route returns 404 JSON', async () => {
    const res = await request(app).get('/api/nonexistent-random-endpoint');
    expect(res.status).toBe(404);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('API endpoint not found');
  });

  it('GET /api/diary/entries without Authorization header returns 401', async () => {
    const res = await request(app).get('/api/diary/entries');
    expect(res.status).toBe(401);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('No token provided, authorization denied');
  });
});
