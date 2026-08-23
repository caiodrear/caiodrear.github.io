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
    #RECIPE SHEET

    Recipes live as JSON in /recipes. Ingredients are an object so each one
    stays on a single line; an empty value means "no quantity given".

        {
          "serves": 4,
          "ingredients": { "lentils": "300g", "salt": "" },
          "method": ["Place a large pot...", "Add the bay leaves..."]
        }

    Ingredient groups that need their own heading use "sections" instead:

        {
          "serves": 4,
          "sections": [
            { "title": "marinade", "ingredients": { ... } },
            { "title": "gravy",    "ingredients": { ... } }
          ]
        }
\* -------------------------------------- */

/**
 * Flattens either shape into one list of headed ingredient groups.
 *
 * @param {object} recipe parsed contents of a recipe .json
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
 * @param {{title: string, flag: string, href: string}} recipe
 */
const openRecipe = async function (recipe) {
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
    eyebrow.textContent = "receipt";
    head.append(eyebrow);

    const title = document.createElement("h2");
    title.textContent = recipe.title;
    head.append(title);

    if (!$sheet.open) $sheet.showModal();

    let data;
    try {
        const response = await fetch(recipe.href);
        if (!response.ok) throw new Error(response.status);
        data = await response.json();
    } catch (error) {
        const message = document.createElement("p");
        message.className = "recipe-error";
        message.textContent = "This receipt could not be read. ";
        const link = document.createElement("a");
        link.href = recipe.href;
        link.target = "_blank";
        link.rel = "noopener";
        link.style.display = "inline";
        link.textContent = "Open the file";
        message.append(link);
        $sheetBody.append(message);
        return;
    }

    const serves = data.serves;

    if (serves) {
        const servesEl = document.createElement("p");
        servesEl.className = "serves";
        servesEl.textContent = `serves ${serves}`;
        head.append(servesEl);
    }

    ingredientGroups(data).forEach(group => {
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

    if (Array.isArray(data.method) && data.method.length) {
        const heading = document.createElement("h3");
        heading.className = "recipe-section-title";
        heading.textContent = "method";
        $sheetBody.append(heading);

        const steps = document.createElement("ol");
        steps.className = "method-list";
        data.method.forEach(step => {
            const li = document.createElement("li");
            li.textContent = step;
            steps.append(li);
        });
        $sheetBody.append(steps);
    }

    const foot = document.createElement("footer");
    foot.className = "recipe-foot";
    const raw = document.createElement("a");
    raw.href = recipe.href;
    raw.target = "_blank";
    raw.rel = "noopener";
    raw.textContent = "json";
    foot.append(raw);
    $sheetBody.append(foot);
};

document.querySelectorAll(".recipes-tab .card").forEach(card => {
    const link = card.querySelector("a[href]");
    if (!link) return;

    const href = link.getAttribute("href");

    // Recipes hosted elsewhere keep their outbound link, and say so.
    if (!href.endsWith(".json")) {
        card.classList.add("external");
        return;
    }

    link.addEventListener("click", function (event) {
        event.preventDefault();
        openRecipe({
            href,
            title: card.querySelector(".card-title").textContent.trim(),
            flag: card.querySelector(".flag")?.textContent.trim() ?? ""
        });
    });
});

document.querySelector("[data-recipe-close]")?.addEventListener("click", () => $sheet.close());

// click outside the sheet dismisses it
$sheet?.addEventListener("click", function (event) {
    if (event.target === $sheet) $sheet.close();
});
