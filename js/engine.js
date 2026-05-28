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
  },

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  rand(min, max) {
    return min + Math.random() * (max - min);
  },

  avg(values) {
    const filtered = values.filter((value) => typeof value === "number" && !Number.isNaN(value));
    return filtered.length ? filtered.reduce((sum, value) => sum + value, 0) / filtered.length : 75;
  },

  getWeekendData(round = State.currentRound) {
    if (!State.raceWeekends) State.raceWeekends = {};
    if (!State.raceWeekends[round]) {
      State.raceWeekends[round] = { round, fp: null, q1: null, q2: null, qualifyingGrid: null, qualifyingComplete: false, race: null };
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

  // Koordinat Sirkuit Sakhir Bahrain
  keyPoints: [
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

  // MENINGKATKAN RESOLUSI TREK: Membuat titik koordinat jauh lebih padat agar lap time terasa realistis
  initTrack() {
    if (this.sim.trackPoints.length > 0) return;
    let points = [];
    for (let i = 0; i < this.keyPoints.length; i++) {
      let p1 = this.keyPoints[i];
      let p2 = this.keyPoints[(i + 1) % this.keyPoints.length];

      // Ditambah 5x lipat dari versi sebelumnya agar mobil tidak melesat instan
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
    this.sim.trackPoints = points;
  },

  // Membangun seluruh susunan 20 pembalap F1
  generateGrid() {
    let grid = [];
    const playerCar = { pu: State.pu, chassis: State.chassis };
    const playerStaff = { teamChief: State.teamChief, techChief: State.techChief };
    // Masukkan Driver Player 1 & 2
    grid.push(
      this.buildRacer(
        State.drivers[0],
        playerCar,
        playerStaff,
        true,
        State.teamColor || "#e10600"
      )
    );
    grid.push(
      this.buildRacer(
        State.drivers[1],
        playerCar,
        playerStaff,
        true,
        State.teamColor || "#e10600"
      )
    );

    // Saring dan masukkan AI Driver dari database master
    const aiDrivers = Data.drivers
      .filter(
        (d) => d.id !== State.drivers[0].id && d.id !== State.drivers[1].id
      )
      .slice(0, 18);
    aiDrivers.forEach((d) => {
      const aiTeam = Data.teams.find((t) => t.id === d.team_id);
      const aiPU =
        Data.power_units.find((p) =>
          p.manufacturer.toLowerCase().includes(aiTeam.power_unit.supplier)
        ) || Data.power_units[0];
      const aiChassis =
        Data.chassis.find((c) => c.team_id === aiTeam.id) || Data.chassis[0];
      const aiStaff = {
        teamChief: Data.team_chiefs.find((chief) => chief.team_id === aiTeam.id),
        techChief: Data.tech_chiefs.find((chief) => chief.team_id === aiTeam.id),
        team: aiTeam,
      };

      grid.push(
        this.buildRacer(
          d,
          { pu: aiPU, chassis: aiChassis },
          aiStaff,
          false,
          aiTeam.color || "#8b92b3"
        )
      );
    });
    return grid;
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
    const teamChiefStats = (staff && staff.teamChief && staff.teamChief.stats) || {};
    const techChiefStats = (staff && staff.techChief && staff.techChief.stats) || {};
    const team = (staff && staff.team) || null;
    const teamSporting = (team && team.sporting_profile) || {};
    const teamInfra = (team && team.infrastructure) || {};
    const teamForm = (team && team.performance_state) || {};

    const driverSkill = this.avg([d.overall, d.cornering, d.braking, d.reactiveness, d.control, d.accuracy]);
    const raceCraft = this.avg([d.overtaking, d.defending, d.smoothness, d.adaptability]);
    const carPace = this.avg([
      chassisStats.overall_performance,
      puStats.overall_performance,
      aero.aero_efficiency,
      aero.high_speed_cornering,
      mechanical.traction,
      perf.top_speed,
      perf.acceleration,
    ]);
    const tyreManagement = this.avg([d.smoothness, perf.tyre_preservation, techChiefStats.tyre_management_design, teamSporting.tyre_management]);
    const fuelEfficiency = this.avg([perf.fuel_efficiency, puStats.internal_combustion && puStats.internal_combustion.fuel_efficiency]);
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
    const totalPace = driverSkill * 0.34 + carPace * 0.38 + raceCraft * 0.12 + staffBoost * 0.1 + reliabilityScore * 0.06;
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
    if (weatherHud) weatherHud.innerText = `${this.weather} - ${this.currentCircuit ? this.currentCircuit.name : "Track"}`;
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
        UI.renderSessionResults(data.fp.results, `FP RESULTS - ${data.fp.laps} LAPS`);
        return;
      }
      const lapsInput = document.getElementById("input-fp-laps");
      this.sim.targetLaps = this.clamp(parseInt(lapsInput && lapsInput.value, 10) || 2, 1, 5);
    }

    if (mode === "Q1" && data.q1) return UI.openSessionPanel("Q");
    if (mode === "Q2" && (!data.q1 || data.q2)) return UI.openSessionPanel("Q");
    if (mode === "RACE") {
      if (data.race) return UI.renderSessionResults(data.race.results, "RACE RESULTS");
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
      ? Data.circuits.find((circuit) => circuit.id === currentEvent.circuit_id)
      : Data.circuits.find((circuit) => circuit.id === "bahrain") || Data.circuits[0];

    const stats = (this.currentCircuit && this.currentCircuit.game_stats) || {};
    const rainRoll = Math.random() * 100;
    const rainChance = stats.rain_chance || 10;
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

    const modeEvolution = this.sim.mode === "FP" ? 0.94 : this.sim.mode === "Q" ? 1.04 : 1;
    this.weather = weatherLabel;
    this.sim.weatherLabel = weatherLabel;
    this.sim.weatherGrip = weatherGrip;
    this.sim.trackEvolution = this.clamp(((stats.track_evolution || 75) / 100) * modeEvolution, 0.82, 1.08);
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
        driver.drivingStyle = this.sim.stage === "Q1" || this.sim.stage === "Q2" ? "fast" : (this.sim.stage === "FP" ? "slow" : "stable");
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
    if (this.sim.stage === "FP") return "FP dimulai: tim fokus mengumpulkan data setup, long run, dan tyre behaviour.";
    if (this.sim.stage === "Q1") return "Q1 dimulai: semua pembalap mengejar banker lap, hanya 10 tercepat lolos ke Q2.";
    if (this.sim.stage === "Q2") return "Q2 dimulai: top 10 bertarung menentukan pole position dan starting grid.";
    return "Race dimulai: strategi, tyre wear, pit stop, dan ERS akan menentukan hasil akhir.";
  },

  // ENGINE GAME LOOP: Mengatur Pergerakan & Render Grafis Mobil F1
  loop() {
    // Jika simulasi dihentikan, keluar dari loop
    if (!this.sim.isRunning) return;

    const canvas = this.ctx.canvas;
    // Bersihkan kanvas untuk frame baru (anti bayangan mengekor)
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tentukan batas total lap berdasarkan jenis sesi
    const maxLaps = this.sim.mode === "RACE" ? 5 : 1;
    let sessionFinished = false;

    // Ambil multiplier kecepatan (jaka ada fitur 1x, 2x, 3x speed, default ke 1)
    const speedMultiplier = this.sim.speed || 1;

    // 1. UPDATE LOGIC: Hitung Pergerakan Mobil
    this.currentGrid.forEach((driver) => {
      // Jika pembalap sudah finish, jangan gerakkan lagi
      if (driver.lap > maxLaps) return;

      // Rumus kecepatan berbasis rating pembalap + faktor keberuntungan acak
      const baseSpeed = driver.rating / 18 + Math.random() * 1.5;
      driver.x += baseSpeed * speedMultiplier;

      // Akumulasi waktu balap (makin tinggi rating, waktu tambahannya makin kecil/cepat)
      driver.totalTime += (100 - driver.rating) * 0.001 + Math.random() * 0.02;

      // Cek jika mobil melewati garis finish di ujung kanan kanvas
      if (driver.x > canvas.width - 60) {
        driver.x = 50; // Kembalikan ke garis start di sebelah kiri
        driver.lap++;

        // Jika mobil player yang lewat, perbarui teks Lap di HUD HTML
        if (driver.isPlayer) {
          const lapHud = document.getElementById("hud-lap");
          if (lapHud) lapHud.innerText = Math.min(driver.lap, maxLaps);
        }

        // Jika ada satu pembalap yang menyelesaikan lap maksimum, tandai sesi selesai
        if (driver.lap > maxLaps) {
          sessionFinished = true;
        }
      }
    });

    // 2. RENDER LOGIC: Menggambar Lintasan dan Mobil di Kanvas
    this.currentGrid.forEach((driver, index) => {
      // Menggambar garis lintasan abu-abu tipis untuk tiap mobil
      this.ctx.strokeStyle = "#222533";
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(40, driver.y + 4);
      this.ctx.lineTo(canvas.width - 40, driver.y + 4);
      this.ctx.stroke();

      // Menggambar Mobil (Kotak Berwarna sesuai Tim)
      this.ctx.fillStyle = driver.color;
      this.ctx.fillRect(driver.x, driver.y, 16, 9); // Ukuran kotak mobil f1

      // Menggambar Text Singkatan Nama Pembalap (Driver Code) di atas mobil
      this.ctx.fillStyle = driver.isPlayer ? "var(--f1-neon)" : "#ffffff";
      this.ctx.font = "bold 10px monospace";
      this.ctx.fillText(driver.code, driver.x, driver.y - 4);
    });

    // 3. KONDISI SELESAI BALAPAN
    if (sessionFinished) {
      this.finishSession();
      return; // Hentikan loop animasi
    }

    // Perintahkan browser untuk memanggil fungsi loop ini lagi di frame berikutnya
    this.sim.animationId = requestAnimationFrame(() => this.loop());
  },

  setDrivingStyle(style, btnElement, driverIndex = 0) {
    this.sim.playerDrivingStyle = style;
    const playerCars = this.currentGrid.filter((racer) => racer.isPlayer);
    if (playerCars[driverIndex]) playerCars[driverIndex].drivingStyle = style;
    UI.updatePlayerControlsHUD();
  },

  pitStop(driverIndex = 0) {
    const playerCar = this.currentGrid.filter((r) => r.isPlayer)[driverIndex];
    if (playerCar && !playerCar.isPitting && !playerCar.pitRequested) {
      playerCar.pitRequested = true;
      this.addCommentary(`${playerCar.code} dipanggil masuk pit. Menunggu masuk pit lane.`);
      UI.updatePlayerControlsHUD();
    }
  },

  toggleSim() {
    this.sim.isRunning = !this.sim.isRunning;
    const btn = document.getElementById("btn-play");
    btn.innerText = this.sim.isRunning
      ? "PAUSE SIMULATION"
      : "RESUME SIMULATION";
    btn.classList.toggle("btn-active", this.sim.isRunning); // Set active class based on isRunning
    if (this.sim.isRunning) this.gameLoop();
  },

  toggleERS(driverIndex = 0) {
    // Player mengaktifkan ERS untuk mobil pembalap utamanya (indeks 0)
    const playerCar = this.currentGrid.filter((r) => r.isPlayer)[driverIndex];
    if (playerCar && playerCar.ersCharge > 0) {
      playerCar.ersActive = !playerCar.ersActive;
      this.addCommentary(`${playerCar.code} ${playerCar.ersActive ? "mengaktifkan" : "mematikan"} ERS.`);
      UI.updatePlayerControlsHUD();
    }
  },

  setSimSpeed(multiplier, btnElement) {
    this.sim.simSpeed = multiplier;
    document
      .querySelectorAll(".btn-speed")
      .forEach((b) => b.classList.remove("btn-active"));
    btnElement.classList.add("btn-active");
  },

  drawTrack() {
    const ctx = this.sim.ctx;
    const kp = this.keyPoints;

    // Aspal Sirkuit Gelap
    ctx.beginPath();
    ctx.lineWidth = 26;
    ctx.strokeStyle = "#1e213a";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(kp[0].x, kp[0].y);
    for (let i = 1; i < kp.length; i++) ctx.lineTo(kp[i].x, kp[i].y);
    ctx.closePath();
    ctx.stroke();

    // Garis Kerb Putih-Merah F1 di Sisi Dalam Lintasan
    ctx.beginPath();
    ctx.lineWidth = 22;
    ctx.strokeStyle = "#2d324d";
    ctx.moveTo(kp[0].x, kp[0].y);
    for (let i = 1; i < kp.length; i++) ctx.lineTo(kp[i].x, kp[i].y);
    ctx.closePath();
    ctx.stroke();

    // Garis Tengah Putih (Dotted)
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.setLineDash([6, 12]);
    ctx.moveTo(kp[0].x, kp[0].y);
    for (let i = 1; i < kp.length; i++) ctx.lineTo(kp[i].x, kp[i].y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Garis Start/Finish Kotak-Kotak
    ctx.save();
    ctx.translate(650, 500);
    ctx.fillStyle = "#fff";
    ctx.fillRect(-2, -13, 4, 26);
    ctx.fillStyle = "#000";
    ctx.fillRect(-2, -13, 2, 6);
    ctx.fillRect(0, -7, 2, 6);
    ctx.fillRect(-2, 0, 2, 6);
    ctx.fillRect(0, 7, 2, 6);
    ctx.restore();

    // Teks Penanda Sektor Telemetri
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "bold 11px monospace";
    ctx.fillText("SECTOR 1", 110, 240);
    ctx.fillText("SECTOR 2", 400, 435);
    ctx.fillText("SECTOR 3", 750, 260);

    ctx.fillStyle = "rgba(0,255,135,0.16)";
    ctx.fillRect(350, 490, 300, 18);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(350, 456, 300, 10);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "bold 10px monospace";
    ctx.fillText("DRS / ERS DEPLOYMENT", 430, 485);
    ctx.fillText("PIT LANE", 470, 452);
  },

  // MERENDER SELURUH 20 PION PEMBALAP DI KANVAS
  drawCars() {
    const ctx = this.sim.ctx;

    // Render dari posisi paling belakang agar pemimpin balapan selalu bertumpuk di paling atas luar
    for (let i = this.currentGrid.length - 1; i >= 0; i--) {
      const racer = this.currentGrid[i];
      if (racer.finished) continue;

      const point = this.sim.trackPoints[racer.progress];
      if (!point) continue;
      const drawX = point.x;
      const drawY = racer.isPitting ? point.y - 34 : point.y;

      // Efek Aura Cahaya Glow (Pembalap Player dibuat bercahaya lebih besar)
      ctx.beginPath();
      ctx.arc(drawX, drawY, racer.isPlayer ? 11 : 7, 0, Math.PI * 2);
      ctx.fillStyle = racer.ersActive
        ? "rgba(0, 255, 135, 0.4)"
        : `${racer.color}55`;
      ctx.fill();

      // Inti Lingkaran Pion Mobil
      ctx.beginPath();
      ctx.arc(drawX, drawY, racer.isPlayer ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = racer.ersActive ? "#00ff87" : racer.color;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = racer.isPlayer ? 2 : 1;
      ctx.fill();
      ctx.stroke();

      // Berikan Teks Kode Driver (misal: VER, HAM, RUS) di dekat pion jika diinginkan
      if (this.sim.simSpeed <= 2) {
        ctx.fillStyle = "#ffffff";
        ctx.font = racer.isPlayer ? "bold 9px Arial" : "8px Arial";
        ctx.fillText(racer.code, drawX + 8, drawY + 3);
      }
    }
  },

  gameLoop() {
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

        if (racer.pitRequested && currentPoint.zone.includes("Main Straight") && currentPoint.x >= 350 && currentPoint.x <= 650) {
          racer.isPitting = true;
          racer.pitStopProgress = racer.pitStopDuration;
          racer.currentSpeed = 0;
          racer.drivingStyle = "slow";
          racer.totalTime += this.rand(19, 24);
          this.addCommentary(`${racer.code} masuk pit lane. Stop berlangsung, ban dan fuel disegarkan.`);
          UI.updatePlayerControlsHUD();
          return;
        }

        const circuitStats = (this.currentCircuit && this.currentCircuit.game_stats) || {};
        const setup = circuitStats.setup || {};
        const chassis = (racer.car && racer.car.chassis) || {};
        const chassisStats = chassis.stats || {};
        const aero = chassisStats.aerodynamics || {};
        const mechanical = chassisStats.mechanical || {};
        const perf = chassisStats.performance || {};
        const puStats = (racer.car && racer.car.pu && racer.car.pu.stats) || {};
        const isCorner = currentPoint.speed < 190;
        const carMatch = isCorner
          ? this.avg([aero.low_speed_cornering, aero.medium_speed_cornering, mechanical.traction, mechanical.kerb_riding])
          : this.avg([perf.top_speed, perf.acceleration, puStats.internal_combustion && puStats.internal_combustion.horsepower, aero.drs_efficiency]);
        const trackNeed = isCorner
          ? this.avg([setup.downforce, setup.traction, setup.kerb_riding])
          : this.avg([setup.top_speed, circuitStats.engine_stress, 65]);
        const driverSegment = isCorner
          ? this.avg([racer.driverSkill, racer.raceCraft, racer.tyreManagement])
          : this.avg([racer.driverSkill, racer.ersQuality, racer.carPace]);
        const behavior = chassis.car_behavior || {};
        const modeBias = this.sim.mode === "Q"
          ? this.avg([behavior.qualifying_bias, racer.driverSkill])
          : this.sim.mode === "RACE"
            ? this.avg([behavior.race_pace_bias, racer.raceCraft, racer.tyreManagement])
            : this.avg([racer.staffBoost, racer.reliabilityScore]);
        const paceIndex =
          racer.paceStat * 0.38 +
          driverSegment * 0.22 +
          carMatch * 0.22 +
          modeBias * 0.1 +
          (100 - Math.abs(trackNeed - carMatch)) * 0.08 +
          (this.sim.mode === "Q" ? this.rand(-2.6, 2.4) : this.rand(-1.4, 1.4)) +
          Math.sin((racer.totalTime + racer.progress) * 0.017) * this.rand(0.2, 1.1);

        let baseSpeed = currentPoint.speed * this.sim.weatherGrip * this.sim.trackEvolution;
        baseSpeed *= this.clamp(0.78 + paceIndex / 410, 0.86, 1.18);

        let tireConsumptionRate = 0.0055 * (1 + ((circuitStats.tyre_wear || 70) - 60) / 95);
        let fuelConsumptionRate = 0.0042 * (1 + ((circuitStats.fuel_consumption || 65) - 60) / 100);
        tireConsumptionRate *= 1 - this.clamp((racer.tyreManagement - 72) / 240, -0.08, 0.12);
        fuelConsumptionRate *= 1 - this.clamp((racer.fuelEfficiency - 72) / 260, -0.07, 0.12);

        if (this.sim.stage === "FP") {
          baseSpeed *= this.clamp(0.93 + racer.staffBoost / 1800 + this.rand(-0.015, 0.015), 0.92, 1.01);
          tireConsumptionRate *= 0.82;
          fuelConsumptionRate *= 0.9;
        } else if (this.sim.stage === "Q1" || this.sim.stage === "Q2") {
          baseSpeed *= this.clamp(1.02 + racer.driverSkill / 2200 + this.rand(-0.018, 0.02), 1.01, 1.08);
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
          racer.ersCharge = Math.max(0, racer.ersCharge - this.clamp(0.22 - racer.ersQuality / 1200, 0.1, 0.18));
          if (racer.ersCharge <= 0) racer.ersActive = false; // Turn off ERS if depleted
        } else if (racer.isPlayer && !racer.ersActive) {
          racer.ersCharge = Math.min(100, racer.ersCharge + this.clamp(racer.ersQuality / 2500, 0.025, 0.045));
        }

        // Tire wear impact on speed
        if (racer.tireWear < 50) baseSpeed *= 1 - (50 - racer.tireWear) / 100; // Reduce speed by up to 50%
        if (racer.tireWear < 10) baseSpeed *= 0.5; // Significantly slower on very low tires

        // Fuel level impact on speed
        if (racer.fuel < 20) baseSpeed *= 0.9; // 10% slower on low fuel
        if (racer.fuel < 5) baseSpeed *= 0.7; // Significantly slower on very low fuel

        if (this.weather !== "Cerah" && this.weather !== "Berawan") {
          const wetSkill = this.avg([racer.raceCraft, racer.driverSkill, behavior.wet_weather_performance]);
          baseSpeed *= this.clamp(0.9 + wetSkill / 850, 0.9, 1.02);
          tireConsumptionRate *= this.weather === "Hujan Lebat" ? 0.78 : 0.9;
        }

        const reliabilityRisk = (100 - racer.reliabilityScore + (circuitStats.engine_stress || 60) * 0.28 + (circuitStats.brake_stress || 60) * 0.22) / 280000;
        const mistakeRisk = (100 - this.avg([racer.driverSkill, racer.raceCraft, racer.staffBoost]) + (this.weather === "Hujan Lebat" ? 18 : 0)) / 160000;
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
            this.addCommentary(`${racer.code} menyelesaikan lap ${racer.currentLap}. Pace: ${this.formatRaceTime(racer.totalTime)}.`);
          }
        }

        if (racer.currentLap >= maxLaps) {
          // All laps completed and back to start line
          racer.finished = true;
          racer.progress = 0;
        }
      });
    }

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
      document.getElementById(
        "telemetry-lap"
      ).innerText = `${playerCar.currentLap} / ${maxLaps}`;
      const speedEl = document.getElementById("telemetry-speed");
      if (speedEl) speedEl.innerText = `${Math.round(playerCar.currentSpeed)} km/h`;
      document.getElementById(
        "telemetry-sector"
      ).innerText = `Sector ${activePoint.sector}`;
      document.getElementById("telemetry-zone").innerText = `${activePoint.zone} | ${this.weather}`;
      const tireEl = document.getElementById("telemetry-tire");
      const fuelEl = document.getElementById("telemetry-fuel");
      if (tireEl) tireEl.innerText = `${Math.round(playerCar.tireWear)}%`;
      if (fuelEl) fuelEl.innerText = `${Math.round(playerCar.fuel)}%`;

      // Update player controls HUD for tire/fuel status
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

      if (!a.finished && !b.finished && b.progress !== a.progress) return b.progress - a.progress;

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
  },

  updateGaps() {
    const leader = this.currentGrid[0];
    if (!leader) return;

    this.currentGrid.forEach((racer, index) => {
      if (racer.finished) {
        racer.gapText = index === 0 ? "WINNER" : "+" + Math.max(0, racer.totalTime - leader.totalTime).toFixed(1) + "s";
      } else if (index === 0) {
        racer.gapText = "LEADER";
      } else {
        const lapGap = leader.currentLap - racer.currentLap;
        racer.gapText = lapGap > 0 ? `+${lapGap} LAP` : "+" + Math.max(0, racer.totalTime - leader.totalTime).toFixed(1) + "s";
      }
    });
  },

  finishSession() {
    this.sim.isRunning = false;
    if (this.sim.animationId) cancelAnimationFrame(this.sim.animationId);

    this.updateGaps();
    const activeResults = this.currentGrid.filter((racer) => !racer.eliminated);
    let results = activeResults.map((racer, index) => ({
      id: racer.id,
      pos: index + 1,
      name: racer.name,
      code: racer.code,
      isPlayer: racer.isPlayer,
      time: this.sim.mode === "Q" || this.sim.mode === "FP"
        ? this.formatRaceTime(racer.totalTime)
        : (index === 0 ? this.formatRaceTime(racer.totalTime) : racer.gapText),
    }));

    const weekend = this.getWeekendData(this.activeRound || State.currentRound);
    const meta = {
      weather: this.weather,
      circuit: this.currentCircuit ? this.currentCircuit.name : "Track",
      laps: this.sim.targetLaps,
      completedAt: new Date().toISOString(),
    };

    if (this.sim.stage === "FP") {
      weekend.fp = { ...meta, results };
      this.addCommentary("FP selesai: data setup dan tyre behaviour sudah dikumpulkan.");
      UI.renderSessionResults(results, `FP RESULTS - ${meta.laps} LAPS`);
      this.appendNextSessionButton("NEXT: Q1");
    } else if (this.sim.stage === "Q1") {
      weekend.q1 = { ...meta, results };
      this.addCommentary("Q1 selesai: top 10 maju ke Q2, sisanya tereliminasi.");
      UI.renderSessionResults(results, "Q1 RESULTS - TOP 10 ADVANCE TO Q2");
      this.appendNextSessionButton("NEXT: Q2");
    } else if (this.sim.stage === "Q2") {
      const q1Eliminated = weekend.q1 ? weekend.q1.results.slice(10) : [];
      results = results.concat(q1Eliminated).map((r, index) => ({ ...r, pos: index + 1 }));
      weekend.q2 = { ...meta, results: results.slice(0, 10) };
      weekend.qualifyingGrid = results;
      weekend.qualifyingComplete = true;
      State.qualificationResults = results;
      this.addCommentary(`${results[0].code} mengambil pole position. Grid race sudah terkunci.`);
      UI.renderSessionResults(results, "QUALIFYING FINAL RESULTS");
      this.appendNextSessionButton("NEXT: RACE");
    } else if (this.sim.stage === "RACE") {
      const rewards = this.calculatePlayerRewards(results);
      State.budget += rewards.money;
      weekend.race = { ...meta, results, rewards };
      this.addCommentary(`${results[0].code} menang. Tim kamu mendapat ${rewards.points} poin dan hadiah Rp ${rewards.money.toLocaleString("id-ID")}.`);
      UI.renderSessionResults(results, `RACE RESULTS - POINTS ${rewards.points} - Rp ${rewards.money.toLocaleString("id-ID")}`);
      const resultTable = document.getElementById("result-table");
      if (resultTable) {
        resultTable.innerHTML += `<div class="weekend-reward-box"><strong>Race Weekend Complete</strong><span>Poin didapatkan: ${rewards.points}</span><span>Hadiah: Rp ${rewards.money.toLocaleString("id-ID")}</span><button onclick="UI.initRaceWeekend()">NEXT SCHEDULE</button></div>`;
      }
      State.currentRound += 1;
      UI.updateTopBar();
      UI.setupHQ();
    }

    this.saveGame();
    UI.setupRaceSessionButtons();

    const playBtn = document.getElementById("btn-play");
    if (playBtn) {
      playBtn.innerText = "SESSION FINISHED";
      playBtn.classList.remove("btn-active");
    }
  },

  formatRaceTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3).padStart(6, "0");
    return `${mins}:${secs}`;
  },

  calculatePlayerRewards(results) {
    const pointsTable = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    const playerResults = results.filter((result) => result.isPlayer);
    if (!State.driverPoints) State.driverPoints = {};
    const points = playerResults.reduce((sum, result) => {
      const earned = pointsTable[result.pos - 1] || 0;
      State.driverPoints[result.id] = (State.driverPoints[result.id] || 0) + earned;
      return sum + earned;
    }, 0);
    const bestPos = Math.min(...playerResults.map((result) => result.pos));
    const money = Math.max(5000000000, (22 - bestPos) * 2500000000 + points * 1000000000);
    return { points, money };
  },

  appendNextSessionButton(label) {
    const resultTable = document.getElementById("result-table");
    if (resultTable) {
      resultTable.innerHTML += `<div class="session-next-action"><button onclick="UI.showRaceWeekendSummary()">${label}</button></div>`;
    }
  },
};
