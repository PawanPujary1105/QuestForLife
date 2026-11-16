import { questForLifeData, saveState } from "../common/storage.js";
import { escapeHTML, formatDate, formatDay, formatTime } from "../common/utils.js";

const outfitModal = new bootstrap.Modal(document.getElementById("modal-outfit"));
const outfitForm = document.getElementById("outfit-form");
const ofName = document.getElementById("of-name");
const occasionModal = new bootstrap.Modal(document.getElementById("modal-outfit-occasion"));
const occasionForm = document.getElementById("outfit-occasion-form");
const newOccasionInput = document.getElementById("of-new-occasion");

const outfitLogModal = new bootstrap.Modal(document.getElementById("modal-outfit-log"));
const outfitLogForm = document.getElementById("outfit-log-form");
const olfDate = document.getElementById("olf-date");
const olfOutfit = document.getElementById("olf-outfit");

const outfitCardsEl = document.getElementById("outfit-cards");
const outfitEmptyEl = document.getElementById("outfit-empty");
const outfitSearchInput = document.getElementById("outfit-search");
const outfitSearchEmptyEl = document.getElementById("outfit-search-empty");
const outfitFolderView = document.getElementById("outfit-folder-view");
const outfitDetailView = document.getElementById("outfit-detail-view");
const outfitFoldersEl = document.getElementById("outfit-occasion-folders");
const outfitDetailTitle = document.getElementById("outfit-detail-title");
const backToOutfitFoldersBtn = document.getElementById("btn-back-outfit-folders");
const addOccasionBtn = document.getElementById("btn-add-occasion");

const outfitLogContainerEl = document.getElementById("outfit-log-container");
const outfitLogEmptyEl = document.getElementById("outfit-log-empty");
const laundrySearchInput = document.getElementById("laundry-search");
const laundrySearchEmptyEl = document.getElementById("laundry-search-empty");

const outfitActionBtn = document.getElementById("btn-outfit-action");
const resetUsageBtn = document.getElementById("btn-reset-usage");
const outfitsTab = document.getElementById("outfits-tab");
const usageLogTab = document.getElementById("usage-log-tab");
const laundryTab = document.getElementById("laundry-tab");
let resetMode = false;
let selectedResetLogId = null;
let selectedOccasion = null;

outfitSearchInput.addEventListener("input", renderOutfits);
laundrySearchInput.addEventListener("input", renderLaundry);

addOccasionBtn.addEventListener("click", () => {
  occasionForm.reset();
  occasionModal.show();
});

occasionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const occasion = newOccasionInput.value.trim();
  if (!occasion) {
    alert("Occasion name is required.");
    newOccasionInput.focus();
    return;
  }

  if (getRegisteredOccasions().some((registered) => registered.toLowerCase() === occasion.toLowerCase())) {
    alert("That occasion already exists.");
    newOccasionInput.focus();
    return;
  }

  questForLifeData.outfitOccasions = getRegisteredOccasions();
  questForLifeData.outfitOccasions.push(occasion);
  saveState();
  occasionModal.hide();
  renderOccasionFolders();
});

outfitFoldersEl.addEventListener("click", (event) => {
  const folderButton = event.target.closest("[data-occasion]");
  if (!folderButton) return;

  selectedOccasion = folderButton.dataset.occasion;
  outfitDetailTitle.textContent = `${selectedOccasion} Outfits`;
  outfitSearchInput.value = "";
  laundrySearchInput.value = "";
  outfitFolderView.classList.add("hidden");
  outfitDetailView.classList.remove("hidden");

  resetMode = false;
  selectedResetLogId = null;
  resetUsageBtn.innerHTML = "🧹 Reset Usage";
  bootstrap.Tab.getOrCreateInstance(outfitsTab).show();
  updateOutfitActionButton();
  renderOutfits();
  renderOutfitLogs();
  renderLaundry();
});

backToOutfitFoldersBtn.addEventListener("click", () => {
  resetMode = false;
  selectedResetLogId = null;
  resetUsageBtn.innerHTML = "🧹 Reset Usage";
  outfitDetailView.classList.add("hidden");
  outfitFolderView.classList.remove("hidden");
  renderOccasionFolders();

  const selectedFolder = [...outfitFoldersEl.querySelectorAll("[data-occasion]")]
    .find((button) => button.dataset.occasion === selectedOccasion);
  if (selectedFolder) selectedFolder.focus();
});

