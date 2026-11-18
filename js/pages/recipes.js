import { questForLifeData, saveState } from "../common/storage.js";

const recipeModal = new bootstrap.Modal(document.getElementById("modal-recipe"));
const recipeForm = document.getElementById("recipe-form");
const recipeNameInput = document.getElementById("recipe-name");
const ingredientFields = document.getElementById("recipe-ingredient-fields");
const instructionFields = document.getElementById("recipe-instruction-fields");
const addIngredientButton = document.getElementById("btn-add-recipe-ingredient");
const addInstructionButton = document.getElementById("btn-add-recipe-instruction");
const recipeList = document.getElementById("recipe-list");
const recipeEmpty = document.getElementById("recipe-empty");
const recipeDetailsModal = new bootstrap.Modal(document.getElementById("modal-recipe-details"));
const recipeDetailsTitle = document.getElementById("recipe-details-title");
const recipeDetailsIngredients = document.getElementById("recipe-details-ingredients");
const recipeDetailsInstructions = document.getElementById("recipe-details-instructions");

let nextIngredientNumber = 2;
let nextInstructionNumber = 2;

document.getElementById("btn-add-recipe").addEventListener("click", () => {
  recipeForm.reset();
  recipeForm.querySelectorAll("[data-dynamic-recipe-field]").forEach((field) => field.remove());
  nextIngredientNumber = 2;
  nextInstructionNumber = 2;
  recipeModal.show();
});

addIngredientButton.addEventListener("click", () => {
  addRecipeField(ingredientFields, "ingredient", nextIngredientNumber);
  nextIngredientNumber += 1;
});

addInstructionButton.addEventListener("click", () => {
  addRecipeField(instructionFields, "instruction", nextInstructionNumber);
  nextInstructionNumber += 1;
});

[ingredientFields, instructionFields].forEach((fields) => {
  fields.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-recipe-field]");
    if (!removeButton) return;

    const row = removeButton.closest("[data-dynamic-recipe-field]");
    if (row) row.remove();
  });
});

recipeForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = recipeNameInput.value.trim();
  if (!name) {
    alert("Recipe name is required.");
    recipeNameInput.focus();
    return;
  }

  const ingredients = [...ingredientFields.querySelectorAll("[data-recipe-ingredient]")]
    .map((field) => field.value.trim())
    .filter(Boolean);
  if (ingredients.length === 0) {
    alert("Add at least one ingredient.");
    ingredientFields.querySelector("[data-recipe-ingredient]").focus();
    return;
  }

  const instructions = [...instructionFields.querySelectorAll("[data-recipe-instruction]")]
    .map((field) => field.value.trim())
    .filter(Boolean);
  if (instructions.length === 0) {
    alert("Add at least one instruction.");
    instructionFields.querySelector("[data-recipe-instruction]").focus();
    return;
  }

  if (!Array.isArray(questForLifeData.recipes)) questForLifeData.recipes = [];
  questForLifeData.recipes.push({
    id: crypto.randomUUID(),
    name,
    ingredients,
    instructions,
    createdAt: Date.now(),
  });

  saveState();
  recipeModal.hide();
  renderRecipes();
});

recipeList.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view-recipe]");
  if (!viewButton) return;

  const recipeIndex = Number(viewButton.dataset.viewRecipe);
  const recipe = Array.isArray(questForLifeData.recipes) && Number.isSafeInteger(recipeIndex)
    ? questForLifeData.recipes[recipeIndex]
    : null;
  if (!recipe || typeof recipe !== "object") {
    alert("This recipe could not be found.");
    return;
  }

  recipeDetailsTitle.textContent = String(recipe.name || "Untitled recipe");
  renderRecipeDetailsList(recipeDetailsIngredients, getRecipeEntries(recipe, "ingredients"));
  renderRecipeDetailsList(recipeDetailsInstructions, getRecipeEntries(recipe, "instructions"));
  recipeDetailsModal.show();
});

function addRecipeField(container, fieldType, fieldNumber) {
  const isIngredient = fieldType === "ingredient";
  const label = isIngredient ? "Ingredient" : "Instruction";
  const row = document.createElement("div");
  row.className = "d-flex align-items-start gap-2 recipe-field-row";
  row.dataset.dynamicRecipeField = "";

  const field = document.createElement(isIngredient ? "input" : "textarea");
  field.className = "form-control";
  field.id = `recipe-${fieldType}-${fieldNumber}`;
  field.setAttribute("aria-label", `${label} ${fieldNumber}`);
  field.dataset[isIngredient ? "recipeIngredient" : "recipeInstruction"] = "";
  if (isIngredient) {
    field.type = "text";
    field.placeholder = "Add an ingredient";
  } else {
    field.rows = 2;
    field.placeholder = "Add an instruction";
  }

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "btn btn-outline-danger";
  removeButton.dataset.removeRecipeField = "";
  removeButton.setAttribute("aria-label", `Remove ${label.toLowerCase()} ${fieldNumber}`);
  removeButton.textContent = "×";

  row.append(field, removeButton);
  container.appendChild(row);
  field.focus();
}

function renderRecipes() {
  const recipes = Array.isArray(questForLifeData.recipes)
    ? questForLifeData.recipes
      .map((recipe, index) => ({ recipe, index }))
      .filter(({ recipe }) => recipe && typeof recipe === "object")
    : [];
  recipeList.innerHTML = "";
  recipeList.classList.toggle("hidden", recipes.length === 0);
  recipeEmpty.classList.toggle("hidden", recipes.length > 0);

  recipes.forEach(({ recipe, index }) => {
    const column = document.createElement("div");
    column.className = "col-12 col-md-6 col-lg-4";
    const card = document.createElement("article");
    card.className = "card recipe-card shadow-sm h-100";
    const cardBody = document.createElement("div");
    cardBody.className = "card-body d-flex flex-column";

    const title = document.createElement("h2");
    title.className = "h5 card-title text-break";
    title.textContent = String(recipe.name || "Untitled recipe");
    cardBody.appendChild(title);

    const ingredients = getRecipeEntries(recipe, "ingredients");
    const instructions = getRecipeEntries(recipe, "instructions");
    const summary = document.createElement("div");
    summary.className = "small text-muted mb-2";
    summary.textContent = `${formatCount(ingredients.length, "ingredient")} · ${formatCount(instructions.length, "step")}`;
    cardBody.appendChild(summary);

    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.className = "btn btn-outline-primary btn-sm align-self-start mt-auto";
    viewButton.dataset.viewRecipe = String(index);
    viewButton.textContent = "View Recipe";
    cardBody.appendChild(viewButton);

    card.appendChild(cardBody);
    column.appendChild(card);
    recipeList.appendChild(column);
  });
}

function getRecipeEntries(recipe, key) {
  return (Array.isArray(recipe[key]) ? recipe[key] : [])
    .filter((value) => typeof value === "string" && value.trim());
}

function formatCount(count, singular) {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

function renderRecipeDetailsList(container, entries) {
  container.innerHTML = "";
  entries.forEach((value) => {
    const item = document.createElement("li");
    item.textContent = value;
    container.appendChild(item);
  });
}

renderRecipes();