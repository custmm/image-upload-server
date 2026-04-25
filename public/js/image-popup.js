let popupOffset = 0;
const popupLimit = 24;
let isPopupLoading = false;

export function openImagePopup() {
    const overlay = document.createElement("div");
    overlay.id = "imageModePopup";
    overlay.className = "popup-overlay"; 
    overlay.innerHTML = `
        <div class="popup-container full-screen">
            <div class="popup-header">
                <h2>이미지 모드 (독립 스크롤)</h2>
                <button onclick="this.closest('.popup-overlay').remove(); document.body.style.overflow='auto';">닫기</button>
            </div>
            <div id="popupGallery" class="popup-gallery"></div>
            <div id="popupLoader" class="spinner hidden"></div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden"; // 메인 스크롤 잠금

    const gallery = document.getElementById("popupGallery");
    gallery.addEventListener("scroll", () => {
        if (gallery.scrollTop + gallery.clientHeight >= gallery.scrollHeight - 20) {
            fetchPopupImages();
        }
    });

    popupOffset = 0;
    fetchPopupImages();
}

async function fetchPopupImages() {
    if (isPopupLoading) return;
    isPopupLoading = true;
    // API 호출 및 레이지 로드 이미지 렌더링 로직
}