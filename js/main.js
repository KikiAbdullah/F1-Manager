// Global App State
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
  raceStartCompound: "medium",
};

// Wizard Selection Memory
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
  async init() {
    const isDataLoaded = await Data.loadAll();
    if (!isDataLoaded) return;

    const rawJsonFile = localStorage.getItem("f1_manager_save.json");

    if (rawJsonFile) {
      try {
        State = JSON.parse(rawJsonFile);
        if (!State.raceWeekends) State.raceWeekends = {};
        if (!State.driverPoints) State.driverPoints = {};
        if (!State.raceStartCompound) State.raceStartCompound = "medium";
        UI.updateTopBar();
        UI.setupHQ();
        setTimeout(() => UI.showScreen("hq"), 600);
      } catch (e) {
        console.error("Save file corrupt, loading wizard...", e);
        this.loadWizardAssets();
      }
    } else {
      this.loadWizardAssets();
    }
  },

  loadWizardAssets() {
    UI.renderHorizontalCards("container-sponsor", Data.sponsors, "sponsorId");
    UI.renderHorizontalCards("container-team-chief", Data.team_chiefs, "teamChiefId");
    UI.renderHorizontalCards("container-tech-chief", Data.tech_chiefs, "techChiefId");
    UI.renderHorizontalCards("container-pu", Data.power_units, "puId");
    UI.renderHorizontalCards("container-chassis", Data.chassis, "chassisId");
    UI.renderHorizontalCards("container-drivers", Data.drivers, "driverId");

    Finance.calculateWizardBudget();
    UI.showScreen("new-career");
  },

  finalizeCareer(event) {
    event.preventDefault();
    const inputName = document.getElementById("input-team-name").value.trim();

    if (!inputName) { alert("Harap tentukan nama konstruktor!"); UI.moveWizard(-3); return; }
    if (!WizardForm.sponsorId || !WizardForm.teamChiefId || !WizardForm.techChiefId ||
        !WizardForm.puId || !WizardForm.chassisId || !WizardForm.driver1Id || !WizardForm.driver2Id) {
      alert("Lengkapi semua pilihan sebelum meluncurkan tim!"); return;
    }
    if (WizardForm.driver1Id === WizardForm.driver2Id) {
      alert("Driver 1 dan 2 tidak boleh sama!"); return;
    }

    State.teamName = inputName;
    State.budget = Finance.currentWizardBudget;
    State.sponsor = Data.sponsors.find((s) => (s.id || s.team_id) === WizardForm.sponsorId);
    State.teamChief = Data.team_chiefs.find((s) => s.id === WizardForm.teamChiefId);
    State.techChief = Data.tech_chiefs.find((s) => s.id === WizardForm.techChiefId);
    State.pu = Data.power_units.find((p) => p.id === WizardForm.puId);
    State.chassis = Data.chassis.find((c) => c.id === WizardForm.chassisId);
    State.drivers = [
      Data.drivers.find((d) => d.id === WizardForm.driver1Id),
      Data.drivers.find((d) => d.id === WizardForm.driver2Id),
    ];
    State.currentRound = 1;
    State.raceWeekends = {};
    State.driverPoints = {};
    State.raceStartCompound = "medium";

    if (!State.sponsor || !State.pu) {
      alert("Terjadi kesalahan saat menyimpan. Silakan refresh."); return;
    }

    localStorage.setItem("f1_manager_save.json", JSON.stringify(State));
    UI.updateTopBar();
    UI.setupHQ();
    UI.showScreen("hq");
  },

  deleteSaveState() {
    if (confirm("Hapus save data dan mulai karir baru?")) {
      localStorage.removeItem("f1_manager_save.json");
      window.location.reload();
    }
  },
};

window.onload = () => Main.init();
