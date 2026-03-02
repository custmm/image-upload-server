

document.addEventListener("DOMContentLoaded", async function () {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const keywordElement = document.getElementById("searchKeyword");
    const resultsContainer = document.getElementById("searchResults");

    let currentIndex = 0;
    const batchSize = 8;
    let filteredPosts = [];

    function createLoadingImage(size = 80) {
        const img = document.createElement("img");
        img.src = "/images/loading.gif"; // 🔥 네 로딩 이미지 경로
        img.style.width = `${size}px`;
        img.style.height = `${size}px`;
        img.style.display = "block";
        img.style.margin = "0 auto";

        let angle = 0;
        loadingInterval = setInterval(() => {
            angle += 6;
            img.style.transform = `rotate(${angle}deg)`;
        }, 16);

        return img;
    }


    function stopLoadingAnimation() {
        if (loadingInterval) {
            clearInterval(loadingInterval);
            loadingInterval = null;
        }
    }

    function showLoadingSpinner() {
        if (document.getElementById("loadingSpinner")) return;

        const spinner = document.createElement("div");
        spinner.id = "loadingSpinner";
        spinner.style.textAlign = "center";
        spinner.style.margin = "20px 0";

        const img = createLoadingImage(80);

        spinner.appendChild(img);
        document.getElementById("postList").appendChild(spinner);
    }

    function hideLoadingSpinner() {
        const spinner = document.getElementById("loadingSpinner");
        if (spinner) {
            stopLoadingAnimation();
            spinner.remove();
        }
    }


    if (!query) {
        keywordElement.textContent = "검색어가 없습니다.";
        return;
    }

    keywordElement.textContent = `"${query}" 검색 결과`;

    try {

        // 🔥 서버에서 실제 게시글 가져오기
        const response = await fetch("/api/files");
        const data = await response.json();

        // 🔥 배열이 어디에 있는지 추출
        const posts = Array.isArray(data)
            ? data
            : data.files || data.data || data.posts || [];
        console.log("API 응답:", posts);

        // 🔥 대소문자 구분 없이 검색
        const filteredPosts = posts.filter(post =>
            (post.file_name && post.file_name.toLowerCase().includes(query.toLowerCase())) ||
            (post.title && post.title.toLowerCase().includes(query.toLowerCase())) ||
            (post.description && post.description.toLowerCase().includes(query.toLowerCase()))
        );

        if (filteredPosts.length === 0) {
            resultsContainer.innerHTML = "<p>검색 결과가 없습니다.</p>";
            return;
        }

        loadMore(); // 🔥 처음 1번 실행

        filteredPosts.forEach(post => {

            const item = document.createElement("div");
            item.classList.add("search-item");

            item.innerHTML = `
        <img src="${post.file_path}" alt="${post.title}">
        <h3>${post.title}</h3>
        <p>${post.description || ""}</p>
      `;

            item.addEventListener("click", () => {
                window.location.href =
                    `post.html?file=${encodeURIComponent(post.file_name)}&category=${encodeURIComponent(post.category_name)}&subcategory=${encodeURIComponent(post.subcategory_name)}`;
            });

            resultsContainer.appendChild(item);

        });

    } catch (error) {
        console.error("검색 중 오류:", error);
        resultsContainer.innerHTML = "<p>데이터를 불러오지 못했습니다.</p>";
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
                    `post.html?file=${encodeURIComponent(post.file_name)}&category=${encodeURIComponent(post.category_name)}&subcategory=${encodeURIComponent(post.subcategory_name)}`;
            });

            resultsContainer.appendChild(item);
        });

        currentIndex += batchSize;
        hideLoadingSpinner();
        isLoading = false;
    }

    window.addEventListener("scroll", () => {

        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {

            if (currentIndex < filteredPosts.length) {
                loadMore();
            }

        }

    });


});