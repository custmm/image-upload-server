// 1. 모듈 가져오기
import * as Gallery from './gallery-module.js';

// 2. 전역 변수 선언
let loaderInterval = null;
let loaderStep = 1;

// --- [UI 공통 함수] ---
// --- [신규 드래그 로직 함수 정의] ---
function makeImageDraggable(imgId) {
    const img = document.getElementById(imgId);
    if (!img) return;

    let isDragging = false;
    let offsetX, offsetY;

    img.addEventListener("mousedown", (e) => {
        isDragging = true;
        img.style.cursor = "grabbing";
        offsetX = e.clientX - img.offsetLeft;
        offsetY = e.clientY - img.offsetTop;
        e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        img.style.left = `${e.clientX - offsetX}px`;
        img.style.top = `${e.clientY - offsetY}px`;
        img.style.position = "fixed"; // 위치 고정
    });

    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            img.style.cursor = "grab";
        }
    });
}

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

    // --- [팝업 닫기 이벤트 위임 (여러 개의 닫기 버튼 대응)] ---
    document.addEventListener("click", (e) => {
        // 방금 클릭한 요소가 .preview-close 버튼이거나, 그 버튼 안의 아이콘일 경우
        const closeBtn = e.target.closest(".preview-close");
        if (closeBtn) {
            e.preventDefault();
            // HTML에 적어둔 data-type 속성값 (예: "info", "icon")을 가져옴
            const type = closeBtn.getAttribute("data-type");

            // 타입이 있으면 해당 팝업만, 없으면 일단 info를 닫도록 시도
            window.closePreviewPopup(type || "info");
        }
    });

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

    if (typeof makeImageDraggable === "function") {
        makeImageDraggable("indicator-img");
    }

    if (typeof gsap !== 'undefined' && typeof Draggable !== 'undefined') {
        gsap.registerPlugin(Draggable);

        const indicator = document.getElementById("indicator-img");
        const trashContainer = document.querySelector(".fixed-trash-container");

        if (indicator && trashContainer) {
            Draggable.create(indicator, {
                type: "x,y",
                bounds: window,

                onDrag: function () {
                    // 1. 드래그 중에는 절대 안 열림 (미리 입 벌리지 않음)
                    trashContainer.classList.remove("open");
                },

                onRelease: function () {
                    const trashRect = trashContainer.getBoundingClientRect();
                    const indRect = indicator.getBoundingClientRect();

                    const tX = trashRect.left + trashRect.width / 2;
                    const tY = trashRect.top + trashRect.height / 2;
                    const iX = indRect.left + indRect.width / 2;
                    const iY = indRect.top + trashRect.height / 2;

                    const dist = Math.hypot(tX - iX, tY - iY);

                    if (dist < 100) {
                        // 이미지가 빨려 들어갈 위치 계산
                        const dropX = trashRect.left + (trashRect.width / 2) - (indRect.width / 2) - indRect.left + this.x;
                        const dropY = trashRect.top + (trashRect.height / 2) - (indRect.top / 2) - indRect.top + this.y;

                        const tl = gsap.timeline();

                        // [1단계] 빨려 들어가는 애니메이션
                        tl.to(indicator, {
                            duration: 0.4,
                            x: dropX,
                            y: dropY,
                            scale: 0,
                            opacity: 0,
                            rotation: 1080,
                            ease: "power4.in",
                            onStart: () => {
                                trashContainer.classList.add("open"); // 입 벌리기 (icon2)
                            }
                        });

                        // [2단계] 입 껌뻑거리기 (icon1 <-> icon2) 2회 반복
                        // 클래스를 뗐다 붙였다 하여 이미지를 교체합니다.
                        tl.to({}, { duration: 0.2, onStart: () => trashContainer.classList.remove("open") }) // 닫기
                            .to({}, { duration: 0.2, onStart: () => trashContainer.classList.add("open") })    // 열기
                            .to({}, { duration: 0.2, onStart: () => trashContainer.classList.remove("open") }) // 닫기
                            .to({}, { duration: 0.2, onStart: () => trashContainer.classList.add("open") })    // 열기
                            .to({}, {
                                duration: 0.2,
                                onStart: () => {
                                    trashContainer.classList.remove("open"); // 최종적으로 닫기
                                    trashContainer.classList.add("chewing"); // "작아지는 애니메이션" 모드 진입
                                }
                            });

                        // [3단계] 10초 동안 small0 ~ small11까지 순차 변경
                        const totalFrames = 12; // 0부터 11까지 총 12개
                        const totalDuration = 10; // 10초
                        const frameDuration = totalDuration / totalFrames;

                        for (let i = 0; i < totalFrames; i++) {
                            tl.to({}, {
                                duration: frameDuration,
                                onStart: () => {
                                    // 쓰레기통의 배경 이미지를 직접 변경 (CSS 변수 활용 권장)
                                    const smallIconUrl = `../images/trash/trash_icon_small${i}.svg`;
                                    // .main-icon 요소의 배경이나 src를 변경 (구조에 따라 선택)
                                    const mainIcon = trashContainer.querySelector(".main-icon");
                                    if (mainIcon) {
                                        mainIcon.style.backgroundImage = `url('${smallIconUrl}')`;
                                    }
                                }
                            });
                        }

                        // [최종] 초기화
                        tl.set({}, {
                            onComplete: () => {
                                indicator.style.display = "none";
                                trashContainer.classList.remove("chewing");
                                // 원래 이미지(icon1)로 복구 로직 필요 시 추가
                                const mainIcon = trashContainer.querySelector(".main-icon");
                                if (mainIcon) {
                                    mainIcon.style.backgroundImage = `url('../images/trash/trash_icon1.svg')`;
                                }
                                gsap.set(indicator, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 });
                            }
                        });
                    }
                }
            });
        }
    }

    // --- [링크 팝업창으로 띄우기 로직] ---
    // 1. 해당 링크(a 태그)들을 모두 찾습니다.
    const popupLinks = document.querySelectorAll('a[href*="preview_popup"], a[href*="etc_util"], a[href*="online_contact"]');

    // 2. 팝업을 띄울 오버레이와 아이프레임 요소를 찾습니다.
    const popupOverlay = document.getElementById("previewOverlayInfo");
    const popupFrame = document.getElementById("previewFrameInfo");

    // 3. 찾은 링크들에 각각 클릭 이벤트를 달아줍니다.
    popupLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault(); // 🛑 기본 동작(새 창 열기 또는 페이지 이동) 막기

            if (popupOverlay && popupFrame) {
                // a 태그에 적힌 href 경로를 가져와서 iframe의 src에 꽂아줍니다.
                const targetUrl = link.getAttribute("href");
                popupFrame.src = targetUrl;

                // 팝업 화면에 표시 (기존 display none -> flex로 변경)
                popupOverlay.style.display = "flex";
            }
        });
    });

});

// 6. [중요] PC 휠 가로 스크롤 (이벤트 위임 - DOM 로딩 상관없이 작동)
document.addEventListener("wheel", (e) => {
    // 💡 여기서 imageGallery 요소를 직접 찾도록 한 줄을 추가합니다!
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