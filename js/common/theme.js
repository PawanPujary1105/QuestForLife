const THEME_STORAGE_KEY = "quest-for-life-theme";
const themeToggle = document.getElementById("btn-theme-toggle");
const themeIcon = themeToggle.querySelector("i");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
let activeTheme = storedTheme === "light" || storedTheme === "dark"
  ? storedTheme
  : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.bsTheme = theme;
  themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
  themeToggle.title = `Switch to ${nextTheme} mode`;
  themeIcon.className = theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
  themeColorMeta.content = theme === "dark" ? "#20191a" : "#fff8f3";
}

applyTheme(activeTheme);

themeToggle.addEventListener("click", () => {
  activeTheme = activeTheme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
  applyTheme(activeTheme);
});
