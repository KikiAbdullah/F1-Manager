# F1 Manager 2026 - Dokumentasi Layar

Dokumen ini menguraikan fungsionalitas dan struktur layar-layar utama dalam aplikasi F1 Manager 2026.

## `src/screens/MainMenuScreen.js`

Layar ini berfungsi sebagai titik masuk utama untuk permainan, menampilkan opsi untuk memulai karier baru, melanjutkan karier yang sudah ada, mengelola file penyimpanan, dan mengakses pengaturan.

### Fitur Utama:

-   **Manajemen Karier**:
    -   `Resume Career`: Memungkinkan pemain untuk melanjutkan permainan yang tersimpan. Hanya terlihat jika ada karier yang sudah dibuat.
    -   `New Career`: Memulai wizard pembuatan tim, menavigasi ke layar `create-team`.
    -   `Reset Career`: Menghapus semua progres permainan yang tersimpan, memicu pemuatan ulang halaman.
-   **Manajemen Data Penyimpanan**:
    -   `Export Save`: Mengunduh status permainan saat ini sebagai file JSON.
    -   `Import Save`: Mengunggah file penyimpanan JSON yang sebelumnya diekspor, lalu memuat ulang halaman untuk menerapkan status baru.
-   **Pengaturan**: Membuka modal untuk menyesuaikan pengaturan permainan, seperti kecepatan permainan.
-   **Ikhtisar Karier (Career Snapshot)**: Menampilkan ringkasan karier saat ini, termasuk nama tim, musim/putaran saat ini, dan total poin.
-   **Visual & Audio**:
    -   Mengintegrasikan GSAP untuk animasi masuk elemen UI.
    -   Memutar efek suara hover (`Howler.js`) saat mengarahkan kursor ke item menu.

### Komponen & Logika Inti:

-   `renderMainMenu()`: Fungsi utama yang bertanggung jawab untuk merender seluruh UI menu utama, menyesuaikan elemen secara dinamis berdasarkan `playerTeamMeta` dan `gameState` dari `store`.
-   `_openSettingsModal()`: Menangani tampilan dan logika untuk modal pengaturan dalam game, memungkinkan pengguna untuk mengubah `gameSpeedMultiplier`.
-   `playHoverSfx()`: Mengelola pemutaran efek suara hover, memastikan audio dimuat sebelumnya dan diputar tanpa gangguan.
-   **Manajemen Status (State Management)**: Menggunakan `store.js` untuk manajemen status global (misalnya, `playerTeamMeta`, `gameState`, `playerTeam`).
-   **Persistensi**: Mengintegrasikan `persistence.js` untuk menyimpan, memuat, mengekspor, dan mengimpor progres permainan.
-   **Perutean (Routing)**: Menggunakan `router.js` untuk menavigasi antar layar (misalnya, `create-team`, `dashboard`).

## `src/screens/CreateTeamScreen.js`

Layar ini mengimplementasikan wizard multi-langkah bagi pemain untuk membuat dan mengonfigurasi tim F1 kustom mereka. Ini memandu pengguna melalui pilihan identitas, ambisi, pemilihan pembalap, personel, unit daya, dan sasis, yang berpuncak pada langkah konfirmasi.

### Fitur Utama:

-   **Wizard Multi-Langkah**:
    -   Terdiri dari 7 langkah berbeda, masing-masing dirender oleh fungsi khusus.
    -   Navigasi (tombol `Back` dan `Next`) dikelola untuk bergerak di antara langkah-langkah.
    -   Progres ditunjukkan secara visual oleh "titik langkah" di header.
