// 1. 초기 상태값 및 설정값 선언
export const isExplanMode = window.location.hash.includes("explan");

// 카테고리 아이콘 매핑
const iconMap = {
    "퍼즐": "puzzle",
    "보석비즈": "gem",
    "3D퍼즐": "box",
    "디폼블럭": "grid-3x3",
    "브릭피규어": "toy-brick"
};

// 카테고리 영문/한글 매핑
const categoryMappings = {
    "puzzle": "퍼즐",
    "bizz": "보석비즈",
    "solidbodypuzzle": "3D퍼즐",
    "deforme": "디폼블럭",
    "brickfigure": "브릭피규어"
};

// 2. 상태값 선언
export let isLoadingPage = false;
export let currentView = "image";
export let page = 0;
export let limit = 20;
export let selectedCategory = null;
export let selectedSubcategory = null;
export let categories = [];
export let noMoreImages = false;

// 3. Setter 함수들 (main.js에서 호출용)
export const setPage = (val) => page = val;
export const setView = (val) => {
    currentView = val;
    limit = (val === "image") ? 20 : 10;
};

// 4. 기초 UI 조작 함수
export function clearGallery() {
    const imageGallery = document.getElementById("imageGallery");
    if (!imageGallery) return;
    while (imageGallery.firstChild) {
        imageGallery.removeChild(imageGallery.firstChild);
    }
}

export function clearCategoryTabs() {
    const container = document.querySelector(".tab-design");
    if (!container) return;
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

// 5. 핵심: 페이지 로드 함수
export async function loadPage(categoryId, subcategoryId = null) {
    // [추가] categoryId가 없으면 에러를 뿜지 말고 조용히 종료합니다.
    if (!categoryId) {
        console.log("카테고리 ID가 아직 설정되지 않았습니다. 로드를 대기합니다.");
        return;
    }

    if (isLoadingPage) return;
    isLoadingPage = true;

    const imageGallery = document.getElementById("imageGallery");
    if (!imageGallery) return;

    // 로딩 시작 (main.js의 전역 함수 호출)
    if (typeof window.showLoading === "function") window.showLoading();
    clearGallery();

    imageGallery.classList.toggle("image-view", currentView === "image");
    imageGallery.classList.toggle("text-view", currentView === "text");

    // 스켈레톤 생성
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

        clearGallery();

        if (images.length === 0) {
            imageGallery.innerHTML = '<p class="no-data">표시할 컨텐츠가 없습니다.</p>';
        } else {
            images.forEach((image, index) => {
                renderCard(image, index, imageGallery);
            });
        }

        renderPagination(totalPages);
        adjustGalleryRadius();

    } catch (err) {
        console.error(" 로드 중 오류:", err);
        imageGallery.innerHTML = '<p class="error-msg">데이터를 불러오는 중 오류가 발생했습니다.</p>';
    } finally {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 500 - elapsed);

        setTimeout(() => {
            if (typeof window.hideLoading === "function") window.hideLoading();
            isLoadingPage = false;

            // --- [수정 포인트 1] 텍스트 모드일 때 입체 슬라이드 실행 ---
            if (currentView === "text") {
                applyTextSlidingGallery();
            }
            // -------------------------------------------------------
            // 전역 AOS 새로고침
            if (window.Aos) window.Aos.refresh();
        }, delay);
    }
}

