# F1 Manager - Dokumentasi Arsitektur Simulasi & Perhitungan

Dokumen ini menguraikan arsitektur simulasi, hubungan antar sistem, serta berbagai metodologi perhitungan yang digunakan dalam proyek F1 Manager untuk berbagai fase (pra-balapan, selama balapan, dan pasca-balapan), modifikasi statistik umum, dan pengaruh acak, serta sistem manajerial lainnya.

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
*   **Preferensi Setup (Setup Preferences):** `driver.setup_preferences` - Preferensi pembalap untuk setup mobil (Front Wing, Rear Wing, Brake Bias, Suspension).
*   **Traits (Sifat):** `driver.traits` - Karakteristik perilaku unik pembalap (misalnya, "tyre_whisperer", "rain_master", "aggressive_defender").

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
*   **Adaptasi Regulasi (Regulation Adaptability):** `team.development_model.regulation_adaptation` - Kemampuan tim beradaptasi dengan perubahan regulasi.
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

### 3.1. Model Trek Dinamis, Setup Mobil & Pengaruh Cuaca

**Deskripsi:** Performa mobil dan pembalap sangat dipengaruhi oleh karakteristik trek, kesesuaian setup mobil dengan preferensi pembalap dan kebutuhan sirkuit, serta kondisi cuaca. Sistem ini menggabungkan `track_characteristics` dari `schedules.json`, `sector_weights` untuk detail mikro-sektor, `driver.setup_preferences` dari `drivers.json`, dan kondisi cuaca dinamis (`this.weather`, `this.sim.weatherGrip`, `this.sim.trackEvolution`) untuk menghasilkan `currentPaceIndex` yang lebih akurat.

**Variabel Utama:**
*   `currentPoint.sector`: Sektor trek saat ini (1, 2, atau 3).
*   `trackCharacteristics`: Objek yang berisi karakteristik detail sirkuit (misal: `top_speed_importance`, `traction_importance`, `low_speed_cornering`, `tyre_degradation`, `fuel_consumption`, `wet_weather_variability`, dll.).
*   `sectorWeights`: Menentukan karakteristik utama yang paling relevan untuk performa di setiap sektor (misal: `top_speed`, `traction`, `braking`, `high_speed_cornering`).
*   `driverSetupPreferences`: Preferensi setup pembalap (`front_wing`, `rear_wing`, `brake_bias`, `suspension`).
*   `chassis.game_stats.setup`: Setup ideal sirkuit (misal: `downforce`, `top_speed`, `traction`, `kerb_riding`).
*   `this.sim.weatherGrip`: Multiplier grip berdasarkan kondisi cuaca.
*   `this.sim.trackEvolution`: Multiplier performa trek berdasarkan evolusi lintasan.

**Alur Perhitungan `currentPaceIndex` (di `gameLoop`):**

1.  **Ekstraksi Data:** Ambil `trackCharacteristics`, `sectorWeights`, `driverSetupPreferences` dari objek `currentCircuit` dan `racer.driver`.
2.  **Identifikasi Kebutuhan Sektor (`primarySectorWeight`):** Berdasarkan `currentPoint.sector` dan `sectorWeights`, tentukan karakteristik performa apa yang paling dibutuhkan pada mikro-sektor tersebut (misal: "top_speed", "traction").
3.  **Hitung `carMatchValue`:** Rata-rata statistik sasis/PU yang relevan dengan `primarySectorWeight` (misal: untuk "top_speed", ambil `perf.top_speed`, `puStats.internal_combustion.horsepower`, dll.).
4.  **Hitung `trackNeedValue`:** Rata-rata karakteristik trek dari `trackCharacteristics` yang relevan dengan `primarySectorWeight`.
5.  **Hitung `setupMatchFactor`:** Bandingkan `driverSetupPreferences` dengan nilai setup ideal dari `currentCircuit.game_stats.setup`. Selisih kecil antara preferensi pembalap dan setup ideal sirkuit menghasilkan `setupMatchFactor` yang lebih tinggi. `setupMatchFactor` diklem antara 0.8 (setup buruk) dan 1.1 (setup optimal).
6.  **Inisialisasi `paceFactor`:** Mulai dengan `racer.paceStat` dasar.
7.  **Aplikasi `setupCompatibility`:** `paceFactor` disesuaikan berdasarkan `setupMatchFactor`. Setup yang pas memberikan bonus, yang buruk memberikan penalti.
8.  **Penalti Ketidaksesuaian Trek-Mobil:** Hitung `trackCarMatchDifference` antara `trackNeedValue` dan `carMatchValue`. Perbedaan besar akan mengurangi `paceFactor`.
9.  **Bonus Karakteristik Trek Langsung (`characteristicSpeedBoost`):** Tambahkan bonus ke `paceFactor` berdasarkan seberapa baik kombinasi sasis-pembalap memanfaatkan karakteristik penting trek (misal: `trackCharacteristics.top_speed_importance` dikali `perf.top_speed`).
10. **Final `currentPaceIndex`:** Gabungkan `paceFactor` yang sudah dimodifikasi dengan `driverSkill`, `raceCraft`, `tyreManagement`, `ersQuality`, `carPace`, `chassis.car_behavior` (qualifying/race bias), `staffBoost`, `reliabilityScore`, dan faktor acak.

