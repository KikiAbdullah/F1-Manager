// ============================================================
// Race Engine — F1 Manager 2026
// Performance math based on F1_Manager_Stats_Calculation_Plan.md
// ============================================================

/**
 * Calculate a driver's base lap time in milliseconds.
 * Lower = faster.
 */
export function calculateLapTime(driver, chassis, pu, circuit, weather = 'dry') {
  const dStats = driver?.stats ?? {}
  const cStats = chassis?.stats ?? {}
  const puStats = pu?.stats ?? {}

  // Base time from circuit (ms) — derived from circuit length & typical lap
  const baseLapMs = (circuit?.length_km ?? 5.3) * 1000 * 59 // ~59s per km baseline

  // Driver contribution (pace + concentration − mistakes)
  const driverScore =
    ((dStats.pace ?? 70) * 0.4) +
    ((dStats.racecraft ?? 70) * 0.2) +
    ((dStats.concentration ?? 70) * 0.2) -
    ((dStats.mistakes ?? 30) * 0.2)

  // Car contribution (aero + mech grip + PU power)
  const carScore =
    ((cStats.aerodynamics ?? 70) * 0.3) +
    ((cStats.mechanical_grip ?? 70) * 0.25) +
    ((puStats.power ?? 70) * 0.25) +
    ((puStats.deployment ?? 70) * 0.2)

  // Circuit type modifier
  const circuitType = circuit?.type ?? 'balanced'
  let circuitMod = 1.0
  if (circuitType === 'street')    circuitMod = 1.008
  if (circuitType === 'high_speed') circuitMod = 0.998
  if (circuitType === 'technical') circuitMod = 1.004

  // Weather modifier
  const wetMod = weather === 'wet' ? 1.12 : (weather === 'intermediate' ? 1.05 : 1.0)

  // Combined: higher scores → faster (lower time)
  const combined = (driverScore + carScore) / 2  // 0–100 range
  const efficiency = 1 - ((combined - 50) / 500) // ~50 baseline → 0 adjustment

  return Math.round(baseLapMs * circuitMod * wetMod * efficiency)
}

/**
 * Add random variance per lap (±0.3% variance)
 */
export function addLapVariance(lapTimeMs, variancePct = 0.003) {
  const variance = (Math.random() * 2 - 1) * variancePct
  return Math.round(lapTimeMs * (1 + variance))
}

/**
 * Calculate probability of DNF on a given lap.
 * Returns true if DNF occurs.
 */
export function rollDNF(reliability, lap, totalLaps) {
  const baseProbPerLap = (1 - (reliability ?? 75) / 100) * 0.025
  const lateFactor = lap / totalLaps  // higher late in race
  return Math.random() < baseProbPerLap * (1 + lateFactor * 0.5)
}

/**
 * Calculate pit stop loss in ms.
 */
export function calculatePitStopMs(teamPitCrewStat = 70) {
  const base = 22000  // 22s base
  const efficiency = (teamPitCrewStat - 50) / 50  // -1 to +1
  const loss = base * (1 - efficiency * 0.15)
  const variance = (Math.random() - 0.5) * 1200  // ±600ms
  return Math.round(loss + variance)
}

/**
 * Random Safety Car check per lap (base 3% chance).
 */
export function rollSafetyCar(baseProbability = 0.03) {
  return Math.random() < baseProbability
}

/**
 * Format ms → "1:23.456"
 */
export function formatLapTime(ms) {
  if (!ms || ms <= 0) return '–'
  const totalSec = ms / 1000
  const mins = Math.floor(totalSec / 60)
  const secs = (totalSec % 60).toFixed(3).padStart(6, '0')
  return `${mins}:${secs}`
}

/**
 * Qualifying gap string (e.g. "+0.312")
 */
export function formatGap(driverMs, leaderMs) {
  if (driverMs === leaderMs) return 'POLE'
  const diff = ((driverMs - leaderMs) / 1000).toFixed(3)
  return `+${diff}`
}
