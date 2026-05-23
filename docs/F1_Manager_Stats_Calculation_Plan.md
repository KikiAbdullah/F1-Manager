# F1 Manager 2026 - Stat Calculation Plan (Development Ready for JavaScript)

Dokumen ini menguraikan konsep, rumus perhitungan statistik, dan contoh implementasi JavaScript yang akan digunakan dalam simulasi game F1 Manager 2026. Ini mencakup berbagai fase permainan mulai dari awal musim hingga kejadian dinamis selama balapan dan interaksi sponsor.

---

## Data Model Asumsi (JavaScript Object Structure)

Untuk contoh kode JavaScript, diasumsikan Anda memiliki objek-objek berikut yang merepresentasikan status game saat ini, diakses sebagai parameter fungsi atau dari state global:

```javascript
// Contoh data yang akan diakses dalam perhitungan
const gameData = {
    currentSeason: { /* data dari seasons.json */ },
    currentTeam: { /* data dari teams.json, termasuk FK ke personel dan chassis */ },
    currentDriver: { /* data dari drivers.json */ },
    currentChassis: { /* data dari chassis.json */ },
    currentPowerUnit: { /* data dari power_units.json */ },
    currentCircuit: { /* data dari circuits.json */ },
    technicalChief: { /* data dari technical_chiefs.json */ },
    teamChief: { /* data dari team_chiefs.json */ },
    currentWeather: { // Objek dinamis untuk kondisi cuaca saat ini
        rainIntensity: 0, // 0 = kering, 1 = ringan, 2 = sedang, 3 = deras
        trackTemperatureCelsius: 30,
        airTemperatureCelsius: 25,
        windSpeedKmh: 10
    },
    // ... data game lainnya
};

// Asumsi helper function untuk mendapatkan objek terkait melalui FK
function getDriverById(id) { /* ... */ }
function getChassisById(id) { /* ... */ }
// ... dll.
```

---

## I. Perhitungan Stats Saat Pembuatan Tim Pertama / Awal Game

Pada awal permainan atau saat merekrut elemen baru, `stats` yang didefinisikan dalam file JSON akan berfungsi sebagai **nilai dasar (base values)**. Nilai-nilai ini akan menjadi titik awal sebelum modifikasi lebih lanjut dari performa, moral, atau faktor dinamis lainnya.

*   **Tim (`teams.json`):**
    *   `performance_state`: `championship_position`, `points`, `wins`, `podiums` akan dimulai dari nol atau nilai awal yang realistis untuk musim baru.
    *   `economy`: `budget_cap`, `sponsor_income`, `operational_cost`, `cash_reserve` akan menjadi kondisi finansial awal.
    *   `infrastructure`: `factory_level`, `wind_tunnel_level`, `cfd_capacity`, `simulator_level`, `staff_quality` merepresentasikan kapabilitas fasilitas tim.
    *   `meta`: `recruitment_strength`, `driver_attractiveness`, `political_influence` akan memengaruhi daya tarik tim di pasar transfer.

*   **Pembalap (`drivers.json`):**
    *   `stats` (overall, cornering, braking, dll.): Ini adalah kemampuan bawaan pembalap.
    *   `price_idr`: Biaya rekrutmen/gaji awal.

*   **Staf (`team_chiefs.json`, `technical_chiefs.json`):**
    *   `stats` dan `personality`: Kapabilitas dan karakteristik bawaan staf.
    *   `price_idr`: Biaya rekrutmen/gaji awal.

*   **Chassis (`chassis.json`) & Power Unit (`power_units.json`):**
    *   `stats` (overall_performance, aerodynamics, reliability, dll.): Performa dasar komponen.

---

## II. Perhitungan Stats Saat Race (Balapan)

Interaksi statistik selama balapan adalah yang paling kompleks, melibatkan banyak faktor untuk menentukan performa mobil dan pembalap.

### II.A. Performa Keseluruhan Mobil di Trek

**Konsep Dasar:** Performa akhir di trek adalah hasil kombinasi stat pembalap, mobil (chassis + PU), dan adaptasi terhadap sirkuit serta kondisi cuaca.

**Rumus Konseptual Umum:**
`Performa_Total = (Base_Stat_Driver * Modifier_Driver_Form) + (Base_Stat_Chassis * Modifier_Chassis_Upgrade) + (Base_Stat_PU * Modifier_PU_Upgrade) + Modifier_Sirkuit + Modifier_Cuaca + Modifier_Setup + Modifier_Strategi + Modifier_AI_Skills`

**Detail Rumus per Aspek & Implementasi JavaScript:**

Untuk rumus-rumus di bawah, asumsikan kita memiliki objek `driver`, `chassis`, `powerUnit`, `circuit`, `team`, `technicalChief`, dan `season` yang sudah dimuat dari JSON.

1.  **Kecepatan di Lurus (Top Speed):**
    *   **Konsep:** Kombinasi performa `chassis` di kecepatan tertinggi dan tenaga `power unit`, dimoderasi oleh kebutuhan downforce sirkuit.
    *   **Perubahan Data Model (`circuits.json`):** Tambahkan `downforce_impact_factor` ke `Circuit.game_stats` (misalnya, nilai 0.8-1.2, di mana 1.0 adalah netral. Sirkuit high-downforce memiliki >1.0, low-downforce <1.0).
    *   **Rumus:**
        `Top_Speed_Efektif = (chassis.stats.performance.top_speed * powerUnit.stats.driveability.top_end_power / 100) / circuit.game_stats.downforce_impact_factor`
    *   **JavaScript:**
        ```javascript
        function calculateTopSpeed(driver, chassis, powerUnit, circuit) {
            const chassisTopSpeed = chassis.stats.performance.top_speed; // Range 0-100
            const puTopEndPower = powerUnit.stats.driveability.top_end_power; // Range 0-100

            // Asumsi: circuit.game_stats.downforce_impact_factor sudah ada (1.0 = normal, >1.0 = sirkuit high-downforce, <1.0 = low-downforce)
            const downforceModifier = circuit.game_stats.downforce_impact_factor || 1.0; 

            // Contoh: Chassis 90, PU 95, Modifier Sirkuit 1.1 (high-downforce) -> (90 * 0.95) / 1.1 = 77.7
            return (chassisTopSpeed * (puTopEndPower / 100)) / downforceModifier;
        }
        ```

