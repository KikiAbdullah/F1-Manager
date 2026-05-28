const UI = {
  showScreen(screenId) {
    document
      .querySelectorAll(".screen")
      .forEach((s) => s.classList.add("hidden"));
    document.getElementById(`screen-${screenId}`).classList.remove("hidden");

    if (screenId === "loading" || screenId === "new-career") {
      document.getElementById("main-header").classList.add("hidden");
      document.getElementById("main-nav").classList.add("hidden");
    } else {
      document.getElementById("main-header").classList.remove("hidden");
      document.getElementById("main-nav").classList.remove("hidden");

      document
        .querySelectorAll(".nav-item")
        .forEach((b) => b.classList.remove("active"));
      const activeBtn = document.getElementById(`nav-${screenId}`);
      if (activeBtn) activeBtn.classList.add("active");
    }

    // TRIGGER FUNGSI SPESIFIK SAAT MENU DIKLIK
    if (screenId === "race-weekend") this.initRaceWeekend();
    if (screenId === "calendar") this.renderCalendar(); // Pastikan ada fungsi renderCalendar di ui.js kamu
  },

  initRaceWeekend() {
    const titleEl = document.getElementById("race-title");
    if (!titleEl) return;

    const currentEvent = Data.schedules.find(
      (s) => s.round === State.currentRound && s.type === "race_weekend"
    );

    if (!currentEvent) {
      titleEl.innerText = "🏁 MUSIM TELAH SELESAI!";
      document.getElementById("sim-area").classList.add("hidden");
      return;
    }

    titleEl.innerText = `ROUND ${currentEvent.round}: ${currentEvent.grand_prix.toUpperCase()}`;
    
    // Create session buttons
    this.setupRaceSessionButtons();

    // Hide simulation area until a session starts
    document.getElementById("sim-area").classList.add("hidden");
    document.getElementById("session-results").classList.add("hidden");
  },

  setupRaceSessionButtons() {
    // We'll replace the old .race-controls content with new dynamic buttons
    let controlsEl = document.querySelector(".race-controls");
    if (!controlsEl) {
        controlsEl = document.createElement('div');
        controlsEl.className = 'race-controls';
        document.getElementById('screen-race-weekend').insertBefore(controlsEl, document.getElementById('sim-area'));
    }
    
    controlsEl.innerHTML = `
        <button id="btn-fp" onclick="Engine.startSession('FP')">FREE PRACTICE</button>
        <button id="btn-q" onclick="Engine.startSession('Q')">QUALIFYING</button>
        <button id="btn-race" onclick="Engine.startSession('RACE')">MAIN RACE</button>
    `;

    // Disable buttons based on state or logic if needed (e.g. must do Q before RACE)
    // For now, let's keep them enabled for testing convenience, 
    // but typically you'd manage disabled state here.
  },

  renderLiveStandings(grid) {
    const standingsContainer = document.getElementById("live-standings");
    if (!standingsContainer) return;

    let html = `
        <div style="font-weight:bold; color:var(--text-muted); font-size:10px; padding-bottom:10px; border-bottom:1px solid var(--border-dark); margin-bottom:10px; display:grid; grid-template-columns:30px 40px 1fr 50px 50px;">
            <span>POS</span>
            <span>CODE</span>
            <span>DRIVER</span>
            <span style="text-align:right">GAP/TIME</span>
            <span style="text-align:right">ST</span>
        </div>
    `;

    const leaderTime = grid[0].totalTime;

    grid.forEach((racer, index) => {
      const pos = index + 1;
      const isPlayer = racer.isPlayer;
      const gap = index === 0 ? "LEADER" : "+" + (racer.totalTime - leaderTime).toFixed(2) + "s";
      
      // Tire/Fuel status indicators
      const tireClass = racer.tireWear > 70 ? 'high' : (racer.tireWear > 30 ? 'medium' : 'low');
      const fuelClass = racer.fuel > 70 ? 'high' : (racer.fuel > 20 ? 'medium' : 'low');

      html += `
        <div class="standing-item ${isPlayer ? 'player-standing' : ''}">
          <span class="standing-pos">${pos}</span>
          <span class="standing-code" style="border-left:3px solid ${racer.color}">${racer.code}</span>
          <span class="standing-name">${racer.name}</span>
          <span class="standing-lap-time">${racer.finished ? 'FIN' : gap}</span>
          <div class="standing-tire-fuel">
            <div class="tire-icon ${tireClass}" title="Tire: ${Math.round(racer.tireWear)}%"></div>
            <div class="fuel-icon ${fuelClass}" title="Fuel: ${Math.round(racer.fuel)}%"></div>
          </div>
        </div>
      `;
    });

    standingsContainer.innerHTML = html;
  },

  updatePlayerControlsHUD() {
    const playerCar = Engine.currentGrid.find(r => r.isPlayer);
    if (!playerCar) return;

    // Update Telemetry Items specifically for tire/fuel
    const tireEl = document.getElementById("telemetry-tire");
    const fuelEl = document.getElementById("telemetry-fuel");
    if (tireEl) tireEl.innerHTML = `TIRES <span>${Math.round(playerCar.tireWear)}%</span>`;
    if (fuelEl) fuelEl.innerHTML = `FUEL <span>${Math.round(playerCar.fuel)}%</span>`;

    // Update Driving Style Buttons active state
    document.getElementById("btn-style-fast").classList.toggle("btn-active", playerCar.drivingStyle === "fast");
    document.getElementById("btn-style-stable").classList.toggle("btn-active", playerCar.drivingStyle === "stable");
    document.getElementById("btn-style-slow").classList.toggle("btn-active", playerCar.drivingStyle === "slow");

    // ERS Button
    const ersBtn = document.getElementById("btn-ers");
    if (ersBtn) {
        ersBtn.classList.toggle("active", playerCar.ersActive);
        ersBtn.innerText = playerCar.ersActive ? "ERS: ATTACK" : "ERS: OFF (OVERTAKE)";
    }

    // Pit Stop Button
    const pitBtn = document.getElementById("btn-pit-stop");
    if (pitBtn) {
        if (playerCar.isPitting) {
            pitBtn.innerText = `PITTING (${Math.round((playerCar.pitStopProgress / playerCar.pitStopDuration) * 100)}%)`;
            pitBtn.disabled = true;
        } else {
            pitBtn.innerText = "PIT STOP";
            pitBtn.disabled = false;
        }
    }
  },

  renderSessionResults(results, title) {
    const resultsArea = document.getElementById("session-results");
    const resultTitle = document.getElementById("result-title");
    const resultTable = document.getElementById("result-table");

    if (!resultsArea || !resultTable) return;

    resultsArea.classList.remove("hidden");
    if (resultTitle) resultTitle.innerText = title;

    let html = `
        <table style="width:100%; border-collapse:collapse; color:white; font-family:sans-serif; font-size:14px;">
            <thead>
                <tr style="border-bottom:2px solid #38383f; text-align:left; color:var(--text-muted);">
                    <th style="padding:8px 4px;">POS</th>
                    <th style="padding:8px 4px;">NAME</th>
                    <th style="padding:8px 4px; text-align:center;">CODE</th>
                    <th style="padding:8px 4px; text-align:right;">TIME / GAP</th>
                </tr>
            </thead>
            <tbody>
    `;

    results.forEach((r) => {
      const isPlayerStyle = r.isPlayer ? "color:var(--f1-neon); font-weight:bold; background:rgba(0,255,135,0.05);" : "";
      html += `
            <tr style="border-bottom:1px solid #222533; ${isPlayerStyle}">
                <td style="padding:10px 4px; font-weight:bold; color:${r.pos <= 3 ? "var(--f1-red)" : "#ffffff"}">#${r.pos}</td>
                <td style="padding:10px 4px;">${r.name}</td>
                <td style="padding:10px 4px; text-align:center;">
                    <span style="background:#2d3043; padding:2px 6px; border-radius:4px; font-size:12px; color:#fff;">${r.code}</span>
                </td>
                <td style="padding:10px 4px; text-align:right; font-family:monospace;">${r.time}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    resultTable.innerHTML = html;
  },

  // MERENDER KARTU HORIZONTAL DENGAN ATRIBUT BERGAYA F1 MANAGER 24
  renderHorizontalCards(containerId, itemsList, targetField, callbackEvent) {
    const container = document.getElementById(containerId);

    if (!container) return;
    container.innerHTML = "";

    if (!itemsList || !Array.isArray(itemsList)) {
      container.innerHTML = `<div style="color:var(--f1-red); font-size:12px; padding:15px; font-weight:bold;">⚠️ GAGAL MEMUAT ASET (${containerId})</div>`;
      return;
    }

    // Trik agar bisa scroll ke samping pakai scroll-wheel mouse
    container.addEventListener("wheel", (evt) => {
      evt.preventDefault();
      container.scrollLeft += evt.deltaY;
    });

    itemsList.forEach((item) => {
      const card = document.createElement("div");
      card.className = "selection-card";

      // Penyesuaian ID: Khusus sponsor JSON kamu pakai 'team_id', sisanya pakai 'id'
      const itemId = item.id || item.team_id;
      card.dataset.id = itemId;

      // Penyesuaian Nama: Cek berbagai variasi nama properti di JSON kamu
      const cardTitle =
        item.full_name ||
        item.title_sponsor ||
        item.name ||
        item.manufacturer ||
        "Tidak Diketahui";

      // Membangun detail stats
      let statsHtml = "";
      if (item.financials && item.financials.estimated_annual_value_idr) {
        statsHtml += `<div class="card-stat-row"><span class="card-stat-label">Dana Sponsor:</span><span class="card-stat-value" style="color:var(--f1-neon)">Rp ${(
          item.financials.estimated_annual_value_idr / 1000000000
        ).toLocaleString("id-ID")} Miliar</span></div>`;
      }
      if (item.stats && item.stats.overall) {
        statsHtml += `<div class="card-stat-row"><span class="card-stat-label">Rating:</span><span class="card-stat-value" style="color:var(--neon-blue)">★ ${item.stats.overall}</span></div>`;
      }
      if (item.stats && item.stats.overall_performance) {
        statsHtml += `<div class="card-stat-row"><span class="card-stat-label">Performa:</span><span class="card-stat-value">★ ${item.stats.overall_performance}</span></div>`;
      }

      // Penyesuaian Harga: Mencari 'price_idr' (karena di JSON tidak pakai 'cost')
      let costLabel = "GRATIS";
      if (item.price_idr) {
        costLabel = `Rp ${(item.price_idr / 1000000000).toLocaleString(
          "id-ID"
        )} Miliar`;
      } else if (item.financials) {
        costLabel = "NILAI KONTRAK";
      }

      card.innerHTML = `
            <div class="selected-badge">TERKONTRAK</div>
            <div class="card-title">${cardTitle}</div>
            <div class="card-stats-box">${statsHtml}</div>
            <div class="card-price">${costLabel}</div>
        `;

      // Event Klik
      card.addEventListener("click", () => {
        container
          .querySelectorAll(".selection-card")
          .forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        WizardForm[targetField] = itemId;
        callbackEvent(itemId);
      });

      container.appendChild(card);
    });
  },
  // KONTROL GERAK LANGKAH WIZARD FORM (Next / Back)
  moveWizard(direction) {
    // Sembunyikan step lama
    document.getElementById(`step-${WizardForm.step}`).classList.add("hidden");

    // Ubah indeks langkah
    WizardForm.step += direction;

    // Tampilkan step baru
    document
      .getElementById(`step-${WizardForm.step}`)
      .classList.remove("hidden");

    // Update indikator barisan progress dot di bagian atas
    document.querySelectorAll(".wiz-dot").forEach((dot) => {
      const stepNum = parseInt(dot.getAttribute("data-step"));
      if (stepNum <= WizardForm.step) dot.classList.add("active");
      else dot.classList.remove("active");
    });

    // Kontrol visibilitas tombol kendali bawah
    document.getElementById("btn-wizard-prev").disabled = WizardForm.step === 1;

    if (WizardForm.step === 4) {
      document.getElementById("btn-wizard-next").classList.add("hidden");
      document.getElementById("btn-wizard-submit").classList.remove("hidden");
    } else {
      document.getElementById("btn-wizard-next").classList.remove("hidden");
      document.getElementById("btn-wizard-submit").classList.add("hidden");
    }
  },

  updateTopBar() {
    document.getElementById("top-team-name").innerText =
      State.teamName.toUpperCase();
    document.getElementById("top-budget").innerText =
      State.budget.toLocaleString("id-ID");
  },

  setupHQ() {
    // Fallback fallback teks "-" jika data kosong agar tidak membuat error
    document.getElementById("hq-team").innerText = State.teamName || "TBA";

    // Sponsor JSON menggunakan "title_sponsor"
    document.getElementById("hq-sponsor").innerText = State.sponsor
      ? State.sponsor.title_sponsor || State.sponsor.name || "TBA"
      : "TBA";

    document.getElementById("hq-tchief").innerText = State.teamChief
      ? State.teamChief.full_name
      : "TBA";
    document.getElementById("hq-tech").innerText = State.techChief
      ? State.techChief.full_name
      : "TBA";

    // Power Unit JSON menggunakan "manufacturer"
    let puText = "TBA";
    if (State.pu) {
      puText = State.pu.manufacturer
        ? `${State.pu.manufacturer} ${State.pu.architecture || ""}`
        : State.pu.name;
    }
    document.getElementById("hq-pu").innerText = puText;

    document.getElementById("hq-chassis").innerText = State.chassis
      ? State.chassis.name || "TBA"
      : "TBA";
    document.getElementById("hq-drv1").innerText =
      State.drivers && State.drivers[0] ? State.drivers[0].full_name : "TBA";
    document.getElementById("hq-drv2").innerText = State.drivers && State.drivers[1] ? State.drivers[1].full_name : "TBA";
  },
};
