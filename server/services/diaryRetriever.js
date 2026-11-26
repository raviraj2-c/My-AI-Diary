/**
 * Retrieval module for MindDiary "Ask My Diary" feature.
 * Performs in-memory semantic retrieval without external vector databases:
 * - Unicode-aware tokenization & English stemming
 * - English and common Hinglish stopwords filtering
 * - Natural language date phrase detection (today, yesterday, this week, last week, this month, last month)
 * - Natural language mood detection mapped to DiaryEntry mood enums
 * - Scoring with title weighting (1.5x), mood bonus, favorite boost, and recency
 * - Sentence-level 500-character excerpt extraction
 * - Safety scan dropping any high-risk distress excerpts (never logged)
 */

const { DiaryEntry } = require('../config/models');
const { decryptText } = require('../utils/encrypt');
const { startOfDay, endOfDay } = require('../utils/dates');
const { checkRisk } = require('../utils/riskCheck');

const STOPWORDS = new Set([
  // English
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
  'by', 'can', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me',
  'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',

  // Hinglish & common Hindi transliterations
  'mein', 'me', 'se', 'ko', 'ka', 'ki', 'ke', 'hai', 'hain', 'tha', 'thi', 'the', 'aur', 'ya',
  'par', 'pe', 'ek', 'yeh', 'ye', 'woh', 'wo', 'toh', 'to', 'bhi', 'hi', 'kya', 'kaise', 'kab',
  'kahan', 'kyu', 'kyun', 'mera', 'meri', 'mere', 'hum', 'humara', 'humari', 'apna', 'apni',
  'apne', 'bohot', 'bahut', 'kuch', 'koi', 'thaa', 'raha', 'rahi', 'rahe',

  // Devanagari stopwords
  'का', 'के', 'की', 'को', 'में', 'से', 'पर', 'है', 'हैं', 'था', 'थी', 'थे',
  'और', 'या', 'एक', 'यह', 'ये', 'वह', 'वे', 'तो', 'भी', 'ही', 'क्या',
  'कैसे', 'कब', 'कहाँ', 'क्यों', 'मेरा', 'मेरी', 'मेरे', 'हम', 'हमारा',
  'हमारी', 'अपना', 'अपनी', 'अपने', 'बहुत', 'कुछ', 'कोई', 'रहा', 'रही', 'रहे'
]);

/**
 * Light English stemmer for common inflections (e.g. stress/stressed/stressful -> stress, sleep/sleeping -> sleep).
 */
function stemWord(word) {
  if (!word || typeof word !== 'string' || word.length <= 3) return word || '';
  let w = word.toLowerCase();
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ful') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('ly') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
  return w;
}

/**
 * Tokenizes text into lowercase stemmed tokens, filtering out punctuation and stopwords.
 * Uses Unicode-aware regex to support Hindi/Devanagari alongside Latin text.
 */
function tokenizeText(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(/[\p{L}\p{M}\p{N}]+/gu);
  if (!matches) return [];
  const tokens = [];
  for (const m of matches) {
    const lower = m.toLowerCase();
    if (!STOPWORDS.has(lower) && lower.length > 1) {
      tokens.push(stemWord(lower));
    }
  }
  return tokens;
}

/**
 * Detects natural date phrases in user queries:
 * - "today"
 * - "yesterday"
 * - "this week"
 * - "last week"
 * - "this month"
 * - "last month"
 *
 * @param {string} text
 * @param {Date} [referenceDate=new Date()]
 * @returns {{ startDate: Date, endDate: Date } | null}
 */
