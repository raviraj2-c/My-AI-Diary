const { HIGH_RISK_PHRASES, CONCERN_PHRASES } = require('../data/riskKeywords');

const FALSE_POSITIVE_PATTERNS = [
  // Media / educational discussions of overdose
  /(?:news|story|article|report|documentary|movie|book|class|lecture)\s+(?:about|on|of|covering)?\s*(?:an?\s*)?(?:[a-z]+\s+)?overdose/i,
  /(?:drug\s+)?overdose\s+(?:in|on|during)\s+(?:the\s+)?(?:news|story|article|media|documentary|report)/i,
  /(?:drug\s+)?overdose\s+(?:epidemic|statistics|awareness|prevention)/i,

  // Accidental or consumable "overdose" on benign things (coffee, sugar, etc.)
  /\boverdos(?:e|ed|ing)\s+(?:on|of|with)?\s*(?:coffee|caffeine|tea|sugar|work|information|studying|homework|netflix|screen\s*time|water)\b/i,

  // Accidental cuts during routine activities (shaving, cooking, paper)
  /\bcut\s+myself\s+(?:shaving|cooking|chopping|peeling|while\s+cutting\s+vegetables|while\s+chopping|while\s+cooking|on\s+paper|with\s+paper|by\s+accident|accidentally)\b/i,

  // Idiomatic performance/metaphors
  /\bkilling\s+it(?:\s+(?:at|in|with|on))?\b/i,
  /\bkiller\s+(?:workout|run|routine|speed|shot|deal|feature|move|looks|outfit)\b/i,
  /\bdying\s+of\s+(?:laughter|laughing|thirst|boredom|curiosity|embarrassment)\b/i,
  /\bdying\s+to\s+(?:see|try|meet|know|watch|learn|hear|go|visit)\b/i,
  /\bpain\s*killer\b/i,
  /\bdead\s+(?:tired|serious|spicy|drop|slow|center|ahead)\b/i,

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
 * - Unicode NFKC normalization
 * - Converting to lowercase
 * - Stripping HTML tags
 * - Removing apostrophes so contractions ("can't", "don't") match canonical forms ("cant", "dont")
 * - Retaining letters, marks (\p{M} e.g. Devanagari vowel signs/matras), numbers, and spaces
 * - Collapsing 3+ consecutive identical characters (e.g. "suuuicide" -> "suicide", "मरनााा" -> "मरना")
 * - Collapsing whitespace
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .replace(/['\u2018\u2019\u02BC\u02BB\u201B\u0060\u00B4]/gu, '')
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .replace(/([^\s])\1{2,}/gu, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compiles a list of crisis phrases into regexes with Unicode word boundary lookarounds.
 * Lookarounds (?<![\p{L}\p{M}\p{N}]) and (?![\p{L}\p{M}\p{N}]) prevent partial matches
 * (e.g. "diet" matching "die", "self harmony" matching "self harm") across all scripts.
 */
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

    compiled.push({ norm, regex, collapsedRegex });
  }
  return compiled;
}

const COMPILED_HIGH_RISK = compilePhraseList(HIGH_RISK_PHRASES);
const COMPILED_CONCERN = compilePhraseList(CONCERN_PHRASES);

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

  // Check high-risk phrases first
  for (const item of COMPILED_HIGH_RISK) {
    if (item.regex.test(clean) || (item.collapsedRegex && item.collapsedRegex.test(collapsed))) {
      return { level: 'high', matched: true };
    }
  }

  // Check concern phrases
  for (const item of COMPILED_CONCERN) {
    if (item.regex.test(clean) || (item.collapsedRegex && item.collapsedRegex.test(collapsed))) {
      return { level: 'concern', matched: true };
    }
  }

  return { level: 'none', matched: false };
}

module.exports = {
  checkRisk,
  normalizeText,
  stripFalsePositives,
  FALSE_POSITIVE_PATTERNS
};
