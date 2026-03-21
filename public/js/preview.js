let loaderInterval = null;
let loaderStep = 1;
let overlapTimer = null;
let wasOverlapping = false;


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

window.toggleSidebar = function () {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    const isOpening = !sidebar.classList.contains("open");
    sidebar.classList.toggle("open");

    // 사이드바를 "열 때만" 서브메뉴 전부 닫기 (완전 초기화)
    if (isOpening) {
        document.querySelectorAll(".sub-menu").forEach(menu => {
            menu.classList.remove("open");
        });
    }
};

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

function checkOverlap(img) {
    const popup = document.getElementById("settingPopup");

    if (!popup || popup.style.display === "none") return;

    const toggleEl = popup.querySelector('.toggle-switch .slider_util');
    if (!img || !toggleEl) return;

    const imgRect = img.getBoundingClientRect();
    const toggleRect = toggleEl.getBoundingClientRect();

    const x_overlap = Math.max(0, Math.min(imgRect.right, toggleRect.right) - Math.max(imgRect.left, toggleRect.left));
    const y_overlap = Math.max(0, Math.min(imgRect.bottom, toggleRect.bottom) - Math.max(imgRect.top, toggleRect.top));
    const overlapArea = x_overlap * y_overlap;

    const toggleArea = toggleRect.width * toggleRect.height;
    const ratioToggle = overlapArea / toggleArea;

    if (ratioToggle >= 0.7 && !wasOverlapping) {
        overlapTimer = setTimeout(() => window.location.href = "killing_game.html", 10000);
    }

    if (ratioToggle < 0.7 && wasOverlapping) {
        clearTimeout(overlapTimer);
    }

    wasOverlapping = ratioToggle >= 0.7;
}

// 표시기 상태 업데이트 함수
function updatePreviewVisibility() {
    
    const previewContainer = document.getElementById("previewImagesContainer");

    if (!previewContainer) return;

    wasOverlapping = false;

    clearTimeout(overlapTimer);
    overlapTimer = null;

    previewContainer.style.position = "relative";

    let img = previewContainer.querySelector("img");

    // 🔥 없을 때만 생성
    if (!img) {
        updatePreviewImage();
        img = previewContainer.querySelector("img");
        if (!img) return;
    }

    // 🔥 상태 적용
    const previewState = localStorage.getItem("previewVisible");
    if (previewState === "hidden") {
        img.classList.add("preview-hidden");
    }
}

