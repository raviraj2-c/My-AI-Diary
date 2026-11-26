/**
 * Prints all crisis/concern phrases grouped by level for counselor review.
 * Usage: node server/scripts/riskReport.js
 *
 * NOTE: needs counselor review - Lexicon is community-maintained and NOT clinically validated.
 */
const { HIGH_RISK_PHRASES, CONCERN_PHRASES } = require('../data/riskKeywords');
const { FALSE_POSITIVE_PATTERNS } = require('../utils/riskCheck');

console.log('====================================================================');
console.log('MindDiary Risk Lexicon Report (NEEDS COUNSELOR REVIEW)');
console.log('Not clinically validated. For human safety-lexicon review only.');
console.log('====================================================================\n');

console.log(`--- HIGH RISK PHRASES (${HIGH_RISK_PHRASES.length}) ---`);
HIGH_RISK_PHRASES.forEach((phrase, idx) => {
  console.log(`${String(idx + 1).padStart(3, ' ')}. ${phrase}`);
});

console.log(`\n--- CONCERN PHRASES (${CONCERN_PHRASES.length}) ---`);
CONCERN_PHRASES.forEach((phrase, idx) => {
  console.log(`${String(idx + 1).padStart(3, ' ')}. ${phrase}`);
});

console.log(`\n--- IDIOM / FALSE-POSITIVE GUARD PATTERNS (${FALSE_POSITIVE_PATTERNS.length}) ---`);
FALSE_POSITIVE_PATTERNS.forEach((pattern, idx) => {
  console.log(`${String(idx + 1).padStart(3, ' ')}. ${pattern.toString()}`);
});
