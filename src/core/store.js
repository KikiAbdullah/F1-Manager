// ============================================================
// Global State Store — F1 Manager 2026
// Simple reactive observable store (no library needed)
// ============================================================

const _state = {
  // firebase removed: local JSON + localStorage persistence
  gameState:      null,   // { currentSeasonId, currentRound, currentPhase, playerTeamId }
  playerTeamMeta: null,   // { createdTeamId, … }
  playerTeam:     null,   // Full team object from Firestore
  allTeams:       [],
  allPersonnel:   [],     // drivers + staff combined
  allCircuits:    [],
  allSchedules:   [],
  season:         null,
  powerUnits:     [],
  powerUnitSuppliers: [],
  chassis:        [],
  sponsors:       [],
  currentScreen:  'main-menu',
}

const _listeners = {}

export const store = {
  /** Get a value */
  get(key) {
    return _state[key]
  },

  /** Get entire state snapshot */
  getAll() {
    return { ..._state }
  },

  /** Set a value and notify listeners */
  set(key, value) {
    _state[key] = value
    if (_listeners[key]) {
      _listeners[key].forEach(cb => cb(value))
    }
  },

  /** Merge an object into state */
  merge(obj) {
    for (const [k, v] of Object.entries(obj)) {
      this.set(k, v)
    }
  },

  /** Subscribe to a key change */
  subscribe(key, cb) {
    if (!_listeners[key]) _listeners[key] = []
    _listeners[key].push(cb)
    // Return unsubscribe fn
    return () => {
      _listeners[key] = _listeners[key].filter(fn => fn !== cb)
    }
  },

  /** Derived: get drivers only */
  getDrivers() {
    return (_state.allPersonnel || []).filter(p => p.role === 'Driver')
  },

  /** Derived: get next race schedule */
  getNextRace() {
    const now = _state.gameState?.currentRound ?? 0
    return (_state.allSchedules || [])
      .filter(s => s.season_id === '2026')
      .sort((a, b) => a.round - b.round)
      .find(s => s.round > now) ?? null
  },

  /** Derived: get circuit for a schedule */
  getCircuitFor(scheduleId) {
    const sched = (_state.allSchedules || []).find(s => s.id === scheduleId)
    if (!sched) return null
    return (_state.allCircuits || []).find(c => c.id === sched.circuit_id) ?? null
  },
}
