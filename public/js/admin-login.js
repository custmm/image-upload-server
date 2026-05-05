// 전역 변수 설정
let loaderInterval = null;
let loaderStep = 0;

function showLoading() {
    const indicator = document.getElementById("loadingIndicator");
    const loader = document.getElementById("mainLoader");
    if (!indicator || !loader) return;

    indicator.style.display = "flex";
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

document.addEventListener("DOMContentLoaded", function () {
    const loginButton = document.getElementById("loginButton");
    const passwordInput = document.getElementById("password");
    const backBtn = document.getElementById("backBtn");
    const container = document.querySelector(".login-container");
    
    // URL 해시 확인
    const isExplanMode = window.location.hash.includes("explan");

    // 초기 설정: 불투명도 복원
    const savedOpacity = localStorage.getItem("sharedOpacity");
    if (savedOpacity && container) {
        container.style.opacity = savedOpacity;
    }

    // --- [수정] 뒤로가기 버튼 로직 통합 ---
    // 중복된 backBtn.onclick 로직을 제거하고 addEventListener 하나로 통합했습니다.
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            if (isExplanMode) {
                window.location.href = "click.html"; 
            } else {
                window.location.href = "index.html"; 
            }
        });
    }

    // 비밀번호 입력 시 컨테이너 너비 조절 (모바일 전용)
    passwordInput?.addEventListener("input", () => {
        const isBarPhone = window.innerWidth <= 480;
        if (!isBarPhone) return;

        const length = passwordInput.value.length;
        const minWidth = 45;
        const maxWidth = 90;
        const maxLength = 10;
        const targetWidth = minWidth + ((Math.min(length, maxLength) / maxLength) * (maxWidth - minWidth));
        container.style.width = `${targetWidth}%`;
    });

    // 로그인 버튼 클릭 이벤트
    loginButton?.addEventListener("click", async function (event) {
        event.preventDefault(); 
        const password = passwordInput.value.trim();

        if (password === "") {
            moveButtonRandomly(); 
            return;
        }

        showLoading();

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-latency-check": (Date.now() - 500).toString()
                },
                body: JSON.stringify({ password }),
            });

            hideLoading();

            if (response.status === 403) {
                showPopup("보안 정책: 접근 속도가 너무 빠릅니다.", "error");
                return;
            }

            const result = await response.json();

            if (response.ok && result.success) {
                localStorage.setItem("adminToken", result.token);
                showPopup("로그인 성공!", "success", () => {
                    showAdminButton();
                });
            } else {
                showPopup("로그인 실패!", "error", () => {
                    if (isExplanMode) {
                        showAdminButton(); 
                    }
                });
            }
        } catch (error) {
            hideLoading();
            console.error("서버 자체 오류:", error);
            showPopup("서버 오류 발생!", "error");
        }
    });

    function moveButtonRandomly() {
        const maxX = window.innerWidth - loginButton.offsetWidth;
        const maxY = window.innerHeight - loginButton.offsetHeight;
        const randomX = Math.random() * maxX;
        const randomY = Math.random() * maxY;

        loginButton.style.position = "absolute";
        loginButton.style.left = `${randomX}px`;
        loginButton.style.top = `${randomY}px`;
    }

    function showAdminButton() {
        if (document.querySelector(".admin-styled-button")) return;

        const adminButton = document.createElement("button");
        adminButton.textContent = "관리자 모드";
        adminButton.classList.add("admin-styled-button");
        
        adminButton.addEventListener("click", () => {
            const message = isExplanMode ? "버튼을 누르고 기대하세요" : "관리자 모드로 이동합니다.";
            const redirectUrl = isExplanMode ? "https://karisdify.site/index#explan" : "mode-selection.html";

            showPopup(message, "success", () => {
                window.location.href = redirectUrl;
            });
        });
        document.body.appendChild(adminButton);
    }
});

// 팝업 함수 (보안을 위해 textContent 사용 필수)[cite: 1]
function showPopup(message, type = "info", callback = null) {
    const existingPopup = document.querySelector(".popup-message");
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement("div");
    popup.classList.add("popup-message", type);
    popup.textContent = message; // innerHTML 대신 textContent 사용 (보안 강화)[cite: 1]

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