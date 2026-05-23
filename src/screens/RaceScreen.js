// ============================================================
// Race Weekend Screen — F1 Manager 2026
// Qualifying + Race simulation with live lap-by-lap updates
// ============================================================

import { store }  from '../core/store.js'
import { router } from '../core/router.js'
import { simulateQualifying, simulateRace, assignPoints } from '../core/race_sim.js'
import { formatLapTime, formatGap } from '../core/engine.js'
import { saveProgress } from '../core/persistence.js'

let _currentTab = 'qualifying'
let _raceEntries = []
let _qualResults = null
let _raceResults = null

export function renderRace() {
  const el = document.getElementById('screen-race')
  if (!el) return

  const team     = store.get('playerTeam')
  const drivers  = store.getDrivers()
  const allTeams = store.get('allTeams') ?? []
  const nextRace = store.getNextRace()
  const circuit  = nextRace ? store.getCircuitFor(nextRace.id) : null

  // Build entries for all drivers (pair each with their team + chassis + PU)
  _raceEntries = drivers.slice(0, 20).map(d => {
    const t = allTeams.find(t => t.id === d.team_id) ?? team
    return {
      driver:   d,
      team:     t,
      chassis:  { stats: { aerodynamics: 70 + Math.random() * 20, mechanical_grip: 65 + Math.random() * 20 } },
      pu:       { stats: { power: 70 + Math.random() * 20, deployment: 70 + Math.random() * 15 } },
      isPlayer: d.id === team?.driver1_id || d.id === team?.driver2_id,
    }
  })

  _currentTab = 'qualifying'
  _qualResults = null
  _raceResults = null

  el.innerHTML = `
    <div class="flex flex-col h-full bg-f1-dark">

      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-3 bg-black/40 border-b border-f1-border">
        <button class="f1-btn f1-btn-secondary" id="btn-back-dash">
          <i class="ti ti-arrow-left"></i> Dashboard
        </button>
        <div class="text-center">
          <div class="font-orbitron text-lg tracking-wider">${circuit?.name ?? 'RACE WEEKEND'}</div>
          <div class="text-f1-dim text-xs font-orbitron">${nextRace?.grand_prix ?? ''} • Round ${nextRace?.round ?? '?'}</div>
        </div>
        <div class="text-right text-xs text-f1-dim font-orbitron">
          LAPS: ${circuit?.laps ?? 57}<br/>
          ${circuit?.length_km ?? '5.3'} km
        </div>
      </div>

      <!-- Tabs -->
      <div class="race-tab-bar">
        <div class="race-tab active" data-tab="qualifying">QUALIFYING</div>
        <div class="race-tab" data-tab="race">RACE</div>
        <div class="race-tab" data-tab="results">RESULTS</div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4" id="raceContent"></div>

    </div>
  `

  document.getElementById('btn-back-dash')?.addEventListener('click', () => router.goTo('dashboard'))
  document.querySelectorAll('.race-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      _currentTab = tab.dataset.tab
      document.querySelectorAll('.race-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === _currentTab))
      _renderTab(circuit)
    })
  })

  _renderTab(circuit)
}

function _renderTab(circuit) {
  const content = document.getElementById('raceContent')
  if (!content) return

  if (_currentTab === 'qualifying') _renderQualifying(content, circuit)
  else if (_currentTab === 'race')  _renderRaceLive(content, circuit)
  else if (_currentTab === 'results') _renderResults(content)
}

// ---- QUALIFYING ----
function _renderQualifying(container, circuit) {
  container.innerHTML = `
    <div class="text-center py-8">
      <div class="text-f1-dim text-sm mb-4 font-orbitron tracking-wider">QUALIFYING SESSION</div>
      <button class="f1-btn f1-btn-primary text-lg px-8 py-4" id="btn-start-qual">
        <i class="ti ti-flag"></i> START QUALIFYING
      </button>
      ${_qualResults ? '<div class="text-f1-cyan text-xs mt-3">✓ Qualifying completed — view grid below</div>' : ''}
    </div>
    <div id="qual-grid"></div>
  `
  if (_qualResults) _showQualGrid()

  document.getElementById('btn-start-qual')?.addEventListener('click', () => {
    _qualResults = simulateQualifying(_raceEntries, circuit, 'dry')
    if (window.gsap) gsap.from('#qual-grid', { opacity: 0, y: 20, duration: 0.4 })
    _showQualGrid()
    showToast('Qualifying complete!')
  })
}

