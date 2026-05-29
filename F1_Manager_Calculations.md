# F1 Manager - Dokumentasi Perhitungan

Dokumen ini menguraikan berbagai metodologi perhitungan yang digunakan dalam proyek F1 Manager untuk berbagai fase, termasuk skenario pra-balapan, selama balapan, dan pasca-balapan, serta modifikasi statistik umum dan pengaruh acak.

---

## 1. Statistik Master Data Proyek

Bagian ini merinci statistik utama yang digunakan untuk Pembalap, Tim, dan Chassis, yang bersumber dari file master data proyek.

### 1.1. Statistik Pembalap (dari `data/drivers.json`)

Statistik ini menggambarkan kemampuan seorang pembalap di berbagai aspek balapan.

*   **Keseluruhan (Overall):** `driver.overall` - Peringkat kemampuan umum pembalap, memengaruhi konsistensi, menyalip, dan bertahan.
*   **Tikungan (Cornering):** `driver.cornering` - Kemampuan pembalap dalam melewati tikungan.
*   **Pengereman (Braking):** `driver.braking` - Kemampuan pembalap dalam melakukan pengereman.
*   **Reaktivitas (Reactiveness):** `driver.reactiveness` - Kecepatan reaksi pembalap terhadap situasi di lintasan, memengaruhi tingkat kesalahan dan waktu reaksi.
*   **Menyalip (Overtaking):** `driver.overtaking` - Kemampuan pembalap dalam melakukan manuver menyalip.
*   **Bertahan (Defending):** `driver.defending` - Kemampuan pembalap dalam mempertahankan posisinya.
*   **Kehalusan (Smoothness):** `driver.smoothness` - Seberapa halus pembalap mengendarai, memengaruhi keausan ban.
*   **Adaptabilitas (Adaptability):** `driver.adaptability` - Kemampuan pembalap beradaptasi dengan kondisi lintasan yang berubah (cuaca basah, degradasi ban).
*   **Kontrol (Control):** `driver.control` - Kemampuan pembalap mengendalikan mobil dalam kondisi sulit.
*   **Akurasi (Accuracy):** `driver.accuracy` - Presisi pembalap dalam menempatkan mobil dan mengikuti garis balap.
*   **Stamina (Stamina):** `driver.stamina` - Kemampuan pembalap untuk mempertahankan performa selama stint panjang, memengaruhi kecepatan di akhir balapan.
*   **Fokus (Focus):** `driver.focus` - Konsentrasi pembalap, memengaruhi tingkat kesalahan dan waktu reaksi.
*   **Agresi (Aggression):** `driver.aggression` - Kemauan pembalap untuk mengambil risiko, memengaruhi upaya menyalip dan mengemudi defensif.
*   **Pengalaman (Experience):** `driver.experience` - Pengetahuan balapan yang terakumulasi oleh pembalap, mengurangi kesalahan pemula dan meningkatkan panggilan strategi.

### 1.2. Statistik Tim (dari `data/teams.json`)

Statistik ini mencakup berbagai aspek operasional dan performa tim.

#### Status Tim:
*   **Peringkat Stabilitas (Stability Rating):** `team.status.stability_rating` - Stabilitas tim secara keseluruhan.

#### Ekonomi Tim:
*   **Batas Anggaran (Budget Cap):** `team.economy.budget_cap` - Batas anggaran yang ditetapkan untuk tim.
*   **Pendapatan Sponsor (Sponsor Income):** `team.economy.sponsor_income` - Pendapatan yang diterima dari sponsor.
*   **Biaya Operasional (Operational Cost):** `team.economy.operational_cost` - Biaya yang dikeluarkan untuk operasional tim.
*   **Cadangan Kas (Cash Reserve):** `team.economy.cash_reserve` - Jumlah uang tunai yang dimiliki tim.

