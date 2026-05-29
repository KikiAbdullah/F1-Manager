// ============================================================
// F1 MANAGER 2026 — WEATHER ENGINE V1
// ============================================================
// Architecture:
// WEATHER
// -> TRACK SURFACE
// -> TYRE RESPONSE
// -> DRIVER RESPONSE
// -> LAP PERFORMANCE
// ============================================================

// ============================================================
// Weather Conditions
// ============================================================

export const WEATHER_CONDITIONS = {
  CLEAR: "clear",
  CLOUDY: "cloudy",
  OVERCAST: "overcast",
  LIGHT_RAIN: "light_rain",
  MEDIUM_RAIN: "medium_rain",
  HEAVY_RAIN: "heavy_rain",
  STORM: "storm",
};

// ============================================================
// Tyre Compounds
// ============================================================

export const TYRE_COMPOUNDS = {
  SOFT: "soft",
  MEDIUM: "medium",
  HARD: "hard",
  INTERMEDIATE: "intermediate",
  WET: "wet",
};

// ============================================================
// Weather Engine Factory
// ============================================================

export function createWeatherEngine(trackProfile = {}) {
  return {
    weatherState: createInitialWeatherState(trackProfile),
    weatherTimeline: generateWeatherTimeline(trackProfile),
    trackSurface: createTrackSurfaceState(),
  };
}

// ============================================================
// Initial Weather State
// ============================================================

export function createInitialWeatherState(trackProfile = {}) {
  const baseAirTemp = randomBetween(18, 32);

  return {
    condition: WEATHER_CONDITIONS.CLEAR,

    rainIntensity: 0,
    humidity: 35,

    airTemp: baseAirTemp,
    trackTemp: baseAirTemp + 8,

    windSpeed: randomBetween(5, 20),
    windDirection: randomBetween(0, 360),

    visibility: 100,

    trackWetness: 0,
    standingWater: 0,

    dryingRate: 2.5,

    weatherTrend: "stable",

    currentLap: 1,
  };
}

// ============================================================
// Track Surface State
// ============================================================

export function createTrackSurfaceState() {
  return {
    rubberLevel: 0,
    gripLevel: 100,
    marbles: 0,
    wetness: 0,
    dryingLine: 0,
  };
}

// ============================================================
// Weather Timeline Generator
// ============================================================

export function generateWeatherTimeline(trackProfile = {}) {
  const totalLaps = trackProfile.total_laps || 58;

  const rainProbability = trackProfile.rain_probability ?? 25;

  const timeline = [];

  let rain = 0;

  for (let lap = 1; lap <= totalLaps; lap++) {
    const rainChanceRoll = Math.random() * 100;

    if (rainChanceRoll < rainProbability * 0.08) {
      rain += randomBetween(5, 20);
    } else {
      rain -= randomBetween(0, 8);
    }

    rain = clamp(rain, 0, 100);

    timeline.push({
      lap,
      rainIntensity: Math.round(rain),
    });
  }

  return smoothWeatherTimeline(timeline);
}

// ============================================================
// Smooth Timeline
// ============================================================

function smoothWeatherTimeline(timeline) {
  return timeline.map((entry, index) => {
    const prev = timeline[index - 1]?.rainIntensity ?? entry.rainIntensity;
    const next = timeline[index + 1]?.rainIntensity ?? entry.rainIntensity;

    return {
      ...entry,
      rainIntensity: Math.round((prev + entry.rainIntensity + next) / 3),
    };
  });
}

// ============================================================
// Main Update Loop
// ============================================================

export function updateWeatherEngine(engine, lap, carsOnTrack = 20) {
  const weatherData = engine.weatherTimeline.find((x) => x.lap === lap);

  if (!weatherData) return engine;

  const state = engine.weatherState;

  state.currentLap = lap;
  state.rainIntensity = weatherData.rainIntensity;

  state.condition = determineCondition(state.rainIntensity);

  state.humidity = clamp(30 + state.rainIntensity * 0.7, 30, 100);

  updateTrackWetness(state, carsOnTrack);

  updateStandingWater(state);

  updateVisibility(state);

  updateTemperatures(state);

  updateDryingRate(state);

  updateTrackSurface(engine.trackSurface, state, carsOnTrack);

  return engine;
}

