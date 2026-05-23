# F1 Manager 2026 - Create My Team Plan (Development Ready for JavaScript)

Dokumen ini menguraikan alur lengkap fitur "Create My Team" di game F1 Manager 2026, dengan fokus pada bagaimana pilihan pemain memengaruhi statistik awal tim dan detail implementasi yang siap untuk pengembangan JavaScript (mengasumsikan struktur JSON yang telah dinormalisasi).

---

## I. Langkah Awal: Identitas Tim (Pilihan Kosmetik & Filosofi)

Tahap ini adalah tentang mendefinisikan identitas visual dan strategis dasar tim pemain.

**Konsep:** Pemain memilih nama, warna, lokasi, dan filosofi desain awal.

**Alur Implementasi (Frontend/Backend):**

1.  **Detail Tim Dasar (Data Input):**
    *   **Nama Tim:**
        *   **Frontend:** `text_input` (e.g., `document.getElementById('teamNameInput').value`).
        *   **Validasi (JS):** Minimal 3 karakter, maksimal 30, hanya huruf/angka/spasi. Akan diubah menjadi `snake_case` untuk `id` di backend.
        *   **JSON Fields:** `teams.id` (generated), `teams.name`, `teams.full_name`.
    *   **Warna Primer & Sekunder:**
        *   **Frontend:** `color_picker` atau palet warna prasetel (e.g., `document.getElementById('primaryColor').value`).
        *   **Validasi (JS):** Harus format `#HexCode` (e.g., `#RRGGBB`).
        *   **JSON Fields:** `teams.color`.
    *   **Emblem/Logo:**
        *   **Frontend:** `image_selector` dari aset yang tersedia (e.g., `document.getElementById('logoSelector').value`).
        *   **JSON Fields:** Tidak langsung disimpan dalam `teams.json`, melainkan referensi ke aset gambar.
    *   **Lokasi Markas (Base Location):**
        *   **Frontend:** `dropdown` untuk negara, diikuti `dropdown`/`text_input` untuk kota. (e.g., `document.getElementById('baseCountry').value`).
        *   **Validasi (JS):** Harus dari daftar negara/kota yang diizinkan.
        *   **JSON Fields:** `teams.base.country`, `teams.base.city`.
        *   **Implikasi:** Lokasi mungkin memengaruhi `operational_cost` awal atau `recruitment_strength` lokal di masa mendatang (perlu ditambahkan sebagai logika game).

2.  **Filosofi Desain & Target Awal (Memengaruhi `chassis.json` & `teams.json`):**
    *   **Pilihan Filosofi Chassis:**
        *   **Frontend:** `radio_buttons` atau `cards` dengan deskripsi filosofi (e.g., "low\_drag\_efficiency", "high\_rotation").
        *   **JSON Fields (Initial):** `chassis.design_philosophy`, `chassis.concept`.
        *   **Logika (JS/Backend):** Pilihan ini menjadi `base_modifier` saat meng-generate `chassis.stats`.
            ```javascript
            // Contoh base stats untuk chassis berdasarkan filosofi
            const chassisPhilosophies = {
                "low_drag_efficiency": {
                    base_aero_efficiency: 75,
                    base_top_speed: 80,
                    base_downforce: 50
                },
                "high_rotation": {
                    base_aero_efficiency: 60,
                    base_top_speed: 65,
                    base_downforce: 80
                },
                // ... filosofi lainnya
            };
            ```
    *   **Tingkat Ambisi / Target Musim (Team Tier):**
        *   **Frontend:** `radio_buttons` atau `cards` dengan deskripsi tingkatan. Menampilkan `budget_awal` dan `cash_reserve` terkait.
        *   **JSON Fields (Initial):** `teams.status.tier`, `teams.status.stability_rating`, `teams.economy.initial_budget`, `teams.economy.cash_reserve`, `teams.infrastructure.*_level`, `teams.meta.recruitment_strength`, `teams.meta.driver_attractiveness`.
        *   **Logika (JS/Backend):** Setiap pilihan akan menetapkan rentang atau nilai spesifik untuk stats awal tim dan budget.
            ```javascript
            const ambitionLevels = {
                "new_entry": { // New Entry
                    tier: "new_entry",
                    stability_rating: 65,
                    initial_budget: 100_000_000, // Contoh budget awal total (sebelum pembelian)
                    cash_reserve: 20_000_000, // Ini sisa budget setelah alokasi item wajib
                    factory_level: 2,
                    wind_tunnel_level: 2,
                    cfd_capacity: 60,
                    simulator_level: 60,
                    staff_quality: 65,
                    recruitment_strength: 60,
                    driver_attractiveness: 55
                },
                "midfield": { // Midfield Aspirant
                    tier: "midfield",
                    stability_rating: 75,
                    initial_budget: 150_000_000,
                    cash_reserve: 35_000_000,
                    factory_level: 3,
                    wind_tunnel_level: 3,
                    cfd_capacity: 75,
                    simulator_level: 70,
                    staff_quality: 75,
                    recruitment_strength: 70,
                    driver_attractiveness: 65
                },
                "top_tier": { // Rich Team (contoh)
                    tier: "top_tier",
                    stability_rating: 90,
                    initial_budget: 250_000_000,
                    cash_reserve: 60_000_000,
                    factory_level: 4,
                    wind_tunnel_level: 4,
                    cfd_capacity: 90,
                    simulator_level: 85,
                    staff_quality: 90,
                    recruitment_strength: 85,
                    driver_attractiveness: 80
                },
                // ... tingkatan lainnya
            };
            ```

