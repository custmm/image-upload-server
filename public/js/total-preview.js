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

    for (const catName of categories) {
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
                    
                    // 1. 인라인 속성(onerror, onclick)을 제거한 클린한 HTML 생성
                    postCard.innerHTML = `
                        <img src="${post.file_path}" alt="${post.title}" class="post-thumb">
                        <p>${post.title}</p>
                    `;

                    // 2. [수정] onerror를 대체하는 이벤트 리스너 추가
                    const img = postCard.querySelector('.post-thumb');
                    img.addEventListener('error', function() {
                        this.src = '/images/no_result.png';
                    });

                    // 3. [수정] onclick 속성 대신 addEventListener 사용 (CSP 준수)
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

    // 2. 모든 렌더링이 끝난 후, targetCategory가 있다면 해당 위치로 이동
if (targetCategory) {
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

document.addEventListener("DOMContentLoaded", loadTotalPreview);