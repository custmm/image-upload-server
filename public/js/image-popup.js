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

// --- 메인 팝업 로직 ---
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
    gallery.onscroll = () => {
        if (gallery.scrollTop + gallery.clientHeight >= gallery.scrollHeight - 50) {
            fetchPopupImages();
        }
    };

    popupOffset = 0;
    noMoreImages = false;
    gallery.innerHTML = ""; 
    fetchPopupImages();
}


async function fetchPopupImages() {
    if (isPopupLoading || noMoreImages) return;

    isPopupLoading = true;
    showLoading(); // 🔥 API 호출 전 로딩 시작

    try {
        const response = await fetch(`/api/files?offset=${popupOffset}&limit=${popupLimit}`);
        if (!response.ok) throw new Error("서버 응답 오류");

        const resJson = await response.json();
        const images = Array.isArray(resJson) ? resJson : resJson.files;

        if (images.length === 0) {
            noMoreImages = true;
        } else {
            renderPopupItems(images);
            popupOffset += images.length;
        }

    } catch (error) {
        console.error("팝업 이미지 로드 실패:", error);
    } finally {
        isPopupLoading = false;
        hideLoading(); // 🔥 로드 완료(성공/실패 무관) 후 로딩 종료
    }
}

function renderPopupItems(images) {
    const gallery = document.getElementById("popupGallery");
    const fragment = document.createDocumentFragment();

    images.forEach(image => {
        const img = document.createElement("img");
        img.src = image.file_path;
        img.loading = "lazy";
        img.onclick = () => { window.location.href = `post?id=${image.id}`; };
        fragment.appendChild(img);
    });

    gallery.appendChild(fragment);
}