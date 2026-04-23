const iconMap = {
    "퍼즐": "puzzle",
    "보석비즈": "gem",
    "3D퍼즐": "box",
    "디폼블럭": "grid-3x3",
    "브릭피규어": "toy-brick"
};

const categories = ["퍼즐", "보석비즈", "3D퍼즐", "디폼블럭", "브릭피규어"];
const container = document.getElementById("total-gallery-container");

async function loadTotalPreview() {
    // 1. URL에서 "category" 파라미터 가져오기 (예: 퍼즐)
    const urlParams = new URLSearchParams(window.location.search);
    const targetCategory = urlParams.get('category');

    container.innerHTML = "";

    for (const catName of categories) {
        const section = document.createElement("section");
        section.className = "category-group";
        // 중요: 스크롤 위치를 찾을 수 있도록 ID를 부여합니다.
        section.id = `section-${catName}`; 

        const iconName = iconMap[catName] || "folder";
        section.innerHTML = `
            <div class="category-header">
                <i data-lucide="${iconName}"></i>
                <h2>${catName}</h2>
            </div>
            <div class="post-list" id="list-${catName}">
                <p class="loading">불러오는 중...</p>
            </div>
        `;
        container.appendChild(section);

        // ... [데이터 fetch 로직은 이전과 동일] ...
        try {
            const response = await fetch(`/api/posts?category=${encodeURIComponent(catName)}`);
            const posts = await response.json();
            const listDiv = document.getElementById(`list-${catName}`);
            listDiv.innerHTML = ""; 

            if (posts && posts.length > 0) {
                posts.forEach(post => {
                    const postCard = document.createElement("div");
                    postCard.className = "post-card";
                    postCard.innerHTML = `
                        <img src="${post.file_path}" alt="${post.title}" onerror="this.src='/img/default.png'">
                        <p>${post.title}</p>
                    `;
                    postCard.onclick = () => location.href = `/post.html?id=${post.id}`;
                    listDiv.appendChild(postCard);
                });
            } else {
                listDiv.innerHTML = "<p class='no-data'>등록된 게시글이 없습니다.</p>";
            }
        } catch (err) {
            console.error(err);
        }
    }

    if (window.lucide) lucide.createIcons();

    // 2. 모든 렌더링이 끝난 후, targetCategory가 있다면 해당 위치로 이동
    if (targetCategory) {
        // 브라우저가 요소를 완전히 배치할 시간을 주기 위해 아주 잠깐 대기(100ms)
        setTimeout(() => {
            const targetEl = document.getElementById(`section-${targetCategory}`);
            if (targetEl) {
                // 상단 헤더 바 높이(예: 80px)를 고려해서 부드럽게 이동
                const offset = 80; 
                const elementPosition = targetEl.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });

                // 강조 효과: 해당 카테고리 제목을 살짝 흔들거나 색을 바꿀 수 있습니다.
                targetEl.classList.add("highlight-section");
            }
        }, 200);
    }
}

document.addEventListener("DOMContentLoaded", loadTotalPreview);