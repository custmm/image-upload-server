document.addEventListener("DOMContentLoaded", function () {
    const loginButton = document.getElementById("loginButton");
    const passwordInput = document.getElementById("password");
    const isExplanMode = window.location.hash.includes("explan");
    const container = document.querySelector(".login-container");
    const savedOpacity = localStorage.getItem("sharedOpacity");
    if (savedOpacity && container) {
        container.style.opacity = savedOpacity;
    }
    
    if (isExplanMode) {
        const backBtn = document.querySelector(".back-button");
        if (backBtn) {
            backBtn.onclick = () => window.location.href = "click.html";
        }
    }

    function moveButtonRandomly() {
        const maxX = window.innerWidth - loginButton.offsetWidth;
        const maxY = window.innerHeight - loginButton.offsetHeight;

        const randomX = Math.random() * maxX;
        const randomY = Math.random() * maxY;

        loginButton.style.position = "absolute";
        loginButton.style.left = `${randomX}px`;
        loginButton.style.top = `${randomY}px`;
    }

    passwordInput.addEventListener("input", () => {
        const isBarPhone = window.innerWidth <= 480; // 바형 기준 (가로폭 작을 때)
        if(!isBarPhone) return;

        const length = passwordInput.value.length;

        // 최소 너비 45%, 최대 90%, 글자 수에 따라 선형 증가
        const minWidth = 45;
        const maxWidth = 90;
        const maxLength = 10; // 10자까지 확장, 그 이상은 고정

        const targetWidth = minWidth + ((Math.min(length, maxLength) / maxLength) * (maxWidth - minWidth));
        container.style.width = `${targetWidth}%`;
    });

    loginButton.addEventListener("click", async function (event) {
        event.preventDefault(); // 기본 클릭 동작 방지
        const password = passwordInput.value.trim()

        if (password === "") {
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

            const result = await response.json();

            if (response.ok && result.success) {
                showPopup("로그인 성공!", "success", () => {
                    showAdminButton();
                });
            } else {
                showPopup("로그인 실패!", "error", () => {
                    showAdminButton();
                });
            }
        } catch (error) {
            console.error("서버 자체 오류:", error);
            showPopup("서버 오류 발생!", "error");
            }
        });
        
    function showAdminButton() {
        if (document.querySelector(".admin-styled-button")) {
            showPopup("이미 관리자모드 버튼이 있습니다.", "info");
            return;
        }

        const adminButton = document.createElement("button");
        adminButton.textContent = "관리자 모드";
        adminButton.classList.add("admin-styled-button");
        adminButton.onclick = function () {
            showPopup("관리자 모드로 이동합니다.", "success", function() {
                const redirectUrl = window.location.hash.includes("explan")
                    ? "https://karisdify.site/index#explan"
                    : "mode-selection.html";
                window.location.href = redirectUrl; // 관리자 페이지로 이동
            });
        };
        document.body.appendChild(adminButton);
    }
});

function showPopup(message, type="info", callback=null) {
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