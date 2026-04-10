

// 여기에 checkOverlap 함수를 배치하세요
function checkOverlap(img) {
    const popup = document.getElementById("settingPopup");
    if (!popup || popup.style.display === "none") return;
    const toggleEl = popup.querySelector('.toggle-switch .slider_util');
    if (!img || !toggleEl) return;
    // ... (기존 checkOverlap 내용)
}

// 2. 루프 제어 함수 (전역 함수)
// 어디서든 호출할 수 있도록 함수 밖에 정의합니다.
function startOverlapCheckLoop(img) {
    stopOverlapCheckLoop();
    const loop = () => {
        if (typeof checkOverlap === "function") {
            checkOverlap(img);
        }
        animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);
}

function stopOverlapCheckLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// 3. 그 다음 기존 함수들 (showLoading, hideLoading 등...)
function showLoading() {
    const indicator = document.getElementById("loadingIndicator");
    const loader = document.getElementById("mainLoader");

    indicator.style.display = "flex";

    if (loaderInterval) {
        clearInterval(loaderInterval);
        loaderInterval = null;
    }

    loaderStep = 1;

    loaderInterval = setInterval(() => {
        loaderStep++;
        if (loaderStep > 4) loaderStep = 1;

        loader.className = "loader loader" + loaderStep;
    }, 500);
}

function hideLoading() {
    const indicator = document.getElementById("loadingIndicator");

    if (loaderInterval) {
        clearInterval(loaderInterval);
        loaderInterval = null;
    }

    indicator.style.opacity = "0"; // 서서히 투명

    setTimeout(() => {
        indicator.style.display = "none"; // 완전히 숨김
        indicator.style.opacity = "1";    // 다음 사용 위해 복구
    }, 300); // CSS transition 시간과 맞추기
}

// 4.표시기 상태 업데이트 함수
function updatePreviewVisibility() {
    const previewContainer = document.getElementById("previewImagesContainer");
    if (!previewContainer) return;

    // 초기화
    wasOverlapping = false;
    stopOverlapCheckLoop();

    let img = previewContainer.querySelector("img");

    // 이미지가 없으면 생성, 있으면 상태만 업데이트
    if (!img) {
        updatePreviewImage();
        return; // updatePreviewImage 내부에서 나머지를 처리함
    }

    // 상태 적용
    const previewState = localStorage.getItem("previewVisible");
    if (previewState === "hidden") {
        img.classList.add("preview-hidden");
    } else {
        img.classList.remove("preview-hidden"); // 이거 반드시 필요
    }
}

// 페이지 이동 함수 정의 (전역)
window.prevPage = async function () {
    if (page > 0) {
        page--;                           // 한 페이지 뒤로
        await loadPage(selectedCategory, selectedSubcategory);
    }
};

window.nextPage = async function () {
    if (!noMoreImages) {
        await loadPage(selectedCategory, selectedSubcategory);
    }
};

window.closePreviewPopup = function (type) {

    const map = {
        info: {
            overlay: document.getElementById("previewOverlayInfo"),
            frame: document.getElementById("previewFrameInfo")
        },
        icon: {
            overlay: document.getElementById("previewOverlayIcon"),
            frame: document.getElementById("previewFrameIcon")
        }
    };

    const target = map[type];
    if (!target || !target.overlay) return;

    target.frame.src = "";
    target.overlay.style.display = "none";
};

window.toggleSidebar = function (event) {
    event.stopPropagation(); // 클릭 전파 막기

    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    const isOpening = !sidebar.classList.contains("open");
    sidebar.classList.toggle("open");

    // 열 때만 서브메뉴 초기화
    if (isOpening) {
        document.querySelectorAll(".sub-menu").forEach(menu => {
            menu.classList.remove("open");
        });
    }
};

document.addEventListener("click", (e) => {
    const sidebar = document.getElementById("sidebar");
    const button = document.querySelector(".sidebar-toggle");

    if (!sidebar || !button) return;

    const isClickInside =
        sidebar.contains(e.target) || button.contains(e.target);

    if (!isClickInside) {
        sidebar.classList.remove("open");
    }
});

