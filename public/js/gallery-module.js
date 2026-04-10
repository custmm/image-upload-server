// 1. 상태값들을 외부에서 접근할 수 있도록 export 합니다.
export let isLoadingPage = false;
export let currentView = "image";
export let page = 0;
export let limit = 20;
export let selectedCategory = null;
export let selectedSubcategory = null;
export let categories = [];
export let noMoreImages = false;

// 2. 외부에서 상태를 변경해야 할 때를 위한 setter 함수들

// 3. 갤러리 비우기 (가장 먼저 배치)
export function clearGallery() {
    const imageGallery = document.getElementById("imageGallery");
    if (!imageGallery) return;

    while (imageGallery.firstChild) {
        imageGallery.removeChild(imageGallery.firstChild);
    }
}

// 4. 카테고리 탭 비우기
export function clearCategoryTabs() {
    const container = document.querySelector(".tab-design");
    if (!container) return;
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

// 5. 핵심: 페이지 로드 함수
// (주의: showLoading, hideLoading, observer, isExplanMode 등은 
// main.js나 전역에 선언되어 있어야 하며, 필요한 경우 매개변수로 받거나 import 해야 합니다.)
// 5) 페이지별 이미지 로드
export async function loadPage(categoryId, subcategoryId = null) {
    if (isLoadingPage) return;
    isLoadingPage = true;

    const imageGallery = document.getElementById("imageGallery");

    // 로딩 처리 (전역 함수 호출)
    if (typeof showLoading === "function")showLoading();
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

                    // 1. 이미지 생성
                    const img = document.createElement("img");
                    img.dataset.src = image.file_path;
                    observer.observe(img); // 지연 로딩 관찰 시작

                    img.onclick = () => {
                        if (!isExplanMode) window.location.href = `post?id=${image.id}`;
                    };

                    // 2. [추가] 호버 시 나타날 오버레이 레이어 생성
                    const overlay = document.createElement("div");
                    overlay.className = "hover-overlay"; // CSS의 .hover-overlay와 매칭

                    // 3. [추가] 오버레이 안에 들어갈 문구 생성
                    const message = document.createElement("span");
                    message.className = "hover-message"; // CSS의 .hover-message와 매칭
                    message.textContent = "클릭 시 자세히 볼 수 있습니다";

                    // 4. 조립
                    overlay.appendChild(message);
                    imgContainer.appendChild(img);

                    imgContainer.appendChild(overlay); // 이미지 위에 오버레이 추가
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


 export async function loadCategories() {
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

// 3) 서브카테고리 로드
export async function loadSubcategories(categoryId) {
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

// 모든 카테고리 로드 후, URL 파라미터와 일치하는 카테고리 자동 선택
export async function initializeCategorySelection(retryCount = 5) {
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
            console.error(" 사용할 수 있는 카테고리가 없음!");
            return;
        }
    }

    console.log(` URL에서 전달된 카테고리: ${categoryParam}`);

    // 현재 로드된 `categories` 배열에서 `category_name`을 기반으로 `category_id` 찾기
    const matchedCategory = categories.find(cat => cat.name.trim() === categoryParam.trim());

    if (!matchedCategory) {
        console.error(`⚠ 카테고리 (${categoryParam})에 해당하는 category_id를 찾을 수 없음`);
        return;
    }

    // 여기서 categoryId를 추출
    const categoryId = matchedCategory.id;

    // 카테고리 이름과 매칭되는 버튼을 찾아 클릭 실행
    const categoryButton = [...document.querySelectorAll(".tab-btn")]
        .find(btn => btn.textContent.trim() === categoryParam.trim());

    if (categoryButton) {
        console.log(` 카테고리 자동 선택: ${categoryParam} (category_id: ${categoryId})`);
        await loadCategory(categoryId, categoryButton);
    }
}

/** 이미지 불러오기 (4x5 배열 적용) */
export async function loadImages(categoryId, subcategoryId = null) {
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

        clearGallery();

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