3.  **Pemilihan Budget Awal Tim (NEW SECTION):**
    *   **Konsep:** Pemain memilih tier tim yang secara langsung menentukan `initial_budget` dan `cash_reserve` awal. Budget ini akan digunakan untuk merekrut driver, power unit, dan chassis.
    *   **Frontend:** `radio_buttons` atau `cards` yang menampilkan nama tier (misal: "Tim Perintis"), `initial_budget` total, dan `cash_reserve` setelah alokasi wajib.
    *   **Validasi (JS):** Pastikan satu tier dipilih.

4.  **Sponsor Awal (NEW SECTION):**
    *   **Konsep:** Tim memulai dengan sponsor default/pilihan yang memberikan pendapatan awal.
    *   **Frontend:** `dropdown` atau `cards` menampilkan sponsor yang tersedia, `estimated_annual_value_idr`, dan `ai_effects`.
    *   **Data Source (JS):** Ambil dari `sponsors.json` (perlu dibuat jika belum ada) atau data internal.
    *   **JSON Fields:** `teams.sponsors` (array of sponsor IDs), `teams.economy.sponsor_income`.
    *   **Logika (JS/Backend):**
        ```javascript
        // Data sponsor akan dimuat dari sponsors.json dan difilter berdasarkan tier.
        // Contoh struktur setelah pemuatan dan filter:
        const availableSponsorsByTier = {
            "new_entry": [ // Sponsor dengan tier C atau B
                { id: "sponsor_c_cadillac", estimated_annual_value_idr: 450_000_000_000, ai_effects: { brand_build_mode: true } },
                { id: "sponsor_b_bwt", estimated_annual_value_idr: 760_000_000_000, ai_effects: { short_term_performance_boost: 12 } },
            ],
            "midfield": [ // Sponsor dengan tier B atau A
                { id: "sponsor_b_bwt", estimated_annual_value_idr: 760_000_000_000, ai_effects: { short_term_performance_boost: 12 } },
                { id: "sponsor_a_atlassian", estimated_annual_value_idr: 890_000_000_000, ai_effects: { infrastructure_growth: 20 } },
            ],
            "top_tier": [ // Sponsor dengan tier A atau S
                { id: "sponsor_a_atlassian", estimated_annual_value_idr: 890_000_000_000, ai_effects: { infrastructure_growth: 20 } },
                { id: "sponsor_s_oracle", estimated_annual_value_idr: 1_748_000_000_000, ai_effects: { development_speed_boost: 15 } },
            ],
        };

        // Fungsi untuk mengalokasikan sponsor awal berdasarkan tier
        function assignInitialSponsors(allSponsors, teamTier) {
            // Logika untuk memilih 1-2 sponsor dari availableSponsorsByTier
            // Contoh sederhana: Ambil 1 sponsor pertama
            const tierSponsors = availableSponsorsByTier[teamTier];
            return tierSponsors ? [tierSponsors[0]] : [];
        }

        // Fungsi untuk menghitung total pendapatan sponsor (dari sponsor yang sudah dialokasikan)
        function calculateTotalSponsorIncome(assignedSponsors) {
            let totalIncome = 0;
            assignedSponsors.forEach(s => {
                totalIncome += s.estimated_annual_value_idr;
            });
            return totalIncome;
        }
        ```
    *   **Implikasi:** `initial_budget` akan dikurangi oleh harga driver, PU, dan chassis, kemudian sisanya ditambah `cash_reserve` dan `sponsor_income` untuk menjadi total `cash_reserve` tim.

