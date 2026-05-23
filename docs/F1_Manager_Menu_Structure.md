# F1 Manager 2026 - Menu Structure & JavaScript Integration Plan

Dokumen ini menguraikan struktur menu utama untuk game F1 Manager 2026, dengan detail mengenai fungsi setiap menu dan bagaimana data JSON yang telah dinormalisasi akan diakses, ditampilkan, dan dimanipulasi menggunakan JavaScript untuk antarmuka pengguna (UI) yang dinamis.

---

## Struktur Menu Game

Berikut adalah daftar menu utama dan sub-menu yang akan tersedia bagi pemain:

### 1. My Team / Dashboard Utama (Home)

Layar utama yang memberikan gambaran umum tentang status tim saat ini.

*   **Tujuan:** Memberikan pemain ringkasan cepat tentang kondisi tim mereka dan menyorot prioritas utama.
*   **Data yang Diakses (JavaScript - `gameData` object):
    *   `gameData.currentTeam`: Menampilkan `name`, `tier`, `status.stability_rating`, `economy.cash_reserve`.
    *   `gameData.currentTeam.performance_state`: Menampilkan `championship_position`, `points`.
    *   `gameData.currentDriver`, `gameData.currentTeam.team_principal_id`, `gameData.currentTeam.technical_director_id`: Untuk menampilkan status personel kunci.
    *   `gameData.currentSeason`: Menampilkan `year`, `title`, `status`.
*   **Komponen UI (Frontend - Contoh Konseptual):
    ```javascript
    function renderDashboard(team, season, drivers, tp, td) {
        document.getElementById('teamNameDisplay').innerText = team.name;
        document.getElementById('teamTierDisplay').innerText = team.status.tier;
        document.getElementById('cashReserveDisplay').innerText = formatCurrency(team.economy.cash_reserve);
        document.getElementById('championshipPosDisplay').innerText = team.performance_state.championship_position;
        // ... render data lainnya
    }
    ```
*   **Pesan & Notifikasi:** Mengambil data dari sistem pesan internal game (misalnya, `gameData.notifications`).
*   **Akses Cepat:** Tombol navigasi untuk menu utama lainnya.

---

### 2. Personnel (Personel)

Manajemen semua individu yang bekerja untuk tim.

*   **Tujuan:** Mengelola kontrak, rekrutmen, dan perkembangan staf serta pembalap.
*   **Sub-Menu:
    1.  Pembalap (Drivers)
    2.  Staf Tim (Team Staff)

*   **2.1. Pembalap (Drivers):
    *   **Data yang Diakses:** Daftar semua pembalap yang direkrut (`gameData.currentTeam.driver1_id`, `gameData.currentTeam.driver2_id` akan mereferensikan objek pembalap dari `gameData.allDrivers`). Menampilkan `drivers.full_name`, `drivers.nationality`, `drivers.stats`, `drivers.price_idr`, `drivers.contract_end_year`, `drivers.morale` (jika ada).
    *   **Tindakan:** Negosiasi kontrak (`initiateContractNegotiation` JS function), atur program pelatihan (memengaruhi `drivers.stats` dari waktu ke waktu).
    *   **Komponen UI:** Tabel interaktif pembalap dengan filter dan opsi detail.

*   **2.2. Staf Tim (Team Staff):
    *   **Data yang Diakses:** Menampilkan detail Team Principal (`gameData.currentTeam.team_principal_id`) dan Technical Director (`gameData.currentTeam.technical_director_id`). Menampilkan `stats`, `personality`, `career_rating`, `price_idr`, `contract_end_year`.
    *   **Tindakan:** Tinjau profil staf, rekrut staf baru (dari `gameData.availableStaff`), negosiasi kontrak.
    *   **Komponen UI:** Profil terperinci untuk setiap staf kunci.

---

### 3. Car Development (Pengembangan Mobil)

Manajemen aspek teknis mobil.

*   **Tujuan:** Mengelola R&D, upgrade, dan komponen mobil.
*   **Sub-Menu:
    1.  Chassis (`chassis.json`)
    2.  Power Unit (`power_units.json`)
    3.  R&D (Research & Development)
    4.  Part Manufacturing
    5.  Testing

*   **3.1. Chassis & Power Unit:**
    *   **Data yang Diakses:** Menampilkan `chassis.stats`, `chassis.design_philosophy`, `power_unit.stats`, `power_unit.characteristics`.
    *   **Komponen UI:** Tampilan detail dengan grafik atau visualisasi untuk `stats` aerodinamika, mekanik, performa, dll.

*   **3.3. R&D (Research & Development):**
    *   **Data yang Diakses:** `teams.development_projects` (status proyek, progress, cost), `teams.infrastructure` (level fasilitas), `technical_chief.stats` (inovasi, adaptasi regulasi).
    *   **Tindakan:** Memulai proyek R&D baru, mengalokasikan sumber daya (dana, waktu staf).
    *   **Logika JavaScript:** `advanceDevelopmentProjects` function untuk memajukan progress proyek setiap turn/minggu.
    *   **Komponen UI:** Pohon teknologi atau daftar proyek dengan progress bar.

*   **3.4. Part Manufacturing:**
    *   **Data yang Diakses:** Status komponen yang diproduksi, waktu produksi yang tersisa.
    *   **Tindakan:** Mengelola lini produksi.

