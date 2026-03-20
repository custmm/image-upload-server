// preview_main.js
import {
    page,
    selectedCategory,
    selectedSubcategory,
    setPage,
    setNoMoreImages,
    setView,
    currentView
} from "./preview_state.js";
import { fetchImages } from "./preview_api.js";
import { renderImages, clearGallery } from "./preview_gallery.js";
import { loadCategories, loadSubcategories } from "./preview_category.js";

document.addEventListener("DOMContentLoaded", async () => {

    const categoryContainer = document.querySelector(".tab-design");
    const subContainer = document.getElementById("subTabContainer");
    const gallery = document.getElementById("imageGallery");
    const imageBtn = document.getElementById("preview-image-mode");
    const textBtn = document.getElementById("preview-text-mode");

    const isExplanMode = window.location.hash.includes("explan");

    // ⭐ 핵심 함수 (페이지 로드)
    async function loadPage(categoryId, subcategoryId) {

        const currentLimit = currentView === "image" ? 20 : 10;
        const offset = page * currentLimit;

        const { total, files } = await fetchImages({
            offset,
            limit: currentLimit,
            categoryId,
            subcategoryId
        });

        setNoMoreImages(files.length < currentLimit);

        clearGallery(gallery);
        renderImages(gallery, files, isExplanMode);
    }

    // ⭐ 카테고리 클릭 시
    async function handleCategoryClick(categoryId) {
        setPage(0);
        await loadSubcategories(subContainer, categoryId, handleSubClick);
        await loadPage(categoryId, null);
    }

    // ⭐ 서브카테고리 클릭 시
    async function handleSubClick(categoryId, subId) {
        setPage(0);
        await loadPage(categoryId, subId);
    }

    if (imageBtn && textBtn) {
        // 이미지 모드 버튼
        imageBtn.addEventListener("click", async () => {

            setView("image");
            setPage(0);

            imageBtn.classList.add("active");
            textBtn.classList.remove("active");

            gallery.classList.remove("text-view");
            gallery.classList.add("image-view");

            await loadPage(selectedCategory, selectedSubcategory);
        });

        // 텍스트 모드 버튼
        textBtn.addEventListener("click", async () => {

            setView("text");
            setPage(0);

            textBtn.classList.add("active");
            imageBtn.classList.remove("active");

            gallery.classList.remove("image-view");
            gallery.classList.add("text-view");

            await loadPage(selectedCategory, selectedSubcategory);
        });
    }


    // ⭐ 초기 실행
    await loadCategories(categoryContainer, handleCategoryClick);
});