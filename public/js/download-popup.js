// 1. 필요한 상태 변수 선언 (함수 밖 상단에 위치)
let popupOffset = 0;
const popupLimit = 24;
let isPopupLoading = false;
let noMoreImages = false;
let loaderStep = 1;
let loaderInterval = null;

/**
 * [유틸리티] 쓰로틀 함수: 스크롤 이벤트 최적화를 위해 필요
 */
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

// --- 로딩 애니메이션 함수 ---
function showLoading() {
    const indicator = document.getElementById("loadingIndicator");
    const loader = document.getElementById("mainLoader");
    if (!indicator || !loader) return;

    indicator.style.display = "flex";
    indicator.style.opacity = "0";
    indicator.style.transition = "opacity 0.4s ease";
    setTimeout(() => indicator.style.opacity = "1", 10);

    if (loaderInterval) clearInterval(loaderInterval);
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

/**
 * 실제 데이터를 서버에서 가져오는 로직 (작성 필요)
 */
async function fetchPopupImages() {
    if (isPopupLoading || noMoreImages) return;

    isPopupLoading = true;
    showLoading();

    try {
        // [예시] 실제 서버 fetch 로직이 여기에 들어가야 함
        // const response = await fetch(`/api/images?offset=${popupOffset}&limit=${popupLimit}`);
        // const data = await response.json();
        // 이미지 렌더링 후...
        // if (data.length < popupLimit) noMoreImages = true;
        // popupOffset += data.length;
        
        console.log("이미지 로딩 시도 중..."); 
    } catch (err) {
        console.error("이미지 로드 중 오류:", err);
    } finally {
        isPopupLoading = false;
        hideLoading();
    }
}

// --- 메인 팝업 로직 ---
export function openDownloadPopup() {
    // 0. 중복 생성 방지
    if (document.getElementById("downloadModePopup")) return;

    const overlay = document.createElement("div");
    overlay.id = "downloadModePopup";
    overlay.className = "popup-overlay"; 
    
    overlay.innerHTML = `
        <div class="popup-container modal-style">
            <div class="popup-header">
                <div class="header-info">
                    <h2>다운로드 모드</h2>
                    <span id="popupCountDisplay">불러오는 중...</span>
                </div>
                <button id="closeImagePopupBtn">×</button>
            </div>
            <div id="popupGallery" class="popup-gallery" style="overflow-y: auto;"></div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden"; 

    // 1. 닫기 버튼 이벤트
    const closeBtn = document.getElementById("closeImagePopupBtn");
    const closePopup = () => {
        overlay.remove();
        document.body.style.overflow = 'auto';
        hideLoading();
    };

    if (closeBtn) closeBtn.onclick = closePopup;

    // 2. 배경 클릭 시 닫기
    overlay.onclick = (e) => {
        if (e.target === overlay) closePopup();
    };

    const gallery = document.getElementById("popupGallery");

    // 3. 쓰로틀링이 적용된 무한 스크롤 (오류 수정됨)
    gallery.onscroll = throttle(() => {
        if (gallery.scrollTop + gallery.clientHeight >= gallery.scrollHeight - 100) {
            fetchPopupImages();
        }
    }, 200);

    // 4. 초기화 및 첫 페이지 로드
    popupOffset = 0;
    noMoreImages = false;
    gallery.innerHTML = ""; 
    fetchPopupImages();
}