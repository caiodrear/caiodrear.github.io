/**
 * @license MIT
 * @copyright caiodrear 2024 All rights reserved
 * @author caiodrear <caio.rear@hotmail.co.uk>
 */

"use strict";

/* -------------------------------------- *\
    #TABS
\* -------------------------------------- */

const /** {NodeList} */ $tabBtn = document.querySelectorAll("[data-tab-btn]");
let /** {NodeElement} */ lastActiveTab = document.querySelector("[data-tab-content].active");
let /** {NodeElement} */ lastActiveTabBtn = document.querySelector("[data-tab-btn].active");

$tabBtn.forEach(item => {
    item.addEventListener("click", function () {

        lastActiveTab.classList.remove("active");
        lastActiveTabBtn.classList.remove("active")

        const /** {NodeElement} */ $tabContent = document.querySelector(`[data-tab-content="${item.dataset.tabBtn}"]`);
        $tabContent.classList.add("active"); this.classList.add("active");
        lastActiveTab = $tabContent;
        lastActiveTabBtn = this;
    });
});

/* -------------------------------------- *\
    #RECIPES

    /assets/recipes.json lists every recipe in display order. It is the only
    thing the page needs to draw the index, so it is one request:

        { "name": "Lentils Stew",  "flag": "🇪🇸", "file": "lentils-stew.json" }
        { "name": "10-Minute Dal", "flag": "🇮🇳", "url": "https://..." }

    The body of each recipe sits in its own file under /assets/recipes/, and is
    only read when its sheet is opened. Name and flag are not repeated there, so
    there is one place to rename a recipe.

        {
          "serves": 4,
          "ingredients": { "lentils": "300g", "salt": "" },
          "method": ["Place a large pot...", "Add the bay leaves..."]
        }

    Ingredient groups that need their own heading use "sections" instead:

        "sections": [
          { "title": "marinade", "ingredients": { ... } },
          { "title": "gravy",    "ingredients": { ... } }
        ]
\* -------------------------------------- */

const RECIPE_INDEX = "./assets/recipes.json";
const RECIPE_DIR = "./assets/recipes/";

/** @type {Map<string, Promise<object>>} one request per body, however often it is opened */
const bodies = new Map();

/**
 * @param {string} file
 * @returns {Promise<object>}
 */
const loadBody = function (file) {
    if (!bodies.has(file)) {
        bodies.set(file, fetch(RECIPE_DIR + file).then(response => {
            if (!response.ok) throw new Error(response.status);
            return response.json();
        }));
    }

    return bodies.get(file);
};

/**
 * Flattens either ingredient shape into one list of headed groups.
 *
 * @param {object} recipe parsed contents of a recipe file
 * @returns {Array<{title: string|null, ingredients: object}>}
 */
const ingredientGroups = function (recipe) {
    if (Array.isArray(recipe.sections)) {
        return recipe.sections.map(section => ({
            title: section.title ?? null,
            ingredients: section.ingredients ?? {}
        }));
    }

    return recipe.ingredients ? [{ title: null, ingredients: recipe.ingredients }] : [];
};

const $sheet = document.querySelector("[data-recipe-sheet]");
const $sheetBody = document.querySelector("[data-recipe-body]");

/**
 * @param {object} recipe an already-loaded local recipe
 */
