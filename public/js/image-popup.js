let popupOffset = 0;
const popupLimit = 24;
let isPopupLoading = false; // 로딩 상태 변수 추가
let noMoreImages = false;    // 더 가져올 이미지가 없는지 확인

// --- 로딩 애니메이션 함수 (모듈 내부에서 정의하거나 import) ---
let loaderStep = 1;
let loaderInterval = null;

function showLoading() {
    const indicator = document.getElementById("loadingIndicator");
    const loader = document.getElementById("mainLoader");
    if (!indicator || !loader) return;

    indicator.style.display = "flex";
    if (loaderInterval) clearInterval(loaderInterval); // 중복 방지

    loaderInterval = setInterval(() => {
        loaderStep++;
        if (loaderStep > 4) loaderStep = 1;
        loader.className = "loader loader" + loaderStep;
    }, 150);
}

function hideLoading() {
    if (loaderInterval) {
        clearInterval(loaderInterval);
        loaderInterval = null;
    }
    const indicator = document.getElementById("loadingIndicator");
    if (indicator) indicator.style.display = "none";
}

// ── [유틸리티: 쓰로틀링 함수] ───────────────────────────────
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// ── [메인 팝업 로직 수정] ──────────────────────────────────
export function openImagePopup() {
    const overlay = document.createElement("div");
    overlay.id = "imageModePopup";
    overlay.className = "popup-overlay"; 
    
    // 스타일을 직접 제어하여 크기를 적절하게 조절합니다.
    overlay.innerHTML = `
        <div class="popup-container modal-style">
            <div class="popup-header">
                <div class="header-info">
                    <h2>이미지 모드</h2>
                    <span id="popupCountDisplay">불러오는 중...</span>
                </div>
                <button id="closeImagePopupBtn">×</button>
            </div>
            <div id="popupGallery" class="popup-gallery"></div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden"; 

    // 1. 닫기 버튼 이벤트
    document.getElementById("closeImagePopupBtn").onclick = closePopup;

    // 2. 배경(오버레이) 클릭 시 닫기 (컨테이너 밖 클릭 시)
    overlay.onclick = (e) => {
        if (e.target === overlay) closePopup();
    };

    function closePopup() {
        overlay.remove();
        document.body.style.overflow = 'auto';
        hideLoading();
    }

    const gallery = document.getElementById("popupGallery");

// [개선] 쓰로틀링 적용: 스크롤 시 200ms마다 체크하여 연산 최적화
    gallery.onscroll = throttle(() => {
        // 하단에서 100px 여유를 두고 미리 로드
        if (gallery.scrollTop + gallery.clientHeight >= gallery.scrollHeight - 100) {
            fetchPopupImages();
        }
    }, 200);

    popupOffset = 0;
    noMoreImages = false;
    gallery.innerHTML = ""; 
    fetchPopupImages();
}

async function fetchPopupImages() {
    if (isPopupLoading || noMoreImages) return;

    isPopupLoading = true;
    showLoading(); 

    try {
        // [참고] limit을 너무 크게 잡으면 초기 렌더링 렉이 발생하므로 24개 정도가 적당합니다.
        const response = await fetch(`/api/files?offset=${popupOffset}&limit=${popupLimit}`);
        if (!response.ok) throw new Error("서버 응답 오류");

        const resJson = await response.json();
        const images = Array.isArray(resJson) ? resJson : resJson.files;

        if (images.length === 0) {
            noMoreImages = true;
        } else {
            renderPopupItems(images);
            popupOffset += images.length;
            
            // 카운트 표시 업데이트
            const countDisplay = document.getElementById("popupCountDisplay");
            if(countDisplay) countDisplay.innerText = `총 ${popupOffset}개 항목`;
        }

    } catch (error) {
        console.error("팝업 이미지 로드 실패:", error);
    } finally {
        isPopupLoading = false;
        hideLoading(); 
    }
}

function renderPopupItems(images) {
    const gallery = document.getElementById("popupGallery");
    const fragment = document.createDocumentFragment();

    images.forEach(image => {
        const img = document.createElement("img");
        
        // [개선] ImageKit 최적화: 팝업용으로 크기를 줄여서 로드 (렉 줄이기의 핵심)
        // URL 뒤에 ?tr=w-200 옵션을 추가하여 데이터 전송량과 메모리 사용량 절감
        const optimizedSrc = image.file_path.includes("?") 
            ? `${image.file_path}&tr=w-250,h-250` 
            : `${image.file_path}?tr=w-250,h-250`;
            
        img.src = optimizedSrc;
        img.loading = "lazy"; // 브라우저 자체 지연 로딩

        // CSS 클래스나 인라인 스타일로 object-fit이 잘 작동하도록 보장
        img.style.objectFit = "contain";
        
        img.onclick = () => { window.location.href = `post?id=${image.id}`; };
        fragment.appendChild(img);
    });

    gallery.appendChild(fragment);
}