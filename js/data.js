const Data = {
  seasons: null,
  sponsors: null,
  team_chiefs: null,
  tech_chiefs: null,
  teams: null,
  chassis: null,
  circuits: null,
  drivers: null,
  power_units: null,
  schedules: null,

  async loadAll() {
    try {
      const files = [
        "seasons",
        "sponsors",
        "team_chiefs",
        "technical_chiefs",
        "teams",
        "chassis",
        "circuits",
        "drivers",
        "power_units",
        "schedules",
      ];
      const fetches = files.map((f) =>
        fetch(`data/${f}.json`).then((r) => r.json())
      );
      const results = await Promise.all(fetches);

      // FUNGSI NORMALISASI: Memastikan data yang disimpan SELALU berbentuk Array
      const extractArray = (json) => {
        if (Array.isArray(json)) return json;
        if (json && Array.isArray(json.data)) return json.data;
        return []; // Fallback aman agar game tidak crash jika JSON kosong
      };

      this.seasons = extractArray(results[0]);
      this.sponsors = extractArray(results[1]);
      this.team_chiefs = extractArray(results[2]);
      this.tech_chiefs = extractArray(results[3]);
      this.teams = extractArray(results[4]);
      this.chassis = extractArray(results[5]);
      this.circuits = extractArray(results[6]);
      this.drivers = extractArray(results[7]);
      this.power_units = extractArray(results[8]);
      this.schedules = extractArray(results[9]);

      return true;
    } catch (error) {
      console.error("Gagal memuat JSON:", error);
      alert(
        "Pastikan folder /data/ memiliki semua file JSON dan dijalankan via Live Server."
      );
      return false;
    }
  },
};
