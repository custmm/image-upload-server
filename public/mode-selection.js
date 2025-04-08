document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ 모드 선택 페이지가 로드되었습니다.");

    // 버튼 요소 가져오기
    const uploadButton = document.querySelector(".upload-selection-button");
    const previewButton = document.querySelector(".preview-selection-button");
    const adminButton = document.querySelector(".admin-selection-button");
    const logoutButton = document.querySelector(".logout-button");

    // 팝업 생성 함수
    function showPopup(message, callback) {
        // 기존 팝업이 있으면 삭제
        const existingPopup = document.querySelector(".popup-overlay");
        if (existingPopup) {
            existingPopup.remove();
        }

        // 팝업 배경 생성
        const popupOverlay = document.createElement("div");
        popupOverlay.className = "popup-overlay";

        // 팝업 창 생성
        const popupBox = document.createElement("div");
        popupBox.className = "popup-box";

        // 팝업 메시지 추가
        const popupMessage = document.createElement("p");
        popupMessage.textContent = message;

        // 확인 버튼 추가
        const confirmButton = document.createElement("button");
        confirmButton.textContent = "확인";
        confirmButton.className = "popup-confirm";

        // 이벤트 리스너 추가
        confirmButton.addEventListener("click", () => {
            popupOverlay.remove();
            if (callback) callback();
        });

        // 팝업창 외부 클릭 시 닫기
        popupOverlay.addEventListener("click", (event) => {
            if (event.target === popupOverlay) {
                popupOverlay.remove();
            }
        });

        // 팝업 창에 요소 추가
        popupBox.appendChild(popupMessage);
        popupBox.appendChild(confirmButton);
        popupOverlay.appendChild(popupBox);
        document.body.appendChild(popupOverlay);
    }

    // 버튼 클릭 이벤트 추가 (팝업 확인 후 이동)
    if (uploadButton) {
        uploadButton.addEventListener("click", () => {
            showPopup("업로드 페이지로 이동하시겠습니까?", () => {
                window.location.href = "upload.html";
            });
        });
    }

    if (previewButton) {
        previewButton.addEventListener("click", () => {
            showPopup("게시글로 이동하시겠습니까?", () => {
                window.location.href = "preview.html";
            });
        });
    }

    if (adminButton) {
        adminButton.addEventListener("click", () => {
            showPopup("관리자 대시보드로 이동하시겠습니까?", () => {
                window.location.href = "admin-dashboard.html";
            });
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            showPopup("로그아웃 후 메인 페이지로 이동하시겠습니까?", () => {
                window.location.href = "index.html";
            });
        });
    }
});