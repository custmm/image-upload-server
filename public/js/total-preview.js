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

    // 1. URL에 category 값이 있고 유효하다면 [해당 카테고리만] 리스트로 설정하여 봅니다.
    // 값이 없거나 이상한 값이면 전체 카테고리를 다 보여줍니다.
    let displayCategories = categories;
    if (targetCategory && categories.includes(targetCategory)) {
        displayCategories = [targetCategory];
    }

    // 2. 설정된 카테고리 루프 수행 (단일 카테고리 선택 시 1번만 실행됨)
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
            // 사이드바에서 선택해 들어온 카테고리 명을 안전하게 인코딩하여 서버에 API 요청
            const response = await fetch(`/api/posts?category=${encodeURIComponent(catName)}`);
            if (!response.ok) throw new Error(`서버 응답 에러: ${response.status}`);
            
            const resJson = await response.json();
            
            // [데이터 파싱 구조 안전 장치] 
            // 서버가 배열 형태든 { files: [...] } 형태든 { posts: [...] } 형태든 전부 맞춰서 꺼내옵니다.
            let posts = [];
            if (Array.isArray(resJson)) {
                posts = resJson;
            } else if (resJson) {
                posts = resJson.posts || resJson.files || [];
            }

            const listDiv = document.getElementById(`list-${catName}`);
            listDiv.innerHTML = "";

            // 3. 받아온 해당 카테고리의 게시글이 있을 경우 썸네일 카드 생성 및 바인딩
            if (posts && posts.length > 0) {
                posts.forEach(post => {
                    const postCard = document.createElement("div");
                    postCard.className = "post-card";

                    // 이미지 경로 속성 매핑 (file_path 혹은 path 대응)
                    const imgSrc = post.file_path || post.path || '/images/no_result.png';

                    postCard.innerHTML = `
                        <img src="${imgSrc}" alt="${post.title || '게시물'}" class="post-thumb">
                        <p>${post.title || '제목 없음'}</p>
                    `;

                    // 이미지 로드 에러 처리 (CSP 정책 준수를 위해 애드이벤트리스너 방식 유지)
                    const img = postCard.querySelector('.post-thumb');
                    img.addEventListener('error', function () {
                        this.src = '/images/no_result.png';
                    });

                    // 썸네일 클릭 시 상세 보기 페이지 이동
                    postCard.addEventListener('click', () => {
                        location.href = `/post?id=${post.id}`;
                    });

                    listDiv.appendChild(postCard);
                });
            } else {
                listDiv.innerHTML = "<p class='no-data'>등록된 게시글이 없습니다.</p>";
            }
        } catch (err) {
            console.error(`${catName} 데이터 로딩 실패:`, err);
            const listDiv = document.getElementById(`list-${catName}`);
            if (listDiv) {
                listDiv.innerHTML = "<p class='error-data'>데이터를 불러오는 중 오류가 발생했습니다.</p>";
            }
        }
    }

    // Lucide 아이콘 라이브러리 갱신
    if (window.lucide) lucide.createIcons();

    // 4. [수정됨] 전체 보기 모드에서 특정 카테고리로 스크롤 튕겨주는 기능 보정
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

// DOM 로드 완료 후 이벤트 통합 실행 및 CSP 준수
document.addEventListener("DOMContentLoaded", () => {
    // 페이지 데이터 렌더링 시작
    loadTotalPreview();

    // 뒤로가기 버튼 이벤트 처리
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.href = 'preview.html';
        });
    }
});