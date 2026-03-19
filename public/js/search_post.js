let loaderStep = 1;
let loaderInterval = null;

function showLoading() {
    const indicator = document.getElementById("loadingIndicator");
    const loader = document.getElementById("mainLoader");

    indicator.style.display = "flex";

    loaderInterval = setInterval(() => {
        loaderStep++;
        if (loaderStep > 4) loaderStep = 1;

        loader.className = "loader loader" + loaderStep;
    }, 1000); // 속도 조절 가능
}

function hideLoading() {
    clearInterval(loaderInterval);
    loaderInterval = null;

    document.getElementById("loadingIndicator").style.display = "none";
}

function normalize(text) {
    return (text || "")
        .toString()
        .toLowerCase()
        .normalize("NFC")              // 한글 정규화
        .replace(/\s+/g, "")           // 공백 제거
        .replace(/[^\w가-힣]/g, "");   // 특수문자 제거
}

document.addEventListener("DOMContentLoaded", async function () {


    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const keywordElement = document.getElementById("searchKeyword");
    const resultsContainer = document.getElementById("searchResults");

    let currentIndex = 0;
    const batchSize = 8;
    let filteredPosts = [];
    let isLoading = false;


    if (!query) {
        keywordElement.textContent = "검색어가 없습니다.";
        return;
    }

    keywordElement.textContent = `"${query}" 검색 결과`;

    try {

        // 🔥 서버에서 실제 게시글 가져오기
        const response = await fetch(`/api/search?keyword=${encodeURIComponent(query)}`);
        const data = await response.json();

        // 🔥 배열이 어디에 있는지 추출
        const posts = data.posts || [];
        console.log("API 응답:", posts);

        filteredPosts = posts;
        console.log("전체 게시글 수:", posts.length);
        console.log("매칭된 게시글 수:", filteredPosts.length);
        console.log("매칭 제목들:", filteredPosts.map(p => p.title));

        if (filteredPosts.length === 0) {
            resultsContainer.innerHTML =
                `<img src="/images/no_result.png" alt="검색결과없음"><p>검색 결과가 없습니다.</p>`;
            return;
        }

        loadMore(); // 🔥 처음 1번 실행

    } catch (error) {
        console.error("검색 중 오류:", error);
        resultsContainer.innerHTML =
            `<img src="/images/search_error.png" alt="검색오류"><p>데이터를 불러오지 못했습니다.</p>`;
    }

    function loadMore() {
        if (isLoading) return;
        isLoading = true;
        showLoadingSpinner();

        const nextPosts = filteredPosts.slice(currentIndex, currentIndex + batchSize);

        nextPosts.forEach(post => {

            const item = document.createElement("div");
            item.classList.add("search-item");

            item.innerHTML = `
            <img src="${post.file_path}" alt="${post.title}">
            <h3>${post.title}</h3>
        `;

            item.addEventListener("click", () => {
                window.location.href =
                    `post?id=${post.id}`;
            });

            resultsContainer.appendChild(item);
        });

        currentIndex += batchSize;
        hideLoadingSpinner();
        isLoading = false;

        // 🔥 화면이 아직 짧으면 자동 추가 로딩
        if (currentIndex < filteredPosts.length &&
            document.documentElement.scrollHeight <= window.innerHeight) {
            loadMore();
        }
    }

    window.addEventListener("scroll", () => {
        console.log("스크롤 감지됨");
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const fullHeight = document.documentElement.scrollHeight;

        if (scrollTop + windowHeight >= fullHeight - 100) {
            if (currentIndex < filteredPosts.length) {
                loadMore();
            }
        }
    });
});