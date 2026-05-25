import { store } from "../core/store.js";
import { router } from "../core/router.js";
import { saveProgress } from "../core/persistence.js";
import { showToast } from "../components/toast.js";

// ============================================================
// Constants
// ============================================================

const TOTAL_STEPS = 7;

const STEP_RENDERERS = {
  1: renderIdentityStep,
  2: renderAmbitionStep,
  3: renderDriverSelectionStep,
  4: renderPersonnelSelectionStep,
  5: renderPowerUnitStep,
  6: renderChassisStep,
  7: renderConfirmationStep,
};

const TEAM_CHIEF_PHOTO_URL = "./assets/images/team-chief.png";

const TECH_CHIEF_PHOTO_URL = "./assets/images/tech-chief.png";

function getSelectedTier() {
  return (
    ambitionLevels[wizardState.team.ambitionTier] ||
    Object.values(ambitionLevels)[0]
  );
}

function renderBudgetPill() {
  const remaining = getRemainingBudget();

  return `
    <div class="f1-budget-pill" title="Saldo Anggaran">
      <i class="ti ti-cash"></i>
      <span>Saldo</span>
      <strong>${moneyCompact(remaining)}</strong>
    </div>
  `;
}

function canAffordDeltaSpend(deltaSpend) {
  // deltaSpend = additional cost compared to current selection
  const tier = ambitionLevels[wizardState.team.ambitionTier];
  const nextRemaining =
    tier.financials.initial_budget_idr -
    (calculateTotalSpend() + (Number(deltaSpend) || 0));
  return nextRemaining >= 0;
}

function budgetToast(deltaSpend) {
  const tier = ambitionLevels[wizardState.team.ambitionTier];
  const after =
    tier.financials.initial_budget_idr -
    (calculateTotalSpend() + (Number(deltaSpend) || 0));
  showToast(`Saldo tidak cukup. Sisa ${moneyCompact(after)}.`);
}

export const ambitionLevels = {
  local_indonesia: {
    tier: "local_indonesia",

    profile: {
      label: "LOCAL INDONESIAN ENTRANT",

      short_description:
        "Organisasi Formula independen asal Indonesia yang didukung sponsor domestik dan memiliki eksposur internasional yang masih berkembang.",

      lore: "Tim ini memasuki kompetisi Formula dengan dukungan konglomerat nasional, perusahaan energi regional, dan investor teknologi Asia Tenggara. Meskipun belum memiliki infrastruktur teknik sekelas tim elite Eropa, organisasi ini mengandalkan ekspansi komersial agresif, efisiensi operasional, dan dukungan fanatik dari pasar motorsport Indonesia.",

      prestige_rating: 48,
      stability_rating: 62,

      headquarters: {
        country: "Indonesia",
        city: "Jakarta",
      },

      public_perception: {
        fan_support: "high",
        media_pressure: "moderate",
        international_reputation: "developing",
      },
    },

    financials: {
      // Raised so the cheapest valid lineup (2 drivers + PU + chassis) is always selectable.
      initial_budget_idr: 1200000000000,

      estimated_team_value_idr: 1200000000000,

      budget_tier: "emerging",

      investment_power: 58,

      cost_efficiency: 82,

      sponsor_dependency: 88,

      revenue_breakdown: {
        sponsorship_percentage: 72,
        merchandise_percentage: 8,
        prize_pool_percentage: 10,
        investor_percentage: 10,
      },
    },

    facilities: {
      factory_level: 2,

      wind_tunnel_level: 1,

      simulator_level: 52,

      cfd_capacity: 48,

      manufacturing_capability: 55,

      infrastructure_description:
        "Fasilitas masih berkembang dan sebagian besar pengembangan aerodinamika bergantung pada outsourcing internasional.",
    },

    workforce: {
      staff_quality: 60,

      recruitment_strength: 58,

      driver_attractiveness: 50,

      engineering_depth: 54,

      academy_strength: 65,

      workforce_description:
        "Organisasi fokus merekrut talenta undervalued dari Asia Tenggara dan veteran motorsport internasional dengan biaya efisien.",
    },

    sponsors: {
      primary_region: "Southeast Asia",

      sponsor_profile: [
        {
          category: "Banking",
          example: "Bank Central Asia",
        },

        {
          category: "Telecommunications",
          example: "Telkomsel",
        },

        {
          category: "Energy",
          example: "Pertamina",
        },

        {
          category: "Consumer Goods",
          example: "Indomie",
        },
      ],

      commercial_identity:
        "Ekosistem komersial sangat bergantung pada pasar domestik Indonesia dan kebanggaan nasional.",

      sponsor_confidence: 68,
    },

    competitive_identity: {
      philosophy: "efficient_growth",

      strengths: [
        "Basis fan regional sangat kuat",
        "Fleksibilitas sponsor tinggi",
        "Biaya operasional lebih efisien",
      ],

      weaknesses: [
        "Keterbatasan engineer elite",
        "Infrastruktur aerodinamika belum matang",
        "Daya tarik pembalap masih rendah",
      ],

      long_term_goal:
        "Menjadi tim Formula paling kompetitif di Asia Tenggara dan penantang reguler papan tengah.",
    },

    ai_behavior: {
      aggression_level: "medium",

      development_focus: "long_term_growth",

      sponsor_expectation: "high_visibility",

      transfer_market_behavior: "value_hunting",

      political_influence: "regional",

      risk_tolerance: 72,
    },
  },

  asian_contender: {
    tier: "asian_contender",

    profile: {
      label: "ASIAN INDUSTRIAL CONTENDER",

      short_description:
        "Konstruktor Asia modern dengan dukungan korporasi teknologi dan industri multinasional.",

      lore: "Didukung grup industri besar Asia, organisasi ini dibangun dengan filosofi modern berbasis data, efisiensi manufaktur, dan investasi teknologi jangka panjang. Ambisi utamanya adalah menantang dominasi tradisional tim-tim Eropa dalam beberapa musim ke depan.",

      prestige_rating: 74,
      stability_rating: 80,

      headquarters: {
        country: "Singapore",
        city: "Singapore",
      },

      public_perception: {
        fan_support: "high",
        media_pressure: "high",
        international_reputation: "strong",
      },
    },

    financials: {
      initial_budget_idr: 1750000000000,

      estimated_team_value_idr: 3200000000000,

      budget_tier: "high",

      investment_power: 82,

      cost_efficiency: 78,

      sponsor_dependency: 62,

      revenue_breakdown: {
        sponsorship_percentage: 55,
        merchandise_percentage: 12,
        prize_pool_percentage: 18,
        investor_percentage: 15,
      },
    },

    facilities: {
      factory_level: 3,

      wind_tunnel_level: 3,

      simulator_level: 74,

      cfd_capacity: 79,

      manufacturing_capability: 80,

      infrastructure_description:
        "Fasilitas modern berbasis teknologi tinggi dengan fokus pada simulasi dan iterasi pengembangan cepat.",
    },

    workforce: {
      staff_quality: 78,

      recruitment_strength: 76,

      driver_attractiveness: 72,

      engineering_depth: 80,

      academy_strength: 70,

      workforce_description:
        "Pipeline rekrutmen internasional kuat dengan kombinasi engineer senior dan talenta teknologi muda Asia.",
    },

    sponsors: {
      primary_region: "Asia-Pacific",

      sponsor_profile: [
        {
          category: "Technology",
          example: "Samsung",
        },

        {
          category: "Semiconductor",
          example: "TSMC",
        },

        {
          category: "Airlines",
          example: "Singapore Airlines",
        },

        {
          category: "Fintech",
          example: "Grab",
        },
      ],

      commercial_identity:
        "Branding komersial modern berbasis teknologi dengan penetrasi pasar Asia-Pasifik yang agresif.",

      sponsor_confidence: 88,
    },

    competitive_identity: {
      philosophy: "innovation_first",

      strengths: [
        "Sistem simulasi sangat maju",
        "Akses modal besar",
        "Ekspansi fasilitas cepat",
      ],

      weaknesses: ["Heritage motorsport belum kuat", "Tekanan investor tinggi"],

      long_term_goal:
        "Menjadi penantang gelar dunia dan simbol dominasi motorsport Asia modern.",
    },

    ai_behavior: {
      aggression_level: "high",

      development_focus: "technology_acceleration",

      sponsor_expectation: "global_visibility",

      transfer_market_behavior: "aggressive",

      political_influence: "growing",

      risk_tolerance: 84,
    },
  },

  global_powerhouse: {
    tier: "global_powerhouse",

    profile: {
      label: "GLOBAL MOTORSPORT POWERHOUSE",

      short_description:
        "Organisasi motorsport elite global dengan skala operasional kelas juara dunia.",

      lore: "Tim ini merupakan kekuatan dominan dalam dunia Formula modern dengan dukungan sponsor multinasional, engineer kelas dunia, dan budaya kompetitif yang dibangun selama puluhan tahun. Ekspektasi internal mereka bukan sekadar menang balapan, tetapi mendominasi era kompetisi.",

      prestige_rating: 97,
      stability_rating: 94,

      headquarters: {
        country: "United Kingdom",
        city: "Milton Keynes",
      },

      public_perception: {
        fan_support: "massive",
        media_pressure: "extreme",
        international_reputation: "elite",
      },
    },

    financials: {
      initial_budget_idr: 3200000000000,

      estimated_team_value_idr: 9200000000000,

      budget_tier: "elite",

      investment_power: 98,

      cost_efficiency: 90,

      sponsor_dependency: 40,

      revenue_breakdown: {
        sponsorship_percentage: 45,
        merchandise_percentage: 18,
        prize_pool_percentage: 25,
        investor_percentage: 12,
      },
    },

    facilities: {
      factory_level: 5,

      wind_tunnel_level: 5,

      simulator_level: 96,

      cfd_capacity: 98,

      manufacturing_capability: 97,

      infrastructure_description:
        "Kompleks fasilitas balap terintegrasi kelas dunia dengan teknologi aerodinamika dan simulasi paling mutakhir.",
    },

    workforce: {
      staff_quality: 96,

      recruitment_strength: 95,

      driver_attractiveness: 98,

      engineering_depth: 97,

      academy_strength: 92,

      workforce_description:
        "Ekosistem engineering elite dengan kemampuan merekrut talenta motorsport terbaik dari seluruh dunia.",
    },

    sponsors: {
      primary_region: "Global",

      sponsor_profile: [
        {
          category: "Cloud Computing",
          example: "Oracle",
        },

        {
          category: "Energy",
          example: "Shell",
        },

        {
          category: "Luxury",
          example: "TAG Heuer",
        },

        {
          category: "Technology",
          example: "AMD",
        },
      ],

      commercial_identity:
        "Platform komersial global premium dengan sponsor multinasional papan atas.",

      sponsor_confidence: 99,
    },

    competitive_identity: {
      philosophy: "championship_or_nothing",

      strengths: [
        "Ekosistem teknikal elite",
        "Skala operasional masif",
        "Daya tarik pembalap terbaik dunia",
      ],

      weaknesses: [
        "Tekanan politik sangat tinggi",
        "Biaya operasional ekstrem",
      ],

      long_term_goal:
        "Mempertahankan dominasi global dan memaksimalkan perolehan gelar dunia.",
    },

    ai_behavior: {
      aggression_level: "extreme",

      development_focus: "championship",

      sponsor_expectation: "maximum_exposure",

      transfer_market_behavior: "predatory",

      political_influence: "dominant",

      risk_tolerance: 90,
    },
  },
};

