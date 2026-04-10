import * as Gallery from './gallery-module.js';

// 전역 변수들
let loaderInterval = null;
let loaderStep = 1;
let animationFrameId = null;
let wasOverlapping = false;

// [함수] 겹침 감지
function checkOverlap(img) {
    const popup = document.getElementById("settingPopup");
    if (!popup || popup.style.display === "none") return;
    const toggleEl = popup.querySelector('.toggle-switch .slider_util');
    if (!img || !toggleEl) return;
    // ... (기존 checkOverlap 상세 로직 복사)
}

// [함수] 루프 제어
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

// [함수] 로딩 표시기
function showLoading() {
    const indicator = document.getElementById("loadingIndicator");
    const loader = document.getElementById("mainLoader");
    indicator.style.display = "flex";
    loaderInterval = setInterval(() => {
        loaderStep = (loaderStep >= 4) ? 1 : loaderStep + 1;
        loader.className = "loader loader" + loaderStep;
    }, 500);
}

function hideLoading() {
    const indicator = document.getElementById("loadingIndicator");
    if (loaderInterval) clearInterval(loaderInterval);
    indicator.style.opacity = "0";
    setTimeout(() => {
        indicator.style.display = "none";
        indicator.style.opacity = "1";
    }, 300);
}

// [함수] 사이드바 제어
window.toggleSidebar = function (event) {
    event.stopPropagation();
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.toggle("open");
};

window.toggleMenu = function (menuId) {
    document.querySelectorAll('.sub-menu').forEach(menu => {
        menu.classList.toggle('open', menu.id === menuId);
    });
};

// [함수] 팝업 닫기
window.closePreviewPopup = function (type) {
    const map = {
        info: document.getElementById("previewOverlayInfo"),
        icon: document.getElementById("previewOverlayIcon")
    };
    if (map[type]) {
        map[type].querySelector("iframe").src = "";
        map[type].style.display = "none";
    }
};

// [함수] 데이터 연동 (Gallery 모듈 호출)
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

document.addEventListener("DOMContentLoaded", async () => {
    // 1. 테마 적용
    applySavedTheme();

    // 2. 갤러리 초기 데이터 로드 (모듈 호출)
    await Gallery.loadCategories();

    // 3. 표시기(Indicator) 초기화
    updatePreviewImage();
    await fetchIndicatorStatusAndApply();
    
    // 4. 드래그 기능 등 바인딩
    makePopupDraggable("previewOverlayInfo");
    makePopupDraggable("previewOverlayIcon");

    // 5. 실시간 상태 감지 인터벌
    setInterval(fetchIndicatorStatusAndApply, 5000);
    setInterval(updatePreviewImage, 30000);
});