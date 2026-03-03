
let allPosts = [];
let currentIndex = 0;
const pageSize = 10;
let isLoading = false;
let tagLoaded = false;
let loadingInterval = null;


const ORDER = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ",
  "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
  "A~Z",
  "0~9",
  "기타"
];

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


function renderNextPosts() {
  if (isLoading) return;
  isLoading = true;
  showLoadingSpinner();

  const nextPosts = allPosts.slice(currentIndex, currentIndex + pageSize);
  const postList = document.getElementById("postList");
  setTimeout(() => {
    postList.innerHTML += nextPosts.map(post => `
          <a class="post-item" href="post.html?file=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category_name)}&subcategory=${encodeURIComponent(post.subcategory_name)}">
              <img src="${post.file_path}" alt="미리보기 이미지">
            <div class="post-meta">
              <div class="category">${post.category_name} ▶ ${post.subcategory_name}</div>
                <div class="desc">
                    ${post.file_description.replace(/(<([^>]+)>)/gi, "").slice(0, 50)}...
                </div>
              </div>
              </a>
          `).join('');
    currentIndex += pageSize;
    hideLoadingSpinner();
    isLoading = false;
  }, 500);
}


// ✅ "목록으로" 버튼 클릭 시 이전 페이지로 이동
document.getElementById("backToListButton").addEventListener("click", () => {
  window.history.back(); // 🔥 이전 페이지로 이동
});



document.getElementById("resetTagButton").addEventListener("click", async () => {
  const tagListDiv = document.getElementById("koreanTagList");
  const toggleBtn = document.getElementById("resetTagButton");
  const postList = document.getElementById("postList");

  // 🔽 이미 열려 있으면 → 닫기
  if (tagListDiv.style.display === "block") {
    tagListDiv.style.display = "none";
    postList.style.display = "block";   // ✅ 게시글 다시 표시
    toggleBtn.textContent = "전체 태그 보기";
    return;
  }

  // 🔼 닫혀 있으면 → 열기
  tagListDiv.style.display = "block";
  postList.style.display = "none";      // ✅ 게시글 숨기기
  toggleBtn.textContent = "개별 태그 보기";


  // 이미 불러왔으면 다시 fetch 안 함
  if (tagLoaded) return;

  tagListDiv.innerHTML = "불러오는 중...";

  try {
    const response = await fetch("/api/korean-initials");
    const data = await response.json();

    const initialGroups = {};

    // 초성 판별 함수
    const getInitial = (char) => {

      // 숫자
      if (/[0-9]/.test(char)) return "0~9";

      // 영어
      if (/[A-Za-z]/.test(char)) return "A~Z";

      // 한글
      const table = [
        "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ",
        "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"
      ];
      const code = char.charCodeAt(0);
      if (code >= 0xac00 && code <= 0xd7a3) {
        return table[Math.floor((code - 0xac00) / 588)];
      }
      return "기타";
    };

    for (const tag of data.tags) {
      const initial = getInitial(tag[0]);
      if (!initialGroups[initial]) initialGroups[initial] = [];
      initialGroups[initial].push(tag);
    }

    // HTML 렌더링
    tagListDiv.innerHTML = Object.keys(initialGroups)
      .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
      .map(initial => {
        const buttons = initialGroups[initial]
          .map(tag => `<button onclick="location.href='tagResults.html?tag=${encodeURIComponent(tag)}'">#${tag}</button>`)
          .join(" ");
        return `<div><h4>${initial}</h4><hr><div id="tag-container">${buttons}</div></div>`;
      }).join("");

    tagListDiv.style.display = "block";
  } catch (err) {
    tagListDiv.innerHTML = "태그를 불러오지 못했습니다.";
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const tag = new URLSearchParams(location.search).get("tag");
  const tagTitle = document.getElementById("tagTitle");
  const postList = document.getElementById("postList");

  if (!tag) {
    tagTitle.textContent = "❌ 태그 없음";
    return;
  }

  tagTitle.textContent = `#${tag} 관련 게시물`;

  try {
    const response = await fetch(`/api/search?tag=${encodeURIComponent(tag)}`);
    const data = await response.json();

    allPosts = Array.isArray(data.posts) ? data.posts : [data.posts].filter(Boolean);

    if (allPosts.length === 0) {
      postList.innerHTML = "<li>관련 게시물이 없습니다.</li>";
      return;
    }

    renderNextPosts();

    // ✅ IntersectionObserver로 무한 스크롤 감지
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && currentIndex < allPosts.length) {
        renderNextPosts();
      }
    });
    const scrollTrigger = document.createElement("div");
    scrollTrigger.id = "scrollTrigger";
    document.body.appendChild(scrollTrigger);
    observer.observe(scrollTrigger);
  } catch (err) {
    console.error("❌ 검색 중 오류:", err);
    postList.innerHTML = "<p>검색 오류가 발생했습니다.</p>";
  }
});