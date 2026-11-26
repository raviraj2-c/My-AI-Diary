import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enPath = path.join(__dirname, '../src/i18n/locales/en.json');
const hiPath = path.join(__dirname, '../src/i18n/locales/hi.json');
const srcDir = path.join(__dirname, '../src');

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getKeys(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

function getSourceFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== '__tests__' && file !== 'node_modules' && file !== 'dist') {
        results = results.concat(getSourceFiles(fullPath));
      }
    } else if (/\.(ts|tsx)$/.test(file) && !file.includes('.test.')) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractTranslationKeys(fileContent) {
  const keys = new Set();
  const regex = /\bt\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g;
  let match;
  while ((match = regex.exec(fileContent)) !== null) {
    keys.add(match[1]);
  }
  return keys;
}

try {
  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const hiData = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

  const enKeys = new Set(getKeys(enData));
  const hiKeys = new Set(getKeys(hiData));

  // 1. Check parity between en.json and hi.json
  const missingInHi = [...enKeys].filter((k) => !hiKeys.has(k));
  const missingInEn = [...hiKeys].filter((k) => !enKeys.has(k));

  let hasError = false;

  if (missingInHi.length > 0) {
    console.error(`❌ ${missingInHi.length} keys present in en.json but missing in hi.json:`);
    missingInHi.forEach((k) => console.error(`  - ${k}`));
    hasError = true;
  }

  if (missingInEn.length > 0) {
    console.error(`❌ ${missingInEn.length} keys present in hi.json but missing in en.json:`);
    missingInEn.forEach((k) => console.error(`  - ${k}`));
    hasError = true;
  }

  // 2. Scan source code for t('key') calls and ensure they exist in both locale files
  const sourceFiles = getSourceFiles(srcDir);
  const codeKeysWithFiles = new Map();

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const keysInFile = extractTranslationKeys(content);
    for (const key of keysInFile) {
      if (!codeKeysWithFiles.has(key)) {
        codeKeysWithFiles.set(key, []);
      }
      codeKeysWithFiles.get(key).push(path.relative(srcDir, file));
    }
  }

  const missingFromLocales = [];
  for (const [key, files] of codeKeysWithFiles.entries()) {
    const existsInEn = enKeys.has(key) || enKeys.has(`${key}_one`) || enKeys.has(`${key}_other`);
    const existsInHi = hiKeys.has(key) || hiKeys.has(`${key}_one`) || hiKeys.has(`${key}_other`);
    if (!existsInEn || !existsInHi) {
      missingFromLocales.push({ key, files, missingIn: !existsInEn ? 'en.json' : 'hi.json' });
    }
  }

  if (missingFromLocales.length > 0) {
    console.error(`\n❌ ${missingFromLocales.length} t() keys used in code are missing from locale files:`);
    missingFromLocales.forEach(({ key, files, missingIn }) => {
      console.error(`  - ${key} (missing in ${missingIn}, used in: ${files.join(', ')})`);
    });
    hasError = true;
  }

  if (hasError) {
    console.error('\n❌ i18n validation failed.');
    process.exit(1);
  }

  console.log(`✅ i18n check passed: Both en.json and hi.json have identical ${enKeys.size} keys, and all ${codeKeysWithFiles.size} code t() calls resolve.`);
  process.exit(0);
} catch (err) {
  console.error('Error running i18n check:', err);
  process.exit(1);
}