#### Kondisi Performa Tim:
*   **Posisi Kejuaraan (Championship Position):** `team.performance_state.championship_position` - Posisi tim di klasemen konstruktor.
*   **Poin (Points):** `team.performance_state.points` - Total poin kejuaraan yang telah dikumpulkan.
*   **Kemenangan (Wins):** `team.performance_state.wins` - Jumlah kemenangan balapan.
*   **Podium (Podiums):** `team.performance_state.podiums` - Jumlah podium yang diraih.
*   **Peringkat Performa 5 Balapan Terakhir (Form Rating Last 5 Races):** `team.performance_state.form_rating_last_5_races` - Rating performa tim dalam 5 balapan terakhir.
*   **Momentum (Momentum):** `team.performance_state.momentum` - Momentum performa tim.

#### Infrastruktur Tim:
*   **Tingkat Pabrik (Factory Level):** `team.infrastructure.factory_level` - Tingkat pengembangan pabrik tim.
*   **Tingkat Terowongan Angin (Wind Tunnel Level):** `team.infrastructure.wind_tunnel_level` - Tingkat pengembangan terowongan angin.
*   **Kapasitas CFD (CFD Capacity):** `team.infrastructure.cfd_capacity` - Kapasitas analisis Computational Fluid Dynamics.
*   **Tingkat Simulator (Simulator Level):** `team.infrastructure.simulator_level` - Tingkat pengembangan simulator.
*   **Kualitas Staf (Staff Quality):** `team.infrastructure.staff_quality` - Kualitas keseluruhan staf tim.

#### Unit Tenaga Tim:
*   **Penyedia (Supplier):** `team.power_unit.supplier` - Pemasok unit tenaga.
*   **Performa Unit Tenaga (Performance):** `team.power_unit.performance` - Tingkat performa unit tenaga.
*   **Keandalan Unit Tenaga (Reliability):** `team.power_unit.reliability` - Tingkat keandalan unit tenaga.
*   **Tingkat Integrasi (Integration Level):** `team.power_unit.integration_level` - Tingkat integrasi unit tenaga dengan sasis.

#### Model Pengembangan Tim:
*   **Filosofi (Philosophy):** `team.development_model.philosophy` - Filosofi desain tim (misalnya, `lightweight_agility`).
*   **Agresivitas Peningkatan (Upgrade Aggressiveness):** `team.development_model.upgrade_aggressiveness` - Seberapa agresif tim dalam melakukan peningkatan mobil.
*   **Tingkat Inovasi (Innovation Rate):** `team.development_model.innovation_rate` - Tingkat inovasi tim dalam pengembangan mobil.
*   **Adaptasi Regulasi (Regulation Adaptation):** `team.development_model.regulation_adaptation` - Kemampuan tim beradaptasi dengan perubahan regulasi.
*   **Toleransi Risiko (Risk Appetite):** `team.development_model.risk_appetite` - Tingkat toleransi risiko tim dalam pengembangan.

#### Profil Olahraga Tim:
*   **Bias Kecepatan Balapan (Race Pace Bias):** `team.sporting_profile.race_pace_bias` - Fokus tim pada kecepatan balapan.
*   **Bias Kualifikasi (Qualifying Bias):** `team.sporting_profile.qualifying_bias` - Fokus tim pada performa kualifikasi.
*   **Manajemen Ban (Tyre Management):** `team.sporting_profile.tyre_management` - Kemampuan tim dalam mengelola ban.

#### Meta Tim:
*   **Kekuatan Rekrutmen (Recruitment Strength):** `team.meta.recruitment_strength` - Kekuatan tim dalam merekrut pembalap/staf.
*   **Daya Tarik Pembalap (Driver Attractiveness):** `team.meta.driver_attractiveness` - Daya tarik tim bagi pembalap.
*   **Pengaruh Politik (Political Influence):** `team.meta.political_influence` - Pengaruh politik tim dalam olahraga.

### 1.3. Statistik Sasis (Mobil) (dari `data/chassis.json`)

