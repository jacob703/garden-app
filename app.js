"use strict";

/* ---------- Constants & storage ---------- */

const STORAGE_KEY = "bgp_beds";
const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-27.4698&longitude=153.0251&current=temperature_2m,precipitation,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,sunrise,sunset&timezone=Australia%2FBrisbane&forecast_days=7";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DEFAULT_SLOT_COUNT = 4;

const PLANT_ACCENTS = {
  Tomato: "#d9534f", Capsicum: "#e0703a", Chilli: "#c0392b", Cucumber: "#4c8c3f",
  Zucchini: "#f0c419", "Sweet corn": "#f0c419", "Sweet potato": "#c9924f", Beetroot: "#a23b5c",
  Broccoli: "#4c8c3f", Cabbage: "#8fce5c", Carrot: "#e8843c", Lettuce: "#8fce5c",
  Onion: "#c9924f", Pea: "#6fae6f", Radish: "#d9534f", Silverbeet: "#c0392b",
  Spinach: "#4c8c3f", Garlic: "#f0e4cf", Potato: "#c9924f", Ginger: "#e0ab72",
  Rockmelon: "#e8843c", Watermelon: "#e05c6e", Pumpkin: "#e8843c", "Snow pea": "#6fae6f",
  Rosemary: "#6a8f5c", Coriander: "#6fae6f", Mint: "#4fae7a", Parsley: "#4c8c3f",
  Eggplant: "#6a4c93", Basil: "#4fae7a",
};

function plantAccent(name) {
  return PLANT_ACCENTS[name] || "#8fce5c";
}

function plantSpriteSVG(stage, accent) {
  if (stage === 0) {
    return `<svg viewBox="0 0 6 6" shape-rendering="crispEdges" class="plant-svg">
      <rect x="2" y="4" width="2" height="2" fill="#6b4423"/>
      <rect x="2" y="2" width="1" height="2" fill="#5c9c3f"/>
      <rect x="3" y="1" width="1" height="3" fill="#5c9c3f"/>
      <rect x="1" y="2" width="1" height="1" fill="#8fce5c"/>
      <rect x="4" y="1" width="1" height="1" fill="#8fce5c"/>
    </svg>`;
  }
  if (stage === 1) {
    return `<svg viewBox="0 0 10 10" shape-rendering="crispEdges" class="plant-svg">
      <rect x="4" y="7" width="2" height="3" fill="#6b4423"/>
      <rect x="3" y="5" width="4" height="2" fill="#5c9c3f"/>
      <rect x="2" y="6" width="1" height="2" fill="#5c9c3f"/>
      <rect x="7" y="6" width="1" height="2" fill="#5c9c3f"/>
      <rect x="3" y="4" width="4" height="1" fill="#8fce5c"/>
      <rect x="4" y="3" width="2" height="1" fill="#8fce5c"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 10 10" shape-rendering="crispEdges" class="plant-svg">
    <rect x="4" y="8" width="2" height="2" fill="#6b4423"/>
    <rect x="2" y="6" width="6" height="2" fill="#5c9c3f"/>
    <rect x="1" y="7" width="1" height="1" fill="#5c9c3f"/>
    <rect x="8" y="7" width="1" height="1" fill="#5c9c3f"/>
    <rect x="2" y="4" width="6" height="2" fill="#8fce5c"/>
    <rect x="3" y="2" width="4" height="2" fill="${accent}"/>
    <rect x="4" y="1" width="2" height="1" fill="${accent}"/>
  </svg>`;
}

const LOVE_MESSAGES = [
  "Love you baby 💕",
  "Look at the plants! 🌱",
  "Your garden is blooming, Em 🌻",
  "Best gardener in Brisbane 🏆",
  "Keep growing, keep glowing ✨",
  "Emily's garden = pure magic 🪄",
  "Have a beautiful day, love ☀️",
  "So proud of your green thumb 🌿",
];

let weatherData = null; // { current: {...}, daily: {...} }
let beds = loadBeds();
let plantModalBedId = null;
let plantModalSlotIndex = null;
let bedModalMode = "add"; // "add" | "rename"
let bedModalTargetId = null;

/* ---------- Helpers ---------- */

function todayISO() {
  return dateToISO(new Date());
}

function dateToISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysSince(isoDate) {
  const then = new Date(isoDate + "T00:00:00");
  const now = new Date(todayISO() + "T00:00:00");
  return Math.round((now - then) / 86400000);
}

function getSeason(monthIndex) {
  // Southern hemisphere seasons
  if ([11, 0, 1].includes(monthIndex)) return "Summer";
  if ([2, 3, 4].includes(monthIndex)) return "Autumn";
  if ([5, 6, 7].includes(monthIndex)) return "Winter";
  return "Spring";
}

function weatherEmoji(code) {
  if (code === 0) return "☀️";
  if (code === 1) return "🌤️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67].includes(code)) return "🌧️";
  if ([71, 73, 75, 77].includes(code)) return "🌨️";
  if ([80, 81, 82].includes(code)) return "🌦️";
  if ([85, 86].includes(code)) return "🌨️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌡️";
}

function findPlant(name) {
  return PLANTS.find((p) => p.name === name) || null;
}

function emptyPlot() {
  return { plantName: null, plantedDate: null, lastWatered: null };
}

/* ---------- Storage ---------- */

function loadBeds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map(migrateBed);
  } catch (e) {
    return [];
  }
}

