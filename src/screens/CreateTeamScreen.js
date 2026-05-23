import { store } from "../core/store.js";
import { router } from "../core/router.js";
import { saveProgress } from "../core/persistence.js";
import { showToast } from "../components/toast.js";

// ============================================================
// Constants
// ============================================================

const TOTAL_STEPS = 6;

const STEP_RENDERERS = {
  1: renderIdentityStep,
  2: renderAmbitionStep,
  3: renderDriverSelectionStep,
  4: renderPowerUnitStep,
  5: renderChassisStep,
  6: renderConfirmationStep,
};

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
      initial_budget_idr: 850000000000,

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

    ambitionTier: "new_entry",

    lineup: {
      driverIds: [],
      powerUnitId: null,
      chassisId: null,
    },
  },

  masterData: {
    drivers: [],
    driversById: {},

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

    ambitionTier: "new_entry",

    lineup: {
      driverIds: [],
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

  const [puRes, chassisRes, sponsorRes] = await Promise.all([
    fetch("./data/power_units.json"),
    fetch("./data/chassis.json"),
    fetch("./data/sponsors.json"),
  ]);

  const powerUnits = (await puRes.json()).data ?? [];
  const chassis = (await chassisRes.json()).data ?? [];
  const sponsors = (await sponsorRes.json()).data ?? [];

  wizardState.masterData.drivers = drivers;
  wizardState.masterData.powerUnits = powerUnits;
  wizardState.masterData.chassis = chassis;
  wizardState.masterData.sponsors = sponsors;

  wizardState.masterData.driversById = normalize(drivers);
  wizardState.masterData.powerUnitsById = normalize(powerUnits);
  wizardState.masterData.chassisById = normalize(chassis);
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
    toggleDriver(driverCard.dataset.driverId);

    return;
  }

  const puCard = e.target.closest("[data-pu-id]");

  if (puCard) {
    wizardState.team.lineup.powerUnitId = puCard.dataset.puId;

    renderCurrentStep();

    return;
  }

  const chassisCard = e.target.closest("[data-chassis-id]");

  if (chassisCard) {
    wizardState.team.lineup.chassisId = chassisCard.dataset.chassisId;

    renderCurrentStep();
  }
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
          <div class="f1-ambition-list" role="list">
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

        <div class="f1-car-indicators" aria-label="Selected cars">
          <div class="f1-car-indicator ${hasCar1 ? "active" : ""}" title="Car 1">
            <i class="ti ti-car"></i>
            <span>CAR 1</span>
          </div>
          <div class="f1-car-indicator ${hasCar2 ? "active" : ""}" title="Car 2">
            <i class="ti ti-car"></i>
            <span>CAR 2</span>
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

  const overall = driver.stats?.overall ?? 80;
  const cornering = driver.stats?.cornering ?? 80;
  const braking = driver.stats?.braking ?? 80;
  const reactiveness = driver.stats?.reactiveness ?? 80;
  const age = calculateAge(driver.date_of_birth);

  return `
    <div
      class="f1-driver-card ${selected ? "selected" : ""}"
      data-driver-id="${driver.id}"
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
  const prevGridScrollLeft = body?.querySelector(".driver-select-grid")
    ?.scrollLeft;

  const drivers = wizardState.team.lineup.driverIds;

  if (drivers.includes(id)) {
    wizardState.team.lineup.driverIds = drivers.filter((x) => x !== id);
  } else {
    if (drivers.length >= 2) {
      showToast("Maximum 2 drivers."); // Pastikan fungsi showToast sudah tersedia di kodemu
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
  body.innerHTML = `
    <div class="driver-select-grid">

      ${wizardState.masterData.powerUnits
        .filter((x) => x.is_active)
        .map(renderPowerUnitCard)
        .join("")}

    </div>
  `;
}

function renderPowerUnitCard(pu) {
  const selected = wizardState.team.lineup.powerUnitId === pu.id;

  return `
    <div
      class="driver-select-card ${selected ? "selected" : ""}"
      data-pu-id="${pu.id}"
    >

      <div class="d-name">
        ${pu.manufacturer}
      </div>

      <div class="text-xs">
        ${money(pu.price_idr)}
      </div>

    </div>
  `;
}

// ============================================================
// STEP 5
// ============================================================

function renderChassisStep(body) {
  body.innerHTML = `
    <div class="driver-select-grid">

      ${wizardState.masterData.chassis
        .filter((x) => x.is_active)
        .map(renderChassisCard)
        .join("")}

    </div>
  `;
}

function renderChassisCard(chassis) {
  const selected = wizardState.team.lineup.chassisId === chassis.id;

  return `
    <div
      class="driver-select-card ${selected ? "selected" : ""}"
      data-chassis-id="${chassis.id}"
    >

      <div class="d-name">
        ${chassis.name}
      </div>

      <div class="text-xs">
        ${money(chassis.price_idr)}
      </div>

    </div>
  `;
}

// ============================================================
// STEP 6
// ============================================================

function renderConfirmationStep(body) {
  const lineup = wizardState.team.lineup;

  const d1 = wizardState.masterData.driversById[lineup.driverIds[0]];

  const d2 = wizardState.masterData.driversById[lineup.driverIds[1]];

  const pu = wizardState.masterData.powerUnitsById[lineup.powerUnitId];

  const chassis = wizardState.masterData.chassisById[lineup.chassisId];

  body.innerHTML = `
    <div class="panel">

      <div>${d1?.full_name ?? "-"}</div>
      <div>${d2?.full_name ?? "-"}</div>

      <hr>

      <div>PU: ${pu?.manufacturer ?? "-"}</div>

      <div>
        Chassis:
        ${chassis?.name ?? "-"}
      </div>

      <div>
        Remaining Budget:
        ${money(getRemainingBudget())}
      </div>

    </div>
  `;

  document.getElementById("btnNext").innerHTML = `
    <i class="ti ti-flag-check"></i>
    START CAREER
  `;
}

// ============================================================
// Validation
// ============================================================

function validateCurrentStep() {
  const team = wizardState.team;

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

  if (wizardState.currentStep === 4 && !team.lineup.powerUnitId) {
    showToast("Select power unit.");
    return false;
  }

  if (wizardState.currentStep === 5 && !team.lineup.chassisId) {
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

  const pu =
    wizardState.masterData.powerUnitsById[wizardState.team.lineup.powerUnitId]
      ?.price_idr ?? 0;

  const chassis =
    wizardState.masterData.chassisById[wizardState.team.lineup.chassisId]
      ?.price_idr ?? 0;

  return drivers + pu + chassis;
}

function getRemainingBudget() {
  const tier = ambitionLevels[wizardState.team.ambitionTier];

  return tier.financials.initial_budget_idr - calculateTotalSpend();
}

function assignSponsors() {
  const sponsorTierMap = {
    new_entry: ["C", "B"],
    midfield: ["B", "A"],
    top_tier: ["A", "S"],
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
