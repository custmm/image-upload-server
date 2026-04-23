// 1. 기존 아이콘 매핑 데이터 그대로 사용
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
    for (const catName of categories) {
        // 섹션 생성
        const section = document.createElement("section");
        section.className = "category-group";

        // 제목 부분 (기존 아이콘 적용)
        const iconName = iconMap[catName] || "folder";
        section.innerHTML = `
            <div class="category-header">
                <i data-lucide="${iconName}"></i>
                <h2>${catName}</h2>
            </div>
            <div class="post-list" id="list-${catName}">
                </div>
        `;
        container.appendChild(section);

        // 데이터 가져오기
        try {
            const response = await fetch(`/api/posts?category=${encodeURIComponent(catName)}`);
            const posts = await response.json();
            
            const listDiv = document.getElementById(`list-${catName}`);
            if (posts && posts.length > 0) {
                posts.forEach(post => {
                    const postCard = document.createElement("div");
                    postCard.className = "post-card";
                    postCard.innerHTML = `
                        <img src="${post.file_path}" alt="${post.title}">
                        <p>${post.title}</p>
                    `;
                    listDiv.appendChild(postCard);
                });
            } else {
                listDiv.innerHTML = "<p class='no-data'>게시글이 없습니다.</p>";
            }
        } catch (err) {
            console.error(`${catName} 로드 실패:`, err);
        }
    }
    
    // Lucide 아이콘 초기화
    if (window.lucide) lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", loadTotalPreview);