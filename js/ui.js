// =====================================================================
// F1 MANAGER 2026 - UI SYSTEM
// Full rewrite with strategy controls, standings, race debrief
// =====================================================================
const UI = {
  showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
    const el = document.getElementById(`screen-${screenId}`);
    if (el) el.classList.remove("hidden");

    if (screenId === "loading" || screenId === "new-career") {
      document.getElementById("main-header")?.classList.add("hidden");
      document.getElementById("main-nav")?.classList.add("hidden");
    } else {
      document.getElementById("main-header")?.classList.remove("hidden");
      document.getElementById("main-nav")?.classList.remove("hidden");
      document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
      const activeBtn = document.getElementById(`nav-${screenId}`);
      if (activeBtn) activeBtn.classList.add("active");
    }

    if (screenId === "race-weekend") this.initRaceWeekend();
    if (screenId === "calendar") this.renderCalendar();
    if (screenId === "standings") this.renderStandings();
    if (screenId === "rnd") this.renderRnD();
  },

  // =============================================
  // RACE WEEKEND
  // =============================================
  initRaceWeekend() {
    const titleEl = document.getElementById("race-title");
    if (!titleEl) return;

    const currentEvent = Data.schedules.find(
      (s) => s.round === State.currentRound && s.type === "race_weekend"
    );

    if (!currentEvent) {
      titleEl.innerText = "🏆 MUSIM TELAH SELESAI!";
      document.getElementById("sim-area")?.classList.add("hidden");
      this.renderSeasonSummary();
      return;
    }

    titleEl.innerText = `ROUND ${currentEvent.round}: ${currentEvent.grand_prix.toUpperCase()}`;
    document.getElementById("sim-area")?.classList.add("hidden");
    this.showRaceWeekendSummary();
  },

  showRaceWeekendSummary() {
    const simArea = document.getElementById("sim-area");
    if (simArea) simArea.classList.add("hidden");
    const nextContainer = document.getElementById("session-next-action-container");
    if (nextContainer) nextContainer.innerHTML = "";

    const data = Engine.getWeekendData(State.currentRound);
    const event = Data.schedules.find((s) => s.round === State.currentRound && s.type === "race_weekend");
    const circuit = event ? Data.circuits.find((c) => c.id === event.circuit_id) : null;
    const trackChars = event?.track_characteristics || {};

    const next = !data.fp ? "FP" : !data.q1 ? "Q1" : !data.q2 ? "Q2" : !data.q3 ? "Q3" : !data.race ? "RACE" : "DONE";

    const resultsArea = document.getElementById("session-results");
    const resultTitle = document.getElementById("result-title");
    const resultTable = document.getElementById("result-table");
    if (!resultsArea || !resultTable) return;

    resultsArea.classList.remove("hidden");
    resultTitle.innerText = next === "DONE" ? "RACE WEEKEND COMPLETE" : "RACE WEEKEND SCHEDULE";

    const tyreImpact = trackChars.tyre_degradation || 60;
    const scChance = trackChars.safety_car_probability || 30;
    const rainChance = trackChars.wet_weather_variability || 10;

    resultTable.innerHTML = `
      <div class="race-session-setup">
        <div class="schedule-detail-grid">
          <span>Grand Prix: <strong>${event ? event.grand_prix : "-"}</strong></span>
          <span>Circuit: <strong>${circuit ? circuit.name : "-"}</strong></span>
          <span>Race Laps: <strong>${circuit ? circuit.laps : "-"}</strong></span>
          <span>DRS Zones: <strong>${circuit ? circuit.drs_zones : "-"}</strong></span>
        </div>
        <div class="track-stats-grid">
          <div class="track-stat">
            <span class="track-stat-label">Tyre Deg</span>
            <div class="stat-bar"><div class="stat-bar-fill" style="width:${tyreImpact}%; background:${tyreImpact > 70 ? '#ff4444' : tyreImpact > 40 ? '#ffaa00' : '#00cc66'}"></div></div>
            <span class="track-stat-val">${tyreImpact}%</span>
          </div>
          <div class="track-stat">
            <span class="track-stat-label">SC Chance</span>
            <div class="stat-bar"><div class="stat-bar-fill" style="width:${scChance}%; background:${scChance > 60 ? '#ff4444' : scChance > 30 ? '#ffaa00' : '#00cc66'}"></div></div>
            <span class="track-stat-val">${scChance}%</span>
          </div>
          <div class="track-stat">
            <span class="track-stat-label">Rain Risk</span>
            <div class="stat-bar"><div class="stat-bar-fill" style="width:${rainChance}%; background:#4488ff"></div></div>
            <span class="track-stat-val">${rainChance}%</span>
          </div>
          <div class="track-stat">
            <span class="track-stat-label">Top Speed</span>
            <div class="stat-bar"><div class="stat-bar-fill" style="width:${trackChars.top_speed_importance || 50}%; background:#00ddff"></div></div>
            <span class="track-stat-val">${trackChars.top_speed_importance || 50}%</span>
          </div>
        </div>
        <div class="race-status-grid">
          <span class="${data.fp ? 'done' : ''}">FP: ${data.fp ? "✅" : "⬜"}</span>
          <span class="${data.q1 ? 'done' : ''}">Q1: ${data.q1 ? "✅" : "⬜"}</span>
          <span class="${data.q2 ? 'done' : ''}">Q2: ${data.q2 ? "✅" : "⬜"}</span>
          <span class="${data.q3 ? 'done' : ''}">Q3: ${data.q3 ? "✅" : "⬜"}</span>
          <span class="${data.race ? 'done' : ''}">Race: ${data.race ? "✅" : "⬜"}</span>
        </div>
        ${this.renderNextScheduleAction(next, data)}
      </div>
    `;
  },

  renderNextScheduleAction(next, data) {
    if (next === "FP") {
      return `
        <div class="session-config-row">
          <label class="race-setup-label">Jumlah Lap FP</label>
          <input id="input-fp-laps" class="race-setup-input" type="number" min="1" max="10" value="3" />
          <button class="btn-session-start" onclick="Engine.startConfiguredSession('FP')">▶ MULAI FREE PRACTICE</button>
        </div>`;
    }
    if (next === "Q1") return `<button class="btn-session-start" onclick="Engine.startConfiguredSession('Q1')">▶ MULAI Q1 (15 Lolos)</button>`;
    if (next === "Q2") return `<p class="race-setup-note">Top 15 Q1 bertanding. 10 tercepat ke Q3.</p><button class="btn-session-start" onclick="Engine.startConfiguredSession('Q2')">▶ MULAI Q2</button>`;
    if (next === "Q3") return `<p class="race-setup-note">Final shootout! Top 10 memperebutkan pole position.</p><button class="btn-session-start" onclick="Engine.startConfiguredSession('Q3')">▶ MULAI Q3</button>`;
    if (next === "RACE") {
      return `
        <div class="race-pre-config">
          <p class="race-setup-note">Grid race berdasarkan hasil Qualifying. Pilih jarak race dan ban start.</p>
          <div class="session-config-row">
            <label class="race-setup-label">Race Distance %</label>
            <input id="input-race-pct" class="race-setup-input" type="number" min="10" max="100" value="25" />
          </div>
          <div class="session-config-row">
            <label class="race-setup-label">Starting Compound</label>
            <div class="compound-selector">
              ${this.renderCompoundButtons("start")}
            </div>
          </div>
          <button class="btn-session-start btn-race-go" onclick="Engine.startConfiguredSession('RACE')">🏁 MULAI RACE</button>
        </div>`;
    }
    // DONE
    const rewards = data.race?.rewards;
    const playerResults = data.race?.results?.filter(r => r.isPlayer) || [];
    const playerPts = playerResults.map(r => `${r.code}: P${r.pos}`).join(", ") || "N/A";
    return `
      <div class="weekend-reward-box">
        <strong>🏆 Weekend Selesai!</strong>
        <span>Hasil: ${playerPts}</span>
        <span>Hadiah: Rp ${rewards?.money ? rewards.money.toLocaleString("id-ID") : 0}</span>
      </div>
      <button class="btn-session-start" onclick="UI.showScreen('hq')">KEMBALI KE HQ</button>`;
  },

  renderCompoundButtons(context) {
    const compounds = ["soft", "medium", "hard"];
    return compounds.map(c => {
      const data = Utils.TYRE_COMPOUNDS[c];
      const selected = (context === "start" && (State.raceStartCompound || "medium") === c);
      return `<button class="btn-compound ${selected ? 'active' : ''}" style="border-color:${data.color}" onclick="UI.selectCompound('${c}', '${context}', this)">${data.code}</button>`;
    }).join("");
  },

  selectCompound(compound, context, btn) {
    if (context === "start") {
      State.raceStartCompound = compound;
    }
    btn.parentElement.querySelectorAll(".btn-compound").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  },

  // =============================================
  // LIVE STANDINGS DURING RACE
  // =============================================
  renderLiveStandings(grid) {
    const standingsContainer = document.getElementById("live-standings");
    if (!standingsContainer) return;

    let html = `
      <div class="panel-title">LIVE LEADERBOARD</div>
      <div class="standing-header">
        <span>P</span><span>DRV</span><span>TEAM</span><span>GAP</span><span>TYRE</span>
      </div>`;

    grid.forEach((racer, index) => {
      if (racer.eliminated && !racer.isPlayer) return;
      const pos = index + 1;
      const compound = Utils.TYRE_COMPOUNDS[racer.tyreCompound];
      const compColor = compound?.color || "#fff";
      const wearPct = Math.round(100 - racer.tyreWear);
      const gap = racer.dnf ? "DNF" : racer.eliminated ? "OUT" : (racer.gapText || "-");

      html += `
        <div class="standing-item ${racer.isPlayer ? 'player-standing' : ''} ${racer.dnf ? 'dnf-standing' : ''}">
          <span class="standing-pos">${pos}</span>
          <span class="standing-code" style="border-left:3px solid ${racer.color}">${racer.code}</span>
          <span class="standing-name">${racer.teamName || ''}</span>
          <span class="standing-lap-time">${racer.finished ? 'FIN' : gap}</span>
          <span class="standing-tyre">
            <span class="tyre-badge" style="background:${compColor}">${compound?.code || '?'}</span>
            <span class="tyre-wear-text">${wearPct}%</span>
          </span>
        </div>`;
    });

    standingsContainer.innerHTML = html;
  },

  // =============================================
  // PLAYER STRATEGY CONTROLS
  // =============================================
  updatePlayerControlsHUD() {
    const playerCars = Engine.currentGrid.filter(r => r.isPlayer);
    if (!playerCars.length) return;
    this.renderStrategyUnderTrack(playerCars);
  },

  renderStrategyUnderTrack(playerCars) {
    const container = document.getElementById("strategy-under-track");
    if (!container) return;

    container.innerHTML = playerCars.map((car, index) => {
      const compound = Utils.TYRE_COMPOUNDS[car.tyreCompound];
      const wearPct = Math.round(100 - car.tyreWear);
      const fuelPct = Math.round(car.fuel);
      const ersPct = Math.round(car.ersCharge);

      return `
        <div class="driver-strategy-row">
          <div class="strat-driver-info">
            <strong>${car.code}</strong>
            <span class="tyre-badge" style="background:${compound?.color || '#fff'}">${compound?.code || '?'}</span>
          </div>
          <div class="strat-telemetry">
            <div class="mini-stat">
              <span class="mini-label">TYRE</span>
              <div class="mini-bar"><div class="mini-bar-fill" style="width:${wearPct}%; background:${wearPct > 60 ? '#00cc66' : wearPct > 30 ? '#ffaa00' : '#ff4444'}"></div></div>
              <span class="mini-val">${wearPct}%</span>
            </div>
            <div class="mini-stat">
              <span class="mini-label">FUEL</span>
              <div class="mini-bar"><div class="mini-bar-fill" style="width:${fuelPct}%; background:${fuelPct > 30 ? '#00aaff' : '#ff4444'}"></div></div>
              <span class="mini-val">${fuelPct}%</span>
            </div>
            <div class="mini-stat">
              <span class="mini-label">ERS</span>
              <div class="mini-bar"><div class="mini-bar-fill" style="width:${ersPct}%; background:${ersPct > 40 ? '#ffcc00' : '#ff6600'}"></div></div>
              <span class="mini-val">${ersPct}%</span>
            </div>
          </div>
          <div class="strat-controls">
            <div class="control-group-inline">
              <span class="ctrl-label">PACE</span>
              <button class="btn-ctrl ${car.drivingStyle === "fast" ? "active-red" : ""}" onclick="Engine.setDrivingStyle('fast', this, ${index})">PUSH</button>
              <button class="btn-ctrl ${car.drivingStyle === "stable" ? "active-green" : ""}" onclick="Engine.setDrivingStyle('stable', this, ${index})">STD</button>
              <button class="btn-ctrl ${car.drivingStyle === "slow" ? "active-blue" : ""}" onclick="Engine.setDrivingStyle('slow', this, ${index})">SAVE</button>
            </div>
            <div class="control-group-inline">
              <span class="ctrl-label">ERS</span>
              <button class="btn-ctrl ${car.ersMode === "deploy" ? "active-red" : ""}" onclick="Engine.setERSMode('deploy', ${index})">DPL</button>
              <button class="btn-ctrl ${car.ersMode === "balanced" ? "active-green" : ""}" onclick="Engine.setERSMode('balanced', ${index})">BAL</button>
              <button class="btn-ctrl ${car.ersMode === "harvest" ? "active-blue" : ""}" onclick="Engine.setERSMode('harvest', ${index})">HRV</button>
            </div>
            <div class="control-group-inline">
              <span class="ctrl-label">PIT</span>
              <button class="btn-compound-sm" style="border-color:#ff0000" ${car.isPitting || car.pitRequested ? "disabled" : ""} onclick="Engine.pitStop(${index}, 'soft')">S</button>
              <button class="btn-compound-sm" style="border-color:#ffd700" ${car.isPitting || car.pitRequested ? "disabled" : ""} onclick="Engine.pitStop(${index}, 'medium')">M</button>
              <button class="btn-compound-sm" style="border-color:#ffffff" ${car.isPitting || car.pitRequested ? "disabled" : ""} onclick="Engine.pitStop(${index}, 'hard')">H</button>
              ${car.isPitting ? '<span class="pit-status">PITTING...</span>' : car.pitRequested ? '<span class="pit-status">QUEUED</span>' : ''}
            </div>
          </div>
        </div>`;
    }).join("");
  },

  // =============================================
  // SESSION RESULTS
  // =============================================
  openSessionPanel(mode) {
    const data = Engine.getWeekendData(State.currentRound);
    document.getElementById("sim-area")?.classList.add("hidden");

    if (mode === "FP") {
      if (data.fp) { this.renderSessionResults(data.fp.results, `FP RESULTS - ${data.fp.laps} LAPS`); return; }
      this.showRaceWeekendSummary(); return;
    }
    if (mode === "Q") {
      if (data.qualifyingComplete) { this.renderSessionResults(data.qualifyingGrid, "QUALIFYING FINAL GRID"); return; }
      this.showRaceWeekendSummary(); return;
    }
    if (mode === "RACE") {
      if (data.race) { this.renderSessionResults(data.race.results, "RACE RESULTS"); return; }
      this.showRaceWeekendSummary(); return;
    }
    this.showRaceWeekendSummary();
  },

  renderSessionSetup(title, bodyHtml) {
    const resultsArea = document.getElementById("session-results");
    const resultTitle = document.getElementById("result-title");
    const resultTable = document.getElementById("result-table");
    if (!resultsArea || !resultTable) return;
    resultsArea.classList.remove("hidden");
    resultTitle.innerText = title;
    resultTable.innerHTML = `<div class="race-session-setup">${bodyHtml}</div>`;
  },

  renderSessionResults(results, title) {
    const resultsArea = document.getElementById("session-results");
    const resultTitle = document.getElementById("result-title");
    const resultTable = document.getElementById("result-table");
    if (!resultsArea || !resultTable) return;

    resultsArea.classList.remove("hidden");
    if (resultTitle) resultTitle.innerText = title;

    let html = `<table class="results-table"><thead><tr>
      <th>POS</th><th>DRIVER</th><th>TEAM</th><th>TIME/GAP</th><th>TYRE</th><th>PITS</th>
    </tr></thead><tbody>`;

    results.forEach((r) => {
      const isP = r.isPlayer;
      const compound = Utils.TYRE_COMPOUNDS[r.compound];
      const compBadge = compound ? `<span class="tyre-badge-sm" style="background:${compound.color}">${compound.code}</span>` : "-";
      const fl = r.fastestLap ? ' 🟣' : '';

      html += `
        <tr class="${isP ? 'player-row' : ''} ${r.dnf ? 'dnf-row' : ''}">
          <td class="pos-cell ${r.pos <= 3 ? 'podium' : ''}">${r.dnf ? 'DNF' : r.pos}</td>
          <td class="driver-cell">${r.code} ${r.name}${fl}</td>
          <td class="team-cell">${r.teamName || '-'}</td>
          <td class="time-cell">${r.dnf ? r.dnfReason : r.time}</td>
          <td>${compBadge}</td>
          <td>${r.pitCount ?? '-'}</td>
        </tr>`;
    });

    html += `</tbody></table>
      <div class="results-actions">
        <button class="btn-session-start" onclick="UI.showRaceWeekendSummary()">↩ KEMBALI KE SCHEDULE</button>
      </div>`;
    resultTable.innerHTML = html;
  },

  // =============================================
  // RACE DEBRIEF (Post-Race)
  // =============================================
  renderRaceDebrief(results, rewards) {
    const resultsArea = document.getElementById("session-results");
    const resultTitle = document.getElementById("result-title");
    const resultTable = document.getElementById("result-table");
    if (!resultsArea || !resultTable) return;

    document.getElementById("sim-area")?.classList.add("hidden");
    resultsArea.classList.remove("hidden");
    resultTitle.innerText = "🏁 RACE DEBRIEF";

    const playerResults = results.filter(r => r.isPlayer);
    const prizeText = rewards?.money ? `Rp ${rewards.money.toLocaleString("id-ID")}` : "Rp 0";

    let pointsSummary = "";
    if (rewards?.points) {
      pointsSummary = Object.entries(rewards.points).map(([id, pts]) => {
        const driver = results.find(r => r.id === id);
        return `<span class="debrief-point">${driver?.code || id}: <strong>+${pts} pts</strong></span>`;
      }).join("");
    }

    let eventLogHTML = "";
    if (Engine.sim.teamEvents && Engine.sim.teamEvents.length > 0) {
      eventLogHTML = `<div class="debrief-header" style="margin-bottom:15px; background: rgba(0,0,0,0.4);">
        <h4 style="color:var(--f1-neon); margin:0 0 10px 0; font-size:13px;">📻 POST-RACE TEAM RADIO LOG</h4>
        <div style="max-height: 150px; overflow-y: auto; padding-right: 10px;">
          <ul style="list-style:none; padding:0; margin:0; font-size:11px; color:var(--text-muted); font-family:monospace; display:flex; flex-direction:column; gap:6px;">
            ${Engine.sim.teamEvents.map(e => `<li><strong style="color:var(--text-white)">Lap ${e.lap}:</strong> ${e.text}</li>`).join("")}
          </ul>
        </div>
      </div>`;
    }

    let html = `
      ${eventLogHTML}
      <div class="debrief-header">
        <div class="debrief-rewards">
          <div class="debrief-item"><span class="debrief-label">PRIZE MONEY</span><span class="debrief-value text-neon-green">${prizeText}</span></div>
          <div class="debrief-item"><span class="debrief-label">POINTS EARNED</span><div class="debrief-points-row">${pointsSummary || "Tidak ada poin"}</div></div>
        </div>
      </div>`;

    // Results table
    html += `<table class="results-table"><thead><tr>
      <th>POS</th><th>DRIVER</th><th>TEAM</th><th>GAP</th><th>BEST LAP</th><th>TYRE</th><th>PITS</th>
    </tr></thead><tbody>`;

    results.forEach((r) => {
      const compound = Utils.TYRE_COMPOUNDS[r.compound];
      const compBadge = compound ? `<span class="tyre-badge-sm" style="background:${compound.color}">${compound.code}</span>` : "-";
      const fl = r.fastestLap ? ' 🟣' : '';

      html += `
        <tr class="${r.isPlayer ? 'player-row' : ''} ${r.dnf ? 'dnf-row' : ''}">
          <td class="pos-cell ${r.pos <= 3 ? 'podium' : ''}">${r.dnf ? 'DNF' : r.pos}</td>
          <td class="driver-cell">${r.code} ${r.name}${fl}</td>
          <td class="team-cell">${r.teamName || '-'}</td>
          <td class="time-cell">${r.dnf ? r.dnfReason : r.time}</td>
          <td class="time-cell">${r.bestLap || '-'}${fl}</td>
          <td>${compBadge}</td>
          <td>${r.pitCount ?? '-'}</td>
        </tr>`;
    });

    html += `</tbody></table>
      <div class="results-actions">
        <button class="btn-session-start" onclick="UI.showScreen('hq')">↩ KEMBALI KE HQ</button>
        <button class="btn-session-start" onclick="UI.showScreen('standings')">📊 LIHAT STANDINGS</button>
      </div>`;

    resultTable.innerHTML = html;
  },

  // =============================================
  // STANDINGS (WDC / WCC)
  // =============================================
  renderStandings() {
    const container = document.getElementById("standings-content");
    if (!container) return;

    // WDC
    const driverPoints = State.driverPoints || {};
    const driverList = Object.entries(driverPoints)
      .map(([id, pts]) => {
        const driver = Data.drivers.find(d => d.id === id);
        const team = driver ? Data.teams.find(t => t.id === driver.team_id) : null;
        return { id, name: driver?.full_name || id, code: driver?.driver_code || "???", teamName: team?.name || "-", teamColor: team?.color || "#fff", pts };
      })
      .sort((a, b) => b.pts - a.pts);

    // WCC
    const teamPointsMap = {};
    driverList.forEach(d => {
      if (!teamPointsMap[d.teamName]) teamPointsMap[d.teamName] = { name: d.teamName, color: d.teamColor, pts: 0 };
      teamPointsMap[d.teamName].pts += d.pts;
    });
    const teamList = Object.values(teamPointsMap).sort((a, b) => b.pts - a.pts);

    let html = `
      <div class="standings-tabs">
        <button class="standings-tab active" onclick="UI.switchStandingsTab('wdc', this)">🏆 WDC</button>
        <button class="standings-tab" onclick="UI.switchStandingsTab('wcc', this)">🏗️ WCC</button>
      </div>
      <div id="standings-wdc" class="standings-panel">
        <table class="standings-table"><thead><tr><th>P</th><th>DRIVER</th><th>TEAM</th><th>PTS</th></tr></thead><tbody>`;

    driverList.forEach((d, i) => {
      const isPlayer = State.drivers?.some(sd => sd.id === d.id);
      html += `<tr class="${isPlayer ? 'player-row' : ''}">
        <td class="${i < 3 ? 'podium' : ''}">${i + 1}</td>
        <td style="border-left:3px solid ${d.teamColor}; padding-left:8px">${d.code} ${d.name}</td>
        <td>${d.teamName}</td>
        <td class="pts-cell"><strong>${d.pts}</strong></td>
      </tr>`;
    });

    html += `</tbody></table></div>
      <div id="standings-wcc" class="standings-panel hidden">
        <table class="standings-table"><thead><tr><th>P</th><th>TEAM</th><th>PTS</th></tr></thead><tbody>`;

    teamList.forEach((t, i) => {
      html += `<tr>
        <td class="${i < 3 ? 'podium' : ''}">${i + 1}</td>
        <td style="border-left:3px solid ${t.color}; padding-left:8px">${t.name}</td>
        <td class="pts-cell"><strong>${t.pts}</strong></td>
      </tr>`;
    });

    html += `</tbody></table></div>`;

    if (driverList.length === 0) {
      html = `<div class="empty-standings"><p>Belum ada data balapan. Selesaikan race pertama untuk melihat standings.</p></div>`;
    }

    container.innerHTML = html;
  },

  switchStandingsTab(tab, btn) {
    document.querySelectorAll(".standings-panel").forEach(p => p.classList.add("hidden"));
    document.getElementById(`standings-${tab}`)?.classList.remove("hidden");
    document.querySelectorAll(".standings-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  },

  // =============================================
  // R&D Screen (Basic)
  // =============================================
  renderRnD() {
    const container = document.getElementById("rnd-content");
    if (!container) return;

    const chassis = State.chassis;
    const pu = State.pu;

    container.innerHTML = `
      <div class="rnd-grid">
        <div class="rnd-card">
          <div class="card-header-f1">CHASSIS: ${chassis?.name || "TBA"}</div>
          <div class="rnd-stats">
            ${this.renderStatBar("Aero Efficiency", chassis?.stats?.aerodynamics?.aero_efficiency)}
            ${this.renderStatBar("Top Speed", chassis?.stats?.performance?.top_speed)}
            ${this.renderStatBar("Traction", chassis?.stats?.mechanical?.traction)}
            ${this.renderStatBar("Tyre Preservation", chassis?.stats?.performance?.tyre_preservation)}
            ${this.renderStatBar("Reliability", chassis?.stats?.reliability?.failure_resistance)}
          </div>
        </div>
        <div class="rnd-card">
          <div class="card-header-f1">POWER UNIT: ${pu?.manufacturer || "TBA"}</div>
          <div class="rnd-stats">
            ${this.renderStatBar("Overall", pu?.stats?.overall_performance)}
            ${this.renderStatBar("ERS Output", pu?.stats?.hybrid_system?.ers_output)}
            ${this.renderStatBar("Reliability", pu?.stats?.reliability?.failure_resistance)}
          </div>
        </div>
        <div class="rnd-card">
          <div class="card-header-f1">DEVELOPMENT BUDGET</div>
          <p class="rnd-budget">Rp ${(State.budget || 0).toLocaleString("id-ID")}</p>
          <p class="rnd-note">💡 R&D upgrade system akan tersedia di update berikutnya.</p>
        </div>
      </div>`;
  },

  renderStatBar(label, value) {
    const v = value || 0;
    const color = v > 90 ? "#00ff87" : v > 75 ? "#00aaff" : v > 60 ? "#ffaa00" : "#ff4444";
    return `<div class="rnd-stat-row">
      <span class="rnd-stat-label">${label}</span>
      <div class="rnd-bar"><div class="rnd-bar-fill" style="width:${v}%; background:${color}"></div></div>
      <span class="rnd-stat-val">${v}</span>
    </div>`;
  },

  renderSeasonSummary() {
    const resultsArea = document.getElementById("session-results");
    const resultTable = document.getElementById("result-table");
    if (!resultsArea || !resultTable) return;
    resultsArea.classList.remove("hidden");
    resultTable.innerHTML = `
      <div class="season-end">
        <h2>🏆 MUSIM 2026 SELESAI!</h2>
        <p>Selamat telah menyelesaikan musim. Lihat standings untuk hasil akhir.</p>
        <button class="btn-session-start" onclick="UI.showScreen('standings')">📊 FINAL STANDINGS</button>
      </div>`;
  },

  // =============================================
  // CALENDAR
  // =============================================
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

      const startDate = new Date(sch.sessions[0].date);
      const endDate = new Date(sch.sessions[sch.sessions.length - 1].date);
      const options = { month: "short", day: "numeric" };
      const dateRange = startDate.toLocaleDateString("en-US", options) + " - " + endDate.toLocaleDateString("en-US", options);

      const div = document.createElement("div");
      div.className = `calendar-item ${isCurrent ? "current-race" : ""} ${isFinished ? "finished-race" : ""}`;

      // Get player result if finished
      let resultBadge = "";
      const weekend = State.raceWeekends?.[sch.round];
      if (weekend?.race?.results) {
        const playerResult = weekend.race.results.find(r => r.isPlayer);
        if (playerResult) resultBadge = `<span class="calendar-result">P${playerResult.pos}</span>`;
      }

      div.innerHTML = `
        <div class="calendar-round">R${sch.round}</div>
        <div class="calendar-flag">
          <img src="https://flagsapi.com/${countryCode}/flat/48.png" alt="${sch.country}" onerror="this.style.display='none'" />
        </div>
        <div class="calendar-details">
          <div class="calendar-grand-prix">${sch.grand_prix}</div>
          <div class="calendar-circuit">${circuitName}</div>
          <div class="calendar-date">${dateRange}</div>
        </div>
        <div class="calendar-status">
          ${isCurrent ? '<span class="badge-live">LIVE</span>' : ""}
          ${isFinished ? '<span class="badge-done">DONE</span>' : ""}
          ${resultBadge}
        </div>`;

      div.addEventListener('click', () => UI.showRaceDetailsModal(sch, circuitName, dateRange));
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
      const div = document.createElement('div');
      div.className = 'modal-session-item';
      div.innerHTML = `<span>${session.session}</span><span>${new Date(session.date).toLocaleDateString("en-US", {month:"short",day:"numeric"})} ${session.time_utc.substring(0,5)} UTC</span>`;
      sessionsList.appendChild(div);
    });

    const historyList = document.getElementById("modal-history-list");
    historyList.innerHTML = '';
    const weekend = State.raceWeekends?.[scheduleItem.round];
    if (weekend && (weekend.fp || weekend.q1 || weekend.race)) {
      historyList.innerHTML = `<div class="modal-results-history"><h4>HASIL WEEKEND</h4>${this.renderWeekendHistoryHtml(weekend)}</div>`;
    }

    modal.classList.remove("hidden");
  },

  renderWeekendHistoryHtml(weekend) {
    const renderTop = (title, sessionData) => {
      if (!sessionData?.results) return "";
      const rows = sessionData.results.slice(0, 5).map((r) => `<li class="${r.isPlayer ? 'player-li' : ''}">#${r.pos} ${r.code} - ${r.time}</li>`).join("");
      return `<div class="modal-result-block"><strong>${title}</strong><ul>${rows}</ul></div>`;
    };
    return [
      renderTop("FP", weekend.fp), renderTop("Q1", weekend.q1), renderTop("Q2", weekend.q2),
      renderTop("Q3", weekend.q3), renderTop("RACE", weekend.race),
    ].join("");
  },

  hideRaceDetailsModal() {
    document.getElementById("race-detail-modal")?.classList.add("hidden");
  },

  // =============================================
  // WIZARD (Create Team)
  // =============================================
  renderHorizontalCards(containerId, itemsList, targetField, callbackEvent) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    if (!itemsList || !Array.isArray(itemsList)) {
      container.innerHTML = `<div style="color:var(--f1-red); font-size:12px; padding:15px;">⚠️ GAGAL MEMUAT ASET (${containerId})</div>`;
      return;
    }

    const sortedItems = [...itemsList].sort((a, b) => {
      const priceA = a.price_idr || a.financials?.estimated_annual_value_idr || 0;
      const priceB = b.price_idr || b.financials?.estimated_annual_value_idr || 0;
      return priceA - priceB;
    });

    container.addEventListener("wheel", (evt) => { evt.preventDefault(); container.scrollLeft += evt.deltaY; }, { passive: false });

    sortedItems.forEach((item) => {
      const card = document.createElement("div");
      card.className = "selection-card";

      const itemId = item.id || item.team_id;
      const isDriverSelection = targetField === "driverId";
      const driverSlot = WizardForm.driver1Id === itemId ? 1 : (WizardForm.driver2Id === itemId ? 2 : null);
      const isAlreadySelected = isDriverSelection ? driverSlot !== null : (WizardForm[targetField] === itemId);

      if (isAlreadySelected) card.classList.add("selected");

      const itemPrice = item.price_idr || item.financials?.estimated_annual_value_idr || 0;
      const isSponsorSelection = containerId === "container-sponsor";
      const isAffordable = isSponsorSelection || isAlreadySelected || (Finance.currentWizardBudget >= itemPrice);

      card.dataset.id = itemId;
      const cardTitle = item.full_name || item.title_sponsor || item.name || item.manufacturer || "Unknown";

      let statsHtml = "";
      if (item.financials?.estimated_annual_value_idr) {
        statsHtml += `<div class="card-stat-row"><span class="card-stat-label">Dana:</span><span class="card-stat-value" style="color:var(--f1-neon)">Rp ${(item.financials.estimated_annual_value_idr / 1e9).toLocaleString("id-ID")}B</span></div>`;
      }
      if (item.driver_code) statsHtml += `<div class="card-stat-row"><span class="card-stat-label">Kode:</span><span class="card-stat-value">${item.driver_code}</span></div>`;
      if (item.nationality) statsHtml += `<div class="card-stat-row"><span class="card-stat-label">Negara:</span><span class="card-stat-value">${item.nationality}</span></div>`;
      if (item.stats?.overall) statsHtml += `<div class="card-stat-row"><span class="card-stat-label">Rating:</span><span class="card-stat-value" style="color:var(--neon-blue)">★ ${item.stats.overall}</span></div>`;
      if (item.stats?.overall_performance) statsHtml += `<div class="card-stat-row"><span class="card-stat-label">Performa:</span><span class="card-stat-value">★ ${item.stats.overall_performance}</span></div>`;

      let costLabel = "GRATIS";
      if (item.price_idr) costLabel = `Rp ${(item.price_idr / 1e9).toLocaleString("id-ID")}B`;
      else if (item.financials) costLabel = "KONTRAK";

      card.innerHTML = `
        <div class="selected-badge">${isDriverSelection && driverSlot ? `DRIVER ${driverSlot}` : "TERKONTRAK"}</div>
        <div class="card-title">${cardTitle}</div>
        <div class="card-stats-box">${statsHtml}</div>
        <div class="card-price">${costLabel}</div>`;

      if (!isAffordable) {
        card.classList.add("unaffordable-card");
        const priceEl = card.querySelector(".card-price");
        if (priceEl && !isSponsorSelection) priceEl.innerText = "Anggaran Tidak Cukup";
      }

      card.addEventListener("click", () => {
        if (isDriverSelection) {
          if (WizardForm.driver1Id === itemId) { WizardForm.driver1Id = WizardForm.driver2Id; WizardForm.driver2Id = null; }
          else if (WizardForm.driver2Id === itemId) { WizardForm.driver2Id = null; }
          else {
            if (!isAffordable) { alert("Anggaran Tidak Cukup"); return; }
            if (!WizardForm.driver1Id) WizardForm.driver1Id = itemId;
            else if (!WizardForm.driver2Id) WizardForm.driver2Id = itemId;
            else WizardForm.driver2Id = itemId;
          }
        } else if (isAlreadySelected) {
          WizardForm[targetField] = null;
          if (isSponsorSelection) { State.budget = 0; UI.updateTopBar(); }
        } else {
          if (!isAffordable) { alert("Anggaran Tidak Cukup"); return; }
          WizardForm[targetField] = itemId;
          if (isSponsorSelection && item.financials) { State.budget = item.financials.estimated_annual_value_idr; UI.updateTopBar(); }
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
    document.getElementById(`step-${WizardForm.step}`)?.classList.add("hidden");
    WizardForm.step += direction;
    document.getElementById(`step-${WizardForm.step}`)?.classList.remove("hidden");

    document.querySelectorAll(".wiz-dot").forEach((dot) => {
      const stepNum = parseInt(dot.getAttribute("data-step"));
      dot.classList.toggle("active", stepNum <= WizardForm.step);
    });

    document.getElementById("btn-wizard-prev").disabled = WizardForm.step === 1;
    document.getElementById("btn-wizard-next").classList.toggle("hidden", WizardForm.step === 4);
    document.getElementById("btn-wizard-submit").classList.toggle("hidden", WizardForm.step !== 4);
  },

  canLeaveWizardStep(step) {
    if (step === 1 && (!document.getElementById("input-team-name").value.trim() || !WizardForm.sponsorId)) {
      alert("Isi nama konstruktor dan pilih sponsor utama."); return false;
    }
    if (step === 2 && (!WizardForm.teamChiefId || !WizardForm.techChiefId)) {
      alert("Pilih Team Principal dan Technical Director."); return false;
    }
    if (step === 3 && (!WizardForm.puId || !WizardForm.chassisId)) {
      alert("Pilih Power Unit dan Chassis."); return false;
    }
    return true;
  },

  updateTopBar() {
    const teamEl = document.getElementById("top-team-name");
    const budgetEl = document.getElementById("top-budget");
    if (teamEl) teamEl.innerText = (State.teamName || "-").toUpperCase();
    if (budgetEl) budgetEl.innerText = (State.budget || 0).toLocaleString("id-ID");
  },

  setupHQ() {
    const s = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };

    s("hq-team", State.teamName || "TBA");
    s("hq-sponsor", State.sponsor?.title_sponsor || State.sponsor?.name || "TBA");
    s("hq-tchief", State.teamChief?.full_name || "TBA");
    s("hq-tech", State.techChief?.full_name || "TBA");
    s("hq-pu", State.pu ? `${State.pu.manufacturer || ""} ${State.pu.architecture || ""}`.trim() || State.pu.name : "TBA");
    s("hq-chassis", State.chassis?.name || "TBA");
    s("hq-drv1", State.drivers?.[0]?.full_name || "TBA");
    s("hq-drv2", State.drivers?.[1]?.full_name || "TBA");

    const nextEvent = Data.schedules.find((e) => e.round === State.currentRound && e.type === "race_weekend");
    const completed = State.raceWeekends ? Object.values(State.raceWeekends).filter((w) => w.race).length : 0;
    const points = State.driverPoints || {};
    const pointText = State.drivers?.length
      ? State.drivers.map((d) => `${d.driver_code || d.last_name}: ${points[d.id] || 0} pts`).join(" | ")
      : "0";

    s("hq-next-round", nextEvent ? `R${nextEvent.round} - ${nextEvent.grand_prix}` : "Season Complete");
    s("hq-completed-rounds", `${completed} races completed`);
    s("hq-driver-points", pointText);
  },

  toggleSidebar() {
    document.getElementById("main-nav")?.classList.toggle("collapsed");
  },
};
