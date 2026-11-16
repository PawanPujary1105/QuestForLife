import { questForLifeData, saveState } from "../common/storage.js";
import { escapeHTML } from "../common/utils.js";

const MUSCLES = ["Chest", "Triceps", "Back", "Biceps", "Abs", "Legs", "Shoulders"];

const planModal = new bootstrap.Modal(document.getElementById("modal-gym-plan"));
const planForm = document.getElementById("gym-plan-form");
const planNameInput = document.getElementById("gp-name");
const planMuscleOptions = document.getElementById("gp-muscle-options");
const planExerciseOptions = document.getElementById("gp-exercise-options");
const planExerciseEmpty = document.getElementById("gp-exercise-empty");
const planModalTitle = document.getElementById("gym-plan-modal-title");
const savePlanButton = document.getElementById("btn-save-gym-plan");

const exerciseModal = new bootstrap.Modal(document.getElementById("modal-gym-exercise"));
const exerciseForm = document.getElementById("gym-exercise-form");
const exerciseNameInput = document.getElementById("ge-name");
const exerciseMuscleSelect = document.getElementById("ge-muscle");
const exerciseModalTitle = document.getElementById("gym-exercise-modal-title");
const saveExerciseButton = document.getElementById("btn-save-gym-exercise");

const logModal = new bootstrap.Modal(document.getElementById("modal-gym-log"));
const logForm = document.getElementById("gym-log-form");
const logPlanSelect = document.getElementById("gl-plan");
const logDateInput = document.getElementById("gl-date");
const logPlanEmpty = document.getElementById("gl-plan-empty");
const logPlanField = logPlanSelect.closest(".mb-3");
const logStatusField = document.getElementById("gl-status-field");
const logStatusSelect = document.getElementById("gl-status");
const logModalTitle = document.querySelector("#modal-gym-log .modal-title");
const saveLogButton = document.getElementById("btn-save-gym-log");

const folderView = document.getElementById("gym-folder-view");
const detailView = document.getElementById("gym-detail-view");
const foldersContainer = document.getElementById("gym-folders");
const detailTitle = document.getElementById("gym-detail-title");
const backButton = document.getElementById("btn-back-gym-folders");
const actionButton = document.getElementById("btn-gym-action");
const plansView = document.getElementById("gym-plans-view");
const logsView = document.getElementById("gym-logs-view");
const exercisesView = document.getElementById("gym-exercises-view");
const plansList = document.getElementById("gym-plans-list");
const plansEmpty = document.getElementById("gym-plans-empty");
const logsList = document.getElementById("gym-logs-list");
const logsEmpty = document.getElementById("gym-logs-empty");
const logsListView = document.getElementById("gym-logs-list-view");
const logDetailView = document.getElementById("gym-log-detail-view");
const detailHeader = document.getElementById("gym-detail-header");
const backToLogsButton = document.getElementById("btn-back-gym-logs");
const logDetailTitle = document.getElementById("gym-log-detail-title");
const logDetailMeta = document.getElementById("gym-log-detail-meta");
const logDetailExercises = document.getElementById("gym-log-exercises");
const logDetailExercisesEmpty = document.getElementById("gym-log-exercises-empty");
const startRestButton = document.getElementById("btn-start-gym-rest");
const setRestButton = document.getElementById("btn-set-gym-rest");
const restDurationLabel = document.getElementById("gym-rest-duration");
const restModal = new bootstrap.Modal(document.getElementById("modal-gym-rest"));
const restForm = document.getElementById("gym-rest-form");
const restSecondsInput = document.getElementById("gym-rest-seconds");
const restTimerView = document.getElementById("gym-rest-timer-view");
const restTimer = document.getElementById("gym-rest-timer");
const restCountdown = document.getElementById("gym-rest-countdown");
const restProgress = document.getElementById("gym-rest-progress");
const restComplete = document.getElementById("gym-rest-complete");
const exitRestButton = document.getElementById("btn-exit-gym-rest");
const addRepButton = document.getElementById("btn-add-gym-rep");
const repModal = new bootstrap.Modal(document.getElementById("modal-gym-rep"));
const repForm = document.getElementById("gym-rep-form");
const repExerciseSelect = document.getElementById("gym-rep-exercise");
const repCountInput = document.getElementById("gym-rep-count");
const repWeightInput = document.getElementById("gym-rep-weight");
const repEditModal = new bootstrap.Modal(document.getElementById("modal-gym-rep-edit"));
const repEditForm = document.getElementById("gym-rep-edit-form");
const repEditTitle = document.getElementById("gym-rep-edit-modal-title");
const repEditFields = document.getElementById("gym-rep-edit-fields");
const exercisesList = document.getElementById("gym-exercises-list");
const exercisesEmpty = document.getElementById("gym-exercises-empty");

