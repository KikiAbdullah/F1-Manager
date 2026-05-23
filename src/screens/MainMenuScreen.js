// ============================================================
// Main Menu Screen — F1 Manager 2026
// Matches visual style of data/index.html
// ============================================================

import { store } from "../core/store.js";
import { router } from "../core/router.js";
import {
  resetProgress,
  hasProgress,
  downloadSaveFile,
  importSaveFile,
} from "../core/persistence.js";

export function renderMainMenu() {
  const el = document.getElementById("screen-main-menu");
  if (!el) return;

  const playerTeamMeta = store.get("playerTeamMeta");
  const hasGame = !!playerTeamMeta?.createdTeamId;
  const saveExists = hasProgress();

  const team = store.get("playerTeam");
  const gs = store.get("gameState");
  const teamName = team?.name ?? "UNASSIGNED";
  const seasonId = gs?.currentSeasonId ?? "2026";
  const round = gs?.currentRound ?? 0;
  const points = team?.performance_state?.points ?? 0;

  el.innerHTML = `
    <div class="main-menu-bg">

      <!-- Animated sparks overlay -->
      <div class="menu-sparks" id="menuSparks"></div>

      <!-- Logo -->
      <div class="game-logo" id="menuLogo">
        <h1>F1<span class="accent">MANAGER</span></h1>
        <div class="sub-title">SEASON 2026</div>
      </div>

      <!-- Layout wrapper (prevents buttons disappearing on small viewports) -->
      <div id="menuWrap" style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap;max-width:980px;width:100%;">

        <!-- Left: Actions -->
        <div style="min-width:320px;max-width:360px;flex:0 0 auto;">

          <div class="text-xs font-orbitron tracking-widest text-f1-dim" style="margin-top:26px;">PRIMARY</div>

          <nav class="menu-list" id="menuPrimary" style="margin-top:14px;max-height:52vh;overflow:auto;padding-right:8px;">
            ${
              hasGame
                ? `
            <button class="menu-item" id="btn-resume">
              <i class="ti ti-player-play"></i> Resume Career
            </button>`
                : ""
            }

            <button class="menu-item" id="btn-new-game" style="border-left-color: var(--accent-red);">
              <i class="ti ti-plus"></i> New Career
            </button>
          </nav>

          <div class="text-xs font-orbitron tracking-widest text-f1-dim" style="margin-top:18px;">SAVE & DATA</div>

          <nav class="menu-list" id="menuSaves" style="margin-top:14px;max-height:30vh;overflow:auto;padding-right:8px;">
            <button class="menu-item" id="btn-export" ${
              saveExists ? "" : "disabled"
            }>
              <i class="ti ti-download"></i> Export Save
            </button>
            <button class="menu-item" id="btn-import">
              <i class="ti ti-upload"></i> Import Save
            </button>
            <button class="menu-item" id="btn-reset" ${
              saveExists ? "" : "disabled"
            }>
              <i class="ti ti-trash"></i> Reset Career
            </button>
          </nav>

          <div class="text-xs font-orbitron tracking-widest text-f1-dim" style="margin-top:18px;">SYSTEM</div>

          <nav class="menu-list" id="menuSystem" style="margin-top:14px;">
            <button class="menu-item" id="btn-settings">
              <i class="ti ti-settings"></i> Settings
            </button>
          </nav>
        </div>

        <!-- Right: Career snapshot -->
        <div style="flex:1 1 360px;min-width:280px;max-width:520px;margin-top:26px;">
          <div class="panel" id="careerSnapshot" style="background: rgba(26,26,32,0.88);">
            <div class="flex items-start justify-between" style="gap:12px;">
              <div>
                <div class="text-xs font-orbitron tracking-widest text-f1-dim">CAREER SNAPSHOT</div>
                <div class="font-orbitron" style="margin-top:6px;font-size:20px;letter-spacing:0.06em;">${teamName}</div>
                <div class="text-f1-dim text-xs font-orbitron" style="margin-top:4px;letter-spacing:0.12em;">SEASON ${seasonId} • ROUND ${String(
    round
  ).padStart(2, "0")}</div>
              </div>
              <div class="text-right">
                <div class="text-xs font-orbitron tracking-widest text-f1-dim">POINTS</div>
                <div class="font-orbitron" style="margin-top:6px;font-size:28px;color:var(--accent-cyan);">${points}</div>
              </div>
            </div>

            <div style="margin-top:14px;border-top:1px solid var(--panel-border);padding-top:12px;display:flex;gap:10px;flex-wrap:wrap;">
              <div style="flex:1 1 140px;min-width:140px;">
                <div class="text-xs font-orbitron tracking-widest text-f1-dim">SAVE STATUS</div>
                <div style="margin-top:6px;font-size:13px;">${
                  saveExists
                    ? '<span style="color:var(--accent-cyan)">FOUND</span>'
                    : '<span style="color:var(--accent-orange)">NONE</span>'
                }</div>
              </div>
              <div style="flex:1 1 140px;min-width:140px;">
                <div class="text-xs font-orbitron tracking-widest text-f1-dim">NEXT</div>
                <div style="margin-top:6px;font-size:13px;">${
                  hasGame ? "Continue career flow" : "Create a new team"
                }</div>
              </div>
            </div>
          </div>

          <div class="panel" style="margin-top:12px;background: rgba(26,26,32,0.70);">
            <div class="text-xs font-orbitron tracking-widest text-f1-dim">TIPS</div>
            <div style="margin-top:10px;font-size:13px;line-height:1.5;color:rgba(255,255,255,0.86);">
              Export save untuk backup sebelum reset. Import save akan me-reload halaman agar state konsisten.
            </div>
          </div>
        </div>

      </div>

      <input id="importSaveInput" type="file" accept="application/json" class="hidden" />

      <!-- Footer -->
      <div class="absolute bottom-6 right-8 text-xs font-orbitron text-f1-dim opacity-50 tracking-wider">
        F1 MANAGER 2026 &nbsp;|&nbsp; V1.0.0
      </div>
    </div>
  `;

  // ---- GSAP Entrance Animations ----
  if (window.gsap) {
    // Fail-safe: ensure visibility is restored even if animation gets interrupted.
    gsap.set(["#menuLogo", "#menuWrap", ".menu-item"], {
      opacity: 1,
      clearProps: "transform",
    });
    gsap.from("#menuLogo", {
      opacity: 0,
      x: -60,
      duration: 0.9,
      ease: "power3.out",
    });
    gsap.from(
      [
        "#menuPrimary .menu-item",
        "#menuSaves .menu-item",
        "#menuSystem .menu-item",
      ],
      {
        opacity: 0,
        x: -30,
        duration: 0.45,
        stagger: 0.06,
        delay: 0.25,
        ease: "power2.out",
        onComplete: () => {
          // Prevent the "stuck invisible" state.
          document.querySelectorAll(".menu-item").forEach((n) => {
            n.style.opacity = "1";
            n.style.transform = "none";
          });
        },
      }
    );
  }

  // ---- Howler ambient ----
  // (Audio deferred to avoid autoplay block — plays on first interaction)

  // ---- Button Listeners ----
  document.getElementById("btn-new-game")?.addEventListener("click", () => {
    router.goTo("create-team");
  });

  document.getElementById("btn-resume")?.addEventListener("click", async () => {
    if (store.get("playerTeam")) {
      router.goTo("dashboard");
    } else {
      showToast("No saved game found. Start a New Career.");
    }
  });

  document.getElementById("btn-export")?.addEventListener("click", () => {
    downloadSaveFile();
    showToast("Save exported.");
  });

  const importInput = document.getElementById("importSaveInput");
  document.getElementById("btn-import")?.addEventListener("click", () => {
    importInput?.click();
  });
  importInput?.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    importSaveFile(f, (ok, err) => {
      if (ok) {
        showToast("Save imported. Reloading…");
        setTimeout(() => location.reload(), 250);
      } else {
        showToast("Import failed: " + (err?.message ?? "Unknown error"));
      }
    });
  });

  document.getElementById("btn-reset")?.addEventListener("click", () => {
    resetProgress();
    showToast("Career reset. Reloading…");
    setTimeout(() => location.reload(), 250);
  });

  document.getElementById("btn-settings")?.addEventListener("click", () => {
    _openSettingsModal();
  });

  // Hover SFX via Howler
  document.querySelectorAll(".menu-item").forEach((btn) => {
    btn.addEventListener("mouseenter", () => playHoverSfx());
  });
}

