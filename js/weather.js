// ===========================================
// WEATHER ENGINE (Point #3) - Dynamic Weather System
// Fully integrated with race simulation
// ===========================================
const Weather = {
  // Create weather state for a race weekend
  createForRace(trackChars, totalLaps) {
    const rainVariability = trackChars.wet_weather_variability || 10;
    const baseAirTemp = Utils.rand(18, 36);
    const timeline = this.generateTimeline(totalLaps, rainVariability);

    return {
      airTemp: baseAirTemp,
      trackTemp: baseAirTemp + Utils.rand(6, 14),
      humidity: Utils.rand(25, 85),
      windSpeed: Utils.rand(3, 25),
      rainIntensity: 0,         // 0-100
      trackWetness: 0,          // 0-100
      condition: "dry",         // dry | damp | wet | storm
      gripModifier: 1.0,
      trackEvolution: (trackChars.track_evolution || 75) / 100,
      rubberLevel: 0,
      dryingRate: Utils.rand(1.5, 4.0),
      timeline: timeline,
      currentLap: 0,
    };
  },

  // Generate rain timeline for the entire race
  generateTimeline(totalLaps, rainProbability) {
    const timeline = [];
    let currentRain = 0;
    let trend = 0; // smoothing factor

    for (let lap = 0; lap <= totalLaps; lap++) {
      const roll = Math.random() * 100;

      if (roll < rainProbability * 0.06) {
        trend += Utils.rand(3, 12); // rain incoming
      } else if (roll < rainProbability * 0.15) {
        trend += Utils.rand(1, 5);
      } else {
        trend -= Utils.rand(1, 6); // drying
      }

      trend = Utils.clamp(trend, -5, 15);
      currentRain = Utils.clamp(currentRain + trend, 0, 100);
      timeline.push(Math.round(currentRain));
    }

    // Smooth the timeline
    for (let i = 1; i < timeline.length - 1; i++) {
      timeline[i] = Math.round((timeline[i - 1] + timeline[i] * 2 + timeline[i + 1]) / 4);
    }
    return timeline;
  },

  // Update weather state each lap
  updateLap(weatherState, lap) {
    weatherState.currentLap = lap;

    // Get rain from timeline
    const targetRain = weatherState.timeline[Math.min(lap, weatherState.timeline.length - 1)] || 0;
    weatherState.rainIntensity += (targetRain - weatherState.rainIntensity) * 0.3;
    weatherState.rainIntensity = Utils.clamp(weatherState.rainIntensity, 0, 100);

    // Track wetness responds to rain
    if (weatherState.rainIntensity > 10) {
      weatherState.trackWetness = Utils.clamp(
        weatherState.trackWetness + weatherState.rainIntensity * 0.04, 0, 100
      );
    } else {
      weatherState.trackWetness = Utils.clamp(
        weatherState.trackWetness - weatherState.dryingRate, 0, 100
      );
    }

    // Temperature fluctuation
    weatherState.airTemp += Utils.rand(-0.3, 0.3);
    weatherState.trackTemp = weatherState.airTemp + 8 - weatherState.rainIntensity * 0.12;

    // Determine condition label
    if (weatherState.rainIntensity > 70) weatherState.condition = "storm";
    else if (weatherState.rainIntensity > 35) weatherState.condition = "wet";
    else if (weatherState.rainIntensity > 10 || weatherState.trackWetness > 20) weatherState.condition = "damp";
    else weatherState.condition = "dry";

    // Grip modifier - inversely related to wetness
    const wetGripPenalty = weatherState.trackWetness * 0.004; // up to 0.4 loss
    weatherState.gripModifier = Utils.clamp(1.0 - wetGripPenalty, 0.55, 1.0);

    // Track evolution (rubber builds up in dry, washes away in wet)
    if (weatherState.condition === "dry") {
      weatherState.rubberLevel = Utils.clamp(weatherState.rubberLevel + 0.3, 0, 25);
    } else {
      weatherState.rubberLevel = Utils.clamp(weatherState.rubberLevel - 1.0, 0, 25);
    }
    weatherState.trackEvolution = Utils.clamp(
      weatherState.trackEvolution + weatherState.rubberLevel * 0.001, 0.85, 1.10
    );

    return weatherState;
  },

  // Get effective grip for a specific tyre compound in current weather
  getEffectiveGrip(weatherState, compound) {
    const tyreData = Utils.TYRE_COMPOUNDS[compound];
    if (!tyreData) return weatherState.gripModifier;

    if (weatherState.trackWetness > 30) {
      // Wet conditions - rain tyres much better
      return weatherState.gripModifier * tyreData.rain_grip * 1.5;
    } else {
      // Dry conditions - slick tyres dominate
      return weatherState.gripModifier * tyreData.grip;
    }
  },

  // Should AI switch to wet tyres?
  shouldSwitchToWets(weatherState, currentCompound) {
    if (weatherState.trackWetness > 45 && !["intermediate", "wet"].includes(currentCompound)) {
      return weatherState.trackWetness > 60 ? "wet" : "intermediate";
    }
    if (weatherState.trackWetness < 15 && ["intermediate", "wet"].includes(currentCompound)) {
      return "medium"; // switch back to slicks
    }
    return null;
  },

  // Get weather display label
  getLabel(weatherState) {
    const labels = {
      dry: "☀️ Cerah",
      damp: "🌦️ Lintasan Basah",
      wet: "🌧️ Hujan",
      storm: "⛈️ Hujan Lebat",
    };
    return labels[weatherState.condition] || "☀️ Cerah";
  },

  getShortLabel(weatherState) {
    const labels = { dry: "DRY", damp: "DAMP", wet: "WET", storm: "STORM" };
    return labels[weatherState.condition] || "DRY";
  },
};
