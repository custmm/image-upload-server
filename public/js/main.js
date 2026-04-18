// 1. 모듈 가져오기
import * as Gallery from './gallery-module.js';

// 2. 전역 변수 선언 (UI 제어용)
let loaderInterval = null;
let loaderStep = 1;
let animationFrameId = null;
let wasOverlapping = false;

// --- [UI 공통 함수] ---
// [추가] Preview 페이지 안내 팝업 제어 함수
function initPreviewGuide() {
    const guidePopup = document.getElementById("preview-guide-popup");
    const closeBtn = document.getElementById("close-guide-btn");

    if (guidePopup) {
        // 팝업 표시
        guidePopup.style.display = "flex";
        document.body.style.overflow = "hidden"; // 배경 스크롤 방지

        // 확인 버튼 클릭 시 닫기
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                guidePopup.style.opacity = "0";
                guidePopup.style.transition = "opacity 0.3s ease";

                setTimeout(() => {
                    guidePopup.style.display = "none";
                    document.body.style.overflow = "auto"; // 스크롤 복구
                }, 300);
            });
        }
    }
}

// 테마 설정
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

function applySavedTheme() {
    const savedTheme = localStorage.getItem("theme") || "light-mode";
    setTheme(savedTheme);
}

// 로딩 표시기
window.showLoading = function () {
    const indicator = document.getElementById("loadingIndicator");
    const loader = document.getElementById("mainLoader");
    if (!indicator || !loader) return;
    indicator.style.display = "flex";
    if (loaderInterval) clearInterval(loaderInterval);
    loaderInterval = setInterval(() => {
        loaderStep = (loaderStep >= 4) ? 1 : loaderStep + 1;
        loader.className = "loader loader" + loaderStep;
    }, 500);
};

window.hideLoading = function () {
    const indicator = document.getElementById("loadingIndicator");
    if (loaderInterval) clearInterval(loaderInterval);
    if (!indicator) return;
    indicator.style.opacity = "0";
    setTimeout(() => {
        indicator.style.display = "none";
        indicator.style.opacity = "1";
    }, 300);
};

// --- [전역 등록 함수: HTML onclick 대응] ---

window.toggleTheme = function () {
    const isDark = document.body.classList.contains("dark-mode");
    setTheme(isDark ? "light-mode" : "dark-mode");
};

window.toggleSidebar = function (event) {
    if (event) event.stopPropagation();
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.toggle("open");
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

// --- [초기화 및 이벤트 바인딩] ---

document.addEventListener("DOMContentLoaded", async () => {
    // 1. 기초 UI 설정
    applySavedTheme();
    initPreviewGuide();

    // [추가] 설정 팝업 제어 로직
    const settingBtn = document.getElementById("settingBtn");
    const settingPopup = document.getElementById("settingPopup");

    if (settingBtn && settingPopup) {
        settingBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation(); // 이벤트가 딴 데로 안 튀게 막음
            settingPopup.classList.toggle("active");
        });
        settingPopup.addEventListener("click", function (e) {
            if (e.target === settingPopup) settingPopup.classList.remove("active");
        });
    }

    // 2. 갤러리 초기 데이터 로드 (순서가 중요!)
    if (Gallery.loadCategories) {
        await Gallery.loadCategories();
        if (Gallery.selectedCategory) {
            await Gallery.loadPage(Gallery.selectedCategory);
        } else {
            await Gallery.initializeCategorySelection();
        }
    }

    // 3. 모드 전환 버튼 이벤트 연결
    const imageModeBtn = document.getElementById("preview-image-mode");
    const textModeBtn = document.getElementById("preview-text-mode");
    const galleryEl = document.getElementById("imageGallery");

    if (imageModeBtn && textModeBtn) {
        imageModeBtn.addEventListener("click", async () => {
            Gallery.setView("image");
            imageModeBtn.classList.add("active");
            textModeBtn.classList.remove("active");
            Gallery.setPage(0);
            await Gallery.loadPage(Gallery.selectedCategory, Gallery.selectedSubcategory);
        });

        textModeBtn.addEventListener("click", async () => {
            Gallery.setView("text");
            textModeBtn.classList.add("active");
            imageModeBtn.classList.remove("active");
            Gallery.setPage(0);
            await Gallery.loadPage(Gallery.selectedCategory, Gallery.selectedSubcategory);
            if (galleryEl) galleryEl.scrollLeft = 0;
        });
    }

    // 이벤트 위임 방식을 사용하여 갤러리가 새로 그려져도 작동하게 합니다.
    document.addEventListener("wheel", (e) => {
        const galleryEl = document.getElementById("imageGallery");
        if (!galleryEl) return;

        // 마우스 포인터가 갤러리 영역 위에 있는지 확인
        const isOverGallery = e.target.closest("#imageGallery");

        if (isOverGallery) {
            // 줄글 모드(text-view) 클래스가 있을 때만 실행
            if (galleryEl.classList.contains("text-view") || galleryEl.classList.contains("text-view-scroll")) {
                if (e.deltaY !== 0) {
                    // PC에서 해상도 상관없이 무조건 가로로 밀기
                    e.preventDefault();
                    galleryEl.scrollLeft += e.deltaY;
                }
            }
        }
    }, { passive: false });

    // 2. 테마 토글 버튼 리스너 (CSP 위반 방지)
    const themeToggle = document.getElementById("themeToggle");
    
if (themeToggle) {
    themeToggle.addEventListener("change", () => {
        const newMode = themeToggle.checked ? "dark-mode" : "light-mode";
        setTheme(newMode);
    });
}

// 3. 갤러리 초기 데이터 로드 (Gallery 모듈 호출)
// gallery-module.js 안에 loadCategories가 있어야 합니다.
if (Gallery.loadCategories) {
    await Gallery.loadCategories();
}

// 4. 기타 UI 바인딩 (드래그 등)
if (typeof makePopupDraggable === "function") {
    makePopupDraggable("previewOverlayInfo");
    makePopupDraggable("previewOverlayIcon");
}
});