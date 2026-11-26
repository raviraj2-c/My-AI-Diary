const { computeWellnessInsights } = require('../utils/insights');
const { evaluateBurnout } = require('../utils/burnout');

describe('Wellness Insights Math & Statistical Rules', () => {
  it('enforces "not enough data" rule when check-ins are fewer than 7', () => {
    const checkIns = [
      { date: '2026-11-01', moodScore: 7 },
      { date: '2026-11-02', moodScore: 8 },
      { date: '2026-11-03', moodScore: 6 },
      { date: '2026-11-04', moodScore: 7 },
      { date: '2026-11-05', moodScore: 5 },
      { date: '2026-11-06', moodScore: 8 }
    ]; // 6 points < 7

    const insights = computeWellnessInsights(checkIns, [], []);
    expect(insights.hasEnoughData).toBe(false);
    expect(insights.dataPointsCount).toBe(6);
    expect(insights.correlations).toEqual([]);
    expect(insights.findings).toEqual([]);
  });

  it('calculates exact known averages, best day, and hardest day with 7+ check-ins', () => {
    const checkIns = [
      { date: '2026-11-01T10:00:00Z', moodScore: 6, emotions: ['Neutral'] },
      { date: '2026-11-02T10:00:00Z', moodScore: 7, emotions: ['Peaceful'] },
      { date: '2026-11-03T10:00:00Z', moodScore: 8, emotions: ['Content'] },
      { date: '2026-11-04T10:00:00Z', moodScore: 9, emotions: ['Joyful'] },
      { date: '2026-11-05T10:00:00Z', moodScore: 10, emotions: ['Ecstatic'] },
      { date: '2026-11-06T10:00:00Z', moodScore: 5, emotions: ['Tired'] },
      { date: '2026-11-07T10:00:00Z', moodScore: 4, emotions: ['Down'] }
    ];
    // sum = 49, count = 7, avg = 7.0

    const insights = computeWellnessInsights(checkIns, [], []);
    expect(insights.hasEnoughData).toBe(true);
    expect(insights.dataPointsCount).toBe(7);
    expect(insights.averageMood).toBe(7.0);
    expect(insights.bestDay.moodScore).toBe(10);
    expect(insights.hardestDay.moodScore).toBe(4);
  });

  it('computes exact sleep correlation lift for known data', () => {
    // 4 good sleep days (8h, mood 9) and 4 low sleep days (5h, mood 5)
    // Diff should be 9 - 5 = 4.0 points higher
    const checkIns = [
      { date: '2026-11-01T10:00:00Z', moodScore: 9, sleepHours: 8 },
      { date: '2026-11-02T10:00:00Z', moodScore: 9, sleepHours: 8 },
      { date: '2026-11-03T10:00:00Z', moodScore: 9, sleepHours: 8 },
      { date: '2026-11-04T10:00:00Z', moodScore: 9, sleepHours: 8 },
      { date: '2026-11-05T10:00:00Z', moodScore: 5, sleepHours: 5 },
      { date: '2026-11-06T10:00:00Z', moodScore: 5, sleepHours: 5 },
      { date: '2026-11-07T10:00:00Z', moodScore: 5, sleepHours: 5 },
      { date: '2026-11-08T10:00:00Z', moodScore: 5, sleepHours: 5 }
    ];

    const insights = computeWellnessInsights(checkIns, [], []);
    const sleepCorr = insights.correlations.find((c) => c.factor === 'sleep');
    expect(sleepCorr).toBeDefined();
    expect(sleepCorr.diff).toBe(4.0);
    expect(sleepCorr.text).toContain('4 points higher');
  });

  it('burnout evaluator flags warning when stress >= 4 on 5+ days and sleep < 6.5h', () => {
    const highBurnoutCheckIns = [
      { stress: 5, sleepHours: 5 },
      { stress: 4, sleepHours: 5.5 },
      { stress: 5, sleepHours: 5 },
      { stress: 4, sleepHours: 6 },
      { stress: 4, sleepHours: 5 },
      { stress: 2, sleepHours: 7 },
      { stress: 3, sleepHours: 6 }
    ];

    const result = evaluateBurnout(highBurnoutCheckIns);
    expect(result.warning).toBe(true);
    expect(result.highStressDays).toBe(5);
    expect(result.avgSleepHours).toBeLessThan(6.5);
    expect(result.message).toContain('Gentle reflection');

    const healthyCheckIns = [
      { stress: 1, sleepHours: 8 },
      { stress: 2, sleepHours: 7.5 },
      { stress: 2, sleepHours: 8 },
      { stress: 1, sleepHours: 8 },
      { stress: 2, sleepHours: 7 },
      { stress: 1, sleepHours: 8 },
      { stress: 1, sleepHours: 8 }
    ];

    const healthyResult = evaluateBurnout(healthyCheckIns);
    expect(healthyResult.warning).toBe(false);
    expect(healthyResult.highStressDays).toBe(0);
    expect(healthyResult.message).toBeNull();
  });
});
