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

    // URL 파라미터 유효성 검사 및 바인딩
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
            <div class="image-gallery grid-layout" id="list-${catName}">
                <p class="loading">썸네일을 불러오는 중...</p>
            </div>
        `;
        container.appendChild(section);

        try {
            // 서버 엔드포인트 호출
            const response = await fetch(`/api/posts?category=${encodeURIComponent(catName)}`);
            if (!response.ok) throw new Error(`서버 통신 실패`);
            
            const resJson = await response.json();
            
            // 데이터 배열 추출 방어막
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
                    const imageContainer = document.createElement("div");
                    imageContainer.className = "image-container appear-ani aos-init aos-animate is-visible";
                    
                    const imgSrc = post.file_path || post.path || '/images/no_result.png';
                    const postTitle = post.title || '제목 없음';

                    imageContainer.innerHTML = `
                        <div class="thumb-wrapper" style="position: relative; overflow: hidden; cursor: pointer;">
                            <img src="${imgSrc}" alt="${postTitle}" class="post-thumb" style="width: 100%; height: 100%; object-fit: cover;">
                            <div class="hover-overlay" style="position: absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; opacity:0; transition: opacity 0.3s ease; background: rgba(0,0,0,0.5); color:#fff; font-size:12px;">
                                클릭 시 자세히 볼 수 있습니다
                            </div>
                        </div>
                        <p class="thumb-title" style="margin-top: 8px; font-weight: bold; text-align: center;">${postTitle}</p>
                    `;

                    // 🛠️ [주소 수정] 프로젝트 라우팅 구조에 맞춰 앞에 /를 빼고 상대 경로로 정확히 연결합니다.
                    imageContainer.addEventListener('click', () => {
                        window.location.href = `post?id=${post.id}`;
                    });

                    // 호버 효과 및 에러 처리 리스너
                    const wrapper = imageContainer.querySelector('.thumb-wrapper');
                    const overlay = imageContainer.querySelector('.hover-overlay');
                    if (wrapper && overlay) {
                        wrapper.addEventListener('mouseenter', () => overlay.style.opacity = '1');
                        wrapper.addEventListener('mouseleave', () => overlay.style.opacity = '0');
                    }

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

document.addEventListener("DOMContentLoaded", () => {
    loadTotalPreview();

    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.href = 'preview.html';
        });
    }
});