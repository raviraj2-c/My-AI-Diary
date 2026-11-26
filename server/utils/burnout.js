/**
 * Evaluates burnout risk given an array of check-in records.
 * Rules:
 * - High stress day: check-in with stress >= 4
 * - Burnout warning: 5+ high stress days AND average sleep < 6.5 hours
 * - Never alarming or clinical.
 *
 * @param {Array<{ stress?: number, sleepHours?: number }>} checkIns
 * @returns {{ warning: boolean, highStressDays: number, avgSleepHours: number, message: string|null }}
 */
function evaluateBurnout(checkIns = []) {
  let highStressDays = 0;
  let totalSleep = 0;
  let sleepDays = 0;

  (checkIns || []).forEach((ci) => {
    if (ci && ci.stress != null && ci.stress >= 4) {
      highStressDays += 1;
    }
    if (ci && ci.sleepHours != null && ci.sleepHours > 0) {
      totalSleep += ci.sleepHours;
      sleepDays += 1;
    }
  });

  const avgSleepHours = sleepDays > 0 ? totalSleep / sleepDays : 7;
  const isBurnoutRisk = highStressDays >= 5 && avgSleepHours < 6.5;

  return {
    warning: isBurnoutRisk,
    code: isBurnoutRisk ? 'BURNOUT_WARNING' : 'BURNOUT_SAFE',
    params: {
      highStressDays,
      avgSleepHours: Number(avgSleepHours.toFixed(1))
    },
    highStressDays,
    avgSleepHours: Number(avgSleepHours.toFixed(1)),
    message: isBurnoutRisk
      ? `Gentle reflection: You have experienced elevated stress on ${highStressDays} of the last 7 days alongside lighter sleep. Remember to grant yourself a true pause today—rest is productive too.`
      : null
  };
}

module.exports = {
  evaluateBurnout
};