function updatePreviewImage() {
    const previewContainer = document.getElementById("previewImagesContainer");
    if (!previewContainer) return;

    wasOverlapping = false; // 이전 상태 추적
    clearTimeout(overlapTimer);
    overlapTimer = null;

    previewContainer.innerHTML = "";
    previewContainer.style.position = "relative";

    // _cut 버전을 지원하는 번호 배열
    let previewTimer = null;
    const allowedCutIndices = [1, 2, 3, 4, 5, 8, 9, 11, 12];
    const totalPreviews = 12;
    const randomIndex = Math.floor(Math.random() * totalPreviews) + 1;

    // ✅ 현대화 여부 확인
    const isModernized = localStorage.getItem("indicatorModernized") === "true";

    // ✅ 선택 이미지 경로 결정
    let selectedImage = isModernized
        ? `images/indicator/preview-gunff_${randomIndex}re.png`
        : `images/indicator/preview-gunff_${randomIndex}.png`;

    localStorage.setItem("selectedImage", selectedImage);

    const img = document.createElement("img");
    img.src = selectedImage;
    img.alt = `Preview Image`;
    img.style.position = "absolute";
    img.style.cursor = "grab";
    img.style.left = "0px";  // 초기 좌표 설정
    img.style.top = "0px";   // 초기 좌표 설정

    // 🔁 클릭/터치 시 이미지 전환 로직 함수화
    let isCut = false;

    function togglePreviewImage() {
        if (!allowedCutIndices.includes(randomIndex)) return;

        if (!isCut) {
            img.src = isModernized
                ? `images/indicator/preview-gunff_${randomIndex}re_cut.png`
                : `images/indicator/preview-gunff_${randomIndex}_cut.png`;
        } else {
            img.src = isModernized
                ? `images/indicator/preview-gunff_${randomIndex}re.png`
                : `images/indicator/preview-gunff_${randomIndex}.png`;
        }
        localStorage.setItem("selectedImage", img.src);
        isCut = !isCut;
    }

    img.addEventListener("click", togglePreviewImage);

    // 드래그 상태 추적
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    let animationFrameId = null;
    let touchMoved = false;

    function startOverlapCheckLoop(img) {
        function loop() {
            if (isDragging) {
                checkOverlap(img);
                animationFrameId = requestAnimationFrame(loop);
            }
        }
        animationFrameId = requestAnimationFrame(loop);
    }

    function stopOverlapCheckLoop() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    // 마우스 이벤트
    img.addEventListener("mousedown", (e) => {
        isDragging = true;
        const rect = img.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        img.style.cursor = "grabbing";
        e.preventDefault();
        startOverlapCheckLoop(img); // 겹침 감지 루프 시작
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const containerRect = previewContainer.getBoundingClientRect();
        let left = e.clientX - containerRect.left - offsetX;
        let top = e.clientY - containerRect.top - offsetY;
        img.style.left = left + "px";
        img.style.top = top + "px";
        checkOverlap(img); // 실시간 감지용 강제 호출 추가!
    });

    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            img.style.cursor = "grab";
            stopOverlapCheckLoop(); // 루프 멈추기
        }
    });

    // 터치 이벤트 추가
    img.addEventListener("touchstart", (e) => {
        isDragging = true;
        touchMoved = false;
        const touch = e.touches[0];
        const rect = img.getBoundingClientRect();
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;
        img.style.cursor = "grabbing";
        startOverlapCheckLoop(img);
        e.preventDefault();
    });

    document.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        touchMoved = true;
        const touch = e.touches[0];
        const containerRect = previewContainer.getBoundingClientRect();
        let left = touch.clientX - containerRect.left - offsetX;
        let top = touch.clientY - containerRect.top - offsetY;
        img.style.left = left + "px";
        img.style.top = top + "px";
        checkOverlap(img);
    });

    document.addEventListener("touchend", () => {
        if (isDragging) {
            isDragging = false;
            img.style.cursor = "grab";
            stopOverlapCheckLoop();

            togglePreviewImage();
        }
    });


    img.onerror = function () {
        console.error(`이미지 로드 실패: ${img.src}`);
    };

    previewContainer.appendChild(img);
    checkOverlap(img);
}

