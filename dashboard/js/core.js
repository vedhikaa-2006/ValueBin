// ---- settings ----
const USE_MOCK = false;   // set to false when the real server is running

// ---- small helpers used by every stage ----
const $ = id => document.getElementById(id);
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

// build elements safely (text is never treated as HTML)
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

const EMOJI = { banana_peel:"🍌", bread:"🍞", cooked_rice:"🍚", fruit_scraps:"🍎", roti:"🫓",
                vegetables:"🥦", unknown:"❓", pending:"⏳" };
const emojiFor = c => EMOJI[c] || "🍽️";
const niceName = c =>
  c === "pending" ? "Identifying…" :
  c === "unknown" ? "Unidentified item" :
  String(c).replace(/_/g, " ").replace(/^./, m => m.toUpperCase());

function fmtWhen(ts) {
  const d = new Date(ts), now = new Date();
  const time = d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  return d.toDateString() === now.toDateString()
    ? time : d.toLocaleDateString([], { weekday:"short" }) + " " + time;
}

// ---- data loading ----
async function getJSON(name) {
  const url = USE_MOCK ? `mock/${name}.json`
                       : `/api/${name}` + (name === "activity" ? "?limit=10" : "");
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + " returned " + r.status);
  return r.json();
}

// Each stage registers a function with on("summary" | "weekly" | "activity", fn).
// It runs only when that data has actually changed, so nothing flickers every 3 seconds.
const hooks = { summary: [], weekly: [], activity: [] };
function on(kind, fn) { hooks[kind].push(fn); }

const cache = {};
function dispatch(kind, data) {
  const s = JSON.stringify(data);
  if (cache[kind] === s) return;
  cache[kind] = s;
  hooks[kind].forEach(fn => {
    try { fn(data); } catch (e) { console.error("Render error in " + kind, e); }
  });
}

async function refresh() {
  try {
    const [summary, weekly, activity] = await Promise.all([
      getJSON("summary"), getJSON("weekly"), getJSON("activity")
    ]);
    dispatch("summary", summary);
    dispatch("weekly", weekly);
    dispatch("activity", activity);
    $("status").textContent = "Live · updated " + new Date().toLocaleTimeString();
    $("dot").className = "dot ok";
  } catch (e) {
    console.error(e);
    $("status").textContent = "Can't reach the server";
    $("dot").className = "dot err";
  }
}

function start() {
  $("today").textContent = new Date().toLocaleDateString([], { weekday:"long", day:"numeric", month:"short" });
  refresh();
  setInterval(refresh, 3000);
}