function _openSettingsModal() {
  document.querySelector(".modal-overlay")?.remove();

  const currentSpeed = store.get("gameState")?.gameSpeedMultiplier ?? 1;
  const html = `
    <div class="modal-overlay">
      <div class="modal-box">
        <div class="modal-header">
          <span class="modal-title">SETTINGS</span>
          <button class="modal-close-btn" id="modalCloseBtn"><i class="ti ti-x"></i></button>
        </div>
        <div class="modal-body">
          <div class="text-xs font-orbitron tracking-widest text-f1-dim">GAME SPEED</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
            ${[0.5, 1, 2, 4]
              .map(
                (v) => `
              <button class="f1-btn ${
                v === currentSpeed ? "f1-btn-primary" : "f1-btn-secondary"
              }" data-speed="${v}">
                x${v}
              </button>
            `
              )
              .join("")}
          </div>
          <div class="text-xs text-f1-dim" style="margin-top:14px;line-height:1.45;">
            Catatan: ini menyimpan preferensi di memory saja untuk sekarang.
            Kalau kamu mau, kita bisa simpan ini ke save file juga.
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", html);
  document.getElementById("modalCloseBtn")?.addEventListener("click", () => {
    document.querySelector(".modal-overlay")?.remove();
  });
  document.querySelectorAll("[data-speed]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = Number(btn.dataset.speed);
      const gs = store.get("gameState") ?? {
        currentSeasonId: "2026",
        currentRound: 0,
      };
      store.set("gameState", { ...gs, gameSpeedMultiplier: v });
      showToast("Game speed set to x" + v);
      document.querySelector(".modal-overlay")?.remove();
    });
  });
}

let _hoverSound = null;
function playHoverSfx() {
  try {
    if (!_hoverSound) {
      _hoverSound = new Howl({
        src: ["https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3"],
        volume: 0.25,
        preload: true,
      });
    }
    _hoverSound.play();
  } catch (e) {
    /* audio not critical */
  }
}