// ============================================================
// Wizard State
// ============================================================

const wizardState = {
  currentStep: 1,

  team: {
    identity: {
      name: "",
      shortName: "",

      base: {
        country: "",
        city: "",
      },
    },

    ambitionTier: "local_indonesia",

    lineup: {
      driverIds: [],

      teamChiefId: null,
      technicalChiefId: null,

      powerUnitId: null,
      chassisId: null,
    },
  },

  masterData: {
    drivers: [],
    driversById: {},

    teamChiefs: [],
    teamChiefsById: {},

    technicalChiefs: [],
    technicalChiefsById: {},

    powerUnits: [],
    powerUnitsById: {},

    chassis: [],
    chassisById: {},

    sponsors: [],
  },
};

// ============================================================
// Entry
// ============================================================

export async function renderCreateTeam() {
  resetWizardState();

  await loadPickerData();

  const el = document.getElementById("screen-create-team");

  if (!el) return;

  el.innerHTML = `
    <div class="wizard-overlay">
      <div class="wizard-box">

        <div class="wizard-header">

          <span class="wizard-title">
            <i class="ti ti-flag nav-svg"></i>
            Create My Team
          </span>

          <div class="wizard-steps">
            ${Array.from({ length: TOTAL_STEPS })
              .map(() => `<div class="step-dot"></div>`)
              .join("")}
          </div>

        </div>

        <div class="wizard-body" id="wizardBody"></div>

        <div class="flex gap-3 px-7 pb-6 pt-2 justify-between items-center border-t border-f1-border bg-black/20">

          <button class="f1-btn f1-btn-secondary" id="btnBack">
            <i class="ti ti-arrow-left"></i>
            Back
          </button>

          <div class="text-xs text-f1-dim font-orbitron" id="wizardStepLabel"></div>

          <button class="f1-btn f1-btn-primary" id="btnNext">
            Next
            <i class="ti ti-arrow-right"></i>
          </button>

        </div>

      </div>
    </div>
  `;

  bindGlobalEvents();

  renderCurrentStep();
}

// ============================================================
// State
// ============================================================

function resetWizardState() {
  wizardState.currentStep = 1;

  wizardState.team = {
    identity: {
      name: "",
      shortName: "",
      base: {
        country: "",
        city: "",
      },
    },

    ambitionTier: "local_indonesia",

    lineup: {
      driverIds: [],

      teamChiefId: null,
      technicalChiefId: null,

      powerUnitId: null,
      chassisId: null,
    },
  };
}

// ============================================================
// Loading
// ============================================================

async function loadPickerData() {
  let personnel = store.get("allPersonnel") ?? [];

  let drivers = personnel.filter((p) => p.role === "Driver");

  if (!drivers.length) {
    const r = await fetch("./data/drivers.json");
    drivers = ((await r.json()).data ?? []).map((d) => ({
      ...d,
      role: "Driver",
    }));
  }

  const [puRes, chassisRes, sponsorRes, teamChiefRes, techChiefRes] =
    await Promise.all([
      fetch("./data/power_units.json"),
      fetch("./data/chassis.json"),
      fetch("./data/sponsors.json"),
      fetch("./data/team_chiefs.json"),
      fetch("./data/technical_chiefs.json"),
    ]);

  const powerUnits = (await puRes.json()).data ?? [];
  const chassis = (await chassisRes.json()).data ?? [];
  const sponsors = (await sponsorRes.json()).data ?? [];
  const teamChiefs = (await teamChiefRes.json()).data ?? [];
  const technicalChiefs = (await techChiefRes.json()).data ?? [];

  // Keep pickers predictable: cheapest items first.
  drivers.sort((a, b) => (a.price_idr ?? 0) - (b.price_idr ?? 0));
  powerUnits.sort((a, b) => (a.price_idr ?? 0) - (b.price_idr ?? 0));
  chassis.sort((a, b) => (a.price_idr ?? 0) - (b.price_idr ?? 0));
  teamChiefs.sort((a, b) => (a.price_idr ?? 0) - (b.price_idr ?? 0));
  technicalChiefs.sort((a, b) => (a.price_idr ?? 0) - (b.price_idr ?? 0));

  wizardState.masterData.drivers = drivers;
  wizardState.masterData.powerUnits = powerUnits;
  wizardState.masterData.chassis = chassis;
  wizardState.masterData.sponsors = sponsors;
  wizardState.masterData.teamChiefs = teamChiefs;
  wizardState.masterData.technicalChiefs = technicalChiefs;

  wizardState.masterData.driversById = normalize(drivers);
  wizardState.masterData.powerUnitsById = normalize(powerUnits);
  wizardState.masterData.chassisById = normalize(chassis);
  wizardState.masterData.teamChiefsById = normalize(teamChiefs);
  wizardState.masterData.technicalChiefsById = normalize(technicalChiefs);
}