// 개별 카드 렌더링 (loadPage 보조)
function renderCard(image, index, container) {
    if (currentView === "image") {
        const imgContainer = document.createElement("div");
        imgContainer.className = "image-container appear-ani";
        imgContainer.setAttribute("data-aos", "fade-right");
        imgContainer.setAttribute("data-aos-delay", (index * 50).toString());

        const img = document.createElement("img");
        img.dataset.src = image.file_path;

        // Intersection Observer (main.js 등에 선언된 전역 객체 참조)
        if (window.observer) window.observer.observe(img);
        else img.src = image.file_path; // 옵저버 없으면 즉시 로드

        img.onclick = () => {
            if (!isExplanMode) window.location.href = `post?id=${image.id}`;
        };

        const overlay = document.createElement("div");
        overlay.className = "hover-overlay";
        overlay.innerHTML = `<span class="hover-message">클릭 시 자세히 볼 수 있습니다</span>`;

        imgContainer.appendChild(img);
        imgContainer.appendChild(overlay);
        container.appendChild(imgContainer);
    } else {
        const card = document.createElement("div");
        // [중요] 라이브러리가 직접 제어할 수 있도록 img 태그를 카드의 직계 자식이나 주요 요소로 배치합니다.
        card.className = "text-card-item appear-ani";
        card.setAttribute("data-aos", "fade-up");
        card.style.animationDelay = `${index * 50}ms`;

        // 라이브러리는 가로/세로 모드를 판단하므로 layout 속성을 넣어주면 더 정확합니다.
        const hashtags = (image.text || "").match(/#([\w가-힣]+)/g) || [];
        const tagsHtml = hashtags.slice(0, 2).map(tag => `<span class="text-hashtag">${tag}</span>`).join("");

        card.innerHTML = `
            <div class="card-img-container">
                <img src="${image.file_path}" class="card-img" loading="lazy">
            </div>
            <div class="card-info">
                <div class="card-title">${image.title || "제목 없음"}</div>
            </div>`;

        card.onclick = () => {
            if (!isExplanMode) window.location.href = `post?id=${image.id}`;
        };
        container.appendChild(card);
    }
}

// 6. 카테고리 로직
export async function loadCategories() {
    if (!isExplanMode) {
        setTimeout(() => initializeCategorySelection(), 300);
    }
    try {
        const response = await fetch("/api/categories");
        if (!response.ok) throw new Error("카테고리를 가져오는 데 실패함");

        categories = await response.json();
        categories = categories.filter(c => c.name.toLowerCase() !== "uncategorized");

        clearCategoryTabs();
        const categoryTabContainer = document.querySelector(".tab-design");

        categories.forEach((category, index) => {
            const btn = document.createElement("button");
            btn.className = "tab-btn";
            if (index === 0) btn.classList.add("active");

            const iconName = iconMap[category.name] || "folder";
            btn.innerHTML = `${category.name} <i data-lucide="${iconName}" class="tab-icon"></i>`;

            btn.onclick = () => loadCategory(category.id, btn);
            categoryTabContainer.appendChild(btn);
        });

        if (window.lucide) window.lucide.createIcons();
    } catch (error) {
        console.error("카테고리 로드 오류:", error);
    }
}

export async function loadCategory(categoryId, tabButton, isPopState = false) {
    const newCategoryName = tabButton.textContent.trim();

    if (!isExplanMode && !isPopState) {
        const currentParams = new URLSearchParams(window.location.search);
        if (currentParams.get("category") !== newCategoryName) {
            const newURL = `preview?category=${encodeURIComponent(newCategoryName)}`;
            history.pushState({ categoryName: newCategoryName }, "", newURL);
        }
    }

    selectedCategory = categoryId;
    selectedSubcategory = null;

    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    tabButton.classList.add("active");

    const currentCategoryEl = document.getElementById("currentCategory");
    if (currentCategoryEl) currentCategoryEl.textContent = newCategoryName;

    await loadSubcategories(categoryId);
    page = 0;
    noMoreImages = false;
    await loadPage(categoryId, selectedSubcategory);
}

export async function loadSubcategories(categoryId) {
    const subTabContainer = document.getElementById("subTabContainer");
    if (!subTabContainer) return;

    try {
        const response = await fetch(`/api/categories/${categoryId}/subcategories`);
        const subcategories = await response.json();
        subTabContainer.innerHTML = "";

        if (subcategories.length === 0) {
            selectedSubcategory = null;
            return;
        }

        subcategories.forEach((sub, index) => {
            const btn = document.createElement("button");
            btn.className = "sub-tab";
            if (index === 0) {
                btn.classList.add("active");
                selectedSubcategory = sub.id;
            }
            btn.textContent = sub.name;
            btn.onclick = () => loadSubcategory(categoryId, sub.id, btn);
            subTabContainer.appendChild(btn);
        });
    } catch (error) {
        console.error("서브카테고리 로드 오류:", error);
    }
}

export async function loadSubcategory(categoryId, subcategoryId, tabButton) {
    document.querySelectorAll(".sub-tab").forEach(b => b.classList.remove("active"));
    tabButton.classList.add("active");
    selectedSubcategory = subcategoryId;
    page = 0;
    noMoreImages = false;
    await loadPage(categoryId, selectedSubcategory);
}

export async function initializeCategorySelection() {
    const urlParams = new URLSearchParams(window.location.search);
    let categoryParam = urlParams.get("category");

    if (categoryParam && categoryMappings[categoryParam]) {
        categoryParam = categoryMappings[categoryParam];
    }

    if (!categoryParam && categories.length > 0) {
        categoryParam = categories[0].name;
    }

    const matchedCategory = categories.find(cat => cat.name.trim() === categoryParam?.trim());
    if (matchedCategory) {
        const categoryButton = [...document.querySelectorAll(".tab-btn")]
            .find(btn => btn.textContent.trim() === matchedCategory.name.trim());
        if (categoryButton) {
            await loadCategory(matchedCategory.id, categoryButton);
        }
    }
}

// 5. 페이지네이션 및 레이아웃
export function renderPagination(totalPages) {
    const pag = document.getElementById("pagination-container");
    const infoBox = document.getElementById("pagination-info");
    if (!pag || !infoBox) return;

    pag.innerHTML = "";
    infoBox.innerHTML = `<span> ${page + 1} / ${totalPages} </span>`;

    // ◀ 이전 버튼 (원형 화살표)
    const prev = document.createElement("button");
    prev.className = "pagination-circle-btn";
    prev.innerHTML = `<i data-lucide="chevron-left"></i>`; // 화살표 아이콘
    prev.disabled = (page === 0); // 첫 페이지면 비활성화
    prev.onclick = async () => {
        if (page > 0) {
            page--;
            await loadPage(selectedCategory, selectedSubcategory);
        }
    };

    // ▶ 다음 버튼 (원형 화살표)
    const next = document.createElement("button");
    next.className = "pagination-circle-btn";
    next.innerHTML = `<i data-lucide="chevron-right"></i>`; // 화살표 아이콘
    next.disabled = (page + 1 >= totalPages); // 마지막 페이지면 비활성화
    next.onclick = async () => {
        if ((page + 1) < totalPages) {
            page++;
            await loadPage(selectedCategory, selectedSubcategory);
        }
    };

    pag.appendChild(prev);
    pag.appendChild(next);

    // 아이콘 생성 실행
    if (window.lucide) window.lucide.createIcons();
}
export function adjustGalleryRadius() {
    const gallery = document.querySelector(".image-gallery");
    if (!gallery) return;

    // 휠 가로 스크롤 로직
    gallery.onwheel = (e) => {
        if (gallery.classList.contains("text-view") && e.deltaY !== 0) {
            e.preventDefault();
            gallery.scrollLeft += e.deltaY;
        }
    };

    const items = gallery.querySelectorAll(".image-container, .text-card-item");
    if (items.length === 0) return;

    const firstTop = items[0].offsetTop;
    const multiRow = [...items].some(item => item.offsetTop !== firstTop);
    gallery.classList.toggle("multi-row", multiRow);
}

export function applyTextSlidingGallery() {
    const $gallery = $('#imageGallery');
    const $items = $gallery.find('.text-card-item');

    if ($items.length > 0) {
        // 1. 라이브러리 흔적 및 인라인 스타일 싹 다 지우기
        $items.removeAttr('style').removeClass('start aos-init aos-animate');
        $gallery.removeAttr('style');

        // 2. 텍스트 뷰 전용 클래스 확인 (CSS에서 스크롤 처리)
        $gallery.addClass('text-view-scroll');

        console.log("좌우 스크롤 모드로 전환 완료");
    }
}