### **II. Perekrutan Awal: Pembalap & Staf Kunci (Update dengan Perhitungan Budget)**

Pemain memilih personel inti dari daftar yang tersedia, menyeimbangkan biaya dengan kapabilitas.

**Konsep:** Pemain diberikan daftar personel generik (atau beberapa tokoh nyata level rendah/menengah) untuk direkrut. Stats personel akan diambil langsung dari data JSON yang ada.

**Alur Implementasi (Frontend/Backend):**

1.  **Pemilihan Unit Tenaga (Power Unit):**
    *   **Frontend:** `dropdown` atau `cards` menampilkan `power_units.name`, `power_units.manufacturer`, dan `power_units.price_idr`.
    *   **Data Source (JS):** Ambil dari `power_units.json`.
    *   **JSON Fields:** `teams.power_unit.supplier` (akan diisi dengan `power_units.id`), dan `teams.power_unit.performance`, `reliability`, `integration_level` akan dicopy dari `power_units.stats` yang dipilih.
    *   **Implikasi:** Entri baru (`team_id`, `power_unit_id`, `role: "customer"`) akan dibuat di `power_unit_suppliers.json` pada saat menyimpan tim.

2.  **Perekrutan Team Principal (`team_chiefs.json`):**
    *   **Frontend:** `list_selector` menampilkan `team_chiefs.full_name`, `team_chiefs.nationality`, `team_chiefs.stats.leadership`, `team_chiefs.stats.strategy`, dan `team_chiefs.price_idr`.
    *   **Data Source (JS):** Ambil dari `team_chiefs.json` (saring yang `is_active: false` atau yang belum direkrut oleh tim AI lain).
    *   **JSON Fields:** `id` Team Principal akan disimpan sebagai FK di tim baru (misalnya, `teams.team_principal_id`, perlu ditambahkan field ini ke `teams.json`).
    *   **Dampak (JS Logic):**
        ```javascript
        // Modifier untuk stats tim berdasarkan Team Principal
        team.meta.political_influence = initialTeamMeta.political_influence + (selectedTP.stats.political_influence * 0.2); // Contoh modifier
        team.economy.sponsor_income_multiplier = initialTeamEconomy.sponsor_income_multiplier * (1 + selectedTP.stats.sponsor_power / 100);
        ```

3.  **Perekrutan Technical Director (`technical_chiefs.json`):**
    *   **Frontend:** Mirip dengan TP, menampilkan `technical_chiefs.full_name`, `technical_chiefs.stats.aerodynamics`, `technical_chiefs.stats.innovation`, `technical_chiefs.price_idr`.
    *   **Data Source (JS):** Ambil dari `technical_chiefs.json` (saring yang tersedia).
    *   **JSON Fields:** `id` Technical Director akan disimpan sebagai FK di tim baru (misalnya, `teams.technical_director_id`, perlu ditambahkan field ini ke `teams.json`).
    *   **Dampak (JS Logic):** Langsung memodifikasi `chassis.stats` saat generasi mobil.
        ```javascript
        // Modifier untuk chassis stats
        chassis.stats.aerodynamics.high_speed_cornering = baseChassisStats.aero.high_speed_cornering * (1 + selectedTD.stats.aerodynamics / 100 * 0.15);
        chassis.development.upgrade_potential = baseChassisStats.dev.upgrade_potential * (1 + selectedTD.stats.innovation / 100 * 0.08);
        ```

