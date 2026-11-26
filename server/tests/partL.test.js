const request = require('supertest');
const app = require('../index');
const { User, DiaryEntry, Storybook } = require('../config/models');
const llmClient = require('../services/llmClient');
const { startOfDay, endOfDay } = require('../utils/dates');

describe('PART L: Date Range, AI Exclusion & Gentle Crisis Handling', () => {
  let user, token;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'PartLUser', email: 'partl@test.com', password: 'Password123' });
    user = res.body.user;
    token = res.body.token;

    await User.findByIdAndUpdate(user.id, { allowAIFeatures: true, allowDiaryAI: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('L1. Date Range Utilities & Boundaries', () => {
    it('startOfDay and endOfDay produce UTC midnight and end-of-day timestamps', () => {
      const start = startOfDay('2026-11-10');
      const end = endOfDay('2026-11-10');

      expect(start.toISOString()).toBe('2026-11-10T00:00:00.000Z');
      expect(end.toISOString()).toBe('2026-11-10T23:59:59.999Z');
    });

    it('1-day range (2026-11-10 to 2026-11-10) matches 18:00 entry and excludes 00:00 next day entry', async () => {
      // Entry at 18:00 UTC on 2026-11-10
      await DiaryEntry.create({
        user: user.id,
        title: 'Evening Reflection',
        content: 'I had tea in the garden at six in the evening.',
        mood: 'peaceful',
        entryDate: new Date('2026-11-10T18:00:00.000Z')
      });

      // Entry at 00:00 UTC on 2026-11-11
      await DiaryEntry.create({
        user: user.id,
        title: 'Midnight of Next Day',
        content: 'Midnight arrives on the next day.',
        mood: 'neutral',
        entryDate: new Date('2026-11-11T00:00:00.000Z')
      });

      let capturedPrompt = '';
      jest.spyOn(llmClient, 'callLLM').mockImplementation(async (params) => {
        capturedPrompt = params.messages[0].content;
        return {
          text: JSON.stringify({
            title: 'Evening Solitude',
            protagonist: { name: 'The Traveler' },
            chapters: [
              { chapterNumber: 1, title: 'Chapter 1', content: 'Tea was warm.' },
              { chapterNumber: 2, title: 'Chapter 2', content: 'Quiet dusk settled.' },
              { chapterNumber: 3, title: 'Chapter 3', content: 'The stars appeared.' },
              { chapterNumber: 4, title: 'Chapter 4', content: 'Night was calm.' }
            ]
          }),
          quotaRemaining: 29
        };
      });

      const res = await request(app)
        .post('/api/ai/generate-storybook')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'adventure',
          startDate: '2026-11-10',
          endDate: '2026-11-10'
        });

      expect(res.status).toBe(200);
      expect(capturedPrompt).toContain('Evening Reflection');
      expect(capturedPrompt).not.toContain('Midnight of Next Day');

      // Verify storybook record dates
      const createdStorybook = await Storybook.findById(res.body.data.id);
      expect(new Date(createdStorybook.startDate).toISOString()).toBe('2026-11-10T00:00:00.000Z');
      expect(new Date(createdStorybook.endDate).toISOString()).toBe('2026-11-10T23:59:59.999Z');
    });
  });

  describe('L2. Hide Entries from AI', () => {
    it('allows aiExcluded boolean flag on createEntry and updateEntry', async () => {
      const createRes = await request(app)
        .post('/api/diary/entries')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Private Secrets',
          content: 'This should never touch any AI model.',
          mood: 'peaceful',
          aiExcluded: true
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.aiExcluded).toBe(true);

      const updateRes = await request(app)
        .put(`/api/diary/entries/${createRes.body.data._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Private Secrets',
          content: 'This should never touch any AI model.',
          mood: 'peaceful',
          aiExcluded: false
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.aiExcluded).toBe(false);
    });

    it('storybook date-range queries exclude aiExcluded: true entries', async () => {
      await DiaryEntry.create({
        user: user.id,
        title: 'Hidden Entry',
        content: 'This is private and hidden from AI.',
        mood: 'neutral',
        aiExcluded: true,
        entryDate: new Date('2026-11-10T12:00:00.000Z')
      });

      await DiaryEntry.create({
        user: user.id,
        title: 'Visible Entry',
        content: 'This is visible to AI.',
        mood: 'peaceful',
        aiExcluded: false,
        entryDate: new Date('2026-11-10T14:00:00.000Z')
      });

      let capturedPrompt = '';
      jest.spyOn(llmClient, 'callLLM').mockImplementation(async (params) => {
        capturedPrompt = params.messages[0].content;
        return {
          text: JSON.stringify({
            title: 'Visible Story',
            chapters: [
              { chapterNumber: 1, title: 'Chapter 1', content: 'Light came in.' },
              { chapterNumber: 2, title: 'Chapter 2', content: 'Warmth followed.' },
              { chapterNumber: 3, title: 'Chapter 3', content: 'A peaceful end.' }
            ]
          }),
          quotaRemaining: 29
        };
      });

      const res = await request(app)
        .post('/api/ai/generate-storybook')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'adventure',
          length: 'short',
          startDate: '2026-11-10',
          endDate: '2026-11-10'
        });

      expect(res.status).toBe(200);
      expect(capturedPrompt).toContain('Visible Entry');
      expect(capturedPrompt).not.toContain('Hidden Entry');
    });

    it('storybook with entryIds returns 400 when an excluded entry is explicitly selected', async () => {
      const hiddenEntry = await DiaryEntry.create({
        user: user.id,
        title: 'Private Journal',
        content: 'Not for AI storybooks.',
        mood: 'neutral',
        aiExcluded: true,
        entryDate: new Date()
      });

      const res = await request(app)
        .post('/api/ai/generate-storybook')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'comedy',
          entryIds: [hiddenEntry._id.toString()]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('1 selected entry is hidden from AI features and cannot be used in a storybook');
    });

    it('ask-diary excludes aiExcluded: true entries from retrieval and LLM prompt', async () => {
      const hiddenEntry = await DiaryEntry.create({
        user: user.id,
        title: 'Secret Coffee',
        content: 'I drank secret expensive specialty coffee at the cafe.',
        mood: 'happy',
        aiExcluded: true,
        entryDate: new Date()
      });

      const normalEntry = await DiaryEntry.create({
        user: user.id,
        title: 'Normal Tea',
        content: 'I drank tea at the cafe.',
        mood: 'peaceful',
        aiExcluded: false,
        entryDate: new Date()
      });

      let capturedPrompt = '';
      jest.spyOn(llmClient, 'callLLM').mockImplementation(async (params) => {
        capturedPrompt = params.messages[0].content;
        return {
          text: JSON.stringify({
            answer: 'You drank tea at the cafe.',
            usedEntryIds: [normalEntry._id.toString()]
          }),
          quotaRemaining: 29
        };
      });

      const res = await request(app)
        .post('/api/ai/ask-diary')
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'What did I drink at the cafe?' });

      expect(res.status).toBe(200);
      expect(capturedPrompt).toContain(normalEntry._id.toString());
      expect(capturedPrompt).not.toContain(hiddenEntry._id.toString());
      expect(capturedPrompt).not.toContain('secret expensive specialty coffee');
    });

    it('reflectOnEntry and analyzeMood return 400 on an aiExcluded entry', async () => {
      const hiddenEntry = await DiaryEntry.create({
        user: user.id,
        title: 'Hidden Thoughts',
        content: 'Very personal words here.',
        mood: 'sad',
        aiExcluded: true,
        entryDate: new Date()
      });

      const reflectRes = await request(app)
        .post('/api/ai/reflect')
        .set('Authorization', `Bearer ${token}`)
        .send({ entryId: hiddenEntry._id.toString() });

      expect(reflectRes.status).toBe(400);
      expect(reflectRes.body.message).toBe('This entry is hidden from AI features.');

      const moodRes = await request(app)
        .post('/api/ai/analyze-mood')
        .set('Authorization', `Bearer ${token}`)
        .send({ entryId: hiddenEntry._id.toString() });

      expect(moodRes.status).toBe(400);
      expect(moodRes.body.message).toBe('This entry is hidden from AI features.');
    });
  });

  describe('L3. Gentle Handling of Crisis Text in Storybook', () => {
    it('storybook with 3 entries where 1 is high-risk builds from the 2 safe entries, high-risk text omitted from prompt', async () => {
      await DiaryEntry.create({
        user: user.id,
        title: 'Morning Walk',
        content: 'The morning breeze was refreshing and cool.',
        mood: 'peaceful',
        entryDate: new Date('2026-11-01T08:00:00.000Z')
      });

      await DiaryEntry.create({
        user: user.id,
        title: 'Heavy Night',
        content: 'I want to kill myself and end it all tonight.',
        mood: 'sad',
        entryDate: new Date('2026-11-01T20:00:00.000Z')
      });

      await DiaryEntry.create({
        user: user.id,
        title: 'Gentle Dawn',
        content: 'Dawn brought quiet sunlight and soft birdsong.',
        mood: 'peaceful',
        entryDate: new Date('2026-11-02T07:00:00.000Z')
      });

      let capturedPrompt = '';
      const callLLMSpy = jest.spyOn(llmClient, 'callLLM').mockImplementation(async (params) => {
        capturedPrompt = params.messages[0].content;
        return {
          text: JSON.stringify({
            title: 'Journey of Dawns',
            chapters: [
              { chapterNumber: 1, title: 'Breeze', content: 'A cool wind blew.' },
              { chapterNumber: 2, title: 'Sunrise', content: 'Light spread across the hills.' },
              { chapterNumber: 3, title: 'Peace', content: 'All became calm.' }
            ]
          }),
          quotaRemaining: 29
        };
      });

      const res = await request(app)
        .post('/api/ai/generate-storybook')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'adventure',
          length: 'short',
          startDate: '2026-11-01',
          endDate: '2026-11-02'
        });

      expect(res.status).toBe(200);
      expect(callLLMSpy).toHaveBeenCalledTimes(1);
      // High-risk text omitted from LLM prompt
      expect(capturedPrompt).not.toContain('I want to kill myself');
      expect(capturedPrompt).not.toContain('Heavy Night');
      // Safe entries included
      expect(capturedPrompt).toContain('Morning Walk');
      expect(capturedPrompt).toContain('Gentle Dawn');

      // Returns safety high and excludedCount
      expect(res.body.safety?.level).toBe('high');
      expect(res.body.excludedCount).toBe(1);
    });

    it('storybook built from 1 high-risk entry fails with 400 and does NOT call LLM', async () => {
      await DiaryEntry.create({
        user: user.id,
        title: 'Despair',
        content: 'I want to end my life and die.',
        mood: 'sad',
        entryDate: new Date('2026-11-01T20:00:00.000Z')
      });

      const callLLMSpy = jest.spyOn(llmClient, 'callLLM');

      const res = await request(app)
        .post('/api/ai/generate-storybook')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'dramatic',
          startDate: '2026-11-01',
          endDate: '2026-11-01'
        });

      expect(res.status).toBe(400);
      expect(callLLMSpy).not.toHaveBeenCalled();
      expect(res.body.safety?.level).toBe('high');
      expect(res.body.message).toContain('For your safety, storybook generation is paused');
    });
  });
});
