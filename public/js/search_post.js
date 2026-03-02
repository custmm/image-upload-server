document.addEventListener("DOMContentLoaded", async function () {

    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");

    const keywordElement = document.getElementById("searchKeyword");
    const resultsContainer = document.getElementById("searchResults");

    if (!query) {
        keywordElement.textContent = "검색어가 없습니다.";
        return;
    }

    keywordElement.textContent = `"${query}" 검색 결과`;

    try {

        // 🔥 서버에서 실제 게시글 가져오기
        const response = await fetch("/api/posts");
        const posts = await response.json();

        // 🔥 대소문자 구분 없이 검색
        const filtered = posts.filter(post =>
            (post.title && post.title.toLowerCase().includes(query.toLowerCase())) ||
            (post.description && post.description.toLowerCase().includes(query.toLowerCase()))
        );

        if (filtered.length === 0) {
            resultsContainer.innerHTML = "<p>검색 결과가 없습니다.</p>";
            return;
        }

        filtered.forEach(post => {

            const item = document.createElement("div");
            item.classList.add("search-item");

            item.innerHTML = `
        <img src="${post.image}" alt="${post.title}">
        <h3>${post.title}</h3>
        <p>${post.description || ""}</p>
      `;

            item.addEventListener("click", () => {
                window.location.href = `post.html?id=${post.id}`;
            });

            resultsContainer.appendChild(item);

        });

    } catch (error) {
        console.error("검색 중 오류:", error);
        resultsContainer.innerHTML = "<p>데이터를 불러오지 못했습니다.</p>";
    }

});