2.  **Kecepatan di Tikungan (Cornering Speed):**
    *   **Konsep:** Keterampilan `driver` di tikungan, kemampuan aerodinamika `chassis` untuk menghasilkan downforce, traksi mekanis, dan kebutuhan downforce sirkuit. Juga dipengaruhi oleh `tyre_wear_modifier` sirkuit.
    *   **Perubahan Data Model (`circuits.json`):** Tambahkan `tyre_wear_impact_factor` ke `Circuit.game_stats` (misalnya, nilai 0.8-1.2, di mana 1.0 adalah netral. Sirkuit high-wear memiliki >1.0).
    *   **Rumus (High-Speed Cornering):**
        `Cornering_Speed_High = (driver.stats.cornering * chassis.stats.aerodynamics.high_speed_cornering * chassis.stats.mechanical.traction / 10000) * (circuit.game_stats.setup.downforce / 100) / circuit.game_stats.tyre_wear_impact_factor`
        *   Catatan: Perlu membagi rumus ini menjadi low, medium, dan high-speed cornering untuk akurasi yang lebih baik. `circuit.game_stats.setup.downforce` adalah rekomendasi, bukan downforce aktual mobil. Mungkin perlu `chassis.stats.aerodynamics.downforce_level_actual` atau similar.
    *   **JavaScript:**
        ```javascript
        function calculateCorneringSpeed(driver, chassis, circuit, cornerType = 'medium') {
            const driverCornering = driver.stats.cornering; // Range 0-100
            let chassisCorneringAero = 0;

            switch (cornerType) {
                case 'low':
                    chassisCorneringAero = chassis.stats.aerodynamics.low_speed_cornering;
                    break;
                case 'medium':
                    chassisCorneringAero = chassis.stats.aerodynamics.medium_speed_cornering;
                    break;
                case 'high':
                    chassisCorneringAero = chassis.stats.aerodynamics.high_speed_cornering;
                    break;
                default:
                    chassisCorneringAero = chassis.stats.aerodynamics.medium_speed_cornering;
            }

            const chassisTraction = chassis.stats.mechanical.traction; // Range 0-100
            
            // Asumsi: circuit.game_stats.tyre_wear_impact_factor sudah ada (1.0 = normal, >1.0 = high tyre wear)
            const tyreWearModifier = circuit.game_stats.tyre_wear_impact_factor || 1.0; 

            // Asumsi: downforceLevelActual adalah representasi downforce mobil yang sebenarnya, bisa dipengaruhi setup.
            // Untuk simplifikasi awal, bisa pakai rata-rata atau kombinasi stat chassis.
            const actualDownforceFactor = (chassisCorneringAero + chassis.stats.mechanical.ride_stability) / 200; // Contoh

            // Contoh: Driver 90, Chassis Aero 95, Traction 85, Actual Downforce ~0.9, Tyre Wear Modifier 1.05
            // (90 * 0.95 * 0.85 * 0.9) / 1.05 = 65.4
            return (driverCornering * (chassisCorneringAero / 100) * (chassisTraction / 100) * actualDownforceFactor) / tyreWearModifier;
        }
        ```

3.  **Akselerasi:**
    *   **Konsep:** Respons tenaga `power unit` di kecepatan rendah dan menengah, digabungkan dengan kemampuan `chassis` untuk berakselerasi.
    *   **Rumus:**
        `Akselerasi_Efektif = (powerUnit.stats.driveability.low_speed_response * powerUnit.stats.driveability.mid_range_torque / 100) * (chassis.stats.performance.acceleration / 100)`
    *   **JavaScript:**
        ```javascript
        function calculateAcceleration(chassis, powerUnit) {
            const puLowSpeedResponse = powerUnit.stats.driveability.low_speed_response; // Range 0-100
            const puMidRangeTorque = powerUnit.stats.driveability.mid_range_torque; // Range 0-100
            const chassisAcceleration = chassis.stats.performance.acceleration; // Range 0-100

            // Contoh: PU LSR 90, MRT 88, Chassis Accel 92
            // (0.90 * 0.88) * 0.92 = 0.73
            return (puLowSpeedResponse / 100) * (puMidRangeTorque / 100) * (chassisAcceleration / 100);
        }
        ```

4.  **Manajemen Ban (Tyre Wear):**
    *   **Konsep:** Tingkat keausan ban dipengaruhi oleh karakteristik sirkuit, reliabilitas PU, preservasi ban chassis, kehalusan mengemudi driver, dan manajemen ban tim. Degradasi musim juga berperan.
    *   **Perubahan Data Model (`chassis.json`):** `tyre_preservation_inverse` adalah representasi `100 - chassis.stats.performance.tyre_preservation`. Tidak perlu disimpan, bisa dihitung on-the-fly.
    *   **Perubahan Data Model (`power_units.json`):** `engine_wear_factor` adalah representasi `powerUnit.stats.reliability.engine_wear`. Tidak perlu disimpan, bisa dihitung on-the-fly.
    *   **Rumus:**
        `Tyre_Wear_Rate = (circuit.game_stats.tyre_wear / 100) * (1 + (100 - chassis.stats.performance.tyre_preservation) / 100 * 0.5) * (1 + (powerUnit.stats.reliability.engine_wear / 100) * 0.2) / ((driver.stats.smoothness / 100) * (team.sporting_profile.tyre_management / 100)) * season.regulations.tyres.degradation_factor`
    *   **JavaScript:**
        ```javascript
        function calculateTyreWearRate(driver, chassis, powerUnit, circuit, team, season) {
            const baseCircuitTyreWear = circuit.game_stats.tyre_wear / 100; // Base: 0-1
            const chassisTyrePreservation = chassis.stats.performance.tyre_preservation / 100; // 0-1
            const puEngineWear = powerUnit.stats.reliability.engine_wear / 100; // 0-1
            const driverSmoothness = driver.stats.smoothness / 100; // 0-1
            const teamTyreManagement = team.sporting_profile.tyre_management / 100; // 0-1
            const seasonDegradationFactor = season.regulations.tyres.degradation_factor; // e.g., 1.0

            // Pengaruh negatif dari kurangnya preservasi chassis dan keausan PU
            const chassisPenalty = 1 + (1 - chassisTyrePreservation) * 0.5; // Up to 50% penalty if 0 preservation
            const puPenalty = 1 + puEngineWear * 0.2; // Up to 20% penalty if 100 engine wear

            // Pengaruh positif dari smoothness driver dan manajemen tim
            const driverTeamBonus = driverSmoothness * teamTyreManagement; // Max 1.0

            // Final Calculation
            return baseCircuitTyreWear * chassisPenalty * puPenalty / (driverTeamBonus || 0.01) * seasonDegradationFactor; // Min 0.01 to prevent division by zero
        }
        ```