// ============================================================
// Weather Condition
// ============================================================

export function determineCondition(rainIntensity) {
  if (rainIntensity <= 0) {
    return WEATHER_CONDITIONS.CLEAR;
  }

  if (rainIntensity <= 20) {
    return WEATHER_CONDITIONS.LIGHT_RAIN;
  }

  if (rainIntensity <= 45) {
    return WEATHER_CONDITIONS.MEDIUM_RAIN;
  }

  if (rainIntensity <= 75) {
    return WEATHER_CONDITIONS.HEAVY_RAIN;
  }

  return WEATHER_CONDITIONS.STORM;
}

// ============================================================
// Track Wetness
// ============================================================

export function updateTrackWetness(state, carsOnTrack) {
  const rainGain = state.rainIntensity * 0.08;

  const dryingEffect = state.dryingRate * carsOnTrack * 0.01;

  state.trackWetness += rainGain;
  state.trackWetness -= dryingEffect;

  state.trackWetness = clamp(state.trackWetness, 0, 100);
}

// ============================================================
// Standing Water
// ============================================================

export function updateStandingWater(state) {
  const waterGain = state.rainIntensity * 0.05;

  const evaporation = state.trackTemp * 0.015;

  state.standingWater += waterGain;
  state.standingWater -= evaporation;

  state.standingWater = clamp(state.standingWater, 0, 100);
}

// ============================================================
// Visibility
// ============================================================

export function updateVisibility(state) {
  const sprayEffect = state.trackWetness * 0.3;

  state.visibility = 100 - (state.rainIntensity * 0.5 + sprayEffect);

  state.visibility = clamp(state.visibility, 10, 100);
}

// ============================================================
// Temperatures
// ============================================================

export function updateTemperatures(state) {
  const coolingEffect = state.rainIntensity * 0.06;

  state.trackTemp -= coolingEffect;

  if (state.rainIntensity === 0) {
    state.trackTemp += 0.4;
  }

  state.trackTemp = clamp(state.trackTemp, 10, 55);
}

// ============================================================
// Drying Rate
// ============================================================

export function updateDryingRate(state) {
  state.dryingRate = state.trackTemp * 0.06 + state.windSpeed * 0.04;
}

// ============================================================
// Track Surface Evolution
// ============================================================

export function updateTrackSurface(surface, state, carsOnTrack) {
  if (state.trackWetness < 20) {
    surface.rubberLevel += carsOnTrack * 0.02;
  }

  surface.dryingLine += carsOnTrack * 0.015;

  surface.rubberLevel = clamp(surface.rubberLevel, 0, 100);

  surface.dryingLine = clamp(surface.dryingLine, 0, 100);

  const wetnessPenalty = state.trackWetness * 0.45;

  surface.gripLevel = 100 + surface.rubberLevel * 0.12 - wetnessPenalty;

  surface.gripLevel = clamp(surface.gripLevel, 45, 110);
}

// ============================================================
// Tyre Performance
// ============================================================

export function calculateTyrePerformance({
  tyreCompound,
  weatherState,
  trackSurface,
  tyreTemperature,
}) {
  const compoundGrip = getBaseTyreGrip(tyreCompound);

  const weatherModifier = getWeatherTyreModifier(
    tyreCompound,
    weatherState.trackWetness
  );

  const tempModifier = getTyreTemperatureModifier(tyreTemperature);

  const effectiveGrip =
    compoundGrip *
    weatherModifier *
    (trackSurface.gripLevel / 100) *
    tempModifier;

  return {
    effectiveGrip,
    weatherModifier,
    tempModifier,
  };
}

// ============================================================
// Base Tyre Grip
// ============================================================