function normalize(arr) {
  return arr.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

// ============================================================
// Rendering
// ============================================================

function renderCurrentStep() {
  const body = document.getElementById("wizardBody");

  if (!body) return;

  const label = document.getElementById("wizardStepLabel");

  if (label) {
    label.textContent = `STEP ${wizardState.currentStep} OF ${TOTAL_STEPS}`;
  }

  STEP_RENDERERS[wizardState.currentStep]?.(body);

  updateStepDots();
}

function updateStepDots() {
  document.querySelectorAll(".step-dot").forEach((dot, index) => {
    dot.classList.toggle("active", index + 1 <= wizardState.currentStep);
  });
}

// ============================================================
// Global Events
// ============================================================

function bindGlobalEvents() {
  document.getElementById("btnBack")?.addEventListener("click", handleBack);

  document.getElementById("btnNext")?.addEventListener("click", handleNext);

  document
    .getElementById("wizardBody")
    ?.addEventListener("click", handleWizardClick);
}

function handleBack() {
  if (wizardState.currentStep === 1) {
    router.goTo("main-menu");
    return;
  }

  wizardState.currentStep--;

  renderCurrentStep();
}

async function handleNext() {
  const valid = validateCurrentStep();

  if (!valid) return;

  // FINAL STEP
  if (wizardState.currentStep === TOTAL_STEPS) {
    await saveTeam();
    return;
  }

  wizardState.currentStep++;

  renderCurrentStep();

  document.getElementById("wizardBody")?.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function handleWizardClick(e) {
  const tierCard = e.target.closest("[data-tier]");

  if (tierCard) {
    wizardState.team.ambitionTier = tierCard.dataset.tier;

    renderCurrentStep();

    return;
  }

  const driverCard = e.target.closest("[data-driver-id]");

  if (driverCard) {
    if (driverCard.dataset.disabled === "1") {
      showToast("Saldo tidak cukup untuk memilih pembalap ini.");
      return;
    }
    toggleDriver(driverCard.dataset.driverId);

    return;
  }

  const teamChiefCard = e.target.closest("[data-team-chief-id]");

  if (teamChiefCard) {
    if (teamChiefCard.dataset.disabled === "1") {
      showToast("Saldo tidak cukup untuk memilih team chief ini.");
      return;
    }

    toggleTeamChief(teamChiefCard.dataset.teamChiefId);
    return;
  }

  const techChiefCard = e.target.closest("[data-technical-chief-id]");

  if (techChiefCard) {
    if (techChiefCard.dataset.disabled === "1") {
      showToast("Saldo tidak cukup untuk memilih technical chief ini.");
      return;
    }

    toggleTechnicalChief(techChiefCard.dataset.technicalChiefId);
    return;
  }

  const puCard = e.target.closest("[data-pu-id]");

  if (puCard) {
    if (puCard.disabled || puCard.getAttribute("aria-disabled") === "true") {
      showToast("Saldo tidak cukup untuk memilih power unit ini.");
      return;
    }

    // Guard again (in case DOM doesn't reflect latest budget state)
    const currentPuPrice =
      wizardState.masterData.powerUnitsById[wizardState.team.lineup.powerUnitId]
        ?.price_idr ?? 0;
    const nextPuPrice =
      wizardState.masterData.powerUnitsById[puCard.dataset.puId]?.price_idr ??
      0;
    const delta = Math.max(0, nextPuPrice - currentPuPrice);
    if (!canAffordDeltaSpend(delta)) {
      budgetToast(delta);
      return;
    }

    const body = document.getElementById("wizardBody");
    const prevScrollTop = body?.scrollTop ?? 0;
    const prevListScrollTop =
      body?.querySelector(".f1-pu-list")?.scrollTop ?? 0;

    wizardState.team.lineup.powerUnitId = puCard.dataset.puId;

    renderCurrentStep();

    if (body) body.scrollTop = prevScrollTop;
    const list = body?.querySelector(".f1-pu-list");
    if (list) list.scrollTop = prevListScrollTop;

    return;
  }

  const chassisCard = e.target.closest("[data-chassis-id]");

  if (chassisCard) {
    if (
      chassisCard.disabled ||
      chassisCard.getAttribute("aria-disabled") === "true"
    ) {
      showToast("Saldo tidak cukup untuk memilih chassis ini.");
      return;
    }

    // Guard again (in case DOM doesn't reflect latest budget state)
    const currentChPrice =
      wizardState.masterData.chassisById[wizardState.team.lineup.chassisId]
        ?.price_idr ?? 0;
    const nextChPrice =
      wizardState.masterData.chassisById[chassisCard.dataset.chassisId]
        ?.price_idr ?? 0;
    const delta = Math.max(0, nextChPrice - currentChPrice);
    if (!canAffordDeltaSpend(delta)) {
      budgetToast(delta);
      return;
    }

    const body = document.getElementById("wizardBody");
    const prevScrollTop = body?.scrollTop ?? 0;
    const prevListScrollTop =
      body?.querySelector(".f1-ch-list")?.scrollTop ?? 0;

    wizardState.team.lineup.chassisId = chassisCard.dataset.chassisId;

    renderCurrentStep();

    if (body) body.scrollTop = prevScrollTop;
    const list = body?.querySelector(".f1-ch-list");
    if (list) list.scrollTop = prevListScrollTop;
  }
}

// ============================================================
// STEP 4
// ============================================================

function renderPersonnelSelectionStep(body) {
  const lineup = wizardState.team.lineup;
  const hasTeamChief = Boolean(lineup.teamChiefId);
  const hasTechChief = Boolean(lineup.technicalChiefId);

  body.innerHTML = `
    <div class="f1-step-panel">
      <div class="f1-step3-header">
        <div class="f1-create-header">
          <div class="f1-create-subtitle"><span class="f1-accent-line"></span> STEP 4</div>
          <h2 class="f1-create-title">TEAM MANAGEMENT</h2>
          <p class="f1-header-desc">Pilih Team Chief dan Technical Chief. Klik kartu untuk memilih atau mengganti.</p>
        </div>

        <div class="f1-step-header-right">
          ${renderBudgetPill()}
          <div class="f1-car-indicators" aria-label="Selected management roles">
            <div class="f1-car-indicator ${
              hasTeamChief ? "active" : ""
            }" title="Team Chief">
              <i class="ti ti-crown"></i>
              <span>TEAM CHIEF</span>
            </div>
            <div class="f1-car-indicator ${
              hasTechChief ? "active" : ""
            }" title="Technical Chief">
              <i class="ti ti-settings"></i>
              <span>TECH CHIEF</span>
            </div>
          </div>
        </div>
      </div>

      <div class="text-xs text-f1-dim font-orbitron" style="margin-top:10px;letter-spacing:0.06em;">TEAM CHIEF</div>
      <div class="driver-select-grid" style="margin-top:8px;">
        ${wizardState.masterData.teamChiefs.map(renderTeamChiefCard).join("")}
      </div>

      <div class="text-xs text-f1-dim font-orbitron" style="margin-top:18px;letter-spacing:0.06em;">TECHNICAL CHIEF</div>
      <div class="driver-select-grid" style="margin-top:8px;">
        ${wizardState.masterData.technicalChiefs
          .map(renderTechnicalChiefCard)
          .join("")}
      </div>
    </div>
  `;
}

function renderTeamChiefCard(chief) {
  const selected = wizardState.team.lineup.teamChiefId === chief.id;

  // Disable card if selecting it would exceed budget.
  let disabled = false;
  if (!selected) {
    const current =
      wizardState.masterData.teamChiefsById[wizardState.team.lineup.teamChiefId]
        ?.price_idr ?? 0;
    const next = chief.price_idr ?? 0;
    const delta = Math.max(0, next - current);
    disabled = !canAffordDeltaSpend(delta);
  }

  const stats = chief.stats ?? {};
  const overall =
    chief.career_rating ??
    Math.round(
      avgNum([stats.leadership, stats.strategy, stats.technical_understanding])
    );

  const leadership = stats.leadership ?? 80;
  const strategy = stats.strategy ?? 80;
  const technical = stats.technical_understanding ?? 80;

  return `
    <div
      class="f1-driver-card ${selected ? "selected" : ""} ${
    disabled ? "opacity-40 pointer-events-none" : ""
  }"
      data-team-chief-id="${chief.id}"
      data-disabled="${disabled ? "1" : "0"}"
    >
      ${selected ? '<div class="f1-driver-selected-icon">✔</div>' : ""}

      <div class="f1-driver-top-right">
        <div>Rp ${moneyCompact(
          chief.price_idr
        )} <span class="dim-text">/PA</span></div>
        <div style="margin-top: 4px;"><span class="dim-text">ROLE:</span> ${
          chief.role ?? "-"
        }</div>
      </div>

      <div class="f1-driver-stats-right">
        <div class="f1-driver-overall-wrap">
          <span class="f1-driver-star">★</span>
          <span class="f1-driver-overall">${overall ?? 80}</span>
        </div>
        <div class="f1-driver-substats">
          <div class="substat"><span class="dim-text">LEA</span> ${leadership}</div>
          <div class="substat"><span class="dim-text">STR</span> ${strategy}</div>
          <div class="substat"><span class="dim-text">TEC</span> ${technical}</div>
        </div>
      </div>

      <img
        src="${TEAM_CHIEF_PHOTO_URL}"
        class="f1-team-image"
      />

      <div class="f1-driver-bottom">
        <div class="f1-driver-first-name">${chief.first_name ?? "-"}</div>
        <div class="f1-driver-last-name">${chief.last_name ?? "-"}</div>
      </div>
    </div>
  `;
}

function renderTechnicalChiefCard(chief) {
  const selected = wizardState.team.lineup.technicalChiefId === chief.id;

  // Disable card if selecting it would exceed budget.
  let disabled = false;
  if (!selected) {
    const current =
      wizardState.masterData.technicalChiefsById[
        wizardState.team.lineup.technicalChiefId
      ]?.price_idr ?? 0;
    const next = chief.price_idr ?? 0;
    const delta = Math.max(0, next - current);
    disabled = !canAffordDeltaSpend(delta);
  }

  const stats = chief.stats ?? {};
  const overall =
    chief.career_rating ??
    Math.round(
      avgNum([stats.aerodynamics, stats.mechanical_design, stats.innovation])
    );

  const aero = stats.aerodynamics ?? 80;
  const mech = stats.mechanical_design ?? 80;
  const innov = stats.innovation ?? 80;

  return `
    <div
      class="f1-driver-card ${selected ? "selected" : ""} ${
    disabled ? "opacity-40 pointer-events-none" : ""
  }"
      data-technical-chief-id="${chief.id}"
      data-disabled="${disabled ? "1" : "0"}"
    >
      ${selected ? '<div class="f1-driver-selected-icon">✔</div>' : ""}

      <div class="f1-driver-top-right">
        <div>Rp ${moneyCompact(
          chief.price_idr
        )} <span class="dim-text">/PA</span></div>
        <div style="margin-top: 4px;"><span class="dim-text">ROLE:</span> ${
          chief.role ?? "-"
        }</div>
      </div>

      <div class="f1-driver-stats-right">
        <div class="f1-driver-overall-wrap">
          <span class="f1-driver-star">★</span>
          <span class="f1-driver-overall">${overall ?? 80}</span>
        </div>
        <div class="f1-driver-substats">
          <div class="substat"><span class="dim-text">AER</span> ${aero}</div>
          <div class="substat"><span class="dim-text">MEC</span> ${mech}</div>
          <div class="substat"><span class="dim-text">INN</span> ${innov}</div>
        </div>
      </div>

      <img
        src="${TECH_CHIEF_PHOTO_URL}"
        class="f1-team-image"
      />

      <div class="f1-driver-bottom">
        <div class="f1-driver-first-name">${chief.first_name ?? "-"}</div>
        <div class="f1-driver-last-name">${chief.last_name ?? "-"}</div>
      </div>
    </div>
  `;
}

function toggleTeamChief(id) {
  const body = document.getElementById("wizardBody");
  const prevScrollTop = body?.scrollTop ?? 0;

  const currentId = wizardState.team.lineup.teamChiefId;
  if (currentId === id) {
    wizardState.team.lineup.teamChiefId = null;
  } else {
    const currentPrice =
      wizardState.masterData.teamChiefsById[currentId]?.price_idr ?? 0;
    const nextPrice = wizardState.masterData.teamChiefsById[id]?.price_idr ?? 0;
    const delta = Math.max(0, nextPrice - currentPrice);
    if (!canAffordDeltaSpend(delta)) {
      budgetToast(delta);
      return;
    }

    wizardState.team.lineup.teamChiefId = id;
  }

  renderCurrentStep();
  if (body) body.scrollTop = prevScrollTop;
}

function toggleTechnicalChief(id) {
  const body = document.getElementById("wizardBody");
  const prevScrollTop = body?.scrollTop ?? 0;

  const currentId = wizardState.team.lineup.technicalChiefId;
  if (currentId === id) {
    wizardState.team.lineup.technicalChiefId = null;
  } else {
    const currentPrice =
      wizardState.masterData.technicalChiefsById[currentId]?.price_idr ?? 0;
    const nextPrice =
      wizardState.masterData.technicalChiefsById[id]?.price_idr ?? 0;
    const delta = Math.max(0, nextPrice - currentPrice);
    if (!canAffordDeltaSpend(delta)) {
      budgetToast(delta);
      return;
    }

    wizardState.team.lineup.technicalChiefId = id;
  }

  renderCurrentStep();
  if (body) body.scrollTop = prevScrollTop;
}

function avgNum(values) {
  const nums = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (!nums.length) return 80;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ============================================================
// STEP 1
// ============================================================

function renderIdentityStep(body) {
  const identity = wizardState.team.identity;

  body.innerHTML = `
    <div class="f1-wizard-layout">
      <!-- Sisi Kiri: Form -->
      <div class="f1-wizard-form">
        <div class="f1-create-header">
          <div class="f1-create-subtitle"><span class="f1-accent-line"></span> STEP 1</div>
          <h2 class="f1-create-title">TEAM IDENTITY</h2>
          <p class="f1-header-desc">Daftarkan tim balapmu ke dalam kompetisi. Pastikan semua detail sesuai dengan dokumen teknis FIA.</p>
        </div>

        <div class="f1-create-form-grid">
           <!-- (Isi input tetap sama seperti sebelumnya...) -->
           <div class="f1-input-group">
             <label class="f1-label">Team Name</label>
             <input class="f1-input" id="inp-name" value="${
               identity.name || ""
             }" placeholder="e.g. Apex Racing Team" />
           </div>
           <div class="f1-input-group">
             <label class="f1-label">Short Name</label>
             <input class="f1-input f1-input-uppercase" id="inp-short" maxlength="3" value="${
               identity.shortName || ""
             }" placeholder="APX" />
           </div>
           <div class="f1-input-group">
             <label class="f1-label">Country</label>
             <input class="f1-input" id="inp-country" value="${
               identity.base.country || ""
             }" />
           </div>
           <div class="f1-input-group">
             <label class="f1-label">City</label>
             <input class="f1-input" id="inp-city" value="${
               identity.base.city || ""
             }" />
           </div>
        </div>
      </div>

      <!-- Sisi Kanan: Gambar dengan Gradasi -->
      <div class="f1-wizard-visual">
        <div class="f1-visual-overlay"></div>
        <img src="https://image-service.zaonce.net/eyJidWNrZXQiOiJmcm9udGllci1jbXMiLCJrZXkiOiIyMDI0LTA1L2YxbTI0LWNhdC1iZWF1dHlzaG90Mi1jYXIyLXY3LnBuZyIsImVkaXRzIjp7InJlc2l6ZSI6eyJ3aWR0aCI6MTkyMH19fQ==" alt="F1 Car" />
      </div>
    </div>
  `;
}

// ============================================================
// STEP 2 — AMBITION SELECTION
// LEFT PANEL = SELECTOR
// RIGHT PANEL = DETAIL PREVIEW
// ============================================================

function renderAmbitionStep(body) {
  const selectedTier =
    ambitionLevels[wizardState.team.ambitionTier] ||
    Object.values(ambitionLevels)[0];

  body.innerHTML = `
    <div class="f1-step-panel">

      <div class="f1-create-header">
        <div class="f1-create-subtitle"><span class="f1-accent-line"></span> STEP 2</div>
        <h2 class="f1-create-title">SPONSOR AWAL</h2>
        <p class="f1-header-desc">Pilih profil sponsor awal yang menentukan kekuatan finansial dan ekspektasi publik.</p>
      </div>

      <div class="f1-ambition-layout">

        <!-- LEFT -->
        <div class="f1-ambition-sidebar">
          <div class="f1-ambition-list" role="list" style="max-height:60vh;overflow:auto;padding-right:8px;">
            ${Object.values(ambitionLevels)
              .map((tier) => renderTierSelector(tier))
              .join("")}
          </div>

        </div>

        <!-- RIGHT -->
        <div class="f1-ambition-detail">

          ${renderTierDetail(selectedTier)}

        </div>

      </div>
    </div>
  `;
}

// ============================================================
// LEFT SELECTOR
// ============================================================

function renderTierSelector(tier) {
  const selected = wizardState.team.ambitionTier === tier.tier;

  return `
    <button
      class="f1-ambition-option ${selected ? "selected" : ""}"
      data-tier="${tier.tier}"
    >

      <div class="f1-ambition-option-top">

        <div>
          <div class="f1-ambition-option-title">
            ${tier.profile.label}
          </div>

          <div class="f1-ambition-option-region">
            ${tier.sponsors.primary_region}
          </div>
        </div>

        ${
          selected
            ? `
          <div class="f1-ambition-check">
            ✓
          </div>
        `
            : ""
        }

      </div>

      <div class="f1-ambition-option-budget">
        Rp ${moneyCompact(tier.financials.initial_budget_idr)}
      </div>
    </button>
  `;
}

// ============================================================
// RIGHT DETAIL
// ============================================================

function renderTierDetail(tier) {
  return `
    <div class="f1-ambition-detail-card">
      <div class="f1-ambition-detail-bg"></div>
      <div class="f1-ambition-detail-content">
        
        <div class="f1-ambition-badge">${tier.tier.replaceAll("_", " ")}</div>
        <div class="f1-ambition-title">${tier.profile.label}</div>
        <div class="f1-ambition-description">${
          tier.profile.short_description
        }</div>
        
        <div class="f1-ambition-section">
          <div class="f1-sponsor-list">
            ${tier.sponsors.sponsor_profile
              .map(
                (sponsor) =>
                  `<div class="f1-sponsor-chip">${sponsor.example}</div>`
              )
              .join("")}
          </div>
        </div>

        <div class="f1-ambition-lore">${tier.profile.lore}</div>

        <div class="f1-detail-quality-wrapper">
          
          <div class="f1-ambition-section">
            <div class="f1-ambition-section-title">DETAILS</div>
            <div class="f1-ambition-detail-table">
              <div class="f1-detail-row">
                <div class="f1-detail-label"><i class="ti ti-cash"></i> Starting Budget</div>
                <div class="f1-detail-value">Rp ${moneyCompact(
                  tier.financials.initial_budget_idr
                )}</div>
              </div>
              <div class="f1-detail-row">
                <div class="f1-detail-label"><i class="ti ti-trophy"></i> Prestige</div>
                <div class="f1-detail-value">${
                  tier.profile.prestige_rating
                }</div>
              </div>
              <div class="f1-detail-row">
                <div class="f1-detail-label"><i class="ti ti-map-pin"></i> HQ</div>
                <div class="f1-detail-value">${
                  tier.profile.headquarters.city
                }</div>
              </div>
              <div class="f1-detail-row">
                <div class="f1-detail-label"><i class="ti ti-world"></i> Sponsor Region</div>
                <div class="f1-detail-value">${
                  tier.sponsors.primary_region
                }</div>
              </div>
            </div>
          </div>

          <div class="f1-ambition-section">
            <div class="f1-ambition-section-title">QUALITY</div>
            <div class="f1-ambition-quality-grid">
              <div class="f1-quality-box">
                <span><i class="ti ti-building-factory-2"></i> Factory</span>
                <strong>${tier.facilities.factory_level}</strong>
              </div>
              <div class="f1-quality-box">
                <span><i class="ti ti-wind"></i> CFD</span>
                <strong>${tier.facilities.cfd_capacity}</strong>
              </div>
              <div class="f1-quality-box">
                <span><i class="ti ti-users"></i> Staff</span>
                <strong>${tier.workforce.staff_quality}</strong>
              </div>
              <div class="f1-quality-box">
                <span><i class="ti ti-steering-wheel"></i> Drivers</span>
                <strong>${tier.workforce.driver_attractiveness}</strong>
              </div>
            </div>
          </div>

        </div>
      </div>
      <div class="f1-ambition-accent"></div>
    </div>
  `;
}

// ============================================================
// STEP 3
// ============================================================

function renderDriverSelectionStep(body) {
  const d = wizardState.team.lineup.driverIds;
  const hasCar1 = Boolean(d[0]);
  const hasCar2 = Boolean(d[1]);

  body.innerHTML = `
    <div class="f1-step-panel">
      <div class="f1-step3-header">
        <div class="f1-create-header">
          <div class="f1-create-subtitle"><span class="f1-accent-line"></span> STEP 3</div>
          <h2 class="f1-create-title">DRIVER LINEUP</h2>
          <p class="f1-header-desc">Pilih dua pembalap untuk memulai karier. Klik kartu untuk memilih atau membatalkan.</p>
        </div>

        <div class="f1-step-header-right">
          ${renderBudgetPill()}
          <div class="f1-car-indicators" aria-label="Selected cars">
            <div class="f1-car-indicator ${
              hasCar1 ? "active" : ""
            }" title="Car 1">
              <i class="ti ti-car"></i>
              <span>CAR 1</span>
            </div>
            <div class="f1-car-indicator ${
              hasCar2 ? "active" : ""
            }" title="Car 2">
              <i class="ti ti-car"></i>
              <span>CAR 2</span>
            </div>
          </div>
        </div>
      </div>

      <div class="driver-select-grid">
        ${wizardState.masterData.drivers.map(renderDriverCard).join("")}
      </div>
    </div>
  `;
}

function renderDriverCard(driver) {
  const selected = wizardState.team.lineup.driverIds.includes(driver.id);

  // Disable card if selecting it would exceed budget.
  let disabled = false;
  if (!selected) {
    const delta = driver.price_idr ?? 0;
    disabled = !canAffordDeltaSpend(delta);
  }

  const overall = driver.stats?.overall ?? 80;
  const cornering = driver.stats?.cornering ?? 80;
  const braking = driver.stats?.braking ?? 80;
  const reactiveness = driver.stats?.reactiveness ?? 80;
  const age = calculateAge(driver.date_of_birth);

  return `
    <div
      class="f1-driver-card ${selected ? "selected" : ""} ${
    disabled ? "opacity-40 pointer-events-none" : ""
  }"
      data-driver-id="${driver.id}"
      data-disabled="${disabled ? "1" : "0"}"
    >
      ${selected ? '<div class="f1-driver-selected-icon">✔</div>' : ""}

      <div class="f1-driver-top-right">
        <div>Rp ${moneyCompact(
          driver.price_idr
        )} <span class="dim-text">/PA</span></div>
        <div style="margin-top: 4px;"><span class="dim-text">AGE:</span> ${
          age ?? "-"
        }</div>
      </div>

      <div class="f1-driver-stats-right">
        <div class="f1-driver-overall-wrap">
          <span class="f1-driver-star">★</span>
          <span class="f1-driver-overall">${overall}</span>
        </div>
        <div class="f1-driver-substats">
          <div class="substat"><span class="dim-text">COR</span> ${cornering}</div>
          <div class="substat"><span class="dim-text">BRK</span> ${braking}</div>
          <div class="substat"><span class="dim-text">REA</span> ${reactiveness}</div>
        </div>
      </div>

      <img
        src="${driver.photo_url ?? ""}"
        class="f1-driver-image"
      />

      <div class="f1-driver-bottom">
        <div class="f1-driver-first-name">${
          driver.first_name ?? "STEFFEN"
        }</div>
        <div class="f1-driver-last-name">${driver.last_name ?? "WERNER"}</div>
      </div>

    </div>
  `;
}

function toggleDriver(id) {
  const body = document.getElementById("wizardBody");
  const prevScrollTop = body?.scrollTop ?? 0;
  const prevGridScrollLeft = body?.querySelector(
    ".driver-select-grid"
  )?.scrollLeft;

  const drivers = wizardState.team.lineup.driverIds;

  if (drivers.includes(id)) {
    wizardState.team.lineup.driverIds = drivers.filter((x) => x !== id);
  } else {
    if (drivers.length >= 2) {
      showToast("Maximum 2 drivers."); // Pastikan fungsi showToast sudah tersedia di kodemu
      return;
    }

    const price = wizardState.masterData.driversById[id]?.price_idr ?? 0;
    if (!canAffordDeltaSpend(price)) {
      budgetToast(price);
      return;
    }
    drivers.push(id);
  }

  // Render ulang UI
  renderCurrentStep(); // Atau sesuaikan dengan fungsi render-mu

  // Preserve scroll position (renderCurrentStep replaces innerHTML)
  if (body) body.scrollTop = prevScrollTop;

  // Also preserve horizontal scroll of the driver carousel
  const grid = body?.querySelector(".driver-select-grid");
  if (grid && typeof prevGridScrollLeft === "number") {
    grid.scrollLeft = prevGridScrollLeft;
  }
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();

  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;

  return age;
}

// ============================================================
// STEP 4
// ============================================================

function renderPowerUnitStep(body) {
  const activePowerUnits = wizardState.masterData.powerUnits.filter(
    (x) => x.is_active
  );

  const selectedPu =
    wizardState.masterData.powerUnitsById[
      wizardState.team.lineup.powerUnitId
    ] || activePowerUnits[0];

  body.innerHTML = `
    <div class="f1-step-panel">
      <div class="f1-step3-header">
        <div class="f1-create-header">
          <div class="f1-create-subtitle"><span class="f1-accent-line"></span> STEP 5</div>
          <h2 class="f1-create-title">POWER UNIT</h2>
          <p class="f1-header-desc">Pilih mesin yang menentukan performa, drivability, dan reliability untuk musim ini.</p>
        </div>
        <div class="f1-step-header-right">
          ${renderBudgetPill()}
        </div>
      </div>

      <div class="f1-pu-layout">
        <div class="f1-pu-sidebar">
          <div class="f1-pu-list" role="list" style="max-height:60vh;overflow:auto;padding-right:8px;">
            ${activePowerUnits.map(renderPowerUnitOption).join("")}
          </div>
        </div>

        <div class="f1-pu-detail">
          ${selectedPu ? renderPowerUnitDetail(selectedPu) : ""}
        </div>
      </div>
    </div>
  `;
}

function renderPowerUnitOption(pu) {
  const selected = wizardState.team.lineup.powerUnitId === pu.id;

  const currentPuPrice =
    wizardState.masterData.powerUnitsById[wizardState.team.lineup.powerUnitId]
      ?.price_idr ?? 0;
  const nextPuPrice = pu.price_idr ?? 0;
  const delta = selected ? 0 : Math.max(0, nextPuPrice - currentPuPrice);
  const disabled = !selected && !canAffordDeltaSpend(delta);

  return `
    <button
      class="f1-pu-option ${selected ? "selected" : ""} ${
    disabled ? "opacity-40" : ""
  }"
      data-pu-id="${pu.id}"
      type="button"
      ${disabled ? "disabled" : ""}
      aria-disabled="${disabled ? "true" : "false"}"
    >
      <div class="f1-pu-option-top">
        <div class="f1-pu-option-title">${pu.manufacturer}</div>
        ${selected ? '<div class="f1-ambition-check">✓</div>' : ""}
      </div>
      <div class="f1-pu-option-sub">${pu.architecture ?? ""}</div>
      <div class="f1-pu-option-price">Rp ${moneyCompact(pu.price_idr)}</div>
    </button>
  `;
}

function renderPowerUnitDetail(pu) {
  const stats = pu.stats || {};
  const ic = stats.internal_combustion || {};
  const hyb = stats.hybrid_system || {};
  const drv = stats.driveability || {};
  const rel = stats.reliability || {};
  const dev = stats.development || {};
  const ch = pu.characteristics || {};
  const ai = pu.ai_behavior || {};

  const narrativeParts = [
    pu.architecture
      ? `Arsitektur ${pu.architecture} memberi karakter tenaga yang ${
          ch.power_delivery ? humanizeEnum(ch.power_delivery) : "terukur"
        } dengan fokus pada efisiensi.`
      : null,
    typeof stats.overall_performance === "number"
      ? `Dengan rating performa keseluruhan ${stats.overall_performance}, paket ini cocok untuk tim yang mengejar poin setiap akhir pekan.`
      : null,
    typeof rel.failure_resistance === "number"
      ? `Reliability dibangun lewat manajemen temperatur dan ketahanan kegagalan (resistance ${rel.failure_resistance}).`
      : null,
    typeof dev.regulation_adaptation === "number"
      ? `Potensi pengembangan tetap tinggi, terutama adaptasi regulasi (${
          dev.regulation_adaptation
        }) dan upgrade potential (${dev.upgrade_potential ?? "-"}).`
      : null,
  ].filter(Boolean);

  return `
    <div class="f1-pu-detail-card">
      <div class="f1-pu-detail-bg"></div>
      <div class="f1-pu-detail-content">
        <div class="f1-ambition-badge">${pu.country ?? ""}</div>
        <div class="f1-ambition-title">${pu.manufacturer}</div>
        <div class="f1-ambition-description">
          <strong>Architecture:</strong> ${pu.architecture ?? "-"}<br>
          <strong>Price:</strong> Rp ${moneyCompact(pu.price_idr)}
        </div>

        ${
          narrativeParts.length
            ? `
          <div class="f1-pu-narrative">
            ${narrativeParts.join(" ")}
          </div>
        `
            : ""
        }

        <div class="f1-pu-chip-row">
          <div class="f1-pu-chip"><span>Power Delivery</span><strong>${
            ch.power_delivery ? humanizeEnum(ch.power_delivery) : "-"
          }</strong></div>
          <div class="f1-pu-chip"><span>Fuel Style</span><strong>${
            ch.fuel_usage_style ? humanizeEnum(ch.fuel_usage_style) : "-"
          }</strong></div>
          <div class="f1-pu-chip"><span>AI ERS</span><strong>${
            ai.ers_usage_style ? humanizeEnum(ai.ers_usage_style) : "-"
          }</strong></div>
        </div>

        <div class="f1-detail-quality-wrapper">
          <div class="f1-ambition-section">
            <div class="f1-ambition-section-title">CORE</div>
            <div class="f1-ambition-detail-table">
              <div class="f1-detail-row">
                <div class="f1-detail-label"><i class="ti ti-gauge"></i> Overall</div>
                <div class="f1-detail-value">${
                  stats.overall_performance ?? "-"
                }</div>
              </div>
              <div class="f1-detail-row">
                <div class="f1-detail-label"><i class="ti ti-bolt"></i> Horsepower</div>
                <div class="f1-detail-value">${ic.horsepower ?? "-"}</div>
              </div>
              <div class="f1-detail-row">
                <div class="f1-detail-label"><i class="ti ti-leaf"></i> Fuel Efficiency</div>
                <div class="f1-detail-value">${ic.fuel_efficiency ?? "-"}</div>
              </div>
              <div class="f1-detail-row">
                <div class="f1-detail-label"><i class="ti ti-battery"></i> ERS Output</div>
                <div class="f1-detail-value">${hyb.ers_output ?? "-"}</div>
              </div>
              <div class="f1-detail-row">
                <div class="f1-detail-label"><i class="ti ti-wave-sine"></i> Throttle Smooth.</div>
                <div class="f1-detail-value">${
                  drv.throttle_smoothness ?? "-"
                }</div>
              </div>
            </div>
          </div>

          <div class="f1-ambition-section">
            <div class="f1-ambition-section-title">RELIABILITY</div>
            <div class="f1-ambition-detail-table">
              <div class="f1-detail-row">
                <div class="f1-detail-label"><i class="ti ti-tool"></i> Engine Wear</div>
                <div class="f1-detail-value">${rel.engine_wear ?? "-"}</div>
              </div>
              <div class="f1-detail-row">
                <div class="f1-detail-label"><i class="ti ti-snowflake"></i> Cooling</div>
                <div class="f1-detail-value">${
                  rel.cooling_efficiency ?? "-"
                }</div>
              </div>
              <div class="f1-detail-row">
                <div class="f1-detail-label"><i class="ti ti-shield"></i> Failure Resist.</div>
                <div class="f1-detail-value">${
                  rel.failure_resistance ?? "-"
                }</div>
              </div>
              <div class="f1-detail-row">
                <div class="f1-detail-label"><i class="ti ti-trending-up"></i> Upgrade Potential</div>
                <div class="f1-detail-value">${
                  dev.upgrade_potential ?? "-"
                }</div>
              </div>
              <div class="f1-detail-row">
                <div class="f1-detail-label"><i class="ti ti-adjustments"></i> Reg. Adaptation</div>
                <div class="f1-detail-value">${
                  dev.regulation_adaptation ?? "-"
                }</div>
              </div>
            </div>
          </div>
        </div>

        ${
          Array.isArray(ch.best_circuit_ids) && ch.best_circuit_ids.length
            ? `
          <div class="f1-ambition-section">
            <div class="f1-ambition-section-title">BEST CIRCUITS</div>
            <div class="f1-pu-circuit-list">
              ${ch.best_circuit_ids
                .slice(0, 6)
                .map(
                  (id) =>
                    `<div class="f1-pu-circuit-chip">${id.replaceAll(
                      "_",
                      " "
                    )}</div>`
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
      </div>
      <div class="f1-ambition-accent"></div>
    </div>
  `;
}

function humanizeEnum(v) {
  return String(v || "")
    .replaceAll("_", " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================
// STEP 6
// ============================================================

function renderChassisStep(body) {
  const activeChassis = wizardState.masterData.chassis.filter(
    (x) => x.is_active
  );

  const selectedChassis =
    wizardState.masterData.chassisById[wizardState.team.lineup.chassisId] ||
    activeChassis[0];

  body.innerHTML = `
    <div class="f1-step-panel">
      <div class="f1-step3-header">
        <div class="f1-create-header">
          <div class="f1-create-subtitle"><span class="f1-accent-line"></span> STEP 6</div>
          <h2 class="f1-create-title">CHASSIS</h2>
          <p class="f1-header-desc">Pilih platform sasis dan aero-package yang menentukan karakter mobil dalam balapan.</p>
        </div>
        <div class="f1-step-header-right">
          ${renderBudgetPill()}
        </div>
      </div>

      <div class="f1-ch-layout">
        <div class="f1-ch-sidebar">
          <div class="f1-ch-list" role="list" style="max-height:60vh;overflow:auto;padding-right:8px;">
            ${activeChassis.map(renderChassisOption).join("")}
          </div>
        </div>

        <div class="f1-ch-detail">
          ${selectedChassis ? renderChassisDetail(selectedChassis) : ""}
        </div>
      </div>
    </div>
  `;
}

function renderChassisOption(chassis) {
  const selected = wizardState.team.lineup.chassisId === chassis.id;

  const currentChPrice =
    wizardState.masterData.chassisById[wizardState.team.lineup.chassisId]
      ?.price_idr ?? 0;
  const nextChPrice = chassis.price_idr ?? 0;
  const delta = selected ? 0 : Math.max(0, nextChPrice - currentChPrice);
  const disabled = !selected && !canAffordDeltaSpend(delta);

  return `
    <button
      class="f1-ch-option ${selected ? "selected" : ""} ${
    disabled ? "opacity-40" : ""
  }"
      data-chassis-id="${chassis.id}"
      type="button"
      ${disabled ? "disabled" : ""}
      aria-disabled="${disabled ? "true" : "false"}"
    >
      <div class="f1-ch-option-top">
        <div class="f1-ch-option-title">${chassis.name}</div>
        ${selected ? '<div class="f1-ambition-check">✓</div>' : ""}
      </div>
      <div class="f1-ch-option-sub">${[
        chassis.design_philosophy,
        chassis.concept,
      ]
        .filter(Boolean)
        .join(" • ")}</div>
      <div class="f1-ch-option-price">Rp ${moneyCompact(
        chassis.price_idr
      )}</div>
    </button>
  `;
}

function renderChassisDetail(chassis) {
  const stats = chassis.stats || {};
  const aero = stats.aerodynamics || {};
  const mech = stats.mechanical || {};
  const perf = stats.performance || {};
  const rel = stats.reliability || {};
  const dev = stats.development || {};
  const behavior = chassis.car_behavior || {};
  const difficulty = chassis.difficulty || {};

  const interpretations = interpretChassis({ aero, mech, perf });

  const narrativeParts = [
    chassis.design_philosophy
      ? `Filosofi desain ${humanizeEnum(
          chassis.design_philosophy
        )} membentuk baseline mobil: efisien di lintasan cepat tanpa mengorbankan stabilitas.`
      : null,
    chassis.concept
      ? `Konsep ${humanizeEnum(
          chassis.concept
        )} memberi rasa setir yang konsisten, terutama saat masuk tikungan kecepatan menengah hingga tinggi.`
      : null,
    typeof stats.overall_performance === "number"
      ? `Dengan overall performance ${stats.overall_performance}, platform ini ideal untuk tim yang ingin performa race pace yang kuat dan ban awet.`
      : null,
    typeof dev.setup_window === "number"
      ? `Setup window yang lebar (${dev.setup_window}) mengurangi risiko salah arah saat pengembangan set-up di akhir pekan balap.`
      : null,
  ].filter(Boolean);

  return `
    <div class="f1-ch-detail-card">
      <div class="f1-ch-detail-bg"></div>
      <div class="f1-ch-detail-content">
        <div class="f1-ambition-badge">${(chassis.team_id ?? "").replaceAll(
          "_",
          " "
        )}</div>
        <div class="f1-ambition-title">${chassis.name}</div>
        <div class="f1-ambition-description">
          <strong>Philosophy:</strong> ${
            chassis.design_philosophy
              ? humanizeEnum(chassis.design_philosophy)
              : "-"
          }<br>
          <strong>Concept:</strong> ${
            chassis.concept ? humanizeEnum(chassis.concept) : "-"
          }<br>
          <strong>Price:</strong> Rp ${moneyCompact(chassis.price_idr)}
        </div>

        ${
          interpretations.length
            ? `
          <div class="f1-ch-interpret-row" aria-label="Chassis interpretation">
            ${interpretations
              .map(
                (x) => `
              <div class="f1-ch-interpret-chip" title="${escapeHtml(x.reason)}">
                <span>${x.label}</span>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }

        ${
          narrativeParts.length
            ? `
          <div class="f1-ch-narrative">${narrativeParts.join(" ")}</div>
        `
            : ""
        }

        <div class="f1-ch-chip-row">
          <div class="f1-ch-chip"><span>Driving Style</span><strong>${
            behavior.driving_style ? humanizeEnum(behavior.driving_style) : "-"
          }</strong></div>
          <div class="f1-ch-chip"><span>Qualifying Bias</span><strong>${
            behavior.qualifying_bias ?? "-"
          }</strong></div>
          <div class="f1-ch-chip"><span>Race Pace Bias</span><strong>${
            behavior.race_pace_bias ?? "-"
          }</strong></div>
        </div>

        <div class="f1-detail-quality-wrapper">
          <div class="f1-ambition-section">
            <div class="f1-ambition-section-title">AERODYNAMICS</div>
            <div class="f1-ambition-detail-table">
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-wind"></i> Low Speed</div><div class="f1-detail-value">${
                aero.low_speed_cornering ?? "-"
              }</div></div>
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-wind"></i> Medium Speed</div><div class="f1-detail-value">${
                aero.medium_speed_cornering ?? "-"
              }</div></div>
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-wind"></i> High Speed</div><div class="f1-detail-value">${
                aero.high_speed_cornering ?? "-"
              }</div></div>
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-arrows-exchange"></i> Dirty Air</div><div class="f1-detail-value">${
                aero.dirty_air_tolerance ?? "-"
              }</div></div>
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-bolt"></i> Aero Eff.</div><div class="f1-detail-value">${
                aero.aero_efficiency ?? "-"
              }</div></div>
            </div>
          </div>

          <div class="f1-ambition-section">
            <div class="f1-ambition-section-title">MECHANICAL</div>
            <div class="f1-ambition-detail-table">
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-tire"></i> Traction</div><div class="f1-detail-value">${
                mech.traction ?? "-"
              }</div></div>
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-road"></i> Kerb Riding</div><div class="f1-detail-value">${
                mech.kerb_riding ?? "-"
              }</div></div>
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-arrows-move-vertical"></i> Ride Stability</div><div class="f1-detail-value">${
                mech.ride_stability ?? "-"
              }</div></div>
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-settings"></i> Suspension</div><div class="f1-detail-value">${
                mech.suspension_quality ?? "-"
              }</div></div>
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-scale"></i> Weight Dist.</div><div class="f1-detail-value">${
                mech.weight_distribution ?? "-"
              }</div></div>
            </div>
          </div>
        </div>

        <div class="f1-detail-quality-wrapper">
          <div class="f1-ambition-section">
            <div class="f1-ambition-section-title">PERFORMANCE</div>
            <div class="f1-ambition-detail-table">
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-speedometer"></i> Top Speed</div><div class="f1-detail-value">${
                perf.top_speed ?? "-"
              }</div></div>
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-rocket"></i> Acceleration</div><div class="f1-detail-value">${
                perf.acceleration ?? "-"
              }</div></div>
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-brand-stackoverflow"></i> Tyre Pres.</div><div class="f1-detail-value">${
                perf.tyre_preservation ?? "-"
              }</div></div>
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-leaf"></i> Fuel Eff.</div><div class="f1-detail-value">${
                perf.fuel_efficiency ?? "-"
              }</div></div>
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-battery"></i> ERS Integr.</div><div class="f1-detail-value">${
                perf.ers_integration ?? "-"
              }</div></div>
            </div>
          </div>

          <div class="f1-ambition-section">
            <div class="f1-ambition-section-title">DEVELOPMENT</div>
            <div class="f1-ambition-detail-table">
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-trending-up"></i> Upgrade Pot.</div><div class="f1-detail-value">${
                dev.upgrade_potential ?? "-"
              }</div></div>
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-adjustments"></i> Setup Window</div><div class="f1-detail-value">${
                dev.setup_window ?? "-"
              }</div></div>
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-file-settings"></i> Reg. Adapt.</div><div class="f1-detail-value">${
                dev.regulation_adaptability ?? "-"
              }</div></div>
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-shield"></i> Failure Resist.</div><div class="f1-detail-value">${
                rel.failure_resistance ?? "-"
              }</div></div>
              <div class="f1-detail-row"><div class="f1-detail-label"><i class="ti ti-snowflake"></i> Cooling</div><div class="f1-detail-value">${
                rel.cooling_efficiency ?? "-"
              }</div></div>
            </div>
          </div>
        </div>

        <div class="f1-ch-flag-row">
          <div class="f1-ch-flag ${difficulty.easy_to_setup ? "active" : ""}">
            <i class="ti ti-adjustments"></i> Easy To Setup
          </div>
          <div class="f1-ch-flag ${difficulty.rookie_friendly ? "active" : ""}">
            <i class="ti ti-user"></i> Rookie Friendly
          </div>
          <div class="f1-ch-flag ${
            typeof behavior.wet_weather_performance === "number" &&
            behavior.wet_weather_performance >= 90
              ? "active"
              : ""
          }">
            <i class="ti ti-cloud-rain"></i> Strong In Wet
          </div>
        </div>
      </div>
      <div class="f1-ambition-accent"></div>
    </div>
  `;
}

function interpretChassis({ aero, mech, perf }) {
  const tags = [];

  const hs = aero.high_speed_cornering ?? null;
  const ms = aero.medium_speed_cornering ?? null;
  const ls = aero.low_speed_cornering ?? null;
  const dirty = aero.dirty_air_tolerance ?? null;
  const tyre = perf.tyre_preservation ?? null;
  const topSpeed = perf.top_speed ?? null;
  const traction = mech.traction ?? null;
  const kerb = mech.kerb_riding ?? null;
  const ride = mech.ride_stability ?? null;

  if (typeof hs === "number" && hs >= 95) {
    tags.push({
      label: "High-Speed Monster",
      reason: `High-speed cornering ${hs} membuat mobil ini sangat kuat di tikungan cepat.`,
    });
  }

  if (typeof tyre === "number" && tyre >= 94) {
    tags.push({
      label: "Tyre Whisperer",
      reason: `Tyre preservation ${tyre} membantu menjaga pace panjang dan strategi fleksibel.`,
    });
  }

  if (typeof dirty === "number" && dirty >= 92) {
    tags.push({
      label: "Dirty-Air Specialist",
      reason: `Dirty air tolerance ${dirty} membuat mobil tetap stabil saat mengikuti lawan dekat.`,
    });
  }

  if (typeof topSpeed === "number" && topSpeed >= 92) {
    tags.push({
      label: "Straight-Line Threat",
      reason: `Top speed ${topSpeed} memberi keuntungan di trek power dan zona DRS panjang.`,
    });
  }

  if (typeof traction === "number" && traction >= 90) {
    tags.push({
      label: "Exit Traction",
      reason: `Traction ${traction} membuat akselerasi keluar tikungan lebih bersih dan konsisten.`,
    });
  }

  if (typeof kerb === "number" && kerb >= 88) {
    tags.push({
      label: "Kerb Eater",
      reason: `Kerb riding ${kerb} membantu agresif di chicane dan track limits.`,
    });
  }

  // If none triggered, derive a best-in-class style based on peak values.
  if (!tags.length) {
    const candidates = [
      {
        key: "aero_high_speed",
        v: hs,
        label: "High-Speed Bias",
        reason: `High-speed cornering ${
          hs ?? "-"
        } adalah kekuatan utama paket ini.`,
      },
      {
        key: "tyre_preservation",
        v: tyre,
        label: "Long-Run Focus",
        reason: `Tyre preservation ${
          tyre ?? "-"
        } membuatnya kompetitif dalam stint panjang.`,
      },
      {
        key: "dirty_air",
        v: dirty,
        label: "Close-Following",
        reason: `Dirty air tolerance ${
          dirty ?? "-"
        } membantu dalam duel dan DRS train.`,
      },
      {
        key: "mechanical_ride",
        v: ride,
        label: "Stable Platform",
        reason: `Ride stability ${
          ride ?? "-"
        } memberi rasa percaya diri dan konsistensi.`,
      },
      {
        key: "medium_speed",
        v: ms,
        label: "Medium-Speed King",
        reason: `Medium-speed cornering ${
          ms ?? "-"
        } cocok untuk sirkuit teknikal modern.`,
      },
      {
        key: "low_speed",
        v: ls,
        label: "Low-Speed Rotation",
        reason: `Low-speed cornering ${
          ls ?? "-"
        } membantu di hairpin dan slow complexes.`,
      },
    ].filter((x) => typeof x.v === "number");

    candidates.sort((a, b) => b.v - a.v);
    if (candidates[0])
      tags.push({ label: candidates[0].label, reason: candidates[0].reason });
  }

  return tags.slice(0, 3);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ============================================================
// STEP 7: CONFIRMATION
// ============================================================

function renderConfirmationStep(body) {
  const lineup = wizardState.team.lineup;

  const d1 = wizardState.masterData.driversById[lineup.driverIds[0]];
  const d2 = wizardState.masterData.driversById[lineup.driverIds[1]];
  const pu = wizardState.masterData.powerUnitsById[lineup.powerUnitId];
  const chassis = wizardState.masterData.chassisById[lineup.chassisId];
  const teamChief = wizardState.masterData.teamChiefsById[lineup.teamChiefId];
  const technicalChief =
    wizardState.masterData.technicalChiefsById[lineup.technicalChiefId];

  const tier = ambitionLevels[wizardState.team.ambitionTier];
  const startingBudget = tier?.financials?.initial_budget_idr ?? 0;
  const totalSpend = calculateTotalSpend();
  const remaining = getRemainingBudget();

  body.innerHTML = `
    <div class="f1-step-panel">
      <div class="f1-step3-header">
        <div class="f1-create-header">
          <div class="f1-create-subtitle"><span class="f1-accent-line"></span> STEP 7</div>
          <h2 class="f1-create-title">CONFIRMATION</h2>
          <p class="f1-header-desc">Review konfigurasi akhir tim balapmu sebelum memulai karier profesional.</p>
        </div>
      </div>

      <div class="panel mt-4" style="background: rgba(26,26,32,0.85); padding: 40px 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
        
        <div class="font-orbitron tracking-widest text-center mb-8" style="color: var(--accent-cyan); font-size: 1.2rem; text-shadow: 0 0 10px rgba(0,255,255,0.2);">
          FINAL REVIEW
        </div>

        <div class="f1-ambition-quality-grid" style="margin-top:40px; gap:24px; border-top:1px dashed rgba(255,255,255,0.1); padding-top:40px;">
        <div class="mb-8">
          <div class="text-xs font-orbitron tracking-widest text-f1-dim text-center mb-4"><i class="ti ti-steering-wheel"></i> DRIVERS</div>
          <div style="display:flex; gap:32px; flex-wrap:wrap; justify-content:center;">
            ${renderConfirmDriverCard(d1, "CAR 1")}
            ${renderConfirmDriverCard(d2, "CAR 2")}
          </div>
        </div>

        <div class="mb-8">
          <div class="text-xs font-orbitron tracking-widest text-f1-dim text-center mb-4"><i class="ti ti-users"></i> MANAGEMENT</div>
          <div style="display:flex; gap:32px; flex-wrap:wrap; justify-content:center;">
            ${renderConfirmChiefCard(teamChief, "TEAM CHIEF", "team")}
            ${renderConfirmChiefCard(technicalChief, "TECH CHIEF", "tech")}
          </div>
        </div>  
        </div>
        <div class="f1-ambition-quality-grid" style="margin-top:40px; gap:24px; border-top:1px dashed rgba(255,255,255,0.1); padding-top:40px;">
          
          <div class="f1-quality-box" style="text-align: left; padding: 24px; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
             <span style="color: var(--accent-cyan); font-size: 13px; font-weight: bold; letter-spacing: 1px;"><i class="ti ti-settings"></i> HARDWARE</span>
             <div style="display:grid; gap:20px; margin-top:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div class="text-xs font-orbitron tracking-widest text-f1-dim">POWER UNIT</div>
                  <div class="font-orbitron text-white" style="letter-spacing:0.04em; font-size:16px;">${
                    pu?.manufacturer ?? "-"
                  }</div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div class="text-xs font-orbitron tracking-widest text-f1-dim">CHASSIS</div>
                  <div class="font-orbitron text-white" style="letter-spacing:0.04em; font-size:16px;">${
                    chassis?.name ?? "-"
                  }</div>
                </div>
             </div>
          </div>
          
          <div class="f1-quality-box" style="text-align: left; padding: 24px; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
             <span style="color: var(--accent-cyan); font-size: 13px; font-weight: bold; letter-spacing: 1px;"><i class="ti ti-cash"></i> FINANCE</span>
             <div style="display:grid; gap:16px; margin-top:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div class="text-xs font-orbitron tracking-widest text-f1-dim">STARTING BUDGET</div>
                  <div class="font-orbitron text-white" style="font-size:15px;">${moneyCompact(
                    startingBudget
                  )}</div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div class="text-xs font-orbitron tracking-widest text-f1-dim">TOTAL SPEND</div>
                  <div class="font-orbitron" style="color: var(--accent-orange); font-size:15px;">${moneyCompact(
                    totalSpend
                  )}</div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 16px; margin-top: 4px;">
                  <div class="text-xs font-orbitron tracking-widest text-white">REMAINING</div>
                  <div class="font-orbitron font-bold" style="font-size:20px; color:${
                    remaining >= 0 ? "var(--accent-cyan)" : "var(--accent-red)"
                  }; text-shadow: 0 0 10px ${
    remaining >= 0 ? "rgba(0,255,255,0.3)" : "rgba(255,0,0,0.3)"
  };">${moneyCompact(remaining)}</div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  `;

  document.getElementById("btnNext").innerHTML = `
    <i class="ti ti-flag-check"></i> START CAREER
  `;
}