4.  **Perekrutan Dua Pembalap Utama (`drivers.json`):**
    *   **Frontend:** `list_selector` untuk Pembalap 1 dan Pembalap 2, menampilkan `drivers.full_name`, `drivers.nationality`, `drivers.stats.overall`, `drivers.price_idr`.
    *   **Data Source (JS):** Ambil dari `drivers.json` (saring yang tersedia).
    *   **JSON Fields:** `id` pembalap akan disimpan sebagai FK di tim baru (misalnya, `teams.driver1_id`, `teams.driver2_id`, perlu ditambahkan field ini ke `teams.json`).
    *   **Dampak (JS Logic):** Menentukan performa balapan dan `operational_cost` tim.
        ```javascript
        // Menambahkan gaji pembalap ke biaya operasional
        team.economy.operational_cost += selectedDriver1.price_idr; // Asumsi price_idr adalah gaji tahunan
        team.economy.operational_cost += selectedDriver2.price_idr;
        ```

### **III. Alokasi Stats Awal & Generasi Mobil (Initial Stat Allocation & Car Generation)**

Setelah semua pilihan dibuat, sistem akan meng-generate statistik awal untuk tim dan mobil berdasarkan pilihan pemain dan modifier staf.

**Konsep:** Base stats digabungkan dengan modifier dari pilihan pemain (tier, filosofi) dan stats personel yang direkrut.

**Alur Implementasi (JS Logic):**

1.  **Generate Chassis ID:**
    ```javascript
    const teamId = generateSlug(teamNameInput.value); // e.g., "phoenix_racing"
    const chassisId = `${teamId}_chassis_01`; // Atau nama yang lebih spesifik
    ```
2.  **Generate Base Chassis Stats (dari filosofi):**
    ```javascript
    let chassisStats = JSON.parse(JSON.stringify(chassisPhilosophies[selectedPhilosophy])); // Deep copy base stats
    ```
3.  **Apply Technical Director Modifiers ke Chassis Stats:**
    ```javascript
    // Example: Aerodynamics
    chassisStats.aerodynamics = {
        low_speed_cornering: chassisStats.base_low_speed_cornering * (1 + selectedTD.stats.aerodynamics * 0.005),
        medium_speed_cornering: chassisStats.base_medium_speed_cornering * (1 + selectedTD.stats.aerodynamics * 0.005),
        high_speed_cornering: chassisStats.base_high_speed_cornering * (1 + selectedTD.stats.aerodynamics * 0.005),
        dirty_air_tolerance: chassisStats.base_dirty_air_tolerance * (1 + selectedTD.stats.regulation_adaptation * 0.003),
        aero_efficiency: chassisStats.base_aero_efficiency * (1 + selectedTD.stats.aerodynamics * 0.005),
        drs_efficiency: chassisStats.base_drs_efficiency * (1 + selectedTD.stats.aerodynamics * 0.003)
    };
    // Example: Mechanical
    chassisStats.mechanical = {
        traction: chassisStats.base_traction * (1 + selectedTD.stats.mechanical_design * 0.004),
        kerb_riding: chassisStats.base_kerb_riding * (1 + selectedTD.stats.mechanical_design * 0.002),
        ride_stability: chassisStats.base_ride_stability * (1 + selectedTD.stats.mechanical_design * 0.005),
        weight_distribution: chassisStats.base_weight_distribution * (1 + selectedTD.stats.weight_optimization * 0.006),
        suspension_quality: chassisStats.base_suspension_quality * (1 + selectedTD.stats.mechanical_design * 0.005)
    };
    // ... Lanjutkan untuk performance, reliability, development
    ```
4.  **Finalisasi Objek Chassis Baru:**
    ```javascript
    const newChassis = {
        id: chassisId,
        team_id: teamId,
        name: `${teamNameInput.value} C01`, // Contoh penamaan mobil awal
        design_philosophy: selectedPhilosophy,
        concept: selectedConcept, // Diambil dari pilihan filosofi
        is_active: true,
        price_idr: initialChassisPrice, // Harga dasar + modifier TD
        stats: chassisStats,
        car_behavior: {}, // Dihitung dari stats atau default
        difficulty: {}, // Dihitung dari stats atau default
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    ```

