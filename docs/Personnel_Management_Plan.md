# Personnel Management Plan (Dev-ready JS)

## Scope
Drivers + staff lifecycle: recruitment, contracts, morale, training, yearly progression, AI market behavior, Firestore transactions.

---

## 1. Firestore Schema

### 1.1 Collections
- `personnel/{personId}`
- `teams/{teamId}`
- `contracts/{contractId}` (optional; recommended if history needed)
- `market_state/{seasonYear}`

### 1.2 `personnel/{personId}`
```ts
{
  id: string,
  type: 'driver' | 'team_chief' | 'technical_chief' | 'staff',
  team_id: string | null,
  first_name: string,
  last_name: string,
  full_name: string,
  nationality: string,
  date_of_birth?: string,
  is_active: boolean,
  role: string,

  stats: Record<string, number>,
  personality?: Record<string, number>,

  potential: number,      // 0..100
  peak_age?: number,
  morale: number,         // 0..100
  pressure: number,       // 0..100
  loyalty: number,        // 0..100

  form: { last_5: number, momentum: number },
  availability: { is_active: boolean, injured_until?: string },

  contract: {
    start_season: number,
    end_season: number,
    salary_idr: number,
    buyout_idr: number,
    status: 'signed' | 'negotiating' | 'expired'
  },

  created_at: string,
  updated_at: string
}
```

### 1.3 `teams/{teamId}` fields required by personnel system
```ts
{
  id: string,
  status: { tier: string },
  economy: { cash_reserve: number },
  meta: { driver_attractiveness: number, political_influence: number },
  personnel: {
    driver_ids: string[],
    team_chief_id?: string,
    technical_chief_id?: string
  }
}
```

---

## 2. Core Utilities (Shared)

```js
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
export const sigmoid = (x) => 1 / (1 + Math.exp(-x))

export function getAge(dateOfBirth, refDateISO) {
  const dob = new Date(dateOfBirth)
  const ref = new Date(refDateISO)
  let age = ref.getUTCFullYear() - dob.getUTCFullYear()
  const m = ref.getUTCMonth() - dob.getUTCMonth()
  if (m < 0 || (m === 0 && ref.getUTCDate() < dob.getUTCDate())) age--
  return age
}
```

---

## 3. Rating Formulas

### 3.1 Driver overall
```js
export function calcDriverOverall(stats) {
  const weights = {
    cornering: 0.13,
    braking: 0.12,
    reactiveness: 0.12,
    overtaking: 0.10,
    defending: 0.10,
    smoothness: 0.08,
    adaptability: 0.10,
    control: 0.12,
    accuracy: 0.13,
  }
  let sum = 0
  for (const [k, w] of Object.entries(weights)) sum += (stats[k] ?? 0) * w
  return Math.round(clamp(sum, 1, 100))
}
```

### 3.2 Psychological modifier (applied to race performance)
```js
export function calcPsyModifier({ morale, pressure }) {
  const m = (morale ?? 50) / 100
  const p = (pressure ?? 50) / 100
  const moraleBoost = 1 + (m - 0.5) * 0.08
  const pressurePenalty = 1 - Math.max(0, p - 0.5) * 0.10
  return clamp(moraleBoost * pressurePenalty, 0.85, 1.08)
}
```

---

## 4. Yearly Progression / Regression

```js
export function advancePersonnelYear(person, seasonYear) {
  if (!person.date_of_birth || !person.stats) return person
  const age = getAge(person.date_of_birth, `${seasonYear}-07-01`)
  const peakAge = person.peak_age ?? 30
  const potential = (person.potential ?? 50) / 100
  const next = structuredClone(person)

  for (const k of Object.keys(next.stats)) {
    if (typeof next.stats[k] !== 'number' || k === 'overall') continue

    let delta = 0
    if (age < peakAge) {
      delta = (0.6 + 0.8 * potential) * (1 - age / peakAge) * 1.2
    } else if (age > peakAge + 4) {
      delta = -((age - (peakAge + 4)) / 10) * 1.5
    }

    next.stats[k] = clamp(next.stats[k] + delta, 1, 100)
  }

  if (next.type === 'driver') next.stats.overall = calcDriverOverall(next.stats)
  next.updated_at = new Date().toISOString()
  return next
}
```

---

## 5. Contract Engine