Statistik ini menjelaskan karakteristik dan performa sasis mobil F1.

*   **Performa Keseluruhan (Overall Performance):** `chassis.overall_performance` - Performa keseluruhan sasis mobil.
*   **Filosofi Desain (Design Philosophy):** `chassis.design_philosophy` - Filosofi desain sasis (misalnya, `balanced_low_drag`).
*   **Konsep (Concept):** `chassis.concept` - Konsep desain sasis (misalnya, `stable_platform`).

#### Aerodinamika Sasis:
*   **Tikungan Kecepatan Rendah (Low Speed Cornering):** `chassis.aerodynamics.low_speed_cornering` - Performa sasis di tikungan kecepatan rendah.
*   **Tikungan Kecepatan Menengah (Medium Speed Cornering):** `chassis.aerodynamics.medium_speed_cornering` - Performa sasis di tikungan kecepatan menengah.
*   **Tikungan Kecepatan Tinggi (High Speed Cornering):** `chassis.aerodynamics.high_speed_cornering` - Performa sasis di tikungan kecepatan tinggi.
*   **Toleransi Udara Kotor (Dirty Air Tolerance):** `chassis.aerodynamics.dirty_air_tolerance` - Kemampuan sasis beroperasi di udara kotor.
*   **Efisiensi Aero (Aero Efficiency):** `chassis.aerodynamics.aero_efficiency` - Efisiensi aerodinamika sasis.
*   **Efisiensi DRS (DRS Efficiency):** `chassis.aerodynamics.drs_efficiency` - Efisiensi sistem DRS sasis.

#### Mekanikal Sasis:
*   **Traksi (Traction):** `chassis.mechanical.traction` - Tingkat traksi sasis.
*   **Melintasi Kerb (Kerb Riding):** `chassis.mechanical.kerb_riding` - Kemampuan sasis saat melintasi kerb.
*   **Stabilitas Berkendara (Ride Stability):** `chassis.mechanical.ride_stability` - Stabilitas berkendara sasis.
*   **Distribusi Berat (Weight Distribution):** `chassis.mechanical.weight_distribution` - Distribusi berat sasis.
*   **Kualitas Suspensi (Suspension Quality):** `chassis.mechanical.suspension_quality` - Kualitas suspensi sasis.

#### Performa Sasis:
*   **Kecepatan Puncak (Top Speed):** `chassis.performance.top_speed` - Kecepatan tertinggi yang bisa dicapai sasis.
*   **Akselerasi (Acceleration):** `chassis.performance.acceleration` - Tingkat akselerasi sasis.
*   **Konservasi Ban (Tyre Preservation):** `chassis.performance.tyre_preservation` - Kemampuan sasis menghemat ban.
*   **Efisiensi Bahan Bakar (Fuel Efficiency):** `chassis.performance.fuel_efficiency` - Efisiensi bahan bakar sasis.
*   **Integrasi ERS (ERS Integration):** `chassis.performance.ers_integration` - Tingkat integrasi sistem ERS sasis.

#### Keandalan Sasis:
*   **Efisiensi Pendinginan (Cooling Efficiency):** `chassis.reliability.cooling_efficiency` - Efisiensi sistem pendinginan sasis.
*   **Keausan Komponen (Component Wear):** `chassis.reliability.component_wear` - Tingkat keausan komponen sasis.
*   **Ketahanan Kegagalan (Failure Resistance):** `chassis.reliability.failure_resistance` - Ketahanan sasis terhadap kegagalan.

#### Pengembangan Sasis:
*   **Potensi Peningkatan (Upgrade Potential):** `chassis.development.upgrade_potential` - Potensi sasis untuk ditingkatkan.
*   **Jendela Pengaturan (Setup Window):** `chassis.development.setup_window` - Fleksibilitas pengaturan sasis.
*   **Adaptabilitas Regulasi (Regulation Adaptability):** `chassis.development.regulation_adaptability` - Kemampuan sasis beradaptasi dengan regulasi.