5.  **Finalisasi Objek Tim Baru (`teams.json`):**
    ```javascript
    const newTeam = {
        id: teamId,
        name: teamNameInput.value,
        full_name: teamFullNameInput.value || `${teamNameInput.value} F1 Team`,
        color: selectedPrimaryColor,
        base: { country: selectedBaseCountry, city: selectedBaseCity },
        status: {
            is_active: true,
            tier: selectedAmbition.tier,
            stability_rating: selectedAmbition.stability_rating
        },
        economy: {
            budget_cap: 135_000_000, // Dari seasons.json
            sponsor_income: calculateInitialSponsorIncome(selectedAmbition.tier, selectedTP.stats.sponsor_power),
            operational_cost: calculateInitialOperationalCost(selectedAmbition.tier, selectedDriver1.price_idr, selectedDriver2.price_idr, newChassis.price_idr),
            cash_reserve: selectedAmbition.cash_reserve
        },
        performance_state: {
            championship_position: selectedAmbition.tier === "new_entry" ? 11 : (selectedAmbition.tier === "midfield" ? 7 : 4), // Initial estimate
            points: 0, wins: 0, podiums: 0,
            form_rating_last_5_races: 50, // Default
            momentum: 50 // Default
        },
        infrastructure: {
            factory_level: selectedAmbition.factory_level,
            wind_tunnel_level: selectedAmbition.wind_tunnel_level,
            cfd_capacity: selectedAmbition.cfd_capacity,
            simulator_level: selectedAmbition.simulator_level,
            staff_quality: selectedAmbition.staff_quality
        },
        power_unit: {
            supplier: selectedPU.id,
            performance: selectedPU.stats.overall_performance,
            reliability: selectedPU.stats.reliability.failure_resistance, // Contoh mapping
            integration_level: selectedPU.stats.development.packaging_efficiency // Contoh mapping
        },
        development_model: {
            philosophy: newChassis.design_philosophy,
            upgrade_aggressiveness: initialAggressiveness * (1 + selectedTD.stats.innovation * 0.002),
            innovation_rate: initialInnovationRate * (1 + selectedTD.stats.innovation * 0.003),
            regulation_adaptation: initialRegulationAdaptation * (1 + selectedTD.stats.regulation_adaptation * 0.004),
            risk_appetite: initialRiskAppetite * (1 + selectedTD.personality.risk_taking * 0.002)
        },
        sporting_profile: {
            race_pace_bias: (selectedDriver1.stats.race_pace_bias + selectedDriver2.stats.race_pace_bias) / 2, // Perlu tambahkan race_pace_bias ke driver stats
            qualifying_bias: (selectedDriver1.stats.qualifying_bias + selectedDriver2.stats.qualifying_bias) / 2, // Perlu tambahkan qualifying_bias ke driver stats
            tyre_management: (selectedDriver1.stats.tyre_management + selectedDriver2.stats.tyre_management) / 2 // Perlu tambahkan tyre_management ke driver stats
        },
        meta: {
            recruitment_strength: selectedAmbition.recruitment_strength * (1 + selectedTP.stats.leadership * 0.003),
            driver_attractiveness: selectedAmbition.driver_attractiveness * (1 + selectedTP.stats.driver_management * 0.004),
            political_influence: selectedTP.stats.political_influence
        },
        team_principal_id: selectedTP.id, // FK
        technical_director_id: selectedTD.id, // FK
        driver1_id: selectedDriver1.id, // FK
        driver2_id: selectedDriver2.id, // FK
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    ```

### **IV. Akuisisi Sponsor Awal**

Tim baru akan menerima sponsor awal berdasarkan `tier` yang dipilih dan `sponsor_power` dari Team Principal.

**Konsep:** Sponsor ini memberikan pendapatan dan bonus `ai_effects` segera.

**Alur Implementasi (JS Logic):**

1.  **Filter Sponsor Tersedia:**
    ```javascript
    const availableSponsors = allSponsors.filter(s => {
        // Logika kompleks untuk memfilter sponsor berdasarkan tier tim dan sponsor_power TP
        // Contoh: Sponsor dengan tier "C" atau "B" tersedia untuk tim "new_entry"
        return s.sponsor_tier === "C" || (s.sponsor_tier === "B" && selectedAmbition.tier !== "new_entry");
    });
    ```
