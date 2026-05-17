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
    const urlParams = new URLSearchParams(window.location.search);
    const targetCategory = urlParams.get('category');

    container.innerHTML = "";

    // [핵심 수정] URL에 category 값이 있고, 그것이 유효한 카테고리라면 해당 카테고리만 배열에 담아 루프를 돕니다.
    // 값이 없거나 일치하는 게 없다면 기존 전체 리스트를 사용합니다.
    let displayCategories = categories;
    if (targetCategory && categories.includes(targetCategory)) {
        displayCategories = [targetCategory];
    }

    for (const catName of displayCategories) {
        const section = document.createElement("section");
        section.className = "category-group";
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
                        <img src="${post.file_path}" alt="${post.title}" class="post-thumb">
                        <p>${post.title}</p>
                    `;

                    const img = postCard.querySelector('.post-thumb');
                    img.addEventListener('error', function () {
                        this.src = '/images/no_result.png';
                    });

                    postCard.addEventListener('click', () => {
                        location.href = `/post?id=${post.id}`;
                    });

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

    // 단일 카테고리 모드일 때는 스크롤 이동 및 하이라이트가 필요 없으므로, 전체 보기 모드일 때만 동작하도록 설정합니다.
    if (targetCategory && displayCategories.length > 1) {
        setTimeout(() => {
            const targetEl = document.getElementById(`section-${targetCategory}`);
            if (targetEl) {
                const offset = 80;
                const elementPosition = targetEl.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                targetEl.classList.add("highlight-section");
            }
        }, 200);
    }
}

// [수정] 중복되던 DOMContentLoaded 이벤트 핸들러를 하나로 통합하고 CSP를 준수하도록 정돈했습니다.
document.addEventListener("DOMContentLoaded", () => {
    // 1. 데이터 로딩 함수 실행
    loadTotalPreview();

    // 2. 뒤로가기 버튼에 클릭 이벤트 리스너 추가
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.href = 'preview.html';
        });
    }
});