**Fungsi/File:** `gameLoop` di `js/engine.js`

### 3.2. Perhitungan Waktu Putaran

**Deskripsi:** Menghitung waktu yang dibutuhkan untuk menyelesaikan satu putaran, kini didasarkan pada `currentPaceIndex` yang lebih kompleks serta faktor cuaca (`this.sim.weatherGrip`) dan evolusi lintasan (`this.sim.trackEvolution`).
**Fungsi/File:** `gameLoop` di `js/engine.js`
```javascript
// Di dalam gameLoop, baseSpeed dihitung sebagai berikut:
let baseSpeed = currentPoint.speed * this.sim.weatherGrip * this.sim.trackEvolution;
baseSpeed *= this.clamp(0.78 + currentPaceIndex / 410, 0.86, 1.18);
```
*Catatan:* `currentPoint.speed` merepresentasikan target kecepatan ideal untuk titik trek tersebut.

### 3.3. Probabilitas Keberhasilan Menyalip

**Deskripsi:** Menentukan peluang keberhasilan manuver menyalip.
**Fungsi/File:** `calculateOvertakeSuccessChance` di `src/calculations/raceCalculations.js` (contoh)
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

### 3.4. Degradasi Ban

**Deskripsi:** Menghitung tingkat degradasi ban per putaran, kini menggunakan `trackCharacteristics.tyre_degradation` dari data sirkuit dinamis.
**Fungsi/File:** `gameLoop` di `js/engine.js`
```javascript
// Di dalam gameLoop, tireConsumptionRate dihitung sebagai berikut:
let tireConsumptionRate = 0.0055 * (1 + ((trackCharacteristics.tyre_degradation || 70) - 60) / 95);
tireConsumptionRate *= 1 - this.clamp((racer.tyreManagement - 72) / 240, -0.08, 0.12);
```

### 3.5. Konsumsi Bahan Bakar

**Deskripsi:** Menghitung jumlah bahan bakar yang dikonsumsi per putaran, kini menggunakan `trackCharacteristics.fuel_consumption` dari data sirkuit dinamis.
**Fungsi/File:** `gameLoop` di `js/engine.js`
```javascript
// Di dalam gameLoop, fuelConsumptionRate dihitung sebagai berikut:
let fuelConsumptionRate = 0.0042 * (1 + ((trackCharacteristics.fuel_consumption || 65) - 60) / 100);
fuelConsumptionRate *= 1 - this.clamp((racer.fuelEfficiency - 72) / 260, -0.07, 0.12);
```

### 3.6. Insiden/Kegagalan

**Deskripsi:** Menentukan probabilitas terjadinya insiden atau kegagalan mekanis. `reliabilityRisk` kini dipengaruhi oleh `trackCharacteristics.engine_stress` dan `trackCharacteristics.braking_importance`.
**Fungsi/File:** `gameLoop` di `js/engine.js`
```javascript
// Di dalam gameLoop, reliabilityRisk dihitung sebagai berikut:
const reliabilityRisk = (100 - racer.reliabilityScore + (trackCharacteristics.engine_stress || 60) * 0.28 + (trackCharacteristics.braking_importance || 60) * 0.22) / 280000;
```