2.  **Alokasi Sponsor Awal (Otomatis/Pilihan):**
    ```javascript
    // Untuk kesederhanaan, asumsikan 1-2 sponsor otomatis
    const initialSponsorsForTeam = assignInitialSponsors(availableSponsors, newTeam.status.tier, selectedTP.stats.sponsor_power);
    ```
3.  **Apply Sponsor Financials & AI Effects:**
    ```javascript
    let totalSponsorIncome = 0;
    initialSponsorsForTeam.forEach(sponsor => {
        totalSponsorIncome += sponsor.financials.estimated_annual_value_idr;
        // Terapkan ai_effects secara langsung ke stats tim baru
        if (sponsor.ai_effects.development_speed_boost) {
            newTeam.development_model.innovation_rate += sponsor.ai_effects.development_speed_boost;
        }
        // ... dan seterusnya untuk efek lainnya
    });
    newTeam.economy.sponsor_income = totalSponsorIncome;
    ```
    *   **JSON Fields:** Entri-entri baru akan dibuat di `sponsors.json` yang menghubungkan `team_id` tim baru dengan sponsor yang dialokasikan.

### **V. Verifikasi dan Mulai Musim**

1.  **Verifikasi Internal (JS):**
    ```javascript
    function validateTeamData(team, chassis, drivers, tp, td, pu) {
        // Cek ID unik, FK valid, rentang stat yang wajar, dll.
        if (!team.id || !chassis.id) return false;
        // ... logika validasi lainnya
        return true;
    }
    if (!validateTeamData(newTeam, newChassis, [selectedDriver1, selectedDriver2], selectedTP, selectedTD, selectedPU)) {
        throw new Error("Initial team data validation failed.");
    }
    ```
2.  **Penyimpanan Data (Backend - API Call):**
    *   Kirim objek `newTeam`, `newChassis`, update `selectedDriver1`, `selectedDriver2` (dengan `team_id` baru), update `selectedTP`, `selectedTD` (dengan `team_id` baru), dan entri `power_unit_suppliers` serta `sponsors` baru ke backend untuk disimpan ke database.
    *   **Contoh API Endpoint (konseptual):**
        ```javascript
        fetch('/api/create-team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team: newTeam, chassis: newChassis, drivers: [selectedDriver1, selectedDriver2], teamChief: selectedTP, techChief: selectedTD, puSupplier: newPUSupplierEntry, sponsors: initialSponsorsForTeam })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Redirect ke game atau dashboard
                window.location.href = '/game/dashboard';
            } else {
                // Tampilkan error ke pemain
                alert('Gagal membuat tim: ' + data.message);
            }
        });
        ```
3.  **Mulai Musim 2026:**
    *   Game akan memuat data tim baru pemain dan memulai simulasi musim sesuai `seasons.json` dan `schedules.json`.

---

**Tambahan Penting untuk Pengembangan JavaScript:**

*   **Helper Functions:** Buat fungsi utilitas untuk `generateSlug`, `calculateInitialSponsorIncome`, `calculateInitialOperationalCost`, `assignInitialSponsors`, dll.
*   **Central State Management:** Gunakan state management (misalnya, React Context, Vuex, Redux, atau bahkan objek global sederhana) untuk mengelola pilihan pemain selama proses "Create My Team".
*   **Asynchronous Operations:** Semua panggilan API ke backend (untuk menyimpan data) harus ditangani secara asinkron (`async/await`).
*   **Error Handling:** Implementasikan penanganan error yang robust di frontend dan backend.
*   **Data Validation (Frontend & Backend):** Validasi input tidak hanya di frontend (untuk UX) tetapi juga di backend (untuk keamanan dan integritas data).
*   **Generated IDs:** Pastikan `id` baru yang dibuat unik secara global atau dalam konteks tabel.

Dengan plan yang mendetail ini, tim Anda harus memiliki panduan yang jelas untuk mengimplementasikan fitur "Create My Team" secara efektif, memastikan setiap pilihan pemain memiliki dampak yang berarti pada pengalaman game.
