// [보안 추가] 서버 지연 시간 검증용 헤더 생성 함수
function getSecurityHeaders() {
    return {
        "Content-Type": "application/json",
        "x-latency-check": Date.now().toString() // 서버의 app.js에서 검사할 값
    };
}

// 예시: 관리자 토큰을 요청하는 함수가 있다면?
async function requestAdminToken() {
    try {
        const response = await fetch("/api/admin-token", {
            method: "POST",
            headers: getSecurityHeaders(),
            body: JSON.stringify({ role: "admin" })
        });

        if (response.status === 403) {
            alert("보안 체크 실패: 접속 속도가 너무 빠릅니다.");
            return;
        }

        const data = await response.json();
    } catch (err) {
        console.error("보안 통신 오류:", err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const adminModeButton = document.getElementById("adminModeButton");
    const userModeButton = document.getElementById("userModeButton");
    const modeSelection = document.getElementById("modeSelection");
    const mainTitle = document.getElementById("mainTitle");
    const audio = document.getElementById("easterEggAudio");
    const audio2 = document.getElementById("fireworkAudio");
    const clickerModal = document.getElementById("clicker-modal");

    const btnUse = document.getElementById("btn-use-clicker");
    const btnCancel = document.getElementById("btn-cancel-clicker");

    // --- 클릭커 프로그램 감지용 변수 ---
    let clickTimes = []; // 클릭 시간 기록 배열
    const CLICK_LIMIT_THRESHOLD = 12; // 1초에 12번 이상 클릭 시 프로그램으로 간주
    let isClickerBlocked = false; // 팝업이 떠 있는 동안 중복 팝업 방지 및 인터랙션 제어
    let currentFireworkMode = 'heavy'; // 컨셉 강도 (heavy vs light)

    let globalClickCount = 0;
    let glowClickCount = 0;
    let clickedCircles = [];
    const totalGlowClicksNeeded = 5;
    let isPopupOpen = false;  // 팝업 상태 변수


    /* ---------------- 문 열기 + 페이지 이동 ---------------- */
    function openDoorAndRedirect(url) {
        const container = document.querySelector(".container");
        const doorContainer = document.getElementById("door-container");
        const leftDoor = document.querySelector(".door.left");
        const rightDoor = document.querySelector(".door.right");

        if (container) container.classList.add("door-opened-effect");

        setTimeout(() => {
            if (doorContainer) doorContainer.style.display = "flex";

            window.requestAnimationFrame(() => {
                if (leftDoor) leftDoor.style.transform = "rotateY(90deg)";
                if (rightDoor) rightDoor.style.transform = "rotateY(-90deg)";
            });
        }, 150);

        setTimeout(() => {
            window.location.href = url;
        }, 1300);
    }

    // --- 관리자 버튼 클릭 이벤트 ---
    if (adminModeButton) {
        adminModeButton.addEventListener("click", () => {
            const isExplanMode = window.location.hash.includes("explan");
            if (isExplanMode) {
                location.reload();
            } else {
                openDoorAndRedirect("admin-login.html");
            }
        });
    }

    // --- 일반 사용자 버튼 클릭 이벤트 ---
    if (userModeButton) {
        userModeButton.addEventListener("click", () => {
            const isExplanMode = window.location.hash.includes("explan");

            if (clickerModal) {
                clickerModal.style.setProperty("display", "none", "important");
            }

            if (isExplanMode) {
                openDoorAndRedirect("click.html");
            } else {
                openDoorAndRedirect("preview.html");
            }
        });
    }

    /* ---------------- 이스터에그 활성화 팝업 ---------------- */
    function showPopup(message, imageUrl, callback) {
        if (isPopupOpen) return;
        isPopupOpen = true;

        const overlay = document.createElement("div");
        overlay.className = "popup-overlay easteregg-layer";

        const popup = document.createElement("div");
        popup.className = "popup-box";

        if (imageUrl) {
            const imageEl = document.createElement("img");
            imageEl.src = imageUrl;
            imageEl.className = "popup-image";
            popup.appendChild(imageEl);
        }

        const messageEl = document.createElement("p");
        messageEl.textContent = message;
        messageEl.className = "popup-message";
        popup.appendChild(messageEl);

        const confirmButton = document.createElement("button");
        confirmButton.textContent = "확인";
        confirmButton.className = "popup-confirm-button";
        confirmButton.addEventListener("click", (event) => {
            event.stopPropagation();
            overlay.remove();
            isPopupOpen = false;
            if (callback) callback();
        });
        popup.appendChild(confirmButton);
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
    }

    /* ---------------- 클릭커 감지 및 팝업 표시 함수 ---------------- */
    function triggerClickerDetection() {
        if (isClickerBlocked) return;
        isClickerBlocked = true;

        if (clickerModal) {
            clickerModal.style.setProperty("display", "flex", "important");
        }
        console.warn("⚠️ 비정상적인 클릭 속도 감지: 클릭커 확인 팝업을 표시합니다.");
    }

    /* ---------------- 팝업 버튼 이벤트 (인터랙션 복원 및 해제 처리) ---------------- */

    // 1. 팝업 우상단 X 버튼 처리
    const popupBox = document.querySelector(".popup-box");
    if (popupBox) {
        if (!document.querySelector(".popup-close-x")) {
            const closeBtn = document.createElement("span");
            closeBtn.innerHTML = "&times;";
            closeBtn.className = "popup-close-x";
            popupBox.appendChild(closeBtn);

            closeBtn.onclick = (event) => {
                event.stopPropagation();
                if (clickerModal) {
                    clickerModal.style.setProperty("display", "none", "important");
                }
                isClickerBlocked = false;
                clickTimes = [];
            };
        }
    }

    // 2. '테토 모드' 버튼 클릭 시
    if (btnUse) {
        btnUse.onclick = (event) => {
            event.stopPropagation();
            currentFireworkMode = 'heavy';

            if (clickerModal) {
                clickerModal.style.setProperty("display", "none", "important");
            }
            isClickerBlocked = false;
            clickTimes = [];
            console.log("🎆 테토 모드 가동! 팝업을 닫고 뒤쪽 인터랙션을 복원합니다.");
        };
    }

    // 3. '에겐 모드' 버튼 클릭 시
    if (btnCancel) {
        btnCancel.onclick = (event) => {
            event.stopPropagation();
            currentFireworkMode = 'light';

            if (clickerModal) {
                clickerModal.style.setProperty("display", "none", "important");
            }
            isClickerBlocked = false;
            clickTimes = [];
            console.log("🕊️ 에겐 모드 가동! 팝업을 닫고 뒤쪽 인터랙션을 복원합니다.");
        };
    }

    /* ---------------- 클릭 이벤트 (UI 필터 예외 처리) ---------------- */
    body.addEventListener("click", (event) => {
        if (event.target.closest("#clicker-modal") ||
            event.target.closest(".popup-overlay") ||
            isPopupOpen) {
            return;
        }

        if (isClickerBlocked) {
            return;
        }

        // 🛠️ glow-circle 요소나 그 자식들을 클릭한 영역은 바탕화면 연산에서 제외하여 씹힘 완전히 방지
        if (event.target.closest("button") ||
            event.target.closest("a") ||
            event.target.closest(".glow-circle")
        ) {
            return;
        }

        const now = Date.now();
        clickTimes.push(now);
        clickTimes = clickTimes.filter(time => now - time < 1000);

        if (clickTimes.length > CLICK_LIMIT_THRESHOLD) {
            triggerClickerDetection();
            return;
        }

        const x = event.clientX;
        const y = event.clientY;

        window.requestAnimationFrame(() => {
            createFirework(x, y);
            playFireworkSound();
        });

        globalClickCount++;
        console.log("🎯 현재 누적 바탕화면 클릭 수:", globalClickCount);

        const clickEventsData = {
            4: { color: "rgb(205,154,154)", message: "이상기운을 발견했습니다!", imageUrl: "images/alian/ester_01.png" },
            44: { color: "rgb(217,115,115)", message: "조금 더 클릭해보세요", imageUrl: "images/alian/ester_02.png" },
            100: { color: "rgb(230,77,77)", message: "누구세용누구세용누구세용...", imageUrl: "images/alian/ester_03.png" },
            222: { color: "rgb(242,38,38)", message: "많이 심심하신가봐요", imageUrl: "images/alian/ester_04.png" },
            444: { color: "#ff0000", message: "곧 재밌는 일이 일어납니다", imageUrl: "images/alian/ester_05.png" }
        };

        if (clickEventsData[globalClickCount]) {
            document.body.style.backgroundColor = clickEventsData[globalClickCount].color;

            showPopup(
                clickEventsData[globalClickCount].message,
                clickEventsData[globalClickCount].imageUrl,
                () => {
                    if (globalClickCount === 444) {
                        triggerEasterEgg();
                    }
                }
            );
        }
    });

    function triggerEasterEgg() {
        document.querySelectorAll(".glow-circle").forEach(circle => circle.remove());
        if (document.getElementById("container")) document.getElementById("container").remove();
        if (document.getElementById("modeSelection")) document.getElementById("modeSelection").remove();
        if (document.getElementById("mainTitle")) document.getElementById("mainTitle").remove();

        if (!audio) return;
        audio.loop = true;
        audio.play().catch(error => console.error("오디오 재생 오류:", error));
    }

    const canvas = document.getElementById("fireworksCanvas");
    if (canvas) {
        canvas.width = document.documentElement.clientWidth;
        canvas.height = document.documentElement.clientHeight;
        window.addEventListener("resize", () => {
            canvas.width = document.documentElement.clientWidth;
            canvas.height = document.documentElement.clientHeight;
        });
    }

    document.body.style.backgroundColor = "#c0c0c0";

    function createFirework(x, y) {
        const fireworkContainer = document.createElement("div");
        fireworkContainer.classList.add("firework");
        fireworkContainer.style.left = `${x}px`;
        fireworkContainer.style.top = `${y}px`;
        document.body.appendChild(fireworkContainer);

        const particleCount = (currentFireworkMode === 'heavy') ? 50 : 10;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement("div");
            particle.classList.add("particle");

            const size = Math.random() * 10 + 5;
            const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
            const offsetX = (Math.random() - 0.5) * 200;
            const offsetY = (Math.random() - 0.5) * 200;

            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.backgroundColor = color;
            particle.style.setProperty("--translate-x", `${offsetX}px`);
            particle.style.setProperty("--translate-y", `${offsetY}px`);

            fireworkContainer.appendChild(particle);
        }

        setTimeout(() => {
            fireworkContainer.innerHTML = '';
            fireworkContainer.remove();
        }, 1500);
    }

    function playFireworkSound() {
        if (currentFireworkMode === 'heavy' && audio2) {
            audio2.currentTime = 0;
            audio2.play().catch(() => { });
        }
    }

    function createCircles() {
        const numCircles = 5;
        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.35;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        document.querySelectorAll(".glow-circle").forEach(circle => circle.remove());

        for (let i = 0; i < numCircles; i++) {
            const angle = (i * 72) * (Math.PI / 180);
            const x = centerX + radius * Math.cos(angle) - 25;
            const y = centerY + radius * Math.sin(angle) - 25;

            const circle = document.createElement("div");
            circle.classList.add("glow-circle");
            circle.style.left = `${x}px`;
            circle.style.top = `${y}px`;
            // 원형 좌표 배치 순서대로 데이터셋 보존 (0, 1, 2, 3, 4 순서 고정)
            circle.dataset.index = i;
            circle.addEventListener("click", handleGlowCircleClick);
            document.body.appendChild(circle);
        }
    }

    function handleGlowCircleClick(event) {
        const circle = event.target.closest(".glow-circle");
        if (!circle || circle.classList.contains("clicked")) return;

        // ✨ [보정 완료] 누락되었던 targetIdx 변수를 선언 및 맵핑하여 ReferenceError 소멸 처리!
        const targetIdx = parseInt(circle.getAttribute("data-index"), 10);
        if (isNaN(targetIdx)) return;

        glowClickCount++;
        circle.classList.add("clicked");

        const rect = circle.getBoundingClientRect();
        clickedCircles.push({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            index: targetIdx
        });

        if (glowClickCount === totalGlowClicksNeeded) {
            setTimeout(() => {
                drawStarEffect();
            }, 50);
        }
    }
    function drawStarEffect() {
        if (clickedCircles.length < 5) return;

        const starCanvas = document.createElement("canvas");
        starCanvas.classList.add("magic-circle-canvas");
        document.body.appendChild(starCanvas);

        const ctx = starCanvas.getContext("2d");
        starCanvas.width = window.innerWidth;
        starCanvas.height = window.innerHeight;

        ctx.strokeStyle = "rgba(0, 220, 255, 0.8)";
        ctx.lineWidth = 10;
        ctx.shadowColor = "rgba(0, 220, 255, 0.8)";
        ctx.shadowBlur = 25;

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // ✨ 핵심 교정: 랜덤 클릭 데이터를 원본 원형 순서(0, 1, 2, 3, 4)로 완벽하게 재정렬합니다.
        clickedCircles.sort((a, b) => a.index - b.index);

        // 정렬된 순서에서 완벽한 별(오각성)을 완성시키는 절대적 드로잉 순서 맵 고정
        const starOrder = [0, 2, 4, 1, 3, 0];

        ctx.beginPath();

        // ✨ 수정 포인트: Falsy 구조를 피하기 위해 객체 존재 여부만 명확하게 검증 (index가 0이어도 통과)
        const startPoint = clickedCircles[starOrder[0]];
        if (startPoint !== undefined && startPoint !== null) {
            ctx.moveTo(startPoint.x, startPoint.y);
        }

        // 순서 맵을 순회하며 끊김 없이 선 연결
        for (let i = 1; i < starOrder.length; i++) {
            const point = clickedCircles[starOrder[i]];
            if (point !== undefined && point !== null) {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();

        // 외곽 원 그리기
        drawCircleAroundStar(ctx, centerX, centerY);

        setTimeout(() => {
            const glowEffect = document.createElement("div");
            glowEffect.classList.add("glow-effect");
            document.body.appendChild(glowEffect);

            setTimeout(() => {
                if (adminModeButton) adminModeButton.style.display = "block";
                document.querySelectorAll(".glow-circle").forEach(circle => circle.remove());
                starCanvas.remove();
                glowEffect.remove();
            }, 2000);
        }, 1000);

        clickedCircles = [];
    }

    function drawCircleAroundStar(ctx, centerX, centerY) {
        if (clickedCircles.length < 5) return;
        const radius = clickedCircles.reduce((sum, p) => sum + Math.hypot(p.x - centerX, p.y - centerY), 0) / 5;
        setTimeout(() => {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
            ctx.stroke();
        }, 500);
    }

    window.addEventListener("load", createCircles);
    window.addEventListener("resize", createCircles);
});