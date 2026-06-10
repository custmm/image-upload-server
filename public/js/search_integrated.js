// 1. 전역 상태 변수
let allPosts = [];
let currentIndex = 0;
const pageSize = 10; // 한 페이지당 표시할 카드 개수 (10개씩 교체)
let isLoading = false;
let tagLoaded = false;
let loaderStep = 1;
let loaderInterval = null;

// 2. 로딩 애니메이션 제어
function showLoading() {
    const indicator = document.getElementById("loadingIndicator");
    const loader = document.getElementById("mainLoader");
    if (!indicator || !loader) return;

    indicator.style.display = "flex";
    loaderInterval = setInterval(() => {
        loaderStep++;
        if (loaderStep > 4) loaderStep = 1;
        loader.className = "loader loader" + loaderStep;
    }, 150);
}

function hideLoading() {
    clearInterval(loaderInterval);
    loaderInterval = null;
    const indicator = document.getElementById("loadingIndicator");
    if (indicator) indicator.style.display = "none";
}

// 3. 게시글 렌더링 함수 (가로 스크롤 알맹이만 깔끔하게 체인지)
function renderPostsByPage(index) {
    currentIndex = index;
    const postList = document.getElementById("postList");
    if (!postList) return;

    // 전체 데이터에서 현재 페이지 영역 10개 추출
    const nextPosts = allPosts.slice(currentIndex, currentIndex + pageSize);

    const html = nextPosts.map(post => `
        <div class="post-item" data-id="${post.id}" style="cursor: pointer;">
            <div class="search_image">
                <img src="${post.file_path || '/images/no-image.png'}" alt="${post.title}">
            </div>
            <div class="post-meta">
                <div class="category">
                    ${post.category_name || ""} ▶ ${post.subcategory_name || ""}
                </div>
                <div class="search_title">
                    <h3>${post.title}</h3>
                </div>
                <div class="desc">
                    ${(post.text || post.title || "").replace(/(<([^>]+)>)/gi, "").slice(0, 50)}...
                </div>
            </div>
        </div>
    `).join('');

    // 가로 스크롤 내부 덮어쓰기 교체
    postList.innerHTML = html;
    postList.scrollLeft = 0;

    // 클릭 이벤트 바인딩
    const addedItems = postList.querySelectorAll(".post-item[data-id]");
    addedItems.forEach(item => {
        item.addEventListener("click", () => {
            const postId = item.getAttribute("data-id");
            window.location.href = `post?id=${postId}`;
        });
    });

    // 🔹 외부 영역에 페이지 제네레이션 버튼 생성 및 업데이트 트리거
    renderPaginationButtons();
}

// 4. 페이지네이션 버튼 동적 생성 함수 (🔹 search-container 완전 바깥에 독립 배치)
function renderPaginationButtons() {
    let pagContainer = document.getElementById("paginationContainer");
    
    // 버튼을 담을 컨테이너가 없으면 동적으로 생성
    if (!pagContainer) {
        pagContainer = document.createElement("div");
        pagContainer.id = "paginationContainer";
        
        // 하단 중앙 정렬을 위한 스타일 속성
        pagContainer.style.textAlign = "center";
        pagContainer.style.margin = "30px 0";
        pagContainer.style.display = "flex";
        pagContainer.style.justifyContent = "center";
        pagContainer.style.alignItems = "center";
        pagContainer.style.gap = "8px";

        // 🔹 [핵심 변경] search-container 영역을 찾아 통째로 바깥 아랫줄에 삽입합니다.
        const searchContainer = document.querySelector(".search-container");
        if (searchContainer) {
            // search-container 바로 뒤(외부)에 독립 배치
            searchContainer.parentNode.insertBefore(pagContainer, searchContainer.nextSibling);
        } else {
            // 구조상 만약 없을 경우 안전장치로 postList의 부모 바깥에 배치
            const postList = document.getElementById("postList");
            if (postList && postList.parentNode) {
                postList.parentNode.parentNode.insertBefore(pagContainer, postList.parentNode.nextSibling);
            }
        }
    }

    pagContainer.innerHTML = "";
    if (allPosts.length <= pageSize) return; // 전체 게시글이 10개 이하면 버튼을 그리지 않음

    const totalPages = Math.ceil(allPosts.length / pageSize);
    const currentPage = Math.floor(currentIndex / pageSize);

    // [◀] 이전 버튼
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "◀";
    prevBtn.className = "page-nav-btn";
    prevBtn.disabled = (currentPage === 0);
    prevBtn.onclick = () => {
        if (currentPage > 0) {
            renderPostsByPage((currentPage - 1) * pageSize);
        }
    };
    pagContainer.appendChild(prevBtn);

    // [1], [2], [3]... 숫자 번호 버튼들
    for (let i = 0; i < totalPages; i++) {
        const pageBtn = document.createElement("button");
        pageBtn.textContent = i + 1;
        pageBtn.className = "page-num-btn";
        
        // 현재 선택되어 보고 있는 페이지 스타일 디자인 분기
        if (i === currentPage) {
            pageBtn.classList.add("active");
            pageBtn.style.fontWeight = "bold";
            pageBtn.style.backgroundColor = "#007bff";
            pageBtn.style.color = "#fff";
        }

        pageBtn.onclick = () => {
            renderPostsByPage(i * pageSize);
        };
        pagContainer.appendChild(pageBtn);
    }

    // [▶] 다음 버튼
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "▶";
nextBtn.className = "page-nav-btn";
    nextBtn.className = "page-nav-btn";
    nextBtn.disabled = (currentPage >= totalPages - 1);
    nextBtn.onclick = () => {
        if (currentPage < totalPages - 1) {
            renderPostsByPage((currentPage + 1) * pageSize);
        }
    };
    pagContainer.appendChild(nextBtn);
}

