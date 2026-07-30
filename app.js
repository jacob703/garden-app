"use strict";

/* ---------- Constants & storage ---------- */

const STORAGE_KEY = "bgp_beds";
const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-27.4698&longitude=153.0251&current=temperature_2m,precipitation,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=Australia%2FBrisbane&forecast_days=7";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

let weatherData = null; // { current: {...}, daily: {...} }
let beds = loadBeds();
let plantModalBedId = null;
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

/* ---------- Storage ---------- */

function loadBeds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveBeds() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(beds));
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

/* ---------- What to plant now ---------- */

function renderPlantNow() {
  const month = new Date().getMonth();
  const chipRow = document.getElementById("plantNowChips");
  const inSeason = PLANTS.filter((p) => p.months.includes(month));
  if (inSeason.length === 0) {
    chipRow.innerHTML = '<p class="empty-note">Nothing recommended for sowing this month.</p>';
    return;
  }
  chipRow.innerHTML = inSeason
    .map((p) => `<span class="chip">${p.emoji} ${p.name}</span>`)
    .join("");
}

/* ---------- Beds rendering ---------- */

function renderBeds() {
  const grid = document.getElementById("bedsGrid");
  if (beds.length === 0) {
    grid.innerHTML = '<p class="empty-note">No garden beds yet. Click "+ Add bed" to create one.</p>';
    return;
  }

  const month = new Date().getMonth();

  grid.innerHTML = beds
    .map((bed) => {
      const plant = bed.plantName ? findPlant(bed.plantName) : null;

      if (!plant) {
        return `
          <div class="bed-card" data-bed-id="${bed.id}">
            <div class="bed-card-header">
              <span class="bed-name">${escapeHtml(bed.name)}</span>
              <div class="bed-actions">
                <button class="btn-icon" data-action="rename" title="Rename">✏️</button>
                <button class="btn-icon" data-action="remove" title="Remove bed">🗑️</button>
              </div>
            </div>
            <div class="bed-empty">
              <span>Nothing planted here</span>
              <button class="btn btn-primary btn-sm" data-action="plant">+ Plant something</button>
            </div>
          </div>
        `;
      }

      const daysPlanted = daysSince(bed.plantedDate);
      const pct = Math.min(100, Math.round((daysPlanted / plant.daysToHarvest) * 100));
      const ready = daysPlanted >= plant.daysToHarvest;
      const remaining = plant.daysToHarvest - daysPlanted;
      const daysWatered = daysSince(bed.lastWatered);

      return `
        <div class="bed-card" data-bed-id="${bed.id}">
          <div class="bed-card-header">
            <span class="bed-name">${escapeHtml(bed.name)}</span>
            <div class="bed-actions">
              <button class="btn-icon" data-action="rename" title="Rename">✏️</button>
              <button class="btn-icon" data-action="remove" title="Remove bed">🗑️</button>
            </div>
          </div>
          <div class="bed-plant-row">
            <span class="plant-emoji">${plant.emoji}</span>
            <span>${plant.name}</span>
          </div>
          <div class="bed-meta">Planted ${daysPlanted} day${daysPlanted === 1 ? "" : "s"} ago</div>
          <div class="progress-track">
            <div class="progress-fill ${ready ? "ready" : ""}" style="width:${pct}%"></div>
          </div>
          <div class="bed-status ${ready ? "ready" : ""}">
            ${ready ? "Ready to harvest!" : `~${remaining} day${remaining === 1 ? "" : "s"} to harvest`}
          </div>
          <div class="bed-meta">Last watered ${daysWatered === 0 ? "today" : daysWatered + " day" + (daysWatered === 1 ? "" : "s") + " ago"}</div>
          <div class="bed-card-actions">
            <button class="btn btn-secondary btn-sm" data-action="water">💧 Water now</button>
            <button class="btn btn-danger btn-sm" data-action="clear">Clear</button>
          </div>
        </div>
      `;
    })
    .join("");
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

function addBed(name) {
  beds.push({ id: generateId(), name, plantName: null, plantedDate: null, lastWatered: null });
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

function plantInBed(bedId, plantName) {
  const bed = beds.find((b) => b.id === bedId);
  if (!bed) return;
  bed.plantName = plantName;
  bed.plantedDate = todayISO();
  bed.lastWatered = todayISO();
  saveBeds();
  renderBeds();
  renderReminders();
}

function waterBed(id) {
  const bed = beds.find((b) => b.id === id);
  if (!bed) return;
  bed.lastWatered = todayISO();
  saveBeds();
  renderBeds();
  renderReminders();
}

function clearBed(id) {
  const bed = beds.find((b) => b.id === id);
  if (!bed) return;
  bed.plantName = null;
  bed.plantedDate = null;
  bed.lastWatered = null;
  saveBeds();
  renderBeds();
  renderReminders();
}

/* ---------- Plant picker modal ---------- */

function openPlantModal(bedId) {
  plantModalBedId = bedId;
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
}

/* ---------- Bed add/rename modal ---------- */

function openBedModal(mode, bedId) {
  bedModalMode = mode;
  bedModalTargetId = bedId || null;
  const title = document.getElementById("bedModalTitle");
  const input = document.getElementById("bedNameInput");

  if (mode === "rename") {
    const bed = beds.find((b) => b.id === bedId);
    title.textContent = "Rename bed";
    input.value = bed ? bed.name : "";
  } else {
    title.textContent = "Add garden bed";
    input.value = "";
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
    addBed(name);
  }
  closeBedModal();
}

/* ---------- Reminders ---------- */

function renderReminders() {
  const list = document.getElementById("remindersList");
  const plantedBeds = beds.filter((b) => b.plantName);

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

  plantedBeds.forEach((bed) => {
    const plant = findPlant(bed.plantName);
    if (!plant) return;

    const daysPlanted = daysSince(bed.plantedDate);
    const remaining = plant.daysToHarvest - daysPlanted;

    if (remaining <= 0) {
      reminders.push({
        type: "harvest",
        text: `${plant.emoji} ${bed.name} (${plant.name}) should be ready to harvest!`,
        sub: `Planted ${daysPlanted} days ago.`,
      });
    } else if (remaining <= 7) {
      reminders.push({
        type: "harvest",
        text: `${plant.emoji} ${bed.name} (${plant.name}) ready to harvest in ~${remaining} day${remaining === 1 ? "" : "s"}`,
        sub: "Upcoming harvest.",
      });
    }

    const daysWatered = daysSince(bed.lastWatered);
    const overdue = daysWatered >= plant.wateringDays;

    if (overdue) {
      if (todayRain >= 5) {
        reminders.push({
          type: "info",
          text: `${plant.emoji} ${bed.name} (${plant.name}) — recent rain covered watering`,
          sub: `${todayRain.toFixed(1)} mm fell today, no need to water.`,
        });
      } else {
        reminders.push({
          type: "warn",
          text: `${plant.emoji} ${bed.name} (${plant.name}) needs watering`,
          sub: `Last watered ${daysWatered} day${daysWatered === 1 ? "" : "s"} ago.`,
          bedId: bed.id,
        });
      }
    }
  });

  if (reminders.length === 0) {
    list.innerHTML =
      plantedBeds.length === 0
        ? '<p class="empty-note">No garden beds yet — add one below to get started.</p>'
        : '<p class="empty-note">All caught up — nothing needs attention today.</p>';
    return;
  }

  list.innerHTML = reminders
    .map((r) => {
      const cls = r.type === "harvest" ? "harvest" : r.type === "warn" ? "warn" : "info";
      const button = r.bedId
        ? `<button class="btn btn-secondary btn-sm" data-mark-watered="${r.bedId}">Mark watered</button>`
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
    if (!btn || !plantModalBedId) return;
    plantInBed(plantModalBedId, btn.dataset.plant);
    closePlantModal();
  });

  document.getElementById("bedsGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".bed-card");
    if (!card) return;
    const bedId = card.dataset.bedId;
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (!action) return;

    if (action === "plant") openPlantModal(bedId);
    else if (action === "rename") openBedModal("rename", bedId);
    else if (action === "remove") {
      if (confirm("Remove this garden bed?")) removeBed(bedId);
    } else if (action === "water") waterBed(bedId);
    else if (action === "clear") {
      if (confirm("Clear this bed? This removes the current plant.")) clearBed(bedId);
    }
  });

  document.getElementById("remindersList").addEventListener("click", (e) => {
    const bedId = e.target.dataset.markWatered;
    if (bedId) waterBed(bedId);
  });
}

/* ---------- Init ---------- */

function init() {
  renderSeasonHeader();
  renderPlantNow();
  renderBeds();
  renderReminders();
  wireEvents();
  fetchWeather();
}

document.addEventListener("DOMContentLoaded", init);