let activeFolder = null;
let editingPlanId = null;
let editingExerciseId = null;
let editingLogId = null;
let activeLogId = null;
let editingRepExerciseId = null;
let restTimerInterval = null;
let restTimerEndsAt = 0;
let restTimerDurationMs = 60000;
const restTimerCircumference = 2 * Math.PI * 98;

const musclePlaceholder = document.createElement("option");
musclePlaceholder.value = "";
musclePlaceholder.textContent = "Select a muscle";
musclePlaceholder.disabled = true;
musclePlaceholder.selected = true;
exerciseMuscleSelect.appendChild(musclePlaceholder);

MUSCLES.forEach((muscle) => {
  const option = document.createElement("option");
  option.value = muscle;
  option.textContent = muscle;
  exerciseMuscleSelect.appendChild(option);
});

foldersContainer.addEventListener("click", (event) => {
  const folderButton = event.target.closest("[data-gym-folder]");
  if (!folderButton) return;

  activeFolder = folderButton.dataset.gymFolder;
  const folder = getFolders().find((item) => item.id === activeFolder);
  if (!folder) return;

  detailTitle.textContent = folder.label;
  folderView.classList.add("hidden");
  detailView.classList.remove("hidden");
  plansView.classList.toggle("hidden", activeFolder !== "plans");
  logsView.classList.toggle("hidden", activeFolder !== "logs");
  exercisesView.classList.toggle("hidden", activeFolder !== "exercises");
  updateActionButton();

  if (activeFolder === "plans") renderPlans();
  if (activeFolder === "logs") {
    detailHeader.classList.remove("hidden");
    restTimerView.classList.add("hidden");
    logsListView.classList.remove("hidden");
    logDetailView.classList.add("hidden");
    activeLogId = null;
    renderLogs();
  }
  if (activeFolder === "exercises") renderExercises();
});

backButton.addEventListener("click", () => {
  const previousFolder = activeFolder;
  activeFolder = null;
  detailView.classList.add("hidden");
  folderView.classList.remove("hidden");
  renderFolders();

  const folderButton = [...foldersContainer.querySelectorAll("[data-gym-folder]")]
    .find((button) => button.dataset.gymFolder === previousFolder);
  if (folderButton) folderButton.focus();
});

backToLogsButton.addEventListener("click", () => {
  logDetailView.classList.add("hidden");
  logsListView.classList.remove("hidden");
  detailHeader.classList.remove("hidden");
  const previousLogId = activeLogId;
  activeLogId = null;
  updateActionButton();

  const logButton = [...logsList.querySelectorAll("[data-open-log]")]
    .find((button) => button.dataset.openLog === previousLogId);
  if (logButton) logButton.focus();
});

startRestButton.addEventListener("click", startRestTimer);
setRestButton.addEventListener("click", () => {
  const log = questForLifeData.gymLogs.find((item) => item.id === activeLogId);
  if (!log) return;

  restForm.reset();
  restSecondsInput.value = String(getLogRestSeconds(log));
  restModal.show();
});

restForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const seconds = Number(restSecondsInput.value);
  if (!Number.isSafeInteger(seconds) || seconds < 1 || !Number.isSafeInteger(seconds * 1000)) {
    alert("Enter a positive whole number of seconds.");
    restSecondsInput.focus();
    return;
  }

  const log = questForLifeData.gymLogs.find((item) => item.id === activeLogId);
  if (!log) {
    alert("This workout log could not be found.");
    return;
  }

  log.restSeconds = seconds;
  saveState();
  restDurationLabel.textContent = `Rest: ${formatRestDuration(seconds)}`;
  restModal.hide();
});

exitRestButton.addEventListener("click", exitRestTimer);

addRepButton.addEventListener("click", openRepModal);

repForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const reps = Number(repCountInput.value);
  const weight = Number(repWeightInput.value);
  if (!Number.isSafeInteger(reps) || reps < 1) {
    alert("Enter a positive whole number of reps.");
    repCountInput.focus();
    return;
  }
  if (!Number.isFinite(weight) || weight < 0) {
    alert("Enter a valid non-negative weight.");
    repWeightInput.focus();
    return;
  }

  const log = questForLifeData.gymLogs.find((item) => item.id === activeLogId);
  const plan = log && questForLifeData.workoutPlans.find((item) => item.id === log.planId);
  const exercise = getPlanExercises(plan).find((item) => item.id === repExerciseSelect.value);
  if (!log || !exercise) {
    alert("Select an exercise from this workout plan.");
    repExerciseSelect.focus();
    return;
  }

  if (!Array.isArray(log.repEntries)) log.repEntries = [];
  log.repEntries.push({ exerciseId: exercise.id, reps, weight });
  saveState();
  repModal.hide();
  renderLogDetail(log);
});

repEditForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const log = questForLifeData.gymLogs.find((item) => item.id === activeLogId);
  if (!log || !editingRepExerciseId || !Array.isArray(log.repEntries)) {
    alert("This workout entry could not be found.");
    return;
  }

  const updates = [...repEditFields.querySelectorAll("[data-rep-entry-index]")].map((group) => {
    const reps = Number(group.querySelector('[data-rep-field="reps"]').value);
    const weight = Number(group.querySelector('[data-rep-field="weight"]').value);
    return { index: Number(group.dataset.repEntryIndex), reps, weight };
  });

  for (const update of updates) {
    if (!Number.isSafeInteger(update.reps) || update.reps < 1) {
      alert("Enter a positive whole number of reps for each set.");
      return;
    }
    if (!Number.isFinite(update.weight) || update.weight < 0) {
      alert("Enter a valid non-negative weight for each set.");
      return;
    }
    const entry = log.repEntries[update.index];
    if (!entry || entry.exerciseId !== editingRepExerciseId) {
      alert("A rep entry could not be found. Reopen the editor and try again.");
      return;
    }
  }

  updates.forEach(({ index, reps, weight }) => {
    log.repEntries[index].reps = reps;
    log.repEntries[index].weight = weight;
  });
  saveState();
  editingRepExerciseId = null;
  repEditModal.hide();
  renderLogDetail(log);
});

actionButton.addEventListener("click", () => {
  if (activeFolder === "plans") {
    openPlanModal();
  } else if (activeFolder === "logs") {
    openLogModal();
  } else if (activeFolder === "exercises") {
    openExerciseModal();
  }
});

planMuscleOptions.addEventListener("change", renderPlanExerciseOptions);

plansList.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-plan]");
  if (!editButton) return;

  const plan = questForLifeData.workoutPlans.find((item) => item.id === editButton.dataset.editPlan);
  if (plan) openPlanModal(plan);
});

exercisesList.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-exercise]");
  if (!editButton) return;

  const exercise = questForLifeData.exercises.find((item) => item.id === editButton.dataset.editExercise);
  if (exercise) openExerciseModal(exercise);
});

logsList.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-log]");
  if (editButton) {
    const log = questForLifeData.gymLogs.find((item) => item.id === editButton.dataset.editLog);
    if (log) openLogModal(log);
    return;
  }

  const redoButton = event.target.closest("[data-redo-log]");
  if (redoButton) {
    redoLog(redoButton.dataset.redoLog);
    return;
  }

  const logButton = event.target.closest("[data-open-log]");
  if (logButton) openLogDetail(logButton.dataset.openLog);
});

logDetailExercises.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-reps]");
  if (editButton) openRepEditModal(editButton.dataset.editReps);
});

planForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = planNameInput.value.trim();
  if (!name) {
    alert("Plan name is required.");
    planNameInput.focus();
    return;
  }

  const muscles = [...planMuscleOptions.querySelectorAll('input[name="plan-muscle"]:checked')]
    .map((input) => input.value);
  if (muscles.length === 0) {
    alert("Select at least one muscle.");
    return;
  }

  const exerciseIds = [...planExerciseOptions.querySelectorAll('input[name="plan-exercise"]:checked')]
    .map((input) => input.value);

  if (editingPlanId) {
    const plan = questForLifeData.workoutPlans.find((item) => item.id === editingPlanId);
    if (!plan) {
      alert("This plan could not be found.");
      return;
    }

    plan.name = name;
    plan.muscles = muscles;
    plan.exerciseIds = exerciseIds;
  } else {
    questForLifeData.workoutPlans.push({
      id: crypto.randomUUID(),
      name,
      muscles,
      exerciseIds,
      createdAt: Date.now(),
    });
  }

  editingPlanId = null;
  setPlanModalMode(false);
  saveState();
  planModal.hide();
  renderPlans();
  renderFolders();
});

exerciseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = exerciseNameInput.value.trim();
  if (!name) {
    alert("Exercise name is required.");
    exerciseNameInput.focus();
    return;
  }

  const muscle = exerciseMuscleSelect.value;
  if (!MUSCLES.includes(muscle)) {
    alert("Select a muscle.");
    exerciseMuscleSelect.focus();
    return;
  }

  if (editingExerciseId) {
    const exercise = questForLifeData.exercises.find((item) => item.id === editingExerciseId);
    if (!exercise) {
      alert("This exercise could not be found.");
      return;
    }

    const previousMuscle = exercise.muscle;
    exercise.name = name;
    exercise.muscle = muscle;

    if (previousMuscle !== muscle) {
      questForLifeData.workoutPlans.forEach((plan) => {
        if ((plan.exerciseIds || []).includes(exercise.id) && !(plan.muscles || []).includes(muscle)) {
          plan.muscles = [...new Set([...(plan.muscles || []), muscle])];
        }
      });
    }
  } else {
    questForLifeData.exercises.push({
      id: crypto.randomUUID(),
      name,
      muscle,
      createdAt: Date.now(),
    });
  }

  editingExerciseId = null;
  setExerciseModalMode(false);
  saveState();
  exerciseModal.hide();
  renderExercises();
  renderPlans();
  renderFolders();
});

logForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!logDateInput.value) {
    alert("Select a log date.");
    logDateInput.focus();
    return;
  }

  if (editingLogId) {
    const log = questForLifeData.gymLogs.find((item) => item.id === editingLogId);
    if (!log) {
      alert("This workout log could not be found.");
      return;
    }

    log.date = logDateInput.value;
    log.status = logStatusSelect.value;
  } else {
    const plan = questForLifeData.workoutPlans.find((item) => item.id === logPlanSelect.value);
    if (!plan) {
      alert("Select a plan to log.");
      logPlanSelect.focus();
      return;
    }

    questForLifeData.gymLogs.push({
      id: crypto.randomUUID(),
      planId: plan.id,
      planName: plan.name,
      date: logDateInput.value,
      status: "scheduled",
      createdAt: Date.now(),
    });
  }

  editingLogId = null;
  setLogModalMode(false);
  saveState();
  logModal.hide();
  renderLogs();
  renderFolders();
});

function getFolders() {
  return [
    { id: "plans", label: "Plans", detail: `${questForLifeData.workoutPlans.length} plans` },
    { id: "logs", label: "Logs", detail: `${questForLifeData.gymLogs.length} logs` },
    { id: "exercises", label: "Exercises", detail: `${questForLifeData.exercises.length} exercises` },
  ];
}