#### Perilaku Mobil Sasis:
*   **Gaya Mengemudi (Driving Style):** `chassis.car_behavior.driving_style` - Gaya mengemudi yang paling cocok dengan sasis (misalnya, `stable_fast`).
*   **Bias Kualifikasi (Qualifying Bias):** `chassis.car_behavior.qualifying_bias` - Bias sasis terhadap performa kualifikasi.
*   **Bias Kecepatan Balapan (Race Pace Bias):** `chassis.car_behavior.race_pace_bias` - Bias sasis terhadap kecepatan balapan.
*   **Performa Cuaca Basah (Wet Weather Performance):** `chassis.car_behavior.wet_weather_performance` - Performa sasis dalam kondisi cuaca basah.

---

## 2. Perhitungan Pra-Balapan

Perhitungan ini menentukan kondisi awal dan potensi bonus/penalti sebelum balapan dimulai.

### 2.1. Performa Kualifikasi

**Deskripsi:** Menghitung waktu putaran kualifikasi berdasarkan performa mobil, keterampilan pembalap, dan kondisi lintasan.
**Function/File:** `calculateQualifyingTime` di `src/calculations/preRaceCalculations.js` (contoh)
```javascript
function calculateQualifyingTime(car, driver, track, randomFactor) {
    const baseCarPerformance = (car.aerodynamics.aero_efficiency + car.performance.top_speed + car.mechanical.ride_stability) / 3; // Contoh
    const trackDifficulty = track.difficulty; // Asumsi ada stat track.difficulty
    
    return baseCarPerformance - (driver.skill * 0.1) - (driver.focus * 0.05) + (trackDifficulty * 0.02) + randomFactor.small;
}
```

### 2.2. Perhitungan Penalti Grid

**Deskripsi:** Menghitung total penalti posisi di grid start.
**Function/File:** `calculateGridPenalty` di `src/calculations/preRaceCalculations.js` (contoh)
```javascript
function calculateGridPenalty(engineComponentChanges, gearboxChanges, otherInfringements) {
    return (engineComponentChanges * 5) + (gearboxChanges * 5) + otherInfringements;
}
```

### 2.3. Keausan Ban Awal

**Deskripsi:** Menentukan kondisi awal keausan ban setelah dipasang.
**Function/File:** `calculateInitialTireWear` di `src/calculations/preRaceCalculations.js` (contoh)
```javascript
function calculateInitialTireWear(teamMechanicSkill, chassis) {
    return (teamMechanicSkill * 0.01) + (chassis.mechanical.suspension_quality * 0.005);
}
```

---

## 3. Perhitungan Selama Balapan

Ini adalah perhitungan dinamis yang memengaruhi performa, strategi, dan insiden selama balapan.

### 3.1. Perhitungan Waktu Putaran

**Deskripsi:** Menghitung waktu yang dibutuhkan untuk menyelesaikan satu putaran.
**Function/File:** `calculateLapTime` di `src/calculations/raceCalculations.js` (contoh)
```javascript
function calculateLapTime(baseTrackTime, car, driver, currentTireWear, trackConditionsModifier, fuelLoadPenalty, randomFactor) {
    return baseTrackTime 
           - (car.aerodynamics.aero_efficiency * 0.08) 
           - (car.performance.top_speed * 0.07) 
           - (car.mechanical.ride_stability * 0.05) 
           - (driver.skill * 0.1) 
           - (driver.focus * 0.03) 
           + (currentTireWear * 0.02) 
           + trackConditionsModifier 
           + fuelLoadPenalty 
           + randomFactor.medium;
}
```

### 3.2. Probabilitas Keberhasilan Menyalip