document.addEventListener("DOMContentLoaded", async () => {

    // 슬라이더 관련
    const sidebarToggle = document.querySelector(".sidebar-toggle");
    const opacitySlider = document.getElementById("opacitySlider");
    const opacityToggleBtn = document.getElementById("opacityToggleBtn");
    const opacityControl = document.getElementById("opacityControl");
    const themeToggle = document.getElementById("themeToggle");

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

    const savedTheme = localStorage.getItem("theme") || "light-mode";

    setTheme(savedTheme);

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
    async function loadCategory(categoryId, tabButton) {

        // URL 업데이트 (브라우저 히스토리 변경)
        const newCategoryName = tabButton.textContent.trim();
        if (!isExplanMode) {
            const newURL = `preview?category=${encodeURIComponent(newCategoryName)}`;
            if (window.location.search !== `?category=${encodeURIComponent(newCategoryName)}`) {
                history.pushState({ category: newCategoryName }, "", newURL);
            }
        }

        selectedCategory = categoryId;
        selectedSubcategory = null;
        subTabContainer.innerHTML = "";

        document.querySelectorAll(".tab-btn.active").forEach(btn => btn.classList.remove("active"));
        tabButton.classList.add("active");

        // 현재 선택된 카테고리명 업데이트 (요소가 존재할 경우에만)
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

        showLoading();

        const startTime = Date.now(); // 시작 시간 기록

        try {
            const offset = page * limit;
            let url = `/api/files?offset=${offset}&limit=${limit}&category_id=${categoryId}`;
            if (subcategoryId) url += `&subcategory_id=${subcategoryId}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error("이미지 로드 실패");
            const { total, files: images } = await response.json();

            // 총 페이지 계산
            const totalPages = Math.ceil(total / limit);
            noMoreImages = images.length < limit;

            clearGallery();

            images.forEach(image => {

                if (currentView === "image") {
                    const imgContainer = document.createElement("div");
                    imgContainer.classList.add("image-container");

                    const placeholder = document.createElement("div");
                    placeholder.classList.add("image-placeholder");

                    const img = document.createElement("img");
                    img.dataset.src = image.file_path;
                    observer.observe(img);

                    img.onclick = () => {
                        if (isExplanMode) return;
                        window.location.href = `post?id=${image.id}`;
                    };

                    imgContainer.appendChild(placeholder);
                    imgContainer.appendChild(img);
                    const overlay = document.createElement("div");
                    overlay.classList.add("hover-overlay");

                    const message = document.createElement("div");
                    message.classList.add("hover-message");
                    message.textContent = "클릭하여 상세 보기";

                    overlay.appendChild(message);
                    imgContainer.appendChild(overlay);

                    imageGallery.appendChild(imgContainer);
                } else if (currentView === "text") {

                    const row = document.createElement("div");
                    row.classList.add("text-row");

                    const flipInner = document.createElement("div");
                    flipInner.classList.add("flip-inner");

                    const thumb = document.createElement("img");
                    thumb.src = image.file_path;
                    thumb.classList.add("text-thumb");

                    const content = document.createElement("div");
                    content.classList.add("text-content");

                    const titleText = image.title || "제목 없음";

                    const textEl = document.createElement("div");
                    textEl.classList.add("text-preview");
                    textEl.textContent = titleText;

                    const fullText =
                        image.text ||
                        image.description?.text ||
                        "";
                    const hashtags = fullText.match(/#([\w가-힣]+)/g) || [];

                    const hashtagContainer = document.createElement("div");
                    hashtagContainer.classList.add("text-hashtags");

                    hashtags.slice(0, 4).forEach(tag => {
                        const tagEl = document.createElement("span");
                        tagEl.classList.add("text-hashtag");
                        tagEl.textContent = tag;
                        hashtagContainer.appendChild(tagEl);
                    });

                    content.appendChild(textEl);
                    content.appendChild(hashtagContainer);

                    // 🔥 앞면
                    const front = document.createElement("div");
                    front.classList.add("card-face", "card-front");
                    front.appendChild(thumb);
                    front.appendChild(content);

                    // 🔥 뒷면
                    const back = document.createElement("div");
                    back.classList.add("card-face", "card-back");

                    const thumbClone = thumb.cloneNode(true);
                    const contentClone = content.cloneNode(true);

                    back.appendChild(thumbClone);
                    back.appendChild(contentClone);

                    flipInner.appendChild(front);
                    flipInner.appendChild(back);
                    row.appendChild(flipInner);

                    row.onclick = () => {
                        if (isExplanMode) return;
                        window.location.href = `post?id=${image.id}`;
                    };

                    imageGallery.appendChild(row);
                }
            });

            renderPagination(totalPages);

            adjustGalleryRadius(); // 여기 추가
            // page 증가는 버튼 클릭에서만 하므로 여기선 제거
        } catch (err) {
            console.error(err);
        } finally {
            const minDuration = 500; // 최소 0.5초 보장
            const elapsed = Date.now() - startTime;

            if (elapsed < minDuration) {
                await new Promise(res => setTimeout(res, minDuration - elapsed));
            }
            hideLoading();
            isLoadingPage = false;
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

            images.forEach(image => {
                if (currentView === "image") {
                    const imgContainer = document.createElement("div");
                    imgContainer.classList.add("image-container");

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

                    const row = document.createElement("div");
                    row.classList.add("text-row");

                    const flipInner = document.createElement("div");
                    flipInner.classList.add("flip-inner");

                    const titleText = image.title || "제목 없음";
                    const fullText =
                        image.text ||
                        image.description?.text ||
                        "";
                    const hashtags = fullText.match(/#([\w가-힣]+)/g) || [];

                    // ======================
                    // 🔥 앞면
                    // ======================

                    const front = document.createElement("div");
                    front.classList.add("card-face", "card-front");

                    const frontThumb = document.createElement("img");
                    frontThumb.src = image.file_path;
                    frontThumb.classList.add("text-thumb");

                    const frontContent = document.createElement("div");
                    frontContent.classList.add("text-content");

                    const frontPreview = document.createElement("div");
                    frontPreview.classList.add("text-preview");
                    frontPreview.textContent = titleText;

                    const frontHashtagContainer = document.createElement("div");
                    frontHashtagContainer.classList.add("text-hashtags");

                    hashtags.slice(0, 4).forEach(tag => {
                        const tagEl = document.createElement("span");
                        tagEl.classList.add("text-hashtag");
                        tagEl.textContent = tag;
                        frontHashtagContainer.appendChild(tagEl);
                    });

                    frontContent.appendChild(frontPreview);
                    frontContent.appendChild(frontHashtagContainer);

                    front.appendChild(frontThumb);
                    front.appendChild(frontContent);

                    // ======================
                    // 🔥 뒷면
                    // ======================

                    const back = document.createElement("div");
                    back.classList.add("card-face", "card-back");

                    const backThumb = frontThumb.cloneNode(true);
                    const backContent = frontContent.cloneNode(true);

                    back.appendChild(backThumb);
                    back.appendChild(backContent);

                    // ======================
                    // 구조 완성
                    // ======================

                    flipInner.appendChild(front);
                    flipInner.appendChild(back);

                    row.appendChild(flipInner);

                    row.onclick = () => {
                        if (isExplanMode) return;
                        window.location.href = `post?id=${image.id}`;
                    };

                    imageGallery.appendChild(row);
                }
            });
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

    function setTheme(mode) {
        document.body.classList.remove("light-mode", "dark-mode");
        document.body.classList.add(mode);

        localStorage.setItem("theme", mode);
    }


    // 서버에서 Indicator 상태 가져오기 함수 추가
    async function fetchIndicatorStatusAndApply() {
        try {
            const response = await fetch("/api/settings/indicator-status");
            if (!response.ok) throw new Error("서버 응답 오류");
            const data = await response.json();

            //  visible 은 서버 우선
            localStorage.setItem('previewVisible', data.visible ? 'visible' : 'hidden');

            // modernized 는 localStorage 우선
            const localModernized = localStorage.getItem('indicatorModernized');
            const isModernized = localModernized !== null
                ? localModernized === "true"
                : data.modernized;

            localStorage.setItem('indicatorModernized', isModernized ? 'true' : 'false');

            // 상태 반영
            updatePreviewVisibility && updatePreviewVisibility();
            applyModernizedImages(isModernized);
        } catch (error) {
            console.error("🚨 Indicator 상태 가져오기 오류:", error);
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

        if (!categoryParam) return; // URL에 카테고리 정보가 없으면 실행하지 않음

        console.log(`🔄 뒤로 가기 이벤트 발생, 선택할 카테고리: ${categoryParam}`);

        // ✅ 현재 로드된 `categories` 배열에서 `category_name`을 기반으로 `category_id` 찾기
        const matchedCategory = categories.find(cat => cat.name.trim() === categoryParam.trim());

        if (!matchedCategory) {
            console.error(`⚠ 카테고리 (${categoryParam})에 해당하는 category_id를 찾을 수 없음`);
            return;
        }

        const categoryId = matchedCategory.id; // ✅ 올바른 category_id 가져오기

        // ✅ 카테고리 버튼 찾기
        const categoryButton = [...document.querySelectorAll(".tab-btn")]
            .find(btn => btn.textContent.trim() === categoryParam.trim());

        if (categoryButton) {
            console.log(`✅ 뒤로 가기로 ${categoryParam} 선택 (category_id: ${categoryId})`);
            await loadCategory(categoryId, categoryButton); // ✅ 올바른 category_id로 loadCategory 실행
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
        if (!gallery) return;

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
                img.src = img.dataset.src; // ✅ 실제 이미지 로드
                observer.unobserve(img); // ✅ 감지 중지
            }
        });
    }, { rootMargin: "100px", threshold: 0.1 });

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
