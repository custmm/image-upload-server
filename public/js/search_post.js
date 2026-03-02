// 1. URL에서 검색어 가져오기
const params = new URLSearchParams(window.location.search);
const query = params.get("q");

const keywordElement = document.getElementById("searchKeyword");
const resultsContainer = document.getElementById("searchResults");

if (!query) {
  keywordElement.textContent = "검색어가 없습니다.";
} else {
  keywordElement.textContent = `"${query}" 검색 결과`;

  // 2. 데이터 로드 (여기선 예시용)
  const posts = JSON.parse(localStorage.getItem("posts")) || [];

  // 3. 필터링
  const filtered = posts.filter(post =>
    post.title.includes(query) ||
    post.description.includes(query)
  );

  // 4. 결과 출력
  if (filtered.length === 0) {
    resultsContainer.innerHTML = "<p>검색 결과가 없습니다.</p>";
  } else {
    filtered.forEach(post => {
      const item = document.createElement("div");
      item.classList.add("search-item");

      item.innerHTML = `
        <img src="${post.image}" alt="${post.title}">
        <h3>${post.title}</h3>
        <p>${post.description}</p>
      `;

      item.addEventListener("click", () => {
        window.location.href = `post.html?id=${post.id}`;
      });

      resultsContainer.appendChild(item);
    });
  }
}