const openRecipe = async function (entry) {
    $sheetBody.innerHTML = "";

    const head = document.createElement("header");
    head.className = "recipe-head";
    $sheetBody.append(head);

    if (entry.flag) {
        const flag = document.createElement("span");
        flag.className = "flag";
        flag.style.margin = "0 auto 6px";
        flag.textContent = entry.flag;
        head.append(flag);
    }

    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "recipe";
    head.append(eyebrow);

    const title = document.createElement("h2");
    title.textContent = entry.name;
    head.append(title);

    // the head is known from the index, so the sheet opens at once
    if (!$sheet.open) $sheet.showModal();

    let recipe;
    try {
        recipe = await loadBody(entry.file);
    } catch (error) {
        const message = document.createElement("p");
        message.className = "recipe-error";
        message.textContent = "This recipe could not be read.";
        $sheetBody.append(message);
        return;
    }

    if (recipe.serves) {
        const serves = document.createElement("p");
        serves.className = "serves";
        serves.textContent = `serves ${recipe.serves}`;
        head.append(serves);
    }

    ingredientGroups(recipe).forEach(group => {
        if (group.title) {
            const heading = document.createElement("h3");
            heading.className = "recipe-section-title";
            heading.textContent = group.title;
            $sheetBody.append(heading);
        }

        const list = document.createElement("div");
        list.className = "ingredient-list";

        Object.entries(group.ingredients).forEach(([name, qty]) => {
            const row = document.createElement("div");
            row.className = "ingredient";
            row.innerHTML =
                `<span class="name"></span><span class="leader"></span><span class="qty"></span>`;
            row.querySelector(".name").textContent = name;
            row.querySelector(".qty").textContent = qty || "—";
            list.append(row);
        });

        $sheetBody.append(list);
    });

    if (Array.isArray(recipe.method) && recipe.method.length) {
        const heading = document.createElement("h3");
        heading.className = "recipe-section-title";
        heading.textContent = "method";
        $sheetBody.append(heading);

        const steps = document.createElement("ol");
        steps.className = "method-list";
        recipe.method.forEach(step => {
            const li = document.createElement("li");
            li.textContent = step;
            steps.append(li);
        });
        $sheetBody.append(steps);
    }

    const foot = document.createElement("footer");
    foot.className = "recipe-foot";
    const raw = document.createElement("a");
    raw.href = RECIPE_DIR + entry.file;
    raw.target = "_blank";
    raw.rel = "noopener";
    raw.textContent = "json";
    foot.append(raw);
    $sheetBody.append(foot);
};

/**
 * @param {object} entry {name, flag} plus either a url or a loaded recipe
 * @returns {HTMLElement}
 */
const recipeCard = function (entry) {
    const card = document.createElement("div");
    card.className = "card";

    const content = document.createElement("div");
    content.className = "card-content recipe";
    card.append(content);

    if (entry.flag) {
        const flag = document.createElement("span");
        flag.className = "flag";
        flag.textContent = entry.flag;
        content.append(flag);
    }

    const title = document.createElement("h3");
    title.className = "title-large card-title";
    title.textContent = entry.name;
    content.append(title);

    const link = document.createElement("a");
    link.className = "state-layer";
    card.append(link);

    // recipes hosted elsewhere keep their outbound link, and say so
    if (entry.url) {
        card.classList.add("external");
        link.href = entry.url;
        link.target = "_blank";
        link.rel = "noopener";
        return card;
    }

    link.href = RECIPE_DIR + entry.file;
    link.addEventListener("click", function (event) {
        event.preventDefault();
        openRecipe(entry);
    });

    return card;
};

const buildRecipeIndex = async function () {
    const $index = document.querySelector("[data-recipe-index]");
    if (!$index) return;

    let recipes;
    try {
        const response = await fetch(RECIPE_INDEX);
        if (!response.ok) throw new Error(response.status);
        recipes = await response.json();
    } catch (error) {
        const message = document.createElement("p");
        message.className = "recipe-error";
        message.textContent = "The recipes could not be loaded.";
        $index.append(message);
        return;
    }

    recipes.forEach(recipe => $index.append(recipeCard(recipe)));

    // once the index is on screen, warm the bodies so opening a sheet is instant
    const whenIdle = window.requestIdleCallback ?? (task => setTimeout(task, 300));
    whenIdle(() => recipes
        .filter(recipe => recipe.file)
        .forEach(recipe => loadBody(recipe.file).catch(() => { })));
};

document.querySelector("[data-recipe-close]")?.addEventListener("click", () => $sheet.close());

// click outside the sheet dismisses it
$sheet?.addEventListener("click", function (event) {
    if (event.target === $sheet) $sheet.close();
});

buildRecipeIndex();