export function getBaseTyreGrip(compound) {
  switch (compound) {
    case TYRE_COMPOUNDS.SOFT:
      return 1.12;

    case TYRE_COMPOUNDS.MEDIUM:
      return 1.05;

    case TYRE_COMPOUNDS.HARD:
      return 0.98;

    case TYRE_COMPOUNDS.INTERMEDIATE:
      return 1.0;

    case TYRE_COMPOUNDS.WET:
      return 0.95;

    default:
      return 1.0;
  }
}

// ============================================================
// Tyre Weather Modifier
// ============================================================

export function getWeatherTyreModifier(compound, wetness) {
  const slickTyres = [
    TYRE_COMPOUNDS.SOFT,
    TYRE_COMPOUNDS.MEDIUM,
    TYRE_COMPOUNDS.HARD,
  ];

  if (slickTyres.includes(compound)) {
    if (wetness <= 10) return 1.0;
    if (wetness <= 25) return 0.92;
    if (wetness <= 40) return 0.72;
    if (wetness <= 60) return 0.45;

    return 0.18;
  }

  if (compound === TYRE_COMPOUNDS.INTERMEDIATE) {
    if (wetness <= 10) return 0.75;
    if (wetness <= 25) return 1.0;
    if (wetness <= 45) return 1.05;
    if (wetness <= 65) return 0.92;

    return 0.7;
  }

  if (compound === TYRE_COMPOUNDS.WET) {
    if (wetness <= 20) return 0.45;
    if (wetness <= 40) return 0.8;
    if (wetness <= 70) return 1.05;

    return 1.12;
  }

  return 1.0;
}

// ============================================================
// Tyre Temperature Modifier
// ============================================================

export function getTyreTemperatureModifier(temp) {
  if (temp < 70) {
    return 0.82;
  }

  if (temp < 85) {
    return 0.94;
  }

  if (temp <= 105) {
    return 1.0;
  }

  if (temp <= 120) {
    return 0.92;
  }

  return 0.76;
}

// ============================================================
// Driver Wet Skill
// ============================================================

export function calculateDriverWetSkill(driverStats) {
  return driverStats.adaptability * 0.6 + driverStats.control * 0.4;
}

// ============================================================
// Wet Pace Modifier
// ============================================================

export function calculateWetPaceModifier(driverStats, weatherState) {
  const wetSkill = calculateDriverWetSkill(driverStats);

  return wetSkill * (weatherState.trackWetness / 100) * 0.012;
}

// ============================================================
// Incident Chance
// ============================================================

export function calculateWeatherIncidentModifier({
  weatherState,
  driverStats,
  tyreCompound,
}) {
  let modifier = 1.0;

  modifier += weatherState.trackWetness * 0.012;

  modifier += weatherState.standingWater * 0.02;

  modifier += (100 - weatherState.visibility) * 0.01;

  modifier -= driverStats.control * 0.004;

  modifier -= driverStats.adaptability * 0.003;

  const tyreModifier = getWeatherTyreModifier(
    tyreCompound,
    weatherState.trackWetness
  );

  if (tyreModifier < 0.7) {
    modifier += 1.2;
  }

  return clamp(modifier, 0.5, 5.0);
}

// ============================================================
// Aquaplaning Check
// ============================================================

export function checkAquaplaning(weatherState) {
  if (weatherState.standingWater < 65) {
    return false;
  }

  const risk =
    (weatherState.standingWater + weatherState.rainIntensity) * 0.006;

  return Math.random() < risk;
}

// ============================================================
// Forecast
// ============================================================

export function getForecast(engine, currentLap, range = 5) {
  return engine.weatherTimeline.filter(
    (x) => x.lap >= currentLap && x.lap <= currentLap + range
  );
}

// ============================================================
// Helpers
// ============================================================

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// ============================================================
// Example Usage
// ============================================================

/*
  
  const weatherEngine = createWeatherEngine({
    total_laps: 58,
    rain_probability: 45,
  });
  
  for (let lap = 1; lap <= 58; lap++) {
    updateWeatherEngine(weatherEngine, lap, 20);
  
    console.log(
      lap,
      weatherEngine.weatherState.condition,
      weatherEngine.weatherState.trackWetness
    );
  }
  
  */
