// ============================================================
// Race Simulator — F1 Manager 2026
// Full lap-by-lap race simulation loop
// ============================================================

import {
  calculateLapTime, addLapVariance,
  rollDNF, calculatePitStopMs, rollSafetyCar,
  formatLapTime,
} from './engine.js'

const PIT_LAPS_RANGE = [14, 20] // earliest/latest pit lap

function buildEntry(driver, chassis, pu, team, isPlayer = false) {
  return {
    driverId:   driver.id,
    driverName: driver.full_name ?? driver.name ?? 'Unknown',
    teamId:     team?.id ?? 'unknown',
    teamName:   team?.name ?? 'Unknown',
    teamColor:  team?.color ?? '#888888',
    baseLapMs:  0,    // set during race
    totalTimeMs:0,
    laps:       0,
    dnf:        false,
    dnfLap:     null,
    pitted:     false,
    pitLap:     Math.floor(Math.random() * (PIT_LAPS_RANGE[1] - PIT_LAPS_RANGE[0])) + PIT_LAPS_RANGE[0],
    pitTimeMs:  0,
    position:   0,
    isPlayer,
    _chassis:   chassis,
    _pu:        pu,
    _driver:    driver,
  }
}

/**
 * Run a full race simulation.
 * @param {Object[]} entries   - each: { driver, chassis, pu, team, isPlayer? }
 * @param {Object}   circuit
 * @param {string}   weather   - 'dry' | 'wet' | 'intermediate'
 * @param {function} onLap     - callback(lap, standings) for live updates
 * @returns {Object[]}         - sorted final standings
 */
export async function simulateRace(entries, circuit, weather = 'dry', onLap = null) {
  const totalLaps = circuit?.laps ?? 57
  const reliability = circuit?.game_stats?.reliability_importance ?? 70

  // Build race entries
  const cars = entries.map(e =>
    buildEntry(e.driver, e.chassis, e.pu, e.team, e.isPlayer)
  )

  // Pre-calculate base lap times for grid
  for (const car of cars) {
    car.baseLapMs = calculateLapTime(car._driver, car._chassis, car._pu, circuit, weather)
  }

  // Sort by qualifying order (fastest first)
  cars.sort((a, b) => a.baseLapMs - b.baseLapMs)
  cars.forEach((c, i) => { c.position = i + 1 })

  let safetyCar = false
  let safetyCar_laps = 0

  // Lap loop
  for (let lap = 1; lap <= totalLaps; lap++) {
    // Safety Car logic
    if (safetyCar) {
      safetyCar_laps--
      if (safetyCar_laps <= 0) safetyCar = false
    } else if (rollSafetyCar(0.025)) {
      safetyCar = true
      safetyCar_laps = Math.floor(Math.random() * 3) + 2
    }

    for (const car of cars) {
      if (car.dnf) continue

      // DNF check
      if (rollDNF(reliability, lap, totalLaps)) {
        car.dnf = true
        car.dnfLap = lap
        continue
      }

      // Lap time
      let lapMs = addLapVariance(car.baseLapMs)

      // Safety car slows everyone
      if (safetyCar) lapMs = car.baseLapMs * 1.35

      // Pit stop
      if (!car.pitted && lap === car.pitLap) {
        car.pitted = true
        car.pitTimeMs = calculatePitStopMs(70)
        lapMs += car.pitTimeMs
      }

      car.totalTimeMs += lapMs
      car.laps = lap
    }

    // Re-sort standings
    cars.sort((a, b) => {
      if (a.dnf && !b.dnf) return 1
      if (!a.dnf && b.dnf) return -1
      return a.totalTimeMs - b.totalTimeMs
    })
    cars.forEach((c, i) => { c.position = i + 1 })

    // Yield to UI every 5 laps
    if (onLap && lap % 5 === 0) {
      onLap(lap, cars.map(c => ({ ...c })))
      await new Promise(r => setTimeout(r, 0)) // non-blocking
    }
  }

  return cars
}

/**
 * Quick qualifying simulation — returns sorted array fastest→slowest
 */
export function simulateQualifying(entries, circuit, weather = 'dry') {
  return entries
    .map(e => {
      const lapMs = addLapVariance(
        calculateLapTime(e.driver, e.chassis, e.pu, circuit, weather),
        0.006
      )
      return {
        driverId:   e.driver.id,
        driverName: e.driver.full_name ?? e.driver.name,
        teamName:   e.team?.name ?? '',
        teamColor:  e.team?.color ?? '#888',
        lapMs,
        lapTime:    formatLapTime(lapMs),
        isPlayer:   e.isPlayer ?? false,
        dnf:        false,
      }
    })
    .sort((a, b) => a.lapMs - b.lapMs)
}

const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]

export function assignPoints(standings) {
  return standings.map((entry, i) => ({
    ...entry,
    points: entry.dnf ? 0 : (F1_POINTS[i] ?? 0),
  }))
}