*   **3.5. Testing:**
    *   **Data yang Diakses:** Jadwal tes, hasil tes sebelumnya, potensi dampak upgrade baru.
    *   **Tindakan:** Mengatur jadwal pengujian, memilih pembalap untuk pengujian.

---

### 4. Season & Calendar (Musim & Jadwal)

Informasi mengenai musim kompetisi yang sedang berjalan.

*   **Tujuan:** Memberikan gambaran kalender, regulasi, dan klasemen.
*   **Data yang Diakses:**
    *   `gameData.currentSeason` (regulasi, status musim).
    *   `gameData.allSchedules` (kalender lengkap, info sirkuit, cuaca prediksi).
    *   `gameData.currentTeam.performance_state` (klasemen terkini).
    *   `gameData.allDrivers`, `gameData.allTeams` (untuk klasemen pembalap & konstruktor).
*   **Komponen UI:** Tampilan kalender interaktif, grafik klasemen, tabel regulasi.

---

### 5. Race Weekend (Akhir Pekan Balapan)

Manajemen dan simulasi setiap putaran balapan.

*   **Tujuan:** Memaksimalkan hasil di setiap balapan.
*   **Fase dalam Menu:**
    1.  **Practice:** Mengatur tujuan sesi, menganalisis data.
    2.  **Qualifying:** Menentukan strategi kualifikasi, memantau hasil.
    3.  **Race:** Antarmuka kontrol strategi balapan real-time (in-game), pit stop, instruksi pembalap.
    4.  **Post-Race:** Tinjauan hasil, laporan DNF, update `performance_state`.
*   **Data yang Diakses:** Informasi cuaca, data sirkuit, statistik driver & mobil saat itu, progres balapan, `team_chief.stats.strategy`, `technical_chief.stats.setup_understanding`.
*   **Logika JavaScript:** Memainkan peran kunci dalam mengimplementasikan `calculateTopSpeed`, `calculateCorneringSpeed`, `calculateDNFProbability`, `calculatePitStopEfficiency`, dll. berdasarkan input pemain dan data game.

---

### 6. Finance (Keuangan)

Manajemen semua aspek keuangan tim.

*   **Tujuan:** Memastikan kesehatan finansial tim dan mengalokasikan sumber daya secara efektif.
*   **Data yang Diakses:** `teams.economy` (budget cap, sponsor income, costs, reserves), `teams.development_projects` (biaya R&D), `drivers.price_idr`, `team_chiefs.price_idr`, `technical_chiefs.price_idr` (gaji staf).
*   **Tindakan:** Melihat laporan keuangan, membuat keputusan anggaran, mengelola kontrak.
*   **Komponen UI:** Grafik pendapatan/pengeluaran, tabel anggaran R&D, ringkasan kontrak.

---

### 7. News & Mail / Inbox

Pusat komunikasi dan informasi penting.

*   **Tujuan:** Memberikan informasi penting dan event yang memerlukan perhatian pemain.
*   **Data yang Diakses:** Sistem pesan internal game (`gameData.notifications`, `gameData.mediaFeed`).
*   **Komponen UI:** Daftar pesan atau feed berita, seringkali dengan opsi untuk merespons (misalnya, wawancara, tanggapan sponsor).

---

### 8. World Database / Scouting

Informasi tentang seluruh dunia F1 2026.

*   **Tujuan:** Memantau rival, mencari talenta baru, dan memahami lanskap F1.
*   **Data yang Diakses:** Memuat data dari semua file JSON yang relevan (`allDrivers`, `allTeams`, `allChassis`, `allPUs`, `availableStaff` - yang belum direkrut oleh tim pemain atau AI).
*   **Komponen UI:** Antarmuka pencarian dan filter yang canggih untuk menemukan pembalap, staf, atau tim dengan atribut spesifik.

---

### 9. Save/Load & Settings

Fungsi utilitas standar untuk mengelola sesi permainan.

*   **Tujuan:** Mengelola progres pemain dan preferensi permainan.
*   **Fungsi:** Save game, Load game, Pengaturan (grafis, audio, kontrol, simulasi), Keluar.

---

**Implikasi untuk Implementasi JavaScript & UI/UX:**

*   **State Management:** Gunakan framework seperti React, Vue, atau Svelte dengan state management (Redux, Vuex, Context API) untuk menyinkronkan data di seluruh menu.
*   **Data Fetching:** Implementasikan fungsi-fungsi `fetch` atau AJAX untuk mengambil data dari backend API saat membuka menu atau memuat informasi spesifik.
*   **Dynamic UI Updates:** Gunakan JavaScript untuk memperbarui UI secara dinamis berdasarkan perubahan data (misalnya, menyorot sponsor baru, memperbarui peringkat pembalap setelah balapan).
*   **Component Reusability:** Buat komponen UI generik untuk menampilkan daftar (tabel pembalap, daftar R&D) agar dapat digunakan kembali di berbagai menu.
*   **User Feedback:** Berikan umpan balik visual yang jelas kepada pemain tentang tindakan mereka (misalnya, animasi saat upgrade selesai, notifikasi saat kontrak disetujui).
*   **Error Handling & Loading States:** Tampilkan pesan loading saat data diambil dan pesan error yang informatif jika terjadi masalah.
