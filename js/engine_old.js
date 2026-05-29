const Engine = {
  currentGrid: [],
  weather: "Cerah",
  currentCircuit: null,
  activeRound: null,

  // Konfigurasi Utama Simulasi Engine
  sim: {
    ctx: null,
    isRunning: false,
    simSpeed: 1,
    currentLap: 0, // Start from 0, increment on first lap start
    targetLaps: 1, // Default, will be set per session
    mode: "FP", // FP, Q, RACE
    trackPoints: [],
    animationId: null,
    playerDrivingStyle: "stable", // Default for player
    trackEvolution: 1,
    weatherGrip: 1,
    weatherLabel: "Cerah",
    stage: null,
    trackPointsCircuitId: null, // Track the circuit ID for generated trackPoints
  },

  getCircuitData(circuitId) {
    const circuitBase = Data.circuits.data.find(
      (circuit) => circuit.id === circuitId
    );
    if (!circuitBase) {
      console.warn(`Circuit base data not found for ID: ${circuitId}`);
      return null;
    }
    const scheduleEntry = Data.schedules.data.find(
      (s) => s.circuit_id === circuitId && s.type === "race_weekend"
    );
    if (!scheduleEntry) {
      console.warn(
        `Schedule entry not found for circuit ID: ${circuitId}. Using circuit base data only.`
      );
      return circuitBase;
    }

    // Combine circuit base data with schedule-specific data
    // Prioritize scheduleEntry data for common fields, but ensure game_stats are merged
    const mergedData = {
      ...circuitBase,
      ...scheduleEntry,
      game_stats: {
        ...(circuitBase.game_stats || {}),
        track_evolution: scheduleEntry.track_characteristics.track_evolution,
        tyre_wear: scheduleEntry.track_characteristics.tyre_degradation,
        fuel_consumption: scheduleEntry.track_characteristics.fuel_consumption,
        engine_stress: scheduleEntry.track_characteristics.engine_stress,
        brake_stress: scheduleEntry.track_characteristics.braking_importance, // Using braking_importance as proxy
        overtaking: scheduleEntry.track_characteristics.overtaking_difficulty,
        safety_car_chance:
          scheduleEntry.track_characteristics.safety_car_probability,
        rain_chance:
          scheduleEntry.track_characteristics.wet_weather_variability,
        pit_loss_seconds:
          scheduleEntry.track_characteristics.pit_lane_loss_seconds,
        ai_difficulty_modifier: circuitBase.game_stats.ai_difficulty_modifier,
        recommended_strategy: circuitBase.game_stats.recommended_strategy,
        driving_style: circuitBase.game_stats.driving_style,
        setup: {
          downforce:
            scheduleEntry.track_characteristics.aero_efficiency_importance,
          top_speed: scheduleEntry.track_characteristics.top_speed_importance,
          traction: scheduleEntry.track_characteristics.traction_importance,
          kerb_riding:
            scheduleEntry.track_characteristics.ride_height_sensitivity,
        },
      },
    };

    return mergedData;
  },

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  rand(min, max) {
    return min + Math.random() * (max - min);
  },

  avg(values) {
    const filtered = values.filter(
      (value) => typeof value === "number" && !Number.isNaN(value)
    );
    return filtered.length
      ? filtered.reduce((sum, value) => sum + value, 0) / filtered.length
      : 75;
  },

  getWeekendData(round = State.currentRound) {
    if (!State.raceWeekends) State.raceWeekends = {};
    if (!State.raceWeekends[round]) {
      State.raceWeekends[round] = {
        round,
        fp: null,
        q1: null,
        q2: null,
        qualifyingGrid: null,
        qualifyingComplete: false,
        race: null,
      };
    }
    return State.raceWeekends[round];
  },

  saveGame() {
    localStorage.setItem("f1_manager_save.json", JSON.stringify(State));
  },

  addCommentary(text) {
    const el = document.getElementById("race-commentary");
    if (el) el.innerText = text;
  },

  // Koordinat Sirkuit Default (Bahrain) - Fallback
  defaultKeyPoints: [
    {
      x: 650,
      y: 500,
      type: "straight",
      zone: "Main Straight",
      sector: 3,
      targetSpeed: 310,
    }, // Start-Finish
    {
      x: 350,
      y: 500,
      type: "straight",
      zone: "Main Straight",
      sector: 3,
      targetSpeed: 330,
    },
    {
      x: 140,
      y: 500,
      type: "corner",
      zone: "Turn 1 (Hairpin)",
      sector: 1,
      targetSpeed: 82,
    },
    {
      x: 175,
      y: 440,
      type: "corner",
      zone: "Turn 2-3",
      sector: 1,
      targetSpeed: 135,
    },
    {
      x: 155,
      y: 390,
      type: "straight",
      zone: "Sector 1 Straight",
      sector: 1,
      targetSpeed: 295,
    },
    {
      x: 185,
      y: 70,
      type: "corner",
      zone: "Turn 4",
      sector: 1,
      targetSpeed: 110,
    },
    {
      x: 320,
      y: 150,
      type: "corner",
      zone: "Turn 5-6",
      sector: 2,
      targetSpeed: 175,
    },
    {
      x: 370,
      y: 175,
      type: "corner",
      zone: "Turn 7",
      sector: 2,
      targetSpeed: 155,
    },
    {
      x: 345,
      y: 220,
      type: "straight",
      zone: "Downhill Straight",
      sector: 2,
      targetSpeed: 245,
    },
    {
      x: 480,
      y: 340,
      type: "corner",
      zone: "Turn 8 (Hairpin)",
      sector: 2,
      targetSpeed: 88,
    },
    {
      x: 270,
      y: 315,
      type: "corner",
      zone: "Turn 9",
      sector: 2,
      targetSpeed: 125,
    },
    {
      x: 215,
      y: 375,
      type: "straight",
      zone: "Sector 2 Straight",
      sector: 2,
      targetSpeed: 295,
    },
    {
      x: 630,
      y: 395,
      type: "corner",
      zone: "Turn 11",
      sector: 2,
      targetSpeed: 165,
    },
    {
      x: 540,
      y: 220,
      type: "corner",
      zone: "Turn 12",
      sector: 3,
      targetSpeed: 205,
    },
    {
      x: 600,
      y: 70,
      type: "corner",
      zone: "Turn 13",
      sector: 3,
      targetSpeed: 135,
    },
    {
      x: 830,
      y: 460,
      type: "corner",
      zone: "Turn 14",
      sector: 3,
      targetSpeed: 115,
    },
    {
      x: 800,
      y: 500,
      type: "straight",
      zone: "Main Straight",
      sector: 3,
      targetSpeed: 265,
    },
  ],

  getTrackKeyPoints(circuitId) {
    const trackLayouts = {
      bahrain: [
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 310,
        },
        {
          x: 350,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 330,
        },
        {
          x: 140,
          y: 500,
          type: "corner",
          zone: "Turn 1 (Hairpin)",
          sector: 1,
          targetSpeed: 82,
        },
        {
          x: 175,
          y: 440,
          type: "corner",
          zone: "Turn 2-3",
          sector: 1,
          targetSpeed: 135,
        },
        {
          x: 155,
          y: 390,
          type: "straight",
          zone: "Sector 1 Straight",
          sector: 1,
          targetSpeed: 295,
        },
        {
          x: 185,
          y: 70,
          type: "corner",
          zone: "Turn 4",
          sector: 1,
          targetSpeed: 110,
        },
        {
          x: 320,
          y: 150,
          type: "corner",
          zone: "Turn 5-6",
          sector: 2,
          targetSpeed: 175,
        },
        {
          x: 370,
          y: 175,
          type: "corner",
          zone: "Turn 7",
          sector: 2,
          targetSpeed: 155,
        },
        {
          x: 345,
          y: 220,
          type: "straight",
          zone: "Downhill Straight",
          sector: 2,
          targetSpeed: 245,
        },
        {
          x: 480,
          y: 340,
          type: "corner",
          zone: "Turn 8 (Hairpin)",
          sector: 2,
          targetSpeed: 88,
        },
        {
          x: 270,
          y: 315,
          type: "corner",
          zone: "Turn 9",
          sector: 2,
          targetSpeed: 125,
        },
        {
          x: 215,
          y: 375,
          type: "straight",
          zone: "Sector 2 Straight",
          sector: 2,
          targetSpeed: 295,
        },
        {
          x: 630,
          y: 395,
          type: "corner",
          zone: "Turn 11",
          sector: 2,
          targetSpeed: 165,
        },
        {
          x: 540,
          y: 220,
          type: "corner",
          zone: "Turn 12",
          sector: 3,
          targetSpeed: 205,
        },
        {
          x: 600,
          y: 70,
          type: "corner",
          zone: "Turn 13",
          sector: 3,
          targetSpeed: 135,
        },
        {
          x: 830,
          y: 460,
          type: "corner",
          zone: "Turn 14",
          sector: 3,
          targetSpeed: 115,
        },
        {
          x: 800,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 265,
        },
      ],
      albert_park: [
        // Albert Park, Australia
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 300,
        },
        {
          x: 300,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 315,
        },
        {
          x: 150,
          y: 480,
          type: "corner",
          zone: "Turn 1",
          sector: 1,
          targetSpeed: 120,
        },
        {
          x: 100,
          y: 400,
          type: "corner",
          zone: "Turn 2",
          sector: 1,
          targetSpeed: 150,
        },
        {
          x: 120,
          y: 300,
          type: "straight",
          zone: "Straight",
          sector: 1,
          targetSpeed: 280,
        },
        {
          x: 250,
          y: 100,
          type: "corner",
          zone: "Turn 3-4",
          sector: 1,
          targetSpeed: 220,
        },
        {
          x: 400,
          y: 100,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 290,
        },
        {
          x: 550,
          y: 150,
          type: "corner",
          zone: "Turn 6",
          sector: 2,
          targetSpeed: 180,
        },
        {
          x: 600,
          y: 250,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 270,
        },
        {
          x: 700,
          y: 350,
          type: "corner",
          zone: "Turn 9-10",
          sector: 3,
          targetSpeed: 100,
        },
        {
          x: 650,
          y: 450,
          type: "straight",
          zone: "Straight",
          sector: 3,
          targetSpeed: 295,
        },
        {
          x: 500,
          y: 480,
          type: "corner",
          zone: "Turn 11",
          sector: 3,
          targetSpeed: 160,
        },
        {
          x: 400,
          y: 450,
          type: "corner",
          zone: "Turn 12",
          sector: 3,
          targetSpeed: 180,
        },
      ],
      shanghai: [
        // Shanghai, China
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 320,
        },
        {
          x: 350,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 335,
        },
        {
          x: 150,
          y: 480,
          type: "corner",
          zone: "Turn 1-2",
          sector: 1,
          targetSpeed: 80,
        },
        {
          x: 100,
          y: 200,
          type: "corner",
          zone: "Turn 3",
          sector: 1,
          targetSpeed: 140,
        },
        {
          x: 200,
          y: 100,
          type: "straight",
          zone: "Straight",
          sector: 1,
          targetSpeed: 290,
        },
        {
          x: 400,
          y: 100,
          type: "corner",
          zone: "Turn 6",
          sector: 2,
          targetSpeed: 160,
        },
        {
          x: 500,
          y: 200,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 270,
        },
        {
          x: 550,
          y: 350,
          type: "corner",
          zone: "Turn 7-8",
          sector: 2,
          targetSpeed: 100,
        },
        {
          x: 400,
          y: 400,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 310,
        },
        {
          x: 200,
          y: 450,
          type: "corner",
          zone: "Turn 11",
          sector: 3,
          targetSpeed: 130,
        },
        {
          x: 180,
          y: 500,
          type: "straight",
          zone: "Straight",
          sector: 3,
          targetSpeed: 300,
        },
      ],
      suzuka: [
        // Suzuka, Japan
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 300,
        },
        {
          x: 350,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 320,
        },
        {
          x: 150,
          y: 480,
          type: "corner",
          zone: "Turn 1-2",
          sector: 1,
          targetSpeed: 200,
        },
        {
          x: 200,
          y: 200,
          type: "corner",
          zone: "Turn 3-6",
          sector: 1,
          targetSpeed: 180,
        },
        {
          x: 400,
          y: 100,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 280,
        },
        {
          x: 550,
          y: 150,
          type: "corner",
          zone: "Turn 7-8",
          sector: 2,
          targetSpeed: 160,
        },
        {
          x: 600,
          y: 350,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 290,
        },
        {
          x: 400,
          y: 450,
          type: "corner",
          zone: "Spoon Curve",
          sector: 3,
          targetSpeed: 140,
        },
        {
          x: 200,
          y: 400,
          type: "straight",
          zone: "130R",
          sector: 3,
          targetSpeed: 300,
        },
        {
          x: 180,
          y: 500,
          type: "corner",
          zone: "Chicane",
          sector: 3,
          targetSpeed: 80,
        },
      ],
      jeddah: [
        // Jeddah, Saudi Arabia
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 310,
        },
        {
          x: 350,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 325,
        },
        {
          x: 150,
          y: 480,
          type: "corner",
          zone: "Esses",
          sector: 1,
          targetSpeed: 250,
        },
        {
          x: 100,
          y: 200,
          type: "corner",
          zone: "Turns 4-10",
          sector: 1,
          targetSpeed: 200,
        },
        {
          x: 200,
          y: 100,
          type: "straight",
          zone: "Straight",
          sector: 1,
          targetSpeed: 300,
        },
        {
          x: 400,
          y: 100,
          type: "corner",
          zone: "Turns 13-15",
          sector: 2,
          targetSpeed: 180,
        },
        {
          x: 500,
          y: 200,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 310,
        },
        {
          x: 550,
          y: 350,
          type: "corner",
          zone: "Turns 20-22",
          sector: 2,
          targetSpeed: 120,
        },
        {
          x: 400,
          y: 400,
          type: "straight",
          zone: "Straight",
          sector: 3,
          targetSpeed: 320,
        },
        {
          x: 200,
          y: 450,
          type: "corner",
          zone: "Turn 27",
          sector: 3,
          targetSpeed: 90,
        },
        {
          x: 180,
          y: 500,
          type: "straight",
          zone: "Start-Finish",
          sector: 3,
          targetSpeed: 300,
        },
      ],
      miami: [
        // Miami, USA
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 305,
        },
        {
          x: 350,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 320,
        },
        {
          x: 150,
          y: 480,
          type: "corner",
          zone: "Turn 1",
          sector: 1,
          targetSpeed: 100,
        },
        {
          x: 100,
          y: 300,
          type: "straight",
          zone: "Straight",
          sector: 1,
          targetSpeed: 270,
        },
        {
          x: 200,
          y: 100,
          type: "corner",
          zone: "Turns 4-5",
          sector: 1,
          targetSpeed: 150,
        },
        {
          x: 400,
          y: 100,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 290,
        },
        {
          x: 550,
          y: 150,
          type: "corner",
          zone: "Turn 11",
          sector: 2,
          targetSpeed: 120,
        },
        {
          x: 600,
          y: 350,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 310,
        },
        {
          x: 400,
          y: 450,
          type: "corner",
          zone: "Turns 14-15",
          sector: 3,
          targetSpeed: 80,
        },
        {
          x: 200,
          y: 400,
          type: "straight",
          zone: "Straight",
          sector: 3,
          targetSpeed: 280,
        },
        {
          x: 180,
          y: 500,
          type: "corner",
          zone: "Turn 16",
          sector: 3,
          targetSpeed: 100,
        },
      ],
      monaco: [
        // Monaco
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Start-Finish",
          sector: 3,
          targetSpeed: 280,
        },
        {
          x: 350,
          y: 500,
          type: "straight",
          zone: "Start-Finish",
          sector: 3,
          targetSpeed: 295,
        },
        {
          x: 150,
          y: 480,
          type: "corner",
          zone: "Sainte Devote",
          sector: 1,
          targetSpeed: 100,
        },
        {
          x: 100,
          y: 400,
          type: "corner",
          zone: "Massenet",
          sector: 1,
          targetSpeed: 120,
        },
        {
          x: 120,
          y: 300,
          type: "corner",
          zone: "Casino Square",
          sector: 1,
          targetSpeed: 110,
        },
        {
          x: 250,
          y: 100,
          type: "corner",
          zone: "Mirabeau",
          sector: 1,
          targetSpeed: 80,
        },
        {
          x: 400,
          y: 100,
          type: "corner",
          zone: "Loews Hairpin",
          sector: 2,
          targetSpeed: 50,
        },
        {
          x: 550,
          y: 150,
          type: "corner",
          zone: "Portier",
          sector: 2,
          targetSpeed: 100,
        },
        {
          x: 600,
          y: 250,
          type: "straight",
          zone: "Tunnel",
          sector: 2,
          targetSpeed: 300,
        },
        {
          x: 700,
          y: 350,
          type: "corner",
          zone: "Nouvelle Chicane",
          sector: 3,
          targetSpeed: 80,
        },
        {
          x: 650,
          y: 450,
          type: "corner",
          zone: "Tabac",
          sector: 3,
          targetSpeed: 140,
        },
        {
          x: 500,
          y: 480,
          type: "corner",
          zone: "Swimming Pool",
          sector: 3,
          targetSpeed: 180,
        },
      ],
      silverstone: [
        // Silverstone, UK
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 300,
        },
        {
          x: 350,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 320,
        },
        {
          x: 150,
          y: 480,
          type: "corner",
          zone: "Abbey",
          sector: 1,
          targetSpeed: 260,
        },
        {
          x: 100,
          y: 300,
          type: "corner",
          zone: "Copse",
          sector: 1,
          targetSpeed: 280,
        },
        {
          x: 200,
          y: 100,
          type: "straight",
          zone: "Hangar Straight",
          sector: 1,
          targetSpeed: 315,
        },
        {
          x: 400,
          y: 100,
          type: "corner",
          zone: "Stowe",
          sector: 2,
          targetSpeed: 220,
        },
        {
          x: 500,
          y: 200,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 300,
        },
        {
          x: 550,
          y: 350,
          type: "corner",
          zone: "Maggotts-Becketts",
          sector: 2,
          targetSpeed: 270,
        },
        {
          x: 400,
          y: 400,
          type: "straight",
          zone: "Wellington Straight",
          sector: 3,
          targetSpeed: 310,
        },
        {
          x: 200,
          y: 450,
          type: "corner",
          zone: "Vale-Club",
          sector: 3,
          targetSpeed: 100,
        },
      ],
      spa: [
        // Spa-Francorchamps, Belgium
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Start-Finish Straight",
          sector: 3,
          targetSpeed: 310,
        },
        {
          x: 350,
          y: 500,
          type: "straight",
          zone: "Raidillon",
          sector: 1,
          targetSpeed: 320,
        },
        {
          x: 150,
          y: 400,
          type: "corner",
          zone: "Eau Rouge",
          sector: 1,
          targetSpeed: 280,
        },
        {
          x: 100,
          y: 100,
          type: "straight",
          zone: "Kemmel Straight",
          sector: 1,
          targetSpeed: 330,
        },
        {
          x: 300,
          y: 50,
          type: "corner",
          zone: "Les Combes",
          sector: 1,
          targetSpeed: 180,
        },
        {
          x: 500,
          y: 100,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 290,
        },
        {
          x: 600,
          y: 250,
          type: "corner",
          zone: "Pouhon",
          sector: 2,
          targetSpeed: 250,
        },
        {
          x: 700,
          y: 350,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 270,
        },
        {
          x: 650,
          y: 450,
          type: "corner",
          zone: "Blanchimont",
          sector: 3,
          targetSpeed: 300,
        },
        {
          x: 500,
          y: 480,
          type: "corner",
          zone: "Bus Stop Chicane",
          sector: 3,
          targetSpeed: 80,
        },
      ],
      hungaroring: [
        // Hungaroring, Hungary
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 290,
        },
        {
          x: 350,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 300,
        },
        {
          x: 150,
          y: 480,
          type: "corner",
          zone: "Turn 1",
          sector: 1,
          targetSpeed: 100,
        },
        {
          x: 100,
          y: 300,
          type: "corner",
          zone: "Turns 2-3",
          sector: 1,
          targetSpeed: 140,
        },
        {
          x: 200,
          y: 100,
          type: "straight",
          zone: "Straight",
          sector: 1,
          targetSpeed: 250,
        },
        {
          x: 400,
          y: 100,
          type: "corner",
          zone: "Turns 4-7",
          sector: 2,
          targetSpeed: 120,
        },
        {
          x: 500,
          y: 200,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 260,
        },
        {
          x: 550,
          y: 350,
          type: "corner",
          zone: "Turns 8-11",
          sector: 2,
          targetSpeed: 100,
        },
        {
          x: 400,
          y: 400,
          type: "straight",
          zone: "Straight",
          sector: 3,
          targetSpeed: 270,
        },
        {
          x: 200,
          y: 450,
          type: "corner",
          zone: "Turns 12-14",
          sector: 3,
          targetSpeed: 90,
        },
      ],
      zandvoort: [
        // Zandvoort, Netherlands
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 280,
        },
        {
          x: 350,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 295,
        },
        {
          x: 150,
          y: 480,
          type: "corner",
          zone: "Tarzanbocht",
          sector: 1,
          targetSpeed: 100,
        },
        {
          x: 100,
          y: 300,
          type: "corner",
          zone: "Turns 2-4",
          sector: 1,
          targetSpeed: 150,
        },
        {
          x: 200,
          y: 100,
          type: "straight",
          zone: "Straight",
          sector: 1,
          targetSpeed: 260,
        },
        {
          x: 400,
          y: 100,
          type: "corner",
          zone: "Hugenholtzbocht",
          sector: 2,
          targetSpeed: 130,
        },
        {
          x: 500,
          y: 200,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 270,
        },
        {
          x: 550,
          y: 350,
          type: "corner",
          zone: "Scheivlak",
          sector: 2,
          targetSpeed: 200,
        },
        {
          x: 400,
          y: 400,
          type: "straight",
          zone: "Straight",
          sector: 3,
          targetSpeed: 285,
        },
        {
          x: 200,
          y: 450,
          type: "corner",
          zone: "Arie Luyendyk",
          sector: 3,
          targetSpeed: 250,
        },
      ],
      monza: [
        // Monza, Italy
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 340,
        },
        {
          x: 350,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 350,
        },
        {
          x: 150,
          y: 480,
          type: "corner",
          zone: "Variante del Rettifilo",
          sector: 1,
          targetSpeed: 80,
        },
        {
          x: 100,
          y: 300,
          type: "straight",
          zone: "Curva Grande",
          sector: 1,
          targetSpeed: 280,
        },
        {
          x: 200,
          y: 100,
          type: "corner",
          zone: "Variante della Roggia",
          sector: 1,
          targetSpeed: 120,
        },
        {
          x: 400,
          y: 100,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 330,
        },
        {
          x: 500,
          y: 200,
          type: "corner",
          zone: "Lesmo 1",
          sector: 2,
          targetSpeed: 180,
        },
        {
          x: 550,
          y: 350,
          type: "corner",
          zone: "Lesmo 2",
          sector: 2,
          targetSpeed: 160,
        },
        {
          x: 400,
          y: 400,
          type: "straight",
          zone: "Straight",
          sector: 3,
          targetSpeed: 320,
        },
        {
          x: 200,
          y: 450,
          type: "corner",
          zone: "Variante Ascari",
          sector: 3,
          targetSpeed: 150,
        },
      ],
      marina_bay: [
        // Marina Bay, Singapore
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 280,
        },
        {
          x: 350,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 290,
        },
        {
          x: 150,
          y: 480,
          type: "corner",
          zone: "Turn 1",
          sector: 1,
          targetSpeed: 100,
        },
        {
          x: 100,
          y: 300,
          type: "corner",
          zone: "Turns 2-3",
          sector: 1,
          targetSpeed: 120,
        },
        {
          x: 200,
          y: 100,
          type: "straight",
          zone: "Straight",
          sector: 1,
          targetSpeed: 250,
        },
        {
          x: 400,
          y: 100,
          type: "corner",
          zone: "Turns 5-7",
          sector: 2,
          targetSpeed: 90,
        },
        {
          x: 500,
          y: 200,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 260,
        },
        {
          x: 550,
          y: 350,
          type: "corner",
          zone: "Turns 10-13",
          sector: 2,
          targetSpeed: 80,
        },
        {
          x: 400,
          y: 400,
          type: "straight",
          zone: "Straight",
          sector: 3,
          targetSpeed: 270,
        },
        {
          x: 200,
          y: 450,
          type: "corner",
          zone: "Turns 15-18",
          sector: 3,
          targetSpeed: 110,
        },
      ],
      red_bull_ring: [
        // Red Bull Ring, Austria
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 300,
        },
        {
          x: 350,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 310,
        },
        {
          x: 150,
          y: 480,
          type: "corner",
          zone: "Turn 1",
          sector: 1,
          targetSpeed: 100,
        },
        {
          x: 100,
          y: 300,
          type: "straight",
          zone: "Straight",
          sector: 1,
          targetSpeed: 280,
        },
        {
          x: 200,
          y: 100,
          type: "corner",
          zone: "Turn 3",
          sector: 1,
          targetSpeed: 120,
        },
        {
          x: 400,
          y: 100,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 290,
        },
        {
          x: 500,
          y: 200,
          type: "corner",
          zone: "Turn 4",
          sector: 2,
          targetSpeed: 150,
        },
        {
          x: 550,
          y: 350,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 300,
        },
        {
          x: 400,
          y: 400,
          type: "corner",
          zone: "Turn 6",
          sector: 3,
          targetSpeed: 180,
        },
        {
          x: 200,
          y: 450,
          type: "straight",
          zone: "Straight",
          sector: 3,
          targetSpeed: 270,
        },
      ],
      las_vegas: [
        // Las Vegas, USA
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 330,
        },
        {
          x: 350,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 340,
        },
        {
          x: 150,
          y: 480,
          type: "corner",
          zone: "Turn 1",
          sector: 1,
          targetSpeed: 90,
        },
        {
          x: 100,
          y: 300,
          type: "straight",
          zone: "Straight",
          sector: 1,
          targetSpeed: 300,
        },
        {
          x: 200,
          y: 100,
          type: "corner",
          zone: "Turns 5-6",
          sector: 1,
          targetSpeed: 110,
        },
        {
          x: 400,
          y: 100,
          type: "straight",
          zone: "Strip",
          sector: 2,
          targetSpeed: 350,
        },
        {
          x: 500,
          y: 200,
          type: "corner",
          zone: "Turns 11-12",
          sector: 2,
          targetSpeed: 100,
        },
        {
          x: 550,
          y: 350,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 320,
        },
        {
          x: 400,
          y: 400,
          type: "corner",
          zone: "Turns 14-15",
          sector: 3,
          targetSpeed: 120,
        },
        {
          x: 200,
          y: 450,
          type: "straight",
          zone: "Straight",
          sector: 3,
          targetSpeed: 310,
        },
      ],
      lusail: [
        // Lusail, Qatar
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 320,
        },
        {
          x: 350,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 330,
        },
        {
          x: 150,
          y: 480,
          type: "corner",
          zone: "Turn 1",
          sector: 1,
          targetSpeed: 100,
        },
        {
          x: 100,
          y: 300,
          type: "corner",
          zone: "Turns 2-4",
          sector: 1,
          targetSpeed: 150,
        },
        {
          x: 200,
          y: 100,
          type: "straight",
          zone: "Straight",
          sector: 1,
          targetSpeed: 290,
        },
        {
          x: 400,
          y: 100,
          type: "corner",
          zone: "Turns 6-8",
          sector: 2,
          targetSpeed: 180,
        },
        {
          x: 500,
          y: 200,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 300,
        },
        {
          x: 550,
          y: 350,
          type: "corner",
          zone: "Turns 12-14",
          sector: 2,
          targetSpeed: 120,
        },
        {
          x: 400,
          y: 400,
          type: "straight",
          zone: "Straight",
          sector: 3,
          targetSpeed: 310,
        },
        {
          x: 200,
          y: 450,
          type: "corner",
          zone: "Turn 16",
          sector: 3,
          targetSpeed: 110,
        },
      ],
      yas_marina: [
        // Yas Marina, Abu Dhabi
        {
          x: 650,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 300,
        },
        {
          x: 350,
          y: 500,
          type: "straight",
          zone: "Main Straight",
          sector: 3,
          targetSpeed: 315,
        },
        {
          x: 150,
          y: 480,
          type: "corner",
          zone: "Turns 1-4",
          sector: 1,
          targetSpeed: 150,
        },
        {
          x: 100,
          y: 300,
          type: "straight",
          zone: "Straight",
          sector: 1,
          targetSpeed: 280,
        },
        {
          x: 200,
          y: 100,
          type: "corner",
          zone: "Turns 5-6",
          sector: 1,
          targetSpeed: 180,
        },
        {
          x: 400,
          y: 100,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 290,
        },
        {
          x: 500,
          y: 200,
          type: "corner",
          zone: "Turns 9-11",
          sector: 2,
          targetSpeed: 120,
        },
        {
          x: 550,
          y: 350,
          type: "straight",
          zone: "Straight",
          sector: 2,
          targetSpeed: 270,
        },
        {
          x: 400,
          y: 400,
          type: "corner",
          zone: "Turns 13-15",
          sector: 3,
          targetSpeed: 100,
        },
        {
          x: 200,
          y: 450,
          type: "straight",
          zone: "Straight",
          sector: 3,
          targetSpeed: 260,
        },
      ],
    };
    return trackLayouts[circuitId] || this.defaultKeyPoints;
  },

  generateTrackPoints(keyPoints) {
    let points = [];
    for (let i = 0; i < keyPoints.length; i++) {
      let p1 = keyPoints[i];
      let p2 = keyPoints[(i + 1) % keyPoints.length];
      let steps = p1.type === "corner" ? 250 : 450;
      for (let s = 0; s < steps; s++) {
        let t = s / steps;
        points.push({
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t,
          speed: p1.targetSpeed + (p2.targetSpeed - p1.targetSpeed) * t,
          zone: p1.zone,
          sector: p1.sector,
        });
      }
    }
    return points;
  },

  initTrack() {
    if (
      this.sim.trackPoints.length > 0 &&
      this.sim.trackPointsCircuitId === this.currentCircuit.id
    )
      return; // Only re-initialize if circuit changes

    const circuitId = this.currentCircuit ? this.currentCircuit.id : "bahrain";
    const trackKeyPoints = this.getTrackKeyPoints(circuitId);

    if (trackKeyPoints && trackKeyPoints.length > 0) {
      this.sim.trackPoints = this.generateTrackPoints(trackKeyPoints);
      this.sim.trackPointsCircuitId = circuitId; // Store the circuit ID for which track points were generated
    } else {
      // Fallback to default if no specific layout is found
      this.sim.trackPoints = this.generateTrackPoints(this.defaultKeyPoints);
      this.sim.trackPointsCircuitId = "default";
    }
  },

  buildRacer(driver, car, staff, isPlayer, color) {
    const d = driver.stats || {};
    const pu = car.pu || Data.power_units[0];
    const chassis = car.chassis || Data.chassis[0];
    const puStats = pu.stats || {};
    const chassisStats = chassis.stats || {};
    const aero = chassisStats.aerodynamics || {};
    const mechanical = chassisStats.mechanical || {};
    const perf = chassisStats.performance || {};
    const reliability = chassisStats.reliability || {};
    const teamChiefStats =
      (staff && staff.teamChief && staff.teamChief.stats) || {};
    const techChiefStats =
      (staff && staff.techChief && staff.techChief.stats) || {};
    const team = (staff && staff.team) || null;
    const teamSporting = (team && team.sporting_profile) || {};
    const teamInfra = (team && team.infrastructure) || {};
    const teamForm = (team && team.performance_state) || {};

    const driverSkill = this.avg([
      d.overall,
      d.cornering,
      d.braking,
      d.reactiveness,
      d.control,
      d.accuracy,
    ]);
    const raceCraft = this.avg([
      d.overtaking,
      d.defending,
      d.smoothness,
      d.adaptability,
    ]);
    const carPace = this.avg([
      chassisStats.overall_performance,
      puStats.overall_performance,
      aero.aero_efficiency,
      aero.high_speed_cornering,
      mechanical.traction,
      perf.top_speed,
      perf.acceleration,
    ]);
    const tyreManagement = this.avg([
      d.smoothness,
      perf.tyre_preservation,
      techChiefStats.tyre_management_design,
      teamSporting.tyre_management,
    ]);
    const fuelEfficiency = this.avg([
      perf.fuel_efficiency,
      puStats.internal_combustion &&
        puStats.internal_combustion.fuel_efficiency,
    ]);
    const ersQuality = this.avg([
      perf.ers_integration,
      puStats.hybrid_system && puStats.hybrid_system.ers_output,
      puStats.hybrid_system && puStats.hybrid_system.energy_recovery,
      puStats.hybrid_system && puStats.hybrid_system.deployment_efficiency,
    ]);
    const reliabilityScore = this.avg([
      reliability.failure_resistance,
      reliability.component_wear,
      puStats.reliability && puStats.reliability.failure_resistance,
      puStats.reliability && puStats.reliability.engine_wear,
      techChiefStats.reliability_focus,
    ]);
    const staffBoost = this.avg([
      teamChiefStats.strategy,
      teamChiefStats.pressure_management,
      teamChiefStats.driver_management,
      techChiefStats.setup_understanding,
      techChiefStats.simulator_correlation,
      techChiefStats.aerodynamics,
      teamInfra.staff_quality,
      teamInfra.simulator_level,
      teamForm.form_rating_last_5_races,
    ]);
    const totalPace =
      driverSkill * 0.34 +
      carPace * 0.38 +
      raceCraft * 0.12 +
      staffBoost * 0.1 +
      reliabilityScore * 0.06;
    return {
      id: driver.id,
      name: driver.full_name,
      code:
        driver.driver_code || driver.last_name.substring(0, 3).toUpperCase(),
      isPlayer: isPlayer,
      color: color,
      paceStat: totalPace,
      driverSkill,
      raceCraft,
      carPace,
      tyreManagement,
      fuelEfficiency,
      ersQuality,
      reliabilityScore,
      staffBoost,
      car,
      driver: driver, // Pass the full driver object for setup_preferences
      tireWear: 100, // Percentage
      fuel: 100, // Percentage
      ersCharge: 100,
      ersActive: false,
      drivingStyle: isPlayer ? "stable" : "fast", // AI defaults to fast
      isPitting: false,
      pitRequested: false,
      pitStopProgress: 0,
      pitStopDuration: 300, // frames for pit stop
      // Properti fisik untuk render kanvas mandiri
      progress: 0,
      currentSpeed: 0,
      currentLap: 0,
      totalTime: 0,
      gapText: "-",
      finished: false,
      lastLapTime: 0,
    };
  },

  startSession(mode) {
    if (this.sim.animationId) cancelAnimationFrame(this.sim.animationId);
    const sessionMode = mode === "Q1" || mode === "Q2" ? "Q" : mode;
    this.sim.stage = mode;
    this.sim.mode = sessionMode;
    this.sim.isRunning = true;
    this.sim.currentLap = 0;

    const nextContainer = document.getElementById(
      "session-next-action-container"
    );
    if (nextContainer) nextContainer.innerHTML = "";

    this.setupSessionContext();

    // Lap dibuat sedikit, tetapi progress per frame lebih lambat agar 1 lap terasa panjang.
    if (mode === "FP") this.sim.targetLaps = this.sim.targetLaps || 2;
    else if (mode === "Q1" || mode === "Q2") this.sim.targetLaps = 2;
    else if (mode === "RACE") this.sim.targetLaps = 4;

    // 1. TAMPILKAN PANEL SIMULASI
    const simArea = document.getElementById("sim-area");
    if (simArea) simArea.classList.remove("hidden");

    // 2. PERBAIKAN: Ambil canvas dengan toleransi ID (strip atau underscore)
    const canvas = document.getElementById("race-canvas");

    if (!canvas) {
      console.error(
        "[F1 Manager] Elemen <canvas> tidak ditemukan di index.html!"
      );
      alert(
        "Error: Kanvas simulasi balap tidak ditemukan. Periksa index.html Anda."
      );
      this.sim.isRunning = false;
      return;
    }

    // Ambil context 2D setelah dipastikan elemen canvas-nya ada
    this.sim.ctx = canvas.getContext("2d");

    // Initialize track points if not already done
    this.initTrack();

    // 3. JALANKAN LOGIKA GRID & SIMULASI LANJUTAN
    this.setupSessionGrid();

    // Update HUD for total laps
    const totalLapsHud = document.getElementById("hud-total-laps");
    if (totalLapsHud) totalLapsHud.innerText = this.sim.targetLaps;
    const lapHud = document.getElementById("hud-lap");
    if (lapHud) lapHud.innerText = 1;
    const sessionHud = document.getElementById("hud-session-mode");
    if (sessionHud) sessionHud.innerText = mode;
    const weatherHud = document.getElementById("hud-weather");
    if (weatherHud)
      weatherHud.innerText = `${this.weather} - ${
        this.currentCircuit ? this.currentCircuit.name : "Track"
      }`;
    const liveHud = document.getElementById("live-race-hud");
    if (liveHud) liveHud.classList.remove("hidden");
    const playBtn = document.getElementById("btn-play");
    if (playBtn) {
      playBtn.innerText = "PAUSE SIMULATION";
      playBtn.classList.add("btn-active");
    }

    // Setup player controls
    UI.updatePlayerControlsHUD();

    this.gameLoop(); // Memulai animation frame
  },

  startConfiguredSession(mode) {
    const data = this.getWeekendData(State.currentRound);
    if (mode === "FP") {
      if (data.fp) {
        UI.renderSessionResults(
          data.fp.results,
          `FP RESULTS - ${data.fp.laps} LAPS`
        );
        return;
      }
      const lapsInput = document.getElementById("input-fp-laps");
      this.sim.targetLaps = this.clamp(
        parseInt(lapsInput && lapsInput.value, 10) || 2,
        1,
        5
      );
    }

    if (mode === "Q1" && data.q1) return UI.openSessionPanel("Q");
    if (mode === "Q2" && (!data.q1 || data.q2)) return UI.openSessionPanel("Q");
    if (mode === "RACE") {
      if (data.race)
        return UI.renderSessionResults(data.race.results, "RACE RESULTS");
      if (!data.qualifyingComplete) return UI.openSessionPanel("RACE");
    }

    document.getElementById("session-results").classList.add("hidden");
    this.activeRound = State.currentRound;
    this.startSession(mode);
  },

  setupSessionContext() {
    const currentEvent = Data.schedules.find(
      (s) => s.round === State.currentRound && s.type === "race_weekend"
    );
    this.currentCircuit = currentEvent
      ? this.getCircuitData(currentEvent.circuit_id)
      : this.getCircuitData("bahrain") || Data.circuits.data[0]; // Fallback to Bahrain or first circuit

    const stats = (this.currentCircuit && this.currentCircuit.game_stats) || {};
    const trackCharacteristics =
      (this.currentCircuit && this.currentCircuit.track_characteristics) || {};
    const sectorWeights =
      (this.currentCircuit && this.currentCircuit.sector_weights) || {};

    const rainRoll = Math.random() * 100;
    const rainChance = trackCharacteristics.wet_weather_variability || 10;
    let weatherLabel = "Cerah";
    let weatherGrip = 1;

    if (rainRoll < rainChance * 0.28) {
      weatherLabel = "Hujan Lebat";
      weatherGrip = 0.78;
    } else if (rainRoll < rainChance) {
      weatherLabel = "Lintasan Basah";
      weatherGrip = 0.88;
    } else if (rainRoll < rainChance + 14) {
      weatherLabel = "Berawan";
      weatherGrip = 0.97;
    }

    const modeEvolution =
      this.sim.mode === "FP" ? 0.94 : this.sim.mode === "Q" ? 1.04 : 1;
    this.weather = weatherLabel;
    this.sim.weatherLabel = weatherLabel;
    this.sim.weatherGrip = weatherGrip;
    // Use track_evolution from trackCharacteristics
    this.sim.trackEvolution = this.clamp(
      ((trackCharacteristics.track_evolution || 75) / 100) * modeEvolution,
      0.82,
      1.08
    );
  },

  // FUNGSI BARU: Menyiapkan daftar pembalap di lintasan berdasarkan Sesi
  setupSessionGrid() {
    if (this.currentGrid.length === 0) {
      this.currentGrid = this.generateGrid();
    }

    // Reset stats for all racers at the start of a session
    this.currentGrid.forEach((driver, index) => {
      driver.progress = 0;
      driver.currentSpeed = 0;
      driver.currentLap = 0; // Start at lap 0, increment on first finish line pass
      driver.totalTime = 0;
      driver.gapText = "-";
      driver.finished = false;
      driver.eliminated = false;
      driver.tireWear = 100;
      driver.fuel = 100;
      driver.ersCharge = 100;
      driver.ersActive = false;
      driver.isPitting = false;
      driver.pitRequested = false;
      driver.pitStopProgress = 0;
      if (driver.isPlayer) {
        driver.drivingStyle = this.sim.playerDrivingStyle; // Use global player setting
      } else {
        driver.drivingStyle =
          this.sim.stage === "Q1" || this.sim.stage === "Q2"
            ? "fast"
            : this.sim.stage === "FP"
            ? "slow"
            : "stable";
      }
    });

    const weekend = this.getWeekendData(State.currentRound);
    if (this.sim.stage === "Q2" && weekend.q1) {
      const q1Ids = weekend.q1.results.slice(0, 10).map((r) => r.id);
      this.currentGrid.sort((a, b) => {
        const indexA = q1Ids.indexOf(a.id);
        const indexB = q1Ids.indexOf(b.id);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
      this.currentGrid.forEach((racer) => {
        if (!q1Ids.includes(racer.id)) {
          racer.eliminated = true;
          racer.finished = true;
          racer.totalTime = 99999;
        }
      });
    } else if (this.sim.mode === "RACE" && weekend.qualifyingGrid) {
      const qualifiedDriverIds = weekend.qualifyingGrid.map((r) => r.id);
      this.currentGrid.sort((a, b) => {
        const indexA = qualifiedDriverIds.indexOf(a.id);
        const indexB = qualifiedDriverIds.indexOf(b.id);
        return indexA - indexB;
      });
    } else {
      // For FP/Q or if no qualification results, shuffle for varied starting positions
      this.currentGrid.sort(() => Math.random() - 0.5);
    }

    this.addCommentary(this.getSessionIntroCommentary());
  },

  getSessionIntroCommentary() {
    if (this.sim.stage === "FP")
      return "FP dimulai: tim fokus mengumpulkan data setup, long run, dan tyre behaviour.";
    if (this.sim.stage === "Q1")
      return "Q1 dimulai: semua pembalap mengejar banker lap, hanya 10 tercepat lolos ke Q2.";
    if (this.sim.stage === "Q2")
      return "Q2 dimulai: top 10 bertarung menentukan pole position dan starting grid.";
    return "Race dimulai: strategi, tyre wear, pit stop, dan ERS akan menentukan hasil akhir.";
  },

  // ENGINE GAME LOOP: Mengatur Pergerakan & Render Grafis Mobil F1
  gameLoop() {
    // Jika simulasi dihentikan, keluar dari loop
    if (!this.sim.isRunning) {
      this.sim.animationId = requestAnimationFrame(() => this.gameLoop());
      return;
    }

    const totalPoints = this.sim.trackPoints.length;
    const stepsPerFrame = this.sim.simSpeed;

    // Clear canvas for this frame
    this.sim.ctx.clearRect(0, 0, 900, 550); // Using fixed canvas size now
    this.drawTrack(); // Redraw track background

    let sessionFinished = false;
    const maxLaps = this.sim.targetLaps;

    for (let step = 0; step < stepsPerFrame; step++) {
      this.currentGrid.forEach((racer) => {
        if (racer.finished || racer.currentLap > maxLaps) return;

        // Handle Pit Stop
        if (racer.isPitting) {
          racer.pitStopProgress--;
          if (racer.pitStopProgress <= 0) {
            racer.isPitting = false;
            racer.pitRequested = false;
            racer.tireWear = 100;
            racer.fuel = 100;
            if (racer.isPlayer) {
              racer.drivingStyle = this.sim.playerDrivingStyle; // Revert to player's chosen style
            }
            UI.updatePlayerControlsHUD();
          }
          // Don't move car during pit stop
          return;
        }

        let currentPoint = this.sim.trackPoints[racer.progress];
        if (!currentPoint) return; // Should not happen if trackPoints are properly initialized

        if (
          racer.pitRequested &&
          currentPoint.zone.includes("Main Straight") &&
          currentPoint.x >= 350 &&
          currentPoint.x <= 650
        ) {
          racer.isPitting = true;
          racer.pitStopProgress = racer.pitStopDuration;
          racer.currentSpeed = 0;
          racer.drivingStyle = "slow";
          racer.totalTime += this.rand(19, 24);
          this.addCommentary(
            `${racer.code} masuk pit lane. Stop berlangsung, ban dan fuel disegarkan.`
          );
          UI.updatePlayerControlsHUD();
          return;
        }

        const chassis = (racer.car && racer.car.chassis) || {};
        const chassisStats = chassis.stats || {};
        const aero = chassisStats.aerodynamics || {};
        const mechanical = chassisStats.mechanical || {};
        const perf = chassisStats.performance || {};
        const reliability = chassisStats.reliability || {};
        const puStats = (racer.car && racer.car.pu && racer.car.pu.stats) || {};

        const currentCircuit = this.currentCircuit;
        const trackCharacteristics = currentCircuit.track_characteristics || {};
        const sectorWeights = currentCircuit.sector_weights || {};
        const driverSetupPreferences = racer.driver.setup_preferences || {};

        const isCorner = currentPoint.speed < 190;

        let carMatchValue = 0;
        let trackNeedValue = 0;

        // Dynamic Car Match based on Sector Weights and Track Characteristics
        const primarySectorWeight =
          sectorWeights[`sector_${currentPoint.sector}`] || "balanced"; // Fallback to balanced

        switch (primarySectorWeight) {
          case "top_speed":
            carMatchValue = this.avg([
              perf.top_speed,
              puStats.internal_combustion &&
                puStats.internal_combustion.horsepower,
              aero.drs_efficiency,
              aero.aero_efficiency,
            ]);
            trackNeedValue = trackCharacteristics.top_speed_importance;
            break;
          case "traction":
            carMatchValue = this.avg([
              mechanical.traction,
              perf.acceleration,
              puStats.hybrid_system && puStats.hybrid_system.ers_output,
              aero.aero_efficiency,
            ]);
            trackNeedValue = trackCharacteristics.traction_importance;
            break;
          case "braking":
            carMatchValue = this.avg([
              racer.driver.stats.braking,
              chassisStats.mechanical.brake_performance,
              aero.high_speed_cornering,
            ]);
            trackNeedValue = trackCharacteristics.braking_importance;
            break;
          case "high_speed_cornering":
            carMatchValue = this.avg([
              aero.high_speed_cornering,
              aero.aero_efficiency,
              mechanical.ride_stability,
            ]);
            trackNeedValue = trackCharacteristics.high_speed_cornering;
            break;
          case "medium_speed_cornering":
            carMatchValue = this.avg([
              aero.medium_speed_cornering,
              mechanical.ride_stability,
              racer.driverSkill,
            ]);
            trackNeedValue = trackCharacteristics.medium_speed_cornering;
            break;
          case "low_speed_cornering":
            carMatchValue = this.avg([
              aero.low_speed_cornering,
              mechanical.traction,
              racer.driverSkill,
            ]);
            trackNeedValue = trackCharacteristics.low_speed_cornering;
            break;
          case "aero_balance":
            carMatchValue = this.avg([
              aero.aero_efficiency,
              aero.dirty_air_tolerance,
              aero.high_speed_cornering,
              aero.medium_speed_cornering,
            ]);
            trackNeedValue = this.avg([
              trackCharacteristics.aero_efficiency_importance,
              trackCharacteristics.dirty_air_severity,
            ]);
            break;
          case "mechanical_grip":
            carMatchValue = this.avg([
              mechanical.traction,
              mechanical.kerb_riding,
              mechanical.ride_stability,
            ]);
            trackNeedValue = this.avg([
              trackCharacteristics.track_grip,
              trackCharacteristics.track_surface_roughness,
            ]);
            break;
          case "driver_precision":
            carMatchValue = this.avg([
              racer.driverSkill,
              racer.driver.stats.accuracy,
              racer.driver.stats.control,
            ]);
            trackNeedValue = trackCharacteristics.setup_sensitivity;
            break;
          case "cooling":
            carMatchValue = this.avg([
              reliability.cooling_efficiency,
              puStats.cooling && puStats.cooling.cooling_efficiency,
            ]);
            trackNeedValue = trackCharacteristics.cooling_demand;
            break;
          case "confidence":
            carMatchValue = this.avg([
              racer.driverSkill,
              racer.driver.stats.reactiveness,
              racer.driver.stats.control,
            ]);
            trackNeedValue = trackCharacteristics.setup_sensitivity;
            break;
          case "front_end":
            carMatchValue = this.avg([
              aero.low_speed_cornering,
              aero.medium_speed_cornering,
              aero.high_speed_cornering,
              mechanical.suspension_quality,
            ]);
            trackNeedValue = this.avg([
              trackCharacteristics.front_tyre_stress,
              trackCharacteristics.setup_sensitivity,
            ]);
            break;
          case "technical_balance":
            carMatchValue = this.avg([
              aero.aero_efficiency,
              mechanical.ride_stability,
              chassis.design_philosophy === "balanced_low_drag" ? 90 : 70,
            ]);
            trackNeedValue = this.avg([
              trackCharacteristics.setup_sensitivity,
              trackCharacteristics.ride_height_sensitivity,
            ]);
            break;
          default: // balanced
            carMatchValue = this.avg([
              aero.aero_efficiency,
              perf.top_speed,
              mechanical.traction,
              racer.driverSkill,
            ]);
            trackNeedValue = this.avg([
              trackCharacteristics.top_speed_importance,
              trackCharacteristics.traction_importance,
              trackCharacteristics.braking_importance,
              trackCharacteristics.low_speed_cornering,
              trackCharacteristics.medium_speed_cornering,
              trackCharacteristics.high_speed_cornering,
            ]);
            break;
        }

        // Incorporate driver setup preferences
        let setupMatchFactor = 1;
        if (driverSetupPreferences) {
          const idealDownforce =
            currentCircuit.game_stats.setup.downforce || 70;
          const idealTopSpeed = currentCircuit.game_stats.setup.top_speed || 70;
          const idealTraction = currentCircuit.game_stats.setup.traction || 70;
          const idealKerbRiding =
            currentCircuit.game_stats.setup.kerb_riding || 70;

          const fwDiff = Math.abs(
            driverSetupPreferences.front_wing - idealDownforce
          );
          const rwDiff = Math.abs(
            driverSetupPreferences.rear_wing - idealDownforce
          );
          const bbDiff = Math.abs(driverSetupPreferences.brake_bias - 55);
          const suspDiff = Math.abs(
            driverSetupPreferences.suspension - idealKerbRiding
          );

          const totalDiff = (fwDiff + rwDiff + bbDiff + suspDiff) / 4;
          setupMatchFactor = this.clamp(1 - totalDiff / 100, 0.8, 1.1);
        }

        let paceFactor = racer.paceStat;

        paceFactor += (setupMatchFactor - 1) * 100;

        const trackCarMatchDifference = Math.abs(
          trackNeedValue - carMatchValue
        );
        paceFactor -= trackCarMatchDifference * 0.15;

        let characteristicSpeedBoost = 0;
        characteristicSpeedBoost +=
          (trackCharacteristics.top_speed_importance / 100) *
          (perf.top_speed / 100) *
          5;
        characteristicSpeedBoost +=
          (trackCharacteristics.traction_importance / 100) *
          (mechanical.traction / 100) *
          4;
        characteristicSpeedBoost +=
          (trackCharacteristics.braking_importance / 100) *
          (racer.driver.stats.braking / 100) *
          3;
        characteristicSpeedBoost +=
          (trackCharacteristics.aero_efficiency_importance / 100) *
          (aero.aero_efficiency / 100) *
          5;

        paceFactor += characteristicSpeedBoost;

        const currentPaceIndex =
          paceFactor * 0.38 +
          this.avg([
            racer.driverSkill,
            racer.raceCraft,
            racer.tyreManagement,
            racer.ersQuality,
            racer.carPace,
          ]) *
            0.22 +
          carMatchValue * 0.22 +
          this.avg([
            chassis.car_behavior && chassis.car_behavior.qualifying_bias,
            chassis.car_behavior && chassis.car_behavior.race_pace_bias,
            racer.staffBoost,
            racer.reliabilityScore,
          ]) *
            0.1 +
          (this.sim.mode === "Q"
            ? this.rand(-2.6, 2.4)
            : this.rand(-1.4, 1.4)) +
          Math.sin((racer.totalTime + racer.progress) * 0.017) *
            this.rand(0.2, 1.1);

        let baseSpeed =
          currentPoint.speed * this.sim.weatherGrip * this.sim.trackEvolution;
        baseSpeed *= this.clamp(0.78 + currentPaceIndex / 410, 0.86, 1.18);

        let tireConsumptionRate =
          0.0055 *
          (1 + ((trackCharacteristics.tyre_degradation || 70) - 60) / 95);
        let fuelConsumptionRate =
          0.0042 *
          (1 + ((trackCharacteristics.fuel_consumption || 65) - 60) / 100);
        tireConsumptionRate *=
          1 - this.clamp((racer.tyreManagement - 72) / 240, -0.08, 0.12);
        fuelConsumptionRate *=
          1 - this.clamp((racer.fuelEfficiency - 72) / 260, -0.07, 0.12);

        if (this.sim.stage === "FP") {
          baseSpeed *= this.clamp(
            0.93 + racer.staffBoost / 1800 + this.rand(-0.015, 0.015),
            0.92,
            1.01
          );
          tireConsumptionRate *= 0.82;
          fuelConsumptionRate *= 0.9;
        } else if (this.sim.stage === "Q1" || this.sim.stage === "Q2") {
          baseSpeed *= this.clamp(
            1.02 + racer.driverSkill / 2200 + this.rand(-0.018, 0.02),
            1.01,
            1.08
          );
          tireConsumptionRate *= 1.25;
          fuelConsumptionRate *= 0.72;
        }

        if (racer.drivingStyle === "fast") {
          baseSpeed *= 1.055;
          tireConsumptionRate *= 1.48;
          fuelConsumptionRate *= 1.34;
        } else if (racer.drivingStyle === "slow") {
          baseSpeed *= 0.94;
          tireConsumptionRate *= 0.68;
          fuelConsumptionRate *= 0.75;
        }

        // ERS impact (only for player and on straights)
        if (
          racer.isPlayer &&
          racer.ersActive &&
          currentPoint.zone.includes("Straight")
        ) {
          baseSpeed *= 1 + this.clamp(racer.ersQuality / 900, 0.08, 0.14);
          tireConsumptionRate *= 1.22;
          fuelConsumptionRate *= 1.18;
          racer.ersCharge = Math.max(
            0,
            racer.ersCharge -
              this.clamp(0.22 - racer.ersQuality / 1200, 0.1, 0.18)
          );
          if (racer.ersCharge <= 0) racer.ersActive = false; // Turn off ERS if depleted
        } else if (racer.isPlayer && !racer.ersActive) {
          racer.ersCharge = Math.min(
            100,
            racer.ersCharge + this.clamp(racer.ersQuality / 2500, 0.025, 0.045)
          );
        }

        // Tire wear impact on speed
        if (racer.tireWear < 50) baseSpeed *= 1 - (50 - racer.tireWear) / 100; // Reduce speed by up to 50%
        if (racer.tireWear < 10) baseSpeed *= 0.5; // Significantly slower on very low tires

        // Fuel level impact on speed
        if (racer.fuel < 20) baseSpeed *= 0.9; // 10% slower on low fuel
        if (racer.fuel < 5) baseSpeed *= 0.7; // Significantly slower on very low fuel

        if (this.weather !== "Cerah" && this.weather !== "Berawan") {
          const wetSkill = this.avg([
            racer.raceCraft,
            racer.driverSkill,
            chassis.car_behavior &&
              chassis.car_behavior.wet_weather_performance,
          ]);
          baseSpeed *= this.clamp(0.9 + wetSkill / 850, 0.9, 1.02);
          tireConsumptionRate *= this.weather === "Hujan Lebat" ? 0.78 : 0.9;
        }

        const reliabilityRisk =
          (100 -
            racer.reliabilityScore +
            (trackCharacteristics.engine_stress || 60) * 0.28 +
            (trackCharacteristics.braking_importance || 60) * 0.22) /
          280000;
        const mistakeRisk =
          (100 -
            this.avg([racer.driverSkill, racer.raceCraft, racer.staffBoost]) +
            (this.weather === "Hujan Lebat" ? 18 : 0)) /
          160000;
        if (Math.random() < reliabilityRisk) {
          baseSpeed *= this.rand(0.72, 0.9);
          racer.totalTime += this.rand(0.4, 1.6);
        }
        if (Math.random() < mistakeRisk) {
          baseSpeed *= this.rand(0.58, 0.86);
          racer.tireWear = Math.max(0, racer.tireWear - this.rand(0.3, 1.2));
          racer.totalTime += this.rand(0.7, 2.4);
        }

        // Smooth acceleration/deceleration
        racer.currentSpeed += (baseSpeed - racer.currentSpeed) * 0.05; // Smoother transition

        // Update progress on track
        const speedFactor = racer.currentSpeed / 100;
        let stepMove = Math.max(1, Math.round(speedFactor * 1.35));
        const nextProgress = racer.progress + stepMove;
        racer.progress = nextProgress % totalPoints;

        // Update total time based on actual speed
        racer.totalTime += 0.03 / Math.max(0.45, racer.currentSpeed / 190);

        // Consume tire and fuel
        racer.tireWear = Math.max(0, racer.tireWear - tireConsumptionRate);
        racer.fuel = Math.max(0, racer.fuel - fuelConsumptionRate);

        // Check for lap completion (simplified: if progress resets)
        if (nextProgress >= totalPoints && racer.currentLap < maxLaps) {
          // Detect if a full loop was made
          racer.currentLap++;
          racer.lastLapTime = racer.totalTime; // Store last lap time if needed

          // Update HUD for player's current lap
          if (racer.isPlayer) {
            document.getElementById("hud-lap").innerText = Math.min(
              racer.currentLap + 1,
              maxLaps
            );
            this.addCommentary(
              `${racer.code} menyelesaikan lap ${
                racer.currentLap
              }. Pace: ${this.formatRaceTime(racer.totalTime)}.`
            );
          }
        }

        if (racer.currentLap >= maxLaps) {
          // All laps completed and back to start line
          racer.finished = true;
          racer.progress = 0;
        }
      });

      // Check if session finished (all cars finished or all player cars finished in race mode)
      const allCarsFinished = this.currentGrid.every((r) => r.finished);
      const playerCarsFinished = this.currentGrid
        .filter((r) => r.isPlayer)
        .every((r) => r.finished);

      if (this.sim.mode === "RACE" ? playerCarsFinished : allCarsFinished) {
        sessionFinished = true;
      }

      // Update Telemetry HUD for player's car
      const playerCar = this.currentGrid.find((r) => r.isPlayer);
      if (playerCar) {
        const activePoint = this.sim.trackPoints[playerCar.progress];
        const lapEl = document.getElementById("telemetry-lap");
        if (lapEl) lapEl.innerText = `${playerCar.currentLap} / ${maxLaps}`;

        const speedEl = document.getElementById("telemetry-speed");
        if (speedEl)
          speedEl.innerText = `${Math.round(playerCar.currentSpeed)} km/h`;

        const sectorEl = document.getElementById("telemetry-sector");
        if (sectorEl) sectorEl.innerText = `Sector ${activePoint.sector}`;

        const zoneEl = document.getElementById("telemetry-zone");
        if (zoneEl) zoneEl.innerText = `${activePoint.zone} | ${this.weather}`;

        const tireEl = document.getElementById("telemetry-tire");
        const fuelEl = document.getElementById("telemetry-fuel");
        const ersEl = document.getElementById("telemetry-ers"); // New ERS element
        if (tireEl) tireEl.innerText = `${Math.round(playerCar.tireWear)}%`;
        if (fuelEl) fuelEl.innerText = `${Math.round(playerCar.fuel)}%`;
        if (ersEl) ersEl.innerText = `${Math.round(playerCar.ersCharge)}%`; // Update ERS display

        // Update player controls HUD for tire/fuel/ers status
        UI.updatePlayerControlsHUD();
      }

      // Sort and render live standings
      this.currentGrid.sort((a, b) => {
        if (a.eliminated && !b.eliminated) return 1;
        if (!a.eliminated && b.eliminated) return -1;
        // Prioritize finished cars
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;

        // Then by laps completed (more laps = higher position)
        if (b.currentLap !== a.currentLap) return b.currentLap - a.currentLap;

        if (!a.finished && !b.finished && b.progress !== a.progress)
          return b.progress - a.progress;

        // Finally by total time (less time = higher position)
        return a.totalTime - b.totalTime;
      });
      this.updateGaps();
      UI.renderLiveStandings(this.currentGrid);

      // Render cars on track
      this.drawCars();

      if (sessionFinished) {
        this.finishSession();
        return;
      }

      this.sim.animationId = requestAnimationFrame(() => this.gameLoop());
    }
  },
};
