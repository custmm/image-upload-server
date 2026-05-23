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
            headers: getSecurityHeaders(), // 여기서 위에서 만든 함수를 사용합니다!
            body: JSON.stringify({ role: "admin" })
        });

        if (response.status === 403) {
            alert("보안 체크 실패: 접속 속도가 너무 빠릅니다.");
            return;
        }

        const data = await response.json();
        // ... 후속 처리
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
    const glowCircles = document.querySelectorAll(".glow-circle");
    const audio = document.getElementById("easterEggAudio");
    const audio2 = document.getElementById("fireworkAudio");
    const clickerModal = document.getElementById("clicker-modal");
    const mainContainer = document.getElementById("main-container");
    const btnUse = document.getElementById("btn-use-clicker");
    const btnCancel = document.getElementById("btn-cancel-clicker");
    const fireworksCanvas = document.getElementById("fireworksCanvas");

    // --- 클릭커 프로그램 감지용 변수 추가 ---
    let clickTimes = []; // 클릭 시간 기록 배열
    const CLICK_LIMIT_THRESHOLD = 12; // 1초에 12번 이상 클릭 시 프로그램으로 간주
    let isClickerBlocked = false; // 팝업이 떠 있는 동안 중복 팝업 방지
    let currentFireworkMode = 'heavy'; // 컨셉 강도 (heavy vs light)

    let globalClickCount = 0;
    let glowClickCount = 0;
    let clickedCircles = [];
    const totalGlowClicksNeeded = 5;
    let isPopupOpen = false;  //  팝업 상태 변수 추가


    /* ---------------- 문 열기 + 페이지 이동 ---------------- */
    function openDoorAndRedirect(url) {
        const container = document.querySelector(".container");
        const doorContainer = document.getElementById("door-container");
        const leftDoor = document.querySelector(".door.left");
        const rightDoor = document.querySelector(".door.right");

        // 1. 컨테이너에 사라지는 효과 클래스 추가
        if (container) container.classList.add("door-opened-effect");

        // 2. 약간의 시차 후 문을 표시하고 엽니다.
        setTimeout(() => {
            if (doorContainer) doorContainer.style.display = "flex";

            window.requestAnimationFrame(() => {
                if (leftDoor) leftDoor.style.transform = "rotateY(90deg)";
                if (rightDoor) rightDoor.style.transform = "rotateY(-90deg)";
            });
        }, 150);

        // 3. 애니메이션 완료 후 페이지 이동
        setTimeout(() => {
            window.location.href = url;
        }, 1300);
    }

    // --- 관리자 버튼 클릭 이벤트 ---
    if (adminModeButton) {
        adminModeButton.addEventListener("click", () => {
            const isExplanMode = window.location.hash.includes("explan");
            if (isExplanMode) {
                // 관리자 찾은 후 → 사용자 버튼 클릭 → 초기화
                location.reload();
            } else {
                // 일반 사용자 → admin-login.html로 이동
                openDoorAndRedirect("admin-login.html");
            }
        });
    }

    // --- [수정 완료] 일반 사용자 버튼 클릭 이벤트 ---
    if (userModeButton) {
        userModeButton.addEventListener("click", () => {
            const isExplanMode = window.location.hash.includes("explan");

            // ⭐ 모드를 선택하여 진입할 때 무조건 떠 있는 클릭커 확인 모달 팝업을 먼저 닫아줍니다.
            if (clickerModal) {
                clickerModal.style.setProperty("display", "none", "important");
            }

            // [핵심 해결] 중복 리스너를 제거하고 단 한 번의 클릭으로 구조에 맞춰 분기 이동 처리합니다.
            if (isExplanMode) {
                openDoorAndRedirect("click.html");
            } else {
                openDoorAndRedirect("preview.html");
            }
        });
    }

    /* ---------------- 이스터에그 활성화 ---------------- */
    function showPopup(message, imageUrl, callback) {
        if (isPopupOpen) return;  //  팝업이 열려 있으면 실행 중단
        isPopupOpen = true;  //  팝업 열림 상태로 변경

        // 팝업 오버레이(배경 컨테이너) 생성
        const overlay = document.createElement("div");
        overlay.className = "popup-overlay";

        // 팝업 메시지 컨테이너 생성 (오버레이 내부에 위치)
        const popup = document.createElement("div");
        popup.className = "popup-box";

        // 이미지 URL이 전달되면 이미지 요소 생성 및 추가
        if (imageUrl) {
            const imageEl = document.createElement("img");
            imageEl.src = imageUrl;
            imageEl.className = "popup-image";
            popup.appendChild(imageEl);
        }

        // 메시지 요소 생성
        const messageEl = document.createElement("p");
        messageEl.textContent = message;
        messageEl.className = "popup-message";
        popup.appendChild(messageEl);

        // 확인 버튼 생성 (팝업 컨테이너 안으로 넣음)
        const confirmButton = document.createElement("button");
        confirmButton.textContent = "확인";
        confirmButton.className = "popup-confirm-button";
        confirmButton.addEventListener("click", () => {
            overlay.remove();
            isPopupOpen = false;  //  팝업 닫힘 상태로 변경
            if (callback) callback(); // 콜백 함수 실행
        });
        popup.appendChild(confirmButton);

        // 팝업 컨테이너를 오버레이에 추가
        overlay.appendChild(popup);

        // 오버레이를 문서에 추가하여 표시
        document.body.appendChild(overlay);
    }

    /* ---------------- 클릭커 감지 및 팝업 표시 함수 ---------------- */
    function triggerClickerDetection() {
        if (isClickerBlocked) return;
        isClickerBlocked = true;

        // 숨겨져 있던 팝업창을 보이게 함
        clickerModal.style.display = "flex";
        console.warn("⚠️ 비정상적인 클릭 속도 감지: 클릭커 확인 팝업을 표시합니다.");
    }

    /* ---------------- 팝업 버튼 이벤트 (에러 방지 처리) ---------------- */

    // 1. 팝업 박스 안에 엑스(X) 버튼 동적 생성
    const popupBox = document.querySelector(".popup-box");
    if (popupBox) {
        const closeBtn = document.createElement("span");
        closeBtn.innerHTML = "&times;"; // '×' 기호
        closeBtn.className = "popup-close-x"; // CSS 스타일링용 클래스
        popupBox.appendChild(closeBtn);

        // 엑스 버튼 클릭 시 팝업 닫기 (설정 없이 넘어가기)
        closeBtn.onclick = (event) => {
            event.stopPropagation();
            if (clickerModal) clickerModal.style.display = "none";
            console.log("팝업이 수동으로 닫혔습니다. 기본 클릭커 모드가 적용됩니다.");
        };
    }

    /* ---------------- 팝업 버튼 이벤트 (에러 방지 및 인터랙션 복원 처리) ---------------- */
    if (btnUse) {
        btnUse.onclick = (event) => {
            event.stopPropagation(); // 이벤트 버블링 차단
            currentFireworkMode = 'heavy'; // 풀 파워 컨셉 모드 가동
            if (clickerModal) clickerModal.style.display = "none";

            // 일반 모드라면 차단을 유지하거나 필요에 따라 해제하지만,
            // 사용을 수동으로 눌렀으므로 클릭 상태를 초기화해 줍니다.
            isClickerBlocked = false;
            console.log("🎆 풀 파워 컨셉 모드 가동! 클릭 차단 해제.");
        };
    }

    if (btnCancel) {
        btnCancel.onclick = (event) => {
            event.stopPropagation(); // 이벤트 버블링 차단

            // 1. 팝업창을 화면에서 완전히 숨깁니다.
            if (clickerModal) clickerModal.style.display = "none";

            // [핵심] 2. 뒤쪽의 인터랙션(body 클릭, 별 그리기 등)을 사용할 수 있도록 차단 플래그를 해제합니다!
            isClickerBlocked = false;

            // 3. 최근 쌓인 클릭 타임 로그를 비워주어 즉시 다시 팝업이 뜨는 것을 방지합니다.
            clickTimes = [];

            // (선택 사항) 연산량만 낮추는 컨셉 보존용 설정 유지
            currentFireworkMode = 'light';

            console.log("팝업이 수동으로 닫혔습니다. 클릭 차단 플래그가 해제되어 뒤쪽 인터랙션이 가능합니다.");
        };
    }

    /* ---------------- 클릭 이벤트 수정 ---------------- */
    body.addEventListener("click", (event) => {
        if (isPopupOpen) return;  //  팝업이 열려있으면 클릭 카운트 증가 X

        // 1. 클릭 속도 측정 (프로그램 인식 로직)
        const now = Date.now();
        clickTimes.push(now);
        clickTimes = clickTimes.filter(time => now - time < 1000); // 최근 1초 기록 유지

        if (clickTimes.length > CLICK_LIMIT_THRESHOLD && typeof isClickerEnabled !== "undefined" && !isClickerEnabled) {
            triggerClickerDetection();
            return;
        }

        // 2. UI 클릭 예외 처리 (기존 유지)
        if (event.target.closest(".container") ||
            event.target.closest("button") ||
            event.target.closest("a") ||
            event.target.classList.contains("glow-circle") ||
            event.target.closest(".popup-overlay")
        ) return;

        // 3. 불꽃놀이 실행
        const x = event.clientX;
        const y = event.clientY;

        window.requestAnimationFrame(() => {
            createFirework(x, y);
            playFireworkSound();
        });

        globalClickCount++;

        // 클릭 횟수별 이벤트 데이터
        const clickEventsData = {
            4: {
                color: "rgb(205,154,154)",
                message: "이상기운을 발견했습니다!",
                imageUrl: "images/alian/ester_01.png",
                easterEgg: true
            },
            44: {
                color: "rgb(217,115,115)",
                message: "조금 더 클릭해보세요",
                imageUrl: "images/alian/ester_02.png",
                easterEgg: true
            },
            100: {
                color: "rgb(230,77,77)",
                message: "누구세용누구세용누구세용...",
                imageUrl: "images/alian/ester_03.png",
                easterEgg: true
            },
            222: {
                color: "rgb(242,38,38)",
                message: "많이 심심하신가봐요",
                imageUrl: "images/alian/ester_04.png",
                easterEgg: true
            },
            444: {
                color: "#ff0000",
                message: "곧 재밌는 일이 일어납니다",
                imageUrl: "images/alian/ester_05.png",
                easterEgg: true
            }
        };

        if (clickEventsData[globalClickCount]) {
            document.body.style.backgroundColor = clickEventsData[globalClickCount].color;

            showPopup(
                clickEventsData[globalClickCount].message,
                clickEventsData[globalClickCount].imageUrl,
                () => {
                    if (globalClickCount === 444) {
                        globalClickCount = 444;
                        triggerEasterEgg();
                    }
                }
            );
        }
    });

    // 이스터에그 가동 로직
    function triggerEasterEgg() {
        document.querySelectorAll(".glow-circle").forEach(circle => circle.remove());
        if (document.getElementById("container")) document.getElementById("container").remove();
        if (document.getElementById("modeSelection")) document.getElementById("modeSelection").remove();
        if (document.getElementById("mainTitle")) document.getElementById("mainTitle").remove();

        const audio = document.getElementById("easterEggAudio");
        if (!audio) return;

        audio.loop = true;
        audio.play().catch(error => console.error("오디오 재생 오류:", error));
    }

    const canvas = document.getElementById("fireworksCanvas");

    // 캔버스 크기 설정
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
            circle.dataset.index = i + 1;
            circle.addEventListener("click", handleGlowCircleClick);
            document.body.appendChild(circle);
        }
    }

    function handleGlowCircleClick(event) {
        const circle = event.target;
        if (circle.classList.contains("clicked")) return;

        glowClickCount++;
        circle.classList.add("clicked");

        const rect = circle.getBoundingClientRect();
        clickedCircles.push({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });

        if (glowClickCount === totalGlowClicksNeeded) {
            drawStarEffect();
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

        clickedCircles.sort((a, b) => {
            return Math.atan2(a.y - centerY, a.x - centerX) - Math.atan2(b.y - centerY, b.x - centerX);
        });

        const starOrder = [0, 2, 4, 1, 3, 0];

        ctx.beginPath();
        ctx.moveTo(clickedCircles[starOrder[0]].x, clickedCircles[starOrder[0]].y);
        for (let i = 1; i < starOrder.length; i++) {
            ctx.lineTo(clickedCircles[starOrder[i]].x, clickedCircles[starOrder[i]].y);
        }
        ctx.stroke();

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