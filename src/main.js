// ============================================================
// App Entry Point — F1 Manager 2026
// ============================================================

import {
  loadMasterDataJSON,
  saveProgress,
  loadProgress,
  resetProgress,
  hasProgress,
} from "./core/persistence.js";
import { store } from "./core/store.js";
import { router } from "./core/router.js";
import { renderMainMenu } from "./screens/MainMenuScreen.js";
import { renderCreateTeam } from "./screens/CreateTeamScreen.js";
import { renderDashboard } from "./screens/DashboardScreen.js";
import { renderRace } from "./screens/RaceScreen.js";
import { renderPersonnel } from "./screens/PersonnelScreen.js";
import { renderFinance } from "./screens/FinanceScreen.js";
import { renderRnD } from "./screens/RnDScreen.js";
import { renderCalendar } from "./screens/CalendarScreen.js";

// ---- Toast helper (globally accessible) ----
export function showToast(msg, duration = 3000) {
  const toast = document.getElementById("toast");
  const inner = document.getElementById("toast-inner");
  if (!toast || !inner) return;
  inner.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add("hidden"), duration);
}
window.showToast = showToast;

// Expose persistence helpers for quick debugging
window.__f1 = {
  saveProgress,
  loadProgress,
  resetProgress,
};

// ---- Loading helpers ----
function setLoading(text) {
  const el = document.getElementById("loading-text");
  if (el) el.textContent = text;
}

async function hideLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;
  if (window.gsap) {
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => overlay.remove(),
    });
  } else {
    overlay.remove();
  }
}

// ---- Boot ----
async function boot() {
  setLoading("LOADING DATA…");

  // 1. Load master data from local JSON
  const masterData = await loadMasterDataJSON();
  store.merge(masterData);

  // 2. Load progress from localStorage if exists
  let loaded = false;
  if (hasProgress()) {
    const save = loadProgress();
    if (save) {
      store.merge(save);
      loaded = true;
    }
  }

  // 3. Register screen renderers
  router.onEnter("main-menu", () => renderMainMenu());
  router.onEnter("create-team", () => renderCreateTeam());
  router.onEnter("dashboard", (p) => renderDashboard(p));
  router.onEnter("race", (p) => renderRace(p));
  router.onEnter("personnel", () => renderPersonnel());
  router.onEnter("finance", () => renderFinance());
  router.onEnter("rnd", () => renderRnD());
  router.onEnter("calendar", () => renderCalendar());

  setLoading("READY");
  renderMainMenu();
  await hideLoading();
}

boot().catch((err) => {
  console.error("[Boot] Fatal error:", err);
  document.getElementById("loading-text").textContent = "ERROR: " + err.message;
});