outfitActionBtn.addEventListener("click", () => {
  if (outfitsTab.classList.contains("active")) {
    outfitForm.reset();
    outfitModal.show();
  } else if (usageLogTab.classList.contains("active")) {
    olfDate.value = new Date().toISOString().split("T")[0];
    populateOutfitDropdown();
    outfitLogModal.show();
  }
});

resetUsageBtn.addEventListener("click", () => {
  if (!resetMode) {
    resetMode = true;
    selectedResetLogId = null;
    updateOutfitActionButton();
    renderOutfitLogs();
    return;
  }

  if (selectedResetLogId) {
    const selectedLog = questForLifeData.outfitLogs.find((x) => x.id === selectedResetLogId);
    if (!selectedLog) {
      return;
    }

    const ok = confirm(`Reset all ${selectedLog.occasion} usage logs on and before ${formatDate(selectedLog.usedAt)}?`);
    if (!ok) {
      return;
    }

    questForLifeData.outfitLogs = questForLifeData.outfitLogs.filter((log) => !(log.occasion === selectedLog.occasion && log.usedAt <= selectedLog.usedAt));
    saveState();

    resetMode = false;
    selectedResetLogId = null;
    updateOutfitActionButton();

    renderOutfitLogs();
    renderLaundry();
    return;
  }

  resetMode = false;
  selectedResetLogId = null;
  updateOutfitActionButton();
  renderOutfitLogs();
});

outfitForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = ofName.value.trim();
  if (!name) {
    alert("Outfit name is required");
    return;
  }

  questForLifeData.outfits.push({
    id: crypto.randomUUID(),
    name,
    occasion: selectedOccasion,
    createdAt: Date.now(),
    lastWashedAt: Date.now(),
  });

  saveState();
  outfitModal.hide();
  renderOccasionFolders();
  renderOutfits();
  renderLaundry();
});

outfitLogForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const outfitId = olfOutfit.value;
  const outfit = questForLifeData.outfits.find((o) => o.id === outfitId);
  if (!outfit) {
    alert("Please select an outfit.");
    return;
  }

  questForLifeData.outfitLogs.push({
    id: crypto.randomUUID(),
    outfitId,
    outfitName: outfit.name,
    occasion: outfit.occasion,
    usedAt: new Date(olfDate.value).getTime(),
  });

  saveState();
  outfitLogModal.hide();
  renderOutfitLogs();
  renderLaundry();
});

function renderOutfits() {
  const occasionOutfits = (questForLifeData.outfits || []).filter((outfit) => outfit.occasion === selectedOccasion);
  const query = outfitSearchInput.value.trim().toLocaleLowerCase();
  const outfits = occasionOutfits.filter((outfit) => String(outfit.name || "").toLocaleLowerCase().includes(query));
  outfitCardsEl.innerHTML = "";

  if (occasionOutfits.length === 0) {
    outfitEmptyEl.classList.remove("hidden");
    outfitSearchEmptyEl.classList.add("hidden");
    return;
  }
  outfitEmptyEl.classList.add("hidden");

  if (outfits.length === 0) {
    outfitSearchEmptyEl.classList.remove("hidden");
    return;
  }
  outfitSearchEmptyEl.classList.add("hidden");

  for (const outfit of outfits.sort((a, b) => a.name.localeCompare(b.name))) {
    const card = document.createElement("div");
    card.className = "col-12 col-md-6 col-lg-4";
    const badgeClass = outfit.occasion === "Gym" ? "text-bg-danger" : "text-bg-primary";

    card.innerHTML = `
      <div class="card shadow-sm h-100">
        <div class="card-body d-flex flex-column gap-2">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">
              ${escapeHTML(outfit.name)}
            </h5>
            <span class="badge ${badgeClass}">
              ${escapeHTML(outfit.occasion)}
            </span>
          </div>
          <div class="text-muted small">
            Added on ${formatDate(outfit.createdAt)}
          </div>
          <div class="mt-auto d-flex justify-content-end gap-2">
            <button
              class="btn btn-secondary btn-sm"
              data-act="outfit-edit"
              data-id="${outfit.id}"
            >
              ✎ Edit
            </button>
            <button
              class="btn btn-danger btn-sm"
              data-act="outfit-delete"
              data-id="${outfit.id}"
            >
              ✕ Delete
            </button>
          </div>
        </div>
      </div>
    `;

    outfitCardsEl.appendChild(card);
  }

  bindOutfitCardEvents();
}