5.  **Konsumsi Bahan Bakar (Fuel Consumption):**
    *   **Konsep:** Tingkat konsumsi bahan bakar dipengaruhi oleh karakteristik sirkuit, efisiensi bahan bakar PU, kehalusan mengemudi driver, dan bias kecepatan balapan tim.
    *   **Perubahan Data Model (`power_units.json`):** `fuel_efficiency_inverse` adalah representasi `100 - powerUnit.stats.internal_combustion.fuel_efficiency`. Tidak perlu disimpan, bisa dihitung on-the-fly.
    *   **Rumus:**
        `Fuel_Consumption_Rate = (circuit.game_stats.fuel_consumption / 100) * (1 + (100 - powerUnit.stats.internal_combustion.fuel_efficiency) / 100 * 0.5) / ((driver.stats.smoothness / 100) * (team.sporting_profile.race_pace_bias / 100))`
    *   **JavaScript:**
        ```javascript
        function calculateFuelConsumptionRate(driver, powerUnit, circuit, team) {
            const baseCircuitFuelConsumption = circuit.game_stats.fuel_consumption / 100; // Base: 0-1
            const puFuelEfficiency = powerUnit.stats.internal_combustion.fuel_efficiency / 100; // 0-1
            const driverSmoothness = driver.stats.smoothness / 100; // 0-1
            const teamRacePaceBias = team.sporting_profile.race_pace_bias / 100; // 0-1

            // Pengaruh negatif dari kurangnya efisiensi PU
            const puPenalty = 1 + (1 - puFuelEfficiency) * 0.5; // Up to 50% penalty if 0 efficiency

            // Pengaruh positif dari smoothness driver dan bias race pace tim (asumsi race pace lebih efisien)
            const driverTeamBonus = driverSmoothness * teamRacePaceBias; // Max 1.0

            return baseCircuitFuelConsumption * puPenalty / (driverTeamBonus || 0.01); // Min 0.01 to prevent division by zero
        }
        ```

6.  **Tekanan Mesin (Engine Stress):**
    *   **Konsep:** Seberapa besar mesin mengalami tekanan, memengaruhi risiko kerusakan. Dipengaruhi oleh sirkuit, ketahanan PU, efisiensi pendinginan chassis, dan tingkat integrasi PU tim.
    *   **Perubahan Data Model (`power_units.json`):** `failure_resistance_inverse` adalah representasi `100 - powerUnit.stats.reliability.failure_resistance`.
    *   **Rumus:**
        `Engine_Stress_Rate = (circuit.game_stats.engine_stress / 100) * (1 + (100 - powerUnit.stats.reliability.failure_resistance) / 100 * 0.7) / ((chassis.stats.reliability.cooling_efficiency / 100) * (team.power_unit.integration_level / 100))`
    *   **JavaScript:**
        ```javascript
        function calculateEngineStressRate(chassis, powerUnit, circuit, team) {
            const baseCircuitEngineStress = circuit.game_stats.engine_stress / 100; // Base: 0-1
            const puFailureResistance = powerUnit.stats.reliability.failure_resistance / 100; // 0-1
            const chassisCoolingEfficiency = chassis.stats.reliability.cooling_efficiency / 100; // 0-1
            const teamPuIntegration = team.power_unit.integration_level / 100; // 0-1

            // Pengaruh negatif dari kurangnya ketahanan PU
            const puPenalty = 1 + (1 - puFailureResistance) * 0.7; // Up to 70% penalty if 0 resistance

            // Pengaruh positif dari cooling chassis dan integrasi PU tim
            const coolingIntegrationBonus = chassisCoolingEfficiency * teamPuIntegration; // Max 1.0

            return baseCircuitEngineStress * puPenalty / (coolingIntegrationBonus || 0.01);
        }
        ```

7.  **Tekanan Rem (Brake Stress):**
    *   **Konsep:** Seberapa besar rem mobil mengalami tekanan. Dipengaruhi oleh sirkuit, kemampuan pengereman driver, dan kualitas suspensi chassis.
    *   **Rumus:**
        `Brake_Stress_Rate = (circuit.game_stats.brake_stress / 100) / ((driver.stats.braking / 100) * (chassis.stats.mechanical.suspension_quality / 100))`
    *   **JavaScript:**
        ```javascript
        function calculateBrakeStressRate(driver, chassis, circuit) {
            const baseCircuitBrakeStress = circuit.game_stats.brake_stress / 100; // Base: 0-1
            const driverBraking = driver.stats.braking / 100; // 0-1
            const chassisSuspensionQuality = chassis.stats.mechanical.suspension_quality / 100; // 0-1

            // Pengaruh positif dari driver braking dan kualitas suspensi
            const brakingSuspensionBonus = driverBraking * chassisSuspensionQuality; // Max 1.0

            return baseCircuitBrakeStress / (brakingSuspensionBonus || 0.01);
        }
        ```

8.  **Toleransi Udara Kotor (Dirty Air Tolerance):**
    *   **Konsep:** Seberapa besar performa mobil terpengaruh saat mengikuti mobil lain dalam udara kotor. Dipengaruhi oleh toleransi aerodinamika chassis dan faktor regulasi musim.
    *   **Rumus:**
        `Penalty_Dirty_Air_Factor = (1 - (chassis.stats.aerodynamics.dirty_air_tolerance / 100)) * season.regulations.aerodynamics.dirty_air_reduction_factor`
        *   `dirty_air_reduction_factor` dari `seasons.json` diasumsikan sebagai pengali global (misalnya, 0.12).
    *   **JavaScript:**
        ```javascript
        function calculateDirtyAirPenaltyFactor(chassis, season) {
            const chassisDirtyAirTolerance = chassis.stats.aerodynamics.dirty_air_tolerance / 100; // 0-1
            const seasonDirtyAirReductionFactor = season.regulations.aerodynamics.dirty_air_reduction_factor; // e.g., 0.12

            // Semakin rendah toleransi, semakin tinggi penalti.
            // (1 - 0.90) * 0.12 = 0.012 (1.2% penalti)
            // (1 - 0.50) * 0.12 = 0.06 (6% penalti)
            return (1 - chassisDirtyAirTolerance) * seasonDirtyAirReductionFactor;
        }

        // Contoh penggunaan saat simulasi balapan:
        // const currentPerformance = /* ... */;
        // if (isInDirtyAir) {
        //    currentPerformance *= (1 - calculateDirtyAirPenaltyFactor(chassis, season));
        // }
        ```

