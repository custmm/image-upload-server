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
    // 컨테이너 초기화 (중복 방지)
    container.innerHTML = "";

    for (const catName of categories) {
        const section = document.createElement("section");
        section.className = "category-group";

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
            // API 호출 (서버의 router.get("/") 주소와 일치해야 함)
            const response = await fetch(`/api/posts?category=${encodeURIComponent(catName)}`);
            if (!response.ok) throw new Error("서버 응답 오류");
            
            const posts = await response.json();
            const listDiv = document.getElementById(`list-${catName}`);
            listDiv.innerHTML = ""; // 로딩 메시지 제거

            if (posts && posts.length > 0) {
                posts.forEach(post => {
                    const postCard = document.createElement("div");
                    postCard.className = "post-card";
                    
                    // post.file_path와 post.title은 DB 컬럼명과 대소문자까지 일치해야 합니다.
                    postCard.innerHTML = `
                        <img src="${post.file_path}" alt="${post.title}" 
                             onerror="this.src='/img/default.png'">
                        <p>${post.title}</p>
                    `;
                    
                    // 클릭 시 상세 페이지 이동 (필요 시 주석 해제)
                    postCard.onclick = () => location.href = `/post.html?id=${post.id}`;
                    
                    listDiv.appendChild(postCard);
                });
            } else {
                listDiv.innerHTML = "<p class='no-data'>등록된 게시글이 없습니다.</p>";
            }
        } catch (err) {
            console.error(`${catName} 로드 실패:`, err);
            const listDiv = document.getElementById(`list-${catName}`);
            listDiv.innerHTML = "<p class='error'>데이터를 불러오지 못했습니다.</p>";
        }
    }
    
    // 모든 섹션이 생성된 후 아이콘 렌더링
    if (window.lucide) {
        lucide.createIcons();
    }
}

document.addEventListener("DOMContentLoaded", loadTotalPreview);