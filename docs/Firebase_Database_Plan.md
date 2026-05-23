# F1 Manager 2026 - Firebase Database Plan (Development Ready for JavaScript)

Dokumen ini menguraikan struktur database yang akan digunakan di Firebase (khususnya Firestore), berdasarkan file JSON master yang ada, serta alur untuk migrasi data awal (seeding) dari JSON ke Firebase. Ini akan menjadi panduan untuk menyimpan dan mengakses data game.

---

## I. Struktur Database Firebase (Collections & Documents)

Firebase Firestore menggunakan struktur NoSQL yang fleksibel. Kita akan memetakan file JSON master ke dalam koleksi dan dokumen.

Diasumsikan struktur koleksi sebagai berikut:

**A. Koleksi Master Data (Data Relatif Statis per Musim):**

1.  **`seasons` Collection:**
    *   **Document ID:** `2026` (atau ID musim yang aktif).
    *   **Fields:** `year`, `title`, `status`, `regulation_era`, `engine_version`, `calendar` (object), `preseason_testing` (object), `season_window` (object), `regulations` (object), `budget_cap` (object), `financial_model` (object), `points_system` (object), `championship_structure` (object), `simulation_config` (object), `weather_system` (object), `engine_flags` (object), `created_at`, `updated_at`.

2.  **`teams` Collection:**
    *   **Document ID:** `id` tim dari `teams.json` (e.g., "mercedes", "ferrari", "phoenix_racing").
    *   **Fields:** Semua data dari satu objek tim di `teams.json`. Termasuk FKs seperti `team_principal_id`, `technical_director_id`, `driver1_id`, `driver2_id` (yang akan mereferensikan Document ID di `personnel` collection).

3.  **`personnel` Collection:** (Menggabungkan Driver, Team Chiefs, Technical Chiefs)
    *   **Document ID:** `id` personel dari JSON (e.g., "max_verstappen", "james_allison").
    *   **Fields:** Semua data dari objek personel. Termasuk `team_id` (FK ke `teams`), `role` ("Driver", "Team Principal", "Technical Director"), `stats`, `personality`, `price_idr`, `contract_end_year` (jika ada), `created_at`, `updated_at`.

4.  **`chassis` Collection:**
    *   **Document ID:** `id` chassis dari `chassis.json`.
    *   **Fields:** Semua data dari objek chassis, termasuk `team_id` (FK ke `teams`), `name`, `design_philosophy`, `concept`, `is_active`, `price_idr`, `stats` (object), `car_behavior` (object), `difficulty` (object), `created_at`, `updated_at`.

5.  **`power_units` Collection:**
    *   **Document ID:** `id` PU dari `power_units.json`.
    *   **Fields:** `manufacturer`, `country`, `architecture`, `is_active`, `price_idr`, `stats` (object), `characteristics` (object), `ai_behavior` (object), `career_rating`, `created_at`, `updated_at`.

6.  **`circuits` Collection:**
    *   **Document ID:** `id` sirkuit dari `circuits.json`.
    *   **Fields:** `name`, `country`, `country_code`, `flag`, `city`, `type`, `clockwise`, `laps`, `length_km`, `drs_zones`, `altitude_m`, `image_url`, `is_active`, `game_stats` (object), `created_at`, `updated_at`.

7.  **`schedules` Collection:**
    *   **Document ID:** `id` event dari `schedules.json`.
    *   **Fields:** `season_id` (FK ke `seasons`), `circuit_id` (FK ke `circuits`), `round`, `type`, `grand_prix`, `country`, `city`, `is_sprint_weekend`, `is_night_race`, `sessions` (array), `created_at`, `updated_at`.

**B. Koleksi Junction:**

1.  **`power_unit_suppliers` Collection:**
    *   **Document ID:** `id` dari `power_unit_suppliers.json`.
    *   **Fields:** `power_unit_id` (FK ke `power_units`), `team_id` (FK ke `teams`), `role`, `created_at`, `updated_at`.

2.  **`sponsors` Collection:**
    *   **Document ID:** `team_id` + "_" + `title_sponsor` (atau ID unik).
    *   **Fields:** `team_id` (FK ke `teams`), `title_sponsor`, `country_focus`, `sponsor_tier`, `financials` (object), `ecosystem` (array), `ai_effects` (object).

**C. Koleksi Data Dinamis / Game State:**

1.  **`playerTeam` Collection:**
    *   **Document ID:** `playerTeamId` (akan dibuat saat "Create My Team").
    *   **Fields:** Data tim pemain yang paling sering berubah: `current_cash_reserve`, `current_championship_position`, `current_driver_morale_1`, `current_driver_morale_2`, `current_progress_projects` (array), `current_contract_status`, `team_principal_ref`, `technical_director_ref`, `drivers_ref` (array FKs), `current_chassis_id`, `current_power_unit_id`.

2.  **`currentGameState` Collection:**
    *   **Document ID:** `gameState` (satu dokumen tunggal).
    *   **Fields:** `currentSeasonId`, `currentRaceId`, `currentRound`, `currentPhase` ("PreSeason", "RaceWeekend", dll.), `weather_forecast` (object), `gameSpeedMultiplier`, `tutorialState`, dll.

