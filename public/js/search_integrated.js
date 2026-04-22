// 1. 전역 상태 변수
let allPosts = [];
let currentIndex = 0;
const pageSize = 10;
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

// 3. 게시글 렌더링 함수 (통합 UI 적용)
function renderNextPosts() {
    if (isLoading) return;
    isLoading = true;

    const postList = document.getElementById("postList");
    const nextPosts = allPosts.slice(currentIndex, currentIndex + pageSize);

    // 약간의 딜레이를 주어 자연스러운 로딩 연출
    setTimeout(() => {
        const html = nextPosts.map(post => `
            <div class="post-item" href="post?id=${post.id}">
                <div class="search_image">
                    <img src="${post.file_path || '/images/no-image.png'}" alt="${post.title}">
                </div>
                <a class="post-meta">
                    <div class="category">
                        ${post.category_name || ""} ▶ ${post.subcategory_name || ""}
                    </div>
                    <div class="search_title">
                        <h3>${post.title}</h3>
                    </div>
                    <div class="desc">
                        ${(post.text || post.title || "").replace(/(<([^>]+)>)/gi, "").slice(0, 50)}...
                    </div>
                </a>
            </div>
        `).join('');

        postList.insertAdjacentHTML('beforeend', html);
        currentIndex += pageSize;
        isLoading = false;
    }, 300);
}

// 4. 초성 순서 및 태그 관련 설정
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

// 5. 메인 실행 로직
document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");     // 검색어
    const tag = params.get("tag");     // 태그
    
    const resultTitle = document.getElementById("resultTitle");
    const postList = document.getElementById("postList");
    const resetTagBtn = document.getElementById("resetTagButton");
    const backBtn = document.getElementById("backButton");

    // [뒤로가기 설정]
    if (backBtn) {
        backBtn.onclick = () => window.history.back();
    }

    // [검색어/태그 유무 판별]
    if (!query && !tag) {
        resultTitle.textContent = "검색어나 태그가 없습니다.";
        return;
    }

    // UI 모드 설정
    if (tag) {
        resultTitle.textContent = `#${tag} 관련 게시물`;
        if (resetTagBtn) resetTagBtn.style.display = "inline-block";
    } else {
        resultTitle.textContent = `"${query}" 검색 결과`;
        if (resetTagBtn) resetTagBtn.style.display = "none";
    }

    // [API 데이터 호출]
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
            renderNextPosts();
        }
    } catch (err) {
        console.error("데이터 로드 오류:", err);
        postList.innerHTML = `<img src="/images/search_error.png" alt="오류"><p>데이터를 불러오지 못했습니다.</p>`;
    } finally {
        hideLoading();
    }

    // [무한 스크롤 설정]
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && currentIndex < allPosts.length) {
            renderNextPosts();
        }
    });
    const scrollTrigger = document.getElementById("scrollTrigger");
    if (scrollTrigger) observer.observe(scrollTrigger);

    // [전체 태그 보기 버튼 이벤트] - 태그 모드 전용
    if (resetTagBtn) {
        resetTagBtn.addEventListener("click", async () => {
            const tagListDiv = document.getElementById("koreanTagList");
            if (tagListDiv.style.display === "block") {
                tagListDiv.style.display = "none";
                postList.style.display = "";
                resetTagBtn.textContent = "전체 태그 보기";
                return;
            }

            tagListDiv.style.display = "block";
            postList.style.display = "none";
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
                        location.href = `search.html?tag=${encodeURIComponent(selectedTag)}`;
                    }
                };
            } catch (err) {
                tagListDiv.innerHTML = "<p>태그를 불러오지 못했습니다.</p>";
            }
        });
    }
});