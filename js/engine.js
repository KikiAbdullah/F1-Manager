// =====================================================================
// F1 MANAGER 2026 - CORE SIMULATION ENGINE
// Complete rewrite implementing all 20 points from update_290526.md
// Simulation Pipeline: TRACK → WEATHER → CAR → DRIVER → TYRE → STRATEGY → INCIDENTS → LAP TIME
// =====================================================================
const Engine = {
  currentGrid: [],
  currentCircuit: null,
  activeRound: null,
  weatherState: null,
  scState: Utils.SC_STATES.NONE,
  scLapsRemaining: 0,
  incidentLog: [],

  sim: {
    ctx: null,
    isRunning: false,
    simSpeed: 1,
    currentLap: 0,
    targetLaps: 1,
    mode: "FP", // FP, Q, RACE
    stage: null, // FP, Q1, Q2, Q3, RACE
    trackPoints: [],
    animationId: null,
    trackEvolution: 1,
    trackPointsCircuitId: null,
    domCache: {},
    raceDistancePercent: 25, // % of real laps (adjustable)
    fastestLapId: null,
    fastestLapTime: Infinity,
    fastestSectors: { 1: Infinity, 2: Infinity, 3: Infinity },
    particles: [],
    leaderFinished: false,
    teamEvents: [],
  },

  // === SETUP STATE (for player) ===
  playerSetup: {
    front_wing: 50,
    rear_wing: 50,
    suspension: 50,
    brake_bias: 55,
  },

  // =============================================
  // DATA LOOKUP HELPERS
  // =============================================
  getCircuitData(circuitId) {
    const circuitBase = Data.circuits.find((c) => c.id === circuitId);
    const scheduleEntry = Data.schedules.find(
      (s) => s.circuit_id === circuitId && s.type === "race_weekend"
    );
    if (!scheduleEntry) return circuitBase;
    return {
      ...circuitBase,
      ...scheduleEntry,
      track_characteristics: scheduleEntry.track_characteristics || {},
    };
  },

  getTeamForDriver(driver) {
    return Data.teams ? Data.teams.find((t) => t.id === driver.team_id) : null;
  },

  getChassisForTeam(teamId) {
    return Data.chassis
      ? Data.chassis.find((c) => c.team_id === teamId)
      : Data.chassis[0];
  },

  getPUForTeam(team) {
    if (!team || !Data.power_units) return Data.power_units[0];
    const puSupplier = team.power_unit?.supplier;
    // Find PU by manufacturer matching supplier
    return (
      Data.power_units.find(
        (p) =>
          p.manufacturer?.toLowerCase().includes(puSupplier) ||
          p.id?.includes(puSupplier)
      ) || Data.power_units[0]
    );
  },

  getWeekendData(round = State.currentRound) {
    if (!State.raceWeekends) State.raceWeekends = {};
    if (!State.raceWeekends[round]) {
      State.raceWeekends[round] = {
        round,
        fp: null,
        q1: null,
        q2: null,
        q3: null,
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
    const el =
      this.sim.domCache.commentary ||
      document.getElementById("race-commentary");
    if (el) el.innerText = text;
  },

  // =============================================
  // TRACK RENDERING
  // =============================================
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
      this.sim.trackPointsCircuitId === this.currentCircuit?.id
    )
      return;
    const circuitId = this.currentCircuit ? this.currentCircuit.id : "bahrain";
    const trackKeyPoints = TrackLayouts.get(circuitId);
    this.sim.trackPoints = this.generateTrackPoints(trackKeyPoints);
    this.sim.trackPointsCircuitId = circuitId;
  },

  // =============================================
  // RACER BUILDER - Team-Specific Assignment (Bug Fix)
  // =============================================
  buildRacer(driver, team, chassis, pu, isPlayer, color) {
    const d = driver.stats || {};
    const puStats = pu?.stats || {};
    const chassisStats = chassis?.stats || {};
    const aero = chassisStats.aerodynamics || {};
    const mechanical = chassisStats.mechanical || {};
    const perf = chassisStats.performance || {};
    const reliability = chassisStats.reliability || {};
    const teamSporting = team?.sporting_profile || {};
    const teamInfra = team?.infrastructure || {};
    const teamPerf = team?.performance_state || {};

    // Driver skill composite
    const driverSkill = Utils.weightedAvg(
      [
        d.overall,
        d.cornering,
        d.braking,
        d.reactiveness,
        d.control,
        d.accuracy,
      ],
      [2, 1.5, 1, 1, 1, 1.5]
    );
    const raceCraft = Utils.avg([
      d.overtaking,
      d.defending,
      d.smoothness,
      d.adaptability,
    ]);
    const carPace = Utils.weightedAvg(
      [
        chassisStats.overall_performance,
        puStats.overall_performance,
        aero.aero_efficiency,
        mechanical.traction,
        perf.top_speed,
        perf.acceleration,
      ],
      [2, 2, 1.5, 1, 1, 1]
    );

    // Total pace using STD scale
    const totalPace =
      driverSkill * 0.3 +
      carPace * 0.4 +
      raceCraft * 0.1 +
      Utils.avg([teamInfra.staff_quality, teamPerf.momentum]) * 0.12 +
      Utils.avg([reliability.failure_resistance]) * 0.08;

    // Driver traits
    const traits = Utils.getDriverTraits(d);

    // Setup compatibility (player uses their setup, AI uses their preferences)
    const setupMatch = isPlayer
      ? Utils.calculateSetupMatch(
          this.playerSetup,
          driver.setup_preferences,
          {}
        )
      : 0.75 + Math.random() * 0.15; // AI gets 75-90% setup match

    return {
      id: driver.id,
      name: driver.full_name,
      code:
        driver.driver_code || driver.last_name.substring(0, 3).toUpperCase(),
      teamId: driver.team_id,
      teamName: team?.name || "Independent",
      isPlayer,
      color,

      // Pace stats
      paceStat: totalPace,
      driverSkill,
      raceCraft,
      carPace,
      setupMatch,

      // Tyre management
      tyreManagement: Utils.avg([
        d.smoothness,
        perf.tyre_preservation,
        teamSporting.tyre_management,
      ]),
      fuelEfficiency: Utils.avg([
        perf.fuel_efficiency,
        puStats.internal_combustion?.fuel_efficiency,
      ]),
      ersQuality: Utils.avg([
        perf.ers_integration,
        puStats.hybrid_system?.ers_output,
      ]),
      reliabilityScore: Utils.avg([
        reliability.failure_resistance,
        puStats.reliability?.failure_resistance,
      ]),
      staffBoost: Utils.avg([
        teamInfra.staff_quality,
        teamPerf.form_rating_last_5_races,
      ]),
      wetSkill: Utils.avg([
        d.adaptability,
        d.control,
        chassis?.car_behavior?.wet_weather_performance,
      ]),

      // Flat stats for track matching
      topSpeed: perf.top_speed || 70,
      horsepower: puStats.internal_combustion?.horsepower || 70,
      drsEfficiency: aero.drs_efficiency || 70,
      aeroEfficiency: aero.aero_efficiency || 70,
      traction: mechanical.traction || 70,
      braking: d.braking || 70,
      highSpeedCornering: aero.high_speed_cornering || 70,
      mediumSpeedCornering: aero.medium_speed_cornering || 70,
      lowSpeedCornering: aero.low_speed_cornering || 70,
      qualifyingBias: chassis?.car_behavior?.qualifying_bias || 70,
      racePaceBias: chassis?.car_behavior?.race_pace_bias || 70,
      wetWeatherPerf: chassis?.car_behavior?.wet_weather_performance || 70,

      // Personality
      traits,
      driverStats: d,

      // === LIVE RACE STATE ===
      // Tyre compound system
      tyreCompound: "medium",
      tyreWear: 0, // 0 = fresh, 100 = destroyed
      tyreTemp: 80, // Operating temp
      tyreGrip: 1.0, // Current effective grip

      fuel: 100,
      ersCharge: 100,
      ersMode: "balanced",

      drivingStyle: isPlayer ? "stable" : "stable",
      isPitting: false,
      pitRequested: false,
      pitStopProgress: 0,
      pitStopDuration: 250,
      pitCount: 0,
      pitTargetCompound: null,

      progress: 0,
      currentSpeed: 0,
      currentLap: 0,
      totalTime: 0,
      gapText: "-",
      finished: false,
      eliminated: false,
      lastLapTime: 0,
      bestLapTime: Infinity,
      lapStartTime: 0,
      dnf: false,
      dnfReason: "",
      currentSector: 1,
      sectorEntryTime: 0,
      lastSectorTimes: { 1: 0, 2: 0, 3: 0 },
      bestSectorTimes: { 1: Infinity, 2: Infinity, 3: Infinity },
      drsOpen: false,
      overlapIndex: 0,
      prevPosition: 0,
    };
  },

  // =============================================
  // GRID GENERATION - FIX: Team-specific cars
  // =============================================
  generateGrid() {
    const grid = [];
    if (!Data.drivers) return grid;

    Data.drivers.forEach((driver) => {
      const team = this.getTeamForDriver(driver);
      const chassis = this.getChassisForTeam(driver.team_id);
      const pu = this.getPUForTeam(team);
      const isPlayer =
        State.drivers && State.drivers.some((d) => d.id === driver.id);
      const color = isPlayer ? "#00ff87" : team ? team.color : "#ffffff";

      grid.push(this.buildRacer(driver, team, chassis, pu, isPlayer, color));
    });

    return grid;
  },

  // =============================================
  // SESSION MANAGEMENT
  // =============================================
  cacheDOMElements() {
    this.sim.domCache = {
      simArea: document.getElementById("sim-area"),
      canvas: document.getElementById("race-canvas"),
      totalLapsHud: document.getElementById("hud-total-laps"),
      lapHud: document.getElementById("hud-lap"),
      sessionHud: document.getElementById("hud-session-mode"),
      weatherHud: document.getElementById("hud-weather"),
      liveHud: document.getElementById("live-race-hud"),
      playBtn: document.getElementById("btn-play"),
      commentary: document.getElementById("race-commentary"),
      telemetryLap: document.getElementById("telemetry-lap"),
      telemetrySpeed: document.getElementById("telemetry-speed"),
      telemetrySector: document.getElementById("telemetry-sector"),
      telemetryZone: document.getElementById("telemetry-zone"),
      telemetryTire: document.getElementById("telemetry-tire"),
      telemetryFuel: document.getElementById("telemetry-fuel"),
      telemetryErs: document.getElementById("telemetry-ers"),
    };
  },

  setupSessionContext() {
    const currentEvent = Data.schedules.find(
      (s) => s.round === State.currentRound && s.type === "race_weekend"
    );
    this.currentCircuit = currentEvent
      ? this.getCircuitData(currentEvent.circuit_id)
      : this.getCircuitData("bahrain") || Data.circuits[0];

    const trackChars = this.currentCircuit?.track_characteristics || {};

    // Calculate real lap count
    const realLaps = this.currentCircuit?.laps || 56;
    if (this.sim.stage === "FP") {
      this.sim.targetLaps = this.sim.targetLaps || 3;
    } else if (["Q1", "Q2", "Q3"].includes(this.sim.stage)) {
      this.sim.targetLaps = 2;
    } else {
      // RACE: use percentage of real laps
      this.sim.targetLaps = Math.max(
        5,
        Math.round((realLaps * this.sim.raceDistancePercent) / 100)
      );
    }

    // Initialize weather
    this.weatherState = Weather.createForRace(trackChars, this.sim.targetLaps);

    // Reset safety car
    this.scState = Utils.SC_STATES.NONE;
    this.scLapsRemaining = 0;
    this.incidentLog = [];
    this.sim.fastestLapId = null;
    this.sim.fastestLapTime = Infinity;
    this.sim.fastestSectors = { 1: Infinity, 2: Infinity, 3: Infinity };
    this.sim.particles = [];
    this.sim.leaderFinished = false;
    this.sim.teamEvents = [];
  },

  setupSessionGrid() {
    if (this.currentGrid.length === 0) {
      this.currentGrid = this.generateGrid();
    }

    // Reset all racers for session
    this.currentGrid.forEach((driver) => {
      driver.progress = 0;
      driver.currentSpeed = 0;
      driver.currentLap = 0;
      driver.totalTime = 0;
      driver.gapText = "-";
      driver.finished = false;
      driver.eliminated = false;
      driver.dnf = false;
      driver.dnfReason = "";
      driver.fuel = 100;
      driver.ersCharge = 100;
      driver.ersMode = "balanced";
      driver.isPitting = false;
      driver.pitRequested = false;
      driver.pitStopProgress = 0;
      driver.pitCount = 0;
      driver.lastLapTime = 0;
      driver.bestLapTime = Infinity;
      driver.lapStartTime = 0;
      driver.currentSector = 1;
      driver.sectorEntryTime = 0;
      driver.lastSectorTimes = { 1: 0, 2: 0, 3: 0 };
      driver.bestSectorTimes = { 1: Infinity, 2: Infinity, 3: Infinity };
      driver.drsOpen = false;

      // Tyre assignment
      if (this.sim.mode === "RACE") {
        driver.tyreCompound = driver.isPlayer
          ? State.raceStartCompound || "medium"
          : this.aiChooseStartCompound(driver);
      } else {
        driver.tyreCompound = ["Q1", "Q2", "Q3"].includes(this.sim.stage)
          ? "soft"
          : "medium";
      }
      driver.tyreWear = 0;
      driver.tyreTemp = 70;
      driver.tyreGrip = Utils.TYRE_COMPOUNDS[driver.tyreCompound]?.grip || 1.0;

      if (driver.isPlayer) {
        driver.drivingStyle = "stable";
      } else {
        driver.drivingStyle = ["Q1", "Q2", "Q3"].includes(this.sim.stage)
          ? "fast"
          : this.sim.stage === "FP"
          ? "slow"
          : "stable";
      }
    });

    // Grid order based on session
    const weekend = this.getWeekendData(State.currentRound);
    if (this.sim.stage === "Q2" && weekend.q1) {
      const q1Ids = weekend.q1.results.slice(0, 15).map((r) => r.id);
      this.currentGrid.forEach((racer) => {
        if (!q1Ids.includes(racer.id)) {
          racer.eliminated = true;
          racer.finished = true;
          racer.totalTime = 99999;
        }
      });
    } else if (this.sim.stage === "Q3" && weekend.q2) {
      const q2Ids = weekend.q2.results.slice(0, 10).map((r) => r.id);
      this.currentGrid.forEach((racer) => {
        if (!q2Ids.includes(racer.id)) {
          racer.eliminated = true;
          racer.finished = true;
          racer.totalTime = 99999;
        }
      });
    } else if (this.sim.mode === "RACE" && weekend.qualifyingGrid) {
      const qIds = weekend.qualifyingGrid.map((r) => r.id);
      this.currentGrid.sort((a, b) => {
        const iA = qIds.indexOf(a.id),
          iB = qIds.indexOf(b.id);
        return iA - iB;
      });
    } else {
      this.currentGrid.sort(() => Math.random() - 0.5);
    }

    this.addCommentary(this.getSessionIntroCommentary());
  },

  aiChooseStartCompound(racer) {
    // AI pick based on tyre management and track deg
    const trackDeg =
      this.currentCircuit?.track_characteristics?.tyre_degradation || 60;
    if (racer.tyreManagement > 85 && trackDeg < 50) return "hard";
    if (trackDeg > 75) return "medium";
    return Math.random() > 0.4 ? "medium" : "soft";
  },

  getSessionIntroCommentary() {
    if (this.sim.stage === "FP")
      return "📡 Free Practice dimulai — tim mengumpulkan data setup dan tyre behavior.";
    if (this.sim.stage === "Q1")
      return "🔴 Q1 dimulai — hanya 15 tercepat lolos ke Q2!";
    if (this.sim.stage === "Q2")
      return "🟡 Q2 dimulai — top 15 bertarung, 10 tercepat ke Q3!";
    if (this.sim.stage === "Q3")
      return "🟢 Q3 dimulai — final shootout untuk pole position!";
    return `🏁 RACE ${this.sim.targetLaps} laps — ${Weather.getLabel(
      this.weatherState
    )} — Strategy is key!`;
  },

  startSession(mode) {
    if (this.sim.animationId) cancelAnimationFrame(this.sim.animationId);
    this.sim.stage = mode;
    this.sim.mode = ["Q1", "Q2", "Q3"].includes(mode) ? "Q" : mode;
    this.sim.isRunning = true;
    this.sim.currentLap = 0;

    this.setupSessionContext();
    this.cacheDOMElements();
    this.setupSessionGrid();

    if (this.sim.domCache.simArea)
      this.sim.domCache.simArea.classList.remove("hidden");
    if (!this.sim.domCache.canvas) {
      console.error("[F1] Canvas not found!");
      return;
    }

    this.sim.ctx = this.sim.domCache.canvas.getContext("2d");
    this.initTrack();

    // Update HUD
    if (this.sim.domCache.totalLapsHud)
      this.sim.domCache.totalLapsHud.innerText = this.sim.targetLaps;
    if (this.sim.domCache.lapHud) this.sim.domCache.lapHud.innerText = 1;
    if (this.sim.domCache.sessionHud)
      this.sim.domCache.sessionHud.innerText = mode;
    if (this.sim.domCache.weatherHud)
      this.sim.domCache.weatherHud.innerText = `${Weather.getLabel(
        this.weatherState
      )} — ${this.currentCircuit?.name || "Track"}`;
    if (this.sim.domCache.liveHud)
      this.sim.domCache.liveHud.classList.remove("hidden");
    if (this.sim.domCache.playBtn) {
      this.sim.domCache.playBtn.innerText = "PAUSE SIMULATION";
      this.sim.domCache.playBtn.classList.add("btn-active");
    }

    if (typeof UI !== "undefined" && UI.updatePlayerControlsHUD)
      UI.updatePlayerControlsHUD();
    this.gameLoop();
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
      this.sim.targetLaps = Utils.clamp(
        parseInt(lapsInput?.value, 10) || 3,
        1,
        10
      );
    }

    if (mode === "Q1" && data.q1) return UI.openSessionPanel("Q");
    if (mode === "Q2" && (!data.q1 || data.q2)) return UI.openSessionPanel("Q");
    if (mode === "Q3" && (!data.q2 || data.q3)) return UI.openSessionPanel("Q");

    if (mode === "RACE") {
      if (data.race)
        return UI.renderSessionResults(data.race.results, "RACE RESULTS");
      if (!data.qualifyingComplete) return UI.openSessionPanel("RACE");
      const pctInput = document.getElementById("input-race-pct");
      this.sim.raceDistancePercent = Utils.clamp(
        parseInt(pctInput?.value, 10) || 25,
        10,
        100
      );
    }

    document.getElementById("session-results")?.classList.add("hidden");
    this.activeRound = State.currentRound;
    this.startSession(mode);
  },

  // =============================================
  // CONTROLS
  // =============================================
  toggleSim() {
    this.sim.isRunning = !this.sim.isRunning;
    const btn =
      this.sim.domCache.playBtn || document.getElementById("btn-play");
    if (btn) {
      btn.innerText = this.sim.isRunning
        ? "PAUSE SIMULATION"
        : "RESUME SIMULATION";
      btn.classList.toggle("btn-active", this.sim.isRunning);
      if (this.sim.isRunning) this.gameLoop();
    }
  },

  setSimSpeed(speed, btnElement) {
    this.sim.simSpeed = speed;
    document
      .querySelectorAll(".btn-speed")
      .forEach((b) => b.classList.remove("btn-active"));
    if (btnElement) btnElement.classList.add("btn-active");
  },

  setDrivingStyle(style, btn, index) {
    const playerCars = this.currentGrid.filter((r) => r.isPlayer);
    if (playerCars[index]) playerCars[index].drivingStyle = style;
    if (typeof UI !== "undefined" && UI.updatePlayerControlsHUD)
      UI.updatePlayerControlsHUD();
  },

  pitStop(index, compound) {
    const playerCars = this.currentGrid.filter((r) => r.isPlayer);
    if (playerCars[index] && !playerCars[index].isPitting) {
      playerCars[index].pitRequested = true;
      playerCars[index].pitTargetCompound = compound || "medium";
      this.sim.teamEvents.push({
        lap: playerCars[index].currentLap,
        text: `📻 BOX BOX BOX! Ganti ke ban ${compound.toUpperCase()}`,
      });
    }
    if (typeof UI !== "undefined" && UI.updatePlayerControlsHUD)
      UI.updatePlayerControlsHUD();
  },

  setERSMode(mode, index) {
    const playerCars = this.currentGrid.filter((r) => r.isPlayer);
    if (playerCars[index]) playerCars[index].ersMode = mode;
    if (typeof UI !== "undefined" && UI.updatePlayerControlsHUD)
      UI.updatePlayerControlsHUD();
  },

  // =============================================
  // TYRE PHYSICS (Point #4)
  // =============================================
  updateTyre(racer, trackChars) {
    const compound = Utils.TYRE_COMPOUNDS[racer.tyreCompound];
    if (!compound) return;

    // Wear rate based on compound durability, track, driving style, dirty air
    const trackDeg = (trackChars.tyre_degradation || 60) / 100;
    const mgmtFactor = 1 - (racer.tyreManagement - 70) / 200; // Better management = less wear
    const styleFactor =
      racer.drivingStyle === "fast"
        ? 1.35
        : racer.drivingStyle === "slow"
        ? 0.65
        : 1.0;
    const scFactor = this.scState !== Utils.SC_STATES.NONE ? 0.3 : 1.0;

    const wearRate =
      (0.15 / compound.durability) *
      trackDeg *
      mgmtFactor *
      styleFactor *
      scFactor;
    racer.tyreWear = Utils.clamp(racer.tyreWear + wearRate, 0, 100);

    // Temperature model
    const ambientTemp = this.weatherState?.trackTemp || 30;
    const pushHeat =
      racer.drivingStyle === "fast"
        ? 3
        : racer.drivingStyle === "slow"
        ? -2
        : 0;
    const targetTemp =
      compound.optimal_temp + pushHeat + (ambientTemp - 25) * 0.3;
    racer.tyreTemp += (targetTemp - racer.tyreTemp) * 0.08;

    // Grip calculation - nonlinear cliff!
    let wearGrip;
    if (racer.tyreWear < compound.cliff_point) {
      wearGrip = 1.0 - racer.tyreWear * 0.002; // Gradual loss before cliff
    } else {
      // CLIFF! Sharp performance drop
      const overCliff = racer.tyreWear - compound.cliff_point;
      wearGrip = 1.0 - compound.cliff_point * 0.002 - overCliff * 0.012;
    }

    // Temperature grip - best near optimal
    const tempDiff = Math.abs(racer.tyreTemp - compound.optimal_temp);
    const tempGrip = 1.0 - tempDiff * 0.004;

    // Weather grip
    const weatherGrip = this.weatherState
      ? Weather.getEffectiveGrip(this.weatherState, racer.tyreCompound)
      : compound.grip;

    racer.tyreGrip = Utils.clamp(weatherGrip * wearGrip * tempGrip, 0.4, 1.15);
  },

  // =============================================
  // ERS PHYSICS (Point #5) - For ALL drivers
  // =============================================
  updateERS(racer, currentPoint) {
    const ersMode = Utils.ERS_MODES[racer.ersMode] || Utils.ERS_MODES.balanced;
    const isStraight = currentPoint?.zone?.includes("Straight");

    if (isStraight && racer.ersCharge > 0) {
      racer.ersCharge = Utils.clamp(
        racer.ersCharge - ersMode.drain_rate,
        0,
        100
      );
    }

    // Harvest in braking zones / corners
    if (!isStraight) {
      const harvestRate = ersMode.harvest * (racer.ersQuality / 100);
      racer.ersCharge = Utils.clamp(racer.ersCharge + harvestRate, 0, 100);
    }

    // Auto-switch to harvest if battery empty
    if (racer.ersCharge <= 1 && racer.ersMode === "deploy") {
      racer.ersMode = "harvest";
    }
  },

  // =============================================
  // SAFETY CAR SYSTEM (Point #8)
  // =============================================
  checkIncidents(lap) {
    if (this.sim.mode !== "RACE") return;
    if (this.scState !== Utils.SC_STATES.NONE) {
      this.scLapsRemaining--;
      if (this.scLapsRemaining <= 0) {
        this.scState = Utils.SC_STATES.NONE;
        this.addCommentary("🟢 GREEN FLAG! SC in, race resumes!");
      }
      return;
    }

    const trackChars = this.currentCircuit?.track_characteristics || {};
    const scProb = (trackChars.safety_car_probability || 30) / 100;
    const vscProb = (trackChars.virtual_safety_car_probability || 35) / 100;
    const rfProb = (trackChars.red_flag_probability || 5) / 100;

    const roll = Math.random();
    const lapFactor = 0.012; // Chance per lap

    if (roll < rfProb * lapFactor * 0.3) {
      this.scState = Utils.SC_STATES.RED_FLAG;
      this.scLapsRemaining = Utils.randInt(2, 4);
      this.addCommentary(
        "🔴 RED FLAG! Insiden serius, balapan dihentikan sementara!"
      );
      this.incidentLog.push({ lap, type: "RED_FLAG" });
    } else if (roll < scProb * lapFactor) {
      this.scState = Utils.SC_STATES.SC;
      this.scLapsRemaining = Utils.randInt(2, 5);
      this.addCommentary(
        "🟡 SAFETY CAR DEPLOYED! Semua mobil di belakang safety car!"
      );
      this.incidentLog.push({ lap, type: "SC" });
    } else if (roll < vscProb * lapFactor) {
      this.scState = Utils.SC_STATES.VSC;
      this.scLapsRemaining = Utils.randInt(1, 3);
      this.addCommentary("🟡 VIRTUAL SAFETY CAR! Semua harus perlambat!");
      this.incidentLog.push({ lap, type: "VSC" });
    }
  },

  // =============================================
  // HUMAN ERROR SYSTEM (Point #13)
  // =============================================
  checkDriverError(racer) {
    if (this.sim.mode !== "RACE" && this.sim.mode !== "Q") return 0;

    const errorChance =
      (100 - racer.driverStats.control) * 0.0003 +
      (100 - racer.driverStats.accuracy) * 0.0002;
    const pushFactor = racer.drivingStyle === "fast" ? 1.8 : 1.0;
    const wearFactor = racer.tyreWear > 70 ? 1.5 : 1.0;

    if (Math.random() < errorChance * pushFactor * wearFactor) {
      const severity = Math.random();
      if (severity < 0.6) {
        // Lockup - small time loss
        return 0.15;
      } else if (severity < 0.85) {
        // Missed apex - medium time loss
        this.addCommentary(
          `⚠️ ${racer.code} melewatkan apex! Kehilangan waktu!`
        );
        return 0.4;
      } else if (severity < 0.97) {
        // Snap oversteer - big time loss
        this.addCommentary(
          `⚠️ ${racer.code} oversteer! Hampir kehilangan kendali!`
        );
        return 1.0;
      } else {
        // DNF!
        if (Math.random() < 0.3 && this.sim.mode === "RACE") {
          racer.dnf = true;
          racer.dnfReason = "Crash";
          racer.finished = true;
          racer.totalTime = 999999;
          this.addCommentary(`💥 ${racer.code} OFF! Tabrakan - DNF!`);
          if (racer.isPlayer)
            this.sim.teamEvents.push({
              lap: racer.currentLap,
              text: "📻 KECELAKAAN! DNF. Mobil hancur!",
            });
          return 99;
        }
        if (racer.isPlayer)
          this.sim.teamEvents.push({
            lap: racer.currentLap,
            text: "📻 Mobil keluar lintasan! Kita kehilangan waktu banyak!",
          });
        return 1.5;
      }
    }
    return 0;
  },

  // Mechanical failure check
  checkMechanicalDNF(racer) {
    if (this.sim.mode !== "RACE") return;
    const failRate = (100 - racer.reliabilityScore) * 0.00008;
    if (Math.random() < failRate) {
      racer.dnf = true;
      racer.dnfReason = "Mechanical";
      racer.finished = true;
      racer.totalTime = 999999;
      this.addCommentary(`💔 ${racer.code} RETIRED! Masalah mekanis - DNF!`);
      if (racer.isPlayer)
        this.sim.teamEvents.push({
          lap: racer.currentLap,
          text: "📻 ENGINE FAILURE! Kita harus berhenti. DNF.",
        });
    }
  },

  // =============================================
  // AI STRATEGY ENGINE (Point #7)
  // =============================================
  aiDecisions(racer, currentPoint, lap) {
    if (racer.isPlayer || racer.eliminated || racer.dnf) return;

    // Tyre compound switch in weather change
    const weatherSwitch = Weather.shouldSwitchToWets(
      this.weatherState,
      racer.tyreCompound
    );
    if (weatherSwitch && !racer.pitRequested) {
      racer.pitRequested = true;
      racer.pitTargetCompound = weatherSwitch;
      return;
    }

    // Pit for worn tyres
    const compound = Utils.TYRE_COMPOUNDS[racer.tyreCompound];
    const effectiveCliff = compound ? compound.cliff_point : 30;
    const shouldPit = racer.tyreWear > effectiveCliff + Utils.rand(-5, 10);

    // Don't pit on last few laps unless desperate
    const lapsRemaining = this.sim.targetLaps - lap;
    if (shouldPit && lapsRemaining > 3 && !racer.pitRequested) {
      racer.pitRequested = true;
      // Choose next compound
      if (["soft"].includes(racer.tyreCompound))
        racer.pitTargetCompound = "hard";
      else if (["medium"].includes(racer.tyreCompound))
        racer.pitTargetCompound = "hard";
      else racer.pitTargetCompound = "medium";
    }

    // Free pit stop under SC
    if (
      this.scState === Utils.SC_STATES.SC &&
      racer.tyreWear > 20 &&
      !racer.pitRequested &&
      lapsRemaining > 5
    ) {
      racer.pitRequested = true;
      racer.pitTargetCompound =
        racer.tyreCompound === "soft" ? "medium" : "hard";
    }

    // Driving style AI
    const isStraight = currentPoint?.zone?.includes("Straight");
    if (this.scState !== Utils.SC_STATES.NONE) {
      racer.drivingStyle = "slow";
    } else if (racer.tyreWear > effectiveCliff) {
      racer.drivingStyle = "slow"; // Tyres past cliff, nurse them
    } else if (isStraight && racer.tyreWear < effectiveCliff * 0.7) {
      racer.drivingStyle = "fast";
    } else {
      racer.drivingStyle = "stable";
    }

    // ERS management for AI
    if (isStraight && racer.ersCharge > 25) {
      racer.ersMode = "deploy";
    } else if (!isStraight) {
      racer.ersMode = racer.ersCharge < 40 ? "harvest" : "balanced";
    }
  },

  // =============================================
  // SECTOR-WEIGHTED LAP TIME (Point #1)
  // =============================================
  calculateSectorBonus(racer, sectorType) {
    const mapping = {
      top_speed: racer.topSpeed,
      traction: racer.traction,
      braking: racer.braking,
      high_speed_cornering: racer.highSpeedCornering,
      medium_speed_cornering: racer.mediumSpeedCornering,
      low_speed_cornering: racer.lowSpeedCornering,
      aero_balance: racer.aeroEfficiency,
      mechanical_grip: racer.traction,
      front_end: racer.lowSpeedCornering,
      driver_precision: racer.driverSkill,
      confidence: (racer.driverSkill + racer.setupMatch * 100) / 2,
    };
    const statValue = mapping[sectorType] || racer.carPace;
    return (statValue - 75) * Utils.SCALE.car_performance;
  },

  // =============================================
  // MAIN GAME LOOP
  // =============================================
  gameLoop() {
    if (!this.sim.isRunning) {
      this.sim.animationId = requestAnimationFrame(() => this.gameLoop());
      return;
    }

    const totalPoints = this.sim.trackPoints.length;
    const maxLaps = this.sim.targetLaps;
    const trackChars = this.currentCircuit?.track_characteristics || {};
    const sectorWeights = this.currentCircuit?.sector_weights || {};

    this.sim.ctx.clearRect(0, 0, 900, 550);
    this.drawTrack();

    let sessionFinished = false;
    let lapChanged = false;

    for (let step = 0; step < this.sim.simSpeed; step++) {
      for (let i = 0; i < this.currentGrid.length; i++) {
        let racer = this.currentGrid[i];
        if (
          racer.finished ||
          racer.eliminated ||
          racer.dnf ||
          racer.currentLap > maxLaps
        )
          continue;

        // === PIT STOP ===
        if (racer.isPitting) {
          racer.pitStopProgress--;
          if (racer.pitStopProgress <= 0) {
            racer.isPitting = false;
            racer.pitRequested = false;
            racer.tyreCompound = racer.pitTargetCompound || "medium";
            racer.tyreWear = 0;
            racer.tyreTemp = 70;
            racer.tyreGrip =
              Utils.TYRE_COMPOUNDS[racer.tyreCompound]?.grip || 1.0;
            racer.pitCount++;
            this.addCommentary(
              `🔧 ${racer.code} keluar pit dengan ban ${
                Utils.TYRE_COMPOUNDS[racer.tyreCompound]?.name || "Medium"
              }`
            );
            if (racer.isPlayer) {
              this.sim.teamEvents.push({
                lap: racer.currentLap,
                text: `📻 Pit stop selesai! Ban baru diatur.`,
              });
            }
            if (typeof UI !== "undefined" && UI.updatePlayerControlsHUD)
              UI.updatePlayerControlsHUD();
          }
          continue;
        }

        let currentPoint = this.sim.trackPoints[racer.progress];
        if (!currentPoint) continue;

        // === AI DECISIONS ===
        this.aiDecisions(racer, currentPoint, racer.currentLap);

        // === PIT ENTRY ===
        if (
          racer.pitRequested &&
          currentPoint.zone?.includes("Main Straight") &&
          currentPoint.x >= 350 &&
          currentPoint.x <= 650
        ) {
          racer.isPitting = true;
          racer.pitStopProgress = racer.pitStopDuration;
          racer.currentSpeed = 0;
          const pitLoss = trackChars.pit_lane_loss_seconds || 22;
          racer.totalTime += pitLoss + Utils.rand(-0.5, 1.5);
          this.addCommentary(`🔧 ${racer.code} masuk pit lane!`);
          if (typeof UI !== "undefined" && UI.updatePlayerControlsHUD)
            UI.updatePlayerControlsHUD();
          continue;
        }

        // === TYRE & ERS UPDATE ===
        this.updateTyre(racer, trackChars);
        this.updateERS(racer, currentPoint);

        // === SECTOR BONUS ===
        const sectorKey = `sector_${currentPoint.sector}`;
        const sectorType =
          sectorWeights[sectorKey] ||
          sectorWeights[`sector${currentPoint.sector}`] ||
          "top_speed";
        const sectorBonus = this.calculateSectorBonus(racer, sectorType);

        // === PACE CALCULATION (Simulation Pipeline) ===
        // 1. Base speed from track point
        let baseSpeed = currentPoint.speed;

        // 2. Weather & track evolution
        baseSpeed *=
          (this.weatherState?.gripModifier || 1.0) *
          (this.weatherState?.trackEvolution || 1.0);

        // 3. Car + Driver pace
        const paceModifier = 0.78 + racer.paceStat / 410;
        baseSpeed *= Utils.clamp(paceModifier, 0.85, 1.18);

        // 4. Tyre grip
        baseSpeed *= racer.tyreGrip;

        // 5. Setup match bonus
        baseSpeed *= 1 + (racer.setupMatch - 0.5) * 0.06;

        // 6. ERS boost on straights
        const ersMode =
          Utils.ERS_MODES[racer.ersMode] || Utils.ERS_MODES.balanced;
        const isStraight = currentPoint.zone?.includes("Straight");
        if (isStraight && racer.ersCharge > 5) {
          baseSpeed *= 1 + ersMode.speed_boost * (racer.ersQuality / 100);
        }

        // 7. Sector bonus
        baseSpeed += sectorBonus * 2;

        // 8. Dirty air / DRS / Slipstream (Point #9)
        racer.drsOpen = false;
        const prevRacer = i > 0 ? this.currentGrid[i - 1] : null;
        if (prevRacer && !prevRacer.finished && !prevRacer.isPitting) {
          const gap = racer.totalTime - prevRacer.totalTime;
          if (gap < 2.0 && gap > 0) {
            // Slipstream (up to 2s gap) boosts straight speed
            if (isStraight) {
              baseSpeed *= 1 + 0.02 * (1 - gap / 2.0);
            }
            // Dirty air penalty in corners
            if (!isStraight) {
              const dirtyAirPenalty =
                ((trackChars.dirty_air_severity || 50) / 100) *
                (1 - gap / 2.0) *
                0.04;
              baseSpeed *= 1 - dirtyAirPenalty;
            }
            // DRS boost on straights
            if (
              isStraight &&
              gap < 1.0 &&
              racer.currentLap >= 1 &&
              this.sim.mode === "RACE" &&
              this.scState === Utils.SC_STATES.NONE
            ) {
              const drsBoost =
                ((((trackChars.drs_effectiveness || 70) / 100) *
                  racer.drsEfficiency) /
                  100) *
                0.035;
              baseSpeed *= 1 + drsBoost;
              racer.drsOpen = true;
            }
          }
        }

        // 9. Driving style
        if (racer.drivingStyle === "fast") {
          baseSpeed *= 1.04;
        } else if (racer.drivingStyle === "slow") {
          baseSpeed *= 0.94;
        }

        // 10. Safety Car
        if (this.scState === Utils.SC_STATES.SC) {
          baseSpeed = Math.min(baseSpeed, currentPoint.speed * 0.5);
        } else if (this.scState === Utils.SC_STATES.VSC) {
          baseSpeed *= 0.7;
        } else if (this.scState === Utils.SC_STATES.RED_FLAG) {
          baseSpeed = 0;
        }

        // 11. Wet skill bonus for drivers with rain_master trait
        if (
          this.weatherState?.condition !== "dry" &&
          racer.traits.includes("rain_master")
        ) {
          baseSpeed *= 1.015;
        }

        // 12. Human error
        const errorLoss = this.checkDriverError(racer);
        if (racer.dnf) continue;
        if (errorLoss > 0) {
          racer.totalTime += errorLoss * 0.001; // Small penalty
          // Spawn lockup smoke if large enough error
          if (errorLoss > 0.1 && errorLoss < 2) {
            if (racer.isPlayer && Math.random() > 0.5)
              this.sim.teamEvents.push({
                lap: racer.currentLap,
                text: "📻 Ban mengunci! Hati-hati jaga suhu ban!",
              });
            for (let p = 0; p < 6; p++) {
              this.sim.particles.push({
                x: currentPoint.x + Utils.rand(-4, 4),
                y: currentPoint.y + Utils.rand(-4, 4),
                life: 1.0,
                vx: Utils.rand(-0.8, 0.8),
                vy: Utils.rand(-0.8, 0.8),
              });
            }
          }
        }

        // Check Sector Crossing
        if (currentPoint.sector !== racer.currentSector) {
          const timeInSector = racer.totalTime - racer.sectorEntryTime;
          const s = racer.currentSector;
          racer.lastSectorTimes[s] = timeInSector;
          if (timeInSector < racer.bestSectorTimes[s])
            racer.bestSectorTimes[s] = timeInSector;
          if (timeInSector < this.sim.fastestSectors[s])
            this.sim.fastestSectors[s] = timeInSector;
          racer.currentSector = currentPoint.sector || 1;
          racer.sectorEntryTime = racer.totalTime;
        }

        // === FUEL CONSUMPTION ===
        let fuelRate =
          0.003 *
          (1 + ((trackChars.fuel_consumption || 65) - 60) / 100) *
          (1 - Utils.clamp((racer.fuelEfficiency - 72) / 260, -0.07, 0.12));
        if (racer.drivingStyle === "fast") fuelRate *= 1.3;
        else if (racer.drivingStyle === "slow") fuelRate *= 0.7;
        if (this.scState !== Utils.SC_STATES.NONE) fuelRate *= 0.3;
        racer.fuel = Math.max(0, racer.fuel - fuelRate);

        // Low fuel penalty
        if (racer.fuel < 10) baseSpeed *= 0.92;
        if (racer.fuel <= 0) {
          baseSpeed *= 0.6;
        }

        // === MOVEMENT ===
        racer.currentSpeed += (baseSpeed - racer.currentSpeed) * 0.06;
        const speedFactor = racer.currentSpeed / 100;
        const stepMove = Math.max(1, Math.round(speedFactor * 1.35));
        const nextProgress = racer.progress + stepMove;

        racer.progress = nextProgress % totalPoints;
        racer.totalTime += 0.03 / Math.max(0.45, racer.currentSpeed / 190);

        // Randomness layer
        racer.totalTime += Utils.rand(-0.0002, 0.0002);

        // === LAP COMPLETION ===
        if (nextProgress >= totalPoints && racer.currentLap < maxLaps) {
          racer.currentLap++;
          const lapTime = racer.totalTime - racer.lapStartTime;
          racer.lastLapTime = lapTime;
          racer.lapStartTime = racer.totalTime;

          if (lapTime < racer.bestLapTime) racer.bestLapTime = lapTime;

          // Track fastest lap
          if (lapTime < this.sim.fastestLapTime && racer.currentLap > 1) {
            this.sim.fastestLapTime = lapTime;
            this.sim.fastestLapId = racer.id;
            if (racer.isPlayer)
              this.sim.teamEvents.push({
                lap: racer.currentLap,
                text: `📻 FASTEST LAP! Waktu: ${Utils.formatRaceTime(lapTime)}`,
              });
          }

          lapChanged = true;

          if (racer.isPlayer) {
            if (this.sim.domCache.lapHud)
              this.sim.domCache.lapHud.innerText = Math.min(
                racer.currentLap + 1,
                maxLaps
              );
          }

          // Mechanical DNF check at lap completion
          this.checkMechanicalDNF(racer);
        }

        if (
          racer.currentLap >= maxLaps ||
          (this.sim.leaderFinished && nextProgress >= totalPoints)
        ) {
          racer.finished = true;
          racer.progress = 0;
          this.sim.leaderFinished = true;
        }
      }
    }

    // === WEATHER UPDATE per lap ===
    const playerCar = this.currentGrid.find((r) => r.isPlayer && !r.finished);
    if (playerCar && lapChanged) {
      Weather.updateLap(this.weatherState, playerCar.currentLap);
      this.checkIncidents(playerCar.currentLap);

      if (this.sim.domCache.weatherHud) {
        this.sim.domCache.weatherHud.innerText = `${Weather.getLabel(
          this.weatherState
        )} — ${this.currentCircuit?.name || "Track"}`;
      }
    }

    // === UPDATE TELEMETRY ===
    if (playerCar) {
      const activePoint = this.sim.trackPoints[playerCar.progress];
      const dom = this.sim.domCache;
      if (dom.telemetryLap)
        dom.telemetryLap.innerText = `${playerCar.currentLap} / ${maxLaps}`;
      if (dom.telemetrySpeed)
        dom.telemetrySpeed.innerText = `${Math.round(
          playerCar.currentSpeed
        )} km/h`;
      if (dom.telemetrySector && activePoint)
        dom.telemetrySector.innerText = `Sector ${activePoint.sector}`;
      if (dom.telemetryZone && activePoint)
        dom.telemetryZone.innerText = `${activePoint.zone}`;
      if (dom.telemetryErs)
        dom.telemetryErs.innerText = `${Math.round(playerCar.ersCharge)}%`;
    }

    // === SORT STANDINGS ===
    this.currentGrid.sort((a, b) => {
      if (a.dnf !== b.dnf) return a.dnf ? 1 : -1;
      if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      if (a.currentLap !== b.currentLap) return b.currentLap - a.currentLap;
      if (!a.finished && !b.finished && a.progress !== b.progress)
        return b.progress - a.progress;
      return a.totalTime - b.totalTime;
    });

    // === UPDATE GAPS ===
    // === UPDATE GAPS AND STANDINGS ===
    const leader = this.currentGrid[0];
    if (leader) {
      this.currentGrid.forEach((racer, idx) => {
        racer.prevPosition = racer.position || idx + 1;
        racer.position = idx + 1;

        if (
          racer.isPlayer &&
          racer.position < racer.prevPosition &&
          racer.currentLap > 0
        ) {
          this.sim.teamEvents.push({
            lap: racer.currentLap,
            text: `📻 BAGUS! Kamu naik ke P${racer.position}`,
          });
        }

        if (racer.dnf) racer.gapText = "DNF";
        else if (racer.eliminated) racer.gapText = "OUT";
        else if (idx === 0) racer.gapText = "LEADER";
        else
          racer.gapText = Utils.formatGap(racer.totalTime - leader.totalTime);
      });
    }

    // === RENDER ===
    if (typeof UI !== "undefined" && UI.renderLiveStandings)
      UI.renderLiveStandings(this.currentGrid);
    this.drawCars();

    // === CHECK SESSION END ===
    const allDone = this.currentGrid.every(
      (r) => r.finished || r.eliminated || r.dnf
    );
    sessionFinished = allDone;

    if (sessionFinished) {
      this.finishSession();
      return;
    }

    this.sim.animationId = requestAnimationFrame(() => this.gameLoop());
  },

  // =============================================
  // SESSION FINISH & RESULTS
  // =============================================
  finishSession() {
    this.sim.isRunning = false;
    if (this.sim.animationId) cancelAnimationFrame(this.sim.animationId);

    // Final sort
    this.currentGrid.sort((a, b) => {
      if (a.dnf !== b.dnf) return a.dnf ? 1 : -1;
      if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
      return a.totalTime - b.totalTime;
    });

    const results = this.currentGrid.map((r, i) => ({
      pos: i + 1,
      id: r.id,
      name: r.name,
      code: r.code,
      teamName: r.teamName,
      time: r.dnf ? "DNF" : r.gapText,
      isPlayer: r.isPlayer,
      compound: r.tyreCompound,
      pitCount: r.pitCount,
      bestLap:
        r.bestLapTime < Infinity ? Utils.formatRaceTime(r.bestLapTime) : "-",
      fastestLap: r.id === this.sim.fastestLapId,
      dnf: r.dnf,
      dnfReason: r.dnfReason,
    }));

    const weekend = this.getWeekendData(State.currentRound);

    if (this.sim.stage === "FP") {
      weekend.fp = { laps: this.sim.targetLaps, results };
    } else if (this.sim.stage === "Q1") {
      weekend.q1 = { results };
      weekend.qualifyingGrid = results;
      this.addCommentary("Q1 selesai! Bottom 5 tersingkir.");
    } else if (this.sim.stage === "Q2") {
      weekend.q2 = { results };
      weekend.qualifyingGrid = [
        ...results.filter((r) => !r.dnf).slice(0, 10),
        ...weekend.q1.results.slice(10),
      ];
      this.addCommentary("Q2 selesai! Top 10 maju ke Q3!");
    } else if (this.sim.stage === "Q3") {
      weekend.q3 = { results };
      const q3Top10 = results.filter((r) => !r.dnf).slice(0, 10);
      weekend.qualifyingGrid = [
        ...q3Top10,
        ...(weekend.q2 ? weekend.q2.results.slice(10, 15) : []),
        ...weekend.q1.results.slice(15),
      ];
      weekend.qualifyingComplete = true;
      this.addCommentary("🏁 Qualifying selesai! Grid race sudah ditentukan!");
    } else if (this.sim.mode === "RACE") {
      // Award points!
      const pointsAwarded = {};
      results.forEach((r) => {
        if (r.dnf) return;
        const pts = Utils.POINTS_TABLE[r.pos - 1] || 0;
        const flPt = r.fastestLap && r.pos <= 10 ? Utils.FASTEST_LAP_POINT : 0;
        const totalPts = pts + flPt;
        if (totalPts > 0) {
          pointsAwarded[r.id] = totalPts;
          if (!State.driverPoints) State.driverPoints = {};
          State.driverPoints[r.id] = (State.driverPoints[r.id] || 0) + totalPts;
        }
      });

      // Prize money
      const prizeMoney = this.calculatePrizeMoney(results);
      State.budget = (State.budget || 0) + prizeMoney;

      weekend.race = {
        results,
        rewards: { points: pointsAwarded, money: prizeMoney },
      };
      this.addCommentary(`🏆 Race selesai! Poin diberikan!`);

      // Advance season
      State.currentRound++;
    }

    this.saveGame();
    this.currentGrid = []; // Reset grid for next session

    if (typeof UI !== "undefined") {
      if (this.sim.mode === "RACE") {
        UI.renderRaceDebrief(results, weekend.race.rewards);
      } else {
        UI.openSessionPanel(this.sim.mode === "Q" ? "Q" : this.sim.mode);
      }
    }
  },

  calculatePrizeMoney(results) {
    const playerResults = results.filter((r) => r.isPlayer && !r.dnf);
    let total = 0;
    playerResults.forEach((r) => {
      if (r.pos <= 3) total += 15000000000;
      else if (r.pos <= 6) total += 8000000000;
      else if (r.pos <= 10) total += 4000000000;
      else total += 1500000000;
    });
    return total;
  },

  // =============================================
  // RENDERING
  // =============================================

  getCanvasScale() {
    if (!this.sim.domCache.canvas) return { x: 1, y: 1 };
    const rect = this.sim.domCache.canvas.getBoundingClientRect();
    // Resolusi asli track_layouts.js adalah 900x550
    return {
      x: rect.width / 900,
      y: rect.height / 550,
    };
  },

  drawTrack() {
    if (!this.sim.ctx || this.sim.trackPoints.length === 0) return;
    const ctx = this.sim.ctx;
    const scale = this.getCanvasScale();

    ctx.lineWidth = 12 * Math.min(scale.x, scale.y); // Skalakan ketebalan lintasan
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Track color changes with weather
    if (this.weatherState?.condition === "storm") ctx.strokeStyle = "#3a3c49";
    else if (this.weatherState?.condition === "wet")
      ctx.strokeStyle = "#4a4c59";
    else if (this.weatherState?.condition === "damp")
      ctx.strokeStyle = "#3e4050";
    else ctx.strokeStyle = "#333544";

    ctx.beginPath();
    ctx.moveTo(
      this.sim.trackPoints[0].x * scale.x,
      this.sim.trackPoints[0].y * scale.y
    );
    for (let i = 1; i < this.sim.trackPoints.length; i++) {
      ctx.lineTo(
        this.sim.trackPoints[i].x * scale.x,
        this.sim.trackPoints[i].y * scale.y
      );
    }
    ctx.closePath();
    ctx.stroke();

    // Finish line
    const fl = this.sim.trackPoints[0];
    ctx.fillStyle = "white";
    ctx.fillRect(fl.x * scale.x - 2, fl.y * scale.y - 15, 4, 30);

    // SC indicator
    if (this.scState !== Utils.SC_STATES.NONE) {
      ctx.fillStyle =
        this.scState === Utils.SC_STATES.RED_FLAG ? "#ff0000" : "#ffcc00";
      ctx.font = "bold 16px monospace";
      ctx.fillText(
        this.scState === Utils.SC_STATES.RED_FLAG
          ? "🔴 RED FLAG"
          : this.scState === Utils.SC_STATES.SC
          ? "🟡 SAFETY CAR"
          : "🟡 VSC",
        350,
        30
      );
    }
  },

  drawCars() {
    if (!this.sim.ctx || this.sim.trackPoints.length === 0) return;
    const ctx = this.sim.ctx;

    // 1. Ambil rasio skala canvas
    const scale = this.getCanvasScale();
    const minScale = Math.min(scale.x, scale.y); // Untuk menjaga proporsi ukuran lingkaran/font

    // Update and draw particles (Efek Asap Lockup)
    for (let i = this.sim.particles.length - 1; i >= 0; i--) {
      let p = this.sim.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      if (p.life <= 0) {
        this.sim.particles.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      // Kalikan posisi dan ukuran asap dengan skala
      ctx.arc(
        p.x * scale.x,
        p.y * scale.y,
        Math.max(1, 4 * p.life) * minScale,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(180, 180, 180, ${p.life * 0.6})`;
      ctx.fill();
    }

    const renderOrder = [...this.currentGrid].sort(
      (a, b) => b.progress - a.progress
    );
    const progressCounts = {};
    renderOrder.forEach((r) => {
      progressCounts[r.progress] = (progressCounts[r.progress] || 0) + 1;
      r.overlapIndex = progressCounts[r.progress] - 1;
    });

    for (let i = 0; i < renderOrder.length; i++) {
      let racer = renderOrder[i];
      if (racer.finished || racer.eliminated || racer.dnf) continue;

      let point = this.sim.trackPoints[racer.progress];
      if (!point) continue;

      if (racer.isPitting) {
        ctx.fillStyle = "#ff6600";
        // Skalakan ukuran font PIT
        const fontSize = Math.max(8, 10 * minScale);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillText("PIT", (point.x - 10) * scale.x, (point.y + 20) * scale.y);
        continue;
      }

      // 2. Terapkan skala pada posisi titik aktual di canvas
      const px = (point.x + racer.overlapIndex * 4) * scale.x;
      const py = (point.y + racer.overlapIndex * 4) * scale.y;

      // Ukuran dinamis untuk dot mobil dan cincin ban
      const carSize = 5 * minScale;
      const ringSize = 7 * minScale;

      // DRS indicator line (behind car)
      if (racer.drsOpen) {
        ctx.beginPath();
        // Skalakan panjang garis DRS
        ctx.moveTo(px - 10 * scale.x, py);
        ctx.lineTo(px, py);
        ctx.strokeStyle = "#00ff87";
        ctx.lineWidth = 2 * minScale;
        ctx.stroke();
      }

      // Car dot
      ctx.beginPath();
      ctx.arc(px, py, carSize, 0, Math.PI * 2);
      ctx.fillStyle = racer.color || "#ffffff";
      ctx.fill();

      // Lingkaran highlight player
      if (racer.isPlayer) {
        ctx.lineWidth = 2 * minScale;
        ctx.strokeStyle = "#00ff87";
        ctx.stroke();
      }

      // Tyre compound indicator color ring
      const compoundColor =
        Utils.TYRE_COMPOUNDS[racer.tyreCompound]?.color || "#ffffff";
      ctx.beginPath();
      ctx.arc(px, py, ringSize, 0, Math.PI * 2);
      ctx.strokeStyle = compoundColor;
      ctx.lineWidth = 1.5 * minScale;
      ctx.stroke();

      // Label Nama/Kode
      if (racer.isPlayer || racer.position <= 5) {
        ctx.fillStyle = "white";
        // Skalakan ukuran font label agar tidak kebesaran/kekecilan
        const labelSize = Math.max(7, 9 * minScale);
        ctx.font = `bold ${labelSize}px monospace`;
        ctx.fillText(racer.code, px + 9 * scale.x, py + 3 * scale.y);
      }
    }
  },

  getCanvasScale() {
    if (!this.sim.domCache.canvas) return { x: 1, y: 1 };
    const rect = this.sim.domCache.canvas.getBoundingClientRect();
    // Resolusi awal koordinat di track_layouts.js
    return {
      x: rect.width / 900,
      y: rect.height / 550,
    };
  },
};
