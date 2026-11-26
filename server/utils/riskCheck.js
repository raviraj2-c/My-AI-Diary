const { PATTERN_FAMILIES, HIGH_RISK_PHRASES, CONCERN_PHRASES } = require('../data/riskKeywords');

const MAX_WINDOW_TOKENS = 6;

const FALSE_POSITIVE_PATTERNS = [
  // Media / educational discussions of overdose
  /(?:news|story|article|report|documentary|movie|book|class|lecture)\s+(?:about|on|of|covering)?\s*(?:an?\s*)?(?:[a-z]+\s+)?overdose/i,
  /(?:drug\s+)?overdose\s+(?:in|on|during)\s+(?:the\s+)?(?:news|story|article|media|documentary|report)/i,
  /(?:drug\s+)?overdose\s+(?:epidemic|statistics|awareness|prevention)/i,

  // Accidental or consumable "overdose" on benign things (coffee, sugar, etc.)
  /\boverdos(?:e|ed|ing)\s+(?:on|of|with)?\s*(?:coffee|caffeine|tea|sugar|work|information|studying|homework|netflix|screen\s*time|water)\b/i,

  // Accidental cuts / routine grooming / sports injuries
  /\bcut\s+myself\s+(?:shaving|cooking|chopping|peeling|while\s+cutting\s+vegetables|while\s+chopping|while\s+cooking|on\s+paper|with\s+paper|by\s+accident|accidentally)\b/i,
  /\bcut\s+my\s+hair\b/i,
  /\bhurt\s+myself\s+(?:playing|running|lifting|working\s+out|at\s+the\s+gym|by\s+accident|accidentally)\b/i,

  // Idiomatic performance / hyperbole / device battery
  /\b(?:killing|killed)\s+it(?:\s+(?:at|in|with|on))?\b/i,
  /\bkiller\s+(?:workout|run|routine|speed|shot|deal|feature|move|looks|outfit)\b/i,
  /\b(?:want\s+to|wanna|going\s+to|gonna)?\s*die\s+laughing\b/i,
  /\bdying\s+of\s+(?:laughter|laughing|thirst|boredom|curiosity|embarrassment)\b/i,
  /\bdying\s+to\s+(?:see|try|meet|know|watch|learn|hear|go|visit)\b/i,
  /\b(?:battery|phone|laptop|tablet)\s+(?:is\s+)?dying\b/i,
  /\b(?:battery|phone|laptop|tablet|device|car|engine)\s+(?:is\s+)?dead\b/i,
  /\bpain\s*killer\b/i,
  /\bdead\s+(?:tired|serious|spicy|drop|slow|center|ahead)\b/i,
  /\b(?:will|would|going\s+to|gonna)?\s*murder\s+me\b/i,

  // Giving up on dietary or habit items (NOT giving up on life)
  /\bgiving\s+up\s+(?:on\s+)?(?:sugar|coffee|caffeine|tea|carbs|smoking|alcohol|cigarettes|weed|social\s*media|gluten|dairy|junk\s*food|fast\s*food|soda|sweets)\b/i
];

/**
 * Strips common false-positive idioms (e.g. "killing it at the gym", "cut myself shaving")
 * so metaphorical or benign everyday usage does not trigger crisis screens,
 * while preserving genuine distress signals.
 */
function stripFalsePositives(text) {
  if (!text || typeof text !== 'string') return '';
  let filtered = text;
  for (const pattern of FALSE_POSITIVE_PATTERNS) {
    filtered = filtered.replace(pattern, ' ');
  }
  return filtered;
}

/**
 * Normalizes input text using Unicode awareness:
 * - Unicode NFKC normalization & lowercase
 * - Stripping HTML tags
 * - Removing apostrophes so contractions ("can't", "don't") match canonical forms
 * - Retaining letters, marks (\p{M} e.g. Devanagari vowel signs), numbers, and spaces
 * - Expanding common slang/contraction forms (wanna, gonna, dont, cant)
 * - Collapsing 3+ consecutive identical characters (e.g. "suuuicide" -> "suicide", "मरनााा" -> "मरना")
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .replace(/['\u2018\u2019\u02BC\u02BB\u201B\u0060\u00B4]/gu, '')
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .replace(/\bwanna\b/g, 'want to')
    .replace(/\bgonna\b/g, 'going to')
    .replace(/\bdont\b/g, 'do not')
    .replace(/\bcant\b/g, 'cannot')
    .replace(/([^\s])\1{2,}/gu, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function compilePhraseList(phrases) {
  const compiled = [];
  for (const phrase of phrases) {
    const norm = normalizeText(phrase);
    if (!norm) continue;
    const collapsed = norm.replace(/([^\s])\1+/gu, '$1');
    const escapedNorm = norm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])${escapedNorm}(?![\\p{L}\\p{M}\\p{N}])`, 'u');

    const collapsedRegex = collapsed !== norm
      ? new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])${collapsed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{M}\\p{N}])`, 'u')
      : null;

    const tokens = norm.split(' ').filter(Boolean);
    compiled.push({ raw: phrase, norm, tokens, regex, collapsedRegex });
  }
  return compiled;
}

const COMPILED_EXPLICIT_HIGH = compilePhraseList(HIGH_RISK_PHRASES);
const COMPILED_CONCERN = compilePhraseList(CONCERN_PHRASES);

const COMPILED_INTENT = {
  en: compilePhraseList(PATTERN_FAMILIES.intent.en),
  hinglish: compilePhraseList(PATTERN_FAMILIES.intent.hinglish),
  hi: compilePhraseList(PATTERN_FAMILIES.intent.hi)
};

const COMPILED_DEATH = {
  en: compilePhraseList(PATTERN_FAMILIES.deathTerms.en),
  hinglish: compilePhraseList(PATTERN_FAMILIES.deathTerms.hinglish),
  hi: compilePhraseList(PATTERN_FAMILIES.deathTerms.hi)
};

const FIRST_PERSON_SET = new Set(
  PATTERN_FAMILIES.firstPersonMarkers.map((m) => normalizeText(m)).filter(Boolean)
);

/**
 * Finds all [startTokenIdx, endTokenIdx] spans of compiled phrases in a token array.
 */
