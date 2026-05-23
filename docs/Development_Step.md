# F1 Manager 2026 - Development Roadmap (GitHub Pages Ready)

Dokumen ini adalah panduan langkah-demi-langkah untuk membangun game F1 Manager 2026 dari nol. Karena game ini akan di-host di **GitHub Pages**, arsitektur yang digunakan adalah **Static Site (HTML/CSS/JS)** yang berkomunikasi secara langsung dengan **Firebase (Backend-as-a-Service)**.

---

## 📂 Proyek Struktur Folder (Rekomendasi)
Agar rapi, mudah dipelihara, dan siap skala, gunakan struktur folder berikut:

```text
/ (root)
├── public/                 # File yang di‑serve langsung (index.html, favicon, dll)
│   └── index.html
├── src/                    # Source code utama
│   ├── index.js            # Entry point JavaScript
│   ├── assets/             # Gambar, audio, font
│   │   ├── images/
│   │   └── sounds/
│   ├── styles/             # CSS / SCSS
│   │   └── main.css
│   ├── firebase/           # Konfigurasi Firebase
│   │   └── firebase-config.js
│   ├── core/               # Engine dan logika utama
│   │   ├── engine.js
│   │   ├── race_sim.js
│   │   └── ai_manager.js
│   ├── modules/            # Fitur modular (personnel, finance, development, season)
│   │   ├── personnel.js
│   │   ├── finance.js
│   │   ├── development.js
│   │   └── season.js
│   └── ui/                 # Komponen UI
│       ├── dashboard.js
│       ├── create_team.js
│       └── race_ui.js
├── scripts/                # Skrip bantu (seed, build, dll)
│   └── seed_db.js
└── package.json            # Jika menggunakan npm untuk tooling
```

---

## 🚀 Step-by-Step Development Roadmap

### **Phase 1: Infrastruktur & Data (The Foundation)**
Fokus: Memastikan data master tersedia di cloud dan dapat diakses.
1.  **Firebase Setup:** Buat proyek di Firebase Console, aktifkan **Firestore Database** dan **Firebase Hosting**.
2.  **Master Data Seeding:** Jalankan `scripts/seed_db.js` secara lokal menggunakan Node.js untuk memindahkan data dari file `.json` ke Firestore.
3.  **Firebase Integration:** Implementasikan `js/firebase-config.js` untuk menghubungkan `index.html` dengan Firebase.
4.  **Data Access Layer:** Buat fungsi pembantu (helpers) di JS untuk `getDoc`, `setDoc`, dan `updateDoc`.
    *   **Referensi File:** `Firebase_Database_Plan.md` & `_schema.md`

### **Phase 2: Base UI & Onboarding (The Face)**
Fokus: Membuat "rumah" bagi pemain dan proses pendaftaran tim.
1.  **Index.html Shell:** Buat struktur dasar HTML dengan kontainer utama untuk konten dinamis (SPA style).
2.  **Navigation System:** Implementasikan sistem routing sederhana untuk berpindah antar menu tanpa reload halaman.
3.  **Create My Team Flow:** Bangun UI pembuatan tim (input nama, pilih warna, tier, PU, dan personel awal).
4.  **Save New Team:** Implementasikan logika untuk menyimpan tim pemain ke koleksi `playerTeam` di Firebase.
    *   **Referensi File:** `F1_Manager_Menu_Structure.md` & `Create_My_Team_Plan.md`

### **Phase 3: Core Engine & Performance Math (The Brain)**
Fokus: Menghitung siapa yang tercepat di lintasan.
1.  **Math Implementation:** Implementasikan semua rumus dari `F1_Manager_Stats_Calculation_Plan.md` ke dalam `js/core/engine.js`.
2.  **Circuit Integration:** Buat logika agar performa berubah berdasarkan karakteristik sirkuit yang sedang aktif.
3.  **Modifier System:** Implementasikan modifier untuk cuaca basah, setup mobil, dan kondisi ban.
    *   **Referensi File:** `F1_Manager_Stats_Calculation_Plan.md`

### **Phase 4: Management Systems (The Depth)**
Fokus: Menambahkan fitur manajerial yang membuat game terasa seperti simulator.
1.  **Personnel Module:** Implementasikan fitur rekrutmen, kontrak, dan training pembalap/staf.
2.  **Finance Module:** Implementasikan sistem kas mingguan, budget cap, dan negosiasi sponsor.
3.  **R&D Module:** Bangun sistem proyek riset, progres mingguan, dan aplikasi upgrade ke chassis.
    *   **Referensi File:** `Personnel_Management_Plan.md`, `Finance_Sponsorship_Plan.md`, & `Car_Development_Plan.md`

### **Phase 5: Race Weekend Simulation (The Action)**
Fokus: Mengubah statistik menjadi hasil balapan.
1.  **Race Cycle:** Implementasikan alur Latihan $\rightarrow$ Kualifikasi $\rightarrow$ Balapan.
2.  **Lap-by-Lap Simulator:** Buat loop simulasi yang menghitung posisi setiap pembalap setiap lap menggunakan `engine.js`.
3.  **Dynamic Events:** Tambahkan probabilitas kecelakaan, Safety Car, dan kerusakan komponen (DNF).
4.  **Post-Race Processing:** Update poin klasemen dan finansial secara otomatis setelah balapan selesai.
    *   **Referensi File:** `F1_Manager_Stats_Calculation_Plan.md` (Bagian II & III)

### **Phase 6: AI & World Simulation (The Life)**
Fokus: Membuat tim rival terasa hidup dan kompetitif.
1.  **Driver AI:** Implementasikan logika menyalip, bertahan, dan melakukan kesalahan berdasarkan stats.
2.  **Rival Team AI:** Buat logika agar tim AI juga melakukan upgrade mobil dan mencari pembalap baru.
3.  **Market AI:** Implementasikan sistem transfer pemain otomatis antar tim AI.
    *   **Referensi File:** `AI_Logic_Plan.md`

### **Phase 7: Deployment & Polish (The Final Touch)**
1.  **GitHub Pages Deployment:** Push seluruh folder ke repositori GitHub dan aktifkan fitur **GitHub Pages**.
2.  **Balancing:** Tuning angka-angka di JSON agar game terasa adil dan menantang.
3.  **UI/UX Polish:** Tambahkan transisi CSS, animasi loading, dan efek suara.
4.  **Bug Testing:** Lakukan pengujian menyeluruh pada semua modul manajemen dan simulasi balapan.

---

## 🛠️ Ringkasan Urutan Pembukaan File Referensi
Jika Anda bingung harus melihat dokumen yang mana, ikuti urutan ini:

1.  **Struktur Data:** `_schema.md` $\rightarrow$ `Firebase_Database_Plan.md`
2.  **UI & Onboarding:** `F1_Manager_Menu_Structure.md` $\rightarrow$ `Create_My_Team_Plan.md`
3.  **Logika Inti:** `F1_Manager_Stats_Calculation_Plan.md`
4.  **Fitur Detail:** `Personnel_Management_Plan.md` $\rightarrow$ `Finance_Sponsorship_Plan.md` $\rightarrow$ `Car_Development_Plan.md`
5.  **Kecerdasan Buatan:** `AI_Logic_Plan.md`
