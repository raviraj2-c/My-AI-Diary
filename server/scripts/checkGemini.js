const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { GEMINI_API_BASE, getApiKey, getModel } = require('../config/ai');

async function main() {
  const apiKey = getApiKey();
  const configuredModel = getModel();

  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is missing or set to placeholder in server/.env');
    process.exit(1);
  }

  const res = await fetch(`${GEMINI_API_BASE}?pageSize=100`, {
    method: 'GET',
    headers: { 'x-goog-api-key': apiKey }
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`❌ Failed to fetch Gemini models (HTTP ${res.status}): ${body}`);
    process.exit(1);
  }

  const data = await res.json();
  const models = (data.models || [])
    .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
    .map((m) => String(m.name || '').replace(/^models\//, ''))
    .filter(Boolean);

  console.log('Models supporting generateContent:');
  for (const name of models) {
    console.log(`  - ${name}`);
  }

  if (!configuredModel) {
    console.error('\n❌ GEMINI_MODEL is not set. Set GEMINI_MODEL in server/.env to one of the names above.');
    process.exit(1);
  }

  if (models.includes(configuredModel)) {
    console.log(`\n✅ Configured GEMINI_MODEL '${configuredModel}' is in the list.`);
    return;
  }

  console.error(`\n❌ Configured GEMINI_MODEL '${configuredModel}' was NOT found in the list above.`);
  process.exit(1);
}

main().catch((err) => {
  console.error('❌ ai:check failed:', err.message);
  process.exit(1);
});