function migrateBed(bed) {
  if (Array.isArray(bed.plots)) return bed;
  // Legacy single-plant-per-bed format.
  const plots = Array.from({ length: DEFAULT_SLOT_COUNT }, emptyPlot);
  if (bed.plantName) {
    plots[0] = {
      plantName: bed.plantName,
      plantedDate: bed.plantedDate,
      lastWatered: bed.lastWatered,
    };
  }
  return { id: bed.id, name: bed.name, plots };
}

function saveBeds() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(beds));
}

/* ---------- Cross-device share/import ---------- */

function encodeGardenData(bedsData) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(bedsData))));
}

function decodeGardenData(encoded) {
  return JSON.parse(decodeURIComponent(escape(atob(encoded))));
}

function buildShareLink() {
  const encoded = encodeGardenData(beds);
  const url = new URL(window.location.href);
  url.hash = `garden=${encoded}`;
  return url.toString();
}

function openShareModal() {
  const input = document.getElementById("shareLinkInput");
  input.value = buildShareLink();
  document.getElementById("shareModal").classList.remove("hidden");
  input.focus();
  input.select();
}

function closeShareModal() {
  document.getElementById("shareModal").classList.add("hidden");
}

function copyShareLink() {
  const input = document.getElementById("shareLinkInput");
  input.select();
  const btn = document.getElementById("copyShareLinkBtn");
  const showCopied = () => {
    const original = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => {
      btn.textContent = original;
    }, 1800);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(input.value).then(showCopied).catch(() => {
      document.execCommand("copy");
      showCopied();
    });
  } else {
    document.execCommand("copy");
    showCopied();
  }
}

function checkForImport() {
  const hash = window.location.hash;
  if (!hash.startsWith("#garden=")) return;

  const encoded = hash.slice("#garden=".length);
  try {
    const imported = decodeGardenData(encoded);
    if (!Array.isArray(imported)) throw new Error("Invalid garden data");
    const plotCount = imported.reduce((n, b) => n + (Array.isArray(b.plots) ? b.plots.filter((p) => p.plantName).length : 0), 0);
    const ok = confirm(
      `Import this garden? It has ${imported.length} bed(s) with ${plotCount} planted spot(s). This will replace the garden currently saved on this device.`
    );
    if (ok) {
      beds = imported.map(migrateBed);
      saveBeds();
    }
  } catch (e) {
    alert("That garden link looks invalid or corrupted.");
  }
  history.replaceState(null, "", window.location.pathname + window.location.search);
}

/* ---------- Season header ---------- */

function renderSeasonHeader() {
  const now = new Date();
  const season = getSeason(now.getMonth());
  const monthName = MONTH_NAMES[now.getMonth()];
  document.getElementById(
    "seasonLine"
  ).textContent = `${season} · ${monthName} · Subtropical climate`;
}

