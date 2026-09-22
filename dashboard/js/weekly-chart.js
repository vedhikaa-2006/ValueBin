// 7-day bar chart (follows the active theme)

function applyChartDefaults() {
  Chart.defaults.color = css("--muted");
  Chart.defaults.borderColor = css("--border");
  Chart.defaults.font.family = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
}
applyChartDefaults();

// small plugin: draws each bar's value above the bar
const valueLabels = {
  id: "valueLabels",
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    ctx.save();
    ctx.fillStyle = css("--muted");
    ctx.font = "600 12px -apple-system, sans-serif";
    ctx.textAlign = "center";
    chart.getDatasetMeta(0).data.forEach((bar, i) => {
      ctx.fillText(chart.data.datasets[0].data[i], bar.x, bar.y - 7);
    });
    ctx.restore();
  }
};

let weeklyChart = null;
let lastWeekly = null;

function drawWeekly() {
  if (!lastWeekly) return;
  const labels = lastWeekly.days.map(x => x.label);
  const values = lastWeekly.days.map(x => x.total_g);
  const accent = css("--accent");
  // today (last bar) is solid, earlier days are faded
  const colors = values.map((_, i) => i === values.length - 1 ? accent : accent + "55");

  if (!weeklyChart) {
    weeklyChart = new Chart($("weeklyChart"), {
      type: "bar",
      data: {
        labels,
        datasets: [{ label: "Waste (g)", data: values, backgroundColor: colors,
                     borderRadius: 10, borderSkipped: false, maxBarThickness: 48 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false },
                   tooltip: { callbacks: { label: c => c.parsed.y + " g" } } },
        scales: { y: { beginAtZero: true, grace: "12%", border: { display: false } },
                  x: { grid: { display: false } } }
      },
      plugins: [valueLabels]
    });
  } else {
    weeklyChart.data.labels = labels;
    weeklyChart.data.datasets[0].data = values;
    weeklyChart.data.datasets[0].backgroundColor = colors;
    weeklyChart.update();
  }
}

on("weekly", d => { lastWeekly = d; drawWeekly(); });

// theme changed: rebuild the chart with the new colours
window.addEventListener("themechange", () => {
  applyChartDefaults();
  if (weeklyChart) { weeklyChart.destroy(); weeklyChart = null; }
  drawWeekly();
});

// coming back to the Overview tab: make sure the chart fits its box
window.addEventListener("tabchange", () => { if (weeklyChart) weeklyChart.resize(); });