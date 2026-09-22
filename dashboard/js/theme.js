// Theme picker: 6 themes, remembered between visits

const THEMES = [
  { id: "forest", name: "Forest",         emoji: "🌲" },
  { id: "meadow", name: "Meadow",         emoji: "🌿" },
  { id: "cherry", name: "Cherry Blossom", emoji: "🌸" },
  { id: "ruby",   name: "Ruby Night",     emoji: "🍒" },
  { id: "ocean",  name: "Ocean",          emoji: "🌊" },
  { id: "sunset", name: "Sunset",         emoji: "🌅" }
];

const themeBtn = $("themeBtn"), themePop = $("themePop"), swatchBox = $("swatches");

function currentTheme() { return document.documentElement.getAttribute("data-theme"); }

function markActive() {
  swatchBox.querySelectorAll(".swatch").forEach(b =>
    b.classList.toggle("active", b.dataset.theme === currentTheme()));
}

function setTheme(id) {
  document.documentElement.setAttribute("data-theme", id);
  try { localStorage.setItem("valuebin-theme", id); } catch (e) {}
  markActive();
  window.dispatchEvent(new Event("themechange"));
}

function openPop()  { themePop.hidden = false; themeBtn.setAttribute("aria-expanded", "true"); }
function closePop() { themePop.hidden = true;  themeBtn.setAttribute("aria-expanded", "false"); }

// one button per theme; its data-theme makes it preview its own colours
THEMES.forEach(t => {
  const b = el("button", "swatch");
  b.type = "button";
  b.dataset.theme = t.id;
  b.append(el("span", "chip"), el("span", "", t.emoji + " " + t.name));
  b.addEventListener("click", () => setTheme(t.id));
  swatchBox.append(b);
});

themeBtn.addEventListener("click", e => {
  e.stopPropagation();
  themePop.hidden ? openPop() : closePop();
});
document.addEventListener("click", e => { if (!themePop.contains(e.target)) closePop(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closePop(); });

markActive();