/* ---------- Weather ---------- */

async function fetchWeather() {
  try {
    const res = await fetch(WEATHER_URL);
    if (!res.ok) throw new Error("Weather request failed");
    const data = await res.json();
    weatherData = { current: data.current, daily: data.daily };
    renderWeatherNow();
    renderForecastStrip();
  } catch (err) {
    document.getElementById("weatherNow").innerHTML =
      '<span class="loading">Weather unavailable right now</span>';
  }
  renderReminders();
  renderSkyArc();
}

function renderWeatherNow() {
  const el = document.getElementById("weatherNow");
  if (!weatherData || !weatherData.current) {
    el.innerHTML = '<span class="loading">Weather unavailable</span>';
    return;
  }
  const c = weatherData.current;
  const emoji = weatherEmoji(c.weather_code);
  el.innerHTML = `
    <span class="wnow-emoji">${emoji}</span>
    <span>
      <strong>${Math.round(c.temperature_2m)}°C</strong>
      <span class="wnow-rain"> · ${c.precipitation ?? 0} mm rain now</span>
    </span>
  `;
}

function renderForecastStrip() {
  const strip = document.getElementById("forecastStrip");
  if (!weatherData || !weatherData.daily) {
    strip.innerHTML = "";
    return;
  }
  const d = weatherData.daily;
  strip.innerHTML = d.time
    .map((dateStr, i) => {
      const date = new Date(dateStr + "T00:00:00");
      const dayName = i === 0 ? "Today" : DAY_NAMES[date.getDay()];
      const emoji = weatherEmoji(d.weather_code[i]);
      const max = Math.round(d.temperature_2m_max[i]);
      const min = Math.round(d.temperature_2m_min[i]);
      const rain = d.precipitation_sum[i];
      return `
        <div class="forecast-day">
          <div class="fd-name">${dayName}</div>
          <span class="fd-emoji">${emoji}</span>
          <div class="fd-temps">${max}° / ${min}°</div>
          <div class="fd-rain">${rain > 0 ? rain + " mm" : "-"}</div>
        </div>
      `;
    })
    .join("");
}

/* ---------- Sun/moon sky arc ---------- */

function getSunMoonState(now) {
  const daily = weatherData && weatherData.daily;
  if (!daily || !daily.sunrise || !daily.sunset) {
    // Fallback before weather loads: assume 6am-6pm daylight.
    const hour = now.getHours() + now.getMinutes() / 60;
    if (hour >= 6 && hour <= 18) {
      return { isDay: true, t: (hour - 6) / 12 };
    }
    const nightHour = hour > 18 ? hour - 18 : hour + 6;
    return { isDay: false, t: nightHour / 12 };
  }

  const sunriseToday = new Date(daily.sunrise[0]);
  const sunsetToday = new Date(daily.sunset[0]);

  if (now >= sunriseToday && now <= sunsetToday) {
    const t = (now - sunriseToday) / (sunsetToday - sunriseToday);
    return { isDay: true, t: Math.min(1, Math.max(0, t)) };
  }

  let nightStart, nightEnd;
  if (now < sunriseToday) {
    nightEnd = sunriseToday;
    nightStart = new Date(sunsetToday.getTime() - 24 * 3600 * 1000);
  } else {
    nightStart = sunsetToday;
    nightEnd = daily.sunrise[1] ? new Date(daily.sunrise[1]) : new Date(sunriseToday.getTime() + 24 * 3600 * 1000);
  }
  const t = (now - nightStart) / (nightEnd - nightStart);
  return { isDay: false, t: Math.min(1, Math.max(0, t)) };
}

function renderSkyArc() {
  const arc = document.getElementById("skyArc");
  const body = document.getElementById("skyBody");
  if (!arc || !body) return;

  const state = getSunMoonState(new Date());
  const arcHeight = arc.clientHeight - 26;
  const leftPct = 6 + state.t * 88;
  const bottomPx = 6 + Math.sin(state.t * Math.PI) * Math.max(0, arcHeight);

  body.textContent = state.isDay ? "☀️" : "🌙";
  body.style.left = `${leftPct}%`;
  body.style.bottom = `${bottomPx}px`;
  arc.classList.toggle("sky-night", !state.isDay);
}