function findPhraseSpans(tokens, compiledList) {
  const spans = [];
  for (const item of compiledList) {
    const len = item.tokens.length;
    if (len === 0 || len > tokens.length) continue;
    for (let i = 0; i <= tokens.length - len; i++) {
      let match = true;
      for (let j = 0; j < len; j++) {
        if (tokens[i + j] !== item.tokens[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        spans.push({ start: i, end: i + len - 1, phrase: item.norm });
      }
    }
  }
  return spans;
}

/**
 * Checks whether any intent span and death-term span appear within maxWindowTokens of each other.
 */
function hasBoundedWindowMatch(tokens, intentList, deathList, maxWindowTokens = MAX_WINDOW_TOKENS) {
  const intentSpans = findPhraseSpans(tokens, intentList);
  if (intentSpans.length === 0) return false;
  const deathSpans = findPhraseSpans(tokens, deathList);
  if (deathSpans.length === 0) return false;

  for (const isp of intentSpans) {
    for (const dsp of deathSpans) {
      // Gap is number of tokens strictly between the two spans
      const gap = dsp.start > isp.end
        ? dsp.start - isp.end - 1
        : isp.start > dsp.end
          ? isp.start - dsp.end - 1
          : 0;
      if (gap <= maxWindowTokens) {
        return true;
      }
    }
  }
  return false;
}

function matchesAnyCompiled(compiledList, clean, collapsed) {
  for (const item of compiledList) {
    if (item.regex.test(clean) || (item.collapsedRegex && item.collapsedRegex.test(collapsed))) {
      return true;
    }
  }
  return false;
}

/**
 * Scans text for self-harm, suicide, or severe crisis signals.
 * NEVER stores or logs matched words.
 *
 * @param {string} text - Raw input string (diary content, note, title, etc.)
 * @returns {{ level: 'none' | 'concern' | 'high', matched: boolean }}
 */
function checkRisk(text) {
  if (!text || typeof text !== 'string') {
    return { level: 'none', matched: false };
  }

  // Pre-filter non-distress idioms before checking keywords
  const filtered = stripFalsePositives(text);
  const clean = normalizeText(filtered);
  if (!clean) {
    return { level: 'none', matched: false };
  }

  // Collapsed version for catching stretched letters (e.g. "suuuicide", "killlll")
  const collapsed = clean.replace(/([^\s])\1+/gu, '$1');
  const tokens = clean.split(' ').filter(Boolean);
  const collapsedTokens = collapsed.split(' ').filter(Boolean);

  // 1. Explicit HIGH phrases
  if (matchesAnyCompiled(COMPILED_EXPLICIT_HIGH, clean, collapsed)) {
    return { level: 'high', matched: true };
  }

  // 2. Pattern family bounded-window matches (intent + death/self-harm term within <= 6 tokens)
  for (const lang of ['en', 'hinglish', 'hi']) {
    if (
      hasBoundedWindowMatch(tokens, COMPILED_INTENT[lang], COMPILED_DEATH[lang], MAX_WINDOW_TOKENS) ||
      hasBoundedWindowMatch(collapsedTokens, COMPILED_INTENT[lang], COMPILED_DEATH[lang], MAX_WINDOW_TOKENS)
    ) {
      return { level: 'high', matched: true };
    }
  }

  // 3. Explicit CONCERN phrases
  if (matchesAnyCompiled(COMPILED_CONCERN, clean, collapsed)) {
    return { level: 'concern', matched: true };
  }

  // 4. Fail-safe CONCERN: any first-person marker + any death/self-harm term anywhere
  const hasFirstPerson = tokens.some((t) => FIRST_PERSON_SET.has(t));
  if (hasFirstPerson) {
    const allDeathTerms = [...COMPILED_DEATH.en, ...COMPILED_DEATH.hinglish, ...COMPILED_DEATH.hi];
    if (matchesAnyCompiled(allDeathTerms, clean, collapsed)) {
      return { level: 'concern', matched: true };
    }
  }

  return { level: 'none', matched: false };
}

module.exports = {
  checkRisk,
  normalizeText,
  stripFalsePositives,
  FALSE_POSITIVE_PATTERNS,
  MAX_WINDOW_TOKENS
};
