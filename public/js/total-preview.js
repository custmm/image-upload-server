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
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const targetCategory = urlParams.get('category');

    container.innerHTML = "";

    // URL 파라미터가 유효하면 해당 카테고리만 배열에 저장 (단일 카테고리 로딩)
    let displayCategories = categories;
    if (targetCategory && categories.includes(targetCategory)) {
        displayCategories = [targetCategory];
    }

    for (const catName of displayCategories) {
        const section = document.createElement("section");
        section.className = "category-group";
        section.id = `section-${catName}`;

        const iconName = iconMap[catName] || "folder";
        
        // [핵심 변경] preview 페이지의 느낌을 내기 위해 내부 리스트 컨테이너 클래스를 'image-gallery' 구조로 명명
        section.innerHTML = `
            <div class="category-header">
                <i data-lucide="${iconName}"></i>
                <h2>${catName}</h2>
            </div>
            <div class="image-gallery grid-layout" id="list-${catName}">
                <p class="loading">썸네일을 불러오는 중...</p>
            </div>
        `;
        container.appendChild(section);

        try {
            // 프로젝트 백엔드 라우터 규칙에 맞춰 /api/posts 혹은 /api/files 중 매핑되는 주소를 사용합니다.
            const response = await fetch(`/api/posts?category=${encodeURIComponent(catName)}`);
            if (!response.ok) throw new Error(`서버 통신 실패`);
            
            const resJson = await response.json();
            
            // 데이터 배열 추출 예외 처리
            let posts = [];
            if (Array.isArray(resJson)) {
                posts = resJson;
            } else if (resJson) {
                posts = resJson.posts || resJson.files || [];
            }

            const listDiv = document.getElementById(`list-${catName}`);
            if (!listDiv) continue;
            listDiv.innerHTML = "";

            if (posts && posts.length > 0) {
                posts.forEach(post => {
                    // preview.html의 바둑판 모드 아이템 구조와 일치하는 컨테이너 생성
                    const imageContainer = document.createElement("div");
                    imageContainer.className = "image-container appear-ani aos-init aos-animate is-visible";
                    
                    // file_path 속성이 누락되었을 때 path 등으로 유연하게 잡히도록 처리
                    const imgSrc = post.file_path || post.path || '/images/no_result.png';
                    const postTitle = post.title || '제목 없음';

                    // 썸네일 전용 레이아웃 생성
                    imageContainer.innerHTML = `
                        <div class="thumb-wrapper" style="position: relative; overflow: hidden; cursor: pointer;">
                            <img src="${imgSrc}" alt="${postTitle}" class="post-thumb" style="width: 100%; height: 100%; object-fit: cover;">
                            <div class="hover-overlay" style="position: absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; opacity:0; transition: opacity 0.3s ease; background: rgba(0,0,0,0.5); color:#fff; font-size:12px;">
                                클릭 시 자세히 볼 수 있습니다
                            </div>
                        </div>
                        <p class="thumb-title" style="margin-top: 8px; font-weight: bold; text-align: center;">${postTitle}</p>
                    `;

                    // [기능 구현] 이미지 썸네일(카드) 누르면 해당 post 상세 페이지로 바로 연결!
                    imageContainer.addEventListener('click', () => {
                        window.location.href = `/post?id=${post.id}`;
                    });

                    // 마우스 오버 시 오버레이 효과 리스너
                    const wrapper = imageContainer.querySelector('.thumb-wrapper');
                    const overlay = imageContainer.querySelector('.hover-overlay');
                    if (wrapper && overlay) {
                        wrapper.addEventListener('mouseenter', () => overlay.style.opacity = '1');
                        wrapper.addEventListener('mouseleave', () => overlay.style.opacity = '0');
                    }

                    // 이미지 로드 깨짐 처리 방어코드
                    const img = imageContainer.querySelector('.post-thumb');
                    img.addEventListener('error', function () {
                        this.src = '/images/no_result.png';
                    });

                    listDiv.appendChild(imageContainer);
                });
            } else {
                listDiv.innerHTML = "<p class='no-data'>등록된 게시글 썸네일이 없습니다.</p>";
            }
        } catch (err) {
            console.error(err);
            const listDiv = document.getElementById(`list-${catName}`);
            if (listDiv) {
                listDiv.innerHTML = "<p class='error-data'>썸네일 데이터를 불러오지 못했습니다.</p>";
            }
        }
    }

    if (window.lucide) lucide.createIcons();

    // 전체 보기 모드에서 파라미터가 있을 때 포커싱 타겟 스크롤
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

// 이벤트 초기화 위임
document.addEventListener("DOMContentLoaded", () => {
    loadTotalPreview();

    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.href = 'preview.html';
        });
    }
});