**Deskripsi:** Menentukan peluang keberhasilan manuver menyalip.
**Function/File:** `calculateOvertakeSuccessChance` di `src/calculations/raceCalculations.js` (contoh)
```javascript
function calculateOvertakeSuccessChance(attackerDriver, attackerCar, defenderDriver, defenderCar, gapToCarAhead, drsAdvantage, randomFactor) {
    return (attackerDriver.aggression * 0.1) 
           + (attackerCar.performance.acceleration * 0.05) // Asumsi chassis.performance.acceleration
           - (defenderDriver.aggression * 0.05) 
           - (defenderCar.aerodynamics.aero_efficiency * 0.03) 
           - (gapToCarAhead * 0.1) 
           + drsAdvantage 
           + randomFactor.large;
}
```

### 3.3. Degradasi Ban

**Deskripsi:** Menghitung tingkat degradasi ban per putaran.
**Function/File:** `calculateTireDegradation` di `src/calculations/raceCalculations.js` (contoh)
```javascript
function calculateTireDegradation(baseDegradation, driverAggressionSetting, car, trackSurfaceRoughness, driverAdaptability, randomFactor) {
    return baseDegradation 
           + (driverAggressionSetting * 0.05) 
           - (car.mechanical.suspension_quality * 0.02) 
           + (trackSurfaceRoughness * 0.03) // Asumsi ada stat track.surface_roughness
           + (driverAdaptability * 0.01) 
           + randomFactor.small;
}
```

### 3.4. Konsumsi Bahan Bakar

**Deskripsi:** Menghitung jumlah bahan bakar yang dikonsumsi per putaran.
**Function/File:** `calculateFuelConsumption` di `src/calculations/raceCalculations.js` (contoh)
```javascript
function calculateFuelConsumption(baseConsumption, engineModeSetting, carPowerUnitPerformance, driverAggressionSetting) {
    // Menggunakan chassis.performance.fuel_efficiency dan team.power_unit.performance
    return baseConsumption 
           + (engineModeSetting * 0.05) 
           - (carPowerUnitPerformance * 0.01) // chassis.performance.fuel_efficiency atau team.power_unit.performance
           + (driverAggressionSetting * 0.02);
}
```

### 3.5. Insiden/Kegagalan

**Deskripsi:** Menentukan probabilitas terjadinya insiden atau kegagalan mekanis.
**Function/File:** `calculateIncidentProbability` di `src/calculations/raceCalculations.js` (contoh)
```javascript
function calculateIncidentProbability(baseIncidentRate, driverFocus, driverAggression, carDurability, carReliability, randomFactor) {
    return baseIncidentRate 
           - (driverFocus * 0.02) 
           + (driverAggression * 0.03) 
           + (carDurability * 0.01) // chassis.reliability.failure_resistance
           - (carReliability * 0.04) // team.power_unit.reliability atau chassis.reliability.failure_resistance
           + randomFactor.v_large;
}
```

### 3.6. Waktu Pit Stop

**Deskripsi:** Menghitung total waktu yang dihabiskan untuk pit stop.
**Function/File:** `calculatePitStopTime` di `src/calculations/raceCalculations.js` (contoh)
```javascript
function calculatePitStopTime(basePitTime, teamPitCrewSkill, pitStopIssueProbability, randomFactor) {
    // Asumsi team.infrastructure.staff_quality bisa digunakan sebagai teamPitCrewSkill
    return basePitTime 
           - (teamPitCrewSkill * 0.1) 
           + (pitStopIssueProbability * 5) 
           + randomFactor.small;
}
```

---

## 4. Perhitungan Pasca-Balapan

Perhitungan ini terjadi setelah balapan, menentukan hasil seperti poin kejuaraan, perolehan sumber daya, dan pengembangan statistik.

### 4.1. Poin Kejuaraan

