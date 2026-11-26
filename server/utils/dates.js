/**
 * Date utility helpers for consistent day boundary and timezone handling.
 * The frontend sends YYYY-MM-DD strings (or Date / ISO strings).
 * Provides IANA timezone conversion, local date keys, and day boundary ranges.
 */

function isValidTimezone(tz) {
  if (typeof tz !== 'string' || !tz.trim()) {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz.trim() });
    return true;
  } catch (e) {
    return false;
  }
}

function resolveTimezone(tz) {
  if (isValidTimezone(tz)) {
    return tz.trim();
  }
  return 'UTC';
}

/**
 * Returns difference in milliseconds between the target timezone local time and UTC:
 * offset = localTime - utcTime
 */
function getTimezoneOffsetMs(date, timezone) {
  const tz = resolveTimezone(timezone);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  let y = 0, m = 0, d = 0, h = 0, min = 0, sec = 0;
  for (const p of parts) {
    if (p.type === 'year') y = parseInt(p.value, 10);
    else if (p.type === 'month') m = parseInt(p.value, 10);
    else if (p.type === 'day') d = parseInt(p.value, 10);
    else if (p.type === 'hour') h = parseInt(p.value, 10);
    else if (p.type === 'minute') min = parseInt(p.value, 10);
    else if (p.type === 'second') sec = parseInt(p.value, 10);
  }
  if (h === 24) h = 0;
  const localAsUtc = Date.UTC(y, m - 1, d, h, min, sec, date.getUTCMilliseconds());
  return localAsUtc - date.getTime();
}

/**
 * Converts a Date or ISO string into a YYYY-MM-DD date key in the given timezone.
 */
function keyOf(dateInput, tz = 'UTC') {
  const timezone = resolveTimezone(tz);
  const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date input for keyOf');
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

/**
 * Returns today's YYYY-MM-DD date key in the given timezone.
 */
function todayKey(tz = 'UTC') {
  return keyOf(new Date(), tz);
}

/**
 * Returns the exact UTC start and end Date objects for a date key or Date in the given timezone.
 */
function dayRange(keyOrDate, tz = 'UTC') {
  const timezone = resolveTimezone(tz);
  let key;
  if (typeof keyOrDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(keyOrDate.trim())) {
    key = keyOrDate.trim();
  } else {
    key = keyOf(keyOrDate, timezone);
  }

  const [year, month, day] = key.split('-').map(Number);

  if (timezone === 'UTC') {
    return {
      start: new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)),
      end: new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
    };
  }

  const targetStartUtc = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const startOffsetGuess = getTimezoneOffsetMs(new Date(targetStartUtc), timezone);
  const startUtcGuess = targetStartUtc - startOffsetGuess;
  const actualStartOffset = getTimezoneOffsetMs(new Date(startUtcGuess), timezone);
  const start = new Date(targetStartUtc - actualStartOffset);

  const targetEndUtc = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
  const endOffsetGuess = getTimezoneOffsetMs(new Date(targetEndUtc), timezone);
  const endUtcGuess = targetEndUtc - endOffsetGuess;
  const actualEndOffset = getTimezoneOffsetMs(new Date(endUtcGuess), timezone);
  const end = new Date(targetEndUtc - actualEndOffset);

  return { start, end };
}

function parseDateInput(input) {
  if (input instanceof Date) {
    return new Date(input.getTime());
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  throw new Error('Invalid date input');
}

/**
 * Returns the exact start of the given date (in specified timezone, or UTC).
 */
function startOfDay(input, tz = 'UTC') {
  if (tz && tz !== 'UTC') {
    return dayRange(input, tz).start;
  }
  const d = parseDateInput(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Returns the exact end of the given date (in specified timezone, or UTC).
 */
function endOfDay(input, tz = 'UTC') {
  if (tz && tz !== 'UTC') {
    return dayRange(input, tz).end;
  }
  const d = parseDateInput(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

/**
 * Calculates calendar day difference (keyB - keyA).
 */
function diffInCalendarDays(keyA, keyB) {
  const [yA, mA, dA] = keyA.split('-').map(Number);
  const [yB, mB, dB] = keyB.split('-').map(Number);
  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);
  return Math.round((utcB - utcA) / 86400000);
}

/**
 * Returns previous YYYY-MM-DD date key.
 */
function getPreviousDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  const prevDate = new Date(Date.UTC(y, m - 1, d - 1));
  return prevDate.toISOString().split('T')[0];
}

module.exports = {
  isValidTimezone,
  resolveTimezone,
  getTimezoneOffsetMs,
  keyOf,
  todayKey,
  dayRange,
  startOfDay,
  endOfDay,
  diffInCalendarDays,
  getPreviousDateKey
};
