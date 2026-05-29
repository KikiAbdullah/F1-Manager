const Utils = {
  // === SIMULATION SCALE (Point #16) ===
  // 1 stat point = X seconds per lap - standardized formula scale
  SCALE: {
    aero: 0.012,
    driver: 0.008,
    setup: 0.004,
    tyre_temp: 0.020,
    car_performance: 0.010,
    weather_penalty: 0.015,
    dirty_air: 0.025,
    ers_boost: 0.003,
  },

  // === F1 POINTS SYSTEM ===
  POINTS_TABLE: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
  FASTEST_LAP_POINT: 1,

  // === TYRE COMPOUNDS ===
  TYRE_COMPOUNDS: {
    soft: {
      name: "Soft", color: "#ff0000", code: "S",
      grip: 1.06, durability: 0.65, optimal_temp: 100, cliff_point: 35,
      warm_up: 2, rain_grip: 0.30,
    },
    medium: {
      name: "Medium", color: "#ffd700", code: "M",
      grip: 1.00, durability: 1.00, optimal_temp: 95, cliff_point: 25,
      warm_up: 3, rain_grip: 0.25,
    },
    hard: {
      name: "Hard", color: "#ffffff", code: "H",
      grip: 0.94, durability: 1.40, optimal_temp: 90, cliff_point: 18,
      warm_up: 5, rain_grip: 0.20,
    },
    intermediate: {
      name: "Inter", color: "#00cc00", code: "I",
      grip: 0.82, durability: 1.10, optimal_temp: 55, cliff_point: 30,
      warm_up: 2, rain_grip: 0.90,
    },
    wet: {
      name: "Wet", color: "#0088ff", code: "W",
      grip: 0.70, durability: 1.30, optimal_temp: 45, cliff_point: 25,
      warm_up: 1, rain_grip: 1.00,
    },
  },

  // === ERS MODES ===
  ERS_MODES: {
    deploy: { name: "DEPLOY", speed_boost: 0.035, drain_rate: 0.8, harvest: 0.05 },
    balanced: { name: "BALANCED", speed_boost: 0.015, drain_rate: 0.35, harvest: 0.30 },
    harvest: { name: "HARVEST", speed_boost: -0.005, drain_rate: 0.0, harvest: 0.65 },
    overtake: { name: "OVERTAKE", speed_boost: 0.06, drain_rate: 1.5, harvest: 0.0 },
    none: { name: "OFF", speed_boost: 0, drain_rate: 0, harvest: 0 },
  },

  // === DRIVER TRAITS (Point #6) ===
  TRAIT_DEFS: {
    tyre_whisperer: { stat: "smoothness", threshold: 90, desc: "Exceptional tyre management" },
    rain_master: { stat: "adaptability", threshold: 92, desc: "Excels in wet conditions" },
    late_braker: { stat: "braking", threshold: 92, desc: "Gains time in braking zones" },
    qualifying_specialist: { stat: "accuracy", threshold: 93, desc: "One-lap pace master" },
    aggressive_defender: { stat: "defending", threshold: 91, desc: "Hard to overtake" },
    overtaking_machine: { stat: "overtaking", threshold: 92, desc: "Finds gaps others can't" },
    consistency_king: { stat: "control", threshold: 90, desc: "Rarely makes mistakes" },
    rookie_fire: { stat: "reactiveness", threshold: 82, desc: "Unpredictable bursts of pace" },
  },

  // === SAFETY CAR STATES ===
  SC_STATES: { NONE: "none", VSC: "vsc", SC: "safety_car", RED_FLAG: "red_flag" },

  // === BASIC HELPERS ===
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  rand(min, max) {
    return min + Math.random() * (max - min);
  },

  randInt(min, max) {
    return Math.floor(this.rand(min, max + 1));
  },

  avg(values) {
    let sum = 0, count = 0;
    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      if (typeof val === "number" && !Number.isNaN(val)) { sum += val; count++; }
    }
    return count > 0 ? sum / count : 75;
  },

  weightedAvg(values, weights) {
    let sum = 0, wSum = 0;
    for (let i = 0; i < values.length; i++) {
      const v = values[i], w = weights[i] || 1;
      if (typeof v === "number" && !Number.isNaN(v)) { sum += v * w; wSum += w; }
    }
    return wSum > 0 ? sum / wSum : 75;
  },

  formatRaceTime(timeInSeconds) {
    if (timeInSeconds >= 99990) return "DNF";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const ms = Math.floor((timeInSeconds % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  },

  formatGap(gap) {
    if (gap < 0.001) return "LEADER";
    if (gap > 60) return `+${Math.floor(gap / 60)}LAP`;
    return `+${gap.toFixed(3)}s`;
  },

  // Derive driver traits from stats
  getDriverTraits(driverStats) {
    const traits = [];
    for (const [traitId, def] of Object.entries(this.TRAIT_DEFS)) {
      if (driverStats[def.stat] >= def.threshold) {
        traits.push(traitId);
      }
    }
    return traits;
  },

  // Setup compatibility (Point #2)
  calculateSetupMatch(setup, driverPrefs, trackChars) {
    if (!setup || !driverPrefs) return 0.5;
    let match = 0, count = 0;
    const compare = (setupVal, prefVal) => {
      const diff = Math.abs((setupVal || 50) - (prefVal || 50));
      return 1 - diff / 100;
    };
    match += compare(setup.front_wing, driverPrefs.front_wing); count++;
    match += compare(setup.rear_wing, driverPrefs.rear_wing); count++;
    match += compare(setup.suspension, driverPrefs.suspension); count++;
    match += compare(setup.brake_bias, driverPrefs.brake_bias); count++;
    return count > 0 ? match / count : 0.5;
  },
};
