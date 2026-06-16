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

    // [추가] 모드 변경 시 클래스 초기화 로직
    const gallery = document.getElementById("imageGallery");
    if (gallery) {
        if (val === "image") {
            // 바둑판 모드로 갈 때 스크롤 모드 클래스 제거
            gallery.classList.remove("text-view-scroll", "text-view");
            gallery.classList.add("image-view");
            gallery.scrollLeft = 0; // 스크롤 위치 초기화
        } else {
            gallery.classList.remove("image-view");
            gallery.classList.add("text-view");
        }
    }
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
export async function loadPage(categoryIdOrName, subcategoryId = null) {
    // 1. [핵심 수정] 전달받은 값이 이름(문자열)이면 ID로 변환합니다.
    let finalCategoryId = categoryIdOrName;

    if (isNaN(categoryIdOrName)) {
        const matched = categories.find(cat => cat.name.trim() === categoryIdOrName.trim());
        if (matched) {
            finalCategoryId = matched.id;
        } else {
            console.warn("카테고리 이름을 ID로 변환할 수 없습니다:", categoryIdOrName);
            if (categories.length === 0) return;
        }
    }

    // ID가 없으면 중단
    if (!finalCategoryId) {
        console.log("카테고리 ID가 유효하지 않습니다.");
        return;
    }

    // --- 로딩 시작 지점 ---
    if (isLoadingPage) return;
    isLoadingPage = true;

    const imageGallery = document.getElementById("imageGallery");
    if (!imageGallery) return;

    if (typeof window.showLoading === "function") {
        window.showLoading();
    }

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
        // 2. [수정] 변환된 finalCategoryId를 사용하여 URL을 생성합니다.
        let url = `/api/files?offset=${offset}&limit=${limit}&category_id=${finalCategoryId}`;
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

            if (currentView === "text") {
                applyTextSlidingGallery();
            }
            if (window.Aos) window.Aos.refresh();
        }, delay);
    }
}

// 개별 카드 렌더링 (loadPage 보조)
function renderCard(image, index, container) {
    if (currentView === "image") {
        const imgContainer = document.createElement("div");
        imgContainer.className = "image-container appear-ani";

        // --- [지그재그 로직 추가] ---
        // 1. 짝수 인덱스일 때 아래로 30px 밀기 (지그재그 효과)
        if (index % 2 !== 0) {
            imgContainer.style.marginTop = "40px";
        }

        // 2. 미세하게 다른 크기 부여 (패턴 파괴)
        const widths = ["180px", "200px", "190px"];
        imgContainer.style.width = widths[index % widths.length];
        // --------------------------

        imgContainer.setAttribute("data-aos", "fade-up"); // fade-right보다 fade-up이 지그재그에 더 자연스러워요
        imgContainer.setAttribute("data-aos-delay", (index * 50).toString());

        const img = document.createElement("img");
        img.dataset.src = image.file_path;

        // 초기 둥근 사각형 설정 (환공포증 방지)
        img.style.borderRadius = "30px";
        img.style.transition = "border-radius 0.3s ease, transform 0.3s ease";

        // Hover 시 사각형으로 변하는 인터렉션 유지
        imgContainer.onmouseenter = () => {
            img.style.borderRadius = "10px";
        };
        imgContainer.onmouseleave = () => {
            img.style.borderRadius = "30px";
        };

        if (window.observer) window.observer.observe(img);
        else img.src = image.file_path;

        img.onclick = () => {
            if (!isExplanMode) window.location.href = `post?id=${image.id}`;
        };

        const overlay = document.createElement("div");
        overlay.className = "hover-overlay";
        overlay.innerHTML = `<span class="hover-message">클릭 시 자세히 볼 수 있습니다</span>`;
        // Hover 인터렉션: 문구가 나타날 때 Radius도 함께 변화
        imgContainer.onmouseenter = () => {
            img.style.borderRadius = "10px";
            overlay.style.opacity = "1"; // CSS에 opacity 설정이 있어도 확실히 제어
        };
        imgContainer.onmouseleave = () => {
            img.style.borderRadius = "30px";
            overlay.style.opacity = "0";
        };

        imgContainer.appendChild(img);
        imgContainer.appendChild(overlay);
        container.appendChild(imgContainer);
    } else {
        // text-view 모드 (3D Flip 카드 구조로 변경)
        const card = document.createElement("div");
        card.className = "text-card-item appear-ani";
        card.setAttribute("data-aos", "fade-up");
        card.style.animationDelay = `${index * 50}ms`;

        // 1. 이미지 데이터나 텍스트에서 해시태그 파싱 (#태그 추출)
        const contentText = image.text || image.description?.text || "";
        const hashtags = contentText.match(/#([\w가-힣]+)/g) || [];

        // 태그들을 span 뱃지 html로 변환 (태그가 없으면 안내 문구)
        const tagsHtml = hashtags.length > 0
            ? hashtags.map(tag => `<span class="flip-tag-badge">${tag}</span>`).join("")
            : `<span class="flip-no-tag">등록된 태그가 없습니다</span>`;

        // 2. 3D 회전을 위한 내부 Front / Back 구조 설계
        card.innerHTML = `
            <div class="flip-card-inner">
                <div class="flip-card-front">
                    <div class="card-img-container">
                        <img src="${image.file_path}" class="card-img" loading="lazy">
                    </div>
                    <div class="card-info">
                        <div class="card-title">${image.title || "제목 없음"}</div>
                    </div>
                </div>
                <div class="flip-card-back">
                    <div class="flip-back-content">
                        <h4 class="flip-back-title">TAGS</h4>
                        <div class="flip-tag-container">
                            ${tagsHtml}
                        </div>
                        <span class="flip-click-notice">클릭 시 상세 보기</span>
                    </div>
                </div>
            </div>
        `;

        // 뒷면을 보더라도 클릭하면 상세 페이지로 이동하도록 유지
        card.onclick = () => {
            if (!isExplanMode) window.location.href = `post?id=${image.id}`;
        };
        container.appendChild(card);
    }
}

// [수정] loadCategories 함수
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

        if (categoryTabContainer) {
            categories.forEach((category, index) => {
                const btn = document.createElement("button");
                btn.className = "tab-btn";

                // [수정] 첫 번째 탭 active 설정 (부모 클래스 active-0 등은 삭제)
                if (index === 0) btn.classList.add("active");

                const iconName = iconMap[category.name] || "folder";
                // [수정] 텍스트와 아이콘만 깔끔하게 넣기 (외부 SVG 파일 삽입 금지)
                btn.innerHTML = `
                    <span class="tab-text">${category.name}</span>
                    <i data-lucide="${iconName}" class="tab-icon"></i>
                `;

                // [수정] index 인자 전달 불필요, 깔끔하게 categoryId와 btn만 전달
                btn.onclick = () => loadCategory(category.id, btn);
                categoryTabContainer.appendChild(btn);
            });

            if (window.lucide) window.lucide.createIcons();
        } else {
            // 디버깅을 위해 콘솔에 경고창만 띄우고 에러는 방지함
            console.warn(".tab-design 요소를 찾을 수 없어 탭을 렌더링하지 않았습니다.");
        }
    } catch (error) {
        console.error("카테고리 로드 오류:", error);
    }
}

