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

    // [추가] 설정 팝업 제어 로직
    const settingBtn = document.getElementById("settingBtn");
    const settingPopup = document.getElementById("settingPopup");

    // 버튼과 팝업이 존재하는지 콘솔로 확인 (F12 눌러서 보임)
    console.log("Setting Button:", settingBtn);
    console.log("Setting Popup:", settingPopup);
    
if (settingBtn && settingPopup) {
        settingBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation(); // 이벤트가 딴 데로 안 튀게 막음
            settingPopup.classList.toggle("active");
            console.log("Popup class list:", settingPopup.classList);
        });

        // 팝업 내부 클릭 시 닫히는 거 방지
        settingPopup.addEventListener("click", function(e) {
            if (e.target === settingPopup) {
                settingPopup.classList.remove("active");
            }
        });
    }

    // 2. 갤러리 초기 데이터 로드 (순서가 중요!)
    if (Gallery.loadCategories) {
        // [수정] 카테고리를 먼저 완전히 가져온 뒤에 로직을 진행합니다.
        await Gallery.loadCategories(); 
        
        // [추가] 카테고리 로드 후, 만약 선택된 카테고리가 있다면 첫 페이지 로드
        if (Gallery.selectedCategory) {
            await Gallery.loadPage(Gallery.selectedCategory);
        } else {
            // 카테고리는 로드됐는데 선택된 게 없다면 초기화 함수 강제 호출
            await Gallery.initializeCategorySelection();
        }
    }

   // 3. 모드 전환 버튼 이벤트 연결
    const imageModeBtn = document.getElementById("preview-image-mode");
    const textModeBtn = document.getElementById("preview-text-mode");

    if (imageModeBtn && textModeBtn) {
        // 이미지 그리드 모드 버튼 클릭 시
        imageModeBtn.addEventListener("click", async () => {
            Gallery.setView("image"); // 갤러리 모듈의 뷰 모드를 "image"로 변경
            imageModeBtn.classList.add("active");
            textModeBtn.classList.remove("active");
            
            Gallery.setPage(0); // 페이지 번호 초기화
            // 현재 카테고리 데이터를 유지하며 다시 로드
            await Gallery.loadPage(Gallery.selectedCategory, Gallery.selectedSubcategory);
        });

        // 텍스트 좌우 스크롤 모드 버튼 클릭 시
        textModeBtn.addEventListener("click", async () => {
            Gallery.setView("text"); // 갤러리 모듈의 뷰 모드를 "text"로 변경
            textModeBtn.classList.add("active");
            imageModeBtn.classList.remove("active");
            
            Gallery.setPage(0); // 페이지 번호 초기화
            await Gallery.loadPage(Gallery.selectedCategory, Gallery.selectedSubcategory);
        });
    }

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