window.toggleMenu = function (menuId) {
    const menus = document.querySelectorAll('.sub-menu');

    menus.forEach(menu => {
        if (menu.id === menuId) {
            menu.classList.toggle('open');
        } else {
            menu.classList.remove('open');
        }
    });
};



function indicatorButton() {
    const showindicatorBtn = document.getElementById("show-indicate");
    const hideindicatorBtn = document.getElementById("hide-indicate");

    if (!showindicatorBtn || !hideindicatorBtn) return;

    // 기존 이벤트 제거 후 다시 등록
    showindicatorBtn.replaceWith(showindicatorBtn.cloneNode(true));
    hideindicatorBtn.replaceWith(hideindicatorBtn.cloneNode(true));

    const newShowBtn = document.getElementById("show-indicate");
    const newHideBtn = document.getElementById("hide-indicate");

    // 표시기 숨기기
    newHideBtn.addEventListener("click", async function () {
        localStorage.setItem("previewVisible", "hidden"); // 상태 저장
        updatePreviewVisibility();
        showPopupMessage("이미지 표시기가 제거되었습니다."); // 팝업 추가
    });

    // 표시기 나타내기
    newShowBtn.addEventListener("click", async function () {
        localStorage.setItem("previewVisible", "visible");
        updatePreviewVisibility();
        showPopupMessage("이미지 표시기가 나타났습니다."); // 팝업 추가
    });
}

// --- [이미지 생성 및 이벤트 바인딩] ---
function updatePreviewImage() {
    const previewContainer = document.getElementById("previewImagesContainer");
    if (!previewContainer) return;

    // 초기 상태 초기화
    wasOverlapping = false;
    stopOverlapCheckLoop(); // 기존 루프가 있다면 정지
    previewContainer.innerHTML = "";
    previewContainer.style.position = "relative";

    const totalPreviews = 8;
    const randomIndex = Math.floor(Math.random() * totalPreviews) + 1;
    const isModernized = localStorage.getItem("indicatorModernized") === "true";

    let selectedImage = isModernized
        ? `images/indicator/preview-gunff_${randomIndex}re.png`
        : `images/indicator/preview-gunff_${randomIndex}.png`;

    const img = document.createElement("img");
    img.src = selectedImage;
    img.alt = `Preview Image`;
    img.style.position = "absolute";
    img.style.cursor = "grab";
    img.style.left = "0px";
    img.style.top = "0px";

    let isCut = false;
    let isDragging = false;
    let dragMoved = false; // 드래그 여부 판별 (클릭 오작동 방지)
    let offsetX = 0;
    let offsetY = 0;

    // --- [공통 로직 함수화] ---

    // 1. 이미지 전환 함수
    const togglePreviewImage = () => {
        const suffix = isCut ? "_cut.png" : ".png";
        const base = isModernized ? `re${suffix}` : suffix;
        img.src = `images/indicator/preview-gunff_${randomIndex}${base}`;
        localStorage.setItem("selectedImage", img.src);
    };

    // 2. 드래그 시작 로직
    const startDrag = (clientX, clientY) => {
        isDragging = true;
        dragMoved = false; // 시작할 때는 이동하지 않은 상태
        const rect = img.getBoundingClientRect();
        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;
        img.style.cursor = "grabbing";
        startOverlapCheckLoop(img);
    };

    // 3. 드래그 이동 로직
    const moveDrag = (clientX, clientY) => {
        if (!isDragging) return;
        dragMoved = true; // 이동이 발생함
        const containerRect = previewContainer.getBoundingClientRect();
        img.style.left = `${clientX - containerRect.left - offsetX}px`;
        img.style.top = `${clientY - containerRect.top - offsetY}px`;
        checkOverlap(img); // 실시간 감지
    };

    // 4. 드래그 종료 로직
    const endDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        img.style.cursor = "grab";
        stopOverlapCheckLoop();
    };

    // --- [이벤트 바인딩] ---

    // 마우스 이벤트
    img.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return; // 좌클릭만 허용
        e.preventDefault();
        startDrag(e.clientX, e.clientY);
    });

    document.addEventListener("mousemove", (e) => moveDrag(e.clientX, e.clientY));
    document.addEventListener("mouseup", endDrag);

    // 터치 이벤트
    img.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY);
    }, { passive: false });

    document.addEventListener("touchmove", (e) => {
        const touch = e.touches[0];
        moveDrag(touch.clientX, touch.clientY);
    });

    document.addEventListener("touchend", endDrag);

    // 클릭 이벤트 (드래그하지 않았을 때만 실행되도록 보호)
    img.addEventListener("click", () => {
        if (!dragMoved) {
            togglePreviewImage();
        }
    });

    img.onerror = () => console.error(`이미지 로드 실패: ${img.src}`);

    previewContainer.appendChild(img);

    // 초기 가시성 설정
    if (localStorage.getItem("previewVisible") === "hidden") {
        img.classList.add("preview-hidden");
    }
    checkOverlap(img);
}

