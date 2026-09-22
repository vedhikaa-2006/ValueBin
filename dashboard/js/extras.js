// Extras: g / kg toggle, "Simulate a drop" demo button
(function () {
  // ---- g / kg switch in the header ----
  const seg = el("div", "seg");
  ["g", "kg"].forEach(u => {
    const b = el("button", "", u);
    b.type = "button";
    b.dataset.u = u;
    b.addEventListener("click", () => setUnit(u));
    seg.append(b);
  });
  const right = document.querySelector(".right");
  right.insertBefore(seg, right.querySelector(".themebox"));
  const markUnit = () => seg.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.u === unit));
  markUnit();
  window.addEventListener("unitchange", markUnit);

  // the "Waste today" number follows the unit too
  let lastSummary = null;
  const paintWaste = () => { if (lastSummary) $("todayKg").textContent = fmtW(lastSummary.today_total_kg * 1000); };
  on("summary", d => { lastSummary = d; paintWaste(); });
  window.addEventListener("unitchange", paintWaste);

  // ---- toast message ----
  const toastEl = el("div", "toast");
  document.body.append(toastEl);
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  // ---- Simulate a drop (demo mode, or a live server with ?demo in the address) ----
  const DEMO_LIVE = new URLSearchParams(location.search).has("demo");
  if (!(USE_MOCK || DEMO_LIVE)) return;

  function makeDrop() {
    const cats = CATEGORIES.filter(c => c !== "unknown");
    const cat = cats[Math.floor(Math.random() * cats.length)];
    const [lo, hi] = TYPICAL_G[cat];
    const w = Math.round((lo + Math.random() * (hi - lo)) * 2) / 2;
    const others = cats.filter(c => c !== cat).sort(() => Math.random() - 0.5);
    const conf = Math.round((0.6 + Math.random() * 0.35) * 100) / 100;
    const rest = 1 - conf;
    return {
      id: Date.now(), timestamp: toLocalISO(new Date()), category: cat, weight_g: w,
      value_inr: Math.round(w / 1000 * RATES[cat] * 10) / 10, confidence: conf,
      top3: [ { category: cat, confidence: conf },
              { category: others[0], confidence: Math.round(rest * 0.6 * 100) / 100 },
              { category: others[1], confidence: Math.round(rest * 0.3 * 100) / 100 } ]
    };
  }

  async function simulate() {
    const drop = makeDrop();
    if (USE_MOCK) {
      simulated.unshift(drop);
    } else {
      try {
        const r = await fetch("/event", { method: "POST", headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ weight_g: drop.weight_g }) });
        if (!r.ok) throw new Error("server returned " + r.status);
      } catch (e) { toast("Couldn't reach the server"); return; }
    }
    toast("Dropped: " + emojiFor(drop.category) + " " + niceName(drop.category) + " · " + drop.weight_g + " g");
    refresh();
    loadEvents();
  }

  const demoBar = el("div", "demo-bar");
  const btn = el("button", "btn primary", "🎲 Simulate a drop");
  btn.type = "button";
  btn.addEventListener("click", simulate);
  demoBar.append(btn, el("span", "", USE_MOCK
    ? "Demo mode: pretend something was dropped in the bin and watch the dashboard react. Refresh the page to reset."
    : "Adds a real test drop to the server."));
  $("view-overview").prepend(demoBar);

  // in demo mode, add the simulated drops on top of the mock data
  if (USE_MOCK) {
    const realGetJSON = getJSON;
    getJSON = async function (name) {
      const data = await realGetJSON(name);
      if (simulated.length === 0) return data;
      const addG = simulated.reduce((s, e) => s + e.weight_g, 0);
      const addV = simulated.reduce((s, e) => s + e.value_inr, 0);
      if (name === "summary") {
        const oldKg = data.today_total_kg, newKg = oldKg + addG / 1000;
        data.waste_level_pct = Math.round((oldKg > 0 && data.waste_level_pct > 0)
          ? data.waste_level_pct * newKg / oldKg : newKg * 1000 / 520 * 100);
        data.co2_kg = oldKg > 0 ? data.co2_kg * newKg / oldKg : newKg * 2.5;
        data.today_total_kg = newKg;
        data.today_value_inr += addV;
        data.week_total_kg += addG / 1000;
        const d = simulated[0];
        data.last_drop = { timestamp: d.timestamp, weight_g: d.weight_g, value_inr: d.value_inr,
                           category: d.category, confidence: d.confidence, top3: d.top3 };
      } else if (name === "activity") {
        return simulated.concat(data).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
      } else if (name === "weekly") {
        const last = data.days[data.days.length - 1];
        last.total_g = Math.round(last.total_g + addG);
      }
      return data;
    };
  }
})();