// Insights tab: donut chart, most wasted item, money lost per food type
(function () {
  const S = { range: 7, metric: "g" };   // metric: "g" = weight, "inr" = money
  const COLORS = { banana_peel: "#f59e0b", bread: "#a78bfa", cooked_rice: "#10b981", fruit_scraps: "#f43f5e",
                   roti: "#38bdf8", vegetables: "#84cc16", unknown: "#94a3b8" };
  const root = $("view-insights");
  let donut = null, dirty = true;

  root.innerHTML = `
    <div class="toolbar">
      <div class="seg" id="iRange">
        <button type="button" data-days="7">7 days</button>
        <button type="button" data-days="14">14 days</button>
        <button type="button" data-days="30">30 days</button>
      </div>
      <div class="seg" id="iMetric">
        <button type="button" data-m="g">⚖️ By weight</button>
        <button type="button" data-m="inr">₹ By money</button>
      </div>
    </div>
    <div class="stats" id="iStats"></div>
    <div class="split">
      <div class="card">
        <div class="head"><span class="label">Waste by food type</span><span class="ico">🍩</span></div>
        <div class="donutbox"><canvas id="donut"></canvas></div>
        <div class="empty" id="iEmpty" hidden><span class="em">🔎</span>No waste recorded in this period.</div>
      </div>
      <div class="card">
        <div class="head"><span class="label" id="iListTitle">Breakdown</span><span class="ico">🧾</span></div>
        <div id="iList"></div>
      </div>
    </div>`;

  function totals() {
    const from = since(S.range);
    const list = events.filter(e => e.category !== "pending" && new Date(e.timestamp) >= from);
    const by = {};
    list.forEach(e => {
      const b = by[e.category] || (by[e.category] = { g: 0, inr: 0, n: 0 });
      b.g += e.weight_g; b.inr += e.value_inr; b.n++;
    });
    return { list, by,
             g: list.reduce((s, e) => s + e.weight_g, 0),
             inr: list.reduce((s, e) => s + e.value_inr, 0) };
  }

  const stat = (label, icon, value, sub) => {
    const c = el("div", "card stat");
    const h = el("div", "head");
    h.append(el("span", "label", label), el("span", "ico", icon));
    c.append(h, el("div", "v", value), el("div", "sub", sub));
    return c;
  };

  function render() {
    if (!isActive("insights")) { dirty = true; return; }
    dirty = false;

    const T = totals(), key = S.metric;
    const fmt = v => key === "g" ? fmtW(v) : "₹" + v.toFixed(1);
    const rows = Object.keys(T.by).sort((a, b) => T.by[b][key] - T.by[a][key]);

    // top cards
    const known = rows.filter(c => c !== "unknown");
    const pool = known.length ? known : rows;
    const top = pool.slice().sort((a, b) => T.by[b].g - T.by[a].g)[0];
    const stats = $("iStats");
    stats.replaceChildren(
      stat("Total waste", "🗑️", fmtW(T.g), T.list.length + " drops"),
      stat("Value lost", "💰", "₹" + T.inr.toFixed(1), "about ₹" + (T.inr / S.range).toFixed(1) + " per day"),
      stat("Most wasted", top ? emojiFor(top) : "🍽️", top ? niceName(top) : "--",
           top && T.g > 0 ? Math.round(T.by[top].g / T.g * 100) + "% of all waste by weight" : "no data yet"),
      stat("Daily average", "📅", fmtW(T.g / S.range), "over the last " + S.range + " days")
    );

    // donut
    $("iListTitle").textContent = key === "g" ? "Weight by food type" : "Money lost by food type";
    const has = rows.length > 0;
    $("donut").parentElement.hidden = !has;
    $("iEmpty").hidden = has;
    if (!has && donut) { donut.destroy(); donut = null; }

    if (has) {
      const labels = rows.map(c => niceName(c));
      const data = rows.map(c => Math.round(T.by[c][key] * 10) / 10);
      const colors = rows.map(c => COLORS[c] || "#94a3b8");
      if (!donut) {
        donut = new Chart($("donut"), {
          type: "doughnut",
          data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: css("--card"), borderWidth: 3, hoverOffset: 8 }] },
          options: {
            responsive: true, maintainAspectRatio: false, cutout: "62%",
            plugins: { legend: { display: false },
                       tooltip: { callbacks: { label: c => " " + c.label + ": " +
                                  (S.metric === "g" ? fmtW(c.parsed) : "₹" + c.parsed.toFixed(1)) } } }
          }
        });
      } else {
        donut.data.labels = labels;
        donut.data.datasets[0].data = data;
        donut.data.datasets[0].backgroundColor = colors;
        donut.data.datasets[0].borderColor = css("--card");
        donut.update();
      }
    }

    // breakdown list
    const list = $("iList");
    list.replaceChildren();
    if (!has) { list.append(el("div", "empty", "Nothing to show yet.")); return; }
    const max = Math.max(...rows.map(c => T.by[c][key]), 1);
    const total = key === "g" ? T.g : T.inr;
    rows.forEach(c => {
      const row = el("div", "catrow");
      row.append(el("span", "", emojiFor(c)));
      const mid = el("div");
      mid.append(el("div", "nm", niceName(c)));
      const bar = el("div", "catbar"), fill = el("div");
      fill.style.width = Math.round(T.by[c][key] / max * 100) + "%";
      fill.style.background = COLORS[c] || "#94a3b8";
      bar.append(fill);
      mid.append(bar);
      const amt = el("div", "amt", fmt(T.by[c][key]));
      amt.append(el("small", "", (total > 0 ? Math.round(T.by[c][key] / total * 100) : 0) + "%"));
      row.append(mid, amt);
      list.append(row);
    });
  }

  function mark() {
    $("iRange").querySelectorAll("button").forEach(b => b.classList.toggle("on", +b.dataset.days === S.range));
    $("iMetric").querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.m === S.metric));
  }

  $("iRange").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    S.range = +b.dataset.days; mark(); render();
  });
  $("iMetric").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    S.metric = b.dataset.m; mark(); render();
  });

  onEvents(render);
  window.addEventListener("unitchange", render);
  window.addEventListener("tabchange", () => { if (dirty && isActive("insights")) render(); if (donut) donut.resize(); });
  window.addEventListener("themechange", () => { if (donut) { donut.destroy(); donut = null; } render(); });
  mark();
})();