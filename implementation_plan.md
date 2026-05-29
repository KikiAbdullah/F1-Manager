# F1 Manager 2026 - Complete Overhaul Implementation Plan

Based on the 20-point feedback in [update_290526.md](file:///c:/KIKI/03_Project/Web_Project/04_Learning_and_Playground/f1_manager_280526/update_290526.md), this plan transforms the game from a basic prototype into a playable F1 Manager simulation with interconnected systems.

## Simulation Philosophy: **Motorsport Manager Style (Fun-First Semi-Realistic)**

> Prioritize drama, meaningful decisions, and emergent storytelling while maintaining F1 authenticity. Not hardcore sim, not arcade.

## Proposed Changes

### Core Engine Rebuild

#### [MODIFY] [engine.js](file:///c:/KIKI/03_Project/Web_Project/04_Learning_and_Playground/f1_manager_280526/js/engine.js)

**1. Fix Team-Specific Car Assignment (Critical Bug)**
Currently [generateGrid()](file:///c:/KIKI/03_Project/Web_Project/04_Learning_and_Playground/f1_manager_280526/js/engine.js#502-525) assigns ALL drivers the same chassis/PU (`Data.chassis[0]`, `Data.power_units[0]`). Must match each driver to their team's actual chassis and power unit using `team_id`.

**2. Tyre Compound System (Point #4)**
Replace simple `tireWear: 100` with a compound model:
- Compounds: Soft, Medium, Hard, Intermediate, Wet
- Nonlinear degradation with cliff point
- Temperature model (overheating from dirty air, pushing)
- Each compound has different grip/durability trade-off

**3. ERS System for ALL Drivers (Point #5)**
Currently ERS only works for player. Implement for AI with deployment modes:
- DEPLOY (attack/overtaking), HARVEST (recharge), BALANCED, NONE
- Battery charge/discharge affects pace on straights

**4. Safety Car / VSC / Red Flag (Point #8)**
Add incident system per lap:
- Random incidents based on `safety_car_probability` from track data
- SC bunches field, VSC slows all, Red Flag stops race
- Creates strategic chaos and drama

**5. Dirty Air / DRS / Overtaking (Point #9)**
Gap-based proximity effects:
- Dirty air reduces grip for cars within ~1.5s
- DRS available for cars within 1s of car ahead (using `drs_effectiveness` from track)
- Overtaking difficulty based on track data

**6. Setup System (Point #2)**
Pre-race setup with front_wing, rear_wing, suspension, tyre_pressure:
- Match against driver `setup_preferences` and track `sector_weights`
- Setup match affects lap pace, tyre wear, consistency

**7. Sector-Weighted Lap Times (Point #1)**
Use `sector_weights` from schedules.json to calculate lap time per sector:
- Each sector values different car/driver stats
- Creates circuit character (power tracks vs aero tracks)

**8. Improved AI Strategy (Point #7)**
AI decides pit timing based on tyre cliff, undercut/overcut windows, and safety car opportunity.

**9. Proper Race Lap Count**
Use `laps` from circuit data instead of hardcoded 4 laps. Add configurable race distance % for quicker sessions.

**10. Driver Personality Traits (Point #6)**
Assign traits derived from stats: `tyre_whisperer`, `rain_master`, `late_braker`, `qualifying_specialist`, etc.

**11. Human Error System (Point #13)**  
Random lockups, spins, pit errors at low probability based on driver `control` and `accuracy` stats.

---

#### [MODIFY] [weather.js](file:///c:/KIKI/03_Project/Web_Project/04_Learning_and_Playground/f1_manager_280526/js/weather.js)

**Integrate Weather Engine into Race Simulation (Point #3)**
The [Weather](file:///c:/KIKI/03_Project/Web_Project/04_Learning_and_Playground/f1_manager_280526/js/weather.js#76-86) object exists but is completely unused. Wire it into the engine:
- Dynamic weather per lap (rain intensity changes)
- Track wetness affects grip
- Temperature affects tyre behavior
- Crossover point between compound switches

---

#### [MODIFY] [utils.js](file:///c:/KIKI/03_Project/Web_Project/04_Learning_and_Playground/f1_manager_280526/js/utils.js)

Add helper functions for the simulation scale system (Point #16):
```js
// 1 stat point = X milliseconds per lap
SCALE = { aero: 0.012, driver: 0.008, setup: 0.004, tyre_temp: 0.020 }
```

---

### Manager Gameplay Loop

#### [MODIFY] [main.js](file:///c:/KIKI/03_Project/Web_Project/04_Learning_and_Playground/f1_manager_280526/js/main.js)

**Season Progression (Point #18)**
- After race: award F1 points, add prize money, advance `State.currentRound`
- Track WDC (driver) and WCC (constructor) standings
- Add R&D point allocation between races

---

#### [MODIFY] [finance.js](file:///c:/KIKI/03_Project/Web_Project/04_Learning_and_Playground/f1_manager_280526/js/finance.js)

**Race Income (Point #18)**
- Prize money based on finishing position
- Sponsor bonuses for results

---

### UI Updates

#### [MODIFY] [ui.js](file:///c:/KIKI/03_Project/Web_Project/04_Learning_and_Playground/f1_manager_280526/js/ui.js)

- Add tyre compound selector in strategy panel
- Add ERS mode toggle (Deploy/Harvest/Balanced)
- Add pre-race setup screen with sliders
- Improve live telemetry (compound indicator, tyre temp bar)
- Add post-race debrief showing points earned
- Add WDC/WCC standings tab in HQ

---

#### [MODIFY] [index.html](file:///c:/KIKI/03_Project/Web_Project/04_Learning_and_Playground/f1_manager_280526/index.html)

- Add setup screen section
- Add standings section in HQ
- Add Q3 button flow
- Add race distance selector

---

#### [MODIFY] [style.css](file:///c:/KIKI/03_Project/Web_Project/04_Learning_and_Playground/f1_manager_280526/css/style.css)

- Style tyre compound selector (Red=Soft, Yellow=Medium, White=Hard)
- Style safety car / yellow flag alerts
- Style ERS mode buttons
- Style setup sliders
- Style standings table

---

## Meta Balancing Targets (Point #17)

| Metric | Target |
|---|---|
| Gap P1-P20 (qualifying) | ~1.5-2.0s |
| Overtakes per race | 20-40 |
| Safety Car probability | per track data (28-92%) |
| DNFs per race | 1-3 |
| Tyre cliff impact | 0.5-1.0s/lap |

---

## Verification Plan

### Browser Testing
1. Start dev server with `npx serve .` in the project directory
2. Open browser to `http://localhost:3000`
3. **Test Create Team Wizard**: Complete all 4 steps, verify team launches
4. **Test Race Weekend Flow**: Navigate to Race Weekend → FP → Q1 → Q2 → Q3 → Race
5. **Verify Team-Specific Cars**: Check that VER drives RB22 (not all drivers using same car)
6. **Test Tyre Strategy**: During race, try different compounds, verify soft degrades faster
7. **Test Safety Car**: Run multiple races, verify SC appears and bunches field
8. **Test Season Progression**: After finishing race, verify currentRound advances and points are awarded
9. **Test Standings**: Check HQ for WDC/WCC standings after race

### Manual Verification (User)
- Play through 2-3 full race weekends to verify the game feels engaging and balanced
- Confirm different circuits feel different (Monaco vs Monza)
- Confirm strategy decisions matter
