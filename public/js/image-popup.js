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
    overlay.innerHTML = `
        <div class="popup-container full-screen">
            <div class="popup-header">
                <h2>이미지 모드 (독립 스크롤)</h2>
                <button id="closeImagePopupBtn">닫기</button>
            </div>
            <div id="popupGallery" class="popup-gallery"></div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden"; // 메인 스크롤 잠금

    // 닫기 버튼 이벤트
    document.getElementById("closeImagePopupBtn").onclick = () => {
        overlay.remove();
        document.body.style.overflow = 'auto';
        hideLoading(); // 팝업 닫을 때 혹시 돌아가고 있을 로더 제거
    };

    const gallery = document.getElementById("popupGallery");
    gallery.onscroll = () => {
        if (gallery.scrollTop + gallery.clientHeight >= gallery.scrollHeight - 20) {
            fetchPopupImages();
        }
    };

    // 초기 상태 리셋 후 로드
    popupOffset = 0;
    noMoreImages = false;
    document.getElementById("popupGallery").innerHTML = ""; 
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