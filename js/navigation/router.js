import { initMovieFilters } from "../pages/movies.js";

export let currentView = "home";

const views = {
  home: document.getElementById("view-home"),
  movies: document.getElementById("view-movies"),
  gym: document.getElementById("view-gym"),
  recipes: document.getElementById("view-recipes"),
  outfits: document.getElementById("view-outfits"),
};

const tabs = [...document.querySelectorAll("[data-view]")];

function showView(name) {
  currentView = name;

  Object.entries(views).forEach(([k, el]) => {
    el.classList.toggle("hidden", k !== name);
  });

  tabs.forEach((t) => {
    const active = t.dataset.view === name;
    t.classList.toggle("active", active);
    t.setAttribute("aria-selected", active ? "true" : "false");
  });

  // focus management
  const firstHeading = views[name].querySelector(".title");

  if (firstHeading) {
    firstHeading.setAttribute("tabindex", "-1");
    firstHeading.focus();
  }

  if (name === "movies") initMovieFilters();

  const select = document.getElementById("section-select");

  if (select && select.value !== name) {
    select.value = name;
  }
}

tabs.forEach((t) =>
  t.addEventListener("click", () => showView(t.dataset.view)),
);

document.querySelectorAll("[data-go]").forEach((card) => {
  card.addEventListener("click", () => showView(card.dataset.go));

  card.addEventListener("keypress", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      showView(card.dataset.go);
    }
  });
});

window.addEventListener("hashchange", () => {
  const target = location.hash.replace("#", "");

  if (views[target]) {
    showView(target);
  }
});

if (location.hash && views[location.hash.replace("#", "")]) {
  showView(location.hash.replace("#", ""));
} else {
  showView("home");
}

const sectionSelect = document.getElementById("section-select");

if (sectionSelect) {
  sectionSelect.addEventListener("change", (e) => {
    showView(e.target.value);
  });
}
