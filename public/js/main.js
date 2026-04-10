// 1. 모듈 가져오기 (가장 중요)
import * as Gallery from './gallery-module.js';

// 2. 전역 변수 (UI 제어용)
let loaderInterval = null;
let loaderStep = 1;
let animationFrameId = null;
let wasOverlapping = false;

// [함수] 테마 설정
function setTheme(mode) {
    const isDark = mode === "dark-mode" || mode === "dark";
    const actualMode = isDark ? "dark-mode" : "light-mode";
    const themeIcon = document.getElementById("themeIcon");
    const themeToggle = document.getElementById("themeToggle");

    document.body.classList.remove("light-mode", "dark-mode");
    document.body.classList.add(actualMode);

    if (themeToggle) themeToggle.checked = isDark;
    if (themeIcon) {
        const iconName = isDark ? "toggle_dark.svg" : "toggle_light.svg";
        themeIcon.style.backgroundImage = `url('../images/toggle/${iconName}')`;
    }
    localStorage.setItem("theme", actualMode);
}

// [함수] 테마 초기 불러오기
function applySavedTheme() {
    const savedTheme = localStorage.getItem("theme") || "light-mode";
    setTheme(savedTheme);
}

// [함수] 로딩 표시기 제어
function showLoading() {
    const indicator = document.getElementById("loadingIndicator");
    const loader = document.getElementById("mainLoader");
    if (!indicator || !loader) return;

    indicator.style.display = "flex";
    if (loaderInterval) clearInterval(loaderInterval);

    loaderInterval = setInterval(() => {
        loaderStep = (loaderStep >= 4) ? 1 : loaderStep + 1;
        loader.className = "loader loader" + loaderStep;
    }, 500);
}

function hideLoading() {
    const indicator = document.getElementById("loadingIndicator");
    if (loaderInterval) clearInterval(loaderInterval);
    if (!indicator) return;

    indicator.style.opacity = "0";
    setTimeout(() => {
        indicator.style.display = "none";
        indicator.style.opacity = "1";
    }, 300);
}

// [함수] 표시기 겹침 감지
function checkOverlap(img) {
    const popup = document.getElementById("settingPopup");
    if (!popup || popup.style.display === "none") return;
    const toggleEl = popup.querySelector('.toggle-switch .slider_util');
    if (!img || !toggleEl) return;
    // ... 기존 겹침 로직 ...
}

function startOverlapCheckLoop(img) {
    stopOverlapCheckLoop();
    const loop = () => {
        checkOverlap(img);
        animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);
}

function stopOverlapCheckLoop() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
}

// --- [윈도우 전역 함수: HTML onclick 대응] ---

window.toggleTheme = function () {
    const isDark = document.body.classList.contains("dark-mode");
    setTheme(isDark ? "light-mode" : "dark-mode");
};

window.toggleSidebar = function (event) {
    if (event) event.stopPropagation();
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.toggle("open");
};

window.toggleMenu = function (menuId) {
    const menus = document.querySelectorAll('.sub-menu');
    menus.forEach(menu => {
        if (menu.id === menuId) menu.classList.toggle('open');
        else menu.classList.remove('open');
    });
};

window.closePreviewPopup = function (type) {
    const map = {
        info: { overlay: "previewOverlayInfo", frame: "previewFrameInfo" },
        icon: { overlay: "previewOverlayIcon", frame: "previewFrameIcon" }
    };
    const target = map[type];
    if (target) {
        document.getElementById(target.frame).src = "";
        document.getElementById(target.overlay).style.display = "none";
    }
};

// 갤러리 페이지 이동 (모듈 호출)
window.prevPage = async () => {
    if (Gallery.page > 0) {
        Gallery.setPage(Gallery.page - 1);
        await Gallery.loadPage(Gallery.selectedCategory, Gallery.selectedSubcategory);
    }
};

window.nextPage = async () => {
    if (!Gallery.noMoreImages) {
        Gallery.setPage(Gallery.page + 1);
        await Gallery.loadPage(Gallery.selectedCategory, Gallery.selectedSubcategory);
    }
};

// --- [이벤트 설정 및 초기 실행] ---

function bindSidebarEvents() {
    document.querySelectorAll("#sidebar a").forEach(link => {
        link.addEventListener("click", () => {
            document.getElementById("sidebar").classList.remove("open");
        });
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    // 1. UI 기초 설정
    applySavedTheme();
    bindSidebarEvents();
    
    // 2. 갤러리 초기화 (Gallery 모듈 호출)
    if (Gallery.loadCategories) {
        await Gallery.loadCategories();
    }

    // 3. 표시기(Indicator) 초기 설정
    if (typeof updatePreviewVisibility === "function") {
        updatePreviewVisibility();
    }

    // 4. 드래그/팝업 설정 (기존 preview.js 하단 로직)
    if (typeof makePopupDraggable === "function") {
        makePopupDraggable("previewOverlayInfo");
        makePopupDraggable("previewOverlayIcon");
    }

    // 5. 인터벌 설정
    setInterval(async () => {
        if (typeof fetchIndicatorStatusAndApply === "function") {
            await fetchIndicatorStatusAndApply();
        }
    }, 5000);
});

// 외부 스토리지 동기화
window.addEventListener("storage", (e) => {
    if (e.key === "previewVisible" && typeof updatePreviewVisibility === "function") {
        updatePreviewVisibility();
    }
});