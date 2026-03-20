// preview_category.js

import { fetchCategories, fetchSubcategories } from "./preview_api.js";
import { setCategory, setSubcategory, setPage } from "./preview_state.js";

export async function loadCategories(container, onCategoryClick) {

    const categories = await fetchCategories();

    container.innerHTML = "";

    categories.forEach((category, index) => {

        const btn = document.createElement("button");
        btn.className = "tab-btn";

        if (index === 0) btn.classList.add("active");

        // 🔥 아이콘 매핑 복구
        const iconMap = {
            "퍼즐": "puzzle",
            "보석비즈": "gem",
            "입체퍼즐": "box",
            "디폼블럭": "grid-3x3",
            "브릭피규어": "toy-brick"
        };

        const iconName = iconMap[category.name] || "folder";

        // 🔥 핵심: innerHTML로 복구
        btn.innerHTML = `
            ${category.name}
            <i data-lucide="${iconName}" class="tab-icon"></i>
        `;

        btn.onclick = () => {
            document.querySelectorAll(".tab-btn")
                .forEach(t => t.classList.remove("active"));

            btn.classList.add("active");

            setCategory(category.id);
            setSubcategory(null);
            setPage(0);

            onCategoryClick(category.id, btn);
        };

        container.appendChild(btn);
    });

    // 🔥 아이콘 다시 렌더링
    if (window.lucide) {
        lucide.createIcons();
    }
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