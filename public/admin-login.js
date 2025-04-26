document.addEventListener("DOMContentLoaded", function () {
    const loginButton = document.getElementById("loginButton");
    const passwordInput = document.getElementById("password");

    function moveButtonRandomly() {
        const maxX = window.innerWidth - loginButton.offsetWidth;
        const maxY = window.innerHeight - loginButton.offsetHeight;

        const randomX = Math.random() * maxX;
        const randomY = Math.random() * maxY;

        loginButton.style.position = "absolute";
        loginButton.style.left = `${randomX}px`;
        loginButton.style.top = `${randomY}px`;
    }

    loginButton.addEventListener("click", async function (event) {
        event.preventDefault(); // 기본 클릭 동작 방지
        const password = passwordInput.value.trim()
        if (password === "") {
            event.preventDefault(); // 기본 클릭 동작 방지
            moveButtonRandomly(); // 버튼 이동
            return;
        }
        // 서버로 비밀번호 전송 후 확인
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

        // 응답 상태 확인
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            showPopup("로그인 성공!", "success", () => {
                showAdminButton();
            });
        } else {
            showPopup("로그인 실패!", "error");
        }
    } catch (error) {
        console.error("서버 오류:", error);
        showPopup("서버 오류 발생!", "error");
        }
    });
    function showAdminButton() {
        const adminButton = document.createElement("button");
        adminButton.textContent = "관리자 모드";
        adminButton.classList.add("admin-styled-button");
        adminButton.onclick = function () {
            showPopup("관리자 모드로 이동합니다.", function() {
                window.location.href = "mode-selection.html"; // 관리자 페이지로 이동
            });
        };
        document.body.appendChild(adminButton);
    }
});

function showPopup(message, type, callback) {
    // ✅ 기존 팝업 제거 (중복 방지)
    const existingPopup = document.querySelector(".popup-message");
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement("div");
    popup.classList.add("popup-message", type);
    popup.textContent = message;

    const closeButton = document.createElement("button");
    closeButton.textContent = "확인";
    closeButton.classList.add("popup-button");
    closeButton.addEventListener("click", () => {
        popup.remove();
        if (callback) callback();
    });

    popup.appendChild(closeButton);
    document.body.appendChild(popup);

    setTimeout(() => {
        popup.style.opacity = "1";
        popup.style.transform = "translate(-50%, -50%) scale(1)";
    }, 50);
}