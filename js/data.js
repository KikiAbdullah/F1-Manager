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

      this.seasons = results[0].data;
      this.sponsors = results[1].data;
      this.team_chiefs = results[2].data;
      this.tech_chiefs = results[3].data;
      this.teams = results[4].data;
      this.chassis = results[5].data;
      this.circuits = results[6].data;
      this.drivers = results[7].data;
      this.power_units = results[8].data;
      this.schedules = results[9].data;
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