function _showQualGrid() {
  const grid = document.getElementById('qual-grid')
  if (!grid || !_qualResults) return
  const leaderMs = _qualResults[0]?.lapMs ?? 0
  grid.innerHTML = `
    <table class="live-table mt-4">
      <thead><tr>
        <th>POS</th><th>DRIVER</th><th>TEAM</th><th>TIME</th><th>GAP</th>
      </tr></thead>
      <tbody>
        ${_qualResults.map((r, i) => `
          <tr class="${r.isPlayer ? 'player-row' : ''} ${i === 0 ? 'p1' : i === 1 ? 'p2' : i === 2 ? 'p3' : ''}">
            <td class="font-digits">${i + 1}</td>
            <td><span class="inline-block w-1 h-4 rounded mr-2" style="background:${r.teamColor}"></span>${r.driverName}</td>
            <td class="text-f1-dim">${r.teamName}</td>
            <td class="font-digits">${r.lapTime}</td>
            <td class="text-f1-dim font-digits">${formatGap(r.lapMs, leaderMs)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

// ---- RACE ----
async function _renderRaceLive(container, circuit) {
  if (!_qualResults) {
    container.innerHTML = '<div class="text-center text-f1-dim py-12 font-orbitron">Complete Qualifying first.</div>'
    return
  }

  container.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <div class="text-f1-dim text-xs font-orbitron">RACE SIMULATION</div>
        <div class="font-orbitron text-xl" id="lapCounter">LAP 0 / ${circuit?.laps ?? 57}</div>
      </div>
      <button class="f1-btn f1-btn-primary" id="btn-start-race">
        <i class="ti ti-flag-check"></i> START RACE
      </button>
    </div>
    <div class="mb-4"><canvas id="telemetryChart" height="120"></canvas></div>
    <div id="live-standings"></div>
  `

  document.getElementById('btn-start-race')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-start-race')
    if (btn) { btn.disabled = true; btn.textContent = 'RACING…' }

    // Init telemetry chart
    const chartCtx = document.getElementById('telemetryChart')?.getContext('2d')
    let telemetryChart = null
    if (chartCtx && window.Chart) {
      telemetryChart = new Chart(chartCtx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Your Driver',
            data: [],
            borderColor: '#00e5ff',
            backgroundColor: 'rgba(0,229,255,0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
          }, {
            label: 'Leader',
            data: [],
            borderColor: '#ff8700',
            borderDash: [5, 3],
            tension: 0.3,
            pointRadius: 0,
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: { ticks: { color: '#555', maxTicksLimit: 10 }, grid: { color: '#1f2028' } },
            y: { ticks: { color: '#555' }, grid: { color: '#1f2028' } },
          },
          plugins: { legend: { labels: { color: '#888', boxWidth: 12, font: { size: 10 } } } },
        }
      })
    }

    const totalLaps = circuit?.laps ?? 57
    _raceResults = await simulateRace(_raceEntries, circuit, 'dry', (lap, standings) => {
      // Update lap counter
      const lc = document.getElementById('lapCounter')
      if (lc) lc.textContent = `LAP ${lap} / ${totalLaps}`

      // Update standings table
      _renderLiveStandings(standings)

      // Update telemetry chart
      if (telemetryChart) {
        const player = standings.find(s => s.isPlayer)
        const leader = standings[0]
        telemetryChart.data.labels.push(`L${lap}`)
        telemetryChart.data.datasets[0].data.push(player ? player.totalTimeMs / 1000 / lap : 0)
        telemetryChart.data.datasets[1].data.push(leader ? leader.totalTimeMs / 1000 / lap : 0)
        telemetryChart.update('none')
      }
    })

    _raceResults = assignPoints(_raceResults)
    _renderLiveStandings(_raceResults)
    const lc = document.getElementById('lapCounter')
    if (lc) lc.innerHTML = `<span class="text-f1-cyan">RACE COMPLETE</span>`
    showToast('🏁 Race finished! Check results tab.')

    // Persist a minimal "career progress" locally.
    // For now: increment round and add constructor points for player's team.
    try {
      const gs = store.get('gameState') ?? { currentSeasonId: '2026', currentRound: 0 }
      const playerTeam = store.get('playerTeam')
      const myEntry = _raceResults.find(r => r.isPlayer)
      const pts = myEntry?.points ?? 0
      if (playerTeam) {
        const nextRound = (gs.currentRound ?? 0) + 1
        const updatedTeam = {
          ...playerTeam,
          performance_state: {
            ...(playerTeam.performance_state ?? {}),
            points: (playerTeam.performance_state?.points ?? 0) + pts,
          },
        }
        const updatedGameState = { ...gs, currentRound: nextRound, currentPhase: 'RaceComplete' }
        store.merge({ playerTeam: updatedTeam, gameState: updatedGameState })
        saveProgress({ playerTeam: updatedTeam, gameState: updatedGameState, playerTeamMeta: store.get('playerTeamMeta') })
      }
    } catch (_) {}

    _currentTab = 'results'
    document.querySelectorAll('.race-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'results'))
    _renderResults(container)
  })
}

function _renderLiveStandings(standings) {
  const div = document.getElementById('live-standings')
  if (!div) return
  div.innerHTML = `
    <table class="live-table">
      <thead><tr>
        <th>P</th><th>DRIVER</th><th>TEAM</th><th>LAP</th><th>STATUS</th>
      </tr></thead>
      <tbody>
        ${standings.slice(0, 20).map((s, i) => `
          <tr class="${s.isPlayer ? 'player-row' : ''} ${i === 0 ? 'p1':''} ${i === 1 ? 'p2':''} ${i === 2 ? 'p3':''}">
            <td class="font-digits">${i + 1}</td>
            <td><span class="inline-block w-1 h-4 rounded mr-2" style="background:${s.teamColor}"></span>${s.driverName}</td>
            <td class="text-f1-dim">${s.teamName}</td>
            <td class="font-digits">${s.laps ?? '–'}</td>
            <td class="${s.dnf ? 'text-red' : 'text-cyan'}">${s.dnf ? 'DNF (L' + s.dnfLap + ')' : 'RUNNING'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

// ---- RESULTS ----
function _renderResults(container) {
  if (!_raceResults) {
    container.innerHTML = '<div class="text-center text-f1-dim py-12 font-orbitron">Complete the Race first.</div>'
    return
  }
  const podium = _raceResults.slice(0, 3)
  container.innerHTML = `
    <!-- Podium -->
    <div class="flex items-end justify-center gap-4 mb-6 mt-4">
      ${podium.map((p, i) => {
        const heights = [160, 200, 130]
        const labels  = ['2ND', '1ST', '3RD']
        const order   = [1, 0, 2]
        const idx = order[i]
        const s = podium[idx]
        return `
        <div class="flex flex-col items-center">
          <div class="text-sm font-bold mb-2">${s.driverName}</div>
          <div class="text-f1-dim text-xs mb-1">${s.teamName}</div>
          <div class="rounded-t text-center pt-3 font-orbitron text-xl font-bold"
            style="width:100px;height:${heights[i]}px;background:linear-gradient(to top,${i===1?'#ffd700':'#444'},transparent)">
            ${labels[i]}<br/><span class="text-xs text-f1-dim">${s.points ?? 0} pts</span>
          </div>
        </div>`
      }).join('')}
    </div>
    <!-- Full Results -->
    <table class="live-table">
      <thead><tr>
        <th>POS</th><th>DRIVER</th><th>TEAM</th><th>POINTS</th><th>STATUS</th>
      </tr></thead>
      <tbody>
        ${_raceResults.map((s, i) => `
          <tr class="${s.isPlayer ? 'player-row' : ''}">
            <td class="font-digits">${i + 1}</td>
            <td>${s.driverName}</td>
            <td class="text-f1-dim">${s.teamName}</td>
            <td class="font-digits text-f1-orange">${s.points ?? 0}</td>
            <td class="${s.dnf ? 'text-red' : ''}">${s.dnf ? 'DNF' : 'Finished'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="flex justify-center mt-6">
      <button class="f1-btn f1-btn-cyan" id="btn-back-to-dash">
        <i class="ti ti-home-2"></i> Back to Dashboard
      </button>
    </div>
  `
  document.getElementById('btn-back-to-dash')?.addEventListener('click', () => router.goTo('dashboard'))

  if (window.gsap) {
    gsap.from('.live-table tbody tr', { opacity: 0, x: -15, stagger: 0.03, duration: 0.3 })
  }
}
