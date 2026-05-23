// ============================================================
// Dashboard Screen — F1 Manager 2026
// Main game hub matching template.html visual layout
// ============================================================

import { store }  from '../core/store.js'
import { router } from '../core/router.js'

export function renderDashboard() {
  const el = document.getElementById('screen-dashboard')
  if (!el) return

  const team    = store.get('playerTeam')
  const drivers = store.getDrivers()
  const teams   = store.get('allTeams') ?? []
  const nextRace = store.getNextRace()
  const circuit  = nextRace ? store.getCircuitFor(nextRace.id) : null

  const d1 = drivers.find(d => d.id === team?.driver1_id)
  const d2 = drivers.find(d => d.id === team?.driver2_id)
  const teamColor = team?.color ?? '#ff8700'
  const cash = team?.economy?.cash_reserve ?? 20000000

  // Sort teams by points for standings
  const standings = [...teams]
    .filter(t => t.performance_state)
    .sort((a, b) => (b.performance_state?.points ?? 0) - (a.performance_state?.points ?? 0))
    .slice(0, 10)

  el.innerHTML = `
  <div class="dashboard">
    <!-- TOP BAR -->
    <div class="top-bar">
      <div class="home-title">
        <i class="ti ti-home-2 nav-svg"></i> HOME
      </div>
      <button class="continue-btn" id="btn-continue">
        <span class="title">
          <i class="ti ti-flag-check nav-svg"></i> Continue
        </span>
        <span class="sub">
          <i class="ti ti-calendar-time nav-svg"></i>
          ${nextRace ? `To ${nextRace.grand_prix ?? 'Next Race'}` : 'Season Start'}
        </span>
      </button>
    </div>

    <!-- MAIN GRID -->
    <div class="main-grid">

      <!-- Col 1: Team Info Panel -->
      <div class="panel">
        <div class="team-logo">
          <span style="color:${teamColor}">${(team?.name ?? 'MY TEAM').toUpperCase()}</span>
          <div class="sub-logo">FORMULA 1 TEAM</div>
        </div>
        <div class="spacer"></div>
        <div class="objective-row">
          <span class="objective-label">Season Objective</span>
          <span>${team?.status?.tier === 'top' ? '1st' : team?.status?.tier === 'midfield' ? '5th or Above' : '8th or Above'}</span>
        </div>
        <div class="objective-row">
          <span class="objective-label">Cash Reserve</span>
          <span class="money font-digits">$${(cash / 1e6).toFixed(1)}M</span>
        </div>
        <div class="objective-row">
          <span class="objective-label">Position</span>
          <span class="font-digits">${team?.performance_state?.championship_position ?? '–'}TH</span>
        </div>
        <div class="board-selector" id="btn-board">
          <span><i class="ti ti-clipboard-list nav-svg"></i> The Board</span>
          <i class="ti ti-chevron-down nav-svg" style="margin-left:8px;margin-right:0"></i>
        </div>
      </div>

      <!-- Col 2: Drivers -->
      <div class="drivers-container">
        ${_driverCard(d1, team?.performance_state?.championship_position ?? '–', teamColor)}
        ${_driverCard(d2, '–', teamColor)}
      </div>

      <!-- Col 3: Mentality Hub -->
      <div class="panel">
        <div class="mentality-top">
          <div class="donut-chart" id="mentalityDonut">
            <div class="donut-inner"></div>
          </div>
          <div class="mentality-title">
            <h3><i class="ti ti-heartbeat nav-svg"></i> MENTALITY HUB</h3>
            <span>[Mostly Positive]</span>
          </div>
        </div>
        <div class="mentality-issue">
          <span class="objective-label">↓ Lowest Mentality</span>
          <span>${d2?.full_name ?? d2?.name ?? '–'}</span>
        </div>
        <div class="mentality-issue">
          <span class="objective-label">! Biggest Issue</span>
          <span class="issue-val-red">Personnel Morale</span>
        </div>
        <button class="mentality-btn">
          <i class="ti ti-brain nav-svg"></i> Mentality Hub
        </button>
      </div>

      <!-- Col 4: Standings -->
      <div class="panel">
        <div class="standings-header">
          <div class="active"><i class="ti ti-list-numbers nav-svg"></i> Standings</div>
          <div><i class="ti ti-building nav-svg"></i> Constructors</div>
          <div><i class="ti ti-wheel nav-svg"></i> Drivers</div>
        </div>
        ${standings.length ? standings.map((t, i) => {
          const isPlayer = t.id === team?.id || t.is_player_team
          return `<div class="standing-row ${isPlayer ? 'highlight' : ''}">
            <span class="pos">${i + 1}</span>
            <span class="team-name-col">${t.name ?? t.id}</span>
            <span class="pts">${t.performance_state?.points ?? 0}</span>
          </div>`
        }).join('') : `
          <div class="text-f1-dim text-xs py-4 text-center">No standings data yet.</div>
        `}
      </div>

      <!-- Col 5: Up Next -->
      <div class="panel up-next-panel">
        <div class="up-next-header"><i class="ti ti-road nav-svg"></i> UP NEXT</div>
        <div class="up-next-badge font-digits">${nextRace?.round ?? '01'}</div>
        <div class="up-next-bg">
          <div class="track-placeholder"></div>
          <div class="race-title">${circuit?.name ?? nextRace?.grand_prix ?? 'UPCOMING'}</div>
          <div class="race-date">${nextRace?.country ?? ''} ${circuit?.city ? '• ' + circuit.city : ''}</div>
        </div>
      </div>

      <!-- Col 6: Events -->
      <div class="panel">
        <h3 class="events-title"><i class="ti ti-calendar-event nav-svg"></i> UPCOMING EVENTS</h3>
        <div class="event-group">
          <div class="event-time"><i class="ti ti-clock nav-svg"></i> NEXT</div>
          <div class="event-item red">
            <div class="event-info">
              <h4><i class="ti ti-flag nav-svg"></i> ${nextRace?.grand_prix ?? 'Season Start'}</h4>
              <p>Round ${nextRace?.round ?? 1}</p>
            </div>
          </div>
          <div class="event-item purple">
            <div class="event-info">
              <h4><i class="ti ti-flask nav-svg"></i> Pre-Season Testing</h4>
              <p>Testing Results</p>
            </div>
          </div>
        </div>
        <div class="event-group">
          <div class="event-time"><i class="ti ti-clock nav-svg"></i> IN 1 WEEK</div>
          <div class="event-item">
            <div class="event-info">
              <h4><i class="ti ti-cash nav-svg"></i> Sponsor Negotiation</h4>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- BOTTOM BAR -->
    <div class="bottom-bar">
      <div class="bottom-nav">
        <div class="nav-icon active" data-nav="dashboard"><i class="ti ti-home-2"></i></div>
        <div class="nav-icon" data-nav="personnel"><i class="ti ti-users"></i></div>
        <div class="nav-icon" data-nav="calendar"><i class="ti ti-calendar-event"></i></div>
        <div class="nav-icon" data-nav="rnd"><i class="ti ti-flask"></i></div>
        <div class="nav-icon" data-nav="finance"><i class="ti ti-chart-bar"></i></div>
        <div class="nav-icon" id="btn-main-menu"><i class="ti ti-logout"></i></div>
      </div>
      <div class="bottom-info">
        <span class="font-digits">2026</span>
        <span>${nextRace ? nextRace.country : ''}</span>
        <span class="money">$${(cash / 1e6).toFixed(1)}M</span>
      </div>
    </div>
  </div>
  `

  // GSAP animate panels
  if (window.gsap) {
    gsap.from('.main-grid > *', {
      opacity: 0, y: 20, duration: 0.4,
      stagger: 0.08, ease: 'power2.out', delay: 0.15,
    })
  }

  // Nav events
  document.querySelectorAll('[data-nav]').forEach(nav => {
    nav.addEventListener('click', () => {
      const target = nav.dataset.nav
      if (target && target !== 'dashboard') router.goTo(target)
    })
  })

  document.getElementById('btn-main-menu')?.addEventListener('click', () => router.goTo('main-menu'))
  document.getElementById('btn-continue')?.addEventListener('click', () => router.goTo('race'))

  // Chart.js mentality donut
  _renderMentalityChart()
}

