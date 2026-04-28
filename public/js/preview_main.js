// 1. 모듈 가져오기
import * as Gallery from './gallery-module.js';

// 2. 전역 변수 선언
let loaderInterval = null;
let loaderStep = 1;

// --- [UI 공통 함수] ---

// 1. 여기에 정의를 추가합니다.
window.updateLoadingImage = function () {
    const loader = document.getElementById("mainLoader");
    if (!loader) return;

    // 1~8번 중 랜덤 선택
    const randomIndex = Math.floor(Math.random() * 8) + 1;
    // 경로 설정 (파일명 규칙에 맞게 _re 또는 re 확인 필요)
    const imageUrl = `../images/indicator/preview-gunff_${randomIndex}re.png`;

    loader.style.backgroundImage = `url('${imageUrl}')`;
    loader.style.backgroundSize = "contain";
    loader.style.backgroundRepeat = "no-repeat";
    loader.style.backgroundPosition = "center";
};

// Preview 페이지 안내 팝업
function initPreviewGuide() {
    const guidePopup = document.getElementById("preview-guide-popup");
    const closeBtn = document.getElementById("close-guide-btn");
    const todayChk = document.getElementById("today-close-chk"); // 체크박스 참조

    if (!guidePopup) return;

    // 1. 저장된 날짜 확인 (오늘 날짜와 같으면 팝업 띄우지 않음)
    const hideUntil = localStorage.getItem("hideGuideUntil");
    const today = new Date().toDateString(); // 예: "Tue Apr 28 2026"

    if (hideUntil === today) {
        guidePopup.style.display = "none";
        return;
    }

    // 2. 팝업 표시 및 배경 스크롤 차단
    guidePopup.style.display = "flex";
    document.body.style.overflow = "hidden";

    // 3. 닫기 버튼 이벤트
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {

            // 체크박스에 체크되어 있다면 로컬 스토리지에 오늘 날짜 저장
            if (todayChk && todayChk.checked) {
                localStorage.setItem("hideGuideUntil", today);
            }

            // 닫기 애니메이션 처리
            guidePopup.style.opacity = "0";
            guidePopup.style.transition = "opacity 0.3s ease";
            setTimeout(() => {
                guidePopup.style.display = "none";
                document.body.style.overflow = "auto";
            }, 300);
        });
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

    // --- [테마 관련 이벤트 리스너 추가] ---
    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const backBtn = document.querySelector(".back-button");
    const popupCloseBtn = document.querySelector(".preview-close");
    const sidebar = document.getElementById("sidebar");    
    const sidebarSearchBtn = document.getElementById("sidebarSearchBtn");
    const sidebarSearchInput = document.getElementById("sidebarSearchInput");
    const sidebarBtn = document.getElementById("sidebarToggleBtn");
    const settingBtn = document.getElementById("settingBtn");
    const settingPopup = document.getElementById("settingPopup");
    const imageModeBtn = document.getElementById("preview-image-mode");
    const textModeBtn = document.getElementById("preview-text-mode");
    const galleryEl = document.getElementById("imageGallery");
    const showIndBtn = document.getElementById("show-indicate");
    const hideIndBtn = document.getElementById("hide-indicate");
    const indicatorImg = document.getElementById("indicator-img"); // HTML에 해당 ID의 <img>가 있어야 함
    const imagePath = "../images/indicator/preview-gunff_"; // 경로 확인 필요

    if (themeToggle) {
        themeToggle.addEventListener("change", () => {
            // 전역 window.toggleTheme 호출 대신 직접 로직 실행하거나 toggleTheme 실행
            window.toggleTheme();
        });
    }

    if (themeIcon) {
        themeIcon.addEventListener("click", () => {
            window.toggleTheme();
        });
    }

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            window.location.href = location.hash.includes('explan') ? 'click.html' : 'index.html';
        });
    }

    if (popupCloseBtn) {
        popupCloseBtn.addEventListener("click", () => {
            window.closePreviewPopup();
        });
    }

    if (sidebar) {
        sidebar.addEventListener("click", (e) => {
            const menuTitleBtn = e.target.closest(".menu-title");
            if (menuTitleBtn) {
                const targetId = menuTitleBtn.getAttribute("data-target") ||
                    (menuTitleBtn.innerText.includes("게시판") ? "board" : "etc");
                window.toggleMenu(targetId);
                return;
            }

            const catLink = e.target.closest("a");
            if (catLink && catLink.parentElement.parentElement.classList.contains("sub-menu")) {
                const href = catLink.getAttribute("href");

                // [수정] href가 '#'이거나 비어있는 경우에만 갤러리 로딩 실행
                if (href === "#" || !href) {
                    e.preventDefault();
                    const catName = catLink.innerText.trim();
                    window.goCategory(catName);
                }
                // 실제 .html 경로가 있는 '게임하기' 등은 브라우저가 그대로 이동하게 둠
            }
        });
    }

    if (sidebarSearchBtn && sidebarSearchInput) {
        const executeSearch = () => {
            const query = sidebarSearchInput.value.trim();
            if (query) {
                // 검색어와 함께 태그 결과 페이지로 이동
                location.href = `search?tag=${encodeURIComponent(query)}`;
            } else {
                alert("검색어를 입력해주세요.");
            }
        };

        // 돋보기 버튼 클릭 시
        sidebarSearchBtn.addEventListener("click", (e) => {
            e.preventDefault();
            executeSearch();
        });

        // 엔터키 입력 시
        sidebarSearchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                executeSearch();
            }
        });
    }

    if (sidebarBtn) {
        sidebarBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.toggleSidebar(e);
        });
    }

    if (settingBtn && settingPopup) {
        settingBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            settingPopup.classList.toggle("active");
        });

        // 팝업 외부 클릭 시 닫기
        window.addEventListener("click", (e) => {
            if (settingPopup.classList.contains("active") && !settingPopup.contains(e.target)) {
                settingPopup.classList.remove("active");
            }
        });
    }

    if (Gallery.loadCategories) {
        await Gallery.loadCategories();
        await Gallery.initializeCategorySelection();
    }

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

    if (showIndBtn && indicatorImg) {
        showIndBtn.addEventListener("click", (e) => {
            e.preventDefault();
            // 1~8 사이의 랜덤 숫자 생성
            const randomNum = Math.floor(Math.random() * 8) + 1;
            
            // 이미지 소스 설정 및 출력
            indicatorImg.src = `${imagePath}${randomNum}re.png`;
            indicatorImg.style.display = "block";
            
            // 부드럽게 나타나기 (CSS transition이 설정되어 있어야 함)
            setTimeout(() => {
                indicatorImg.style.opacity = "1";
            }, 10);
        });
    }

    if (hideIndBtn && indicatorImg) {
        hideIndBtn.addEventListener("click", (e) => {
            e.preventDefault();
            // 부드럽게 사라지기
            indicatorImg.style.opacity = "0";
            
            // 애니메이션 완료 후 display none (0.5초 기준)
            setTimeout(() => {
                indicatorImg.style.display = "none";
            }, 500);
        });
    }

    if (typeof makePopupDraggable === "function") {
        makePopupDraggable("previewOverlayInfo");
        makePopupDraggable("previewOverlayIcon");
    }
});

// 6. [중요] PC 휠 가로 스크롤 (이벤트 위임 - DOM 로딩 상관없이 작동)
document.addEventListener("wheel", (e) => {
    
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