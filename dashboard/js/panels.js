// Stage 4: detected items (this drop), AI suggestion, recent activity

// ---- AI suggestion ----
on("summary", d => {
  $("suggestion").textContent =
    d.suggestion || "Keep logging your waste to get personalised tips.";
});

// ---- detected items (this drop) ----
on("summary", d => {
  const drop = d.last_drop;
  const box = $("dropBox");
  box.replaceChildren();

  if (!drop) {
    const e = el("div", "empty");
    e.append(el("span", "em", "🗑️"), "No drops yet. Drop something in the bin!");
    box.append(e);
    return;
  }

  // top row: emoji, item name and details
  const top = el("div", "dropTop");
  top.append(el("div", "dropIcon", emojiFor(drop.category)));
  const txt = el("div");
  txt.append(el("div", "drop-name", niceName(drop.category)));
  let meta = drop.weight_g.toFixed(1) + " g · ₹" + drop.value_inr.toFixed(1);
  if (drop.category !== "pending" && drop.confidence != null) {
    meta += " · " + Math.round(drop.confidence * 100) + "% sure";
  }
  txt.append(el("div", "drop-meta", meta + " · " + fmtWhen(drop.timestamp)));
  top.append(txt);
  box.append(top);

  // the classifier's top guesses, each with a confidence bar
  (drop.top3 || []).forEach(c => {
    const row = el("div", "cand");
    row.append(el("div", "name", niceName(c.category)));
    const track = el("div", "track"), fill = el("div", "fill");
    fill.style.width = Math.round(c.confidence * 100) + "%";
    track.append(fill);
    row.append(track, el("div", "pct", Math.round(c.confidence * 100) + "%"));
    box.append(row);
  });
});

// ---- recent activity table ----
on("activity", list => {
  const box = $("activityBox");
  box.replaceChildren();

  if (!list || list.length === 0) {
    const e = el("div", "empty");
    e.append(el("span", "em", "🕒"), "No activity yet.");
    box.append(e);
    return;
  }

  const table = el("table");
  const head = el("tr");
  [["Item", ""], ["Time", ""], ["Weight", "num"], ["Value", "num"]]
    .forEach(([t, c]) => head.append(el("th", c, t)));
  table.append(head);

  list.forEach(a => {
    const tr = el("tr");
    const itemCell = el("td"), item = el("div", "item");
    item.append(el("span", "e", emojiFor(a.category)), el("span", "", niceName(a.category)));
    itemCell.append(item);
    tr.append(itemCell,
              el("td", "when", fmtWhen(a.timestamp)),
              el("td", "num", a.weight_g.toFixed(1) + " g"),
              el("td", "num", "₹" + a.value_inr.toFixed(1)));
    table.append(tr);
  });
  box.append(table);
});