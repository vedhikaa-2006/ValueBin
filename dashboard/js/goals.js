// Goals & Tips tab: weekly goal with progress bar, tips for each food type
(function () {
  const TIPS = {
    cooked_rice: { title: "Cooked rice", tips: [
      "Measure the rice per person before cooking, and cook a little less than you think you need.",
      "Cool leftover rice quickly, refrigerate it within an hour or so, and eat it within a day.",
      "Turn leftovers into fried rice, lemon rice or rice cutlets." ] },
    roti: { title: "Roti", tips: [
      "Make small batches and add more only if people are still hungry.",
      "Keep leftover roti wrapped in a cloth or foil, and reheat it on a tawa.",
      "Crisp leftover roti into chips, or use it in roti upma or kathi rolls." ] },
    bread: { title: "Bread", tips: [
      "Freeze slices as soon as you buy a loaf, and toast them straight from the freezer.",
      "Turn stale bread into croutons, breadcrumbs or bread pudding.",
      "Buy smaller loaves if a full one goes stale before you finish it." ] },
    vegetables: { title: "Vegetables", tips: [
      "Plan your meals before shopping, and buy only what you will use this week.",
      "Wrap leafy greens and herbs in paper and keep them in the fridge so they last longer.",
      "Use stems and trimmings in stocks or stir-fries, and freeze vegetables that are about to go soft." ] },
    banana_peel: { title: "Banana peels", tips: [
      "Chop peels up and put them in a compost bin, where they break down faster.",
      "In some regional cooking banana peels are cooked into dishes. Look for a trusted recipe if you want to try.",
      "Buy bananas in smaller bunches so fewer go over-ripe." ] },
    fruit_scraps: { title: "Fruit scraps", tips: [
      "Freeze overripe fruit for smoothies or baking.",
      "Cook soft fruit into jam, chutney or a quick compote.",
      "Compost the peels and cores you cannot use." ] },
    unknown: { title: "Unidentified items", tips: [
      "Drop items so they land in view of the camera, and keep the lens clean.",
      "Try not to mix several foods in one drop, so each item can be recognised.",
      "Keep the bin well lit so the camera can see clearly." ] }
  };

  let goal = 3, weekKg = 0, tipCat = "all", topCat = null;
  try {
    const g = parseFloat(localStorage.getItem("valuebin-goal-kg"));
    if (g >= 0.5 && g <= 20) goal = g;
  } catch (e) {}

  const root = $("view-goals");
  root.innerHTML = `
    <div class="card">
      <div class="head"><span class="label">Weekly goal</span><span class="ico">🎯</span></div>
      <div class="goalrow">
        <div>
          <div class="goalnum"><span id="gUsed">0</span> <small>/ <span id="gGoal">3</span> kg</small></div>
          <div class="sub">used in the last 7 days</div>
        </div>
        <div class="goalctl">
          <div class="stepper">
            <button class="rbtn" id="gMinus" type="button" aria-label="Lower goal">−</button>
            <span class="v" id="gVal"></span>
            <button class="rbtn" id="gPlus" type="button" aria-label="Raise goal">+</button>
          </div>
          <div class="seg" id="gPresets">
            <button type="button" data-g="2">2 kg</button>
            <button type="button" data-g="3">3 kg</button>
            <button type="button" data-g="4">4 kg</button>
            <button type="button" data-g="5">5 kg</button>
          </div>
        </div>
      </div>
      <div class="progress"><div id="gBar"></div></div>
      <div class="sub" id="gMsg"></div>
    </div>
    <div class="sectitle">💡 Tips to waste less</div>
    <div class="chips" id="tChips"></div>
    <div class="tipsgrid" id="tGrid"></div>`;

  function renderGoal() {
    const pct = weekKg / goal * 100;
    $("gUsed").textContent = weekKg.toFixed(2);
    $("gGoal").textContent = goal.toFixed(1);
    $("gVal").textContent = goal.toFixed(1) + " kg";
    const bar = $("gBar");
    bar.style.width = Math.min(100, pct) + "%";
    bar.style.background = pct < 70 ? "var(--good)" : pct < 100 ? "var(--warn)" : "var(--bad)";
    const left = Math.abs(goal - weekKg).toFixed(2);
    $("gMsg").textContent =
      pct < 70  ? "On track. " + left + " kg left before you reach your goal." :
      pct < 100 ? "Getting close. Only " + left + " kg left." :
                  "Over your goal by " + left + " kg. A fresh start tomorrow!";
    $("gPresets").querySelectorAll("button").forEach(b => b.classList.toggle("on", +b.dataset.g === goal));
  }

  function setGoal(v) {
    goal = Math.min(20, Math.max(0.5, Math.round(v * 2) / 2));
    try { localStorage.setItem("valuebin-goal-kg", String(goal)); } catch (e) {}
    renderGoal();
  }

  function computeTop() {
    const from = since(7), by = {};
    events.forEach(e => {
      if (e.category !== "unknown" && e.category !== "pending" && new Date(e.timestamp) >= from)
        by[e.category] = (by[e.category] || 0) + e.weight_g;
    });
    const k = Object.keys(by).sort((a, b) => by[b] - by[a]);
    topCat = k.length ? k[0] : null;
  }

  function renderTips() {
    const chips = $("tChips");
    chips.replaceChildren();
    [["all", "All"]].concat(Object.keys(TIPS).map(c => [c, emojiFor(c) + " " + TIPS[c].title])).forEach(([c, label]) => {
      const b = el("button", "chip" + (tipCat === c ? " on" : ""), label);
      b.type = "button";
      b.addEventListener("click", () => { tipCat = c; renderTips(); });
      chips.append(b);
    });

    const grid = $("tGrid");
    grid.replaceChildren();
    let list = tipCat === "all" ? Object.keys(TIPS) : [tipCat];
    list = list.slice().sort((a, b) => (b === topCat) - (a === topCat));   // most wasted first
    list.forEach(c => {
      const card = el("div", "card tcard");
      const head = el("div", "tcardhead");
      head.append(el("span", "ico", emojiFor(c)), el("strong", "", TIPS[c].title));
      if (c === topCat) head.append(el("span", "flag", "🔥 Most wasted this week"));
      const ul = el("ul");
      TIPS[c].tips.forEach(t => ul.append(el("li", "", t)));
      card.append(head, ul);
      grid.append(card);
    });
  }

  $("gMinus").addEventListener("click", () => setGoal(goal - 0.5));
  $("gPlus").addEventListener("click", () => setGoal(goal + 0.5));
  $("gPresets").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (b) setGoal(+b.dataset.g);
  });

  on("summary", d => { weekKg = d.week_total_kg; renderGoal(); });
  onEvents(() => { computeTop(); renderTips(); });
  renderGoal();
  renderTips();
})();