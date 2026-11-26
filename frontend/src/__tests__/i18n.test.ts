import { describe, it, expect } from 'vitest';
import en from '../i18n/locales/en.json';
import hi from '../i18n/locales/hi.json';

function getLeafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getLeafKeys(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys.sort();
}

describe('i18n Translation Key Parity', () => {
  it('both en.json and hi.json have identical keys with no missing entries', () => {
    const enKeys = getLeafKeys(en);
    const hiKeys = getLeafKeys(hi);

    const missingInHi = enKeys.filter((k) => !hiKeys.includes(k));
    const missingInEn = hiKeys.filter((k) => !enKeys.includes(k));

    expect(missingInHi, `Keys present in en but missing in hi: ${missingInHi.join(', ')}`).toEqual([]);
    expect(missingInEn, `Keys present in hi but missing in en: ${missingInEn.join(', ')}`).toEqual([]);
    expect(enKeys.length).toBeGreaterThanOrEqual(50);
  });
});
