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

    /assets/recipes.json is an ordered list sitting next to the folder it
    describes. A string is a local recipe file; an object is one hosted
    elsewhere:

        [
          "black-dal.json",
          { "name": "10-Minute Dal", "flag": "🇮🇳", "url": "https://..." }
        ]

    Each local file carries everything its card and sheet need, so the list and
    the sheet are built from one fetch per recipe -- opening a sheet costs nothing.

        {
          "name": "Lentils Stew",
          "flag": "🇪🇸",
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

const RECIPE_DIR = "./assets/recipes/";
const RECIPE_INDEX = "./assets/recipes.json";

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
const openRecipe = function (recipe) {
    $sheetBody.innerHTML = "";

    const head = document.createElement("header");
    head.className = "recipe-head";
    $sheetBody.append(head);

    if (recipe.flag) {
        const flag = document.createElement("span");
        flag.className = "flag";
        flag.style.margin = "0 auto 6px";
        flag.textContent = recipe.flag;
        head.append(flag);
    }

    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "recipe";
    head.append(eyebrow);

    const title = document.createElement("h2");
    title.textContent = recipe.name;
    head.append(title);

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
    raw.href = RECIPE_DIR + recipe.file;
    raw.target = "_blank";
    raw.rel = "noopener";
    raw.textContent = "json";
    foot.append(raw);
    $sheetBody.append(foot);

    if (!$sheet.open) $sheet.showModal();
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

/**
 * @param {string} file
 * @returns {object} a stand-in so a failed recipe is visible rather than missing
 */
const unreadable = function (file) {
    console.warn(`Could not read recipe: ${file}`);
    return {
        file,
        url: RECIPE_DIR + file,
        name: file.replace(/\.json$/, "").replace(/-/g, " ")
    };
};

const buildRecipeIndex = async function () {
    const $index = document.querySelector("[data-recipe-index]");
    if (!$index) return;

    let manifest;
    try {
        const response = await fetch(RECIPE_INDEX);
        if (!response.ok) throw new Error(response.status);
        manifest = await response.json();
    } catch (error) {
        const message = document.createElement("p");
        message.className = "recipe-error";
        message.textContent = "The recipe index could not be loaded.";
        $index.append(message);
        return;
    }

    // fetched in parallel, but Promise.all keeps the manifest's order
    const entries = await Promise.all(manifest.map(async entry => {
        if (typeof entry !== "string") return entry;
        try {
            const response = await fetch(RECIPE_DIR + entry);
            if (!response.ok) throw new Error(response.status);
            return { ...await response.json(), file: entry };
        } catch (error) {
            return unreadable(entry);
        }
    }));

    entries.forEach(entry => $index.append(recipeCard(entry)));
};

document.querySelector("[data-recipe-close]")?.addEventListener("click", () => $sheet.close());

// click outside the sheet dismisses it
$sheet?.addEventListener("click", function (event) {
    if (event.target === $sheet) $sheet.close();
});

buildRecipeIndex();
