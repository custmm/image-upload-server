// 1. 모듈 가져오기
import * as Gallery from './gallery-module.js';

// 2. 전역 변수 선언 (UI 제어용)
let loaderInterval = null;
let loaderStep = 1;
let animationFrameId = null;
let wasOverlapping = false;

// --- [UI 공통 함수] ---

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
window.showLoading = function() {
    const indicator = document.getElementById("loadingIndicator");
    const loader = document.getElementById("mainLoader");
    if(!indicator || !loader) return;
    indicator.style.display = "flex";
    if (loaderInterval) clearInterval(loaderInterval);
    loaderInterval = setInterval(() => {
        loaderStep = (loaderStep >= 4) ? 1 : loaderStep + 1;
        loader.className = "loader loader" + loaderStep;
    }, 500);
};

window.hideLoading = function() {
    const indicator = document.getElementById("loadingIndicator");
    if (loaderInterval) clearInterval(loaderInterval);
    if(!indicator) return;
    indicator.style.opacity = "0";
    setTimeout(() => {
        indicator.style.display = "none";
        indicator.style.opacity = "1";
    }, 300);
};

// --- [전역 등록 함수: HTML onclick 대응] ---

window.toggleTheme = function() {
    const isDark = document.body.classList.contains("dark-mode");
    setTheme(isDark ? "light-mode" : "dark-mode");
};

window.toggleSidebar = function(event) {
    if (event) event.stopPropagation();
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.toggle("open");
};

window.closePreviewPopup = function(type) {
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