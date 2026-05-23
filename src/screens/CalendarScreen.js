// ============================================================
// Calendar Screen — F1 Manager 2026
// Season calendar grid from schedules.json
// ============================================================

import { store }  from '../core/store.js'
import { router } from '../core/router.js'

export function renderCalendar() {
  const el = document.getElementById('screen-calendar')
  if (!el) return

  const schedules = (store.get('allSchedules') ?? [])
    .filter(s => s.season_id === '2026')
    .sort((a, b) => (a.round ?? 0) - (b.round ?? 0))
  const circuits = store.get('allCircuits') ?? []
  const currentRound = store.get('gameState')?.currentRound ?? 0

  el.innerHTML = `
    <div class="flex flex-col h-full bg-f1-dark">

      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-3 bg-black/40 border-b border-f1-border">
        <button class="f1-btn f1-btn-secondary" id="btn-back">
          <i class="ti ti-arrow-left"></i> Dashboard
        </button>
        <div class="font-orbitron text-lg tracking-wider"><i class="ti ti-calendar-event nav-svg"></i> SEASON 2026 CALENDAR</div>
        <div class="text-xs text-f1-dim font-orbitron">${schedules.length} ROUNDS</div>
      </div>

      <div class="flex-1 overflow-y-auto p-5">
        ${schedules.length ? `
          <div class="calendar-grid" id="calGrid">
            ${schedules.map(s => {
              const circ = circuits.find(c => c.id === s.circuit_id)
              const isPast   = (s.round ?? 0) <= currentRound
              const isNext   = (s.round ?? 0) === currentRound + 1
              return `
                <div class="cal-race-card ${isPast ? 'past' : ''} ${isNext ? 'next' : ''}" data-round="${s.round}">
                  <div class="flex justify-between items-start mb-1">
                    <span class="r-num">${String(s.round ?? '').padStart(2, '0')}</span>
                    ${s.is_sprint_weekend ? '<span class="text-xs px-2 py-0.5 rounded bg-f1-orange/20 text-f1-orange font-bold">SPRINT</span>' : ''}
                    ${isNext ? '<span class="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">NEXT</span>' : ''}
                    ${isPast ? '<span class="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-bold">✓</span>' : ''}
                  </div>
                  <div class="r-name">${s.grand_prix ?? circ?.name ?? s.id}</div>
                  <div class="r-date">${circ?.city ?? s.city ?? ''}, ${s.country ?? circ?.country ?? ''}</div>
                  ${circ ? `
                    <div class="mt-2 pt-2 border-t border-f1-border/50 text-xs text-f1-dim">
                      <div class="flex justify-between"><span>Circuit</span><span>${circ.name ?? ''}</span></div>
                      <div class="flex justify-between"><span>Laps</span><span class="font-digits">${circ.laps ?? '–'}</span></div>
                      <div class="flex justify-between"><span>Length</span><span class="font-digits">${circ.length_km ?? '–'} km</span></div>
                      ${circ.type ? `<div class="flex justify-between"><span>Type</span><span class="capitalize">${circ.type}</span></div>` : ''}
                    </div>
                  ` : ''}
                  ${isNext ? `
                    <button class="f1-btn f1-btn-primary w-full mt-3 text-xs" data-go-race="${s.round}">
                      <i class="ti ti-flag-check"></i> ENTER RACE WEEKEND
                    </button>
                  ` : ''}
                </div>
              `
            }).join('')}
          </div>
        ` : `
          <div class="text-center text-f1-dim py-12">
            <i class="ti ti-calendar-off text-4xl mb-3 block opacity-30"></i>
            <div class="font-orbitron text-sm">No schedule data available.</div>
            <div class="text-xs mt-1">Run "Sync Database" from the Main Menu to load race calendar.</div>
          </div>
        `}
      </div>
    </div>
  `

  document.getElementById('btn-back')?.addEventListener('click', () => router.goTo('dashboard'))

  document.querySelectorAll('[data-go-race]').forEach(btn => {
    btn.addEventListener('click', () => router.goTo('race'))
  })

  if (window.gsap) gsap.from('#calGrid > *', { opacity: 0, y: 12, stagger: 0.03, duration: 0.25 })
}