function renderConfirmChiefCard(chief, label, kind) {
  const readOnlyCard = chief
    ? renderChiefCardReadOnly(chief, kind)
    : `
      <div class="f1-driver-card opacity-40 pointer-events-none">
        <div class="f1-driver-top-right">
          <div class="dim-text">-</div>
          <div style="margin-top: 4px;"><span class="dim-text">ROLE:</span> -</div>
        </div>
        <div class="f1-driver-stats-right">
          <div class="f1-driver-overall-wrap">
            <span class="f1-driver-star">★</span>
            <span class="f1-driver-overall">-</span>
          </div>
          <div class="f1-driver-substats">
            <div class="substat"><span class="dim-text">-</span> -</div>
            <div class="substat"><span class="dim-text">-</span> -</div>
            <div class="substat"><span class="dim-text">-</span> -</div>
          </div>
        </div>
        <div class="f1-driver-bottom">
          <div class="f1-driver-first-name">EMPTY</div>
          <div class="f1-driver-last-name">SLOT</div>
        </div>
      </div>
    `;

  return `
    <div style="flex: 0 1 260px; min-width:240px; display:flex; flex-direction:column; align-items:center;">
      <div class="text-xs font-orbitron tracking-widest" style="color: var(--accent-cyan); margin-bottom: 12px; letter-spacing: 2px;">${label}</div>
      ${readOnlyCard}
    </div>
  `;
}

