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

    // 🔥 사이드바를 "열 때만" 서브메뉴 전부 닫기 (완전 초기화)
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
        console.error("❌ 해당 카테고리 버튼을 찾을 수 없음:", categoryName);
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

document.addEventListener("DOMContentLoaded", async () => {
    const isExplanMode = window.location.hash.includes("explan");
    const sidebarToggle = document.querySelector(".sidebar-toggle");
    const welcomeEl = document.getElementById("welcomeMessage");
    const categoryTabContainer = document.querySelector(".tab-design"); // 메인 카테고리 탭
    const subTabContainer = document.getElementById("subTabContainer"); // 서브 카테고리 탭
    const imageGallery = document.getElementById("imageGallery"); // 이미지 갤러리
    const currentCategory = document.getElementById("currentCategory"); // 현재 카테고리 표시
    const previewContainer = document.getElementById("previewImagesContainer");
    const paginationContainer = document.getElementById("pagination-container");
    const opacitySlider = document.getElementById("opacitySlider");
    const opacityToggleBtn = document.getElementById("opacityToggleBtn");
    const opacityControl = document.getElementById("opacityControl");
    const tabDesign = document.querySelector(".tab-design");
    const margeContainer = document.querySelector(".marge-container");
    const closeBtn = document.querySelector(".preview-close");
    const previewLink = document.getElementById("previewLink");
    const iconLink = document.getElementById("iconlink");
    const urlParams = new URLSearchParams(window.location.search);
    const themeToggle = document.getElementById("themeToggle"); // ✅ 추가

    let wasOverlapping = false;
    let overlapTimer = null;
    let categoryParam = urlParams.get("category");
    let selectedCategory = null;
    let selectedSubcategory = null;
    let categories = [];
    let page = 0;
    let limit = 20;    // 5×4
    let noMoreImages = false;
    let isCut = false; // ✅ 이미지 상태 저장
    let isVisible = true;
    let currentView = "image"; // 기본값

    if (previewLink) {
        previewLink.addEventListener("click", (e) => {
            e.preventDefault(); // 🔥 새 창 / 페이지 이동 차단
            openPreviewPopup();
        });
    }

    if (iconLink) {
        iconLink.addEventListener("click", (e) => {
            e.preventDefault(); // 🔥 새 창 / 페이지 이동 차단
            openAiIconPopup();
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


    // ✅ 카테고리 한글 ↔ 영문 매핑 (필요한 경우 적용)
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

    // ✅ 로딩 화면 표시 함수
    function showLoading() {
        document.getElementById("loadingIndicator").style.display = "flex";
    }

    // ✅ 로딩 화면 숨김 함수
    function hideLoading() {
        setTimeout(() => {
            document.getElementById("loadingIndicator").style.display = "none";
        }, 500);
    }

    // ✅ URL에서 받은 카테고리가 영문이면 한글로 변환
    if (categoryParam && categoryMappings[categoryParam]) {
        categoryParam = categoryMappings[categoryParam];
    }

    if (welcomeEl) {
        if (opacitySlider) {
            // 슬라이더 조작 시
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

        if (isExplanMode) {
            welcomeEl.addEventListener("click", (e) => {
                // ✅ a 태그 클릭이면 막지 않음
                e.preventDefault(); // ✅ 이때만 링크 이동 막기

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

    // ✅ 사이드바 메뉴 클릭 시 자동으로 사이드바 닫기
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

            clearCategoryTabs(); // ✅ 기존 카테고리 탭 삭제

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
            lucide.createIcons(); // 🔥 아이콘 다시 렌더

            setTimeout(() => initializeCategorySelection(), 300);

            return categories;
        } catch (error) {
            console.error("🚨 카테고리를 불러오는 중 오류 발생:", error);
        }
    }
    await loadCategories(); // ✅ 카테고리 불러오기 실행

    // 2) 카테고리 선택 시
    async function loadCategory(categoryId, tabButton) {
        showLoading(); // 🔥 로딩 화면 표시

        // ✅ URL 업데이트 (브라우저 히스토리 변경)
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

        // ✅ 현재 선택된 카테고리명 업데이트 (요소가 존재할 경우에만)
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
        hideLoading(); // 🔥 로딩 완료 후 숨김
    };

    // 3) 서브카테고리 로드
    async function loadSubcategories(categoryId) {
        try {
            const response = await fetch(`/api/categories/${categoryId}/subcategories`);
            if (!response.ok) throw new Error("서브카테고리를 가져오는 데 실패함");

            const subcategories = await response.json();
            subTabContainer.innerHTML = "";

            if (subcategories.length === 0) {
                console.log("📌 서브카테고리가 없습니다. 기본 카테고리 이미지 로딩.");
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
            console.error("🚨 서브카테고리를 불러오는 중 오류 발생:", error);
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
        showLoading();
        const offset = page * limit;
        let url = `/api/files?offset=${offset}&limit=${limit}&category_id=${categoryId}`;
        if (subcategoryId) url += `&subcategory_id=${subcategoryId}`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("이미지 로드 실패");
            const { total, files: images } = await res.json();

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
                    img.alt = "Uploaded Image";
                    img.classList.add("gallery-image");
                    observer.observe(img);

                    const cat = encodeURIComponent(image.category_name || "uncategorized");
                    const sub = encodeURIComponent(image.subcategory_name || "general");
                    const file = encodeURIComponent(image.file_name);

                    // ✅ post.html 이동 차단
                    img.onclick = () => {
                        if (isExplanMode) return; // 🔒 체험모드에서는 클릭 차단
                        window.location.href = `post?category=${cat}&subcategory=${sub}&file=${file}`;
                    };

                    imgContainer.appendChild(placeholder);
                    imgContainer.appendChild(img);
                    imageGallery.appendChild(imgContainer);
                } else if (currentView === "text") {

                    const row = document.createElement("div");
                    row.classList.add("text-row");

                    const thumb = document.createElement("img");
                    thumb.src = image.file_path;
                    thumb.classList.add("text-thumb");


                    const content = document.createElement("div");
                    content.classList.add("text-content");

                    const previewText = image.content
                        ? image.content.substring(0, 100)
                        : image.title;

                    content.textContent = previewText;

                    // 🔥 여기 추가 (이미지 모드와 동일 로직)
                    const cat = encodeURIComponent(image.category_name || "uncategorized");
                    const sub = encodeURIComponent(image.subcategory_name || "general");
                    const file = encodeURIComponent(image.file_name);

                    row.onclick = () => {
                        if (isExplanMode) return;
                        window.location.href = `post?category=${cat}&subcategory=${sub}&file=${file}`;
                    };

                    row.appendChild(thumb);
                    row.appendChild(content);

                    imageGallery.appendChild(row);
                }
            });

            renderPagination(totalPages);
            // page 증가는 버튼 클릭에서만 하므로 여기선 제거
        } catch (err) {
            console.error(err);
        } finally {
            hideLoading();
        }
    }

    // 6) Prev/번호/Next 렌더링
    function renderPagination(totalPages) {
        const pag = document.getElementById("pagination-container");
        if (!pag) return;  // pagination 요소가 없으면 아무것도 안 함
        pag.innerHTML = "";

        // ◀ Prev 버튼
        const prev = document.createElement("button");
        prev.classList.add("pagination-button");
        prev.textContent = "◀";                // 버튼 레이블 추가
        prev.style.padding = "0px";

        prev.onclick = () => {
            if (page <= 0) {
                showPopupMessage("첫 페이지입니다.");
                return;
            }
            page--;
            loadPage(selectedCategory, selectedSubcategory);
        };
        pag.appendChild(prev);

        const info = document.createElement("span");
        info.textContent = ` ${page + 1} / ${totalPages} `;
        info.style.margin = "0 10px";
        pag.appendChild(info);

        // ▶ Next 버튼
        const next = document.createElement("button");
        next.classList.add("pagination-button");
        next.textContent = "▶";                // 버튼 레이블 추가
        next.style.padding = "0px";

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

    /** ✅ 이미지 불러오기 (4x5 배열 적용) */
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
            console.log("✅ 서버 응답:", images);

            clearGallery(); // ✅ 기존 이미지 삭제 (innerHTML = "" 대신 사용)

            if (!Array.isArray(images) || images.length === 0) {
                imageGallery.classList.remove("grid-layout");
                imageGallery.classList.add("flex-center");

                const noImageMessage = document.createElement("div");
                noImageMessage.classList.add("no-image-message");
                noImageMessage.innerHTML = "📂 해당 카테고리에 이미지가 없습니다.";
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
                    img.alt = "Uploaded Image";
                    img.classList.add("gallery-image");

                    observer.observe(img); // ✅ Intersection Observer로 감지

                    // ✅ 문제 해결: `image.category_name`과 `image.subcategory_name`을 직접 사용
                    const categoryName = image.category_name ? encodeURIComponent(image.category_name) : "uncategorized";
                    const subcategoryName = image.subcategory_name ? encodeURIComponent(image.subcategory_name) : "general";
                    const fileName = encodeURIComponent(image.file_name);
                    const postURL = `post?category=${categoryName}&subcategory=${subcategoryName}&file=${fileName}`;

                    img.onclick = () => {
                        if (isExplanMode) return; // 🔒 체험모드에서는 클릭 무시
                        console.log(`✅ 이동할 URL: ${postURL}`);
                        window.location.href = postURL;
                    };

                    imgContainer.appendChild(placeholder);
                    imgContainer.appendChild(img);
                    imageGallery.appendChild(imgContainer);
                } else if (currentView === "text") {

                    const row = document.createElement("div");
                    row.classList.add("text-row");

                    const thumb = document.createElement("img");
                    thumb.src = image.file_path;
                    thumb.classList.add("text-thumb");

                    const content = document.createElement("div");
                    content.classList.add("text-content");

                    const previewText = image.content
                        ? image.content.substring(0, 100)
                        : image.file_name;

                    content.textContent = previewText;

                    // 🔥 여기 추가 (이미지 모드와 동일 로직)
                    const cat = encodeURIComponent(image.category_name || "uncategorized");
                    const sub = encodeURIComponent(image.subcategory_name || "general");
                    const file = encodeURIComponent(image.file_name);

                    row.onclick = () => {
                        if (isExplanMode) return;
                        window.location.href = `post?category=${cat}&subcategory=${sub}&file=${file}`;
                    };

                    row.appendChild(thumb);
                    row.appendChild(content);

                    imageGallery.appendChild(row);
                }
            });
        } catch (error) {
            console.error("🚨 이미지를 불러오는 중 오류 발생:", error);
            imageGallery.classList.remove("grid-layout");
            imageGallery.classList.add("flex-center");
            imageGallery.innerHTML = `<p class="no-image-message">오류: ${error.message}</p>`;
        }
    }

    /** ✅ 다크 모드 토글 기능 */
    window.toggleTheme = function () {
        const body = document.body;
        const isDarkMode = body.classList.toggle("dark-mode");
        const themeIcon = document.getElementById("themeIcon");

        if (isDarkMode) {
            localStorage.setItem("theme", "dark");
            themeToggle.checked = true;
            if (themeIcon) {
                themeIcon.style.backgroundImage = "url('../images/toggle_dark.png')";
            }
        } else {
            localStorage.setItem("theme", "light");
            themeToggle.checked = false;
            if (themeIcon) {
                themeIcon.style.backgroundImage = "url('../images/toggle_light.png')";
            }
        }
    }

    /** ✅ 페이지 로드 시 저장된 다크 모드 적용 */
    function applySavedTheme() {
        const savedTheme = localStorage.getItem("theme") || "light";
        const themeIcon = document.getElementById("themeIcon");
        const themeToggle = document.getElementById("themeToggle");

        if (savedTheme === "dark") {
            document.body.classList.add("dark-mode");
            if (themeToggle) themeToggle.checked = true;
            if (themeIcon) {
                themeIcon.style.backgroundImage = "url('../images/toggle_dark.png')";
            }
        } else {
            document.body.classList.remove("dark-mode");
            if (themeToggle) themeToggle.checked = false;
            if (themeIcon) {
                themeIcon.style.backgroundImage = "url('../images/toggle_light.png')";
            }
        }
    }

    function checkOverlap(img) {
        const imgRect = img.getBoundingClientRect();
        const toggleRect = document.querySelector('.toggle-switch .slider').getBoundingClientRect();
        console.log("[debug] imgRect, toggleRect:", imgRect, toggleRect);

        const x_overlap = Math.max(0, Math.min(imgRect.right, toggleRect.right) - Math.max(imgRect.left, toggleRect.left));
        const y_overlap = Math.max(0, Math.min(imgRect.bottom, toggleRect.bottom) - Math.max(imgRect.top, toggleRect.top));
        const overlapArea = x_overlap * y_overlap;

        const toggleArea = toggleRect.width * toggleRect.height;
        const ratioToggle = overlapArea / toggleArea;
        console.log("[debug] overlapArea:", overlapArea,
            "toggleArea:", toggleArea,
            "ratioToggle:", ratioToggle);

        // 토글 면적의 70% 이상 겹쳤을 때
        if (ratioToggle >= 0.7 && !wasOverlapping) {
            overlapTimer = setTimeout(() => window.location.href = "killing_game.html", 10000);
        }
        if (ratioToggle < 0.7 && wasOverlapping) {
            clearTimeout(overlapTimer);
        }
        wasOverlapping = ratioToggle >= 0.7;
    }

    function updatePreviewImage() {
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

        // 🧠 드래그 상태 추적
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
            startOverlapCheckLoop(img); // 👈 겹침 감지 루프 시작
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            const containerRect = previewContainer.getBoundingClientRect();
            let left = e.clientX - containerRect.left - offsetX;
            let top = e.clientY - containerRect.top - offsetY;
            img.style.left = left + "px";
            img.style.top = top + "px";
            checkOverlap(img); // 👈 실시간 감지용 강제 호출 추가!
        });

        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
                img.style.cursor = "grab";
                stopOverlapCheckLoop(); // 👈 루프 멈추기
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

    // ✅ 서버에서 Indicator 상태 가져오기 함수 추가
    async function fetchIndicatorStatusAndApply() {
        try {
            const res = await fetch("/api/settings/indicator-status");
            if (!res.ok) throw new Error("서버 응답 오류");
            const data = await res.json();

            // ✅ visible 은 서버 우선
            localStorage.setItem('previewVisible', data.visible ? 'visible' : 'hidden');

            // ✅ modernized 는 localStorage 우선
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

    // 표시기 상태 업데이트 함수
    function updatePreviewVisibility() {
        const previewState = localStorage.getItem("previewVisible");

        if (!previewContainer) {
            console.error("❌ #previewImagesContainer 요소를 찾을 수 없음!");
            return;
        }

        // let으로 변경 (재할당 가능)
        let img = previewContainer.querySelector("img");

        // previewContainer 내의 img 요소 찾기
        if (!img) {
            console.warn("⚠️ 표시할 이미지가 없음. 새로 생성합니다.");
            updatePreviewImage();
            img = previewContainer.querySelector("img");
            if (!img) return; // 그래도 없으면 그냥 리턴
        }

        // 표시 상태 적용
        if (previewState === "hidden") {
            img.style.display = "none"; // 숨기기
        } else {
            img.style.display = "flex"; // 보이기
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

    // ✅ `localStorage` 변경 감지 (admin-dashboard에서 변경되면 자동 반영)
    window.addEventListener("storage", updatePreviewVisibility);


    // ✅ 뒤로 가기(←) 또는 앞으로 가기(→) 시 카테고리 변경 처리
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


    // ✅ 모든 카테고리 로드 후, URL 파라미터와 일치하는 카테고리 자동 선택
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

    function clearGallery() {
        while (imageGallery.firstChild) {
            imageGallery.removeChild(imageGallery.firstChild);
        }
    }

    // ✅ Intersection Observer 먼저 정의
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src; // ✅ 실제 이미지 로드
                img.classList.add("loaded");
                observer.unobserve(img); // ✅ 감지 중지
            }
        });
    }, { rootMargin: "100px", threshold: 0.1 });

    bindViewSwitchEvents();
    bindSidebarEvents();
    applySavedTheme();
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
});