### 3.7. Waktu Pit Stop

**Deskripsi:** Menghitung total waktu yang dihabiskan untuk pit stop.
**Fungsi/File:** `calculatePitStopTime` di `src/calculations/raceCalculations.js` (contoh)
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

## 5. Model Ban Lanjutan

**Deskripsi:** Model ban yang lebih realistis, tidak hanya `wear %`. Memisahkan aspek-aspek kunci yang memengaruhi performa ban.

```js
tyre = {
  compound,
  wear,
  temperature,
  pressure,
  overheating,
  grip,
  cliffPoint,
};
```

**Pengaruh:**
*   **Nonlinearitas:** Performa ban tidak linear; penurunan grip drastis setelah `cliffPoint` tertentu.
*   **Overheating:** `dirty_air` dapat menyebabkan ban `overheating`, yang mengurangi grip sementara.
*   **Strategi:** Memungkinkan strategi ban yang lebih dalam dan bervariasi.

---

## 6. Sistem ERS

**Deskripsi:** Sistem pemulihan energi (ERS) adalah aspek krusial F1 modern. Simulasi harus mencakup mode deployment dan manajemen energi.

```js
ers = {
  deploymentMode, // Mode penggunaan (Harvest, Assist, Overtake, Defend)
  batteryCharge,  // Persentase daya baterai ERS
  harvestRate,    // Tingkat pemulihan energi
  overtakeMode,   // Mode khusus untuk menyalip
};
```

**Pengaruh:**
*   **Menyalip & Bertahan:** ERS memberikan dorongan daya sementara untuk manuver.
*   **Kualifikasi:** Penggunaan ERS yang optimal sangat penting untuk lap kualifikasi.
*   **Efisiensi Bahan Bakar:** Manajemen ERS yang baik dapat menghemat bahan bakar.

---

## 7. Sistem Karakteristik Pembalap

**Deskripsi:** Selain statistik numerik, pembalap memiliki `traits` (sifat) unik yang memengaruhi performa mereka dalam kondisi spesifik. Ini memberikan kedalaman dan identitas pada setiap pembalap.

```js
traits: [
  "late_braker",          // Ahli pengereman telat
  "tyre_whisperer",       // Pandai menjaga ban
  "rain_master",          // Unggul dalam kondisi hujan
  "aggressive_defender",  // Agresif dalam bertahan
  "inconsistent",         // Performa tidak konsisten
  "qualifying_specialist" // Spesialis kualifikasi
];
```

**Pengaruh:**
*   **Variasi Performa:** Membuat setiap pembalap terasa unik, bukan hanya kumpulan angka.
*   **Emergent Gameplay:** `traits` dapat memicu event atau bonus/penalti situasional.

---

## 8. Engine AI & Strategi Balapan

**Deskripsi:** Sistem AI yang komprehensif untuk membuat keputusan strategis dan adaptif selama balapan.

**AI Decision Layer:**
*   **Strategi Pit:** `undercut`, `overcut`, `safety car pit`.
*   **Manajemen Sumber Daya:** `fuel save`, manajemen `tyre` dan `ERS`.
*   **Mode Balapan:** `push mode`, `defend mode`.
*   **Team Order:** Keputusan tim untuk memprioritaskan pembalap.

**Contoh Struktur `strategyState`:**
```js
strategyState = {
  aggression,    // Tingkat agresivitas balapan
  pitWindow,     // Jendela pit stop optimal
  tyreTarget,    // Target keausan ban
  fuelTarget,    // Target level bahan bakar
  riskTolerance, // Toleransi risiko dalam keputusan
};
```

---

## 9. Sistem Safety Car / VSC / Red Flag

**Deskripsi:** Implementasi penuh insiden balap yang memicu Safety Car (SC), Virtual Safety Car (VSC), atau Red Flag.