function detectDateRange(text, referenceDate = new Date()) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();
  const ref = new Date(referenceDate);

  // 1. "last week"
  if (/\blast\s+week\b/.test(lower)) {
    const day = ref.getUTCDay(); // 0 is Sun, 1 is Mon...
    const diffToThisMonday = day === 0 ? -6 : 1 - day;
    const thisMonday = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() + diffToThisMonday));
    const lastMonday = new Date(thisMonday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastSunday = new Date(thisMonday.getTime() - 1);
    return {
      startDate: startOfDay(lastMonday),
      endDate: endOfDay(lastSunday)
    };
  }

  // 2. "this week"
  if (/\bthis\s+week\b/.test(lower)) {
    const day = ref.getUTCDay();
    const diffToThisMonday = day === 0 ? -6 : 1 - day;
    const thisMonday = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() + diffToThisMonday));
    return {
      startDate: startOfDay(thisMonday),
      endDate: endOfDay(ref)
    };
  }

  // 3. "yesterday"
  if (/\byesterday\b/.test(lower)) {
    const y = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() - 1));
    return {
      startDate: startOfDay(y),
      endDate: endOfDay(y)
    };
  }

  // 4. "today"
  if (/\btoday\b/.test(lower)) {
    return {
      startDate: startOfDay(ref),
      endDate: endOfDay(ref)
    };
  }

  // 5. "last month"
  if (/\blast\s+month\b/.test(lower)) {
    const year = ref.getUTCMonth() === 0 ? ref.getUTCFullYear() - 1 : ref.getUTCFullYear();
    const month = ref.getUTCMonth() === 0 ? 11 : ref.getUTCMonth() - 1;
    const firstDay = new Date(Date.UTC(year, month, 1));
    const nextMonthFirst = new Date(Date.UTC(year, month + 1, 1));
    const lastDay = new Date(nextMonthFirst.getTime() - 1);
    return {
      startDate: startOfDay(firstDay),
      endDate: endOfDay(lastDay)
    };
  }

  // 6. "this month"
  if (/\bthis\s+month\b/.test(lower)) {
    const year = ref.getUTCFullYear();
    const month = ref.getUTCMonth();
    const firstDay = new Date(Date.UTC(year, month, 1));
    return {
      startDate: startOfDay(firstDay),
      endDate: endOfDay(ref)
    };
  }

  return null;
}

const MOOD_MAPPING = {
  // English
  happy: 'happy',
  proud: 'happy',
  excited: 'excited',
  sad: 'sad',
  lonely: 'sad',
  tired: 'sad',
  anxious: 'anxious',
  stressed: 'anxious',
  angry: 'angry',
  calm: 'peaceful',
  peaceful: 'peaceful',
  neutral: 'neutral',

  // Hindi & Hinglish
  khush: 'happy',
  prasann: 'happy',
  anand: 'happy',
  'खुश': 'happy',
  'प्रसन्न': 'happy',
  'आनंद': 'happy',

  udas: 'sad',
  dukhi: 'sad',
  gham: 'sad',
  'उदास': 'sad',
  'दुखी': 'sad',
  'गम': 'sad',

  shant: 'peaceful',
  sukoon: 'peaceful',
  chain: 'peaceful',
  'शांत': 'peaceful',
  'सुकून': 'peaceful',
  'चैन': 'peaceful',

  gussa: 'angry',
  krodh: 'angry',
  naraz: 'angry',
  'गुस्सा': 'angry',
  'क्रोध': 'angry',
  'नाराज़': 'angry',
  'नाराज': 'angry',

  chinta: 'anxious',
  pareshan: 'anxious',
  ghabrahat: 'anxious',
  tanav: 'anxious',
  'चिंता': 'anxious',
  'परेशान': 'anxious',
  'घबराहट': 'anxious',
  'तनाव': 'anxious',

  utsahit: 'excited',
  josh: 'excited',
  'उत्साहित': 'excited',
  'जोश': 'excited'
};

