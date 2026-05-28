const Engine = {
  currentGrid: [],
  weather: "Cerah",

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
    // Masukkan Driver Player 1 & 2
    grid.push(
      this.buildRacer(
        State.drivers[0],
        State.car,
        true,
        State.teamColor || "#e10600"
      )
    );
    grid.push(
      this.buildRacer(
        State.drivers[1],
        State.car,
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

      grid.push(
        this.buildRacer(
          d,
          { pu: aiPU, chassis: aiChassis },
          false,
          aiTeam.color || "#8b92b3"
        )
      );
    });
    return grid;
  },

  buildRacer(driver, car, isPlayer, color) {
    // Gabungan performa driver + mesin + chassis
    const totalPace =
      driver.stats.overall * 0.5 +
      (car.pu.stats.overall_performance * 0.4 +
        car.chassis.stats.overall_performance * 0.6) *
        0.5;
    return {
      name: driver.full_name,
      code:
        driver.driver_code || driver.last_name.substring(0, 3).toUpperCase(),
      isPlayer: isPlayer,
      color: color,
      paceStat: totalPace,
      tireWear: 100, // Percentage
      fuel: 100, // Percentage
      drivingStyle: isPlayer ? "stable" : "fast", // AI defaults to fast
      isPitting: false,
      pitStopProgress: 0,
      pitStopDuration: 300, // frames for pit stop
      // Properti fisik untuk render kanvas mandiri
      progress: 0,
      currentSpeed: 0,
      currentLap: 0,
      totalTime: 0,
      finished: false,
      lastLapTime: 0,
    };
  },

  startSession(mode) {
    this.sim.mode = mode;
    this.sim.isRunning = true;
    this.sim.currentLap = 0;

    // Set target laps based on session type
    if (mode === "FP") this.sim.targetLaps = 5;
    else if (mode === "Q") this.sim.targetLaps = 3;
    else if (mode === "RACE") this.sim.targetLaps = 15; // User requested 15 laps

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

    // Setup player controls
    UI.updatePlayerControlsHUD();

    this.gameLoop(); // Memulai animation frame
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
      driver.finished = false;
      driver.tireWear = 100;
      driver.fuel = 100;
      driver.isPitting = false;
      driver.pitStopProgress = 0;
      if (driver.isPlayer) {
        driver.drivingStyle = this.sim.playerDrivingStyle; // Use global player setting
      } else {
        driver.drivingStyle = "stable"; // AI default
      }
    });

    // For RACE session, sort by qualification results if available
    if (this.sim.mode === "RACE" && State.qualificationResults) {
      const qualifiedDriverIds = State.qualificationResults.map((r) => r.id);
      this.currentGrid.sort((a, b) => {
        const indexA = qualifiedDriverIds.indexOf(a.id);
        const indexB = qualifiedDriverIds.indexOf(b.id);
        return indexA - indexB;
      });
    } else {
      // For FP/Q or if no qualification results, shuffle for varied starting positions
      this.currentGrid.sort(() => Math.random() - 0.5);
    }
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

  setDrivingStyle(style, btnElement) {
    this.sim.playerDrivingStyle = style;
    this.currentGrid.forEach((racer) => {
      if (racer.isPlayer) racer.drivingStyle = style;
    });
    document
      .querySelectorAll(".style-options button")
      .forEach((btn) => btn.classList.remove("btn-active"));
    btnElement.classList.add("btn-active");
    UI.updatePlayerControlsHUD();
  },

  pitStop() {
    const playerCar = this.currentGrid.find((r) => r.isPlayer);
    if (playerCar && !playerCar.isPitting) {
      playerCar.isPitting = true;
      playerCar.pitStopProgress = playerCar.pitStopDuration;
      playerCar.drivingStyle = "slow"; // Force slow during pit
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
  },

  toggleERS() {
    // Player mengaktifkan ERS untuk mobil pembalap utamanya (indeks 0)
    if (this.currentGrid[0]) {
      this.currentGrid[0].ersActive = !this.currentGrid[0].ersActive;
      const btn = document.getElementById("btn-ers");
      btn.classList.toggle("active");
      btn.innerText = this.currentGrid[0].ersActive
        ? "ERS MODE: ATTACK"
        : "OVERTAKE MODE (ERS)";
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

      // Efek Aura Cahaya Glow (Pembalap Player dibuat bercahaya lebih besar)
      ctx.beginPath();
      ctx.arc(point.x, point.y, racer.isPlayer ? 11 : 7, 0, Math.PI * 2);
      ctx.fillStyle = racer.ersActive
        ? "rgba(0, 255, 135, 0.4)"
        : `${racer.color}55`;
      ctx.fill();

      // Inti Lingkaran Pion Mobil
      ctx.beginPath();
      ctx.arc(point.x, point.y, racer.isPlayer ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = racer.ersActive ? "#00ff87" : racer.color;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = racer.isPlayer ? 2 : 1;
      ctx.fill();
      ctx.stroke();

      // Berikan Teks Kode Driver (misal: VER, HAM, RUS) di dekat pion jika diinginkan
      if (this.sim.simSpeed <= 2) {
        ctx.fillStyle = "#ffffff";
        ctx.font = racer.isPlayer ? "bold 9px Arial" : "8px Arial";
        ctx.fillText(racer.code, point.x + 8, point.y + 3);
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

        let baseSpeed = currentPoint.speed; // Target speed for this track segment

        // Adjust speed based on pace stat
        let performanceMod = (racer.paceStat / 100) * 20; // More impact for pace
        baseSpeed += performanceMod - 10;

        // Driving style impact
        let tireConsumptionRate = 0.08; // Base consumption per tick
        let fuelConsumptionRate = 0.05; // Base consumption per tick

        if (racer.drivingStyle === "fast") {
          baseSpeed *= 1.1; // 10% faster
          tireConsumptionRate *= 1.8;
          fuelConsumptionRate *= 1.8;
        } else if (racer.drivingStyle === "slow") {
          baseSpeed *= 0.9; // 10% slower
          tireConsumptionRate *= 0.5;
          fuelConsumptionRate *= 0.5;
        }

        // ERS impact (only for player and on straights)
        if (
          racer.isPlayer &&
          racer.ersActive &&
          currentPoint.zone.includes("Straight")
        ) {
          baseSpeed *= 1.15; // 15% faster with ERS
          tireConsumptionRate *= 1.5; // Increased tire wear with ERS
          fuelConsumptionRate *= 1.5; // Increased fuel consumption with ERS
          racer.ersCharge -= 0.1; // Assuming ERS charge exists and depletes
          if (racer.ersCharge <= 0) racer.ersActive = false; // Turn off ERS if depleted
        }

        // Tire wear impact on speed
        if (racer.tireWear < 50) baseSpeed *= 1 - (50 - racer.tireWear) / 100; // Reduce speed by up to 50%
        if (racer.tireWear < 10) baseSpeed *= 0.5; // Significantly slower on very low tires

        // Fuel level impact on speed
        if (racer.fuel < 20) baseSpeed *= 0.9; // 10% slower on low fuel
        if (racer.fuel < 5) baseSpeed *= 0.7; // Significantly slower on very low fuel

        // Apply weather effect
        if (this.weather === "Hujan") baseSpeed *= 0.8; // 20% slower in rain

        // Smooth acceleration/deceleration
        racer.currentSpeed += (baseSpeed - racer.currentSpeed) * 0.05; // Smoother transition

        // Update progress on track
        const speedFactor = racer.currentSpeed / 100; // Normalize speed for progress steps
        let stepMove = Math.max(1, Math.round(speedFactor * 3)); // Adjust sensitivity
        racer.progress = (racer.progress + stepMove) % totalPoints;

        // Update total time based on actual speed
        racer.totalTime += 0.016 / (racer.currentSpeed / 150); // Adjust constant for lap time realism

        // Consume tire and fuel
        racer.tireWear = Math.max(0, racer.tireWear - tireConsumptionRate);
        racer.fuel = Math.max(0, racer.fuel - fuelConsumptionRate);

        // Check for lap completion (simplified: if progress resets)
        if (racer.progress < stepMove && racer.currentLap < maxLaps) {
          // Detect if a full loop was made
          racer.currentLap++;
          racer.lastLapTime = racer.totalTime; // Store last lap time if needed

          // Update HUD for player's current lap
          if (racer.isPlayer) {
            document.getElementById("hud-lap").innerText = Math.min(
              racer.currentLap + 1,
              maxLaps
            );
          }
        }

        if (racer.currentLap >= maxLaps && racer.progress === 0) {
          // All laps completed and back to start line
          racer.finished = true;
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
      document.getElementById("telemetry-speed").innerText = `${Math.round(
        playerCar.currentSpeed
      )} km/h`;
      document.getElementById(
        "telemetry-sector"
      ).innerText = `Sector ${activePoint.sector}`;
      document.getElementById("telemetry-zone").innerText = activePoint.zone;
      document.getElementById("telemetry-tire").innerText = `Tire: ${Math.round(
        playerCar.tireWear
      )}%`;
      document.getElementById("telemetry-fuel").innerText = `Fuel: ${Math.round(
        playerCar.fuel
      )}%`;

      // Update player controls HUD for tire/fuel status
      UI.updatePlayerControlsHUD();
    }

    // Sort and render live standings
    this.currentGrid.sort((a, b) => {
      // Prioritize finished cars
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;

      // Then by laps completed (more laps = higher position)
      if (b.currentLap !== a.currentLap) return b.currentLap - a.currentLap;

      // Finally by total time (less time = higher position)
      return a.totalTime - b.totalTime;
    });
    UI.renderLiveStandings(this.currentGrid);

    // Render cars on track
    this.drawCars();

    if (sessionFinished) {
      this.finishSession();
      return;
    }

    this.sim.animationId = requestAnimationFrame(() => this.gameLoop());
  },
};
