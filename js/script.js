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
    #BOOKS

    /assets/books.json, in shelf order. Every link is Goodreads, so only the
    id is stored. Ratings go in halves. A book with no "read" date is still
    being read, and is shown with no stars at all:

        { "title": "Culture and Anarchy", "cover": "culture.png",
          "goodreads": 12612203, "read": "24/8/2026", "rating": 1 }

        { "title": "Far from the Madding Crowd", "cover": "madding.png",
          "goodreads": 25310599, "read": "23/6/2026", "rating": 3.5 }

        { "title": "Wilhelm Meister's Apprenticeship", "cover": "meister.png",
          "goodreads": 31566320 }
\* -------------------------------------- */

const BOOKS_FILE = "./assets/books.json";
const BOOK_COVERS = "./assets/images/books/";
const BOOK_URL = "https://www.goodreads.com/book/show/";
const MAX_RATING = 5;

/**
 * Five icons: filled up to the rating, one half where the rating lands on a
 * half, the rest empty.
 *
 * @param {number} rating in halves, 0 to MAX_RATING
 * @returns {HTMLElement}
 */
const ratingStars = function (rating) {
    const wrapper = document.createElement("div");
    wrapper.className = "rating-wrapper";
    wrapper.setAttribute("aria-label", `${rating} out of ${MAX_RATING}`);

    for (let star = 1; star <= MAX_RATING; star++) {
        const icon = document.createElement("span");
        const half = star - 0.5 === rating;

        icon.className = star <= rating
            ? "material-symbols-outlined fill"
            : half
                ? "material-symbols-outlined half"
                : "material-symbols-outlined";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = half ? "star_rate_half" : "star_rate";
        wrapper.append(icon);
    }

    return wrapper;
};

/**
 * @param {object} book
 * @returns {HTMLElement}
 */
const bookCard = function (book) {
    const item = document.createElement("div");

    const card = document.createElement("div");
    card.className = "card books";
    item.append(card);

    const figure = document.createElement("figure");
    figure.className = "card-banner books img-holder books";
    card.append(figure);

    const cover = document.createElement("img");
    cover.className = "img-cover books";
    cover.src = BOOK_COVERS + book.cover;
    cover.alt = book.title;
    cover.loading = "lazy";
    figure.append(cover);

    const link = document.createElement("a");
    link.className = "state-layer";
    link.href = BOOK_URL + book.goodreads;
    link.target = "_blank";
    link.rel = "noopener";
    figure.append(link);

    const content = document.createElement("div");
    content.className = "card-content books";
    item.append(content);

    const title = document.createElement("h3");
    title.className = "title-medium card-title";
    title.textContent = book.title;
    content.append(title);

    const label = document.createElement("span");
    label.className = book.read ? "label-large" : "label-large reading";
    label.textContent = book.read ?? "Currently Reading";
    content.append(label);

    // a book still being read has no stars, not five empty ones
    if (typeof book.rating === "number") {
        content.append(ratingStars(book.rating));
    }

    return item;
};

/* -------------------------------------- *\
    #PROJECTS

    /assets/projects.json, in display order.

        { "title": "Gene", "category": "Machine Learning",
          "image": "project-3.png", "url": "https://..." }
\* -------------------------------------- */

const PROJECTS_FILE = "./assets/projects.json";
const PROJECT_IMAGES = "./assets/images/projects/";

/**
 * @param {object} project
 * @returns {HTMLElement}
 */
const projectCard = function (project) {
    const card = document.createElement("div");
    card.className = "card";

    const figure = document.createElement("figure");
    figure.className = "card-banner img-holder";
    figure.style.setProperty("--width", "334");
    figure.style.setProperty("--height", "180");
    card.append(figure);

    const image = document.createElement("img");
    image.className = "img-cover";
    image.src = PROJECT_IMAGES + project.image;
    image.alt = project.title;
    image.width = 334;
    image.height = 180;
    image.loading = "lazy";
    figure.append(image);

    const content = document.createElement("div");
    content.className = "card-content";
    card.append(content);

    const category = document.createElement("span");
    category.className = "label-large";
    category.textContent = project.category;
    content.append(category);

    const title = document.createElement("h3");
    title.className = "title-large card-title";
    title.textContent = project.title;
    content.append(title);

    const link = document.createElement("a");
    link.className = "state-layer";
    link.href = project.url;
    if (project.url.startsWith("http")) {
        link.target = "_blank";
        link.rel = "noopener";
    }
    card.append(link);

    return card;
};