function renderOutfitLogs() {
  const outfitLogs = (questForLifeData.outfitLogs || []).filter((log) => log.occasion === selectedOccasion);
  outfitLogContainerEl.innerHTML = "";

  if (resetMode) {
    const banner = document.createElement("div");
    banner.className = "alert alert-warning";
    banner.innerHTML = `
        <strong>Reset Mode</strong><br>
        Select a usage log. All ${selectedResetLogId ? "older" : "matching"} occasion logs from that date backward will be removed.
      `;
    outfitLogContainerEl.appendChild(banner);
  }

  if (outfitLogs.length === 0) {
    outfitLogEmptyEl.classList.remove("hidden");
    return;
  }
  outfitLogEmptyEl.classList.add("hidden");

  const groups = new Map();
  for (const log of outfitLogs.sort((a, b) => (b.usedAt || 0) - (a.usedAt || 0))) {
    const day = formatDay(log.usedAt);
    if (!groups.has(day)) {
      groups.set(day, []);
    }
    groups.get(day).push(log);
  }

  for (const [day, logs] of groups.entries()) {
    const dayEl = document.createElement("div");
    dayEl.className = "timeline-day";

    const h = document.createElement("h3");
    h.className = "timeline-date";
    h.textContent = day;
    dayEl.appendChild(h);

    for (const log of logs) {
      const item = document.createElement("div");
      item.className = "timeline-item";

      const selected = selectedResetLogId === log.id;
      if (resetMode) {
        item.classList.add("reset-selectable");
        if (selected) {
          item.classList.add("reset-selected");
        }
        item.dataset.logId = log.id;
      }

      const icon = log.occasion === "Gym" ? "💪" : "🏢";
      const indicator = selected ? "●" : "○";

      item.innerHTML = `
        <div class="timeline-title">
          ${resetMode ? `<span class="me-2">${indicator}</span>` : ""}
          <span class="badge text-bg-info">
            ${icon} ${escapeHTML(log.occasion)}
          </span>
          <span class="movie-name">
            ${escapeHTML(log.outfitName)}
          </span>
          <span class="meta">
            at ${formatTime(log.usedAt)}
          </span>
        </div>
      `;
      dayEl.appendChild(item);
    }

    outfitLogContainerEl.appendChild(dayEl);
  }

  if (resetMode) {
    outfitLogContainerEl.querySelectorAll(".reset-selectable").forEach((item) => {
      item.addEventListener("click", () => {
        selectedResetLogId = selectedResetLogId === item.dataset.logId ? null : item.dataset.logId;
        updateOutfitActionButton();
        renderOutfitLogs();
      });
    });
  }
}

function renderLaundry() {
  const occasionOutfits = (questForLifeData.outfits || []).filter((outfit) => outfit.occasion === selectedOccasion);
  const query = laundrySearchInput.value.trim().toLocaleLowerCase();
  const outfits = occasionOutfits.filter((outfit) => String(outfit.name || "").toLocaleLowerCase().includes(query));
  const laundryContainer = document.getElementById("outfit-laundry-container");
  const laundryEmpty = document.getElementById("outfit-laundry-empty");
  laundryContainer.innerHTML = "";

  if (occasionOutfits.length === 0) {
    laundryEmpty.classList.remove("hidden");
    laundrySearchEmptyEl.classList.add("hidden");
    return;
  }
  laundryEmpty.classList.add("hidden");

  if (outfits.length === 0) {
    laundrySearchEmptyEl.classList.remove("hidden");
    return;
  }
  laundrySearchEmptyEl.classList.add("hidden");

  for (const outfit of outfits.sort((a, b) => a.name.localeCompare(b.name))) {
    const wearLogs = (questForLifeData.outfitLogs || []).filter((x) => x.outfitId === outfit.id && x.usedAt > (outfit.lastWashedAt || 0)).sort((a, b) => (b.usedAt || 0) - (a.usedAt || 0));
    const card = document.createElement("div");
    card.className = "col-12 col-md-6 col-lg-4";

    card.innerHTML = `
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between mb-2">
            <h5 class="card-title mb-0">
              ${escapeHTML(outfit.name)}
            </h5>
            <span class="badge text-bg-info">
              ${escapeHTML(outfit.occasion)}
            </span>
          </div>
          <div class="small text-muted mb-2">
            Last Washed:
            ${formatDate(outfit.lastWashedAt)}
          </div>
          <div class="mb-2">
            <strong>
              Used Since Wash:
            </strong>
            ${wearLogs.length}
          </div>
          <div class="small">
            ${
              wearLogs.length
                ? wearLogs
                    .map(
                      (log) => `<div>
                        ${formatDay(log.usedAt)}
                        ${formatTime(log.usedAt)}
                      </div>`,
                    )
                    .join("")
                : `<span class="text-muted">
                  No wear logs
                </span>`
            }
          </div>
          <div class="mt-3 text-end">
            <button
              class="btn btn-success btn-sm"
              data-act="mark-washed"
              data-id="${outfit.id}"
            >
              ✓ Mark Washed
            </button>
          </div>
        </div>
      </div>
    `;

    laundryContainer.appendChild(card);
  }

  bindLaundryEvents();
}

