const request = require('supertest');
const app = require('../index');
const { User, DiaryEntry, Storybook } = require('../config/models');
const llmClient = require('../services/llmClient');

describe('AI Endpoints, Safeguards & Mocked LLM', () => {
  let user, token;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'AIUser', email: 'aiuser@test.com', password: 'Password123' });
    user = res.body.user;
    token = res.body.token;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('AI disabled: returns 403 AI_DISABLED when allowAIFeatures is false', async () => {
    // User by default has allowAIFeatures: false
    const res = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Hello AI companion' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('AI_DISABLED');
  });

  it('daily quota: returns 429 when user reaches daily quota of 30', async () => {
    // Enable AI and exhaust daily quota
    await User.findByIdAndUpdate(user.id, {
      allowAIFeatures: true,
      aiDailyUsage: { count: 30, lastReset: new Date() }
    });

    const res = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Can you help me reflect?' });

    expect(res.status).toBe(429);
    expect(res.body.message).toContain('daily limit');
  });

  it('"high" risk text: the LLM mock is NEVER called on crisis input', async () => {
    await User.findByIdAndUpdate(user.id, { allowAIFeatures: true });

    const callLLMSpy = jest.spyOn(llmClient, 'callLLM');

    const res = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'I feel completely trapped and I want to kill myself' });

    expect(res.status).toBe(200);
    expect(res.body.safety?.level || res.body.data?.assistantMessage?.safetyLevel).toBe('high');
    expect(res.body.data.assistantMessage.content).toContain('You matter');

    // Prove the external LLM is never called for high risk distress
    expect(callLLMSpy).not.toHaveBeenCalled();
  });

  describe('Storybook Generation & Date Range Quality Gates', () => {
    beforeEach(async () => {
      await User.findByIdAndUpdate(user.id, { allowAIFeatures: true });
    });

    it('rejects start date after end date with 400', async () => {
      const res = await request(app)
        .post('/api/ai/generate-storybook')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'adventure',
          startDate: '2026-03-20T00:00:00.000Z',
          endDate: '2026-03-10T23:59:59.999Z'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Start date must be before or equal to end date');
    });

    it('rejects date range exceeding 366 days with 400', async () => {
      const res = await request(app)
        .post('/api/ai/generate-storybook')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'adventure',
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2026-02-15T23:59:59.999Z' // > 366 days
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Date range cannot exceed 366 days');
    });

    it('returns 400 and count: 0 when zero entries exist in range', async () => {
      const res = await request(app)
        .post('/api/ai/generate-storybook')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'adventure',
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-01-05T23:59:59.999Z'
        });

      expect(res.status).toBe(400);
      expect(res.body.count).toBe(0);
      expect(res.body.message).toContain('No reflections found in the selected date range');
    });

    it('single-day range includes entry written at 9:00 PM on that day and returns chapters', async () => {
      // Entry at 9:00 PM local / UTC (21:00) on 2026-03-15
      const entryTime = new Date('2026-03-15T21:00:00.000Z');
      await DiaryEntry.create({
        user: user.id,
        title: 'Evening Solitude',
        content: '<p>Reflecting on a peaceful evening.</p>',
        mood: 'happy',
        entryDate: entryTime
      });

      const mockStorybook = {
        title: 'A Twilight Tale',
        protagonist: { name: 'Rowan' },
        chapters: [
          { chapterNumber: 1, title: 'The Sunset Glow', content: 'The sky faded to quiet twilight.' },
          { chapterNumber: 2, title: 'Quiet Whispers', content: 'Rowan rested as stars appeared.' }
        ]
      };

      const callLLMSpy = jest.spyOn(llmClient, 'callLLM').mockResolvedValue({
        text: JSON.stringify(mockStorybook),
        quotaRemaining: 29
      });

      const res = await request(app)
        .post('/api/ai/generate-storybook')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'dramatic',
          startDate: '2026-03-15T00:00:00.000Z',
          endDate: '2026-03-15T23:59:59.999Z',
          protagonistNickname: 'Rowan'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('A Twilight Tale');
      expect(res.body.data.chapters).toHaveLength(2);
      expect(res.body.data.chapters[0].title).toBe('The Sunset Glow');
      expect(callLLMSpy).toHaveBeenCalledTimes(1);

      // Verify saved in DB
      const saved = await Storybook.findOne({ user: user.id });
      expect(saved).not.toBeNull();
      expect(saved.chapters).toHaveLength(2);
    });

    it('invalid JSON retries once with strict reminder; if it fails twice gives 503, refunds quota, and saves nothing to DB', async () => {
      await DiaryEntry.create({
        user: user.id,
        title: 'Morning Walk',
        content: '<p>Walked around the lake.</p>',
        mood: 'peaceful',
        entryDate: new Date('2026-02-10T10:00:00.000Z')
      });

      const callLLMSpy = jest.spyOn(llmClient, 'callLLM').mockResolvedValue({
        text: 'Not JSON at all! Just raw plain text thoughts.',
        quotaRemaining: 29
      });

      const res = await request(app)
        .post('/api/ai/generate-storybook')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'adventure',
          startDate: '2026-02-01T00:00:00.000Z',
          endDate: '2026-02-28T23:59:59.999Z'
        });

      // Assert 503 response
      expect(res.status).toBe(503);
      expect(res.body.message).toContain("We couldn't make your story this time. Please try again.");

      // Assert it retried exactly once (total 2 calls)
      expect(callLLMSpy).toHaveBeenCalledTimes(2);
      expect(callLLMSpy.mock.calls[1][0].messages[0].content).toContain('CRITICAL: Return only valid JSON, nothing before or after.');
      expect(callLLMSpy.mock.calls[1][0].countUsage).toBe(false);

      // Assert nothing saved in DB
      const storybooksInDb = await Storybook.countDocuments({ user: user.id });
      expect(storybooksInDb).toBe(0);

      // Assert quota was refunded (did not count against 30/day limit)
      const freshUser = await User.findById(user.id);
      expect(freshUser.aiDailyUsage?.count || 0).toBe(0);
    });

    it('rejects invalid length, language, or tone with 400', async () => {
      const lenRes = await request(app)
        .post('/api/ai/generate-storybook')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'adventure',
          startDate: '2026-02-01T00:00:00.000Z',
          endDate: '2026-02-05T23:59:59.999Z',
          length: 'epic'
        });
      expect(lenRes.status).toBe(400);
      expect(lenRes.body.message).toContain('Invalid length');

      const langRes = await request(app)
        .post('/api/ai/generate-storybook')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'adventure',
          startDate: '2026-02-01T00:00:00.000Z',
          endDate: '2026-02-05T23:59:59.999Z',
          language: 'french'
        });
      expect(langRes.status).toBe(400);
      expect(langRes.body.message).toContain('Invalid language');

      const toneRes = await request(app)
        .post('/api/ai/generate-storybook')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'adventure',
          startDate: '2026-02-01T00:00:00.000Z',
          endDate: '2026-02-05T23:59:59.999Z',
          tone: 'cynical'
        });
      expect(toneRes.status).toBe(400);
      expect(toneRes.body.message).toContain('Invalid tone');
    });

    it('rejects protagonist nickname exceeding 30 characters with 400', async () => {
      const res = await request(app)
        .post('/api/ai/generate-storybook')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'adventure',
          startDate: '2026-02-01T00:00:00.000Z',
          endDate: '2026-02-05T23:59:59.999Z',
          protagonistNickname: 'ThisNicknameIsWayTooLongForTheSystemToAccept'
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot exceed 30 characters');
    });

    it('rejects entryIds belonging to another user with 400', async () => {
      // Create user B and an entry for user B
      const regB = await request(app)
        .post('/api/auth/register')
        .send({ name: 'UserB', email: 'userb@test.com', password: 'Password123' });

      const entryB = await DiaryEntry.create({
        user: regB.body.user.id,
        title: 'User B Secret',
        content: '<p>Secret thoughts</p>',
        mood: 'happy',
        entryDate: new Date('2026-02-03')
      });

      const res = await request(app)
        .post('/api/ai/generate-storybook')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'adventure',
          entryIds: [entryB._id.toString()]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('One or more selected entries were not found or belong to another user');
    });

    it('caps entries sent to AI at 40, always includes favorites, and returns entriesUsed', async () => {
      const favoriteTitles = ['Favorite Alpha', 'Favorite Beta', 'Favorite Gamma'];
      const entriesToCreate = [];
      for (let i = 0; i < 50; i++) {
        const isFav = i === 2 || i === 25 || i === 48;
        const favTitle = i === 2 ? favoriteTitles[0] : i === 25 ? favoriteTitles[1] : favoriteTitles[2];
        entriesToCreate.push({
          user: user.id,
          title: isFav ? favTitle : `Normal Day ${i + 1}`,
          content: `<p>Daily reflection content number ${i + 1} with calm thoughts.</p>`,
          mood: 'peaceful',
          isFavorite: isFav,
          entryDate: new Date(Date.UTC(2026, 0, 1) + i * 86400000)
        });
      }
      await DiaryEntry.insertMany(entriesToCreate);

      const spy = jest.spyOn(llmClient, 'callLLM');
      const res = await request(app)
        .post('/api/ai/generate-storybook')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'adventure',
          startDate: '2026-01-01',
          endDate: '2026-03-01'
        });

      expect(res.status).toBe(200);
      expect(res.body.entriesUsed).toBe(40);
      expect(res.body.data.entriesUsed).toBe(40);
      expect(spy).toHaveBeenCalled();

      const promptArg = spy.mock.calls[0][0].messages[0].content;
      for (const favTitle of favoriteTitles) {
        expect(promptArg).toContain(favTitle);
      }
      const entryBlocks = promptArg.match(/"index":\s*\d+/g) || [];
      expect(entryBlocks.length).toBe(40);
      spy.mockRestore();
    });

    it('GET /api/ai/storybooks returns metadata only without full generatedContent', async () => {
      await Storybook.create({
        user: user.id,
        title: 'Metadata Only Test',
        theme: 'adventure',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-05'),
        generatedContent: 'Full private text that should never appear in list metadata',
        chapters: [{ chapterNumber: 1, title: 'Chapter 1', content: 'Secret chapter content' }]
      });

      const res = await request(app)
        .get('/api/ai/storybooks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      const item = res.body.data[0];
      expect(item.title).toBe('Metadata Only Test');
      expect(item.chapterCount).toBe(1);
      // Ensure full text is omitted from list metadata
      expect(item.generatedContent).toBeUndefined();
      expect(item.chapters).toBeUndefined();
    });

    it('PUT /api/ai/storybooks/:id enforces ownership, sanitizes HTML, and stores content encrypted', async () => {
      const storybook = await Storybook.create({
        user: user.id,
        title: 'Original Title',
        theme: 'dramatic',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-05'),
        generatedContent: 'Original story text',
        chapters: [{ chapterNumber: 1, title: 'Old Chapter', content: 'Old content' }]
      });

      // User B cannot edit User A storybook
      const regB = await request(app)
        .post('/api/auth/register')
        .send({ name: 'UserB2', email: 'userb2@test.com', password: 'Password123' });

      const hackRes = await request(app)
        .put(`/api/ai/storybooks/${storybook._id}`)
        .set('Authorization', `Bearer ${regB.body.token}`)
        .send({ title: 'Hacked Title' });
      expect(hackRes.status).toBe(404);

      // User A edits storybook with HTML injection
      const editRes = await request(app)
        .put(`/api/ai/storybooks/${storybook._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Cleaned Title <script>alert(1)</script>',
          chapters: [
            {
              chapterNumber: 1,
              title: 'Chapter One <img src=x onerror=alert(1)>',
              content: '<p>Safe narrative paragraph.</p><script>evil()</script>'
            }
          ]
        });

      expect(editRes.status).toBe(200);
      expect(editRes.body.data.title).toBe('Cleaned Title');
      expect(editRes.body.data.chapters[0].title).toBe('Chapter One');
      expect(editRes.body.data.chapters[0].content).toContain('<p>Safe narrative paragraph.</p>');
      expect(editRes.body.data.chapters[0].content).not.toContain('<script>');
      expect(editRes.body.data.chapters[0].content).not.toContain('evil()');

      // Verify raw document in database is encrypted
      const mongoose = require('mongoose');
      const rawDoc = await mongoose.connection.db
        .collection('storybooks')
        .findOne({ _id: storybook._id });
      expect(rawDoc.generatedContent.startsWith('enc:v1:') || rawDoc.generatedContent.startsWith('enc:v2:')).toBe(true);
      expect(rawDoc.chapters[0].content.startsWith('enc:v1:') || rawDoc.chapters[0].content.startsWith('enc:v2:')).toBe(true);
      expect(rawDoc.generatedContent).not.toContain('Safe narrative paragraph');
    });
  });

  it('crisis marker: returns safety level "high" when AI output contains crisis guidance', async () => {
    await User.findByIdAndUpdate(user.id, { allowAIFeatures: true });

    // Mock LLM returning message with safety crisis guidance marker
    jest.spyOn(llmClient, 'callLLM').mockResolvedValue({
      text: 'I am here with you. Please call 988 or reach out to a trusted helpline right away. [CRISIS_SIGNAL_DETECTED]',
      quotaRemaining: 28
    });

    const res = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'I am having a very dark day' });

    expect(res.status).toBe(200);
    expect(res.body.safety?.level || res.body.data?.assistantMessage?.safetyLevel).toBe('high');
  });

  it('normalizeChatHistory drops leading assistant messages and merges consecutive duplicates', () => {
    const { normalizeChatHistory } = require('../controllers/chatController');
    const raw = [
      { role: 'assistant', content: 'Hello there' },
      { role: 'user', content: 'Part 1' },
      { role: 'user', content: 'Part 2' },
      { role: 'assistant', content: 'Understood' }
    ];
    const normalized = normalizeChatHistory(raw);
    expect(normalized[0].role).toBe('user');
    expect(normalized[0].content).toBe('Part 1\n\nPart 2');
    expect(normalized[1].role).toBe('assistant');
  });

  describe('Ask My Diary API & Retrieval', () => {
    beforeEach(async () => {
      await User.findByIdAndUpdate(user.id, { allowAIFeatures: true, allowDiaryAI: true });
    });

    it('AI-off gives 403', async () => {
      await User.findByIdAndUpdate(user.id, { allowAIFeatures: false });

      const res = await request(app)
        .post('/api/ai/ask-diary')
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'When did I feel most peaceful?' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('DIARY_AI_DISABLED');
    });

    it('HIGH risk skips the LLM and returns caring reply', async () => {
      const callLLMSpy = jest.spyOn(llmClient, 'callLLM');

      const res = await request(app)
        .post('/api/ai/ask-diary')
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'I feel completely trapped and I want to kill myself' });

      expect(res.status).toBe(200);
      expect(res.body.safety?.level).toBe('high');
      expect(res.body.data.answer).toContain('You matter');
      expect(res.body.data.usedEntries).toEqual([]);
      expect(callLLMSpy).not.toHaveBeenCalled();
    });

    it('daily limit gives 429 when quota is exhausted', async () => {
      await User.findByIdAndUpdate(user.id, {
        aiDailyUsage: { count: 30, lastReset: new Date() }
      });

      const res = await request(app)
        .post('/api/ai/ask-diary')
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'How was my sleep lately?' });

      expect(res.status).toBe(429);
      expect(res.body.message).toContain('daily limit');
    });

    it('never returns another user\'s entries in retrieval or usedEntries', async () => {
      // Create User B
      const resB = await request(app)
        .post('/api/auth/register')
        .send({ name: 'UserB', email: 'userb@test.com', password: 'Password123' });
      const userB = resB.body.user;
      const tokenB = resB.body.token;
      await User.findByIdAndUpdate(userB.id, { allowAIFeatures: true, allowDiaryAI: true });

      // User A (user) creates an entry
      const entryA = await DiaryEntry.create({
        user: user.id,
        title: 'Secret User A Entry',
        content: 'This is User A highly confidential secret information.',
        mood: 'peaceful',
        entryDate: new Date()
      });

      // User B creates their own entry
      const entryB = await DiaryEntry.create({
        user: userB.id,
        title: 'User B Reflection',
        content: 'Today User B went for a long run and felt refreshed.',
        mood: 'happy',
        entryDate: new Date()
      });

      let capturedPrompt = '';
      jest.spyOn(llmClient, 'callLLM').mockImplementation(async (params) => {
        capturedPrompt = params.messages[0].content;
        return {
          text: JSON.stringify({
            answer: 'User B went for a run.',
            usedEntryIds: [entryB._id.toString()]
          }),
          quotaRemaining: 29
        };
      });

      const res = await request(app)
        .post('/api/ai/ask-diary')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ question: 'What did User A write about secrets?' });

      expect(res.status).toBe(200);
      // User A's entry ID and secret content MUST NOT be in the retrieved prompt for User B
      expect(capturedPrompt).not.toContain(entryA._id.toString());
      expect(capturedPrompt).not.toContain('confidential secret');
      expect(res.body.data.usedEntries.some((e) => e.id === entryA._id.toString())).toBe(false);
    });

    it('usedEntryIds outside the sent set are rejected', async () => {
      const entry = await DiaryEntry.create({
        user: user.id,
        title: 'Peaceful Afternoon',
        content: 'I sat by the lake and read a book in peace.',
        mood: 'peaceful',
        entryDate: new Date()
      });

      // Mock LLM returning a hallucinated / foreign ID
      jest.spyOn(llmClient, 'callLLM').mockResolvedValue({
        text: JSON.stringify({
          answer: 'You sat by the lake peacefully.',
          usedEntryIds: [entry._id.toString(), 'foreign-hallucinated-id-999']
        }),
        quotaRemaining: 29
      });

      const res = await request(app)
        .post('/api/ai/ask-diary')
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'When was I peaceful by the lake?' });

      expect(res.status).toBe(200);
      expect(res.body.data.usedEntryIds).toContain(entry._id.toString());
      expect(res.body.data.usedEntryIds).not.toContain('foreign-hallucinated-id-999');
      expect(res.body.data.usedEntries).toHaveLength(1);
      expect(res.body.data.usedEntries[0].id).toBe(entry._id.toString());
      expect(res.body.data.usedEntries[0].snippet).toContain('sat by the lake');
    });

    it('invalid JSON handling: retries once, then returns 503 and refunds quota', async () => {
      await DiaryEntry.create({
        user: user.id,
        title: 'Entry 1',
        content: 'Some thoughts for today.',
        mood: 'neutral',
        entryDate: new Date()
      });

      const callLLMSpy = jest.spyOn(llmClient, 'callLLM').mockResolvedValue({
        text: 'Sorry, this is not JSON output.',
        quotaRemaining: 29
      });
      const refundSpy = jest.spyOn(llmClient, 'refundDailyUsage');

      const res = await request(app)
        .post('/api/ai/ask-diary')
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'What did I think today?' });

      expect(res.status).toBe(503);
      expect(callLLMSpy).toHaveBeenCalledTimes(2); // 1 original + 1 retry
      expect(refundSpy).toHaveBeenCalledWith(user.id, 1);
    });

    it('Hindi question retrieves a Hindi entry with Unicode token matching', async () => {
      const hindiEntry = await DiaryEntry.create({
        user: user.id,
        title: 'बगीचे में सैर',
        content: 'आज मुझे बहुत शांति महसूस हुई जब मैं बगीचे में बैठा।',
        mood: 'peaceful',
        entryDate: new Date()
      });

      let capturedPrompt = '';
      jest.spyOn(llmClient, 'callLLM').mockImplementation(async (params) => {
        capturedPrompt = params.messages[0].content;
        return {
          text: JSON.stringify({
            answer: 'आपको बगीचे में बैठने पर शांति महसूस हुई थी।',
            usedEntryIds: [hindiEntry._id.toString()]
          }),
          quotaRemaining: 29
        };
      });

      const res = await request(app)
        .post('/api/ai/ask-diary')
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'मुझे कब शांति महसूस हुई?' });

      expect(res.status).toBe(200);
      expect(capturedPrompt).toContain(hindiEntry._id.toString());
      expect(capturedPrompt).toContain('शांति');
      expect(res.body.data.usedEntries).toHaveLength(1);
      expect(res.body.data.usedEntries[0].id).toBe(hindiEntry._id.toString());
    });
  });

  describe('Gemini API Client Integration', () => {
    it('sends generateContent request with x-goog-api-key and maps 404 to 502', async () => {
      await User.findByIdAndUpdate(user.id, { allowAIFeatures: true });
      const origKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'test-gemini-key-123';
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Gentle Gemini reply' }] } }]
        })
      });

      try {
        const res = await llmClient.callLLM({
          userId: user.id,
          systemPrompt: 'Be kind.',
          messages: [{ role: 'user', content: 'Hello' }]
        });
        expect(res.text).toBe('Gentle Gemini reply');
        expect(res.mock).toBe(false);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const [url, init] = fetchSpy.mock.calls[0];
        expect(url).toContain('generativelanguage.googleapis.com/v1beta/models/');
        expect(url).toContain(':generateContent');
        expect(init.headers['x-goog-api-key']).toBe('test-gemini-key-123');

        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ error: { message: 'Model not found' } })
        });
        await expect(
          llmClient.callLLM({
            userId: user.id,
            systemPrompt: 'Be kind.',
            messages: [{ role: 'user', content: 'Hello' }]
          })
        ).rejects.toMatchObject({ statusCode: 502 });
      } finally {
        fetchSpy.mockRestore();
        if (origKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = origKey;
      }
    });
  });
});
