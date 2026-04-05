// 1. 최상단: 전역 변수 선언들
let loaderInterval = null;
let loaderStep = 1;
let overlapTimer = null;
let wasOverlapping = false;
let animationFrameId = null;

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

window.goCategory = function (categoryName) {
    const buttons = document.querySelectorAll(".tab-btn");

    const targetBtn = [...buttons].find(
        btn => btn.textContent.trim() === categoryName.trim()
    );

    if (!targetBtn) {
        console.error(" 해당 카테고리 버튼을 찾을 수 없음:", categoryName);
        return;
    }

    targetBtn.click();

    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("open");

    window.scrollTo({ top: 0, behavior: "smooth" });
};

function showPopupMessage(msg) {
    const popup = document.createElement("div");
    popup.classList.add("popup-message");
    popup.innerHTML = msg.replace(/\n/g, "<br>");
    document.body.appendChild(popup);

    requestAnimationFrame(() => popup.style.opacity = "1");

    setTimeout(() => {
        popup.style.opacity = "0";
        setTimeout(() => popup.remove(), 300);
    }, 2000);
}

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

    const allowedCutIndices = [1, 2, 3, 4, 5, 8, 9, 11, 12];
    const totalPreviews = 12;
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
        if (!allowedCutIndices.includes(randomIndex)) return;
        isCut = !isCut;
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
        "solidbodypuzzle": "입체퍼즐",
        "deforme": "디폼블럭",
        "brickfigure": "브릭피규어"
    };

    const iconMap = {
        "퍼즐": "puzzle",
        "보석비즈": "gem",
        "입체퍼즐": "box",
        "디폼블럭": "grid-3x3",
        "브릭피규어": "toy-brick"
    };

    const btn = document.getElementById("settingBtn");
    const popup = document.getElementById("settingPopup");



    let isLoadingPage = false;

    // 상태값(이미지/텍스트모드관련)
    let currentView = "image";

    // 상태값(페이지 제네레이션관련)
    let page = 0;
    let limit = 20;

    // 상태값(카테고리관련)
    let categoryParam = urlParams.get("category");
    let selectedCategory = null;
    let selectedSubcategory = null;
    let categories = [];

    // 상태값(토글관련)
    let isVisible = true;

    // 상태값(기타)
    let noMoreImages = false;
    let isCut = false;

    // URL에서 받은 카테고리가 영문이면 한글로 변환
    if (categoryParam && categoryMappings[categoryParam]) {
        categoryParam = categoryMappings[categoryParam];
    }

    if (previewLink) {
        previewLink.addEventListener("click", (e) => {
            e.preventDefault(); // 새 창 / 페이지 이동 차단
            openPreviewPopup();
        });
    }

    if (iconLink) {
        iconLink.addEventListener("click", (e) => {
            e.preventDefault(); // 새 창 / 페이지 이동 차단
            openAiIconPopup();
        });
    }

    if (etcLink) {
        etcLink.addEventListener("click", (e) => {
            e.preventDefault(); // 새 창 / 페이지 이동 차단
            openEtcPopup();
        });
    }

    if (contactLink) {
        contactLink.addEventListener("click", (e) => {
            e.preventDefault(); // 새 창 / 페이지 이동 차단
            openContactPopup();
        });
    }

    if (historyLink) {
        historyLink.addEventListener("click", (e) => {
            e.preventDefault(); // 새 창 / 페이지 이동 차단
            openHistoryPopup();
        });
    }

    if (btn && popup) {
        btn.addEventListener("click", () => {
            popup.style.display = popup.style.display === "none" ? "block" : "none";
        });
    }

    function openPreviewPopup() {
        const overlay = document.getElementById("previewOverlayInfo");
        const frame = document.getElementById("previewFrameInfo");

        if (!overlay || !frame) return;

        frame.src = "preview_popup.html";
        overlay.style.display = "flex";
    }

    function openAiIconPopup() {
        const overlay = document.getElementById("previewOverlayIcon");
        const frame = document.getElementById("previewFrameIcon");

        if (!overlay || !frame) return;

        frame.src = "ai_icon.html";
        overlay.style.display = "flex";
    }

    function openEtcPopup() {
        const overlay = document.getElementById("previewOverlayIcon");
        const frame = document.getElementById("previewFrameIcon");

        if (!overlay || !frame) return;

        frame.src = "etc_util.html";
        overlay.style.display = "flex";

    }

    function openContactPopup() {
        const overlay = document.getElementById("previewOverlayIcon");
        const frame = document.getElementById("previewFrameIcon");

        if (!overlay || !frame) return;

        frame.src = "contact.html";
        overlay.style.display = "flex";

    }

    function openHistoryPopup() {
        const overlay = document.getElementById("previewOverlayIcon");
        const frame = document.getElementById("previewFrameIcon");

        if (!overlay || !frame) return;

        frame.src = "history.html";
        overlay.style.display = "flex";
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

    // 모드전환
    function bindViewSwitchEvents() {
        const imageBtn = document.getElementById("preview-image-mode");
        const textBtn = document.getElementById("preview-text-mode");
        const gallery = document.getElementById("imageGallery");

        imageBtn.addEventListener("click", async () => {
            currentView = "image";

            imageBtn.classList.add("active");
            textBtn.classList.remove("active");

            gallery.classList.remove("text-view");
            gallery.classList.add("image-view");

            page = 0;
            limit = 20; // 이미지뷰는 20개
            await loadPage(selectedCategory, selectedSubcategory);
        });

        textBtn.addEventListener("click", async () => {
            currentView = "text";

            textBtn.classList.add("active");
            imageBtn.classList.remove("active");

            gallery.classList.remove("image-view");
            gallery.classList.add("text-view");

            page = 0;
            limit = 10; // 텍스트뷰는 10개
            await loadPage(selectedCategory, selectedSubcategory);
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

    // 1) 카테고리 로드
    async function loadCategories() {
        if (!isExplanMode) {
            setTimeout(() => initializeCategorySelection(), 300);
        }
        try {
            const response = await fetch("/api/categories");
            if (!response.ok) throw new Error("카테고리를 가져오는 데 실패함");

            categories = await response.json();
            categories = categories.filter(category => category.name.toLowerCase() !== "uncategorized");

            clearCategoryTabs(); // 기존 카테고리 탭 삭제

            categories.forEach((category, index) => {
                const btn = document.createElement("button");
                btn.className = "tab-btn";

                if (index === 0) btn.classList.add("active");

                const iconName = iconMap[category.name] || "folder";

                btn.innerHTML = `
                    ${category.name}
                    <i data-lucide="${iconName}" class="tab-icon"></i>
                `;

                btn.onclick = () => {
                    document.querySelectorAll(".tab-btn")
                        .forEach(t => t.classList.remove("active"));

                    btn.classList.add("active");

                    loadCategory(category.id, btn);
                };
                categoryTabContainer.appendChild(btn);
            });
            lucide.createIcons(); // 아이콘 다시 렌더

            setTimeout(() => initializeCategorySelection(), 300);

            return categories;
        } catch (error) {
            console.error(" 카테고리를 불러오는 중 오류 발생:", error);
        }
    }
    await loadCategories(); // 카테고리 불러오기 실행

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

    // 3) 서브카테고리 로드
    async function loadSubcategories(categoryId) {
        try {
            const response = await fetch(`/api/categories/${categoryId}/subcategories`);
            if (!response.ok) throw new Error("서브카테고리를 가져오는 데 실패함");

            const subcategories = await response.json();
            subTabContainer.innerHTML = "";

            if (subcategories.length === 0) {
                console.log(" 서브카테고리가 없습니다. 기본 카테고리 이미지 로딩.");
                selectedSubcategory = null;
                return;
            }

            subcategories.forEach((sub, index) => {
                const btn = document.createElement("button");
                btn.className = "sub-tab";
                btn.textContent = sub.name;
                btn.onclick = () => loadSubcategory(categoryId, sub.id, btn);
                subTabContainer.appendChild(btn);
            });

            // 첫 번째 탭 자동 선택
            const firstBtn = subTabContainer.firstChild;
            firstBtn.classList.add("active");
            selectedSubcategory = subcategories[0].id;
        } catch (error) {
            console.error(" 서브카테고리를 불러오는 중 오류 발생:", error);
        }
    }

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

    // 5) 페이지별 이미지 로드
    async function loadPage(categoryId, subcategoryId = null) {
        if (isLoadingPage) return;
        isLoadingPage = true;

        // 1. 로딩 시작 (에일리언 로더 + 스켈레톤 UI)
        showLoading();
        clearGallery();

        // 갤러리 모드에 따른 클래스 정리 (상태 확실히 분리)
        imageGallery.classList.toggle("image-view", currentView === "image");
        imageGallery.classList.toggle("text-view", currentView === "text");

        // 스켈레톤 생성 (limit만큼 반복)
        for (let i = 0; i < limit; i++) {
            const skeleton = document.createElement("div");
            skeleton.className = (currentView === "image") ? "skeleton-image-card" : "skeleton-text-card";
            imageGallery.appendChild(skeleton);
        }

        const startTime = Date.now();

        try {
            const offset = page * limit;
            let url = `/api/files?offset=${offset}&limit=${limit}&category_id=${categoryId}`;
            if (subcategoryId) url += `&subcategory_id=${subcategoryId}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error("데이터 로드 실패");
            const { total, files: images } = await response.json();

            const totalPages = Math.ceil(total / limit);
            noMoreImages = images.length < limit;

            // 2. 데이터 수신 완료 - 스켈레톤 제거 후 실제 데이터 렌더링
            clearGallery();

            if (images.length === 0) {
                imageGallery.innerHTML = '<p class="no-data">표시할 컨텐츠가 없습니다.</p>';
            } else {
                images.forEach((image, index) => {
                    if (currentView === "image") {
                        // --- 이미지 뷰 (Grid) ---
                        const imgContainer = document.createElement("div");
                        imgContainer.className = "image-container appear-ani";
                        imgContainer.setAttribute("data-aos", "fade-right");
                        imgContainer.setAttribute("data-aos-delay", (index * 50).toString());

                        const img = document.createElement("img");
                        img.dataset.src = image.file_path;
                        observer.observe(img); // 지연 로딩 관찰 시작

                        img.onclick = () => {
                            if (!isExplanMode) window.location.href = `post?id=${image.id}`;
                        };

                        imgContainer.appendChild(img);
                        imageGallery.appendChild(imgContainer);

                    } else if (currentView === "text") {
                        // --- 텍스트 뷰 (가로 스크롤 카드) ---
                        const card = document.createElement("div");
                        card.className = "text-card-item appear-ani";
                        // 텍스트 모드일 때는 fade-up이 더 자연스럽습니다.
                        card.setAttribute("data-aos", "fade-up");
                        card.style.animationDelay = `${index * 50}ms`;

                        const hashtags = (image.text || "").match(/#([\w가-힣]+)/g) || [];
                        const tagsHtml = hashtags.slice(0, 2).map(tag => `<span class="text-hashtag">${tag}</span>`).join("");

                        card.innerHTML = `
                        <div class="card-img-container">
                            <img src="${image.file_path}" class="card-img" loading="lazy">
                        </div>
                        <div class="card-info">
                            <div class="card-title">${image.title || "제목 없음"}</div>
                            <div class="text-hashtags">${tagsHtml}</div>
                        </div>
                    `;

                        card.onclick = () => {
                            if (!isExplanMode) window.location.href = `post?id=${image.id}`;
                        };

                        imageGallery.appendChild(card);
                    }
                });
            }

            renderPagination(totalPages);
            adjustGalleryRadius();

        } catch (err) {
            console.error("❌ 로드 중 오류:", err);
            imageGallery.innerHTML = '<p class="error-msg">데이터를 불러오는 중 오류가 발생했습니다.</p>';
        } finally {
            // Render 서버 속도에 맞춘 최소 로딩 시간(0.5초) 보장
            const elapsed = Date.now() - startTime;
            if (elapsed < 500) {
                await new Promise(res => setTimeout(res, 500 - elapsed));
            }

            hideLoading();
            isLoadingPage = false;

            // AOS 애니메이션 갱신 (DOM이 완전히 그려진 후 실행)
            if (window.Aos) {
                setTimeout(() => {
                    Aos.refresh();
                }, 100);
            }
        }
    }

    // 6) Prev/번호/Next 렌더링
    function renderPagination(totalPages) {

        const infoBox = document.getElementById("pagination-info");
        const pag = document.getElementById("pagination-container");
        if (!pag || !infoBox) return;  // pagination 요소가 없으면 아무것도 안 함
        pag.innerHTML = "";
        infoBox.innerHTML = "";

        const info = document.createElement("span");
        info.textContent = ` ${page + 1} / ${totalPages} `;

        infoBox.appendChild(info);

        // ◀ Prev 버튼
        const prev = document.createElement("button");
        prev.classList.add("pagination-button");
        prev.textContent = "이전";                // 버튼 레이블 추가

        prev.onclick = () => {
            if (page <= 0) {
                showPopupMessage("첫 페이지입니다.");
                return;
            }
            page--;
            loadPage(selectedCategory, selectedSubcategory);
        };
        pag.appendChild(prev);

        // ▶ Next 버튼
        const next = document.createElement("button");
        next.classList.add("pagination-button");
        next.textContent = "다음";                // 버튼 레이블 추가

        next.onclick = () => {
            if ((page + 1) >= totalPages) {
                showPopupMessage("마지막 페이지입니다.");
                return;
            }
            page++;
            loadPage(selectedCategory, selectedSubcategory);
        };
        pag.appendChild(next);
    }

    /** 이미지 불러오기 (4x5 배열 적용) */
    async function loadImages(categoryId, subcategoryId = null) {
        try {
            let url = `/api/files?category_id=${categoryId}`;
            if (subcategoryId) {
                url += `&subcategory_id=${subcategoryId}`;
            }

            console.log("📌 이미지 요청 URL:", url);

            const response = await fetch(url);
            if (!response.ok) {
                const errorMessage = await response.json();
                throw new Error(errorMessage.error || "이미지를 가져오는 데 실패함");
            }

            const images = await response.json();
            console.log(" 서버 응답:", images);

            clearGallery(); // 기존 이미지 삭제 (innerHTML = "" 대신 사용)

            if (!Array.isArray(images) || images.length === 0) {
                imageGallery.classList.remove("grid-layout");
                imageGallery.classList.add("flex-center");

                const noImageMessage = document.createElement("div");
                noImageMessage.classList.add("no-image-message");
                noImageMessage.innerHTML = " 해당 카테고리에 이미지가 없습니다.";
                imageGallery.appendChild(noImageMessage);
                return;
            }

            imageGallery.classList.remove("flex-center");
            imageGallery.classList.add("grid-layout");

            images.forEach((image, index) => {
                if (currentView === "image") {
                    const imgContainer = document.createElement("div");
                    imgContainer.classList.add("image-container", "appear-ani"); // 기본 클래스
                    imgContainer.style.animationDelay = `${index * 50}ms`; // 지연 시간만 JS로 조절

                    imgContainer.classList.add("image-container");

                    // --- 1. AOS 속성 추가 ---
                    imgContainer.setAttribute("data-aos", "fade-right");

                    // --- 2. 시간차(Stagger) 효과 추가 (선택사항) ---
                    // 0.1초(100ms) 간격으로 이미지가 순차적으로 나타납니다.
                    imgContainer.setAttribute("data-aos-delay", (index * 100).toString());

                    const placeholder = document.createElement("div");
                    placeholder.classList.add("image-placeholder");

                    const img = document.createElement("img");
                    img.dataset.src = `${image.file_path}`;
                    observer.observe(img); // Intersection Observer로 감지

                    const postURL = `post?id=${image.id}`;

                    img.onclick = () => {
                        if (isExplanMode) return; // 체험모드에서는 클릭 무시
                        console.log(` 이동할 URL: ${postURL}`);
                        window.location.href = postURL;
                    };

                    imgContainer.appendChild(placeholder);
                    imgContainer.appendChild(img);

                    imageGallery.appendChild(imgContainer);
                } else if (currentView === "text") {
                    // 1. 개별 카드 생성
                    const card = document.createElement("div");
                    card.classList.add("text-card-item", "appear-ani");
                    card.style.animationDelay = `${index * 50}ms`;
                    card.setAttribute("data-aos", "zoom-in");

                    // 🖼️ 2. 이미지 컨테이너(틀) 생성 및 이미지 추가
                    const imgContainer = document.createElement("div");
                    imgContainer.classList.add("card-img-container"); // 컨테이너 클래스 추가

                    const thumb = document.createElement("img");
                    thumb.src = image.file_path;
                    thumb.classList.add("card-img");

                    imgContainer.appendChild(thumb); // 이미지를 컨테이너 안에 쏙!

                    // 3. 하단 정보 컨테이너 생성
                    const info = document.createElement("div");
                    info.classList.add("card-info");

                    // 제목 + 화살표
                    const titleEl = document.createElement("div");
                    titleEl.classList.add("card-title");
                    titleEl.innerHTML = `${image.title || "제목 없음"}`;

                    // 해시태그 (게이밍 허브 하단 설명 느낌)
                    const hashtagContainer = document.createElement("div");
                    hashtagContainer.classList.add("text-hashtags");
                    const fullText = image.text || image.description?.text || "";
                    const hashtags = fullText.match(/#([\w가-힣]+)/g) || [];
                    hashtags.slice(0, 2).forEach(tag => {
                        const tagEl = document.createElement("span");
                        tagEl.classList.add("text-hashtag");
                        tagEl.textContent = tag;
                        hashtagContainer.appendChild(tagEl);
                    });

                    // 조립: info에 제목과 해시태그 넣고, card에 이미지와 info 넣기
                    info.appendChild(titleEl);
                    info.appendChild(hashtagContainer);

                    card.appendChild(thumb);
                    card.appendChild(info);

                    // 4. 클릭 이벤트 (상세 페이지 이동)
                    card.onclick = () => {
                        if (typeof isExplanMode !== 'undefined' && isExplanMode) return;
                        window.location.href = `post?id=${image.id}`;
                    };

                    // 🔥 핵심: imageGallery에 row나 track 없이 바로 추가!
                    imageGallery.appendChild(card);
                }
            });
            renderPagination(totalPages);
            adjustGalleryRadius();
        } catch (error) {
            console.error(" 이미지를 불러오는 중 오류 발생:", error);
            imageGallery.classList.remove("grid-layout");
            imageGallery.classList.add("flex-center");
            imageGallery.innerHTML = `<p class="no-image-message">오류: ${error.message}</p>`;
        }
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
                themeIcon.style.backgroundImage = "url('../images/toggle_dark.svg')";
            }
        } else {
            localStorage.setItem("theme", "light");
            themeToggle.checked = false;
            if (themeIcon) {
                themeIcon.style.backgroundImage = "url('../images/toggle_light.svg')";
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
                themeIcon.style.backgroundImage = "url('../images/toggle_dark.svg')";
            }
        } else {
            document.body.classList.remove("dark-mode");
            if (themeToggle) themeToggle.checked = false;
            if (themeIcon) {
                themeIcon.style.backgroundImage = "url('../images/toggle_light.svg')";
            }
        }
    }

    // 테마 상태를 UI에 일괄 적용하는 함수
    function setTheme(mode) {
        const isDark = mode === "dark-mode" || mode === "dark";
        const actualMode = isDark ? "dark-mode" : "light-mode";
        const themeIcon = document.getElementById("themeIcon");
        const themeToggle = document.getElementById("themeToggle");

        // 1. Body 클래스 교체
        document.body.classList.remove("light-mode", "dark-mode");
        document.body.classList.add(actualMode);

        // 2. 체크박스 상태 동기화
        if (themeToggle) themeToggle.checked = isDark;

        // 3. 배경 아이콘 교체
        if (themeIcon) {
            const iconName = isDark ? "toggle_dark.svg" : "toggle_light.svg";
            themeIcon.style.backgroundImage = `url('../images/${iconName}')`;
        }

        // 4. 로컬 스토리지 저장
        localStorage.setItem("theme", actualMode);
    }

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


    // 모든 카테고리 로드 후, URL 파라미터와 일치하는 카테고리 자동 선택
    async function initializeCategorySelection(retryCount = 5) {
        const urlParams = new URLSearchParams(window.location.search);
        let categoryParam = urlParams.get("category");

        // URL에서 받은 카테고리가 영문이면 한글로 변환 (여기서도 적용)
        if (categoryParam && categoryMappings[categoryParam]) {
            categoryParam = categoryMappings[categoryParam];
        }

        if (!categoryParam) {
            console.warn("⚠ URL에 카테고리가 없음. 기본값 설정 중...");
            if (categories.length > 0) {
                categoryParam = categories[0].name;
            } else {
                console.error("🚨 사용할 수 있는 카테고리가 없음!");
                return;
            }
        }

        console.log(`📌 URL에서 전달된 카테고리: ${categoryParam}`);

        // ✅ 현재 로드된 `categories` 배열에서 `category_name`을 기반으로 `category_id` 찾기
        const matchedCategory = categories.find(cat => cat.name.trim() === categoryParam.trim());

        if (!matchedCategory) {
            console.error(`⚠ 카테고리 (${categoryParam})에 해당하는 category_id를 찾을 수 없음`);
            return;
        }

        // 여기서 categoryId를 추출
        const categoryId = matchedCategory.id;

        // ✅ 카테고리 이름과 매칭되는 버튼을 찾아 클릭 실행
        const categoryButton = [...document.querySelectorAll(".tab-btn")]
            .find(btn => btn.textContent.trim() === categoryParam.trim());

        if (categoryButton) {
            console.log(`✅ 카테고리 자동 선택: ${categoryParam} (category_id: ${categoryId})`);
            await loadCategory(categoryId, categoryButton);
        }
    }

    function clearCategoryTabs() {
        while (categoryTabContainer.firstChild) {
            categoryTabContainer.removeChild(categoryTabContainer.firstChild);
        }
    }

    function adjustGalleryRadius() {
        const gallery = document.querySelector(".image-gallery");
        
        if (gallery) {
            gallery.addEventListener("wheel", (e) => {
                // 텍스트 뷰 모드일 때만 작동하도록 조건 설정
                if (gallery.classList.contains("text-view")) {
                    // 세로 스크롤(deltaY) 발생 시 가로 스크롤(scrollLeft)로 변환
                    if (e.deltaY !== 0) {
                        e.preventDefault(); // 페이지 전체가 아래로 내려가는 것 방지
                        gallery.scrollLeft += e.deltaY;
                    }
                }
            }, { passive: false });
        }

        const items = gallery.querySelectorAll(".image-container");
        if (items.length === 0) return;

        const firstTop = items[0].offsetTop;
        let multiRow = false;

        items.forEach(item => {
            if (item.offsetTop !== firstTop) {
                multiRow = true;
            }
        });

        if (multiRow) {
            gallery.classList.add("multi-row");
        } else {
            gallery.classList.remove("multi-row");
        }
    }

    function clearGallery() {
        while (imageGallery.firstChild) {
            imageGallery.removeChild(imageGallery.firstChild);
        }
    }

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

    function makePopupDraggable(overlayId) {

        const overlay = document.getElementById(overlayId);
        if (!overlay) return;

        const popup = overlay.querySelector(".preview-popup");
        if (!popup) return;

        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        // absolute로 강제
        popup.style.position = "absolute";

        // 처음 열릴 때 중앙 배치
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) return;
            centerPopup(popup);
        }, { once: true });

        function centerPopup(el) {
            const rect = el.getBoundingClientRect();
            el.style.left = (window.innerWidth - rect.width) / 2 + "px";
            el.style.top = (window.innerHeight - rect.height) / 2 + "px";
        }

        popup.addEventListener("mousedown", (e) => {
            isDragging = true;
            popup.style.cursor = "grabbing";
            offsetX = e.clientX - popup.offsetLeft;
            offsetY = e.clientY - popup.offsetTop;
            e.preventDefault();
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            popup.style.left = (e.clientX - offsetX) + "px";
            popup.style.top = (e.clientY - offsetY) + "px";
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
            popup.style.cursor = "grab";
        });
    }

    // 두 팝업에 적용
    makePopupDraggable("previewOverlayInfo");
    makePopupDraggable("previewOverlayIcon");

    loadCategories();
    await fetchIndicatorStatusAndApply();   // 초기 상태 반영
    setInterval(fetchIndicatorStatusAndApply, 5000); // 상태만 5초마다 갱신
    setInterval(updatePreviewImage, 30000);  // 이미지는 30초마다 갱신

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
