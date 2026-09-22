// Tab navigation (the tab is kept in the URL, so a refresh stays on the same tab)

const TABS = ["overview", "history", "insights", "goals"];

function showTab(name, updateUrl = true) {
  if (!TABS.includes(name)) name = "overview";

  document.querySelectorAll(".view").forEach(v =>
    v.classList.toggle("active", v.id === "view-" + name));
  document.querySelectorAll(".tab").forEach(t => {
    const on = t.dataset.tab === name;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", on ? "true" : "false");
  });

  if (updateUrl) window.history.replaceState(null, "", "#" + name);
  window.dispatchEvent(new CustomEvent("tabchange", { detail: name }));
}

$("tabs").addEventListener("click", e => {
  const b = e.target.closest(".tab");
  if (b) showTab(b.dataset.tab);
});
window.addEventListener("hashchange", () => showTab(location.hash.slice(1), false));

showTab(location.hash.slice(1) || "overview", false);