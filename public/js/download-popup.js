// --- 로딩 애니메이션 함수 (모듈 내부에서 정의하거나 import) ---
let loaderStep = 1;
let loaderInterval = null;

function showLoading() {
    const indicator = document.getElementById("loadingIndicator");
    const loader = document.getElementById("mainLoader");
    if (!indicator || !loader) return;

    // 초기 투명도 설정 (부드러운 등장을 위해)
    indicator.style.opacity = "0";
    indicator.style.display = "flex";
    indicator.style.transition = "opacity 0.4s ease";

    // 강제 리플로우 후 투명도 조절
    setTimeout(() => indicator.style.opacity = "1", 10);

    if (loaderInterval) clearInterval(loaderInterval); // 중복 방지

    loaderInterval = setInterval(() => {
        loaderStep++;
        if (loaderStep > 4) loaderStep = 1;
        loader.className = "loader loader" + loaderStep;
    }, 150);
}

function hideLoading() {
    const indicator = document.getElementById("loadingIndicator");
    if (!indicator) return;

    indicator.style.opacity = "0";
    
    // 애니메이션이 끝난 후 display: none 처리
    setTimeout(() => {
        if (indicator.style.opacity === "0") {
            indicator.style.display = "none";
            if (loaderInterval) {
                clearInterval(loaderInterval);
                loaderInterval = null;
            }
        }
    }, 400);
}

async function fetchPopupImages() {
    if (isPopupLoading || noMoreImages) return;

    isPopupLoading = true;
    showLoading(); 
}

export function openDownloadPopup() {
        const overlay = document.createElement("div");
    overlay.id = "downloadModePopup";
    overlay.className = "popup-overlay"; 
    
    // 스타일을 직접 제어하여 크기를 적절하게 조절합니다.
    overlay.innerHTML = `
        <div class="popup-container modal-style">
            <div class="popup-header">
                <div class="header-info">
                    <h2>다운로드 모드</h2>
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