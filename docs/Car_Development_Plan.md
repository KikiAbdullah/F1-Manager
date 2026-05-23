# Car Development Plan (Dev-ready JS)

## Scope
R&D lifecycle: project creation, weekly progression, quality/risk, manufacturing, testing, chassis application, AI prioritization.

---

## 1. Firestore Schema

### 1.1 Team-side state
`teams/{teamId}`
```ts
{
  infrastructure: {
    factory_level: number,
    wind_tunnel_level: number,
    cfd_capacity: number,
    simulator_level: number,
    staff_quality: number
  },
  development_model: {
    philosophy: string,
    upgrade_aggressiveness: number,
    innovation_rate: number,
    regulation_adaptation: number,
    risk_appetite: number
  },
  r_and_d: {
    active_projects: RdProject[],
    completed_projects: RdProject[],
    design_points: number
  },
  manufacturing: {
    queue: {
      project_id: string,
      quantity: number,
      eta_weeks: number,
      cost_idr: number,
      status: 'queued'|'building'|'ready'
    }[]
  }
}
```

### 1.2 Project shape
```ts
type RdProject = {
  id: string,
  team_id: string,
  season_year: number,
  component: 'floor'|'front_wing'|'rear_wing'|'suspension'|'cooling'|'ers',
  targets: Record<string, number>, // e.g. {'aerodynamics.aero_efficiency': 2}
  cost_idr: number,
  duration_weeks: number,
  progress: number, // 0..100
  risk: number,     // 0..1
  quality: number,  // 0..1 after complete
  validation?: number, // 0..1 from testing
  status: 'active'|'completed'|'cancelled'
}
```

---

## 2. Shared Helpers

```js
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

export function addNestedStat(root, path, delta) {
  const keys = path.split('.')
  let obj = root
  for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
  const last = keys[keys.length - 1]
  obj[last] = clamp((obj[last] ?? 0) + delta, 1, 100)
}
```

---

## 3. Weekly R&D Tick

### 3.1 Progress rate
```js
export function calcRdWeeklyProgress(team, technicalChief) {
  const i = team.infrastructure
  const td = technicalChief.stats

  const infraScore = (
    i.factory_level * 12 +
    i.wind_tunnel_level * 12 +
    i.cfd_capacity * 0.4 +
    i.simulator_level * 0.4 +
    i.staff_quality * 0.6
  ) / 100

  const tdScore = (
    td.innovation * 0.35 +
    td.development_speed * 0.25 +
    td.wind_tunnel_efficiency * 0.20 +
    td.simulator_correlation * 0.20
  ) / 100

  const modelScore = (team.development_model.innovation_rate / 100) * 0.9 + 0.1
  return clamp(infraScore * tdScore * modelScore * 12, 1.5, 18)
}
```

### 3.2 Tick apply
```js
export function advanceProjectsWeek(team, technicalChief) {
  const next = structuredClone(team)
  const delta = calcRdWeeklyProgress(team, technicalChief)

  for (const p of next.r_and_d.active_projects) {
    p.progress = clamp(p.progress + delta, 0, 100)
    if (p.progress >= 100) p.status = 'completed'
  }

  const done = next.r_and_d.active_projects.filter(p => p.status === 'completed')
  next.r_and_d.active_projects = next.r_and_d.active_projects.filter(p => p.status !== 'completed')
  next.r_and_d.completed_projects.push(...done.map(p => finalizeProjectQuality(p, team, technicalChief)))

  return next
}
```

---

## 4. Quality, Risk, Reliability Trade-off

### 4.1 Final quality
```js
export function finalizeProjectQuality(project, team, technicalChief) {
  const td = technicalChief.stats
  const aggressiveness = team.development_model.upgrade_aggressiveness / 100
  const riskAppetite = team.development_model.risk_appetite / 100

  const baseQuality = (td.innovation * 0.5 + td.regulation_adaptation * 0.3 + td.setup_understanding * 0.2) / 100
  const risk = clamp(project.risk + riskAppetite * 0.10 + aggressiveness * 0.10, 0, 0.65)
  const validationBonus = (project.validation ?? 0) * 0.08
  const rng = (Math.random() - 0.5) * 0.10

  project.quality = clamp(baseQuality + validationBonus - risk * 0.35 + rng, 0.05, 0.98)
  project.risk = risk
  return project
}
```

### 4.2 Apply upgrade to chassis
```js
export function applyUpgradeToChassis(chassis, project) {
  const next = structuredClone(chassis)
  const q = project.quality

  for (const [path, inc] of Object.entries(project.targets)) {
    addNestedStat(next.stats, path, inc * (0.6 + q))
  }

  const reliabilityHit = Math.round(project.risk * 12)
  next.stats.reliability.failure_resistance = clamp(next.stats.reliability.failure_resistance - reliabilityHit, 1, 100)
  next.updated_at = new Date().toISOString()
  return next
}
```

---

## 5. Manufacturing

ETA and cost:
```js
export function calcManufacturingEtaWeeks(team, quantity) {
  const i = team.infrastructure
  const speed = (i.factory_level * 12 + i.staff_quality * 0.8) / 100
  return Math.max(1, Math.ceil((quantity * 2.8) / (speed || 0.1)))
}

export function enqueueManufacturing(team, project, quantity) {
  const next = structuredClone(team)
  const eta = calcManufacturingEtaWeeks(team, quantity)
  const item = {
    project_id: project.id,
    quantity,
    eta_weeks: eta,
    cost_idr: Math.round(project.cost_idr * 0.2 * quantity),
    status: 'queued'
  }
  next.manufacturing.queue.push(item)
  return next
}
```

---

## 6. Testing

```js
export function runTestSession(project, circuit) {
  const next = structuredClone(project)
  const trackEvo = (circuit.game_stats.track_evolution ?? 70) / 100
  next.validation = clamp((next.validation ?? 0) + 0.15 * trackEvo, 0, 1)
  next.risk = clamp(next.risk - 0.05 * next.validation, 0, 1)
  return next
}
```

---

## 7. AI Logic (Best)

### 7.1 Inputs
- Next 3 circuits profile
- Team weakness map (vs grid median)
- Reliability incidents last N races
- Sponsor requirement tags

### 7.2 Priority policy
- High tyre wear trackset → tyre_preservation/cooling/traction
- High engine stress trackset → cooling/failure_resistance
- Overtake-heavy trackset → drs_efficiency/top_speed

```js
export function pickRdProjectAI(team, chassis, circuitsUpcoming) {
  const avg = (k) => circuitsUpcoming.reduce((s, c) => s + (c.game_stats[k] ?? 0), 0) / circuitsUpcoming.length
  const tyreWear = avg('tyre_wear')
  const engineStress = avg('engine_stress')
  const overtaking = avg('overtaking')

  if (engineStress > 75 && chassis.stats.reliability.failure_resistance < 85) return 'cooling'
  if (tyreWear > 80 && chassis.stats.performance.tyre_preservation < 85) return 'tyre_preservation'
  if (overtaking > 75) return 'drs_efficiency'
  return 'aero_efficiency'
}
```

---

## 8. Minimal UI
- R&D board (active/completed/cost)
- Upgrade impact preview (before/after stats)
- Manufacturing queue
- Test session result panel
