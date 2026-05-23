// ============================================================
// Finance Screen — F1 Manager 2026
// Budget, income/expense charts, contract overview
// ============================================================

import { store }  from '../core/store.js'
import { router } from '../core/router.js'

export function renderFinance() {
  const el = document.getElementById('screen-finance')
  if (!el) return

  const team = store.get('playerTeam')
  const eco  = team?.economy ?? {}
  const cash   = eco.cash_reserve   ?? 20000000
  const budget = eco.budget_cap     ?? 135000000
  const income = eco.sponsor_income ?? 12000000
  const costs  = eco.operational_cost ?? 8000000

  el.innerHTML = `
    <div class="flex flex-col h-full bg-f1-dark">

      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-3 bg-black/40 border-b border-f1-border">
        <button class="f1-btn f1-btn-secondary" id="btn-back">
          <i class="ti ti-arrow-left"></i> Dashboard
        </button>
        <div class="font-orbitron text-lg tracking-wider"><i class="ti ti-chart-bar nav-svg"></i> FINANCE</div>
        <div></div>
      </div>

      <div class="flex-1 overflow-y-auto p-5">

        <!-- Summary Cards -->
        <div class="grid grid-cols-4 gap-4 mb-6">
          ${_finCard('CASH RESERVE', `$${(cash/1e6).toFixed(1)}M`, '#00e5ff', 'ti-cash')}
          ${_finCard('BUDGET CAP',   `$${(budget/1e6).toFixed(0)}M`, '#ff8700', 'ti-shield')}
          ${_finCard('SPONSOR INCOME', `$${(income/1e6).toFixed(1)}M`, '#22c55e', 'ti-arrow-up-right')}
          ${_finCard('OPERATING COST', `$${(costs/1e6).toFixed(1)}M`, '#e10600', 'ti-arrow-down-right')}
        </div>

        <!-- Budget Cap Progress -->
        <div class="panel mb-6">
          <div class="flex justify-between items-center mb-2">
            <span class="font-orbitron text-sm tracking-wider text-f1-dim">BUDGET CAP USAGE</span>
            <span class="font-digits text-f1-orange">${Math.round((costs / budget) * 100)}%</span>
          </div>
          <div class="w-full h-4 bg-black/40 rounded-full overflow-hidden">
            <div class="h-full rounded-full" style="width:${Math.min(100, (costs / budget) * 100)}%;background:linear-gradient(90deg,#00e5ff,#ff8700)"></div>
          </div>
          <div class="flex justify-between text-xs text-f1-dim mt-1">
            <span>$0</span>
            <span>$${(budget/1e6).toFixed(0)}M</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-5">
          <!-- Income vs Expense Bar Chart -->
          <div class="panel">
            <h3 class="font-orbitron text-sm tracking-wider text-f1-cyan mb-3">
              <i class="ti ti-chart-bar nav-svg"></i> INCOME vs EXPENSES
            </h3>
            <div class="chart-container" style="height:220px">
              <canvas id="financeBarChart"></canvas>
            </div>
          </div>

          <!-- Breakdown Donut -->
          <div class="panel">
            <h3 class="font-orbitron text-sm tracking-wider text-f1-cyan mb-3">
              <i class="ti ti-chart-donut nav-svg"></i> COST BREAKDOWN
            </h3>
            <div class="chart-container" style="height:220px">
              <canvas id="financeDonutChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Contract Table -->
        <div class="panel mt-5">
          <h3 class="font-orbitron text-sm tracking-wider text-f1-cyan mb-3">
            <i class="ti ti-file-dollar nav-svg"></i> ACTIVE CONTRACTS
          </h3>
          <table class="personnel-table">
            <thead><tr><th>NAME</th><th>ROLE</th><th>SALARY / YR</th><th>EXPIRES</th></tr></thead>
            <tbody>
              ${_contractRows()}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  `

  document.getElementById('btn-back')?.addEventListener('click', () => router.goTo('dashboard'))

  _renderCharts()
  if (window.gsap) gsap.from('.panel', { opacity: 0, y: 15, stagger: 0.06, duration: 0.35 })
}

function _finCard(label, value, color, icon) {
  return `
    <div class="panel" style="border-top:3px solid ${color}">
      <div class="flex items-center gap-2 text-f1-dim text-xs font-orbitron mb-2">
        <i class="ti ${icon}" style="color:${color}"></i> ${label}
      </div>
      <div class="font-digits text-xl font-bold" style="color:${color}">${value}</div>
    </div>
  `
}

function _contractRows() {
  const team = store.get('playerTeam')
  const allP = store.get('allPersonnel') ?? []
  const myPeople = allP.filter(p =>
    p.id === team?.driver1_id || p.id === team?.driver2_id || p.team_id === team?.id
  ).slice(0, 8)

  if (!myPeople.length) return '<tr><td colspan="4" class="text-f1-dim text-center text-xs py-3">No contract data.</td></tr>'

  return myPeople.map(p => `
    <tr>
      <td class="font-bold">${p.full_name ?? p.name ?? p.id}</td>
      <td class="text-f1-dim">${p.role ?? '–'}</td>
      <td class="font-digits text-f1-orange">${p.price_idr ? '$' + (p.price_idr / 1e9).toFixed(1) + 'B IDR' : '–'}</td>
      <td class="font-digits">${p.contract_end_year ?? '2026'}</td>
    </tr>
  `).join('')
}

function _renderCharts() {
  if (!window.Chart) return

  // Bar Chart
  const bar = document.getElementById('financeBarChart')?.getContext('2d')
  if (bar) {
    new Chart(bar, {
      type: 'bar',
      data: {
        labels: ['Sponsors', 'Prize $', 'Merch', 'Salaries', 'R&D', 'Operations', 'Travel'],
        datasets: [
          { label: 'Income', data: [12, 8, 3, 0, 0, 0, 0], backgroundColor: '#00e5ff' },
          { label: 'Expense', data: [0, 0, 0, 15, 20, 6, 4], backgroundColor: '#e10600' },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: '#666', font: { size: 9 } }, grid: { color: '#1f2028' } },
          y: { ticks: { color: '#666', callback: v => '$' + v + 'M' }, grid: { color: '#1f2028' } },
        },
        plugins: { legend: { labels: { color: '#888', boxWidth: 10, font: { size: 10 } } } },
      },
    })
  }

  // Donut Chart
  const donut = document.getElementById('financeDonutChart')?.getContext('2d')
  if (donut) {
    new Chart(donut, {
      type: 'doughnut',
      data: {
        labels: ['Salaries', 'R&D', 'Operations', 'Travel', 'Penalties'],
        datasets: [{
          data: [33, 44, 13, 9, 1],
          backgroundColor: ['#00e5ff', '#ff8700', '#e10600', '#b000ff', '#666'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '60%',
        plugins: { legend: { position: 'right', labels: { color: '#888', font: { size: 10 }, padding: 8, boxWidth: 10 } } },
      },
    })
  }
}
