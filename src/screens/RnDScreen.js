// ============================================================
// R&D Screen — F1 Manager 2026
// Tech tree with research projects and progress bars
// ============================================================

import { store }  from '../core/store.js'
import { router } from '../core/router.js'

const RND_PROJECTS = [
  { id: 'aero_front', name: 'Front Wing Upgrade',     area: 'Aerodynamics', cost: 5.2,  weeks: 4, progress: 0, stat: '+3 Downforce' },
  { id: 'aero_rear',  name: 'Rear Diffuser Rework',   area: 'Aerodynamics', cost: 8.1,  weeks: 6, progress: 0, stat: '+5 Rear Grip' },
  { id: 'mech_susp',  name: 'Suspension Geometry',     area: 'Mechanical',   cost: 3.8,  weeks: 3, progress: 0, stat: '+2 Mech Grip' },
  { id: 'mech_brake', name: 'Brake Duct Revision',     area: 'Mechanical',   cost: 2.5,  weeks: 2, progress: 0, stat: '+2 Brake Perf' },
  { id: 'pu_deploy',  name: 'Energy Deployment Map',   area: 'Power Unit',   cost: 6.0,  weeks: 5, progress: 0, stat: '+3 Deployment' },
  { id: 'pu_cool',    name: 'Cooling System Upgrade',  area: 'Power Unit',   cost: 4.5,  weeks: 4, progress: 0, stat: '+2 Reliability' },
  { id: 'weight',     name: 'Weight Reduction Package', area: 'Chassis',      cost: 7.0,  weeks: 5, progress: 0, stat: '-3kg Mass' },
  { id: 'floor',      name: 'Floor Edge Rework',       area: 'Aerodynamics', cost: 9.5,  weeks: 7, progress: 0, stat: '+6 Downforce' },
]

const AREA_COLORS = {
  'Aerodynamics': '#00e5ff',
  'Mechanical':   '#ff8700',
  'Power Unit':   '#e10600',
  'Chassis':      '#b000ff',
}

export function renderRnD() {
  const el = document.getElementById('screen-rnd')
  if (!el) return

  const team  = store.get('playerTeam')
  const infra = team?.infrastructure ?? {}

  el.innerHTML = `
    <div class="flex flex-col h-full bg-f1-dark">

      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-3 bg-black/40 border-b border-f1-border">
        <button class="f1-btn f1-btn-secondary" id="btn-back">
          <i class="ti ti-arrow-left"></i> Dashboard
        </button>
        <div class="font-orbitron text-lg tracking-wider"><i class="ti ti-flask nav-svg"></i> RESEARCH & DEVELOPMENT</div>
        <div></div>
      </div>

      <div class="flex-1 overflow-y-auto p-5">

        <!-- Facility Stats -->
        <div class="grid grid-cols-4 gap-4 mb-6">
          ${_facilityCard('FACTORY',      infra.factory_level     ?? 2, 5, '#00e5ff')}
          ${_facilityCard('WIND TUNNEL',  infra.wind_tunnel_level ?? 2, 5, '#ff8700')}
          ${_facilityCard('CFD CAPACITY', infra.cfd_capacity      ?? 60, 100, '#b000ff')}
          ${_facilityCard('SIMULATOR',    infra.simulator_level   ?? 60, 100, '#22c55e')}
        </div>

        <!-- Project Categories -->
        <div class="grid grid-cols-4 gap-2 mb-5">
          ${Object.keys(AREA_COLORS).map(area => `
            <div class="text-center py-2 rounded text-xs font-orbitron tracking-wider cursor-pointer transition-all hover:opacity-100 opacity-70"
              style="background:${AREA_COLORS[area]}18;border:1px solid ${AREA_COLORS[area]}44;color:${AREA_COLORS[area]}">
              ${area.toUpperCase()}
            </div>
          `).join('')}
        </div>

        <!-- Project Grid -->
        <div class="grid grid-cols-2 gap-4" id="rndGrid">
          ${RND_PROJECTS.map(p => _projectCard(p)).join('')}
        </div>

      </div>
    </div>
  `

  document.getElementById('btn-back')?.addEventListener('click', () => router.goTo('dashboard'))

  // Start project buttons
  document.querySelectorAll('[data-start-project]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.startProject
      const proj = RND_PROJECTS.find(p => p.id === id)
      if (proj) {
        proj.progress = Math.min(100, proj.progress + 25)
        btn.closest('.panel').querySelector('.prog-fill').style.width = proj.progress + '%'
        btn.closest('.panel').querySelector('.prog-pct').textContent = proj.progress + '%'
        if (proj.progress >= 100) {
          btn.textContent = 'COMPLETED'
          btn.disabled = true
          btn.classList.add('opacity-50')
          showToast(`✓ ${proj.name} completed! ${proj.stat}`)
        } else {
          showToast(`${proj.name}: ${proj.progress}% (+1 week)`)
        }
      }
    })
  })

  if (window.gsap) gsap.from('#rndGrid > *', { opacity: 0, y: 15, stagger: 0.05, duration: 0.3 })
}

function _facilityCard(label, level, max, color) {
  const pct = (level / max) * 100
  return `
    <div class="panel" style="border-top:3px solid ${color}">
      <div class="text-xs text-f1-dim font-orbitron mb-2">${label}</div>
      <div class="flex items-baseline gap-1 mb-2">
        <span class="font-digits text-xl font-bold" style="color:${color}">${level}</span>
        <span class="text-f1-dim text-xs">/ ${max}</span>
      </div>
      <div class="prog-bar"><div class="prog-fill" style="width:${pct}%;background:${color}"></div></div>
    </div>
  `
}

function _projectCard(p) {
  const color = AREA_COLORS[p.area] ?? '#888'
  return `
    <div class="panel">
      <div class="flex justify-between items-start mb-2">
        <div>
          <div class="text-xs font-orbitron tracking-wider" style="color:${color}">${p.area.toUpperCase()}</div>
          <div class="font-bold text-sm mt-1">${p.name}</div>
        </div>
        <div class="text-right">
          <div class="font-digits text-xs text-f1-dim">$${p.cost}M</div>
          <div class="text-xs text-f1-dim">${p.weeks} weeks</div>
        </div>
      </div>
      <div class="text-xs mb-2" style="color:${color}">${p.stat}</div>
      <div class="flex items-center gap-3 mb-3">
        <div class="flex-1 prog-bar"><div class="prog-fill" style="width:${p.progress}%;background:${color}"></div></div>
        <span class="font-digits text-xs text-f1-dim prog-pct">${p.progress}%</span>
      </div>
      <button class="f1-btn f1-btn-secondary w-full text-xs" data-start-project="${p.id}" ${p.progress >= 100 ? 'disabled' : ''}>
        <i class="ti ti-player-play"></i> ${p.progress >= 100 ? 'COMPLETED' : p.progress > 0 ? 'CONTINUE' : 'START PROJECT'}
      </button>
    </div>
  `
}