function renderChiefCardReadOnly(chief, kind) {
  const stats = chief?.stats ?? {};
  const overall = chief?.career_rating ?? 80;

  const isTeam = kind === "team";
  const s1 = isTeam ? stats.leadership : stats.aerodynamics;
  const s2 = isTeam ? stats.strategy : stats.mechanical_design;
  const s3 = isTeam ? stats.technical_understanding : stats.innovation;
  const k1 = isTeam ? "LEA" : "AER";
  const k2 = isTeam ? "STR" : "MEC";
  const k3 = isTeam ? "TEC" : "INN";

  return `
    <div class="f1-driver-card pointer-events-none">
      <div class="f1-driver-top-right">
        <div>Rp ${moneyCompact(
          chief?.price_idr
        )} <span class="dim-text">/PA</span></div>
        <div style="margin-top: 4px;"><span class="dim-text">ROLE:</span> ${
          chief?.role ?? "-"
        }</div>
      </div>

      <div class="f1-driver-stats-right">
        <div class="f1-driver-overall-wrap">
          <span class="f1-driver-star">★</span>
          <span class="f1-driver-overall">${overall}</span>
        </div>
        <div class="f1-driver-substats">
          <div class="substat"><span class="dim-text">${k1}</span> ${
    s1 ?? 80
  }</div>
          <div class="substat"><span class="dim-text">${k2}</span> ${
    s2 ?? 80
  }</div>
          <div class="substat"><span class="dim-text">${k3}</span> ${
    s3 ?? 80
  }</div>
        </div>
      </div>

      <img src="${
        kind === "team" ? TEAM_CHIEF_PHOTO_URL : TECH_CHIEF_PHOTO_URL
      }" class="f1-team-image" />

      <div class="f1-driver-bottom">
        <div class="f1-driver-first-name">${chief?.first_name ?? "-"}</div>
        <div class="f1-driver-last-name">${chief?.last_name ?? "-"}</div>
      </div>
    </div>
  `;
}

