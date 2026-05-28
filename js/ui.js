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

    if (screenId === "race-weekend") this.initRaceWeekend();
    if (screenId === "calendar") this.renderCalendar();
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
    this.setupRaceSessionButtons();
    document.getElementById("sim-area").classList.add("hidden");
    this.showRaceWeekendSummary();
  },

  setupRaceSessionButtons() {
    let controlsEl = document.querySelector(".race-controls");
    if (!controlsEl) {
        controlsEl = document.createElement('div');
        controlsEl.className = 'race-controls';
        document.getElementById('screen-race-weekend').insertBefore(controlsEl, document.getElementById('sim-area'));
    }
    
    controlsEl.innerHTML = "";
  },

  openSessionPanel(mode) {
    const data = Engine.getWeekendData(State.currentRound);
    document.getElementById("sim-area").classList.add("hidden");

    if (mode === "FP") {
      if (data.fp) {
        this.renderSessionResults(data.fp.results, `FP RESULTS - ${data.fp.laps} LAPS`);
        return;
      }
      this.renderSessionSetup("FREE PRACTICE", `
        <label class="race-setup-label">Jumlah Lap FP</label>
        <input id="input-fp-laps" class="race-setup-input" type="number" min="1" max="5" value="2" />
        <button onclick="Engine.startConfiguredSession('FP')">MULAI FP</button>
      `);
      return;
    }

    if (mode === "Q") {
      if (data.qualifyingComplete) {
        this.renderSessionResults(data.qualifyingGrid, "QUALIFYING FINAL RESULTS");
        return;
      }
      const nextQ = data.q1 ? "Q2" : "Q1";
      this.renderSessionSetup("QUALIFYING", `
        <p class="race-setup-note">${nextQ === "Q1" ? "Mulai Q1. Top 10 akan lolos ke Q2." : "Q1 selesai. Mulai Q2 untuk menentukan grid race."}</p>
        <button onclick="Engine.startConfiguredSession('${nextQ}')">MULAI ${nextQ}</button>
      `);
      return;
    }

    if (mode === "RACE") {
      if (data.race) {
        this.renderSessionResults(data.race.results, "RACE RESULTS");
        return;
      }
      if (!data.qualifyingComplete) {
        this.renderSessionSetup("RACE LOCKED", `<p class="race-setup-note">Selesaikan Q1 dan Q2 terlebih dahulu untuk menentukan starting grid.</p>`);
        return;
      }
      this.renderSessionSetup("MAIN RACE", `
        <p class="race-setup-note">Starting grid memakai hasil Qualifying. Race hanya bisa dijalankan sekali.</p>
        <button onclick="Engine.startConfiguredSession('RACE')">MULAI RACE</button>
      `);
    }
  },

  renderSessionSetup(title, bodyHtml) {
    const resultsArea = document.getElementById("session-results");
    const resultTitle = document.getElementById("result-title");
    const resultTable = document.getElementById("result-table");
    resultsArea.classList.remove("hidden");
    resultTitle.innerText = title;
    resultTable.innerHTML = `<div class="race-session-setup">${bodyHtml}</div>`;
  },

  showRaceWeekendSummary() {
    const simArea = document.getElementById("sim-area");
    if (simArea) simArea.classList.add("hidden");
    const nextContainer = document.getElementById("session-next-action-container");
    if (nextContainer) nextContainer.innerHTML = "";
    const data = Engine.getWeekendData(State.currentRound);
    const event = Data.schedules.find((s) => s.round === State.currentRound && s.type === "race_weekend");
    const circuit = event ? Data.circuits.find((c) => c.id === event.circuit_id) : null;
    const next = !data.fp ? "FP" : !data.q1 ? "Q1" : !data.q2 ? "Q2" : !data.race ? "RACE" : "DONE";
    const resultsArea = document.getElementById("session-results");
    const resultTitle = document.getElementById("result-title");
    const resultTable = document.getElementById("result-table");
    resultsArea.classList.remove("hidden");
    resultTitle.innerText = next === "DONE" ? "RACE WEEKEND COMPLETE" : "RACE WEEKEND SCHEDULE";
    resultTable.innerHTML = `
      <div class="race-session-setup">
        <div class="schedule-detail-grid">
          <span>Grand Prix: <strong>${event ? event.grand_prix : "-"}</strong></span>
          <span>Circuit: <strong>${circuit ? circuit.name : "-"}</strong></span>
          <span>Type: <strong>${circuit ? circuit.type : "-"}</strong></span>
          <span>Race Laps: <strong>${circuit ? circuit.laps : "-"}</strong></span>
          <span>DRS Zones: <strong>${circuit ? circuit.drs_zones : "-"}</strong></span>
          <span>Rain Chance: <strong>${circuit && circuit.game_stats ? circuit.game_stats.rain_chance : "-"}%</strong></span>
        </div>
        <div class="race-status-grid">
          <span>FP: ${data.fp ? "SELESAI" : "BELUM"}</span>
          <span>Q1: ${data.q1 ? "SELESAI" : "BELUM"}</span>
          <span>Q2: ${data.q2 ? "SELESAI" : "BELUM"}</span>
          <span>Race: ${data.race ? "SELESAI" : "BELUM"}</span>
        </div>
        ${this.renderNextScheduleAction(next, data)}
      </div>
    `;
  },

  renderNextScheduleAction(next, data) {
    if (next === "FP") {
      return `<label class="race-setup-label">Jumlah Lap FP</label><input id="input-fp-laps" class="race-setup-input" type="number" min="1" max="5" value="3" /><button onclick="Engine.startConfiguredSession('FP')">MULAI FP</button>`;
    }
    if (next === "Q1") return `<button onclick="Engine.startConfiguredSession('Q1')">MULAI Q1</button>`;
    if (next === "Q2") return `<p class="race-setup-note">Top 10 Q1 lolos ke Q2.</p><button onclick="Engine.startConfiguredSession('Q2')">MULAI Q2</button>`;
    if (next === "RACE") return `<p class="race-setup-note">Grid race memakai hasil Qualifying.</p><button onclick="Engine.startConfiguredSession('RACE')">MULAI RACE</button>`;
    const rewards = data.race && data.race.rewards;
    return `<div class="weekend-reward-box"><strong>Didapatkan:</strong><span>Poin: ${rewards ? rewards.points : 0}</span><span>Hadiah: Rp ${rewards ? rewards.money.toLocaleString("id-ID") : 0}</span></div><button onclick="UI.initRaceWeekend()">NEXT SCHEDULE</button>`;
  },

  renderLiveStandings(grid) {
    const standingsContainer = document.getElementById("live-standings");
    if (!standingsContainer) return;

    let html = `
        <div class="panel-title">LIVE LEADERBOARD</div>
        <div class="standing-header">
            <span>POS</span>
            <span>CODE</span>
            <span>DRIVER</span>
            <span style="text-align:right">GAP/TIME</span>
            <span style="text-align:right">ST</span>
        </div>
    `;

    grid.forEach((racer, index) => {
      const pos = index + 1;
      const isPlayer = racer.isPlayer;
      const gap = racer.gapText || (index === 0 ? "LEADER" : "+" + (racer.totalTime - grid[0].totalTime).toFixed(1) + "s");
      
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
    const playerCars = Engine.currentGrid.filter(r => r.isPlayer);
    const playerCar = playerCars[0];
    if (!playerCar) return;

    const tireEl = document.getElementById("telemetry-tire");
    const fuelEl = document.getElementById("telemetry-fuel");
    if (tireEl) tireEl.innerText = `${Math.round(playerCar.tireWear)}%`;
    if (fuelEl) fuelEl.innerText = `${Math.round(playerCar.fuel)}%`;

    this.renderStrategyUnderTrack(playerCars);
  },

  renderStrategyUnderTrack(playerCars) {
    const container = document.getElementById("strategy-under-track");
    if (!container) return;
    container.innerHTML = playerCars.map((car, index) => `
      <div class="driver-strategy-row">
        <strong>${car.code}</strong>
        <span>SPD ${Math.round(car.currentSpeed)} km/h</span>
        <span>TIRE ${Math.round(car.tireWear)}%</span>
        <span>FUEL ${Math.round(car.fuel)}%</span>
        <button class="${car.drivingStyle === "fast" ? "btn-active" : ""}" onclick="Engine.setDrivingStyle('fast', this, ${index})">FAST</button>
        <button class="${car.drivingStyle === "stable" ? "btn-active" : ""}" onclick="Engine.setDrivingStyle('stable', this, ${index})">STABLE</button>
        <button class="${car.drivingStyle === "slow" ? "btn-active" : ""}" onclick="Engine.setDrivingStyle('slow', this, ${index})">SLOW</button>
        <button ${car.isPitting || car.pitRequested ? "disabled" : ""} onclick="Engine.pitStop(${index})">${car.isPitting ? "PITTING" : "PIT"}</button>
        <button class="${car.ersActive ? "active" : ""}" onclick="Engine.toggleERS(${index})">ERS</button>
      </div>
    `).join("");
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

  renderCalendar() {
    const calContainer = document.getElementById("calendar-list");
    if (!calContainer) return;
    calContainer.innerHTML = "";

    Data.schedules.forEach((sch) => {
      if (sch.type !== "race_weekend") return;

      const circuitDetails = Data.circuits.find(c => c.id === sch.circuit_id);
      const countryCode = circuitDetails ? circuitDetails.country_code : "GB";
      const circuitName = circuitDetails ? circuitDetails.name : sch.circuit_id;

      const isCurrent = sch.round === State.currentRound;
      const isFinished = sch.round < State.currentRound;
      const isNext = sch.round === State.currentRound + 1;

      const startDate = new Date(sch.sessions[0].date);
      const endDate = new Date(sch.sessions[sch.sessions.length - 1].date);
      const options = { month: "short", day: "numeric" };
      const formattedStartDate = startDate.toLocaleDateString("en-US", options);
      const formattedEndDate = endDate.toLocaleDateString("en-US", options);
      const dateRange =
        formattedStartDate === formattedEndDate
          ? formattedStartDate
          : `${formattedStartDate} - ${formattedEndDate}`;

      const div = document.createElement("div");
      div.className = `calendar-item ${isCurrent ? "current-race" : ""} ${
        isFinished ? "finished-race" : ""
      } ${isNext ? "next-race" : ""}`;

      div.innerHTML = `
            <div class="calendar-round">ROUND ${sch.round}</div>
            <div class="calendar-flag">
              <img src="https://flagsapi.com/${countryCode}/flat/64.png" alt="${sch.country}" />
            </div>
            <div class="calendar-details">
              <div class="calendar-grand-prix">${sch.grand_prix}</div>
              <div class="calendar-circuit">${circuitName}</div>
              <div class="calendar-date">${dateRange}</div>
            </div>
            <div class="calendar-status">
              ${isCurrent ? "<span>LIVE</span>" : ""}
              ${isNext ? "<span>NEXT RACE</span>" : ""}
              ${isFinished ? "<span>FINISHED</span>" : ""}
            </div>
        `;
      div.addEventListener('click', () => {
        UI.showRaceDetailsModal(sch, circuitName, dateRange);
      });

      calContainer.appendChild(div);
    });
  },

  showRaceDetailsModal(scheduleItem, circuitName, dateRange) {
    const modal = document.getElementById("race-detail-modal");
    if (!modal) return;

    document.getElementById("modal-grand-prix-name").innerText = scheduleItem.grand_prix;
    document.getElementById("modal-circuit-name").innerText = circuitName;
    document.getElementById("modal-date-range").innerText = dateRange;

    const sessionsList = document.getElementById("modal-sessions-list");
    sessionsList.innerHTML = '';

    scheduleItem.sessions.forEach(session => {
      const sessionDiv = document.createElement('div');
      sessionDiv.className = 'modal-session-item';
      const sessionDate = new Date(session.date);
      const sessionTime = session.time_utc.substring(0, 5);
      sessionDiv.innerHTML = `
        <span>${session.session}</span>
        <span>${sessionDate.toLocaleDateString("en-US", {month: "short", day: "numeric"})} - ${sessionTime} UTC</span>
      `;
      sessionsList.appendChild(sessionDiv);
    });

    const historyList = document.getElementById("modal-history-list");
    historyList.innerHTML = '';

    const weekend = State.raceWeekends && State.raceWeekends[scheduleItem.round];
    if (weekend && (weekend.fp || weekend.q1 || weekend.qualifyingGrid || weekend.race)) {
      historyList.innerHTML = `<div class="modal-results-history"><h4>HASIL WEEKEND</h4>${this.renderWeekendHistoryHtml(weekend)}</div>`;
    }

    modal.classList.remove("hidden");
  },

  renderWeekendHistoryHtml(weekend) {
    const renderTop = (title, sessionData) => {
      if (!sessionData || !sessionData.results) return "";
      const rows = sessionData.results.slice(0, 5).map((r) => `<li>#${r.pos} ${r.code} - ${r.time}</li>`).join("");
      return `<div class="modal-result-block"><strong>${title}</strong><ul>${rows}</ul></div>`;
    };

    return [
      renderTop("FP", weekend.fp),
      renderTop("Q1", weekend.q1),
      weekend.qualifyingGrid ? renderTop("QUALIFYING FINAL", { results: weekend.qualifyingGrid }) : "",
      renderTop("RACE", weekend.race),
    ].join("");
  },

  hideRaceDetailsModal() {
    const modal = document.getElementById("race-detail-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
  },

  renderHorizontalCards(containerId, itemsList, targetField, callbackEvent) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    if (!itemsList || !Array.isArray(itemsList)) {
      container.innerHTML = `<div style="color:var(--f1-red); font-size:12px; padding:15px; font-weight:bold;">⚠️ GAGAL MEMUAT ASET (${containerId})</div>`;
      return;
    }

    const sortedItems = [...itemsList].sort((a, b) => {
      const priceA = a.price_idr || (a.financials && a.financials.estimated_annual_value_idr) || 0;
      const priceB = b.price_idr || (b.financials && b.financials.estimated_annual_value_idr) || 0;
      return priceA - priceB;
    });

    container.addEventListener("wheel", (evt) => {
      evt.preventDefault();
      container.scrollLeft += evt.deltaY;
    });

    sortedItems.forEach((item) => {
      const card = document.createElement("div");
      card.className = "selection-card";
      
      const itemId = item.id || item.team_id;
      const isDriverSelection = targetField === "driverId";
      const driverSlot = WizardForm.driver1Id === itemId ? 1 : (WizardForm.driver2Id === itemId ? 2 : null);
      const isAlreadySelected = isDriverSelection ? driverSlot !== null : (WizardForm[targetField] === itemId);
      
      if (isAlreadySelected) {
        card.classList.add("selected");
      }

      const itemPrice = item.price_idr || (item.financials && item.financials.estimated_annual_value_idr) || 0;
      const isSponsorSelection = (containerId === "container-sponsor");
      
      const currentAvailableBudget = Finance.currentWizardBudget;
      // Affordable if it's a sponsor, OR if it's already selected, OR if the remaining budget covers it
      const isAffordable = isSponsorSelection || isAlreadySelected || (currentAvailableBudget >= itemPrice);

      card.dataset.id = itemId;
      const cardTitle = item.full_name || item.title_sponsor || item.name || item.manufacturer || "Tidak Diketahui";

      let statsHtml = "";
      if (item.financials && item.financials.estimated_annual_value_idr) {
        statsHtml += `<div class="card-stat-row"><span class="card-stat-label">Dana Sponsor:</span><span class="card-stat-value" style="color:var(--f1-neon)">Rp ${(item.financials.estimated_annual_value_idr / 1000000000).toLocaleString("id-ID")} Miliar</span></div>`;
      }
      if (item.driver_code) {
        statsHtml += `<div class="card-stat-row"><span class="card-stat-label">Kode:</span><span class="card-stat-value">${item.driver_code}</span></div>`;
      }
      if (item.nationality) {
        statsHtml += `<div class="card-stat-row"><span class="card-stat-label">Negara:</span><span class="card-stat-value">${item.nationality}</span></div>`;
      }
      if (item.stats && item.stats.overall) {
        statsHtml += `<div class="card-stat-row"><span class="card-stat-label">Rating:</span><span class="card-stat-value" style="color:var(--neon-blue)">★ ${item.stats.overall}</span></div>`;
      }
      if (item.stats && item.stats.overall_performance) {
        statsHtml += `<div class="card-stat-row"><span class="card-stat-label">Performa:</span><span class="card-stat-value">★ ${item.stats.overall_performance}</span></div>`;
      }

      let costLabel = "GRATIS";
      if (item.price_idr) {
        costLabel = `Rp ${(item.price_idr / 1000000000).toLocaleString("id-ID")} Miliar`;
      } else if (item.financials) {
        costLabel = "NILAI KONTRAK";
      }

      card.innerHTML = `
            <div class="selected-badge">${isDriverSelection && driverSlot ? `DRIVER ${driverSlot}` : "TERKONTRAK"}</div>
            <div class="card-title">${cardTitle}</div>
            <div class="card-stats-box">${statsHtml}</div>
            <div class="card-price">${costLabel}</div>
      `;

      if (!isAffordable) {
        card.classList.add("unaffordable-card");
        if (!isSponsorSelection) {
          const priceEl = card.querySelector(".card-price");
          if (priceEl) priceEl.innerText = "Anggaran Tidak memenuhi";
        }
      }

      card.addEventListener("click", () => {
        if (isDriverSelection) {
          if (WizardForm.driver1Id === itemId) {
            WizardForm.driver1Id = WizardForm.driver2Id;
            WizardForm.driver2Id = null;
          } else if (WizardForm.driver2Id === itemId) {
            WizardForm.driver2Id = null;
          } else {
            if (!isAffordable) {
              alert("Anggaran Tidak memenuhi");
              return;
            }

            if (!WizardForm.driver1Id) {
              WizardForm.driver1Id = itemId;
            } else if (!WizardForm.driver2Id) {
              WizardForm.driver2Id = itemId;
            } else {
              WizardForm.driver2Id = itemId;
            }
          }
        } else if (isAlreadySelected) {
          WizardForm[targetField] = null;
          if (isSponsorSelection) {
            State.budget = 0;
            UI.updateTopBar();
          }
        } else {
          if (!isAffordable) {
            alert("Anggaran Tidak memenuhi");
            return;
          }
          WizardForm[targetField] = itemId;
          if (isSponsorSelection && item.financials) {
            State.budget = item.financials.estimated_annual_value_idr;
            UI.updateTopBar();
          }
        }
        
        Finance.calculateWizardBudget();
        UI.refreshWizardCards();
      });

      container.appendChild(card);
    });
  },

  refreshWizardCards() {
    this.renderHorizontalCards("container-sponsor", Data.sponsors, "sponsorId");
    this.renderHorizontalCards("container-team-chief", Data.team_chiefs, "teamChiefId");
    this.renderHorizontalCards("container-tech-chief", Data.tech_chiefs, "techChiefId");
    this.renderHorizontalCards("container-pu", Data.power_units, "puId");
    this.renderHorizontalCards("container-chassis", Data.chassis, "chassisId");
    this.renderHorizontalCards("container-drivers", Data.drivers, "driverId");
  },

  moveWizard(direction) {
    if (direction > 0 && !this.canLeaveWizardStep(WizardForm.step)) return;

    document.getElementById(`step-${WizardForm.step}`).classList.add("hidden");
    WizardForm.step += direction;
    document.getElementById(`step-${WizardForm.step}`).classList.remove("hidden");

    document.querySelectorAll(".wiz-dot").forEach((dot) => {
      const stepNum = parseInt(dot.getAttribute("data-step"));
      if (stepNum <= WizardForm.step) dot.classList.add("active");
      else dot.classList.remove("active");
    });

    document.getElementById("btn-wizard-prev").disabled = WizardForm.step === 1;

    if (WizardForm.step === 4) {
      document.getElementById("btn-wizard-next").classList.add("hidden");
      document.getElementById("btn-wizard-submit").classList.remove("hidden");
    } else {
      document.getElementById("btn-wizard-next").classList.remove("hidden");
      document.getElementById("btn-wizard-submit").classList.add("hidden");
    }
  },

  canLeaveWizardStep(step) {
    if (step === 1) {
      const teamName = document.getElementById("input-team-name").value.trim();
      if (!teamName || !WizardForm.sponsorId) {
        alert("Isi nama konstruktor dan pilih sponsor utama terlebih dahulu.");
        return false;
      }
    }

    if (step === 2 && (!WizardForm.teamChiefId || !WizardForm.techChiefId)) {
      alert("Pilih Team Principal dan Technical Director terlebih dahulu.");
      return false;
    }

    if (step === 3 && (!WizardForm.puId || !WizardForm.chassisId)) {
      alert("Pilih Power Unit dan Chassis terlebih dahulu.");
      return false;
    }

    return true;
  },

  updateTopBar() {
    document.getElementById("top-team-name").innerText = State.teamName.toUpperCase();
    document.getElementById("top-budget").innerText = State.budget.toLocaleString("id-ID");
  },

  setupHQ() {
    document.getElementById("hq-team").innerText = State.teamName || "TBA";
    document.getElementById("hq-sponsor").innerText = State.sponsor
      ? State.sponsor.title_sponsor || State.sponsor.name || "TBA"
      : "TBA";
    document.getElementById("hq-tchief").innerText = State.teamChief ? State.teamChief.full_name : "TBA";
    document.getElementById("hq-tech").innerText = State.techChief ? State.techChief.full_name : "TBA";

    let puText = "TBA";
    if (State.pu) {
      puText = State.pu.manufacturer ? `${State.pu.manufacturer} ${State.pu.architecture || ""}` : State.pu.name;
    }
    document.getElementById("hq-pu").innerText = puText;
    document.getElementById("hq-chassis").innerText = State.chassis ? State.chassis.name || "TBA" : "TBA";
    document.getElementById("hq-drv1").innerText = State.drivers && State.drivers[0] ? State.drivers[0].full_name : "TBA";
    document.getElementById("hq-drv2").innerText = State.drivers && State.drivers[1] ? State.drivers[1].full_name : "TBA";
    const nextEvent = Data.schedules.find((s) => s.round === State.currentRound && s.type === "race_weekend");
    const completed = State.raceWeekends ? Object.values(State.raceWeekends).filter((w) => w.race).length : 0;
    const points = State.driverPoints || {};
    const pointText = State.drivers && State.drivers.length
      ? State.drivers.map((d) => `${d.driver_code || d.last_name}: ${points[d.id] || 0}`).join(" | ")
      : "0";
    const nextRoundEl = document.getElementById("hq-next-round");
    const completedEl = document.getElementById("hq-completed-rounds");
    const pointsEl = document.getElementById("hq-driver-points");
    if (nextRoundEl) nextRoundEl.innerText = nextEvent ? `R${nextEvent.round} - ${nextEvent.grand_prix}` : "Season Complete";
    if (completedEl) completedEl.innerText = `${completed} race weekend`;
    if (pointsEl) pointsEl.innerText = pointText;
  },

  toggleSidebar() {
    const nav = document.getElementById("main-nav");
    if (nav) nav.classList.toggle("collapsed");
  },
};