**Deskripsi:** Mengalokasikan poin kejuaraan berdasarkan posisi finis.
**Function/File:** `assignChampionshipPoints` di `src/calculations/postRaceCalculations.js` (contoh)
```javascript
// Implementasi akan tergantung pada struktur data hasil balapan dan tabel poin F1 standar.
// Contoh: Fungsi ini akan mengambil posisi finis dan mengembalikan poin yang sesuai.
function assignChampionshipPoints(finishPosition) {
    const pointsTable = { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 };
    return pointsTable[finishPosition] || 0;
}
```

### 4.2. Perolehan Pengalaman Pembalap

**Deskripsi:** Menghitung poin pengalaman yang diperoleh pembalap.
**Function/File:** `calculateDriverExperienceGain` di `src/calculations/postRaceCalculations.js` (contoh)
```javascript
function calculateDriverExperienceGain(baseRaceEXP, racePositionBonus, overtakesMade, incidentsCaused) {
    return baseRaceEXP 
           + (racePositionBonus * 0.5) 
           + (overtakesMade * 0.1) 
           - (incidentsCaused * 0.2);
}
```

### 4.3. Pengembangan Statistik Pembalap

**Deskripsi:** Menentukan peluang pertumbuhan statistik pembalap.
**Function/File:** `calculateDriverStatGrowth` di `src/calculations/postRaceCalculations.js` (contoh)
```javascript
function calculateDriverStatGrowth(baseGrowthRate, driverAgeFactor, driverCurrentStatLevel, coachInfluence, randomFactor) {
    return baseGrowthRate 
           + driverAgeFactor 
           - (driverCurrentStatLevel * 0.01) 
           + coachInfluence 
           + randomFactor.small;
}
```

### 4.4. Moral Tim/Perolehan Sumber Daya

**Deskripsi:** Menghitung perubahan moral tim dan perolehan sumber daya.
**Function/File:** `calculateTeamMoraleAndResources` di `src/calculations/postRaceCalculations.js` (contoh)
```javascript
function calculateTeamMoraleChange(racePositionBonus, carDamageCost, sponsorObjectivesMet) {
    return (racePositionBonus * 0.3) 
           - (carDamageCost * 0.1) 
           + (sponsorObjectivesMet * 0.2);
}

function calculateResourceGain(baseIncome, prizeMoney, sponsorBonuses, carRepairCosts) {
    return baseIncome + prizeMoney + sponsorBonuses - carRepairCosts;
}
```

---

## 5. Faktor Acak

Keacakan sangat penting untuk mensimulasikan sifat F1 yang tidak dapat diprediksi. Tingkat keacakan yang berbeda diterapkan berdasarkan dampak peristiwa tersebut.

*   `randomFactor.small`: Fluktuasi minor (misalnya, degradasi ban, variasi kecil dalam waktu putaran). Biasanya nilai antara -0.05 dan +0.05.
*   `randomFactor.medium`: Fluktuasi moderat (misalnya, variabilitas waktu putaran, hasil menyalip minor). Biasanya nilai antara -0.1 dan +0.1.
*   `randomFactor.large`: Fluktuasi signifikan (misalnya, keberhasilan menyalip kunci, peluang insiden minor). Biasanya nilai antara -0.5 dan +0.5.
*   `randomFactor.v_large`: Fluktuasi yang sangat besar dan berdampak (misalnya, insiden besar, peluang pengerahan safety car). Biasanya hasil biner atau nilai antara -1.0 dan +1.0.

**Catatan Implementasi:** Faktor acak umumnya harus dihasilkan dalam rentang yang ditentukan (misalnya, menggunakan distribusi Gaussian untuk varians alami atau distribusi seragam untuk peluang peristiwa yang berbeda). Fungsi untuk menghasilkan faktor acak ini mungkin berada di `src/utils/random.js` atau serupa.

---

Dokumen ini memberikan gambaran umum yang komprehensif tentang logika perhitungan. Nilai dan koefisien spesifik adalah contoh dan harus disesuaikan dengan cermat selama pengembangan game untuk gameplay yang seimbang.