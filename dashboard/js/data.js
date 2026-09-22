// Shared data for the History, Insights and Goals tabs, plus the g / kg unit setting

const CATEGORIES = ["banana_peel", "bread", "cooked_rice", "fruit_scraps", "roti", "vegetables", "unknown"];
// placeholder Rs/kg rates, used only to make demo data
const RATES = { banana_peel: 40, bread: 50, cooked_rice: 60, fruit_scraps: 80, roti: 70, vegetables: 50, unknown: 50 };
// typical weight range (grams) of one drop, used only to make demo data
const TYPICAL_G = { banana_peel: [40, 90], bread: [40, 120], cooked_rice: [80, 250], fruit_scraps: [30, 110],
                    roti: [30, 90], vegetables: [60, 200], unknown: [30, 120] };

// ---- units (g or kg), remembered between visits ----
let unit = "g";
try { const u = localStorage.getItem("valuebin-unit"); if (u === "g" || u === "kg") unit = u; } catch (e) {}
const fmtW = g => unit === "kg" ? (g / 1000).toFixed(2) + " kg" : (Math.round(g * 10) / 10) + " g";
function setUnit(u) {
  unit = u;
  try { localStorage.setItem("valuebin-unit", u); } catch (e) {}
  window.dispatchEvent(new Event("unitchange"));
}

// ---- small helpers ----
const pad = n => String(n).padStart(2, "0");
const toLocalISO = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" +
                        pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
const isActive = name => $("view-" + name).classList.contains("active");
// midnight at the start of the last N days (today counts as day 1)
function since(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d;
}

// ---- demo history (only used when USE_MOCK is true) ----
function rng(seed) {   // small seeded random generator, so the demo data is the same every time
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function mockOlderEvents() {
  const rand = rng(20260919);
  const pool = ["cooked_rice", "cooked_rice", "vegetables", "vegetables", "roti", "bread", "banana_peel", "fruit_scraps", "unknown"];
  const out = [];
  let id = 100;
  for (let day = 1; day <= 30; day++) {
    const n = 2 + Math.floor(rand() * 4);   // 2 to 5 drops a day
    for (let i = 0; i < n; i++) {
      const cat = pool[Math.floor(rand() * pool.length)];
      const [lo, hi] = TYPICAL_G[cat];
      const w = Math.round((lo + rand() * (hi - lo)) * 2) / 2;
      const d = new Date();
      d.setDate(d.getDate() - day);
      d.setHours(7 + Math.floor(rand() * 15), Math.floor(rand() * 60), 0, 0);
      out.push({ id: id++, timestamp: toLocalISO(d), category: cat, weight_g: w,
                 value_inr: Math.round(w / 1000 * RATES[cat] * 10) / 10 });
    }
  }
  return out;
}

// ---- all events (newest first), shared by History, Insights and Goals ----
const simulated = [];      // drops added with the "Simulate a drop" button
let events = [];
let eventsSig = "";
const evListeners = [];
function onEvents(fn) { evListeners.push(fn); if (events.length) fn(events); }

async function loadEvents() {
  try {
    let list;
    if (USE_MOCK) {
      const today = await (await fetch("mock/activity.json")).json();
      list = today.concat(mockOlderEvents());
    } else {
      const r = await fetch("/api/activity?limit=200");
      if (!r.ok) throw new Error("/api/activity returned " + r.status);
      list = await r.json();
    }
    list = simulated.concat(list);
    list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const sig = JSON.stringify(list);
    if (sig !== eventsSig) {          // only tell the tabs when something really changed
      eventsSig = sig;
      events = list;
      evListeners.forEach(fn => { try { fn(events); } catch (e) { console.error(e); } });
    }
  } catch (e) {
    console.error("history load failed", e);
  }
}
loadEvents();
setInterval(loadEvents, 10000);