**Pengaruh:**
*   **Generator Kekacauan:** Mengubah dinamika dan hasil balapan secara drastis.
*   **Penyama Strategi:** Memberikan peluang strategis tak terduga (misal: pit stop murah di bawah SC).
*   **Realisme:** Menambah lapisan realisme pada simulasi.

```js
incidentSeverity -> {
   yellow,    // Bendera kuning lokal
   vsc,       // Virtual Safety Car
   safetyCar, // Safety Car
   redFlag    // Bendera Merah (balapan dihentikan)
}
```

---

## 10. Simulasi Gap yang Realistis

**Deskripsi:** Simulasi jarak antar mobil yang lebih dinamis dan realistis, mempertimbangkan faktor-faktor kompleks di trek.

**Faktor-faktor yang Diperlukan:**
*   **Dirty Air:** Pengaruh kehilangan downforce saat mengikuti mobil lain.
*   **DRS Train:** Efek domino penggunaan DRS oleh beberapa mobil berurutan.
*   **Traffic:** Dampak keberadaan mobil lain pada kecepatan lap.
*   **Turbulent Wake:** Udara kotor di belakang mobil.

---

## 11. Engine Sesi Kualifikasi

**Deskripsi:** Simulasi sesi kualifikasi yang mendalam dengan format Q1/Q2/Q3, mempertimbangkan taktik dan kondisi trek.

**Fitur Kualifikasi:**
*   **Q1/Q2/Q3:** Struktur sesi yang berbeda dengan eliminasi.
*   **Traffic:** Pengaruh mobil lain di lintasan.
*   **Cooldown:** Strategi untuk mendinginkan ban dan mobil antar lap cepat.
*   **Track Evolution:** Peningkatan grip seiring berjalannya sesi.
*   **Tow/Slipstream:** Manfaat mengikuti mobil lain.
*   **Red Flag:** Insiden yang menghentikan sesi.

---

## 12. Sistem Pengembangan

**Deskripsi:** Sistem inti untuk pengembangan komponen mobil, esensial dalam game manajer F1.

**Elemen Kunci:**
*   **Alokasi ATR:** Alokasi waktu pengujian aerodinamika (Aero Test Restriction).
*   **Jam CFD & Terowongan Angin:** Sumber daya vital untuk desain aerodinamika.
*   **Desain Komponen:** Proses merancang dan memproduksi bagian mobil baru.
*   **Risiko & Reward:** Keseimbangan antara potensi keuntungan performa dan risiko keandalan/biaya.

**Contoh `partDevelopment`:**
```js
partDevelopment = {
  expectedGain,         // Peningkatan performa yang diharapkan
  reliabilityRisk,      // Risiko keandalan komponen baru
  innovationRisk,       // Risiko kegagalan inovasi
  manufacturingTime,    // Waktu yang dibutuhkan untuk produksi
};
```

---

## 13. Sistem Keandalan Lanjutan

**Deskripsi:** Model keandalan yang lebih detail, melampaui sekadar `wear %` tunggal.

**Faktor-faktor Keandalan:**
*   **Engine Mileage:** Jarak tempuh mesin.
*   **Gearbox Mileage:** Jarak tempuh gearbox.
*   **Heat Cycles:** Jumlah siklus pemanasan/pendinginan komponen.
*   **Cumulative Wear:** Keausan kumulatif komponen individual.

**Contoh:**
```js
componentWear += engineStress * ambientTemperature * pushMode;
```

---

## 14. Sistem Human Error

**Deskripsi:** Memasukkan elemen kesalahan manusia untuk menambah dinamika tak terduga dan emergent storytelling.

**Contoh Kesalahan:**
*   `lockup`: Pembalap mengunci roda saat pengereman.
*   `snap_oversteer`: Kehilangan kendali belakang mendadak.
*   `pit_entry_error`: Kesalahan saat masuk jalur pit.
*   `unsafe_release`: Pelepasan mobil yang tidak aman dari pit.
*   `missed_apex`: Kesalahan menabrak apex tikungan.

---

## 15. Operasi Tim

**Deskripsi:** Pengembangan aspek operasional tim, khususnya kinerja pit crew.

