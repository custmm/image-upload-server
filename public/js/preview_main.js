// preview_main.js

import {
    page,
    limit,
    selectedCategory,
    selectedSubcategory,
    setPage,
    setNoMoreImages
} from "./preview_state.js";

import { fetchImages } from "./preview_api.js";
import { renderImages, clearGallery } from "./preview_gallery.js";
import { loadCategories, loadSubcategories } from "./preview_category.js";

document.addEventListener("DOMContentLoaded", async () => {

    const categoryContainer = document.querySelector(".tab-design");
    const subContainer = document.getElementById("subTabContainer");
    const gallery = document.getElementById("imageGallery");

    const isExplanMode = window.location.hash.includes("explan");

    // ⭐ 핵심 함수 (페이지 로드)
    async function loadPage(categoryId, subcategoryId) {

        const offset = page * limit;

        const { total, files } = await fetchImages({
            offset,
            limit,
            categoryId,
            subcategoryId
        });

        setNoMoreImages(files.length < limit);

        clearGallery(gallery);
        renderImages(gallery, files, isExplanMode);
    }

    // ⭐ 카테고리 클릭 시
    async function handleCategoryClick(categoryId) {
        await loadSubcategories(subContainer, categoryId, handleSubClick);
        await loadPage(categoryId, null);
    }

    // ⭐ 서브카테고리 클릭 시
    async function handleSubClick(categoryId, subId) {
        await loadPage(categoryId, subId);
    }

    // ⭐ 초기 실행
    await loadCategories(categoryContainer, handleCategoryClick);
});