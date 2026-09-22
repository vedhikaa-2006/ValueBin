// History tab: search, filter, sort, range buttons, export CSV
(function () {
  const H = { range: 7, cat: "all", sort: "new", q: "", shown: 20 };
  const root = $("view-history");

  root.innerHTML = `
    <div class="card">
      <div class="head"><span class="label">All activity</span><span class="ico">📜</span></div>
      <div class="toolbar">
        <input class="search" id="hSearch" type="search" placeholder="🔍 Search a food or a day…">
        <select class="sel" id="hCat"></select>
        <select class="sel" id="hSort">
          <option value="new">Newest first</option>
          <option value="old">Oldest first</option>
          <option value="heavy">Heaviest first</option>
          <option value="value">Most valuable first</option>
        </select>
      </div>
      <div class="toolbar">
        <div class="seg" id="hRange">
          <button type="button" data-days="7">7 days</button>
          <button type="button" data-days="14">14 days</button>
          <button type="button" data-days="30">30 days</button>
        </div>
        <span class="grow" id="hSummary"></span>
        <button class="btn" id="hExport" type="button">⬇️ Export CSV</button>
      </div>
      <div class="tablewrap" id="hTable"></div>
      <div class="more"><button class="btn" id="hMore" type="button" hidden>Show more</button></div>
    </div>`;

  const catSel = $("hCat");
  catSel.append(new Option("All foods", "all"));
  CATEGORIES.forEach(c => catSel.append(new Option(emojiFor(c) + " " + niceName(c), c)));

  const dayText = ts => new Date(ts).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
  const hay = e => (niceName(e.category) + " " + e.category + " " + dayText(e.timestamp)).toLowerCase();

  function filtered() {
    const from = since(H.range);
    let list = events.filter(e => e.category !== "pending" && new Date(e.timestamp) >= from);
    if (H.cat !== "all") list = list.filter(e => e.category === H.cat);
    if (H.q) list = list.filter(e => hay(e).includes(H.q));
    const t = e => new Date(e.timestamp);
    list.sort((a, b) =>
      H.sort === "old"   ? t(a) - t(b) :
      H.sort === "heavy" ? b.weight_g - a.weight_g :
      H.sort === "value" ? b.value_inr - a.value_inr :
                           t(b) - t(a));
    return list;
  }

  let current = [];
  function render() {
    current = filtered();
    const box = $("hTable");
    box.replaceChildren();
    const totalG = current.reduce((s, e) => s + e.weight_g, 0);
    const totalV = current.reduce((s, e) => s + e.value_inr, 0);
    $("hSummary").textContent = current.length + " items · " + fmtW(totalG) + " · ₹" + totalV.toFixed(1);

    if (current.length === 0) {
      const e = el("div", "empty");
      e.append(el("span", "em", "🔎"), "Nothing matches. Try a different search, food or time range.");
      box.append(e);
      $("hMore").hidden = true;
      return;
    }

    const table = el("table");
    const head = el("tr");
    [["Item", ""], ["When", ""], ["Weight", "num"], ["Value", "num"]].forEach(([n, c]) => head.append(el("th", c, n)));
    table.append(head);
    current.slice(0, H.shown).forEach(e => {
      const tr = el("tr");
      const cell = el("td"), item = el("div", "item");
      item.append(el("span", "e", emojiFor(e.category)), el("span", "", niceName(e.category)));
      cell.append(item);
      const when = new Date(e.timestamp).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      tr.append(cell, el("td", "when", when), el("td", "num", fmtW(e.weight_g)), el("td", "num", "₹" + e.value_inr.toFixed(1)));
      table.append(tr);
    });
    box.append(table);

    const left = current.length - H.shown;
    $("hMore").hidden = left <= 0;
    if (left > 0) $("hMore").textContent = "Show more (" + left + " left)";
  }

  function markRange() {
    $("hRange").querySelectorAll("button").forEach(b => b.classList.toggle("on", +b.dataset.days === H.range));
  }

  function exportCSV(list) {
    const rows = [["timestamp", "food", "weight_g", "value_inr"]]
      .concat(list.map(e => [e.timestamp, e.category, e.weight_g, e.value_inr]));
    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "valuebin-history.csv";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  $("hSearch").addEventListener("input", e => { H.q = e.target.value.trim().toLowerCase(); H.shown = 20; render(); });
  catSel.addEventListener("change", e => { H.cat = e.target.value; H.shown = 20; render(); });
  $("hSort").addEventListener("change", e => { H.sort = e.target.value; render(); });
  $("hRange").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    H.range = +b.dataset.days; H.shown = 20; markRange(); render();
  });
  $("hMore").addEventListener("click", () => { H.shown += 20; render(); });
  $("hExport").addEventListener("click", () => exportCSV(current));

  onEvents(render);
  window.addEventListener("unitchange", render);
  markRange();
  render();
})();