/* ---------- What to plant now ---------- */

function plantTooltip(plant) {
  const sowMonths = plant.months.map((m) => MONTH_SHORT[m]).join(", ");
  return `Sow: ${sowMonths} · Water every ${plant.wateringDays}d · Harvest in ~${plant.daysToHarvest}d · ${plant.sun}`;
}

function renderPlantNow() {
  const month = new Date().getMonth();
  const chipRow = document.getElementById("plantNowChips");
  const inSeason = PLANTS.filter((p) => p.months.includes(month));
  if (inSeason.length === 0) {
    chipRow.innerHTML = '<p class="empty-note">Nothing recommended for sowing this month.</p>';
    return;
  }
  chipRow.innerHTML = inSeason
    .map((p) => `<span class="chip" tabindex="0" data-tooltip="${escapeHtml(plantTooltip(p))}">${p.emoji} ${p.name}</span>`)
    .join("");
}

/* ---------- Growth visuals ---------- */

function getGrowthVisual(plant, pct) {
  const clamped = Math.min(100, pct);
  const stage = clamped < 20 ? 0 : clamped < 65 ? 1 : 2;
  const scale = (0.8 + (clamped / 100) * 0.9).toFixed(2); // 0.80 -> 1.70
  const svg = plantSpriteSVG(stage, plantAccent(plant.name));
  return { svg, scale };
}

/* ---------- Beds rendering ---------- */

function renderBeds() {
  const grid = document.getElementById("bedsGrid");
  if (beds.length === 0) {
    grid.innerHTML = '<p class="empty-note">No garden beds yet. Click "+ Add bed" to create one.</p>';
    return;
  }

  grid.innerHTML = beds.map((bed) => renderBedCard(bed)).join("");
}

function renderBedCard(bed) {
  const anyPlanted = bed.plots.some((p) => p.plantName);
  return `
    <div class="bed-card" data-bed-id="${bed.id}">
      <div class="bed-card-header">
        <span class="bed-name">${escapeHtml(bed.name)}</span>
        <div class="bed-actions">
          <button class="btn-icon" data-action="rename" title="Rename">✏️</button>
          <button class="btn-icon" data-action="remove" title="Remove bed">🗑️</button>
        </div>
      </div>
      <div class="bed-plots">
        ${bed.plots.map((plot, i) => renderPlot(plot, i)).join("")}
      </div>
      ${anyPlanted ? `
        <div class="bed-card-actions">
          <button class="btn btn-secondary btn-sm" data-action="water-all">💧 Water all</button>
        </div>` : ""}
    </div>
  `;
}