function _driverCard(driver, rank, teamColor) {
  if (!driver) return `
    <div class="driver-card" style="border-top:3px solid ${teamColor}">
      <div class="driver-stats"><span class="driver-rank">–</span></div>
      <div class="driver-image-placeholder"><span class="text-f1-dim text-sm">No Driver</span></div>
      <div class="driver-name"><small style="color:${teamColor}">–</small><strong>VACANT</strong></div>
    </div>`

  const stats = driver.stats ?? {}
  const ovr = Math.round(((stats.pace ?? 70) + (stats.racecraft ?? 70) + (stats.concentration ?? 70)) / 3)
  const lastName = (driver.full_name ?? driver.name ?? '').split(' ').pop().toUpperCase()
  const firstName = (driver.full_name ?? driver.name ?? '').split(' ').slice(0, -1).join(' ').toUpperCase()

  return `
    <div class="driver-card" style="border-top:3px solid ${teamColor}">
      <div class="driver-stats">
        <div class="driver-rank">${rank}TH</div>
        <div class="driver-rating">OVR<span>${ovr}</span></div>
      </div>
      <div class="driver-image-placeholder">
        <div style="font-size:4rem;opacity:0.3">🏎</div>
      </div>
      <div class="driver-name" style="border-color:${teamColor}">
        <small style="color:${teamColor}">${firstName}</small>
        <strong>${lastName}</strong>
      </div>
    </div>
  `
}

function _renderMentalityChart() {
  const canvas = document.createElement('canvas')
  canvas.width = 80
  canvas.height = 80
  const donut = document.getElementById('mentalityDonut')
  if (!donut || !window.Chart) return
  donut.innerHTML = ''
  donut.style.background = 'none'
  donut.appendChild(canvas)
  new Chart(canvas, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [75, 25],
        backgroundColor: ['#00e5ff', '#333'],
        borderWidth: 0,
      }]
    },
    options: {
      cutout: '70%',
      responsive: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
    }
  })
}