// [수정] loadCategory 함수
// [수정] loadCategory 함수에서 index 파라미터 제거
export async function loadCategory(categoryId, tabButton, isPopState = false) {
    const newCategoryName = tabButton.textContent.trim();
    // [수정] categoryTabContainer 변수 선언은 유지하되 클래스 조작은 안 함

    if (!isExplanMode && !isPopState) {
        const currentParams = new URLSearchParams(window.location.search);
        if (currentParams.get("category") !== newCategoryName) {
            const newURL = `preview?category=${encodeURIComponent(newCategoryName)}`;
            history.pushState({ categoryName: newCategoryName }, "", newURL);
        }
    }

    selectedCategory = categoryId;
    selectedSubcategory = null;

    // [수정] 버튼 활성화 상태만 토글 (부모 배경 바꾸는 코드는 삭제)
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    tabButton.classList.add("active");

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

    // 초기화
    pag.innerHTML = "";
    infoBox.innerHTML = ""; // 기존의 독립된 인포박스는 비워둡니다.

    // 1. ◀ 이전 버튼 생성
    const prev = document.createElement("button");
    prev.className = "pagination-circle-btn";
    prev.innerHTML = `<i data-lucide="chevron-left"></i>`;
    prev.disabled = (page === 0);
    prev.onclick = async () => {
        if (page > 0) {
            page--;
            await loadPage(selectedCategory, selectedSubcategory);
        }
    };

    // 2. 중간에 배치할 [pagination-info] 요소 생성
    const centerInfo = document.createElement("div");
    centerInfo.className = "pagination-info-center";
    centerInfo.id = "pagination-info"; // ID 유지하여 CSS 호환성 확보
    centerInfo.innerHTML = `<span> ${page + 1} / ${totalPages} </span>`;

    // 3. ▶ 다음 버튼 생성
    const next = document.createElement("button");
    next.className = "pagination-circle-btn";
    next.innerHTML = `<i data-lucide="chevron-right"></i>`;
    next.disabled = (page + 1 >= totalPages);
    next.onclick = async () => {
        if ((page + 1) < totalPages) {
            page++;
            await loadPage(selectedCategory, selectedSubcategory);
        }
    };

    // --- [핵심] 순서대로 배치: [이전] -> [정보] -> [다음] ---
    pag.appendChild(prev);
    pag.appendChild(centerInfo);
    pag.appendChild(next);

    // 아이콘 생성 실행
    if (window.lucide) window.lucide.createIcons();
}

export function adjustGalleryRadius() {
    const gallery = document.querySelector(".image-gallery");
    if (!gallery) return;

    // [수정] 기존 휠 로직을 더 부드럽고 확실하게 변경
    gallery.onwheel = null; // 기존 바인딩 초기화
    gallery.addEventListener("wheel", (e) => {
        // text-view 혹은 text-view-scroll 클래스가 있을 때 작동
        if (gallery.classList.contains("text-view") || gallery.classList.contains("text-view-scroll")) {
            if (e.deltaY !== 0) {
                e.preventDefault();
                // 스크롤 양 조절 (deltaY 값을 더해줌)
                const scrollSensitivity = 0.5;
                gallery.scrollLeft += e.deltaY * scrollSensitivity;
            }
        }
    }, { passive: false }); // preventDefault를 위해 반드시 false

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