function renderConfirmDriverCard(driver, label) {
  const driverCard = driver
    ? renderDriverCard(driver)
        .replace("data-driver-id=", "data-driver-id-confirm=")
        .replace("f1-driver-card", "f1-driver-card pointer-events-none")
    : `
      <div class="f1-driver-card opacity-40 pointer-events-none">
        <div class="f1-driver-top-right">
          <div class="dim-text">-</div>
          <div style="margin-top: 4px;"><span class="dim-text">AGE:</span> -</div>
        </div>
        <div class="f1-driver-stats-right">
          <div class="f1-driver-overall-wrap">
            <span class="f1-driver-star">★</span>
            <span class="f1-driver-overall">-</span>
          </div>
          <div class="f1-driver-substats">
            <div class="substat"><span class="dim-text">COR</span> -</div>
            <div class="substat"><span class="dim-text">BRK</span> -</div>
            <div class="substat"><span class="dim-text">REA</span> -</div>
          </div>
        </div>
        <div class="f1-driver-bottom">
          <div class="f1-driver-first-name">EMPTY</div>
          <div class="f1-driver-last-name">SLOT</div>
        </div>
      </div>
    `;

  return `
    <div style="flex: 0 1 260px; min-width:240px; display:flex; flex-direction:column; align-items:center;">
      <div class="text-xs font-orbitron tracking-widest" style="color: var(--accent-cyan); margin-bottom: 12px; letter-spacing: 2px;">${label}</div>
      ${driverCard}
    </div>
  `;
}

