# Finance & Sponsorship Plan (Dev-ready JS)

## Scope
Budget cap, weekly cashflow, sponsor contracts, prize distribution, risk controls, AI financial policy.

---

## 1. Firestore Schema

### 1.1 Team finance state (`teams/{id}`)
```ts
{
  economy: {
    budget_cap: number,
    sponsor_income: number,
    operational_cost: number,
    cash_reserve: number
  },
  budget_tracking: {
    spent_dev_idr: number,
    spent_ops_idr: number,
    spent_staff_idr: number
  },
  finance_ledger: {
    ts: string,
    type: string,
    amount_idr: number,
    meta?: Record<string, any>
  }[]
}
```

### 1.2 Sponsors (`sponsors/{id}`)
```ts
{
  id: string,
  team_id: string,
  sponsor_tier: 'S'|'A'|'B'|'C',
  title_sponsor: string,
  financials: {
    estimated_annual_value_idr: number,
    budget_impact_score: number,
    upgrade_funding_multiplier: number
  },
  ai_effects: Record<string, any>,
  contract: { start_season: number, end_season: number, objective?: string }
}
```

---

## 2. Helpers

```js
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

export function ledger(team, type, amount_idr, meta = {}) {
  team.finance_ledger ??= []
  team.finance_ledger.push({ ts: new Date().toISOString(), type, amount_idr, meta })
}
```

---

## 3. Cashflow Engine

### 3.1 Weekly tick
```js
export function applyWeeklyFinanceTick(team) {
  const next = structuredClone(team)
  const sponsorWeekly = (next.economy.sponsor_income ?? 0) / 52
  const opsWeekly = (next.economy.operational_cost ?? 0) / 52

  next.economy.cash_reserve += sponsorWeekly
  next.economy.cash_reserve -= opsWeekly

  ledger(next, 'sponsor_income_weekly', sponsorWeekly)
  ledger(next, 'operational_cost_weekly', -opsWeekly)
  return next
}
```

### 3.2 Budget cap check
```js
export function canSpend(team, amountIdr) {
  const cap = team.economy.budget_cap
  const spent = (team.budget_tracking?.spent_dev_idr ?? 0) + (team.budget_tracking?.spent_ops_idr ?? 0)
  return spent + amountIdr <= cap
}
```

### 3.3 Spending apply
```js
export function spend(team, amountIdr, bucket = 'spent_ops_idr', reason = 'generic') {
  const next = structuredClone(team)
  if (!canSpend(next, amountIdr)) throw new Error('budget cap exceeded')
  if ((next.economy.cash_reserve ?? 0) < amountIdr) throw new Error('insufficient cash reserve')

  next.economy.cash_reserve -= amountIdr
  next.budget_tracking ??= { spent_dev_idr: 0, spent_ops_idr: 0, spent_staff_idr: 0 }
  next.budget_tracking[bucket] += amountIdr
  ledger(next, reason, -amountIdr)
  return next
}
```

---

## 4. Sponsors

### 4.1 Tier difficulty matrix
- S: difficulty 1.6, objective top 3
- A: difficulty 1.2, objective top 6
- B: difficulty 1.0, objective top 8
- C: difficulty 0.9, objective top 10

### 4.2 Attraction score
```js
export function calcSponsorAttraction(team, teamChief, sponsor) {
  const perf = 1 / (team.performance_state.championship_position || 10)
  const influence = (team.meta.political_influence ?? 50) / 100
  const sponsorPower = (teamChief.stats.sponsor_power ?? 50) / 100
  const brand = (team.meta.driver_attractiveness ?? 50) / 100

  const difficulty = sponsor.sponsor_tier === 'S' ? 1.6 : sponsor.sponsor_tier === 'A' ? 1.2 : sponsor.sponsor_tier === 'B' ? 1.0 : 0.9
  const score = perf * 2.0 + influence * 0.8 + sponsorPower * 1.2 + brand * 0.6
  return score / difficulty
}
```

### 4.3 Offer generation
```js
export function generateSponsorOffer(team, sponsorTemplate, seasonYear) {
  const base = sponsorTemplate.financials.estimated_annual_value_idr
  const perfFactor = clamp(12 / (team.performance_state.championship_position || 12), 0.7, 1.4)

  return {
    ...sponsorTemplate,
    contract: { start_season: seasonYear, end_season: seasonYear + 1 },
    financials: {
      ...sponsorTemplate.financials,
      estimated_annual_value_idr: Math.round(base * perfFactor)
    }
  }
}
```

### 4.4 Apply sponsor effects
```js
export function applySponsorEffects(team, sponsor) {
  const next = structuredClone(team)
  const fx = sponsor.ai_effects ?? {}

  if (fx.development_speed_boost) {
    next.development_model.innovation_rate = clamp(next.development_model.innovation_rate + fx.development_speed_boost, 1, 100)
  }
  if (fx.infrastructure_growth) {
    next.infrastructure.staff_quality = clamp(next.infrastructure.staff_quality + fx.infrastructure_growth * 0.2, 1, 100)
  }

  next.economy.sponsor_income += sponsor.financials.estimated_annual_value_idr
  ledger(next, 'sponsor_signed', sponsor.financials.estimated_annual_value_idr, { sponsor_id: sponsor.id })
  return next
}
```

---

## 5. Prize Money

```js
export function prizeShareByPosition(pos) {
  const map = { 1: 0.19, 2: 0.16, 3: 0.14, 4: 0.12, 5: 0.10, 6: 0.09, 7: 0.07, 8: 0.06, 9: 0.04, 10: 0.03 }
  return map[pos] ?? 0
}

export function awardConstructorPrize(team, season, position) {
  const pool = season.financial_model.constructor_bonus_pool
  const amount = pool * prizeShareByPosition(position)
  team.economy.cash_reserve += amount
  ledger(team, 'constructor_prize', amount, { position })
}
```

---

## 6. AI Finance Logic (Best)

### 6.1 Safety buffer
- top_team: 20M
- midfield: 15M
- backfield/new: 10M

### 6.2 Policy
- Below buffer: freeze non-critical R&D/manufacturing.
- Prioritize reliability over pure performance upgrades.
- Prefer long-duration low-risk sponsor contracts.

```js
export function aiFinancePolicy(team) {
  const tier = team.status.tier
  const buffer = tier === 'top_team' ? 20_000_000 : tier === 'midfield' ? 15_000_000 : 10_000_000
  const cash = team.economy.cash_reserve

  if (cash < buffer) return { mode: 'conserve', rdBudgetFactor: 0.4, sponsorRisk: 'low' }
  if (cash < buffer * 1.5) return { mode: 'balanced', rdBudgetFactor: 0.75, sponsorRisk: 'medium' }
  return { mode: 'aggressive', rdBudgetFactor: 1.0, sponsorRisk: 'high' }
}
```

---

## 7. Minimal UI
- Finance dashboard (cash, burn rate, cap)
- Ledger timeline
- Sponsor pipeline + negotiation
- Budget cap monitor + warnings