function renderFolders() {
  foldersContainer.innerHTML = "";
  getFolders().forEach((folder) => {
    const column = document.createElement("div");
    column.className = "col-12 col-sm-6 col-md-4";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-outline-primary text-start w-100 h-100 p-3";
    button.dataset.gymFolder = folder.id;
    button.setAttribute("aria-label", `Open ${folder.label} folder`);
    button.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <span class="fw-semibold"></span>
        <i class="bi bi-folder2-open" aria-hidden="true"></i>
      </div>
      <div class="small mt-2"></div>
    `;
    button.querySelector(".fw-semibold").textContent = folder.label;
    button.querySelector(".small").textContent = folder.detail;
    column.appendChild(button);
    foldersContainer.appendChild(column);
  });
}

function updateActionButton() {
  if (activeFolder === "plans") {
    actionButton.textContent = "＋ Add Plan";
    actionButton.classList.remove("hidden");
  } else if (activeFolder === "logs") {
    actionButton.textContent = "＋ Add Log";
    actionButton.classList.remove("hidden");
  } else if (activeFolder === "exercises") {
    actionButton.textContent = "＋ Add Exercise";
    actionButton.classList.remove("hidden");
  } else {
    actionButton.classList.add("hidden");
  }
}

function openPlanModal(plan = null) {
  planForm.reset();
  editingPlanId = plan ? plan.id : null;
  setPlanModalMode(Boolean(plan));
  planNameInput.value = plan ? plan.name : "";
  renderPlanMuscleOptions();

  if (plan) {
    const selectedMuscles = new Set(plan.muscles || []);
    planMuscleOptions.querySelectorAll('input[name="plan-muscle"]').forEach((input) => {
      input.checked = selectedMuscles.has(input.value);
    });
  }

  renderPlanExerciseOptions();
  if (plan) {
    const selectedExercises = new Set(plan.exerciseIds || []);
    planExerciseOptions.querySelectorAll('input[name="plan-exercise"]').forEach((input) => {
      input.checked = selectedExercises.has(input.value);
    });
  }

  planModal.show();
}

function setPlanModalMode(isEditing) {
  planModalTitle.textContent = isEditing ? "Edit Plan" : "Add Plan";
  savePlanButton.textContent = isEditing ? "Save Changes" : "Save Plan";
}

function openExerciseModal(exercise = null) {
  exerciseForm.reset();
  editingExerciseId = exercise ? exercise.id : null;
  exerciseNameInput.value = exercise ? exercise.name : "";
  exerciseMuscleSelect.value = exercise ? exercise.muscle : "";
  setExerciseModalMode(Boolean(exercise));
  exerciseModal.show();
}

function setExerciseModalMode(isEditing) {
  exerciseModalTitle.textContent = isEditing ? "Edit Exercise" : "Add Exercise";
  saveExerciseButton.textContent = isEditing ? "Save Changes" : "Save Exercise";
}

function openLogModal(log = null) {
  logForm.reset();
  editingLogId = log ? log.id : null;
  const isEditing = Boolean(log);
  setLogModalMode(isEditing);

  if (isEditing) {
    logDateInput.value = log.date;
    logStatusSelect.value = log.status === "completed" ? "completed" : "scheduled";
  } else {
    logDateInput.value = getLocalDateInputValue();
    populateLogPlanSelect();
  }

  logModal.show();
}

function setLogModalMode(isEditing) {
  logModalTitle.textContent = isEditing ? "Edit Workout Log" : "Add Workout Log";
  saveLogButton.textContent = isEditing ? "Save Changes" : "Save Log";
  logPlanField.classList.toggle("hidden", isEditing);
  logPlanSelect.required = !isEditing;
  logPlanSelect.disabled = isEditing;
  logStatusField.classList.toggle("hidden", !isEditing);
  logStatusSelect.required = isEditing;
  logStatusSelect.disabled = !isEditing;
  if (isEditing) saveLogButton.disabled = false;
}

function openLogDetail(logId) {
  const log = questForLifeData.gymLogs.find((item) => item.id === logId);
  if (!log) return;

  activeLogId = log.id;
  detailHeader.classList.add("hidden");
  logsListView.classList.add("hidden");
  restTimerView.classList.add("hidden");
  logDetailView.classList.remove("hidden");
  actionButton.classList.add("hidden");
  restDurationLabel.textContent = `Rest: ${formatRestDuration(getLogRestSeconds(log))}`;
  renderLogDetail(log);
}

function getLogRestSeconds(log) {
  return Number.isSafeInteger(log.restSeconds) && log.restSeconds > 0 ? log.restSeconds : 60;
}

function formatRestDuration(seconds) {
  return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
}

function startRestTimer() {
  const log = questForLifeData.gymLogs.find((item) => item.id === activeLogId);
  if (!log) {
    alert("This workout log could not be found.");
    return;
  }

  const durationMs = getLogRestSeconds(log) * 1000;
  const endsAt = Date.now() + durationMs;
  if (!Number.isSafeInteger(durationMs) || !Number.isSafeInteger(endsAt)) {
    alert("Enter a smaller rest duration.");
    return;
  }

  restTimerDurationMs = durationMs;
  restTimerEndsAt = endsAt;
  restComplete.classList.add("hidden");
  exitRestButton.textContent = "Stop Rest";
  restProgress.style.strokeDasharray = `${restTimerCircumference} ${restTimerCircumference}`;
  restProgress.style.strokeDashoffset = "0";
  logDetailView.classList.add("hidden");
  restTimerView.classList.remove("hidden");
  updateRestTimer();
  restTimerInterval = setInterval(updateRestTimer, 100);
}

function updateRestTimer() {
  const remainingMs = Math.max(0, restTimerEndsAt - Date.now());
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const progress = 1 - remainingMs / restTimerDurationMs;

  restCountdown.textContent = String(remainingSeconds);
  const unit = remainingSeconds === 1 ? "second" : "seconds";
  restTimer.setAttribute("aria-label", `${remainingSeconds} ${unit} remaining`);
  restProgress.style.strokeDashoffset = String(restTimerCircumference * progress);

  if (remainingMs === 0) {
    clearInterval(restTimerInterval);
    restTimerInterval = null;
    restComplete.classList.remove("hidden");
    exitRestButton.textContent = "Back to Log";
  }
}

function exitRestTimer() {
  if (restTimerInterval !== null) {
    clearInterval(restTimerInterval);
    restTimerInterval = null;
  }
  restTimerView.classList.add("hidden");
  restComplete.classList.add("hidden");
  exitRestButton.textContent = "Stop Rest";
  if (activeLogId) {
    const log = questForLifeData.gymLogs.find((item) => item.id === activeLogId);
    if (log) {
      logDetailView.classList.remove("hidden");
      restDurationLabel.textContent = `Rest: ${formatRestDuration(getLogRestSeconds(log))}`;
    }
  }
}

function renderPlanMuscleOptions() {
  planMuscleOptions.innerHTML = "";
  MUSCLES.forEach((muscle) => {
    const column = document.createElement("div");
    column.className = "col-6 col-md-4";
    const wrapper = document.createElement("div");
    wrapper.className = "form-check";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "form-check-input";
    checkbox.id = `gp-muscle-${muscle.toLowerCase()}`;
    checkbox.name = "plan-muscle";
    checkbox.value = muscle;
    const label = document.createElement("label");
    label.className = "form-check-label";
    label.htmlFor = checkbox.id;
    label.textContent = muscle;
    wrapper.append(checkbox, label);
    column.appendChild(wrapper);
    planMuscleOptions.appendChild(column);
  });
}

function renderPlanExerciseOptions() {
  const previouslySelected = new Set(
    [...planExerciseOptions.querySelectorAll('input[name="plan-exercise"]:checked')]
      .map((input) => input.value),
  );
  const selectedMuscles = [...planMuscleOptions.querySelectorAll('input[name="plan-muscle"]:checked')]
    .map((input) => input.value);
  const matchingExercises = questForLifeData.exercises.filter((exercise) => selectedMuscles.includes(exercise.muscle));

  planExerciseOptions.innerHTML = "";
  if (selectedMuscles.length === 0) {
    planExerciseEmpty.textContent = "Select one or more muscles to see available exercises.";
    return;
  }
  if (matchingExercises.length === 0) {
    planExerciseEmpty.textContent = "No exercises for these muscles yet. Add them in the Exercises folder.";
    return;
  }

  planExerciseEmpty.textContent = "";
  matchingExercises
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((exercise) => {
      const column = document.createElement("div");
      column.className = "col-12 col-sm-6";
      const wrapper = document.createElement("div");
      wrapper.className = "form-check";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "form-check-input";
      checkbox.id = `gp-exercise-${exercise.id}`;
      checkbox.name = "plan-exercise";
      checkbox.value = exercise.id;
      checkbox.checked = previouslySelected.has(exercise.id);
      const label = document.createElement("label");
      label.className = "form-check-label";
      label.htmlFor = checkbox.id;
      label.textContent = `${exercise.name} (${exercise.muscle})`;
      wrapper.append(checkbox, label);
      column.appendChild(wrapper);
      planExerciseOptions.appendChild(column);
    });
}

function renderPlans() {
  const plans = questForLifeData.workoutPlans || [];
  const exercisesById = new Map(questForLifeData.exercises.map((exercise) => [exercise.id, exercise]));
  plansList.innerHTML = "";
  plansEmpty.classList.toggle("hidden", plans.length > 0);

  [...plans]
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((plan) => {
      const planExercises = (plan.exerciseIds || [])
        .map((id) => exercisesById.get(id))
        .filter(Boolean);
      const muscleBadges = (plan.muscles || [])
        .map((muscle) => `<span class="badge text-bg-info">${escapeHTML(muscle)}</span>`)
        .join(" ");
      const exerciseList = planExercises.length
        ? planExercises.map((exercise) => `<li>${escapeHTML(exercise.name)} <span class="text-muted">(${escapeHTML(exercise.muscle)})</span></li>`).join("")
        : `<li class="text-muted">No exercises selected</li>`;
      const column = document.createElement("div");
      column.className = "col-12 col-md-6 col-lg-4";
      column.innerHTML = `
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start gap-2">
              <h3 class="h5 card-title">${escapeHTML(plan.name)}</h3>
              <button type="button" class="btn btn-outline-secondary btn-sm" data-edit-plan="${escapeHTML(plan.id)}">✎ Edit</button>
            </div>
            <div class="d-flex flex-wrap gap-2 mb-3">${muscleBadges}</div>
            <div class="small fw-semibold mb-1">Exercises</div>
            <ul class="mb-0">${exerciseList}</ul>
          </div>
        </div>
      `;
      plansList.appendChild(column);
    });
}

function renderExercises() {
  const exercises = questForLifeData.exercises || [];
  exercisesList.innerHTML = "";
  exercisesEmpty.classList.toggle("hidden", exercises.length > 0);

  [...exercises]
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((exercise) => {
      const column = document.createElement("div");
      column.className = "col-12 col-md-6 col-lg-4";
      column.innerHTML = `
        <div class="card shadow-sm h-100">
          <div class="card-body d-flex justify-content-between align-items-center gap-3">
            <div>
              <h3 class="h5 card-title mb-2">${escapeHTML(exercise.name)}</h3>
              <span class="badge text-bg-info">${escapeHTML(exercise.muscle)}</span>
            </div>
            <button type="button" class="btn btn-outline-secondary btn-sm" data-edit-exercise="${escapeHTML(exercise.id)}">✎ Edit</button>
          </div>
        </div>
      `;
      exercisesList.appendChild(column);
    });
}

function populateLogPlanSelect() {
  const plans = [...questForLifeData.workoutPlans].sort((a, b) => a.name.localeCompare(b.name));
  logPlanSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = plans.length ? "Select a plan" : "No plans available";
  placeholder.disabled = true;
  placeholder.selected = true;
  logPlanSelect.appendChild(placeholder);

  plans.forEach((plan) => {
    const option = document.createElement("option");
    option.value = plan.id;
    option.textContent = plan.name;
    logPlanSelect.appendChild(option);
  });

  logPlanSelect.required = true;
  logPlanSelect.disabled = plans.length === 0;
  saveLogButton.disabled = plans.length === 0;
  logPlanEmpty.textContent = plans.length ? "" : "Create a plan before adding a workout log.";
}

function renderLogs() {
  const logs = questForLifeData.gymLogs || [];
  logsList.innerHTML = "";
  logsEmpty.classList.toggle("hidden", logs.length > 0);

  [...logs]
    .sort((a, b) => (
      b.date.localeCompare(a.date)
      || (b.createdAt || 0) - (a.createdAt || 0)
    ))
    .forEach((log) => {
      const { date, day } = formatGymLogDate(log.date);
      const status = log.status === "completed" ? "completed" : "scheduled";
      const statusLabel = status === "completed" ? "Completed" : "Scheduled";
      const statusClass = status === "completed" ? "text-bg-success" : "text-bg-primary";
      const column = document.createElement("div");
      column.className = "col-12 col-md-6 col-lg-4";
      column.innerHTML = `
        <div class="card shadow-sm h-100">
          <button type="button" class="btn text-start text-reset border-0 rounded-0 w-100 p-3" data-open-log="${escapeHTML(log.id)}">
            <h3 class="h5 card-title"></h3>
            <div class="text-muted gym-log-date"></div>
            <div class="small gym-log-day"></div>
            <span class="badge ${statusClass} gym-log-status"></span>
          </button>
          <div class="card-footer d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-primary btn-sm" data-redo-log="${escapeHTML(log.id)}">Redo</button>
            <button type="button" class="btn btn-outline-secondary btn-sm" data-edit-log="${escapeHTML(log.id)}">✎ Edit</button>
          </div>
        </div>
      `;
      const openButton = column.querySelector("[data-open-log]");
      openButton.setAttribute("aria-label", `Open ${getLogPlanName(log)}, ${date}, ${day}, ${statusLabel}`);
      openButton.querySelector(".card-title").textContent = getLogPlanName(log);
      openButton.querySelector(".gym-log-date").textContent = date;
      openButton.querySelector(".gym-log-day").textContent = day;
      openButton.querySelector(".gym-log-status").textContent = statusLabel;
      logsList.appendChild(column);
    });
}

function getLogPlanName(log) {
  const plan = questForLifeData.workoutPlans.find((item) => item.id === log.planId);
  return plan ? plan.name : log.planName || "Workout Plan";
}

function redoLog(logId) {
  const log = questForLifeData.gymLogs.find((item) => item.id === logId);
  if (!log) {
    alert("This workout log could not be found.");
    return;
  }

  const redo = {
    id: crypto.randomUUID(),
    planId: log.planId,
    planName: getLogPlanName(log),
    date: getLocalDateInputValue(),
    status: "scheduled",
    createdAt: Date.now(),
    repEntries: Array.isArray(log.repEntries)
      ? log.repEntries.map((entry) => (entry && typeof entry === "object" ? { ...entry } : entry))
      : [],
  };
  if (Number.isSafeInteger(log.restSeconds) && log.restSeconds > 0) {
    redo.restSeconds = log.restSeconds;
  }

  questForLifeData.gymLogs.push(redo);
  saveState();
  renderLogs();

  const newLogButton = [...logsList.querySelectorAll("[data-open-log]")]
    .find((button) => button.dataset.openLog === redo.id);
  if (newLogButton) newLogButton.focus();
}

function renderLogDetail(log) {
  const plan = questForLifeData.workoutPlans.find((item) => item.id === log.planId);
  const { date, day } = formatGymLogDate(log.date);
  const status = log.status === "completed" ? "Completed" : "Scheduled";
  logDetailTitle.textContent = getLogPlanName(log);
  logDetailMeta.textContent = `${date} · ${day} · ${status}`;
  logDetailExercises.innerHTML = "";

  const exercises = getPlanExercises(plan);
  addRepButton.disabled = exercises.length === 0;
  logDetailExercisesEmpty.classList.toggle("hidden", exercises.length > 0);

  exercises.forEach((exercise) => {
    const column = document.createElement("div");
    column.className = "col-12 col-md-6 col-lg-4";
    column.innerHTML = `
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center gap-3">
            <h4 class="h6 card-title mb-0">${escapeHTML(exercise.name)}</h4>
            <span class="badge text-bg-info">${escapeHTML(exercise.muscle)}</span>
          </div>
        </div>
      </div>
    `;
    const repEntries = (Array.isArray(log.repEntries) ? log.repEntries : [])
      .filter((entry) => entry
        && entry.exerciseId === exercise.id
        && Number.isSafeInteger(entry.reps)
        && entry.reps > 0
        && Number.isFinite(entry.weight)
        && entry.weight >= 0);
    if (repEntries.length > 0) {
      const repsRow = document.createElement("div");
      repsRow.className = "d-flex justify-content-between align-items-center gap-2 flex-wrap mt-2";
      const repsSummary = document.createElement("div");
      repsSummary.className = "small text-muted text-break";
      repsSummary.textContent = repEntries
        .map((entry) => `${entry.reps} × ${entry.weight}`)
        .join(" | ");
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn btn-outline-secondary btn-sm";
      editButton.dataset.editReps = exercise.id;
      editButton.textContent = "Edit Reps";
      repsRow.append(repsSummary, editButton);
      column.querySelector(".card-body").appendChild(repsRow);
    }
    logDetailExercises.appendChild(column);
  });
}

function openRepEditModal(exerciseId) {
  const log = questForLifeData.gymLogs.find((item) => item.id === activeLogId);
  const plan = log && questForLifeData.workoutPlans.find((item) => item.id === log.planId);
  const exercise = getPlanExercises(plan).find((item) => item.id === exerciseId);
  const entries = (log && Array.isArray(log.repEntries) ? log.repEntries : [])
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry
      && entry.exerciseId === exerciseId
      && Number.isSafeInteger(entry.reps)
      && entry.reps > 0
      && Number.isFinite(entry.weight)
      && entry.weight >= 0);

  if (!log || !exercise || entries.length === 0) {
    alert("No reps are available to edit for this exercise.");
    return;
  }

  editingRepExerciseId = exerciseId;
  repEditTitle.textContent = `Edit Reps - ${exercise.name}`;
  repEditFields.innerHTML = "";

  entries.forEach(({ entry, index }, displayIndex) => {
    const section = document.createElement("section");
    section.className = "border rounded p-3";
    section.dataset.repEntryIndex = String(index);

    const heading = document.createElement("div");
    heading.className = "fw-semibold mb-2";
    heading.textContent = `Rep ${displayIndex + 1}`;

    const row = document.createElement("div");
    row.className = "row g-2";
    row.append(
      createRepEditField("Reps", "reps", entry.reps, "1", "1", displayIndex),
      createRepEditField("Weight", "weight", entry.weight, "0", "any", displayIndex),
    );
    section.append(heading, row);
    repEditFields.appendChild(section);
  });

  repEditModal.show();
}

function createRepEditField(labelText, fieldName, value, min, step, entryNumber) {
  const column = document.createElement("div");
  column.className = "col-6";
  const label = document.createElement("label");
  label.className = "form-label";
  label.textContent = labelText;
  const input = document.createElement("input");
  input.type = "number";
  input.className = "form-control";
  input.min = min;
  input.step = step;
  input.value = String(value);
  input.required = true;
  input.dataset.repField = fieldName;
  label.htmlFor = `gym-rep-edit-${fieldName}-${entryNumber}`;
  input.id = label.htmlFor;
  column.append(label, input);
  return column;
}

function openRepModal() {
  const log = questForLifeData.gymLogs.find((item) => item.id === activeLogId);
  const plan = log && questForLifeData.workoutPlans.find((item) => item.id === log.planId);
  const exercises = getPlanExercises(plan);
  if (!log || exercises.length === 0) {
    alert("This workout plan has no exercises to log.");
    return;
  }

  repForm.reset();
  repExerciseSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select an exercise";
  placeholder.disabled = true;
  placeholder.selected = true;
  repExerciseSelect.appendChild(placeholder);

  exercises.forEach((exercise) => {
    const option = document.createElement("option");
    option.value = exercise.id;
    option.textContent = exercise.name;
    repExerciseSelect.appendChild(option);
  });
  repModal.show();
}

function getPlanExercises(plan) {
  if (!plan) return [];
  const exercisesById = new Map(questForLifeData.exercises.map((exercise) => [exercise.id, exercise]));
  return (plan.exerciseIds || []).map((id) => exercisesById.get(id)).filter(Boolean);
}

function getLocalDateInputValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatGymLogDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return {
    date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    day: date.toLocaleDateString("en-GB", { weekday: "long" }),
  };
}

updateActionButton();
renderFolders();