// ============================================================
// Validation
// ============================================================

function validateCurrentStep() {
  const team = wizardState.team;

  if (getRemainingBudget() < 0) {
    showToast("Saldo tidak cukup.");
    return false;
  }

  if (wizardState.currentStep === 1) {
    const name = document.getElementById("inp-name")?.value?.trim();

    if (!name) {
      showToast("Enter team name.");
      return false;
    }

    team.identity.name = name;

    team.identity.shortName = (
      document.getElementById("inp-short")?.value?.trim() || name.slice(0, 3)
    ).toUpperCase();

    team.identity.base.country =
      document.getElementById("inp-country")?.value?.trim() || "Unknown";

    team.identity.base.city =
      document.getElementById("inp-city")?.value?.trim() || "Unknown";
  }

  if (wizardState.currentStep === 3 && team.lineup.driverIds.length !== 2) {
    showToast("Select 2 drivers.");
    return false;
  }

  if (
    wizardState.currentStep === 4 &&
    (!team.lineup.teamChiefId || !team.lineup.technicalChiefId)
  ) {
    showToast("Select Team Chief and Technical Chief.");
    return false;
  }

  if (wizardState.currentStep === 5 && !team.lineup.powerUnitId) {
    showToast("Select power unit.");
    return false;
  }

  if (wizardState.currentStep === 6 && !team.lineup.chassisId) {
    showToast("Select chassis.");
    return false;
  }

  return true;
}