**Aspek Pit Crew:**
*   **Training:** Peningkatan skill pit crew melalui pelatihan.
*   **Fatigue:** Kelelahan pit crew yang memengaruhi performa.
*   **Consistency:** Konsistensi pit stop.
*   **Mistake Chance:** Probabilitas kesalahan pit stop.

---

## 16. Arsitektur Simulasi (Simulation Layering)

**Deskripsi:** Pentingnya merancang simulasi dengan struktur berlapis yang jelas untuk mengelola interaksi antar sistem. Ini adalah fondasi engineering untuk game yang kompleks.

**Pipeline Ideal:**
```text
TRACK
 -> WEATHER
   -> CAR
     -> DRIVER
       -> TYRE
         -> STRATEGY
           -> INCIDENTS
             -> LAP TIME
```
**Manfaat:**
*   **Balancing:** Mempermudah penyesuaian dan keseimbangan game.
*   **Modularitas:** Mengurangi tumpang tindih modifier dan memastikan hasil konsisten.

---

## 17. Standardisasi Skala Formula

**Deskripsi:** Menetapkan skala yang konsisten untuk semua formula dan statistik untuk memastikan balancing yang terprediksi.

**Contoh Standar:**
```text
1 stat point = X milliseconds
```

**Tabel Konversi Contoh:**

| Area         | 1 Point |
| ------------ | ------- |
| Aero         | 0.012s  |
| Driver Skill | 0.008s  |
| Setup        | 0.004s  |
| Tyre Temp    | 0.020s  |

**Manfaat:**
*   **Konsistensi:** Mencegah inflasi statistik yang kacau.
*   **Tuning:** Memungkinkan penyesuaian yang lebih akurat.

---

## 18. Target Meta Balancing

**Deskripsi:** Mendefinisikan Key Performance Indicators (KPI) dan target performa untuk memastikan simulasi menghasilkan balapan yang menarik dan realistis.

**Contoh Metrik Target:**

| Metric             | Target   |
| ------------------ | -------- |
| Average gap P1-P20 | 1.8s     |
| Overtakes per race | 25-45    |
| SC probability     | 30%      |
| DNFs per race      | 1-3      |
| Tyre cliff impact  | 0.8s/lap |

**Manfaat:**
*   **Tuning Terarah:** Memandu proses balancing.
*   **Kualitas Gameplay:** Memastikan balapan sesuai ekspektasi.

---

## 19. Loop Gameplay yang Hilang

**Deskripsi:** Selain simulasi balapan, game manajer F1 memerlukan loop gameplay yang lebih luas untuk manajemen tim di luar trek.

**Alur Gameplay Manajer:**
```text
Race
-> Income
-> R&D
-> Staff
-> Facilities
-> Driver market
-> Politics
-> Next race
```

---

## 20. Alat Telemetri / Debug

**Deskripsi:** Alat internal yang penting untuk pengembangan dan balancing game, memungkinkan visualisasi data simulasi secara real-time.

**Contoh Fitur:**
*   `lap delta breakdown`: Analisis perbedaan waktu per lap.
*   `tyre graph`: Grafik keausan dan suhu ban.
*   `fuel graph`: Grafik konsumsi bahan bakar.
*   `balance heatmap`: Visualisasi keseimbangan mobil.

---

## 21. Filosofi Simulasi

**Deskripsi:** Keputusan fundamental antara `realism-first` atau `fun-first` yang akan memandu semua keputusan desain dan balancing simulasi.

**Pilihan Filosofi:**

| Philosophy          | Result                                     |
| ------------------- | ------------------------------------------ |
| Hardcore Sim        | Balapan lebih realistis, sedikit overtake  |
| Netflix F1          | Lebih banyak drama, aksi, dan overtake     |
| Motorsport Manager  | Chaos yang disederhanakan, fokus pada manajerial |
| F1 Manager Frontier | Semi-realistis, keseimbangan antara sim dan aksesibilitas |

**Pengaruh:** Memastikan konsistensi sistem dan menghindari kontradiksi desain.

---

Dokumen ini memberikan gambaran umum yang komprehensif tentang logika perhitungan. Nilai dan koefisien spesifik adalah contoh dan harus disesuaikan dengan cermat selama pengembangan game untuk gameplay yang seimbang.
