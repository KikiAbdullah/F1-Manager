// ============================================================
// Persistence Layer — JSON/LocalStorage for F1 Manager 2026
// Handles loading master data from /data/*.json, and
// saving/loading user progress to localStorage and .json files.
// ============================================================

const MASTER_PATH = "/data/";
const DATA_FILES = {
  teams: "teams.json",
  drivers: "drivers.json",
  personnel: "drivers.json", // alias for now
  circuits: "circuits.json",
  schedules: "schedules.json",
  season: "seasons.json",
  powerUnits: "power_units.json",
  powerUnitSuppliers: "power_unit_suppliers.json",
  chassis: "chassis.json",
  sponsors: "sponsors.json",
};

// ---- Master Data Loader ----
export async function loadMasterDataJSON() {
  const keys = Object.keys(DATA_FILES);
  const results = {};
  await Promise.all(
    keys.map(async (k) => {
      try {
        const res = await fetch(MASTER_PATH + DATA_FILES[k]);
        const val = await res.json();
        // Some files use .data, e.g. { data: [...] }
        results[k] = val.data ?? val;
      } catch (e) {
        // If failed, set as empty array
        results[k] = [];
      }
    })
  );
  return results;
}

// ---- Persistence: LocalStorage ----
const DB_KEY = "f1_manager_save";

export function saveProgress(saveObj) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(saveObj));
  } catch (_) {}
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

export function resetProgress() {
  localStorage.removeItem(DB_KEY);
}

export function hasProgress() {
  return !!localStorage.getItem(DB_KEY);
}

// ---- Export/Import Save File ----
export function downloadSaveFile() {
  const data = localStorage.getItem(DB_KEY);
  if (!data) return;
  const blob = new Blob([data], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "f1_manager_save.json";
  a.click();
}

export function importSaveFile(file, cb) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      localStorage.setItem(DB_KEY, e.target.result);
      cb && cb(true);
    } catch (err) {
      cb && cb(false, err);
    }
  };
  reader.readAsText(file);
}