function bindOutfitCardEvents() {
  outfitCardsEl.querySelectorAll('[data-act="outfit-delete"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const outfit = questForLifeData.outfits.find((x) => x.id === id);

      if (!outfit) return;

      const ok = confirm(`Delete "${outfit.name}"?`);

      if (!ok) return;

      questForLifeData.outfits = questForLifeData.outfits.filter((x) => x.id !== id);

      saveState();
      renderOccasionFolders();
      renderOutfits();
      renderLaundry();
    });
  });
}

function bindLaundryEvents() {
  document.querySelectorAll('[data-act="mark-washed"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const outfit = questForLifeData.outfits.find((x) => x.id === btn.dataset.id);
      if (!outfit) return;
      outfit.lastWashedAt = Date.now();

      saveState();
      renderLaundry();
    });
  });
}

function updateOutfitActionButton() {
  if (outfitsTab.classList.contains("active")) {
    outfitActionBtn.innerHTML = "＋ Add Outfit";
    outfitActionBtn.classList.remove("hidden");
    resetUsageBtn.classList.add("hidden");
  } else if (usageLogTab.classList.contains("active")) {
    outfitActionBtn.innerHTML = "＋ Log Outfit Usage";
    outfitActionBtn.classList.toggle("hidden", resetMode);
    resetUsageBtn.classList.remove("hidden");
    resetUsageBtn.innerHTML = resetMode ? (selectedResetLogId ? "✓ Confirm Reset" : "Cancel") : "🧹 Reset Usage";
  } else if (laundryTab.classList.contains("active")) {
    outfitActionBtn.classList.add("hidden");
    resetUsageBtn.classList.add("hidden");
  }
}

document.querySelectorAll('#outfit-tabs button[data-bs-toggle="tab"]').forEach((tab) => {
  tab.addEventListener("shown.bs.tab", () => {
    updateOutfitActionButton();
  });
});

function populateOutfitDropdown() {
  const outfits = (questForLifeData.outfits || []).filter((outfit) => outfit.occasion === selectedOccasion);

  olfOutfit.innerHTML = [...outfits]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(
      (o) =>
        `<option value="${o.id}">
          ${escapeHTML(o.name)} (${escapeHTML(o.occasion)})
        </option>`,
    )
    .join("");
}

function renderOccasionFolders() {
  outfitFoldersEl.innerHTML = "";
  getRegisteredOccasions().sort((a, b) => a.localeCompare(b)).forEach((occasion) => {
    const count = (questForLifeData.outfits || []).filter((outfit) => outfit.occasion === occasion).length;
    const column = document.createElement("div");
    column.className = "col-12 col-sm-6 col-md-4";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-outline-primary text-start w-100 h-100 p-3";
    button.dataset.occasion = occasion;
    button.setAttribute("aria-label", `Open ${occasion} folder, ${count} outfits`);
    button.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <span class="fw-semibold"></span>
        <i class="bi bi-folder2-open" aria-hidden="true"></i>
      </div>
      <div class="small mt-2"></div>
    `;
    button.querySelector(".fw-semibold").textContent = occasion;
    button.querySelector(".small").textContent = `${count} ${count === 1 ? "outfit" : "outfits"}`;
    column.appendChild(button);
    outfitFoldersEl.appendChild(column);
  });
}

function getRegisteredOccasions() {
  const occasions = new Set();
  const addOccasion = (value) => {
    if (typeof value === "string" && value.trim()) occasions.add(value.trim());
  };

  (questForLifeData.outfitOccasions || []).forEach(addOccasion);
  (questForLifeData.outfits || []).forEach((outfit) => addOccasion(outfit.occasion));
  return [...occasions];
}

updateOutfitActionButton();
renderOccasionFolders();