---

## II. Alur Migrasi/Seeding Awal ke Firebase

Saat aplikasi game klien pertama kali dimuat atau saat memulai game baru, data master perlu di-seed ke Firebase.

**Tujuan:** Memastikan semua data master tersedia di Firebase sebelum game berjalan.

**Alur Implementasi (Admin/Backend Script - Node.js Contoh):
**
1.  **Inisialisasi Firebase Admin SDK:**
    ```javascript
    // Import Firebase Admin SDK
    const admin = require('firebase-admin');
    const serviceAccount = require('./path/to/your/serviceAccountKey.json'); // Kredensial Firebase
    const fs = require('fs');
    const path = require('path');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    const db = admin.firestore();
    ```

2.  **Memuat Data Master dari File JSON:**
    ```javascript
    const jsonData = {
        seasons: JSON.parse(fs.readFileSync(path.join(__dirname, 'data_normalize/seasons.json'), 'utf8')),
        teams: JSON.parse(fs.readFileSync(path.join(__dirname, 'data_normalize/teams.json'), 'utf8')),
        drivers: JSON.parse(fs.readFileSync(path.join(__dirname, 'data_normalize/drivers.json'), 'utf8')),
        technicalChiefs: JSON.parse(fs.readFileSync(path.join(__dirname, 'data_normalize/technical_chiefs.json'), 'utf8')),
        teamChiefs: JSON.parse(fs.readFileSync(path.join(__dirname, 'data_normalize/team_chiefs.json'), 'utf8')),
        chassis: JSON.parse(fs.readFileSync(path.join(__dirname, 'data_normalize/chassis.json'), 'utf8')),
        powerUnits: JSON.parse(fs.readFileSync(path.join(__dirname, 'data_normalize/power_units.json'), 'utf8')),
        circuits: JSON.parse(fs.readFileSync(path.join(__dirname, 'data_normalize/circuits.json'), 'utf8')),
        schedules: JSON.parse(fs.readFileSync(path.join(__dirname, 'data_normalize/schedules.json'), 'utf8')),
        powerUnitSuppliers: JSON.parse(fs.readFileSync(path.join(__dirname, 'data_normalize/power_unit_suppliers.json'), 'utf8')),
        sponsors: JSON.JSON.parse(fs.readFileSync(path.join(__dirname, 'data_normalize/sponsors.json'), 'utf8'))
    };
    ```

3.  **Menyimpan Data ke Koleksi Firebase (Bulk Write):**
    *   Gunakan `batch` write Firestore untuk efisiensi.
    ```javascript
    async function seedDatabase() {
        const batch = db.batch();

        // Seed Seasons
        const seasonData = jsonData.seasons.data[0]; // Asumsi hanya 1 musim utama
        batch.set(db.collection('seasons').doc(seasonData.id), seasonData);
        console.log(`Queueing season: ${seasonData.id}`);

        // Seed Teams
        for (const team of jsonData.teams.data) {
            batch.set(db.collection('teams').doc(team.id), team);
            console.log(`Queueing team: ${team.id}`);
        }

        // Seed Personnel (Drivers, Team Chiefs, Technical Chiefs)
        // Perhatikan: JSON ini bisa digabung atau disimpan terpisah berdasarkan role untuk query lebih efisien
        const allPersonnel = [...jsonData.drivers.data, ...jsonData.technicalChiefs.data, ...jsonData.teamChiefs.data];
        for (const person of allPersonnel) {
            batch.set(db.collection('personnel').doc(person.id), person);
            console.log(`Queueing personnel: ${person.id}`);
        }

        // Seed Chassis, Power Units, Circuits, Schedules
        // ... (Ulangi proses serupa untuk koleksi lainnya, gunakan ID JSON sebagai Document ID)

        // Seed Junction Collections
        for (const supplier of jsonData.powerUnitSuppliers.data) {
            batch.set(db.collection('power_unit_suppliers').doc(supplier.id), supplier);
            console.log(`Queueing power_unit_supplier: ${supplier.id}`);
        }
        for (const sponsor of jsonData.sponsors.data) {
            // Buat ID unik untuk sponsor jika diperlukan, atau gunakan kombinasi team_id+sponsor_name
            const sponsorId = `${sponsor.team_id}_${sponsor.title_sponsor.replace(/\s+/g, '_').toLowerCase()}`;
            batch.set(db.collection('sponsors').doc(sponsorId), sponsor);
            console.log(`Queueing sponsor: ${sponsorId}`);
        }

        // Commit the batch
        await batch.commit();
        console.log('Database seeding completed successfully!');
    }

    seedDatabase().catch(console.error);
    ```

4.  **Penanganan Foreign Keys (FKs):**
    *   Saat seeding, pastikan ID dari `drivers.json`, `team_chiefs.json`, `technical_chiefs.json` digunakan sebagai `id` di koleksi `personnel`.
    *   `teams.team_principal_id` dan `teams.technical_director_id` HARUS diisi dengan ID yang sesuai dari koleksi `personnel`.
    *   `teams.driver1_id`, `teams.driver2_id` harus diisi dengan ID dari koleksi `personnel`.
    *   `power_unit_suppliers.power_unit_id` harus merujuk ke ID di `power_units`.
    *   `power_unit_suppliers.team_id` harus merujuk ke ID di `teams`.
    *   `sponsors.team_id` harus merujuk ke ID di `teams`.
    *   `schedules.circuit_id` harus merujuk ke ID di `circuits`.