document.addEventListener("DOMContentLoaded", async () => {

    // 1. 필요한 요소 가져오기
    const themeToggle = document.getElementById("themeToggle");

    // 2. [초기화] 저장된 테마 불러와서 즉시 적용
    const savedTheme = localStorage.getItem("theme") || "light-mode";

    setTheme(savedTheme);

    // 3. [이벤트 연결] 체크박스(스위치) 클릭 시 테마 변경
    if (themeToggle) {
        // 기존의 onclick 속성 대신 addEventListener를 사용하여 보안(CSP) 에러를 방지합니다.
        themeToggle.addEventListener("change", () => {
            const newMode = themeToggle.checked ? "dark-mode" : "light-mode";
            setTheme(newMode);
        });
    }


    // 슬라이더 관련
    const sidebarToggle = document.querySelector(".sidebar-toggle");
    const opacitySlider = document.getElementById("opacitySlider");
    const opacityToggleBtn = document.getElementById("opacityToggleBtn");
    const opacityControl = document.getElementById("opacityControl");


    // 탭관련
    const categoryTabContainer = document.querySelector(".tab-design"); // 메인 카테고리 탭
    const tabDesign = document.querySelector(".tab-design");
    const subTabContainer = document.getElementById("subTabContainer"); // 서브 카테고리 탭
    const margeContainer = document.querySelector(".marge-container");

    // container관련
    const currentCategory = document.getElementById("currentCategory"); // 현재 카테고리 표시
    const imageGallery = document.getElementById("imageGallery"); // 이미지 갤러리
    const paginationContainer = document.getElementById("pagination-container");

    // 설명모드
    const isExplanMode = window.location.hash.includes("explan");
    const welcomeEl = document.getElementById("welcomeMessage");

    // 검색버튼 관련
    const searchBtn = document.getElementById("sidebarSearchBtn");
    const searchInput = document.getElementById("sidebarSearchInput");

    const closeBtn = document.querySelector(".preview-close");
    const previewLink = document.getElementById("previewLink");
    const iconLink = document.getElementById("iconlink");
    const etcLink = document.getElementById("etcLink");
    const contactLink = document.getElementById("contactLink");
    const historyLink = document.getElementById("historyLink");
    const urlParams = new URLSearchParams(window.location.search);

    // 카테고리 한글 ↔ 영문 매핑 (필요한 경우 적용)
    const categoryMappings = {
        "puzzle": "퍼즐",
        "bizz": "보석비즈",
        "solidbodypuzzle": "3D퍼즐",
        "deforme": "디폼블럭",
        "brickfigure": "브릭피규어"
    };

    const iconMap = {
        "퍼즐": "puzzle",
        "보석비즈": "gem",
        "3D퍼즐": "box",
        "디폼블럭": "grid-3x3",
        "브릭피규어": "toy-brick"
    };

    const btn = document.getElementById("settingBtn");
    const popup = document.getElementById("settingPopup");


    // 상태값(카테고리관련)
    let categoryParam = urlParams.get("category");

    // 상태값(토글관련)
    let isVisible = true;

    // 상태값(기타)
    let noMoreImages = false;
    let isCut = false;

    // URL에서 받은 카테고리가 영문이면 한글로 변환
    if (categoryParam && categoryMappings[categoryParam]) {
        categoryParam = categoryMappings[categoryParam];
    }

    if (btn && popup) {
        btn.addEventListener("click", () => {
            popup.style.display = popup.style.display === "none" ? "block" : "none";
        });
    }

    document.querySelectorAll(".preview-close").forEach(btn => {
        btn.addEventListener("click", (e) => {

            const overlay = e.target.closest(".preview-overlay");
            const frame = overlay.querySelector("iframe");

            frame.src = "";
            overlay.style.display = "none";
        });
    });

    // 메뉴 사이드바 열기
    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", function () {
            const keyword = searchInput.value.trim();

            if (keyword) {
                window.location.href =
                    `search_post?q=${encodeURIComponent(keyword)}`;
            }
        });
    }

    function bindSidebarEvents() {
        const sidebar = document.getElementById("sidebar");
        const menubar = document.querySelector(".menubar-container");

        document.querySelectorAll("#sidebar a").forEach(link => {
            link.addEventListener("click", () => {

                sidebar.classList.remove("open");
                menubar.classList.remove("hidden");
            });
        });
    }

    if (welcomeEl) {
        // 슬라이더 조작
        if (opacitySlider) {
            opacitySlider.addEventListener("input", () => {
                const value = opacitySlider.value;

                // 대상 요소에 적용
                document.querySelector(".tab-design").style.opacity = value;
                document.querySelector(".marge-container").style.opacity = value;

                // 전역 공유: localStorage에 저장
                localStorage.setItem("sharedOpacity", value);
            });

            // 페이지 로드 시 localStorage 값 불러오기
            const savedOpacity = localStorage.getItem("sharedOpacity");
            if (savedOpacity) {
                opacitySlider.value = savedOpacity;
                document.querySelector(".tab-design").style.opacity = savedOpacity;
                document.querySelector(".marge-container").style.opacity = savedOpacity;
            }
        }

        // 토글 클릭 시 슬라이더 표시/숨김 처리
        if (opacityToggleBtn && opacityControl && opacitySlider) {
            const tabDesign = document.querySelector(".tab-design");
            const margeContainer = document.querySelector(".marge-container");

            opacityToggleBtn.addEventListener("click", () => {
                isVisible = !isVisible;

                // 슬라이더만 토글
                opacitySlider.style.display = isVisible ? "inline-flex" : "none";

                // 값 복원은 보일 때만
                if (isVisible) {
                    const defaultOpacity = "0.825";
                    opacitySlider.value = defaultOpacity;

                    tabDesign.style.opacity = defaultOpacity;
                    margeContainer.style.opacity = defaultOpacity;

                    localStorage.setItem("sharedOpacity", defaultOpacity);
                }
            });
        }

        // 가이드모드
        if (isExplanMode) {
            welcomeEl.addEventListener("click", (e) => {
                // a 태그 클릭이면 막지 않음
                e.preventDefault(); // 이때만 링크 이동 막기

                const activeTab = document.querySelector(".tab-btn.active");
                const tabName = activeTab?.textContent.trim() || "알 수 없음";

                // 서브카테고리는 subTabContainer 아래의 .sub-tab 요소
                const subTabs = subTabContainer.querySelectorAll(".sub-tab");
                const subTabNames = Array.from(subTabs).map(el => el.textContent.trim());

                const subText = subTabNames.length > 0
                    ? `해당 카테고리의 작품: [${subTabNames.join(", ")}]`
                    : `해당 카테고리의 작품이 없습니다.`;

                const message = "현재 선택된 탭은 [" + tabName + "] 입니다.\n" + subText;
                showPopupMessage(message);
            });
        }
    }

    indicatorButton();

    // 2) 카테고리 선택 시
    async function loadCategory(categoryId, tabButton, isPopState = false) {
        const newCategoryName = tabButton.textContent.trim();
        const currentParams = new URLSearchParams(window.location.search);
        const currentCategoryInUrl = currentParams.get("category");

        // 이제 이 조건문에서 isPopState를 정상적으로 인식합니다.
        if (!isExplanMode && !isPopState) {
            if (currentCategoryInUrl !== newCategoryName) {
                const newURL = `preview?category=${encodeURIComponent(newCategoryName)}`;
                history.pushState({ categoryName: newCategoryName }, "", newURL);
            }
        }

        selectedCategory = categoryId;
        selectedSubcategory = null;
        subTabContainer.innerHTML = "";

        document.querySelectorAll(".tab-btn.active").forEach(btn => btn.classList.remove("active"));
        tabButton.classList.add("active");

        if (currentCategory) {
            currentCategory.textContent = newCategoryName;
        }

        // 1) 서브카테고리 탭 채우기
        await loadSubcategories(categoryId);

        // 2) 페이지 초기화 후 첫 페이지 로드
        page = 0;
        noMoreImages = false;
        clearGallery();
        await loadPage(categoryId, selectedSubcategory);
    };

    // 4) 서브카테고리 클릭 시
    async function loadSubcategory(categoryId, subcategoryId, tabButton) {
        document.querySelectorAll(".sub-tab.active")
            .forEach(btn => btn.classList.remove("active"));
        tabButton.classList.add("active");

        selectedSubcategory = subcategoryId;
        // 페이지 초기화 & 첫 페이지 로드
        page = 0;
        noMoreImages = false;
        clearGallery();
        await loadPage(categoryId, selectedSubcategory);
    }


    /** 다크 모드 토글 기능 */
    window.toggleTheme = function () {
        const body = document.body;
        const isDarkMode = body.classList.toggle("dark-mode");
        const themeIcon = document.getElementById("themeIcon");

        if (isDarkMode) {
            localStorage.setItem("theme", "dark");
            themeToggle.checked = true;
            if (themeIcon) {
                themeIcon.style.backgroundImage = "url('../images/toggle/toggle_dark.svg')";
            }
        } else {
            localStorage.setItem("theme", "light");
            themeToggle.checked = false;
            if (themeIcon) {
                themeIcon.style.backgroundImage = "url('../images/toggle/toggle_light.svg')";
            }
        }
    }

    /** 페이지 로드 시 저장된 다크 모드 적용 */
    function applySavedTheme() {
        const savedTheme = localStorage.getItem("theme") || "light";
        const themeIcon = document.getElementById("themeIcon");
        const themeToggle = document.getElementById("themeToggle");

        if (savedTheme === "dark") {
            document.body.classList.add("dark-mode");
            if (themeToggle) themeToggle.checked = true;
            if (themeIcon) {
                themeIcon.style.backgroundImage = "url('../images/toggle/toggle_dark.svg')";
            }
        } else {
            document.body.classList.remove("dark-mode");
            if (themeToggle) themeToggle.checked = false;
            if (themeIcon) {
                themeIcon.style.backgroundImage = "url('../images/toggle/toggle_light.svg')";
            }
        }
    }

    // 테마 상태를 UI에 일괄 적용하는 함수

    // 전역에서 호출 가능하도록 window에 등록 (HTML onclick 대응)
    window.toggleTheme = function () {
        const isDark = document.body.classList.contains("dark-mode");
        const newMode = isDark ? "light-mode" : "dark-mode";
        setTheme(newMode);
    };

    // 서버에서 Indicator 상태 가져오기 함수 추가
    async function fetchIndicatorStatusAndApply() {
        try {
            const response = await fetch("/api/settings/indicator-status");

            if (!response.ok) {
                console.warn("⚠️ 서버 응답 실패, 기본값 유지");
                return;
            }

            const data = await response.json();

            // 🔥 visible 처리 (서버 우선, 최초 1회만 적용)
            const localVisible = localStorage.getItem('previewVisible');

            if (localVisible === null) {
                localStorage.setItem(
                    'previewVisible',
                    data.visible ? 'visible' : 'hidden'
                );
            }

            // 🔥 modernized 처리 (로컬 우선)
            const localModernized = localStorage.getItem('indicatorModernized');

            const isModernized = localModernized !== null
                ? localModernized === "true"
                : data.modernized;

            localStorage.setItem(
                'indicatorModernized',
                isModernized ? 'true' : 'false'
            );

            // 🔥 상태 반영
            if (typeof updatePreviewVisibility === "function") {
                updatePreviewVisibility();
            }

            applyModernizedImages(isModernized);

        } catch (error) {
            console.error("❌ Indicator 상태 가져오기 오류:", error);
        }
    }

    function applyModernizedImages(isModernized) {
        const imgs = document.querySelectorAll('#section3 .sorting-container img');
        imgs.forEach((img, index) => {
            // 예시 파일명 규칙: preview-gunff_1.png vs preview-gunff_1re.png
            const baseName = `images/indicator/preview-gunff_${index + 1}`;
            img.src = isModernized ? `${baseName}re.png` : `${baseName}.png`;
        });
    }

    // `localStorage` 변경 감지 (admin-dashboard에서 변경되면 자동 반영)
    window.addEventListener("storage", updatePreviewVisibility);


    // 뒤로 가기(←) 또는 앞으로 가기(→) 시 카테고리 변경 처리
    window.onpopstate = async function (event) {
        const urlParams = new URLSearchParams(window.location.search);
        let categoryParam = urlParams.get("category");

        // 1. URL에서 받은 카테고리가 영문이면 한글로 변환 (매핑 테이블 활용)
        if (categoryParam && categoryMappings[categoryParam]) {
            categoryParam = categoryMappings[categoryParam];
        }
        if (!categoryParam && categories.length > 0) {
            categoryParam = categories[0].name;
        }

        console.log(` 뒤로 가기/앞으로 가기 감지: ${categoryParam}`);

        // 2. 현재 메모리에 로드된 카테고리 데이터에서 매칭되는 ID 찾기
        const matchedCategory = categories.find(cat => cat.name.trim() === categoryParam?.trim());

        if (matchedCategory) {
            const categoryButton = [...document.querySelectorAll(".tab-btn")]
                .find(btn => btn.textContent.trim() === matchedCategory.name.trim());

            if (categoryButton) {
                // 중요: loadCategory를 직접 실행하되, 다시 pushState가 되지 않도록 
                // 위 1번에서 작성한 'URL 중복 체크' 로직이 이를 방어합니다.
                await loadCategory(matchedCategory.id, categoryButton);
            }
        }
    };

    // Intersection Observer 먼저 정의
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;

                // 🔥 이미지가 보일 때 부모 컨테이너에 애니메이션 클래스 추가
                const container = img.closest('.image-container');
                if (container) container.classList.add('is-visible');

                observer.unobserve(img);
            }
        });
    }, { rootMargin: "50px" });

    bindViewSwitchEvents();
    bindSidebarEvents();
    applySavedTheme();

    // ===============================
    // 🔥 팝업 드래그 기능 추가
    // ===============================

    loadCategories();

    // 초기 상태 반영
    window.addEventListener("storage", (e) => {
        if (e.key === "indicatorModernized") {
            // 현대화 상태가 바뀌면 새 이미지로 교체
            updatePreviewImage();
        }
        if (e.key === "previewVisible") {
            // 표시기 보임/숨김도 동기화
            updatePreviewVisibility();
        }
    });
    window.addEventListener("resize", adjustGalleryRadius);
});
