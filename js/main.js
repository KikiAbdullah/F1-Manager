// Global App State Object
let State = {
  teamName: "",
  budget: 0,
  sponsor: null,
  teamChief: null,
  techChief: null,
  pu: null,
  chassis: null,
  drivers: [],
  currentRound: 1,
  raceWeekends: {},
  driverPoints: {},
};

// Form Wizard Selection Memory
let WizardForm = {
  step: 1,
  sponsorId: null,
  teamChiefId: null,
  techChiefId: null,
  puId: null,
  chassisId: null,
  driver1Id: null,
  driver2Id: null,
};

const Main = {
  // UBAH JADI ASYNC FUNCTION
  async init() {
    // TUNGGU DATA JSON SELESAI DI-FETCH DARI SERVER LOKAL DULU!
    const isDataLoaded = await Data.loadAll();

    if (!isDataLoaded) {
      // Jika gagal load JSON, hentikan eksekusi
      return;
    }

    const rawJsonFile = localStorage.getItem("f1_manager_save.json");

    if (rawJsonFile) {
      try {
        State = JSON.parse(rawJsonFile);
        if (!State.raceWeekends) State.raceWeekends = {};
        if (!State.driverPoints) State.driverPoints = {};
        UI.updateTopBar();
        UI.setupHQ();
        setTimeout(() => {
          UI.showScreen("hq");
        }, 800);
      } catch (e) {
        console.error("Save file korup, memuat wizard baru...", e);
        this.loadWizardAssets();
      }
    } else {
      this.loadWizardAssets();
    }
  },

  loadWizardAssets() {
    // SUDAH DISESUAIKAN DENGAN NAMA VARIABEL DI DATA.JS KAMU
    UI.renderHorizontalCards(
      "container-sponsor",
      Data.sponsors,
      "sponsorId",
      UI.handleWizardCardSelection
    );
    UI.renderHorizontalCards(
      "container-team-chief",
      Data.team_chiefs,
      "teamChiefId",
      UI.handleWizardCardSelection
    );
    UI.renderHorizontalCards(
      "container-tech-chief",
      Data.tech_chiefs,
      "techChiefId",
      UI.handleWizardCardSelection
    );
    UI.renderHorizontalCards("container-pu", Data.power_units, "puId", UI.handleWizardCardSelection);
    UI.renderHorizontalCards(
      "container-chassis",
      Data.chassis,
      "chassisId",
      UI.handleWizardCardSelection
    );
    UI.renderHorizontalCards(
      "container-drivers",
      Data.drivers,
      "driverId", // Special targetField for shared list
      UI.handleWizardCardSelection
    );

    Finance.calculateWizardBudget();
    UI.showScreen("new-career");
  },

  finalizeCareer(event) {
    event.preventDefault();
    const inputName = document.getElementById("input-team-name").value.trim();

    if (!inputName) {
      alert("Harap tentukan nama legal konstruktor tim Anda di Langkah 1!");
      UI.moveWizard(-3);
      return;
    }
    if (
      !WizardForm.sponsorId ||
      !WizardForm.teamChiefId ||
      !WizardForm.techChiefId ||
      !WizardForm.puId ||
      !WizardForm.chassisId ||
      !WizardForm.driver1Id ||
      !WizardForm.driver2Id
    ) {
      alert("Harap lengkapi semua opsi kontrak kartu sebelum meluncurkan tim!");
      return;
    }
    if (WizardForm.driver1Id === WizardForm.driver2Id) {
      alert("Pembalap 1 dan Pembalap 2 tidak boleh orang yang sama!");
      return;
    }

    // Susun objek State Utama sesuai hasil seleksi
    // Menggunakan "id || team_id" agar tetap aman apapun nama properti JSON-nya
    State.teamName = inputName;
    State.budget = Finance.currentWizardBudget;
    State.sponsor = Data.sponsors.find(
      (s) => (s.id || s.team_id) === WizardForm.sponsorId
    );
    State.teamChief = Data.team_chiefs.find(
      (s) => s.id === WizardForm.teamChiefId
    );
    State.techChief = Data.tech_chiefs.find(
      (s) => s.id === WizardForm.techChiefId
    );
    State.pu = Data.power_units.find((p) => p.id === WizardForm.puId);
    State.chassis = Data.chassis.find((c) => c.id === WizardForm.chassisId);
    State.drivers = [
      Data.drivers.find((d) => d.id === WizardForm.driver1Id),
      Data.drivers.find((d) => d.id === WizardForm.driver2Id),
    ];
    State.currentRound = 1;
    State.raceWeekends = {};
    State.driverPoints = {};

    // Validasi keselamatan: Jangan sampai ada yang undefined yang lolos
    if (!State.sponsor || !State.pu) {
      alert(
        "Terjadi kesalahan sistem saat menyimpan data aset. Harap refresh halaman."
      );
      return;
    }

    localStorage.setItem("f1_manager_save.json", JSON.stringify(State));

    UI.updateTopBar();
    UI.setupHQ();
    UI.showScreen("hq");
  },

  deleteSaveState() {
    if (
      confirm(
        "Apakah Anda yakin ingin menghapus file 'f1_manager_save.json' dan mengulang karir?"
      )
    ) {
      localStorage.removeItem("f1_manager_save.json");
      window.location.reload();
    }
  },
};

window.onload = () => Main.init();