function renderPlot(plot, index) {
  if (!plot.plantName) {
    return `
      <button class="plot plot-empty" data-action="plant-slot" data-slot="${index}" title="Plant something here">
        <span class="plot-mound"></span>
        <span class="plot-plus">+</span>
      </button>
    `;
  }

  const plant = findPlant(plot.plantName);
  if (!plant) {
    return `<button class="plot plot-empty" data-action="plant-slot" data-slot="${index}" title="Plant something here"><span class="plot-mound"></span><span class="plot-plus">+</span></button>`;
  }

  const daysPlanted = daysSince(plot.plantedDate);
  const pct = Math.min(100, Math.round((daysPlanted / plant.daysToHarvest) * 100));
  const ready = daysPlanted >= plant.daysToHarvest;
  const remaining = plant.daysToHarvest - daysPlanted;
  const visual = getGrowthVisual(plant, pct);
  const daysWatered = daysSince(plot.lastWatered);
  const statusText = ready ? "Ready to harvest!" : `~${remaining} day${remaining === 1 ? "" : "s"} to harvest`;
  const tooltip = `${plant.name} — planted ${daysPlanted}d ago — ${statusText} — watered ${daysWatered}d ago`;

  return `
    <div class="plot plot-planted ${ready ? "ready" : ""}" data-slot="${index}" title="${escapeHtml(tooltip)}">
      ${ready ? '<span class="plot-sparkle">✨</span>' : ""}
      <button class="plot-mini-btn plot-water" data-action="water-slot" data-slot="${index}" title="Water">💧</button>
      <button class="plot-mini-btn plot-clear" data-action="clear-slot" data-slot="${index}" title="Clear">🗑️</button>
      <div class="plot-visual">
        <span class="plot-mound"></span>
        <span class="plot-sprite" style="transform:scale(${visual.scale});">${visual.svg}</span>
      </div>
      <span class="plot-label">${escapeHtml(plant.name)}</span>
      <div class="plot-progress"><div class="plot-progress-fill ${ready ? "ready" : ""}" style="width:${pct}%"></div></div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Bed actions ---------- */

function generateId() {
  return "bed_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

function addBed(name, slotCount) {
  const count = Math.min(9, Math.max(1, slotCount || DEFAULT_SLOT_COUNT));
  const plots = Array.from({ length: count }, emptyPlot);
  beds.push({ id: generateId(), name, plots });
  saveBeds();
  renderBeds();
}

function renameBed(id, newName) {
  const bed = beds.find((b) => b.id === id);
  if (bed) {
    bed.name = newName;
    saveBeds();
    renderBeds();
  }
}

function removeBed(id) {
  beds = beds.filter((b) => b.id !== id);
  saveBeds();
  renderBeds();
  renderReminders();
}

function plantInSlot(bedId, slotIndex, plantName) {
  const bed = beds.find((b) => b.id === bedId);
  if (!bed) return;
  bed.plots[slotIndex] = {
    plantName,
    plantedDate: todayISO(),
    lastWatered: todayISO(),
  };
  saveBeds();
  renderBeds();
  renderReminders();
}

function waterSlot(bedId, slotIndex) {
  const bed = beds.find((b) => b.id === bedId);
  if (!bed) return;
  const plot = bed.plots[slotIndex];
  if (!plot || !plot.plantName) return;
  plot.lastWatered = todayISO();
  saveBeds();
  renderBeds();
  renderReminders();
}

function clearSlot(bedId, slotIndex) {
  const bed = beds.find((b) => b.id === bedId);
  if (!bed) return;
  bed.plots[slotIndex] = emptyPlot();
  saveBeds();
  renderBeds();
  renderReminders();
}

function waterAllInBed(bedId) {
  const bed = beds.find((b) => b.id === bedId);
  if (!bed) return;
  const today = todayISO();
  bed.plots.forEach((p) => {
    if (p.plantName) p.lastWatered = today;
  });
  saveBeds();
  renderBeds();
  renderReminders();
}

/* ---------- Plant picker modal ---------- */

function openPlantModal(bedId, slotIndex) {
  plantModalBedId = bedId;
  plantModalSlotIndex = slotIndex;
  const month = new Date().getMonth();
  const sorted = [...PLANTS].sort((a, b) => {
    const aIn = a.months.includes(month) ? 0 : 1;
    const bIn = b.months.includes(month) ? 0 : 1;
    if (aIn !== bIn) return aIn - bIn;
    return a.name.localeCompare(b.name);
  });

  const grid = document.getElementById("plantPickerGrid");
  grid.innerHTML = sorted
    .map((p) => {
      const inSeason = p.months.includes(month);
      return `
        <button class="plant-pick-btn ${inSeason ? "" : "out-of-season"}" data-plant="${escapeHtml(p.name)}">
          <span class="pp-emoji">${p.emoji}</span>
          <span>${p.name}</span>
          <span class="pp-tag">${inSeason ? "In season" : "Out of season"}</span>
        </button>
      `;
    })
    .join("");

  document.getElementById("plantModal").classList.remove("hidden");
}

function closePlantModal() {
  document.getElementById("plantModal").classList.add("hidden");
  plantModalBedId = null;
  plantModalSlotIndex = null;
}

/* ---------- Bed add/rename modal ---------- */

function openBedModal(mode, bedId) {
  bedModalMode = mode;
  bedModalTargetId = bedId || null;
  const title = document.getElementById("bedModalTitle");
  const input = document.getElementById("bedNameInput");
  const slotsField = document.getElementById("bedSlotsField");
  const slotsInput = document.getElementById("bedSlotsInput");

  if (mode === "rename") {
    const bed = beds.find((b) => b.id === bedId);
    title.textContent = "Rename bed";
    input.value = bed ? bed.name : "";
    slotsField.style.display = "none";
  } else {
    title.textContent = "Add garden bed";
    input.value = "";
    slotsInput.value = DEFAULT_SLOT_COUNT;
    slotsField.style.display = "";
  }

  document.getElementById("bedModal").classList.remove("hidden");
  input.focus();
}

function closeBedModal() {
  document.getElementById("bedModal").classList.add("hidden");
}

function saveBedModal() {
  const input = document.getElementById("bedNameInput");
  const name = input.value.trim();
  if (!name) {
    input.focus();
    return;
  }
  if (bedModalMode === "rename") {
    renameBed(bedModalTargetId, name);
  } else {
    const slotsInput = document.getElementById("bedSlotsInput");
    const slotCount = parseInt(slotsInput.value, 10) || DEFAULT_SLOT_COUNT;
    addBed(name, slotCount);
  }
  closeBedModal();
}

/* ---------- Reminders ---------- */

function renderReminders() {
  const list = document.getElementById("remindersList");

  const todayRain =
    weatherData && weatherData.daily && weatherData.daily.precipitation_sum
      ? weatherData.daily.precipitation_sum[0] || 0
      : 0;

  const upcomingRain =
    weatherData && weatherData.daily && weatherData.daily.precipitation_sum
      ? (weatherData.daily.precipitation_sum[1] || 0) + (weatherData.daily.precipitation_sum[2] || 0)
      : 0;

  const reminders = [];

  if (upcomingRain >= 5) {
    reminders.push({
      type: "info",
      text: "Rain forecast in the next 2 days",
      sub: `~${upcomingRain.toFixed(1)} mm expected — consider holding off on extra watering.`,
    });
  }

  beds.forEach((bed) => {
    bed.plots.forEach((plot, i) => {
      if (!plot.plantName) return;
      const plant = findPlant(plot.plantName);
      if (!plant) return;

      const label = bed.plots.length > 1 ? `${bed.name} · Spot ${i + 1}` : bed.name;
      const daysPlanted = daysSince(plot.plantedDate);
      const remaining = plant.daysToHarvest - daysPlanted;

      if (remaining <= 0) {
        reminders.push({
          type: "harvest",
          text: `${plant.emoji} ${label} (${plant.name}) should be ready to harvest!`,
          sub: `Planted ${daysPlanted} days ago.`,
        });
      } else if (remaining <= 7) {
        reminders.push({
          type: "harvest",
          text: `${plant.emoji} ${label} (${plant.name}) ready to harvest in ~${remaining} day${remaining === 1 ? "" : "s"}`,
          sub: "Upcoming harvest.",
        });
      }

      const daysWatered = daysSince(plot.lastWatered);
      const overdue = daysWatered >= plant.wateringDays;

      if (overdue) {
        if (todayRain >= 5) {
          reminders.push({
            type: "info",
            text: `${plant.emoji} ${label} (${plant.name}) — recent rain covered watering`,
            sub: `${todayRain.toFixed(1)} mm fell today, no need to water.`,
          });
        } else {
          reminders.push({
            type: "warn",
            text: `${plant.emoji} ${label} (${plant.name}) needs watering`,
            sub: `Last watered ${daysWatered} day${daysWatered === 1 ? "" : "s"} ago.`,
            bedId: bed.id,
            slot: i,
          });
        }
      }
    });
  });

  if (reminders.length === 0) {
    list.innerHTML =
      beds.length === 0
        ? '<p class="empty-note">No garden beds yet — add one below to get started.</p>'
        : '<p class="empty-note">All caught up — nothing needs attention today.</p>';
    return;
  }

  list.innerHTML = reminders
    .map((r) => {
      const cls = r.type === "harvest" ? "harvest" : r.type === "warn" ? "warn" : "info";
      const button =
        r.bedId !== undefined
          ? `<button class="btn btn-secondary btn-sm" data-mark-watered-bed="${r.bedId}" data-mark-watered-slot="${r.slot}">Mark watered</button>`
          : "";
      return `
        <div class="reminder ${cls}">
          <div class="reminder-text">
            <strong>${r.text}</strong>
            <span class="reminder-sub">${r.sub}</span>
          </div>
          ${button}
        </div>
      `;
    })
    .join("");
}

/* ---------- Floating love messages ---------- */

function spawnFloatMessage() {
  const layer = document.getElementById("floatMessages");
  if (!layer) return;
  const msg = LOVE_MESSAGES[Math.floor(Math.random() * LOVE_MESSAGES.length)];
  const el = document.createElement("div");
  el.className = "float-message";
  el.textContent = msg;
  el.style.left = `${8 + Math.random() * 78}%`;
  el.style.setProperty("--drift", `${Math.random() * 60 - 30}px`);
  layer.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}

function scheduleFloatMessages() {
  const delay = 16000 + Math.random() * 20000; // 16s - 36s
  setTimeout(() => {
    spawnFloatMessage();
    scheduleFloatMessages();
  }, delay);
}

/* ---------- Garth, the garden guardian ---------- */

const GARTH_KEY = "bgp_garth_treats";
let garthCycleTimeout = null;
let garthBusyUntil = 0;

function loadGarthTreats() {
  try {
    const raw = localStorage.getItem(GARTH_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && parsed.date === todayISO()) return parsed.count;
    return 0;
  } catch (e) {
    return 0;
  }
}

function saveGarthTreats(count) {
  localStorage.setItem(GARTH_KEY, JSON.stringify({ date: todayISO(), count }));
}

function plantedPlantNames() {
  const names = [];
  beds.forEach((bed) => bed.plots.forEach((p) => { if (p.plantName) names.push(p.plantName); }));
  return names;
}

function setGarthState(state, speech) {
  const sprite = document.getElementById("garthSprite");
  const bubble = document.getElementById("garthSpeech");
  if (!sprite || !bubble) return;
  sprite.className = `garth-sprite garth-${state}`;
  if (speech) {
    bubble.textContent = speech;
    bubble.classList.remove("hidden");
  } else {
    bubble.classList.add("hidden");
  }
}

function moveGarthTo(pct, state) {
  const sprite = document.getElementById("garthSprite");
  if (!sprite) return;
  sprite.style.left = `${pct}%`;
  setGarthState(state, null);
}

function spawnGarthHearts() {
  const scene = document.querySelector(".garth-scene");
  const sprite = document.getElementById("garthSprite");
  if (!scene || !sprite) return;
  const symbols = ["💕", "💖", "✨", "🐾"];
  const baseLeft = sprite.style.left || "50%";
  for (let i = 0; i < 5; i++) {
    const el = document.createElement("span");
    el.className = "garth-heart";
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.left = `calc(${baseLeft} + ${Math.random() * 40 - 20}px)`;
    el.style.setProperty("--dx", `${Math.random() * 50 - 25}px`);
    el.style.animationDelay = `${Math.random() * 0.3}s`;
    scene.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }
}

function garthIdleCycle() {
  if (Date.now() < garthBusyUntil) {
    scheduleGarthCycle();
    return;
  }

  if (Math.random() < 0.55) {
    const targetPct = 15 + Math.random() * 70;
    moveGarthTo(targetPct, "walking");
    setTimeout(() => {
      if (Date.now() < garthBusyUntil) return;
      const names = plantedPlantNames();
      const target = names.length ? names[Math.floor(Math.random() * names.length)] : null;
      setGarthState("sniffing", target ? `Garth is sniffing the ${target}! 👃` : "Garth is patrolling the empty beds 🐾");
      setTimeout(() => {
        if (Date.now() >= garthBusyUntil) setGarthState("sleeping", null);
      }, 4500);
    }, 1800);
  } else {
    setGarthState("sleeping", null);
  }
  scheduleGarthCycle();
}

function scheduleGarthCycle() {
  if (garthCycleTimeout) clearTimeout(garthCycleTimeout);
  const delay = 20000 + Math.random() * 25000; // 20s - 45s
  garthCycleTimeout = setTimeout(garthIdleCycle, delay);
}

function giveGarthTreat() {
  const count = loadGarthTreats() + 1;
  saveGarthTreats(count);
  renderGarthTreatCount(count);

  garthBusyUntil = Date.now() + 3200;
  setGarthState("happy", "Woof! Thank you!! 🦴");
  spawnGarthHearts();
  setTimeout(() => {
    if (Date.now() >= garthBusyUntil) setGarthState("sleeping", null);
  }, 3200);
}

function renderGarthTreatCount(count) {
  const el = document.getElementById("garthTreatCount");
  if (el) el.textContent = `Treats today: ${count}`;
}

function initGarth() {
  renderGarthTreatCount(loadGarthTreats());
  setGarthState("sleeping", null);
  scheduleGarthCycle();
}

/* ---------- Event wiring ---------- */

function wireEvents() {
  document.getElementById("addBedBtn").addEventListener("click", () => openBedModal("add"));

  document.getElementById("closePlantModal").addEventListener("click", closePlantModal);
  document.getElementById("plantModal").addEventListener("click", (e) => {
    if (e.target.id === "plantModal") closePlantModal();
  });

  document.getElementById("closeBedModal").addEventListener("click", closeBedModal);
  document.getElementById("bedModal").addEventListener("click", (e) => {
    if (e.target.id === "bedModal") closeBedModal();
  });
  document.getElementById("saveBedBtn").addEventListener("click", saveBedModal);
  document.getElementById("bedNameInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveBedModal();
  });

  document.getElementById("plantPickerGrid").addEventListener("click", (e) => {
    const btn = e.target.closest(".plant-pick-btn");
    if (!btn || !plantModalBedId || plantModalSlotIndex === null) return;
    plantInSlot(plantModalBedId, plantModalSlotIndex, btn.dataset.plant);
    closePlantModal();
  });

  document.getElementById("bedsGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".bed-card");
    if (!card) return;
    const bedId = card.dataset.bedId;

    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    const slot = actionEl.dataset.slot !== undefined ? parseInt(actionEl.dataset.slot, 10) : null;

    if (action === "plant-slot") openPlantModal(bedId, slot);
    else if (action === "water-slot") waterSlot(bedId, slot);
    else if (action === "clear-slot") {
      if (confirm("Clear this plot?")) clearSlot(bedId, slot);
    } else if (action === "water-all") waterAllInBed(bedId);
    else if (action === "rename") openBedModal("rename", bedId);
    else if (action === "remove") {
      if (confirm("Remove this garden bed and everything planted in it?")) removeBed(bedId);
    }
  });

  document.getElementById("remindersList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mark-watered-bed]");
    if (!btn) return;
    waterSlot(btn.dataset.markWateredBed, parseInt(btn.dataset.markWateredSlot, 10));
  });

  document.getElementById("garthTreatBtn").addEventListener("click", giveGarthTreat);

  document.getElementById("shareBedsBtn").addEventListener("click", openShareModal);
  document.getElementById("closeShareModal").addEventListener("click", closeShareModal);
  document.getElementById("shareModal").addEventListener("click", (e) => {
    if (e.target.id === "shareModal") closeShareModal();
  });
  document.getElementById("copyShareLinkBtn").addEventListener("click", copyShareLink);
}

/* ---------- Init ---------- */

function init() {
  checkForImport();
  renderSeasonHeader();
  renderPlantNow();
  renderBeds();
  renderReminders();
  wireEvents();
  fetchWeather();
  renderSkyArc();
  setInterval(renderSkyArc, 5 * 60 * 1000);
  scheduleFloatMessages();
  initGarth();
}

document.addEventListener("DOMContentLoaded", init);
