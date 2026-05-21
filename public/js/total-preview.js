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

    // URL에 category 값이 있고 유효하다면 해당 카테고리만 루프를 돕니다.
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
            // 프로젝트 백엔드 스펙에 맞게 /api/posts 대신 /api/files 또는 해당 API 주소를 사용하세요.
            // 여기서는 쿼리 스트링으로 카테고리명을 안전하게 인코딩하여 전달합니다.
            const response = await fetch(`/api/posts?category=${encodeURIComponent(catName)}`);
            if (!response.ok) throw new Error(`데이터 로드 실패 (상태 코드: ${response.status})`);
            
            const resJson = await response.json();
            
            // 데이터 추출 방어 코드: 응답이 배열이면 그대로 쓰고, 객체 형태라면 posts나 files 속성을 탐색합니다.
            let posts = [];
            if (Array.isArray(resJson)) {
                posts = resJson;
            } else if (resJson) {
                posts = resJson.posts || resJson.files || [];
            }

            const listDiv = document.getElementById(`list-${catName}`);
            listDiv.innerHTML = "";

            if (posts && posts.length > 0) {
                posts.forEach(post => {
                    const postCard = document.createElement("div");
                    postCard.className = "post-card";

                    // 데이터 구조에 따라 file_path 혹은 다른 경로 속성을 유연하게 매핑합니다.
                    const imgSrc = post.file_path || post.path || '/images/no_result.png';

                    postCard.innerHTML = `
                        <img src="${imgSrc}" alt="${post.title || '게시물'}" class="post-thumb">
                        <p>${post.title || '제목 없음'}</p>
                    `;

                    // 이미지 로드 실패 시 대체 이미지 처리 (인라인 onerror 제거로 CSP 준수)
                    const img = postCard.querySelector('.post-thumb');
                    img.addEventListener('error', function () {
                        this.src = '/images/no_result.png';
                    });

                    // 카드 클릭 시 상세 페이지 이동
                    postCard.addEventListener('click', () => {
                        location.href = `/post?id=${post.id}`;
                    });

                    listDiv.appendChild(postCard);
                });
            } else {
                listDiv.innerHTML = "<p class='no-data'>등록된 게시글이 없습니다.</p>";
            }
        } catch (err) {
            console.error(`${catName} 카테고리 로딩 중 에러 발생:`, err);
            const listDiv = document.getElementById(`list-${catName}`);
            if (listDiv) {
                listDiv.innerHTML = "<p class='error-data'>데이터를 불러오는 중 오류가 발생했습니다.</p>";
            }
        }
    }

    // Lucide 아이콘 동적 생성
    if (window.lucide) lucide.createIcons();

    // 전체 보기 모드에서 특정 카테고리가 지정되었을 때 스크롤 이동 및 하이라이트 효과 적용
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

// 중복 핸들러 통합 및 CSP 준수 리스너 등록
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