9.  **Efisiensi DRS:**
    *   **Konsep:** Seberapa efektif sistem DRS dalam memberikan peningkatan kecepatan. Dipengaruhi oleh efisiensi DRS chassis dan batas efisiensi regulasi musim.
    *   **Rumus:**
        `DRS_Boost_Efektif_Persen = (chassis.stats.aerodynamics.drs_efficiency / 100) * season.regulations.aerodynamics.drs_efficiency_cap`
        *   `drs_efficiency_cap` dari `seasons.json` diasumsikan sebagai pengali global (misalnya, 0.95).
    *   **JavaScript:**
        ```javascript
        function calculateDRSBoostPercentage(chassis, season) {
            const chassisDrsEfficiency = chassis.stats.aerodynamics.drs_efficiency / 100; // 0-1
            const seasonDrsEfficiencyCap = season.regulations.aerodynamics.drs_efficiency_cap; // e.g., 0.95

            // Contoh: Chassis 90, Cap 0.95 -> 0.90 * 0.95 = 0.855 (85.5% dari potensi boost maksimum DRS)
            return chassisDrsEfficiency * seasonDrsEfficiencyCap;
        }

        // Contoh penggunaan:
        // const baseTopSpeed = /* ... */;
        // const drsBonus = baseTopSpeed * calculateDRSBoostPercentage(chassis, season) * 0.05; // 5% adalah contoh max speed boost
        // const effectiveTopSpeedWithDRS = baseTopSpeed + drsBonus;
        ```

10. **Adaptasi Sirkuit (Circuit Adaptation Bonus):**
    *   **Konsep:** Bonus performa kecil berdasarkan seberapa baik driver dan technical chief beradaptasi dengan karakteristik sirkuit.
    *   **Rumus:**
        `Circuit_Adaptation_Bonus_Factor = (driver.stats.adaptability / 100 + technicalChief.personality.adaptability / 100) / 2 * 0.02`
        *   Angka `0.02` adalah contoh kecilnya bonus (max 2% bonus).
    *   **JavaScript:**
        ```javascript
        function calculateCircuitAdaptationBonus(driver, technicalChief) {
            const driverAdaptability = driver.stats.adaptability / 100; // 0-1
            const techChiefAdaptability = technicalChief.personality.adaptability / 100; // 0-1

            // Rata-rata kemampuan adaptasi driver dan tech chief, dikalikan dengan faktor bonus kecil
            return ((driverAdaptability + techChiefAdaptability) / 2) * 0.02; // Max 2% bonus
        }

        // Contoh penggunaan:
        // const basePerformance = /* ... */;
        // const adaptedPerformance = basePerformance * (1 + calculateCircuitAdaptationBonus(driver, technicalChief));
        ```

11. **Setup Optimal:**
    *   **Konsep:** Seberapa baik setup mobil untuk sirkuit, dipengaruhi oleh `technicalChief` dan `simulator_level` tim. Kesulitan AI sirkuit dapat mengurangi efektivitas.
    *   **Rumus:**
        `Setup_Bonus_Factor = (technicalChief.stats.setup_understanding / 100) * (team.infrastructure.simulator_level / 100) * (1 - circuit.game_stats.ai_difficulty_modifier / 100) * 0.05`
        *   `ai_difficulty_modifier` diasumsikan sebagai nilai 0-100.
        *   `0.05` adalah contoh pengali bonus maksimum (max 5%).
    *   **JavaScript:**
        ```javascript
        function calculateSetupBonus(technicalChief, team, circuit) {
            const techChiefSetupUnderstanding = technicalChief.stats.setup_understanding / 100; // 0-1
            const teamSimulatorLevel = team.infrastructure.simulator_level / 100; // 0-1
            const circuitAiDifficultyModifier = circuit.game_stats.ai_difficulty_modifier / 100; // 0-1

            // Semakin tinggi setup understanding dan simulator level, semakin baik bonus.
            // Modifier kesulitan sirkuit mengurangi bonus.
            return techChiefSetupUnderstanding * teamSimulatorLevel * (1 - circuitAiDifficultyModifier) * 0.05; // Max 5% bonus
        }

        // Contoh penggunaan:
        // const basePerformance = /* ... */;
        // const performanceWithSetup = basePerformance * (1 + calculateSetupBonus(technicalChief, team, circuit));
        ```

12. **Performa Cuaca Basah:**
    *   **Konsep:** Pengurangan performa keseluruhan di kondisi basah, dimoderasi oleh kemampuan `chassis` di cuaca basah, `driver.adaptability`, dan intensitas hujan.
    *   **Rumus:**
        `Wet_Weather_Performance_Factor = (1 - (chassis.car_behavior.wet_weather_performance / 100 + driver.stats.adaptability / 100) / 2) * (gameData.currentWeather.rainIntensity / 3)`
        *   `rainIntensity`: 0 (kering) hingga 3 (deras).
    *   **JavaScript:**
        ```javascript
        function calculateWetWeatherPerformancePenalty(driver, chassis, currentWeather) {
            const chassisWetPerformance = chassis.car_behavior.wet_weather_performance / 100; // 0-1
            const driverAdaptability = driver.stats.adaptability / 100; // 0-1
            const rainIntensityFactor = currentWeather.rainIntensity / 3; // 0 to 1 (0=dry, 1=heavy rain)

            // Rata-rata kemampuan di basah, semakin tinggi semakin rendah penalti
            const wetWeatherSkill = (chassisWetPerformance + driverAdaptability) / 2;

            // Semakin tinggi rainIntensity, semakin besar penalti, dikurangi oleh wetWeatherSkill
            // Contoh: Skill 0.8, Rain 1 (medium) -> (1 - 0.8) * (1/3) = 0.066 (6.6% penalti)
            // Skill 0.5, Rain 3 (heavy) -> (1 - 0.5) * (3/3) = 0.5 (50% penalti)
            return (1 - wetWeatherSkill) * rainIntensityFactor;
        }

        // Contoh penggunaan:
        // const basePerformance = /* ... */;
        // if (gameData.currentWeather.rainIntensity > 0) {
        //    const penalty = calculateWetWeatherPerformancePenalty(driver, chassis, gameData.currentWeather);
        //    currentPerformance *= (1 - penalty);
        // }
        ```

---

### II.B. Strategi Balapan

**Konsep:** Kemampuan tim untuk membuat keputusan strategis yang efektif dan efisien selama balapan.