5.  **Membuat Dokumen `playerTeam` & `currentGameState` Awal:**
    *   Setelah master data di-seed, buat dokumen default.
    ```javascript
    // Setelah seeding master data selesai
    const playerTeamDocId = 'playerTeamId'; // Atau ID pengguna/sesi game
    await db.collection('playerTeam').doc(playerTeamDocId).set({
        createdTeamId: null, // Akan diisi setelah Create My Team
        currentSeasonId: '2026',
        // ... field default lainnya
    });

    const gameStateDocId = 'gameState';
    await db.collection('currentGameState').doc(gameStateDocId).set({
        currentSeasonId: '2026',
        currentRaceId: null, // Akan ditentukan saat musim dimulai
        currentRound: 0,
        currentPhase: 'PreSeason',
        weather_forecast: {}, // Default
        // ... field default lainnya
    });
    ```

---

## III. Alur Pengambilan Data Master di Aplikasi Klien (JavaScript Frontend/Game Client)

Saat aplikasi game klien dimuat, ia akan mengambil data master yang diperlukan dari Firebase.

1.  **Inisialisasi Firebase Client SDK:**
    ```javascript
    import firebase from 'firebase/app';
    import 'firebase/firestore';

    const firebaseConfig = { ... }; // Konfigurasi Firebase Anda
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();
    ```

2.  **Mengambil Data Pemain & Game State:**
    ```javascript
    async function loadInitialGameData(userId) {
        const playerTeamId = userId || 'defaultPlayer'; // Gunakan ID pengguna
        const playerTeamDocRef = db.collection('playerTeam').doc(playerTeamId);
        const gameStateDocRef = db.collection('currentGameState').doc('gameState');

        try {
            const [playerTeamSnap, gameStateSnap] = await Promise.all([
                playerTeamDocRef.get(),
                gameStateDocRef.get()
            ]);

            let gameData = {};

            if (playerTeamSnap.exists) {
                gameData.currentTeam = playerTeamSnap.data();
                // Kemudian ambil data terkait (Driver, TP, TD, Chassis, PU) berdasarkan FKs di playerTeamDoc
                // Contoh: await getPersonnelDetails(gameData.currentTeam.driver1_id);
            } else {
                // Jika belum ada player team, berarti pemain baru atau belum membuat tim
                // Panggil UI untuk "Create My Team"
                console.log('No player team found. Starting Create My Team flow.');
                return null; // Atau trigger start creation flow
            }

            if (gameStateSnap.exists) {
                gameData.currentGameState = gameStateSnap.data();
            }
            
            // Load Season Data (sebagai master data)
            const seasonDoc = await db.collection('seasons').doc(gameData.currentGameState.currentSeasonId).get();
            if (seasonDoc.exists) {
                gameData.currentSeason = { id: seasonDoc.id, ...seasonDoc.data() };
            }

            // Lanjutkan memuat data master lain yang dibutuhkan (misal: sirkuit untuk balapan pertama)
            return gameData;

        } catch (error) {
            console.error('Error loading game data:', error);
            throw error;
        }
    }
    ```

3.  **Memuat Data Master Saat Dibutuhkan (Lazy Loading):**
    *   Untuk data yang tidak segera dibutuhkan (misalnya, semua sirkuit saat hanya balapan pertama yang relevan), ambil data tersebut hanya saat diperlukan untuk menghemat bandwidth dan waktu load.
    *   Contoh: Saat pemain membuka menu Kalender, baru ambil semua data dari koleksi `circuits` dan `schedules`.

---

**Pertimbangan Tambahan untuk Implementasi Firebase:**

*   **Structure for Queries:** Gunakan `team_id` dan `personnel.role` di koleksi `personnel` untuk memfilter driver, TP, TD dengan efisien.
*   **Firebase Security Rules:** Sangat penting untuk mengatur aturan keamanan agar pemain hanya dapat membaca dan menulis data mereka sendiri (`playerTeam`, dan data terkait yang menjadi milik mereka), serta membaca data master (`seasons`, `teams`, `drivers`, dll.).
*   **Offline Support:** Pertimbangkan untuk menggunakan fitur cache offline Firestore jika aplikasi berjalan di lingkungan yang mungkin memiliki koneksi internet tidak stabil.
*   **Data Validation:** Meskipun JSON sudah divalidasi, tambahkan validasi tambahan di sisi backend Firebase (misalnya, menggunakan Cloud Functions untuk validasi sebelum menulis ke database) untuk memastikan integritas data.
*   **Cloud Functions for Complex Logic:** Operasi yang melibatkan banyak penulisan atau logika kompleks (misalnya, saat memperbarui `career_rating` personel setelah juara) mungkin lebih baik ditangani oleh Cloud Functions yang dipicu oleh operasi database.