### 5.1 Offer evaluation
```js
export function evaluateOffer(person, team, offer) {
  const salaryRatio = offer.salary_idr / (person.contract?.salary_idr ?? offer.salary_idr)
  const teamAttract = (team.meta?.driver_attractiveness ?? 50) / 100
  const influence = (team.meta?.political_influence ?? 50) / 100
  const morale = (person.morale ?? 50) / 100
  const loyalty = (person.loyalty ?? 50) / 100

  let score = 0
  score += (salaryRatio - 1) * 1.2
  score += (teamAttract - 0.5) * 0.8
  score += (influence - 0.5) * 0.3
  score += (morale - 0.5) * 0.4
  score += (loyalty - 0.5) * -0.6

  return { score, acceptProbability: sigmoid(score) }
}
```

### 5.2 Transfer rules
- Start negotiation if `contract.end_season - currentSeason <= 1`.
- Mid-season transfer allowed only if `buyout_idr` paid and replacement exists.

### 5.3 Transaction-safe signing (Firestore)
```js
import { runTransaction, doc } from 'firebase/firestore'

export async function signContractTx(db, personId, fromTeamId, toTeamId, contractPatch) {
  await runTransaction(db, async (tx) => {
    const pRef = doc(db, 'personnel', personId)
    const fromRef = doc(db, 'teams', fromTeamId)
    const toRef = doc(db, 'teams', toTeamId)

    const [pSnap, fromSnap, toSnap] = await Promise.all([
      tx.get(pRef), tx.get(fromRef), tx.get(toRef)
    ])

    if (!pSnap.exists() || !toSnap.exists()) throw new Error('invalid state')

    const person = pSnap.data()
    const toTeam = toSnap.data()

    if ((toTeam.economy?.cash_reserve ?? 0) < (contractPatch.salary_idr ?? 0)) throw new Error('insufficient cash')

    tx.update(pRef, {
      team_id: toTeamId,
      contract: { ...person.contract, ...contractPatch, status: 'signed' },
      updated_at: new Date().toISOString()
    })

    if (fromSnap.exists()) {
      const fromTeam = fromSnap.data()
      tx.update(fromRef, {
        'personnel.driver_ids': (fromTeam.personnel?.driver_ids ?? []).filter(id => id !== personId)
      })
    }

    tx.update(toRef, {
      'personnel.driver_ids': [...new Set([...(toTeam.personnel?.driver_ids ?? []), personId])]
    })
  })
}
```

---

## 6. Training System (Weekly Tick)

Programs:
- `pace` → cornering/braking/reactiveness
- `racecraft` → overtaking/defending
- `consistency` → control/accuracy/smoothness

```js
export function applyTrainingWeek(person, program, intensity = 1) {
  const next = structuredClone(person)
  next.pressure = clamp((next.pressure ?? 50) + intensity * 0.3, 0, 100)

  const growth = (next.potential ?? 50) / 100 * intensity
  const add = (k, v) => { next.stats[k] = clamp((next.stats[k] ?? 1) + v, 1, 100) }

  if (program === 'pace') {
    add('cornering', 0.35 * growth)
    add('braking', 0.30 * growth)
    add('reactiveness', 0.25 * growth)
  }
  if (program === 'racecraft') {
    add('overtaking', 0.35 * growth)
    add('defending', 0.30 * growth)
  }
  if (program === 'consistency') {
    add('control', 0.30 * growth)
    add('accuracy', 0.25 * growth)
    add('smoothness', 0.25 * growth)
  }

  if (next.type === 'driver') next.stats.overall = calcDriverOverall(next.stats)
  next.updated_at = new Date().toISOString()
  return next
}
```

---

## 7. AI Logic (Best)

### 7.1 Roster planning objective
- `top_team`: maximize title probability (overall > potential > cost)
- `midfield`: maximize points per cost
- `new_entry/backfield`: maximize potential + sponsor appeal

```js
export function scoreDriverForTeam(driver, team) {
  const overall = driver.stats.overall
  const potential = driver.potential ?? 50
  const cost = driver.contract?.salary_idr ?? driver.price_idr ?? 1
  const tier = team.status.tier

  const wOverall = tier === 'top_team' ? 1.2 : 0.8
  const wPotential = tier === 'top_team' ? 0.3 : 0.9
  const wCost = tier === 'top_team' ? 0.4 : 0.9

  return overall * wOverall + potential * wPotential - Math.log10(cost) * 20 * wCost
}
```

### 7.2 Negotiation policy
- Set reservation salary by role/tier.
- Prefer longer deals for high-potential young talent.
- Avoid buyout if `cash_reserve < safety_buffer`.

---

## 8. UI Screens (Minimum)
- Personnel list + filters
- Person detail (stats, morale, contract)
- Contract negotiation modal (salary, years, buyout)
- Training scheduler
- Transfer shortlist + compare view