1.  **Efektivitas Strategi Pit Stop:**
    *   **Konsep:** Seberapa cepat pit stop dilakukan dan seberapa akurat keputusan strategi pit stop. Dipengaruhi oleh `teamChief.stats.strategy`, `team.infrastructure.staff_quality`, dan `circuit.game_stats.pit_loss_seconds`.
    *   **Rumus:**
        `Pit_Stop_Efficiency_Factor = (teamChief.stats.strategy / 100) * (team.infrastructure.staff_quality / 100) - (circuit.game_stats.pit_loss_seconds / 60) * 0.01`
        *   `pit_loss_seconds / 60` mengonversi detik ke menit untuk modifier. `0.01` adalah contoh pengali untuk dampak pit loss.
    *   **JavaScript:**
        ```javascript
        function calculatePitStopEfficiency(teamChief, team, circuit) {
            const tpStrategy = teamChief.stats.strategy / 100; // 0-1
            const staffQuality = team.infrastructure.staff_quality / 100; // 0-1
            const pitLossSeconds = circuit.game_stats.pit_loss_seconds; // e.g., 21 seconds

            const baseEfficiency = tpStrategy * staffQuality; // Max 1.0
            const pitLossPenalty = (pitLossSeconds / 60) * 0.01; // Convert to % of efficiency loss

            return baseEfficiency - pitLossPenalty;
        }

        // Contoh penggunaan:
        // const idealPitStopDuration = 2.0; // Detik
        // const actualPitStopDuration = idealPitStopDuration / calculatePitStopEfficiency(teamChief, team, circuit);
        ```

2.  **Reaktivitas Safety Car:**
    *   **Konsep:** Seberapa cepat dan optimal tim merespons periode Safety Car atau Virtual Safety Car. Dipengaruhi oleh `teamChief.stats.strategy` dan `teamChief.personality.emotional_control`.
    *   **Rumus:**
        `SC_Reactivity_Score = (teamChief.stats.strategy / 100) * (teamChief.personality.emotional_control / 100)`
    *   **JavaScript:**
        ```javascript
        function calculateSCReactivity(teamChief) {
            const tpStrategy = teamChief.stats.strategy / 100; // 0-1
            const tpEmotionalControl = teamChief.personality.emotional_control / 100; // 0-1

            return tpStrategy * tpEmotionalControl; // Max 1.0
        }

        // Contoh penggunaan:
        // Saat SC, ada jendela waktu untuk pit.
        // const pitWindowTime = 10; // Detik
        // const decisionTime = pitWindowTime * (1 - calculateSCReactivity(teamChief)); // Waktu yang dibutuhkan untuk membuat keputusan
        ```

---

### II.C. Kejadian Acak Selama Balapan

**Konsep:** Probabilitas terjadinya insiden (kecelakaan, safety car) selama balapan, dipengaruhi oleh faktor game global, kemampuan driver, dan karakteristik sirkuit.

1.  **Probabilitas Kecelakaan:**
    *   **Konsep:** Pembalap dengan kontrol dan akurasi rendah memiliki probabilitas kecelakaan yang lebih tinggi dari base probability musim.
    *   **Rumus:**
        `Crash_Chance = season.simulation_config.crash_probability * (1 + (1 - driver.stats.control / 100) * 0.75) * (1 + (1 - driver.stats.accuracy / 100) * 0.75)`
        *   `0.75` adalah contoh pengali seberapa besar driver yang buruk meningkatkan risiko kecelakaan.
    *   **JavaScript:**
        ```javascript
        function calculateCrashChance(driver, season) {
            const baseCrashProbability = season.simulation_config.crash_probability; // e.g., 0.02 (2%)
            const driverControl = driver.stats.control / 100; // 0-1
            const driverAccuracy = driver.stats.accuracy / 100; // 0-1

            // Pengaruh negatif dari driver control dan accuracy
            const controlPenalty = 1 + (1 - driverControl) * 0.75; // Up to 75% increase
            const accuracyPenalty = 1 + (1 - driverAccuracy) * 0.75; // Up to 75% increase

            return baseCrashProbability * controlPenalty * accuracyPenalty;
        }

        // Contoh penggunaan dalam loop simulasi per lap/sektor:
        // if (Math.random() < calculateCrashChance(driver, season)) {
        //    triggerCrashEvent(driver);
        // }
        ```

2.  **Probabilitas Safety Car:**
    *   **Konsep:** Probabilitas terjadinya Safety Car, dipengaruhi oleh karakteristik sirkuit dan probabilitas global musim.
    *   **Rumus:**
        `Safety_Car_Chance_Efektif = circuit.game_stats.safety_car_chance * season.simulation_config.safety_car_probability`
        *   `safety_car_chance` dari `circuits.json` diasumsikan sebagai pengali (misalnya, 0.35 = 35%).
        *   `safety_car_probability` dari `seasons.json` diasumsikan sebagai pengali global (misalnya, 0.18 = 18%).
    *   **JavaScript:**
        ```javascript
        function calculateSafetyCarChance(circuit, season) {
            const circuitScChance = circuit.game_stats.safety_car_chance / 100; // Base: 0-1
            const seasonScProbability = season.simulation_config.safety_car_probability; // e.g., 0.18

            return circuitScChance * seasonScProbability;
        }

        // Contoh penggunaan:
        // if (Math.random() < calculateSafetyCarChance(circuit, season)) {
        //    triggerSafetyCar();
        // }
        ```

---

## III. Perhitungan Stats Saat DNF (Did Not Finish)

DNF sebagian besar disebabkan oleh faktor reliabilitas, yang diperparah oleh stres balapan dan faktor acak.

