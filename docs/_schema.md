1: # F1 Manager — Normalized Database Schema
2: 
3: ## Overview
4: Data yang telah dinormalisasi untuk push ke database relasional (MySQL/PostgreSQL/Supabase).
5: Season: **2026**
6: 
7: ---
8: 
9: ## Entity Relationship
10: 
11: ```
12: teams ──┬── drivers          (1:N)  team_id FK
13:         ├── chassis          (1:1)  team_id FK
14:         ├── team_chiefs      (1:1)  team_id FK
15:         ├── technical_chiefs (1:1)  team_id FK
16:         └── power_unit_suppliers (N:M junction) → power_units
17: 
18: circuits ── schedules        (1:N)  circuit_id FK
19: seasons  ── schedules        (1:N)  season_id FK
20: ```
21: 
22: ---
23: 
24: ## Tabel & Deskripsi
25: 
26: | # | File | Tabel DB | PK | FK | Deskripsi |
27: |---|------|----------|----|----|-----------|
28: | 1 | `teams.json` | `teams` | `id` | — | Master tim F1 |
29: | 2 | `drivers.json` | `drivers` | `id` | `team_id` | Pembalap + statistik |
30: | 3 | `circuits.json` | `circuits` | `id` | — | Sirkuit + game_stats |
31: | 4 | `chassis.json` | `chassis` | `id` | `team_id` | Chassis/mobil + stats |
32: | 5 | `power_units.json` | `power_units` | `id` | — | Mesin/PU + stats |
33: | 6 | `power_unit_suppliers.json` | `power_unit_suppliers` | `id` | `power_unit_id`, `team_id` | Junction PU ↔ Tim |
34: | 7 | `team_chiefs.json` | `team_chiefs` | `id` | `team_id` | Team Principal + stats |
35: | 8 | `technical_chiefs.json` | `technical_chiefs` | `id` | `team_id` | Technical Director + stats |
36: | 9 | `seasons.json` | `seasons` | `id` | — | Metadata musim |
37: | 10 | `schedules.json` | `schedules` | `id` | `season_id`, `circuit_id` | Jadwal event per musim |
38: | 11 | `sponsors.json` | `sponsors` | `team_id` | `team_id` | Data sponsor tim F1 |
39: 
40: ---
41: 
42: ## Konvensi
43: 
44: - **ID**: Format slug `snake_case` (contoh: `red_bull_racing`, `max_verstappen`)
45: - **FK**: Mereferensi `id` dari tabel terkait
46: - **Timestamps**: `created_at` dan `updated_at` (ISO 8601)
47: - **Naming**: Semua field menggunakan `snake_case` (English)
48: - **Stats**: Nested object dipertahankan untuk kemudahan akses game engine
49: - **Season**: `season_year` integer (2026)
50: - **is_active**: Boolean flag untuk soft-state management
51: 
52: ---
53: 
54: ## Migrasi Notes
55: 
56: 1. Buat tabel dalam urutan: `seasons` → `teams` → `circuits` → sisanya
57: 2. Junction `power_unit_suppliers` membutuhkan `teams` dan `power_units` sudah ada
58: 3. `schedules` membutuhkan `seasons` dan `circuits` sudah ada
59: 4. Semua data sudah siap untuk bulk insert / seeder
