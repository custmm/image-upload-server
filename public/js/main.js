// 1. 모듈 가져오기
import * as Gallery from './gallery-module.js';

// 2. 전역 변수 선언
let loaderInterval = null;
let loaderStep = 1;

// --- [UI 공통 함수] ---

// Preview 페이지 안내 팝업
function initPreviewGuide() {
    const guidePopup = document.getElementById("preview-guide-popup");
    const closeBtn = document.getElementById("close-guide-btn");
    if (guidePopup) {
        guidePopup.style.display = "flex";
        document.body.style.overflow = "hidden";
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                guidePopup.style.opacity = "0";
                guidePopup.style.transition = "opacity 0.3s ease";
                setTimeout(() => {
                    guidePopup.style.display = "none";
                    document.body.style.overflow = "auto";
                }, 300);
            });
        }
    }
}

// 테마 설정 로직
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

// 로딩 표시기 (전역)
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

// --- [전역 등록 함수] ---
window.toggleTheme = () => {
    const isDark = document.body.classList.contains("dark-mode");
    setTheme(isDark ? "light-mode" : "dark-mode");
};

window.toggleSidebar = (event) => {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
        sidebar.classList.toggle("open");
        console.log("사이드바 클래스:", sidebar.className); // F12 콘솔에서 확인용
    }
};

// 1. 사이드바 서브메뉴(게시판, 부가기능) 토글
window.toggleMenu = (targetId) => {
    const subMenu = document.getElementById(targetId);
    if (subMenu) {
        // sub-menu가 열려있으면 닫고, 닫혀있으면 여는 class 토글
        subMenu.classList.toggle("active");

        //다른 서브메뉴는 자동으로 닫고 싶다면 아래 주석 해제

        document.querySelectorAll('.sub-menu').forEach(menu => {
            if (menu.id !== targetId) menu.classList.remove('active');
        });
    }
};

// 2. 카테고리 클릭 시 이동 로직
window.goCategory = async (categoryName) => {
    console.log(`${categoryName} 카테고리 로드 시도`);
    if (Gallery.loadPage) {
        Gallery.setPage(0);
        await Gallery.loadPage(categoryName);

        // (선택) 카테고리 선택 후 사이드바를 자동으로 닫고 싶을 때
        const sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.classList.remove("open");
    }
};

window.closePreviewPopup = (type) => {
    const map = {
        info: { overlay: "previewOverlayInfo", frame: "previewFrameInfo" },
        icon: { overlay: "previewOverlayIcon", frame: "previewFrameIcon" }
    };
    const target = map[type];
    if (target) {
        const frame = document.getElementById(target.frame);
        const overlay = document.getElementById(target.overlay);
        if (frame) frame.src = "";
        if (overlay) overlay.style.display = "none";
    }
};

// --- [초기화 및 이벤트 바인딩] ---

document.addEventListener("DOMContentLoaded", async () => {
    applySavedTheme();
    initPreviewGuide();

    // --- [사이드바 내부 요소들에 대한 이벤트 위임 연결] ---
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
        sidebar.addEventListener("click", (e) => {
            // 게시판/부가기능 버튼 클릭 시 (data-target 속성 활용)
            if (e.target.classList.contains("menu-title")) {
                const targetId = e.target.getAttribute("data-target");
                if (targetId) window.toggleMenu(targetId);
            }

            // 서브메뉴 내 카테고리 링크 클릭 시 (data-cat 속성 활용)
            if (e.target.classList.contains("cat-link")) {
                e.preventDefault();
                const catName = e.target.getAttribute("data-cat");
                window.goCategory(catName);
            }
        });
    }

    // --- [사이드바 열기 버튼] ---
    const sidebarBtn = document.getElementById("sidebarToggleBtn");
    if (sidebarBtn) {
        // 기존 리스너가 중복될 수 있으므로 정리 후 다시 등록
        sidebarBtn.onclick = null;
        sidebarBtn.addEventListener("click", (e) => {
            console.log("사이드바 버튼 클릭됨 (JS 리스너)");
            window.toggleSidebar(e);
        });
    }

    // 4. 테마 토글 버튼 리스너 (기존 코드 유지)
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        themeToggle.addEventListener("change", () => {
            const newMode = themeToggle.checked ? "dark-mode" : "light-mode";
            setTheme(newMode);
        });
    }
    // ----------------------------------------------

    // 1. 설정 팝업 제어
    const settingBtn = document.getElementById("settingBtn");
    const settingPopup = document.getElementById("settingPopup");
    if (settingBtn && settingPopup) {
        settingBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            settingPopup.classList.toggle("active");
        });
        settingPopup.addEventListener("click", (e) => {
            if (e.target === settingPopup) settingPopup.classList.remove("active");
        });
    }

    // 2. 데이터 초기 로드 (중복 제거 버전)
    if (Gallery.loadCategories) {
        await Gallery.loadCategories();
        // initializeCategorySelection이 내부적으로 loadPage를 호출하므로 여기서 한 번만 실행
        await Gallery.initializeCategorySelection();
    }

    // 3. 모드 전환 버튼 이벤트
    const imageModeBtn = document.getElementById("preview-image-mode");
    const textModeBtn = document.getElementById("preview-text-mode");
    const galleryEl = document.getElementById("imageGallery");

    if (imageModeBtn && textModeBtn) {
        imageModeBtn.addEventListener("click", async () => {
            // [중요] 갤러리 요소에서 스크롤 클래스 직접 제거 (안전장치)
            if (galleryEl) {
                galleryEl.classList.remove("text-view-scroll");
                galleryEl.scrollLeft = 0;
            }

            Gallery.setView("image"); // 여기서 위에서 수정한 setView가 실행됨
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
    
    // 5. 팝업 드래그 설정
    if (typeof makePopupDraggable === "function") {
        makePopupDraggable("previewOverlayInfo");
        makePopupDraggable("previewOverlayIcon");
    }
});

// 6. [중요] PC 휠 가로 스크롤 (이벤트 위임 - DOM 로딩 상관없이 작동)
document.addEventListener("wheel", (e) => {
    const galleryEl = document.getElementById("imageGallery");
    if (!galleryEl) return;

    // 마우스가 갤러리 영역 위에 있을 때만 변환
    if (e.target.closest("#imageGallery")) {
        const isTextView = galleryEl.classList.contains("text-view") || galleryEl.classList.contains("text-view-scroll");
        if (isTextView && e.deltaY !== 0) {
            e.preventDefault();
            galleryEl.scrollLeft += e.deltaY;
        }
    }
}, { passive: false });