// ============================================================
// Save
// ============================================================

async function saveTeam() {
  try {
    const tier = ambitionLevels[wizardState.team.ambitionTier];

    const sponsors = assignSponsors();

    const teamId = `player_${wizardState.team.identity.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")}`;

    const payload = {
      id: teamId,

      profile: {
        name: wizardState.team.identity.name,

        short_name: wizardState.team.identity.shortName,
      },

      base: {
        ...wizardState.team.identity.base,
      },

      sporting: {
        drivers: [...wizardState.team.lineup.driverIds],

        team_chief_id: wizardState.team.lineup.teamChiefId,

        technical_chief_id: wizardState.team.lineup.technicalChiefId,

        power_unit_id: wizardState.team.lineup.powerUnitId,

        chassis_id: wizardState.team.lineup.chassisId,
      },

      financials: {
        starting_budget_idr: tier.financials.initial_budget_idr,

        operational_cost_idr: calculateTotalSpend(),

        reserve_cash_idr: getRemainingBudget(),
      },

      facilities: {
        ...tier.facilities,
      },

      workforce: {
        ...tier.workforce,
      },

      ai_behavior: {
        ...tier.ai_behavior,
      },

      sponsors: sponsors.map((s) => s.title_sponsor),

      meta: {
        is_player_team: true,
        created_at: new Date().toISOString(),
      },
    };

    const gameState = {
      currentSeasonId: "2026",
      currentRound: 0,
      currentPhase: "PreSeason",
      playerTeamId: teamId,
    };

    await saveProgress({
      playerTeam: payload,
      gameState,
    });

    store.merge({
      playerTeam: payload,
      gameState,
    });

    router.goTo("dashboard");
  } catch (err) {
    console.error(err);

    showToast("Failed to save career.");
  }
}

// ============================================================
// Calculations
// ============================================================

function calculateTotalSpend() {
  const drivers = wizardState.team.lineup.driverIds.reduce((sum, id) => {
    return sum + (wizardState.masterData.driversById[id]?.price_idr ?? 0);
  }, 0);

  const teamChief =
    wizardState.masterData.teamChiefsById[wizardState.team.lineup.teamChiefId]
      ?.price_idr ?? 0;

  const technicalChief =
    wizardState.masterData.technicalChiefsById[
      wizardState.team.lineup.technicalChiefId
    ]?.price_idr ?? 0;

  const pu =
    wizardState.masterData.powerUnitsById[wizardState.team.lineup.powerUnitId]
      ?.price_idr ?? 0;

  const chassis =
    wizardState.masterData.chassisById[wizardState.team.lineup.chassisId]
      ?.price_idr ?? 0;

  return drivers + teamChief + technicalChief + pu + chassis;
}

function getRemainingBudget() {
  const tier = ambitionLevels[wizardState.team.ambitionTier];

  return tier.financials.initial_budget_idr - calculateTotalSpend();
}

function assignSponsors() {
  const sponsorTierMap = {
    local_indonesia: ["C", "B"],
    asian_contender: ["B", "A"],
    global_powerhouse: ["A", "S"],
  };

  return wizardState.masterData.sponsors
    .filter((s) =>
      sponsorTierMap[wizardState.team.ambitionTier].includes(s.sponsor_tier)
    )
    .slice(0, 2);
}

// ============================================================
// Utils
// ============================================================

function money(v) {
  return `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
}

function moneyCompact(v) {
  const n = Number(v || 0);

  // 1 Triliun ke atas
  if (n >= 1_000_000_000_000) {
    return `${(n / 1_000_000_000_000).toFixed(1).replace(".0", "")} T`;
  }

  // 1 Miliar hingga di bawah 1 Triliun
  if (n >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(1).replace(".0", "")} M`;
  }

  // 1 Juta hingga di bawah 1 Miliar
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(".0", "")} Jt`; // atau 'J' sesuai selera
  }

  // 1 Ribu hingga di bawah 1 Juta (opsional, jika ingin disingkat 'rb')
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(".0", "")} rb`;
  }

  // Di bawah 1000, tampilkan angka asli dengan format Indonesia
  return n.toLocaleString("id-ID");
}
