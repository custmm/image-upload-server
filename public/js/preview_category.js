// preview_category.js

import { fetchCategories, fetchSubcategories } from "./preview_api.js";
import { setCategory, setSubcategory, setPage } from "./preview_state.js";

export async function loadCategories(container, onCategoryClick) {

    const categories = await fetchCategories();

    container.innerHTML = "";

    categories.forEach((category, index) => {

        const btn = document.createElement("button");
        btn.textContent = category.name;

        if (index === 0) btn.classList.add("active");

        btn.onclick = () => {
            setCategory(category.id);
            setSubcategory(null);
            setPage(0);

            onCategoryClick(category.id, btn);
        };

        container.appendChild(btn);
    });
}

export async function loadSubcategories(container, categoryId, onSubClick) {

    const subs = await fetchSubcategories(categoryId);

    container.innerHTML = "";

    subs.forEach((sub, index) => {

        const btn = document.createElement("button");
        btn.textContent = sub.name;

        if (index === 0) {
            btn.classList.add("active");
            setSubcategory(sub.id);
        }

        btn.onclick = () => {
            setSubcategory(sub.id);
            setPage(0);

            onSubClick(categoryId, sub.id);
        };

        container.appendChild(btn);
    });
}