1.  **Faktor Reliabilitas Komponen (Chassis & Power Unit):**
    *   **Konsep:** Probabilitas DNF meningkat dengan rendahnya ketahanan kerusakan komponen, tingginya stres sirkuit, dan rendahnya fokus Technical Chief pada reliabilitas.
    *   **Perubahan Data Model (`TechnicalChief.stats`):** Pastikan `reliability_focus` adalah stat yang relevan.
    *   **Rumus DNF Chassis:**
        `DNF_Probabilitas_Chassis = (1 - chassis.stats.reliability.failure_resistance / 100) * ((circuit.game_stats.brake_stress / 100) + (circuit.game_stats.engine_stress / 100)) / (technicalChief.stats.reliability_focus / 100 || 0.1) * 0.01`
        *   `0.01` adalah pengali untuk menjaga probabilitas dalam rentang yang wajar. `0.1` sebagai fallback untuk menghindari pembagian nol.
    *   **Rumus DNF Power Unit:**
        `DNF_Probabilitas_PU = (1 - powerUnit.stats.reliability.failure_resistance / 100) * (circuit.game_stats.engine_stress / 100) / (technicalChief.stats.reliability_focus / 100 || 0.1) * 0.02`
        *   PU biasanya lebih rentan DNF, jadi pengali `0.02` mungkin lebih tinggi.
    *   **JavaScript:**
        ```javascript
        function calculateDNFProbability(chassis, powerUnit, circuit, technicalChief) {
            const techChiefReliabilityFocus = technicalChief.stats.reliability_focus / 100 || 0.1; // 0-1, min 0.1

            // DNF Chassis
            const chassisFailureResistance = chassis.stats.reliability.failure_resistance / 100; // 0-1
            const chassisStressFactor = (circuit.game_stats.brake_stress / 100) + (circuit.game_stats.engine_stress / 100); // Max 2.0
            const dnfChassis = (1 - chassisFailureResistance) * chassisStressFactor / techChiefReliabilityFocus * 0.01; // Scale factor

            // DNF Power Unit
            const puFailureResistance = powerUnit.stats.reliability.failure_resistance / 100; // 0-1
            const puStressFactor = circuit.game_stats.engine_stress / 100; // Max 1.0
            const dnfPowerUnit = (1 - puFailureResistance) * puStressFactor / techChiefReliabilityFocus * 0.02; // Scale factor, higher for PU

            // Gabungkan probabilitas DNF (bisa dnf karena chassis ATAU PU)
            // Atau bisa juga dipisahkan untuk menentukan jenis DNF
            return {
                chassis: Math.min(dnfChassis, 1.0), // Max 100%
                powerUnit: Math.min(dnfPowerUnit, 1.0),
                total: Math.min(1.0, dnfChassis + dnfPowerUnit) // Total dnf chance
            };
        }

        // Contoh penggunaan:
        // const dnfChances = calculateDNFProbability(chassis, powerUnit, circuit, technicalChief);
        // if (Math.random() < dnfChances.total) {
        //    // Trigger DNF event, perhaps based on dnfChances.chassis vs dnfChances.powerUnit
        // }
        ```

2.  **Pengaruh AI Behavior pada Reliabilitas (Power Unit Wear):**
    *   **Konsep:** Cara AI mengelola `power unit` dapat memengaruhi tingkat keausan, yang pada gilirannya memengaruhi probabilitas DNF.
    *   **Perubahan Data Model (`power_units.json`):** `ai_behavior.reliability_management` bisa berupa string ("conservative", "balanced", "high_risk") yang di-map ke nilai numerik.
    *   **Rumus (Modifier pada Keausan PU):**
        `PU_Wear_Modifier_Factor = mapReliabilityManagementToValue(powerUnit.ai_behavior.reliability_management)`
        *   `mapReliabilityManagementToValue`: Fungsi helper yang mengonversi string menjadi faktor numerik (misalnya, conservative=0.8, balanced=1.0, high_risk=1.2).
    *   **JavaScript:**
        ```javascript
        function mapReliabilityManagementToValue(strategy) {
            switch (strategy) {
                case "conservative": return 0.8;
                case "balanced": return 1.0;
                case "high_risk": return 1.2;
                default: return 1.0;
            }
        }

        function calculatePUWearRate(powerUnit, driver, circuit, team) {
            // ... (gunakan rumus konsumsi bahan bakar atau engine stress sebagai dasar keausan)
            let baseWear = calculateEngineStressRate(chassis, powerUnit, circuit, team); // Example
            const reliabilityModifier = mapReliabilityManagementToValue(powerUnit.ai_behavior.reliability_management);

            return baseWear * reliabilityModifier;
        }
        ```

3.  **Konsekuensi DNF:**
    *   **Poin:** Pembalap dan tim tidak mendapatkan poin kejuaraan untuk balapan tersebut.
    *   **Rating Form & Momentum:**
        `driver.performance_state.form_rating_last_5_races = updateFormRating(driver.performance_state.form_rating_last_5_races, DNF_IMPACT_VALUE)`
        `team.performance_state.momentum = updateMomentum(team.performance_state.momentum, DNF_IMPACT_VALUE)`
        *   `updateFormRating`/`updateMomentum`: Fungsi helper yang menurunkan nilai berdasarkan `DNF_IMPACT_VALUE` (misalnya, -10 hingga -20).
    *   **Biaya Perbaikan:**
        `team.economy.cash_reserve -= calculateRepairCost(chassis, powerUnit)`
        *   `calculateRepairCost`: Fungsi helper yang menghitung biaya perbaikan berdasarkan komponen yang rusak dan `teams.economy.operational_cost` atau `chassis.price_idr`, `power_unit.price_idr`.

---

## IV. Perhitungan Stats Saat Juara (Championship Winner)

Meraih kejuaraan membawa bonus signifikan pada finansial dan reputasi tim.

1.  **Peningkatan Pendapatan Sponsor:**
    *   **Konsep:** Tim juara mendapatkan bagian dari `constructor_bonus_pool` dan melihat peningkatan permanen dalam `sponsor_income` mereka.
    *   **Perubahan Data Model (`teams.json`):** Tambahkan `teams.status.tier_bonus_factor` (misalnya, 0.1-0.3) berdasarkan `tier` tim.
    *   **Rumus:**
        `Sponsor_Income_Boost = season.financial_model.constructor_bonus_pool * team.status.tier_bonus_factor`
        `team.economy.sponsor_income += Sponsor_Income_Boost`
    *   **JavaScript:**
        ```javascript
        function calculateChampionshipSponsorBonus(team, season) {
            // Asumsi team.status.tier_bonus_factor sudah terdefinisi/dihitung
            const tierBonusFactor = team.status.tier_bonus_factor || 0.15; // Default jika tidak ada

            const constructorBonusPool = season.financial_model.constructor_bonus_pool;
            return constructorBonusPool * tierBonusFactor;
        }

        function awardChampionshipBonuses(team, season, allSponsors) {
            const sponsorBoost = calculateChampionshipSponsorBonus(team, season);
            team.economy.sponsor_income += sponsorBoost;

            // Peningkatan estimated_annual_value_idr untuk sponsor yang sudah ada
            allSponsors.filter(s => s.team_id === team.id).forEach(sponsor => {
                sponsor.financials.estimated_annual_value_idr *= 1.1; // Contoh: 10% peningkatan
            });
            // ... juga memengaruhi sponsor potensial
        }
        ```

2.  **Peningkatan Reputasi Tim:**
    *   **Konsep:** Menjadi juara meningkatkan `stability_rating`, `recruitment_strength`, `driver_attractiveness`, dan `political_influence`.
    *   **Rumus:**
        `team.status.stability_rating += 15`
        `team.meta.recruitment_strength += 10`
        `team.meta.driver_attractiveness += 15`
        `team.meta.political_influence += 10`
        *   Angka adalah contoh bonus tetap. Bisa juga berbasis persentase.
    *   **JavaScript:**
        ```javascript
        function updateTeamReputationAfterChampionship(team) {
            team.status.stability_rating = Math.min(100, team.status.stability_rating + 15);
            team.meta.recruitment_strength = Math.min(100, team.meta.recruitment_strength + 10);
            team.meta.driver_attractiveness = Math.min(100, team.meta.driver_attractiveness + 15);
            team.meta.political_influence = Math.min(100, team.meta.political_influence + 10);
            // ... update ke file JSON
        }
        ```