const COMPILED_MOODS = Object.entries(MOOD_MAPPING).map(([word, mood]) => {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    mood,
    regex: new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])${escaped}(?![\\p{L}\\p{M}\\p{N}])`, 'iu')
  };
});

/**
 * Detects mood keywords in user queries and maps to DiaryEntry mood enum values.
 * Uses Unicode-aware lookarounds so Hindi/Devanagari words match reliably.
 *
 * @param {string} text
 * @returns {'happy' | 'sad' | 'neutral' | 'excited' | 'anxious' | 'angry' | 'peaceful' | null}
 */
function detectMood(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();
  for (const { mood, regex } of COMPILED_MOODS) {
    if (regex.test(lower)) {
      return mood;
    }
  }
  return null;
}

/**
 * Extracts a window of at most 500 characters around the sentence with the highest query token overlap.
 *
 * @param {string} plainContent
 * @param {string[]} queryTokens
 * @param {number} [maxLen=500]
 * @returns {string}
 */
function extractBestSentenceExcerpt(plainContent, queryTokens, maxLen = 500) {
  if (!plainContent || plainContent.length <= maxLen) {
    return (plainContent || '').trim();
  }

  const qTokenSet = new Set(queryTokens);
  // Split into sentences preserving punctuation
  const sentenceRegex = /[^.!?।\n]+[.!?।\n]*/g;
  let match;
  let bestSentence = null;
  let bestScore = -1;
  let bestStart = 0;
  let bestEnd = 0;

  while ((match = sentenceRegex.exec(plainContent)) !== null) {
    const sentence = match[0].trim();
    if (!sentence) continue;
    const tokens = tokenizeText(sentence);
    let overlap = 0;
    for (const t of tokens) {
      if (qTokenSet.has(t)) overlap += 1;
    }
    if (overlap > bestScore) {
      bestScore = overlap;
      bestSentence = sentence;
      bestStart = match.index;
      bestEnd = match.index + match[0].length;
    }
  }

  // If no match with words or no sentences found, take beginning
  if (!bestSentence || bestScore <= 0) {
    let slice = plainContent.slice(0, maxLen).trim();
    if (plainContent.length > maxLen) {
      slice = slice.replace(/\s+\S*$/, '') + '...';
    }
    return slice.slice(0, maxLen);
  }

  const sentenceLen = bestEnd - bestStart;
  if (sentenceLen >= maxLen) {
    return (bestSentence.slice(0, maxLen - 3) + '...').slice(0, maxLen);
  }

  const remaining = maxLen - sentenceLen;
  const leadSlack = Math.floor(remaining / 2);

  let start = Math.max(0, bestStart - leadSlack);
  let end = Math.min(plainContent.length, start + maxLen);

  if (end - start < maxLen) {
    start = Math.max(0, end - maxLen);
  }

  let excerpt = plainContent.slice(start, end).trim();
  if (start > 0) excerpt = '...' + excerpt;
  if (end < plainContent.length) excerpt = excerpt + '...';

  // Ensure strict <= maxLen characters
  if (excerpt.length > maxLen) {
    excerpt = excerpt.slice(0, maxLen - 3) + '...';
  }

  return excerpt;
}

/**
 * Main retrieval orchestrator for Ask My Diary.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.question
 * @param {object} [params.filters]
 * @param {Date} [params.refDate=new Date()]
 * @returns {Promise<{
 *   excerpts: Array<{ id: string, title: string, entryDate: Date, mood: string, excerpt: string, snippet: string, score: number }>,
 *   droppedCrisisCount: number,
 *   noMatch: boolean,
 *   detectedDateRange: object | null,
 *   detectedMood: string | null
 * }>}
 */
async function retrieveDiaryExcerpts({ userId, question, filters = {}, refDate = new Date() }) {
  const detectedDateRange = detectDateRange(question, refDate);
  const detectedMood = detectMood(question);

  // Explicit request filters override detected ones
  const effectiveStart = filters.startDate ? startOfDay(filters.startDate) : (detectedDateRange?.startDate || null);
  const effectiveEnd = filters.endDate ? endOfDay(filters.endDate) : (detectedDateRange?.endDate || null);
  const targetMood = (filters.mood && typeof filters.mood === 'string' && filters.mood.trim())
    ? filters.mood.trim()
    : detectedMood;

  // 1. Build database query (excluding aiExcluded: true)
  const query = {
    user: userId,
    aiExcluded: { $ne: true }
  };

  if (effectiveStart || effectiveEnd) {
    query.entryDate = {};
    if (effectiveStart) query.entryDate.$gte = effectiveStart;
    if (effectiveEnd) query.entryDate.$lte = effectiveEnd;
  }

  // If explicit mood filter passed, apply to query
  if (filters.mood && typeof filters.mood === 'string' && filters.mood.trim()) {
    query.mood = filters.mood.trim();
  }

  const rawEntries = await DiaryEntry.find(query)
    .sort({ entryDate: -1, createdAt: -1 })
    .limit(500);

  // In-memory safety exclusion check
  const eligibleEntries = rawEntries.filter(e => !e.aiExcluded);

  if (eligibleEntries.length === 0) {
    return {
      excerpts: [],
      droppedCrisisCount: 0,
      noMatch: true,
      detectedDateRange,
      detectedMood
    };
  }

  // 2. Tokenize question
  const qTokens = tokenizeText(question);
  const qTokenSet = new Set(qTokens);

  // 3. Score entries
  const scoredEntries = eligibleEntries.map((e, idx) => {
    const decrypted = decryptText(e.content || '');
    const plainTitle = (e.title || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const plainContent = decrypted.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    const entryTokens = tokenizeText(plainContent);
    const titleTokens = tokenizeText(plainTitle);

    let contentOverlap = 0;
    for (const t of entryTokens) {
      if (qTokenSet.has(t)) contentOverlap += 1;
    }

    let titleOverlap = 0;
    for (const t of titleTokens) {
      if (qTokenSet.has(t)) titleOverlap += 1;
    }

    const overlap = contentOverlap + (titleOverlap * 1.5);

    // Boosts
    const moodBonus = (targetMood && e.mood === targetMood) ? 2.0 : 0;
    const favoriteBonus = e.isFavorite ? 1.0 : 0;
    const recencyBonus = (eligibleEntries.length - idx) / (eligibleEntries.length * 10);

    const totalScore = overlap + moodBonus + favoriteBonus + recencyBonus;

    return {
      id: e._id.toString(),
      title: plainTitle || 'Untitled Entry',
      entryDate: e.entryDate || e.createdAt,
      mood: e.mood || 'neutral',
      plainContent,
      score: totalScore,
      overlap,
      moodMatched: Boolean(targetMood && e.mood === targetMood)
    };
  });

  // Filter out completely irrelevant entries: must have word overlap > 0 OR mood match
  const matchingCandidates = scoredEntries.filter(e => e.overlap > 0 || e.moodMatched);

  if (matchingCandidates.length === 0) {
    return {
      excerpts: [],
      droppedCrisisCount: 0,
      noMatch: true,
      detectedDateRange,
      detectedMood
    };
  }

  // Rank by score descending
  matchingCandidates.sort((a, b) => b.score - a.score);

  // Take top 6 candidates maximum
  const topCandidates = matchingCandidates.slice(0, 6);

  // 4. Extract max 500-char excerpt & perform safety check on each excerpt
  let droppedCrisisCount = 0;
  const safeExcerpts = [];

  for (const item of topCandidates) {
    const excerpt = extractBestSentenceExcerpt(item.plainContent, qTokens, 500);

    // Safety scan on the excerpt
    const risk = checkRisk(excerpt);
    if (risk.level === 'high') {
      // NEVER log excerpt text! Only count dropped crisis entry
      droppedCrisisCount += 1;
      continue;
    }

    const snippet = item.plainContent.slice(0, 150).trim() + (item.plainContent.length > 150 ? '...' : '');

    safeExcerpts.push({
      id: item.id,
      title: item.title,
      entryDate: item.entryDate,
      mood: item.mood,
      excerpt,
      snippet,
      score: item.score
    });
  }

  return {
    excerpts: safeExcerpts,
    droppedCrisisCount,
    noMatch: safeExcerpts.length === 0 && droppedCrisisCount === 0,
    detectedDateRange,
    detectedMood
  };
}

module.exports = {
  STOPWORDS,
  stemWord,
  tokenizeText,
  detectDateRange,
  detectMood,
  extractBestSentenceExcerpt,
  retrieveDiaryExcerpts
};
