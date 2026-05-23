# AI Logic Plan (Dev-ready JS)

## Scope
Best-practice AI for on-track decisions, race strategy, transfer market, R&D, finance, and explainable telemetry.

---

## 1. Architecture

Use layered AI:
1) **Heuristic layer** for baseline constraints and fast defaults.
2) **Utility scoring layer** for ranking candidate actions.
3) **Rollout/Monte Carlo layer (optional)** for high-impact race decisions.

All decisions should return:
```ts
{ action: string, confidence: number, explanation: string, debug?: Record<string, any> }
```

---

## 2. Deterministic Randomness

```js
import seedrandom from 'seedrandom'

export function makeRng(seed) {
  const rng = seedrandom(seed)
  return () => rng()
}
```

Use stable seed per race:
`seed = `${seasonYear}_${round}_${teamId}``

---

## 3. Driver AI (On-track)

### 3.1 Overtake utility
```js
const clamp = (v,min,max)=>Math.max(min,Math.min(max,v))

export function scoreOvertakeAttempt(ctx) {
  const o = ctx.driver.stats.overtaking / 100
  const r = ctx.driver.stats.reactiveness / 100
  const c = ctx.driver.stats.control / 100
  const d = ctx.opponent.stats.defending / 100
  const track = (ctx.circuit.game_stats.overtaking ?? 50) / 100

  const tyre = clamp(ctx.tyreDelta ?? 0, -0.3, 0.3)
  const drs = ctx.hasDrs ? 0.10 * (ctx.chassis.stats.aerodynamics.drs_efficiency / 100) : 0
  const risk = ctx.riskMode === 'high' ? 0.08 : ctx.riskMode === 'low' ? -0.05 : 0

  return (o*0.45 + r*0.25 + c*0.15 + track*0.25 + tyre + drs + risk) - d*0.35
}

export function decideOvertake(ctx) {
  const score = scoreOvertakeAttempt(ctx)
  const action = score > 0.15 ? 'attempt_overtake' : 'hold_position'
  return { action, confidence: clamp((score + 0.5), 0, 1), explanation: `overtake_score=${score.toFixed(3)}` }
}
```

### 3.2 Mistake probability
```js
export function calcDriverMistakeChance(driver, season, circuit) {
  const base = season.simulation_config.crash_probability
  const control = driver.stats.control / 100
  const accuracy = driver.stats.accuracy / 100
  const brakeStress = (circuit.game_stats.brake_stress ?? 50) / 100

  return clamp(base * (1 + (1-control)*0.8) * (1 + (1-accuracy)*0.8) * (1 + brakeStress*0.3), 0, 0.25)
}
```

---

## 4. Race Strategy AI

### 4.1 Pre-race stop strategy
```js
export function pickRaceStrategyAI(sim) {
  const oneStop = sim.estimateRaceTime({ stops: 1 })
  const twoStop = sim.estimateRaceTime({ stops: 2 })
  const threeStop = sim.estimateRaceTime({ stops: 3 })

  const choices = [
    { stops: 1, time: oneStop },
    { stops: 2, time: twoStop },
    { stops: 3, time: threeStop },
  ].sort((a,b)=>a.time-b.time)

  const best = choices[0]
  return { action: `plan_${best.stops}_stop`, confidence: 0.8, explanation: `eta=${best.time.toFixed(2)}` }
}
```

### 4.2 Safety car pit decision
```js
export function decidePitUnderSC({ currentPos, tyreLife, pitLossUnderSC, pitLossGreen, expectedGainLaps }) {
  const scSavings = pitLossGreen - pitLossUnderSC
  const tyreNeed = tyreLife < 0.28 ? 1 : 0
  const gainScore = scSavings * 0.6 + expectedGainLaps * 0.3 + tyreNeed * 0.4 - currentPos * 0.01
  const action = gainScore > 0.18 ? 'pit_now' : 'stay_out'
  return { action, confidence: clamp(gainScore + 0.4, 0, 1), explanation: `gain=${gainScore.toFixed(3)}` }
}
```

---

## 5. Transfer & Contract AI

Rules:
- Replace underperformer if current driver < grid median and budget permits.
- Young high potential preferred for low-tier teams.

```js
export function aiTransferDecision(team, currentDrivers, marketDrivers, scoreFn) {
  const worst = [...currentDrivers].sort((a,b)=>a.stats.overall-b.stats.overall)[0]
  const bestCandidate = [...marketDrivers].sort((a,b)=>scoreFn(b,team)-scoreFn(a,team))[0]

  if (!bestCandidate) return { action: 'no_transfer', confidence: 0.7, explanation: 'no_candidate' }

  const improvement = bestCandidate.stats.overall - worst.stats.overall
  const affordable = (team.economy.cash_reserve ?? 0) > (bestCandidate.contract?.buyout_idr ?? bestCandidate.price_idr)

  if (improvement >= 3 && affordable) return { action: `target_${bestCandidate.id}`, confidence: 0.78, explanation: `improvement=${improvement}` }
  return { action: 'hold_lineup', confidence: 0.65, explanation: 'low_improvement_or_budget' }
}
```

---

## 6. R&D AI

Use next-race profiles + weaknesses + reliability incidents.

```js
export function pickRdProjectAI(team, chassis, circuitsUpcoming) {
  const avg = k => circuitsUpcoming.reduce((s,c)=>s+(c.game_stats[k]??0),0)/circuitsUpcoming.length
  const tyreWear = avg('tyre_wear')
  const engStress = avg('engine_stress')
  const overtake = avg('overtaking')

  if (engStress > 75 && chassis.stats.reliability.failure_resistance < 85) return { action: 'rd_cooling', confidence: 0.83, explanation: 'high_engine_stress' }
  if (tyreWear > 80 && chassis.stats.performance.tyre_preservation < 85) return { action: 'rd_tyre_preservation', confidence: 0.80, explanation: 'high_tyre_wear' }
  if (overtake > 75) return { action: 'rd_drs_efficiency', confidence: 0.74, explanation: 'overtake_trackset' }
  return { action: 'rd_aero_efficiency', confidence: 0.70, explanation: 'default_balance' }
}
```

---

## 7. Finance AI

```js
export function aiFinancePolicy(team) {
  const tier = team.status.tier
  const buffer = tier === 'top_team' ? 20_000_000 : tier === 'midfield' ? 15_000_000 : 10_000_000
  const cash = team.economy.cash_reserve

  if (cash < buffer) return { action: 'conserve_cash', confidence: 0.9, explanation: 'below_buffer' }
  if (cash < buffer * 1.5) return { action: 'balanced_spend', confidence: 0.75, explanation: 'near_buffer' }
  return { action: 'invest_growth', confidence: 0.72, explanation: 'healthy_cash' }
}
```

---

## 8. Explainability + Telemetry

Store every major decision:
- `ai_logs/{raceId}/events/{eventId}`

```ts
{
  ts: string,
  module: 'driver|strategy|transfer|rd|finance',
  action: string,
  confidence: number,
  explanation: string,
  inputs: object
}
```

---

## 9. Debug Hooks
- Toggle aggressiveness multipliers per module.
- Replay lap decisions with same seed.
- Surface top-3 rejected actions for tuning.