3.  **Peningkatan Moral & Attractiveness Personel:**
    *   **Konsep:** Pembalap dan staf di tim juara mendapatkan peningkatan `career_rating` dan `morale` (jika diimplementasikan).
    *   **Rumus:**
        `driver.career_rating += 5`
        `teamChief.career_rating += 10`
        `technicalChief.career_rating += 8`
        *   Angka adalah contoh bonus tetap.
    *   **JavaScript:**
        ```javascript
        function updatePersonnelRatingsAfterChampionship(driver, teamChief, technicalChief) {
            driver.career_rating = Math.min(100, driver.career_rating + 5);
            teamChief.career_rating = Math.min(100, teamChief.career_rating + 10);
            technicalChief.career_rating = Math.min(100, technicalChief.career_rating + 8);
            // ... update ke file JSON
        }
        ```

---

## V. Perhitungan Stats Saat Sponsor Baru Datang

Sponsor membawa dampak langsung pada keuangan dan kapabilitas tim melalui `ai_effects` yang didefinisikan dalam `sponsors.json`.

1.  **Peningkatan Pendapatan Sponsor Langsung:**
    *   **Konsep:** `estimated_annual_value_idr` dari sponsor baru langsung ditambahkan ke `sponsor_income` tim.
    *   **Rumus:**
        `team.economy.sponsor_income += newSponsor.financials.estimated_annual_value_idr`
    *   **JavaScript:**
        ```javascript
        function addSponsorIncome(team, newSponsor) {
            team.economy.sponsor_income += newSponsor.financials.estimated_annual_value_idr;
            // Pastikan Anda menyimpan referensi sponsor baru ke tim, mungkin di teams.json ada array sponsor_ids
        }
        ```

2.  **Bonus `ai_effects` pada Stat Tim:**
    *   **Konsep:** Setiap `ai_effects` dari sponsor adalah pengubah langsung pada statistik atau kapabilitas tim.
    *   **Rumus:** Bervariasi per efek, biasanya aditif atau fungsional (`max`, `min`).
    *   **JavaScript:**
        ```javascript
        function applySponsorEffects(team, chassis, newSponsor) {
            const effects = newSponsor.ai_effects;

            if (effects.development_speed_boost) {
                team.development_model.innovation_rate = Math.min(100, team.development_model.innovation_rate + effects.development_speed_boost);
            }
            if (effects.pit_infrastructure_level) {
                team.infrastructure.factory_level = Math.max(team.infrastructure.factory_level, effects.pit_infrastructure_level);
            }
            if (effects.marketing_pressure) {
                // Ini bisa jadi efek negatif/positif, tergantung interpretasi
                // Misalnya, meningkatkan tekanan pada Team Chief
                team.teamChief.personality.emotional_control = Math.max(0, team.teamChief.personality.emotional_control - effects.marketing_pressure_value); // Jika pressure negatif
            }
            if (effects.aero_development_boost) {
                chassis.development.upgrade_potential = Math.min(100, chassis.development.upgrade_potential + effects.aero_development_boost);
            }
            // ... Lanjutkan untuk semua efek yang didefinisikan di sponsors.json
            // Pastikan untuk menangani efek yang ada di objek berbeda (chassis, powerUnit, driver)
        }
        ```

3.  **Pengaruh Team Chief pada Sponsor Attraction:**
    *   **Konsep:** Team Principal dengan `sponsor_power` tinggi dan `political_influence` tim yang baik akan lebih mudah menarik sponsor tier tinggi.
    *   **Rumus:**
        `Sponsor_Attraction_Chance = (teamChief.stats.sponsor_power / 100) * (team.meta.political_influence / 100) * (team.performance_state.championship_position <= 5 ? 1.5 : 1.0) * (newSponsor.sponsor_tier_multiplier || 1.0)`
        *   `sponsor_tier_multiplier`: Perlu ditambahkan ke `sponsors.json` untuk menunjukkan seberapa sulit sponsor tier tertentu untuk direkrut.
    *   **JavaScript:**
        ```javascript
        function calculateSponsorAttractionChance(team, teamChief, potentialSponsor) {
            const tpSponsorPower = teamChief.stats.sponsor_power / 100; // 0-1
            const teamPoliticalInfluence = team.meta.political_influence / 100; // 0-1
            
            // Bonus jika tim performa bagus
            const performanceBonus = team.performance_state.championship_position <= 5 ? 1.5 : 1.0;

            // Asumsi: potentialSponsor.sponsor_tier_multiplier (e.g., S-Tier = 0.8, A-Tier = 1.0, B-Tier = 1.2)
            const sponsorDifficulty = potentialSponsor.sponsor_tier_multiplier || 1.0; 

            return tpSponsorPower * teamPoliticalInfluence * performanceBonus / sponsorDifficulty; // Probabilitas 0-1
        }

        // Contoh penggunaan:
        // if (Math.random() < calculateSponsorAttractionChance(team, teamChief, somePotentialSponsor)) {
        //    // Sponsor tertarik, tawarkan kontrak
        // }
        ```

---

## VI. Data Implisit & Mekanisme Game Tambahan yang Disarankan

Untuk simulasi yang lebih mendalam, beberapa mekanisme game perlu dipertimbangkan di luar data statis ini.

*   **Sistem Umur & Progresi/Regresi (JavaScript Logic):**
    *   **`drivers.json`:** Tambahkan `potential_rating` (e.g., 0-100) dan `peak_age` (e.g., 28-32).
    *   **`staff_json`:** Mirip dengan driver, tambahkan `potential_rating` dan `peak_age`.
    *   **Logika Progresi/Regresi per musim/tahun:**
        ```javascript
        function updateDriverStatsPerYear(driver) {
            driver.age++; // Diasumsikan driver.age ada
            const devFactor = driver.potential_rating / 100; // e.g., 0.8
            const peakAge = driver.peak_age || 30;

            if (driver.age < peakAge) {
                // Pengembangan: Stats meningkat lebih cepat jika muda dan potensi tinggi
                const growthRate = (1 - (driver.age / peakAge)) * devFactor * 0.05; // Contoh 5% growth per stat per tahun
                for (const statKey in driver.stats) {
                    if (typeof driver.stats[statKey] === 'number') {
                        driver.stats[statKey] = Math.min(100, driver.stats[statKey] + (driver.stats[statKey] * growthRate));
                    }
                }
            } else if (driver.age > peakAge + 5) { // Setelah masa puncak, mulai menurun
                const regressionRate = ((driver.age - peakAge - 5) / 10) * 0.02; // Contoh 2% decay per stat per tahun setelah 5 tahun puncak
                for (const statKey in driver.stats) {
                    if (typeof driver.stats[statKey] === 'number') {
                        driver.stats[statKey] = Math.max(0, driver.stats[statKey] - (driver.stats[statKey] * regressionRate));
                    }
                }
            }
            // Update overall stat setelah perubahan individual
            driver.stats.overall = calculateOverallDriverRating(driver.stats); // Helper function
        }
        ```

