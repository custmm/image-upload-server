// [1] 팝업 열기 함수들
export const popupActions = {
    info: () => openFrame("previewOverlayInfo", "previewFrameInfo", "preview_popup.html"),
    icon: () => openFrame("previewOverlayIcon", "previewFrameIcon", "ai_icon.html"),
    etc: () => openFrame("previewOverlayIcon", "previewFrameIcon", "etc_util.html"),
    contact: () => openFrame("previewOverlayIcon", "previewFrameIcon", "contact.html"),
    history: () => openFrame("previewOverlayIcon", "previewFrameIcon", "history.html")
};

function openFrame(overlayId, frameId, src) {
    const overlay = document.getElementById(overlayId);
    const frame = document.getElementById(frameId);
    if (overlay && frame) {
        frame.src = src;
        overlay.style.display = "flex";
    }
}

// [2] 드래그 기능
export function makePopupDraggable(overlayId) {
    const overlay = document.getElementById(overlayId);
    const popup = overlay?.querySelector(".preview-popup");
    if (!popup) return;

    let isDragging = false, offsetX = 0, offsetY = 0;
    popup.style.position = "absolute";

    popup.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - popup.offsetLeft;
        offsetY = e.clientY - popup.offsetTop;
        popup.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        popup.style.left = `${e.clientX - offsetX}px`;
        popup.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        popup.style.cursor = "grab";
    });
}