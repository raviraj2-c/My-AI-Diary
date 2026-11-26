/**
 * Prints every crisis/concern pattern family and example matches for counselor review.
 * Usage: node server/scripts/riskReport.js
 *
 * NOTE: needs counselor review; not a clinical tool.
 */
const { PATTERN_FAMILIES, CONCERN_PHRASES } = require('../data/riskKeywords');
const { FALSE_POSITIVE_PATTERNS, MAX_WINDOW_TOKENS } = require('../utils/riskCheck');

console.log('====================================================================');
console.log('MindDiary Risk Pattern Families Report (NEEDS COUNSELOR REVIEW)');
console.log('Not a clinical tool. Lexicon & pattern families for human review.');
console.log(`Bounded Intent-to-Death Window: <= ${MAX_WINDOW_TOKENS} tokens`);
console.log('====================================================================\n');

for (const lang of ['en', 'hinglish', 'hi']) {
  console.log(`--- EXPLICIT HIGH (${lang.toUpperCase()}: ${PATTERN_FAMILIES.explicitHigh[lang].length}) ---`);
  console.log('  Examples:', PATTERN_FAMILIES.explicitHigh[lang].slice(0, 5).join(' | '));
  console.log('  All:', PATTERN_FAMILIES.explicitHigh[lang].join(', '));
  console.log('');
}

for (const lang of ['en', 'hinglish', 'hi']) {
  console.log(`--- INTENT FAMILY (${lang.toUpperCase()}: ${PATTERN_FAMILIES.intent[lang].length}) ---`);
  console.log('  Terms:', PATTERN_FAMILIES.intent[lang].join(', '));
  console.log(`--- DEATH / SELF-HARM FAMILY (${lang.toUpperCase()}: ${PATTERN_FAMILIES.deathTerms[lang].length}) ---`);
  console.log('  Terms:', PATTERN_FAMILIES.deathTerms[lang].join(', '));
  console.log('');
}

console.log(`--- FIRST-PERSON MARKERS (Fail-Safe CONCERN, ${PATTERN_FAMILIES.firstPersonMarkers.length}) ---`);
console.log('  ', PATTERN_FAMILIES.firstPersonMarkers.join(', '));

console.log(`\n--- EXPLICIT CONCERN PHRASES (${CONCERN_PHRASES.length}) ---`);
console.log('  ', CONCERN_PHRASES.join(', '));

console.log(`\n--- IDIOM / FALSE-POSITIVE GUARDS (${FALSE_POSITIVE_PATTERNS.length}) ---`);
FALSE_POSITIVE_PATTERNS.forEach((pattern, idx) => {
  console.log(`${String(idx + 1).padStart(3, ' ')}. ${pattern.toString()}`);
});
