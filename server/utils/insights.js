/**
 * Plain statistical calculation of wellness patterns, correlations, and streak metrics.
 * Designed with kind, non-judgmental language. No AI or diagnostic claims.
 */

function round1(num) {
  return Math.round(num * 10) / 10;
}

/**
 * Truncates date to start of UTC day (YYYY-MM-DDT00:00:00.000Z)
 */
function toDayKey(dateInput) {
  const d = new Date(dateInput);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Computes wellness statistics and observations.
 * @param {Array} checkIns - Array of CheckIn documents
 * @param {Array} habits - Array of HabitLog documents
 * @param {Array} entries - Array of DiaryEntry documents
 * @returns {Object} insights payload
 */
function computeWellnessInsights(checkIns = [], habits = [], entries = []) {
  const totalCheckIns = checkIns.length;
  const hasEnoughData = totalCheckIns >= 7;

  // Build combined map per day
  const daysMap = new Map();

  checkIns.forEach((ci) => {
    const key = toDayKey(ci.date);
    daysMap.set(key, {
      date: ci.date,
      key,
      moodScore: ci.moodScore,
      emotions: ci.emotions || [],
      sleepHours: ci.sleepHours,
      energy: ci.energy,
      stress: ci.stress,
      anxiety: ci.anxiety,
      tags: ci.tags || [],
      waterGlasses: 0,
      exerciseMinutes: 0,
      screenTimeHours: 0,
    });
  });

  // Enrich with habit logs
  habits.forEach((h) => {
    const key = toDayKey(h.date);
    const existing = daysMap.get(key) || {
      date: h.date,
      key,
      moodScore: null,
      emotions: [],
      tags: [],
      sleepHours: h.sleepHours,
    };
    existing.waterGlasses = h.waterGlasses || 0;
    existing.exerciseMinutes = h.exerciseMinutes || 0;
    existing.screenTimeHours = h.screenTimeHours || 0;
    if (existing.sleepHours == null && h.sleepHours != null) {
      existing.sleepHours = h.sleepHours;
    }
    daysMap.set(key, existing);
  });

  // Sort daily points chronologically
  const dayList = Array.from(daysMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const moodList = checkIns.map((c) => c.moodScore).filter((m) => typeof m === 'number');
  const averageMood = moodList.length > 0 ? round1(moodList.reduce((a, b) => a + b, 0) / moodList.length) : null;

  // Best and hardest days
  let bestDay = null;
  let hardestDay = null;

  if (checkIns.length > 0) {
    const sortedByMood = [...checkIns].sort((a, b) => b.moodScore - a.moodScore);
    const best = sortedByMood[0];
    const hardest = sortedByMood[sortedByMood.length - 1];

    bestDay = {
      date: best.date,
      moodScore: best.moodScore,
      emotions: best.emotions || []
    };

    hardestDay = {
      date: hardest.date,
      moodScore: hardest.moodScore,
      emotions: hardest.emotions || []
    };
  }

  // Emotion frequency
  const emotionCounts = {};
  checkIns.forEach((ci) => {
    (ci.emotions || []).forEach((e) => {
      const clean = e.trim().toLowerCase();
      if (clean) emotionCounts[clean] = (emotionCounts[clean] || 0) + 1;
    });
  });

  const mostFrequentEmotions = Object.entries(emotionCounts)
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Common tags on low mood days (moodScore <= 4)
  const lowDayTags = {};
  checkIns
    .filter((ci) => ci.moodScore <= 4)
    .forEach((ci) => {
      (ci.tags || []).forEach((t) => {
        const clean = t.trim().toLowerCase();
        if (clean) lowDayTags[clean] = (lowDayTags[clean] || 0) + 1;
      });
    });

  const commonTagsOnLowDays = Object.entries(lowDayTags)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Weekday pattern: average mood by Monday, Tuesday, etc.
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdayTotals = weekdayNames.map((name) => ({ name, sum: 0, count: 0 }));

  checkIns.forEach((ci) => {
    const d = new Date(ci.date);
    const dayIdx = d.getUTCDay();
    weekdayTotals[dayIdx].sum += ci.moodScore;
    weekdayTotals[dayIdx].count += 1;
  });

  const weekdayPattern = weekdayTotals.map((w) => ({
    day: w.name,
    averageMood: w.count > 0 ? round1(w.sum / w.count) : null,
    sampleSize: w.count
  }));

  // Correlation and gentle observations (only computed if >= 7 check-ins)
  const correlations = [];
  const findings = [];

  if (hasEnoughData) {
    // 1. Sleep correlation
    const daysWithSleep = dayList.filter((d) => d.moodScore != null && typeof d.sleepHours === 'number' && d.sleepHours > 0);
    if (daysWithSleep.length >= 7) {
      const goodSleep = daysWithSleep.filter((d) => d.sleepHours >= 7);
      const lowSleep = daysWithSleep.filter((d) => d.sleepHours < 7);

      if (goodSleep.length >= 2 && lowSleep.length >= 2) {
        const avgGood = goodSleep.reduce((a, b) => a + b.moodScore, 0) / goodSleep.length;
        const avgLow = lowSleep.reduce((a, b) => a + b.moodScore, 0) / lowSleep.length;
        const diff = round1(avgGood - avgLow);

        if (Math.abs(diff) >= 0.5) {
          const phrase = diff > 0
            ? `Your average mood seems to be ${diff} points higher on days you rest 7 or more hours.`
            : `Your mood scores averaged ${Math.abs(diff)} points lower on longer sleep days.`;
          correlations.push({ factor: 'sleep', diff, text: phrase });
          findings.push(phrase);
        }
      }
    }

    // 2. Exercise correlation
    const daysWithExercise = dayList.filter((d) => d.moodScore != null && typeof d.exerciseMinutes === 'number');
    if (daysWithExercise.length >= 7) {
      const activeDays = daysWithExercise.filter((d) => d.exerciseMinutes >= 20);
      const stillDays = daysWithExercise.filter((d) => d.exerciseMinutes < 20);

      if (activeDays.length >= 2 && stillDays.length >= 2) {
        const avgActive = activeDays.reduce((a, b) => a + b.moodScore, 0) / activeDays.length;
        const avgStill = stillDays.reduce((a, b) => a + b.moodScore, 0) / stillDays.length;
        const diff = round1(avgActive - avgStill);

        if (diff >= 0.5) {
          const phrase = `Physical movement of 20+ minutes tends to accompany a ${diff} point lift in your daily mood.`;
          correlations.push({ factor: 'exercise', diff, text: phrase });
          findings.push(phrase);
        }
      }
    }

    // 3. Screen time correlation
    const daysWithScreen = dayList.filter((d) => d.moodScore != null && typeof d.screenTimeHours === 'number' && d.screenTimeHours > 0);
    if (daysWithScreen.length >= 7) {
      const highScreen = daysWithScreen.filter((d) => d.screenTimeHours >= 5);
      const balancedScreen = daysWithScreen.filter((d) => d.screenTimeHours < 5);

      if (highScreen.length >= 2 && balancedScreen.length >= 2) {
        const avgHigh = highScreen.reduce((a, b) => a + b.moodScore, 0) / highScreen.length;
        const avgBalanced = balancedScreen.reduce((a, b) => a + b.moodScore, 0) / balancedScreen.length;
        const diff = round1(avgBalanced - avgHigh);

        if (diff >= 0.6) {
          const phrase = `Days with moderate screen time (<5 hrs) appear to align with a ${diff} point higher emotional score.`;
          correlations.push({ factor: 'screenTime', diff, text: phrase });
          findings.push(phrase);
        }
      }
    }

    // 4. Most frequent emotion observation
    if (mostFrequentEmotions.length > 0) {
      const top = mostFrequentEmotions[0];
      findings.push(`Your most frequently acknowledged emotion was "${top.emotion}", appearing ${top.count} times.`);
    }

    // 5. Common trigger observation
    if (commonTagsOnLowDays.length > 0) {
      const topTag = commonTagsOnLowDays[0];
      findings.push(`On heavier or lower-energy days, the topic "#${topTag.tag}" was recorded most often.`);
    }
  }

  // --- Gentle Streak & Reflection Rhythm ---
  // Count distinct calendar days with either a CheckIn OR a DiaryEntry
  const activeDayKeys = new Set();
  checkIns.forEach((c) => activeDayKeys.add(toDayKey(c.date)));
  const safeEntries = Array.isArray(entries) ? entries : [];
  safeEntries.forEach((e) => activeDayKeys.add(toDayKey(e.entryDate || e.date)));

  // Last 7 days presence
  const today = new Date();
  let daysInLastWeek = 0;
  for (let i = 0; i < 7; i++) {
    const pastDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    if (activeDayKeys.has(toDayKey(pastDate))) {
      daysInLastWeek++;
    }
  }

  // Consecutive current streak
  let currentStreak = 0;
  let checkDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  // If today isn't checked in yet, check if yesterday was, so streak doesn't feel abruptly broken today
  if (!activeDayKeys.has(toDayKey(checkDate))) {
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  }

  while (activeDayKeys.has(toDayKey(checkDate))) {
    currentStreak++;
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  }

  const kindStreakMessage =
    daysInLastWeek >= 5
      ? 'You have stayed gently attuned to yourself this week.'
      : daysInLastWeek >= 3
      ? 'A steady rhythm of self-reflection is forming.'
      : 'Resting is part of living. We are glad you took a moment for yourself today.';

  return {
    hasEnoughData,
    dataPointsCount: totalCheckIns,
    averageMood,
    bestDay,
    hardestDay,
    moodPerDay: dayList.map((d) => ({
      date: d.date,
      key: d.key,
      moodScore: d.moodScore,
      emotions: d.emotions,
      sleepHours: d.sleepHours,
      energy: d.energy,
      stress: d.stress,
      anxiety: d.anxiety,
      waterGlasses: d.waterGlasses,
      exerciseMinutes: d.exerciseMinutes,
      screenTimeHours: d.screenTimeHours,
    })),
    mostFrequentEmotions,
    commonTagsOnLowDays,
    weekdayPattern,
    correlations,
    findings,
    streak: {
      currentDays: currentStreak,
      last7DaysCount: daysInLastWeek,
      last7DaysRatio: `${daysInLastWeek} of 7`,
      kindMessage: kindStreakMessage,
      totalActiveDays: activeDayKeys.size
    }
  };
}

module.exports = {
  computeWellnessInsights,
  toDayKey
};