/**
 * Fills a list from a JSON file, leaving a message behind if it cannot be read.
 *
 * @param {string} selector attribute selector for the container
 * @param {string} file
 * @param {function} build turns one entry into an element
 * @param {string} failure text shown if the file cannot be read
 */
const buildList = async function (selector, file, build, failure) {
    const $list = document.querySelector(selector);
    if (!$list) return;

    const $loading = $list.parentElement.querySelector("[data-loading]");

    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(response.status);
        (await response.json()).forEach(entry => $list.append(build(entry)));
    } catch (error) {
        const message = document.createElement("p");
        message.className = "load-error";
        message.textContent = failure;
        $list.append(message);
    } finally {
        $loading?.remove();
    }
};

/* -------------------------------------- *\
    #RECIPES

    /assets/recipes.json lists every recipe in display order. It is the only
    thing the page needs to draw the index, so it is one request:

        { "name": "Lentils Stew",  "flag": "🇪🇸", "file": "lentils-stew.json" }
        { "name": "10-Minute Dal", "flag": "🇮🇳", "url": "https://..." }

    The body of each recipe sits in its own file under /assets/recipes/, and is
    only read when its sheet is opened. Name and flag are not repeated there, so
    there is one place to rename a recipe. A recipe taken from elsewhere carries
    a "source", which the foot of the sheet credits.

        {
          "serves": 4,
          "ingredients": {
            "fresh":    { "onion": "1x", "parsley": "25g" },
            "cupboard": { "lentils": "300g", "salt": "" }
          },
          "method": ["Place a large pot...", "Add the bay leaves..."]
        }

    The two shopping columns are drawn side by side, in the order written, and
    either may be left out. Ingredient groups that need their own heading use
    "sections" instead:

        "sections": [
          { "title": "marinade", "ingredients": { "fresh": { ... }, ... } },
          { "title": "gravy",    "ingredients": { "fresh": { ... }, ... } }
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

/** the shopping columns, in the order they are drawn */
const COLUMNS = ["fresh", "cupboard"];

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

/**
 * One column of the shopping list. A column with nothing in it is not drawn at
 * all, and a lone column then fills the width.
 *
 * @param {string} title fresh or cupboard
 * @param {object} ingredients name to quantity, quantity may be empty
 * @returns {HTMLElement|null}
 */
const ingredientColumn = function (title, ingredients) {
    const entries = Object.entries(ingredients ?? {});
    if (!entries.length) return null;

    const column = document.createElement("div");
    column.className = "ingredient-column";

    const heading = document.createElement("h4");
    heading.className = "ingredient-column-title";
    heading.textContent = title;
    column.append(heading);

    const list = document.createElement("div");
    list.className = "ingredient-list";
    column.append(list);

    entries.forEach(([name, qty]) => {
        const row = document.createElement("div");
        row.className = "ingredient";
        row.innerHTML =
            `<span class="name"></span><span class="leader"></span><span class="qty"></span>`;
        row.querySelector(".name").textContent = name;
        row.querySelector(".qty").textContent = qty || "—";
        list.append(row);
    });

    return column;
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
        message.className = "load-error";
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

        const columns = document.createElement("div");
        columns.className = "ingredient-columns";

        COLUMNS.forEach(name => {
            const column = ingredientColumn(name, group.ingredients[name]);
            if (column) columns.append(column);
        });

        $sheetBody.append(columns);
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

    // a recipe that is not mine says whose it is
    if (recipe.source) {
        const source = document.createElement("a");
        source.href = recipe.source;
        source.target = "_blank";
        source.rel = "noopener";
        source.textContent = "source";
        foot.append(source);
    }

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

    const $loading = $index.parentElement.querySelector("[data-loading]");

    let recipes;
    try {
        const response = await fetch(RECIPE_INDEX);
        if (!response.ok) throw new Error(response.status);
        recipes = await response.json();
    } catch (error) {
        const message = document.createElement("p");
        message.className = "load-error";
        message.textContent = "The recipes could not be loaded.";
        $index.append(message);
        return;
    } finally {
        $loading?.remove();
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
buildList("[data-book-list]", BOOKS_FILE, bookCard, "The books could not be loaded.");
buildList("[data-project-list]", PROJECTS_FILE, projectCard, "The projects could not be loaded.");