// 5. 초성 순서 및 태그 관련 설정
const ORDER = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "A~Z", "0~9", "기타"];

const getInitial = (char) => {
    if (/[0-9]/.test(char)) return "0~9";
    if (/[A-Za-z]/.test(char)) return "A~Z";
    const table = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
    const code = char.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
        return table[Math.floor((code - 0xac00) / 588)];
    }
    return "기타";
};

// 6. 메인 실행 로직
document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");     // 검색어
    const tag = params.get("tag");     // 태그

    const resultTitle = document.getElementById("resultTitle");
    const postList = document.getElementById("postList");
    const resetTagBtn = document.getElementById("resetTagButton");
    const backBtn = document.getElementById("backBtn");

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            window.history.back();
        });
    }

    if (!query && !tag) {
        resultTitle.textContent = "검색어나 태그가 없습니다.";
        return;
    }

    if (tag) {
        resultTitle.textContent = `#${tag} 관련 게시물`;
        if (resetTagBtn) resetTagBtn.style.display = "inline-block";
    } else {
        resultTitle.textContent = `"${query}" 검색 결과`;
        if (resetTagBtn) resetTagBtn.style.display = "none";
    }

    // API 데이터 호출
    showLoading();
    try {
        const apiUrl = tag
            ? `/api/search?tag=${encodeURIComponent(tag)}`
            : `/api/search?keyword=${encodeURIComponent(query)}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        allPosts = Array.isArray(data.posts) ? data.posts : [];

        if (allPosts.length === 0) {
            postList.innerHTML = `<div class="no-result">
                <img src="/images/no_result.png" alt="결과없음">
                <p>관련 게시물이 없습니다.</p>
            </div>`;
        } else {
            // 첫 진입 시 0번(첫 페이지) 리스트 로드 실행
            renderPostsByPage(0);
        }
    } catch (err) {
        console.error("데이터 로드 오류:", err);
        postList.innerHTML = `<img src="/images/search_error.png" alt="오류"><p>데이터를 불러오지 못했습니다.</p>`;
    } finally {
        hideLoading();
    }

    // [전체 태그 보기 버튼 이벤트] - 태그 모드 전용
    if (resetTagBtn) {
        resetTagBtn.addEventListener("click", async () => {
            const tagListDiv = document.getElementById("koreanTagList");
            const pagContainer = document.getElementById("paginationContainer");
            const searchContainer = document.querySelector(".search-container");

            if (tagListDiv.style.display === "block") {
                tagListDiv.style.display = "none";
                if (searchContainer) searchContainer.style.display = ""; // 가로스크롤 박스 노출
                if (pagContainer) pagContainer.style.display = "flex"; // 페이지네이션 보이기
                resetTagBtn.textContent = "전체 태그 보기";
                return;
            }

            tagListDiv.style.display = "block";
            if (searchContainer) searchContainer.style.display = "none"; // 가로스크롤 박스 숨김
            if (pagContainer) pagContainer.style.display = "none"; // 페이지네이션 숨기기
            resetTagBtn.textContent = "개별 태그 보기";

            if (tagLoaded) return;
            tagListDiv.innerHTML = "태그 목록을 불러오는 중...";

            try {
                const response = await fetch("/api/korean-initials");
                const data = await response.json();
                tagLoaded = true;

                const initialGroups = {};
                data.tags.forEach(t => {
                    const initial = getInitial(t[0]);
                    if (!initialGroups[initial]) initialGroups[initial] = [];
                    initialGroups[initial].push(t);
                });

                tagListDiv.innerHTML = Object.keys(initialGroups)
                    .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
                    .map(initial => {
                        const buttons = initialGroups[initial]
                            .map(t => `<button class="tag-link-btn" data-tag="${t}">#${t}</button>`)
                            .join(" ");
                        return `<div><h4>${initial}</h4><hr><div class="tag-container">${buttons}</div></div>`;
                    }).join("");

                tagListDiv.onclick = (e) => {
                    if (e.target.classList.contains("tag-link-btn")) {
                        const selectedTag = e.target.getAttribute("data-tag");
                        location.href = `search?tag=${encodeURIComponent(selectedTag)}`;
                    }
                };
            } catch (err) {
                tagListDiv.innerHTML = "<p>태그를 불러오지 못했습니다.</p>";
            }
        });
    }
});
