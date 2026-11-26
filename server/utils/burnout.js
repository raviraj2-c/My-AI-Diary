/**
 * Evaluates burnout risk given an array of check-in records within a rolling window.
 * Rules:
 * - High stress day: check-in with stress >= 4
 * - Burnout warning: 5+ high stress days AND average sleep < 6.5 hours
 * - Never alarming or clinical.
 *
 * @param {Array<{ stress?: number, sleepHours?: number }>} checkIns
 * @param {number} [windowDays=7]
 * @returns {{ warning: boolean, code: string, messageKey: string|null, params: object, highStressDays: number, avgSleepHours: number, message: string|null }}
 */
function evaluateBurnout(checkIns = [], windowDays = 7) {
  let highStressDays = 0;
  let totalSleep = 0;
  let sleepDays = 0;
  const checkedDays = (checkIns || []).length;

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
  const roundedSleep = Number(avgSleepHours.toFixed(1));
  const isBurnoutRisk = highStressDays >= 5 && avgSleepHours < 6.5;

  return {
    warning: isBurnoutRisk,
    code: isBurnoutRisk ? 'BURNOUT_WARNING' : 'BURNOUT_SAFE',
    messageKey: isBurnoutRisk ? 'student.burnoutMessage' : null,
    params: {
      highStressDays,
      checkedDays,
      windowDays,
      avgSleepHours: roundedSleep
    },
    highStressDays,
    avgSleepHours: roundedSleep,
    message: isBurnoutRisk
      ? `Gentle reflection: You have experienced elevated stress on ${highStressDays} of the last ${windowDays} days (${checkedDays} logged) alongside ${roundedSleep}h average sleep. Remember to grant yourself a true pause today—rest is productive too.`
      : null
  };
}

module.exports = {
  evaluateBurnout
};