-   **Konfigurasi Tim**:
    -   **Langkah 1: Identitas Tim**: Pemain menentukan nama tim, nama singkat, negara, dan kota.
    -   **Langkah 2: Pemilihan Ambisi**: Pemain memilih tingkat ambisi, yang menentukan anggaran awal, prestise, dan atribut tim lainnya. Tersedia tiga tingkat: "LOCAL INDONESIAN ENTRANT", "ASIAN INDUSTRIAL CONTENDER", dan "GLOBAL MOTORSPORT POWERHOUSE".
    -   **Langkah 3: Susunan Pembalap (Driver Lineup)**: Pemain memilih dua pembalap dari daftar, dengan batasan anggaran yang diterapkan.
    -   **Langkah 4: Manajemen Tim**: Pemain memilih Ketua Tim (Team Chief) dan Ketua Teknis (Technical Chief), dengan pertimbangan anggaran.
    -   **Langkah 5: Unit Daya (Power Unit)**: Pemain memilih unit daya untuk tim mereka, yang memengaruhi performa, kemampuan kendali, dan keandalan.
    -   **Langkah 6: Sasis**: (Tidak dijelaskan sepenuhnya dalam kode yang disediakan, tetapi tersirat oleh `TOTAL_STEPS` dan `STEP_RENDERERS`) Pemain akan memilih sasis.
    -   **Langkah 7: Konfirmasi**: (Tidak dijelaskan sepenuhnya dalam kode yang disediakan, tetapi tersirat) Tinjauan akhir dan konfirmasi pembuatan tim.
-   **Manajemen Anggaran**:
    -   Pil anggaran dinamis menampilkan sisa anggaran.
    -   Pilihan (pembalap, personel, unit daya, sasis) divalidasi terhadap anggaran saat ini, menonaktifkan opsi jika tidak terjangkau.
    -   Pesan toast ditampilkan untuk dana yang tidak mencukupi.
-   **Pemuatan & Normalisasi Data**: Memuat data master secara asinkron (pembalap, unit daya, sasis, personel, sponsor) dari file JSON. Data kemudian dinormalisasi untuk pencarian yang efisien.

### Komponen & Logika Inti:

-   `wizardState`: Objek pusat yang menyimpan langkah saat ini dan semua detail konfigurasi tim yang dipilih selama proses wizard.
-   `ambitionLevels`: Objek yang berisi data terperinci untuk setiap tingkat ambisi, termasuk informasi keuangan, profil, fasilitas, tenaga kerja, dan sponsor.
-   `renderCreateTeam()`: Titik masuk untuk layar, bertanggung jawab untuk menginisialisasi status wizard, memuat data, dan merender struktur wizard utama.
-   `renderCurrentStep()`: Fungsi pembantu yang memanggil perender langkah yang sesuai berdasarkan `wizardState.currentStep`.
-   `bindGlobalEvents()`: Melampirkan pendengar acara untuk tombol navigasi (`Back`, `Next`) dan pilihan kartu dalam wizard.
-   `handleBack()`, `handleNext()`: Fungsi untuk mengelola transisi langkah dan validasi.
-   `handleWizardClick()`: Penangan acara pusat untuk klik pada elemen interaktif dalam tubuh wizard (misalnya, tingkatan ambisi, kartu pembalap, kartu personel, kartu unit daya, kartu sasis).
-   `renderIdentityStep()`, `renderAmbitionStep()`, `renderDriverSelectionStep()`, `renderPersonnelSelectionStep()`, `renderPowerUnitStep()`: Fungsi individual yang bertanggung jawab untuk merender UI dan logika untuk setiap langkah masing-masing.
-   `renderTierSelector()`, `renderTierDetail()`: Pembantu untuk menampilkan opsi tingkatan ambisi dan informasi detailnya.
-   `renderDriverCard()`, `toggleDriver()`: Pembantu untuk menampilkan kartu pembalap dan mengelola pemilihan pembalap.
-   `renderTeamChiefCard()`, `toggleTeamChief()`: Pembantu untuk menampilkan kartu ketua tim dan mengelola pemilihan.
-   `renderTechnicalChiefCard()`, `toggleTechnicalChief()`: Pembantu untuk menampilkan kartu ketua teknis dan mengelola pemilihan.
-   `renderPowerUnitOption()`, `renderPowerUnitDetail()`: Pembantu untuk menampilkan opsi unit daya dan informasi detailnya.
-   `canAffordDeltaSpend()`, `budgetToast()`: Fungsi utilitas untuk validasi anggaran dan umpan balik.
-   `calculateAge()`: Menghitung usia pembalap dari tanggal lahir mereka.
-   `moneyCompact()`, `humanizeEnum()`: (Fungsi utilitas yang diasumsikan) untuk memformat uang dan nilai enum.
-   **Persistensi**: Menggunakan `saveProgress()` dari `persistence.js` untuk menyimpan tim yang dibuat setelah wizard selesai.
-   **Perutean (Routing)**: Menggunakan `router.js` untuk kembali ke menu utama atau menavigasi ke dasbor setelah pembuatan tim.