*   **Moral & Tekanan (JavaScript Logic):**
    *   **`drivers.json`, `team_chiefs.json`, `technical_chiefs.json`:** Tambahkan `morale` (e.g., 0-100) dan `pressure` (e.g., 0-100).
    *   **Logika Fluktuasi Moral:**
        ```javascript
        function updatePersonnelMorale(personnel, teamPerformance, mediaSentiment, teamChiefLeadership) {
            let moraleChange = 0;
            // Dipengaruhi oleh performa tim
            if (teamPerformance.championship_position <= 3) moraleChange += 5;
            else if (teamPerformance.championship_position > 7) moraleChange -= 3;
            // Dipengaruhi oleh media
            if (mediaSentiment === "positive") moraleChange += 2;
            else if (mediaSentiment === "negative") moraleChange -= 4;
            // Dipengaruhi oleh kepemimpinan Team Chief
            moraleChange += (teamChiefLeadership / 100 - 0.5) * 2; // +10 jika leadership 100, -10 jika 0

            personnel.morale = Math.max(0, Math.min(100, personnel.morale + moraleChange));
        }
        ```

*   **Sistem Pengembangan Dinamis (JavaScript Logic):**
    *   **`teams.json`:** Tambahkan `development_projects` (array objek, `name`, `target_component`, `progress`, `cost`, `risk`).
    *   **Logika Progresi Proyek:**
        ```javascript
        function advanceDevelopmentProjects(team, technicalChief, season) {
            team.development_projects.forEach(project => {
                const baseProgress = (team.infrastructure.factory_level + team.infrastructure.cfd_capacity) / 200;
                const innovationBonus = technicalChief.stats.innovation / 100;
                const speedBoost = team.development_model.innovation_rate / 100;
                const actualProgress = baseProgress * innovationBonus * speedBoost * (1 - project.risk / 100);

                project.progress += actualProgress;

                if (project.progress >= 100) {
                    // Project completed, apply upgrade to chassis/power unit
                    applyUpgrade(team, project.target_component, project.upgrade_effects); // Helper
                    removeProject(team, project); // Helper
                }
            });
            team.economy.cash_reserve -= calculateDevelopmentCost(team.development_projects); // Biaya per turn
        }
        ```

*   **Kontrak Dinamis (JavaScript Logic):**
    *   **`drivers.json`, `team_chiefs.json`, `technical_chiefs.json`:** Tambahkan `contract_end_year`.
    *   **Logika Negosiasi:**
        ```javascript
        function initiateContractNegotiation(personnel, team, newOffer) {
            let acceptanceChance = 0.5; // Base 50%
            acceptanceChance += (team.meta.driver_attractiveness / 100 - 0.5) * 0.2; // Team attractiveness
            acceptanceChance += (team.economy.cash_reserve / team.economy.budget_cap - 0.5) * 0.1; // Financial stability
            acceptanceChance += (personnel.morale / 100 - 0.5) * 0.15; // Personnel morale
            acceptanceChance += (newOffer.salary / personnel.price_idr - 1.0) * 0.3; // Offer vs current salary

            if (Math.random() < acceptanceChance) {
                // Deal accepted
                personnel.price_idr = newOffer.salary;
                personnel.contract_end_year = newOffer.duration;
                // ... update teams.json FKs jika perlu
            } else {
                // Deal rejected
            }
        }
        ```

*   **Event Acak (JavaScript Logic):**
    *   Sistem untuk memicu event acak dengan probabilitas tertentu setiap balapan/minggu.
    *   **Contoh:**
        ```javascript
        function triggerRandomEvent(gameData) {
            const random = Math.random();
            if (random < 0.01) { // 1% chance for a major event
                // Major event: "Key staff member falls ill!"
                gameData.technicalChief.stats.innovation = Math.max(0, gameData.technicalChief.stats.innovation - 20);
                setTimeout(() => { // Restore after some time
                    gameData.technicalChief.stats.innovation += 20;
                }, 3 * 7 * 24 * 60 * 60 * 1000); // 3 weeks in milliseconds
            } else if (random < 0.05) { // 5% chance for a minor event
                // Minor event: "Small factory fire!"
                gameData.team.infrastructure.factory_level = Math.max(1, gameData.team.infrastructure.factory_level - 1);
                gameData.team.economy.cash_reserve -= 5_000_000;
            }
        }
        ```

*   **Adaptasi Regulasi (JavaScript Logic):**
    *   **`seasons.json`:** Perlu detail lebih lanjut tentang `regulation_shifts` di `engine_flags`.
    *   **Logika Adaptasi:**
        ```javascript
        function adaptToNewRegulations(team, technicalChief, nextSeasonRegulations) {
            const currentRegulationAdaptation = team.development_model.regulation_adaptation / 100; // 0-1
            const techChiefRegulationAdaptation = technicalChief.stats.regulation_adaptation / 100; // 0-1

            const adaptationSpeed = (currentRegulationAdaptation + techChiefRegulationAdaptation) / 2;
            const adaptationCost = (1 - adaptationSpeed) * 50_000_000; // Lebih lambat adaptasi, lebih mahal
            
            team.economy.cash_reserve -= adaptationCost;

            // Setelah adaptasi selesai (setelah beberapa waktu/investasi), performa tidak terlalu terpengaruh negatif
            // Atau mendapatkan bonus jika adaptasi sangat baik
        }
        ```

---

Dokumen ini menyediakan kerangka kerja yang diperluas untuk bagaimana statistik akan dihitung dan berinteraksi dalam game F1 Manager 2026 Anda, dengan contoh implementasi JavaScript. Implementasi yang tepat akan bergantung pada desain dan kompleksitas game engine yang Anda kembangkan, tetapi ini harus memberikan titik awal yang solid.

