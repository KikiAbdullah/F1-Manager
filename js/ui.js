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
    document.getElementById("session-results").classList.add("hidden");
  },

  setupRaceSessionButtons() {
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
    const playerCar = Engine.currentGrid.find(r => r.isPlayer);
    if (!playerCar) return;

    const tireEl = document.getElementById("telemetry-tire");
    const fuelEl = document.getElementById("telemetry-fuel");
    if (tireEl) tireEl.innerText = `${Math.round(playerCar.tireWear)}%`;
    if (fuelEl) fuelEl.innerText = `${Math.round(playerCar.fuel)}%`;

    document.getElementById("btn-style-fast").classList.toggle("btn-active", playerCar.drivingStyle === "fast");
    document.getElementById("btn-style-stable").classList.toggle("btn-active", playerCar.drivingStyle === "stable");
    document.getElementById("btn-style-slow").classList.toggle("btn-active", playerCar.drivingStyle === "slow");

    const ersBtn = document.getElementById("btn-ers");
    if (ersBtn) {
        ersBtn.classList.toggle("active", playerCar.ersActive);
        ersBtn.innerText = playerCar.ersActive ? "ERS: ATTACK" : "ERS: OFF (OVERTAKE)";
    }

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

    modal.classList.remove("hidden");
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
  },
};
