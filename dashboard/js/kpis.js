// Stage 2: summary cards (waste today, value, score, waste level ring, CO2)

const RING = 2 * Math.PI * 42;   // circumference of the ring gauge

const SCORE_NOTE = {
  "Excellent": "Outstanding, keep it up!",
  "Good": "On track. A little more to go.",
  "Needs Improvement": "Room to improve. See the tip below."
};

on("summary", d => {
  $("todayKg").textContent = d.today_total_kg.toFixed(2) + " kg";
  $("todayInr").textContent = "₹" + d.today_value_inr.toFixed(1);
  $("co2").textContent = d.co2_kg.toFixed(1) + " kg";

  // ring gauge: green below 60%, amber 60-89%, red at 90% and above
  const pct = Math.max(0, d.waste_level_pct);
  $("levelPct").textContent = pct + "%";
  const ring = $("ringFill");
  ring.style.strokeDasharray = RING;
  ring.style.strokeDashoffset = RING * (1 - Math.min(100, pct) / 100);
  ring.style.stroke = pct < 60 ? "var(--good)" : pct < 90 ? "var(--warn)" : "var(--bad)";

  // score badge
  const badge = $("score");
  badge.textContent = d.score;
  badge.className = "badge " + ({ "Excellent":"excellent", "Good":"good", "Needs Improvement":"needs" }[d.score] || "none");
  $("scoreNote").textContent = SCORE_NOTE[d.score] || "";

  // week-over-week change
  const wc = $("weekChange"), p = d.week_change_pct;
  if (p === null || p === undefined) { wc.textContent = "No data yet"; wc.className = "pill flat"; }
  else if (p < 0) { wc.textContent = "↓ " + Math.abs(p) + "% vs last week"; wc.className = "pill down"; }
  else if (p > 0) { wc.textContent = "↑ " + p + "% vs last week"; wc.className = "pill up"; }
  else { wc.textContent = "Same as last week"; wc.className = "pill flat"; }
});