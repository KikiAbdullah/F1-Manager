// ============================================================
// Personnel Screen — F1 Manager 2026
// Driver & Staff management panel
// ============================================================

import { store } from "../core/store.js";
import { router } from "../core/router.js";

export function renderPersonnel() {
  const el = document.getElementById("screen-personnel");
  if (!el) return;

  const team = store.get("playerTeam");
  const allP = store.get("allPersonnel") ?? [];
  const drivers = allP.filter((p) => p.role === "Driver");
  const staff = allP.filter((p) => p.role !== "Driver");
  const teamColor = team?.color ?? "#ff8700";

  const myDrivers = drivers.filter(
    (d) => d.id === team?.driver1_id || d.id === team?.driver2_id
  );
  const otherDrivers = drivers.filter(
    (d) => d.id !== team?.driver1_id && d.id !== team?.driver2_id
  );

  el.innerHTML = `
    <div class="flex flex-col h-full bg-f1-dark">

      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-3 bg-black/40 border-b border-f1-border">
        <button class="f1-btn f1-btn-secondary" id="btn-back">
          <i class="ti ti-arrow-left"></i> Dashboard
        </button>
        <div class="font-orbitron text-lg tracking-wider"><i class="ti ti-users nav-svg"></i> PERSONNEL</div>
        <div></div>
      </div>

      <div class="flex-1 overflow-y-auto p-5">

        <!-- My Drivers -->
        <h3 class="font-orbitron text-sm tracking-widest text-f1-cyan mb-3">
          <i class="ti ti-steering-wheel nav-svg"></i> MY DRIVERS
        </h3>
        <div class="grid grid-cols-2 gap-4 mb-6">
          ${
            myDrivers.map((d) => _personnelCard(d, teamColor)).join("") ||
            '<div class="text-f1-dim text-sm">No drivers assigned.</div>'
          }
        </div>

        <!-- Staff -->
        <h3 class="font-orbitron text-sm tracking-widest text-f1-cyan mb-3">
          <i class="ti ti-briefcase nav-svg"></i> KEY STAFF
        </h3>
        <div class="grid grid-cols-3 gap-3 mb-6">
          ${
            staff
              .slice(0, 6)
              .map((s) => _staffCard(s))
              .join("") ||
            '<div class="text-f1-dim text-sm">No staff data.</div>'
          }
        </div>

        <!-- Available Drivers (Scouting) -->
        <h3 class="font-orbitron text-sm tracking-widest text-f1-orange mb-3">
          <i class="ti ti-eye nav-svg"></i> TRANSFER MARKET
        </h3>
        <table class="personnel-table">
          <thead><tr>
            <th>DRIVER</th><th>NATIONALITY</th><th>PACE</th><th>RACECRAFT</th><th>OVERALL</th><th>TEAM</th>
          </tr></thead>
          <tbody>
            ${otherDrivers
              .slice(0, 15)
              .map((d) => {
                const s = d.stats ?? {};
                const ovr = Math.round(
                  ((s.pace ?? 70) +
                    (s.racecraft ?? 70) +
                    (s.concentration ?? 70)) /
                    3
                );
                return `
              <tr>
                <td class="font-bold">${d.full_name ?? d.name ?? d.id}</td>
                <td class="text-f1-dim">${d.nationality ?? "–"}</td>
                <td><div class="prog-bar w-16"><div class="prog-fill bg-cyan-400" style="width:${
                  s.pace ?? 60
                }%"></div></div></td>
                <td><div class="prog-bar w-16"><div class="prog-fill" style="width:${
                  s.racecraft ?? 60
                }%;background:var(--accent-orange)"></div></div></td>
                <td class="font-digits">${ovr}</td>
                <td class="text-f1-dim text-xs">${d.team_id ?? "–"}</td>
              </tr>`;
              })
              .join("")}
          </tbody>
        </table>

      </div>
    </div>
  `;

  document
    .getElementById("btn-back")
    ?.addEventListener("click", () => router.goTo("dashboard"));
  if (window.gsap)
    gsap.from(".personnel-table tbody tr", {
      opacity: 0,
      x: -10,
      stagger: 0.03,
      duration: 0.25,
    });
}

function _personnelCard(d, color) {
  const s = d.stats ?? {};
  const ovr = Math.round(
    ((s.pace ?? 70) + (s.racecraft ?? 70) + (s.concentration ?? 70)) / 3
  );
  return `
    <div class="panel" style="border-top:3px solid ${color}">
      <div class="flex justify-between items-start mb-2">
        <div>
          <div class="text-xs text-f1-dim">${d.nationality ?? ""}</div>
          <div class="text-lg font-bold">${d.full_name ?? d.name}</div>
        </div>
        <div class="font-digits text-xl" style="color:${color}">${ovr}</div>
      </div>
      <div class="stat-bar-wrap"><div class="stat-bar-label"><span>PACE</span><span>${
        s.pace ?? "–"
      }</span></div><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${
    s.pace ?? 50
  }%"></div></div></div>
      <div class="stat-bar-wrap"><div class="stat-bar-label"><span>RACECRAFT</span><span>${
        s.racecraft ?? "–"
      }</span></div><div class="stat-bar-track"><div class="stat-bar-fill orange" style="width:${
    s.racecraft ?? 50
  }%"></div></div></div>
      <div class="stat-bar-wrap"><div class="stat-bar-label"><span>AWARENESS</span><span>${
        s.awareness ?? s.concentration ?? "–"
      }</span></div><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${
    s.awareness ?? s.concentration ?? 50
  }%;background:var(--accent-cyan)"></div></div></div>
      <div class="text-xs text-f1-dim mt-2">Contract: ${
        d.contract_end_year ?? "2026+"
      }</div>
    </div>
  `;
}

function _staffCard(s) {
  return `
    <div class="panel">
      <div class="text-xs text-f1-dim font-orbitron mb-1">${
        s.role ?? "Staff"
      }</div>
      <div class="font-bold text-sm mb-2">${s.full_name ?? s.name ?? s.id}</div>
      <div class="text-xs text-f1-dim">${s.nationality ?? ""}</div>
      <div class="prog-bar mt-2"><div class="prog-fill bg-cyan-400" style="width:${
        s.career_rating ?? s.stats?.leadership ?? 60
      }%"></div></div>
    </div>
  `;
}
