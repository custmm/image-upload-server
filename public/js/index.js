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
    const doorContainer = document.getElementById("door-container");
    const leftDoor = document.querySelector(".door.left");
    const rightDoor = document.querySelector(".door.right");
    const modeSelection = document.getElementById("modeSelection");
    const mainTitle = document.getElementById("mainTitle");
    const glowCircles = document.querySelectorAll(".glow-circle");
    const container = document.getElementById("container");
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
    let isClickerEnabled = false; // "사용" 버튼을 눌렀는지 여부

    let globalClickCount = 0;
    let glowClickCount = 0;
    let clickedCircles = [];
    const totalGlowClicksNeeded = 5;
    let isPopupOpen = false;  //  팝업 상태 변수 추가


    /* ---------------- 문 열기 + 페이지 이동 ---------------- */
    function openDoorAndRedirect(url) {
        doorContainer.style.display = "flex";
        setTimeout(() => {
            leftDoor.style.transform = "rotateY(90deg)"; // 왼쪽 문 열기
            rightDoor.style.transform = "rotateY(-90deg)"; // 오른쪽 문 열기
        }, 50); // DOM 렌더링 시간을 확보 (50ms)

        // 1초 후 페이지 이동
        setTimeout(() => {
            window.location.href = url;
        }, 1000);
    }

    // 버튼 클릭 이벤트 설정 (존재할 경우에만)
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

    if (userModeButton) {
        userModeButton.addEventListener("click", () => {
            const isExplanMode = window.location.hash.includes("explan");

            if (isExplanMode) {
                // 일반 사용자 → click.html로 이동
                openDoorAndRedirect("click.html");
            } else {
                // 일반 모드에서는 preview.html로 이동
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

    /* ---------------- 클릭커 선택 팝업 로직 ---------------- */
    btnUse.addEventListener("click", () => {
        isClickerEnabled = true;
        isClickerBlocked = false;
        clickerModal.style.display = "none";
        mainContainer.style.display = "block";    // 클릭커 영역(UI) 나타남
        fireworksCanvas.style.display = "block";  // 캔버스 활성화
        console.log("🚀 사용자가 클릭커 사용을 승인했습니다. 최적화 모드 가동.");
    });

    btnCancel.addEventListener("click", () => {
        isClickerEnabled = false;
        isClickerBlocked = false;
        clickerModal.style.display = "none";

        // 클릭커를 사용 안 하므로 관련 영역을 아예 제거하여 [응답 없음] 방지
        if (mainContainer) mainContainer.remove();
        if (fireworksCanvas) fireworksCanvas.remove();

        alert("클릭커가 해제되었습니다. 웹사이트 성능을 보호합니다.");
    });

    /* ---------------- 클릭 이벤트 수정 ---------------- */
    body.addEventListener("click", (event) => {
        if (isPopupOpen) return;  //  팝업이 열려있으면 클릭 카운트 증가 X

        // 1. 클릭 속도 측정 (프로그램 인식 로직)
        const now = Date.now();
        clickTimes.push(now);
        clickTimes = clickTimes.filter(time => now - time < 1000); // 최근 1초 기록 유지

        if (clickTimes.length > CLICK_LIMIT_THRESHOLD && !isClickerEnabled) {
            triggerClickerDetection();
            return; // 팝업 확인 전까지는 아래 로직 실행 안 함
        }

        // 2. UI 클릭 예외 처리 (기존 유지)
        if (event.target.closest(".container") || event.target.closest("button") ||
            event.target.closest("a") || event.target.classList.contains("glow-circle")) return;

        // 3. 사용 승인된 경우 또는 일반 클릭일 때만 불꽃놀이 실행
        const x = event.clientX;
        const y = event.clientY;

        // [최적화] 프레임 유실 방지를 위해 requestAnimationFrame 사용 
        window.requestAnimationFrame(() => {
            createFirework(x, y);
            playFireworkSound();
        });

        globalClickCount++;

        // 클릭 횟수별 이벤트
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
                message: "누구세용누구세용누구세용누구세용누구세용누구세용누구세용누구세용누구세용누구세용누구세용누구세용누구세용누구세용누구세용누구세용누구세용누구세용누구세용누구세용",
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

        // clickEventsData에 해당하는 클릭 횟수일 때 실행
        if (clickEventsData[globalClickCount]) {
            document.body.style.backgroundColor = clickEventsData[globalClickCount].color;

            console.log(" 클릭 횟수:", globalClickCount);
            console.log(" clickEventsData 존재 여부:", clickEventsData[globalClickCount]);
            console.log(" 이스터에그 속성 여부:", clickEventsData[globalClickCount]?.easterEgg);

            showPopup(
                clickEventsData[globalClickCount].message,
                clickEventsData[globalClickCount].imageUrl,
                () => {
                    //  존재 여부 체크 후 실행 (오류 방지)
                    if (globalClickCount === 444) {
                        console.log(" 이스터에그 조건 충족! triggerEasterEgg() 실행");
                        globalClickCount = 444;  //  더 이상 증가하지 않도록 고정
                        triggerEasterEgg();
                    } else {
                        console.log(` ${globalClickCount}회 클릭했지만, 이스터에그 실행 조건 불충족`);
                    }
                }
            );
        }
    });

    //  이스터에그 실행 함수
    function triggerEasterEgg() {
        console.log(" 이스터에그 시작!");

        //  모든 요소 삭제
        document.querySelectorAll(".glow-circle").forEach(circle => circle.remove());
        if (document.getElementById("container")) document.getElementById("container").remove();
        if (document.getElementById("modeSelection")) document.getElementById("modeSelection").remove();
        if (document.getElementById("mainTitle")) document.getElementById("mainTitle").remove();

        //  오디오 요소 확인
        console.log("🎵 오디오 요소 가져오기...");
        const audio = document.getElementById("easterEggAudio");

        if (!audio) {
            console.error(" 오디오 요소를 찾을 수 없습니다. `id=easterEggAudio` 확인 필요!");
            return;
        }

        //  오디오 무한 반복 재생
        console.log("🎵 오디오 재생 시도");
        audio.loop = true;
        audio.play()
            .then(() => console.log(" 오디오 재생 시작"))
            .catch(error => console.error(" 오디오 재생 오류:", error));
    }


    /* ---------------- 이스터에그 + 불꽃놀이 + 배경색 변경 ---------------- */
    const overlayText = document.createElement("div");
    const canvas = document.getElementById("fireworksCanvas");
    const button = document.getElementById("mainButton");

    // 캔버스 크기 설정
    window.addEventListener("resize", () => {
        canvas.width = document.documentElement.clientWidth;
        canvas.height = document.documentElement.clientHeight;
    });

    // 초기 배경색 설정
    document.body.style.backgroundColor = "#c0c0c0";

    // [최적화] 불꽃놀이 파티클 생성 시 메모리 찌꺼기 제거 로직 추가
    function createFirework(x, y) {
        const fireworkContainer = document.createElement("div");
        fireworkContainer.classList.add("firework");
        fireworkContainer.style.left = `${x}px`;
        fireworkContainer.style.top = `${y}px`;
        document.body.appendChild(fireworkContainer);

        for (let i = 0; i < 50; i++) {
            const particle = document.createElement("div");
            particle.classList.add("particle");

            const angle = Math.random() * 360;
            const distance = Math.random() * 200;
            const size = Math.random() * 10 + 5;
            const color = `hsl(${Math.random() * 360}, 100%, 50%)`;

            const offsetX = (Math.random() - 0.5) * 200; // ↔ -100 ~ +100
            const offsetY = (Math.random() - 0.5) * 200; // ↕ -100 ~ +100

            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.backgroundColor = color;
            particle.style.setProperty("--translate-x", `${offsetX}px`);
            particle.style.setProperty("--translate-y", `${offsetY}px`);

            fireworkContainer.appendChild(particle);
        }

        // 1.5초 후 확실하게 DOM에서 제거하여 메모리 누수 방지 
        setTimeout(() => {
            fireworkContainer.innerHTML = ''; // 내부 요소 비우기 [cite: 1]
            fireworkContainer.remove();
        }, 1500);
    }

    function playFireworkSound() {
        audio2.currentTime = 0;
        audio2.play();
    }

    function createCircles() {
        const numCircles = 5;
        const minViewport = Math.min(window.innerWidth, window.innerHeight);
        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.35;  // 화면 크기에 비례한 반지름

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
            circle.dataset.index = i + 1; // 1~5 순번 저장
            circle.addEventListener("click", handleGlowCircleClick);
            document.body.appendChild(circle);
        }
    }

    function handleGlowCircleClick(event) {
        const circle = event.target;

        // 이미 클릭된 원이면 중복 클릭 방지
        if (circle.classList.contains("clicked")) return;

        glowClickCount++;
        circle.classList.add("clicked");

        // 클릭된 원의 중앙 좌표 저장
        const rect = circle.getBoundingClientRect();
        clickedCircles.push({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });


        // 5개 클릭하면 별 생성
        if (glowClickCount === totalGlowClicksNeeded) {
            drawStarEffect();
        }
    }

    function drawStarEffect() {
        if (clickedCircles.length < 5) {
            console.error("Not enough points to draw a star!");
            return;
        }

        const starCanvas = document.createElement("canvas");
        starCanvas.classList.add("magic-circle-canvas");

        document.body.appendChild(starCanvas);
        const ctx = starCanvas.getContext("2d");

        // 캔버스 크기 설정
        starCanvas.width = window.innerWidth;
        starCanvas.height = window.innerHeight;

        ctx.strokeStyle = "rgba(0, 220, 255, 0.8)";
        ctx.lineWidth = 10;
        ctx.shadowColor = "rgba(0, 220, 255, 0.8)";
        ctx.shadowBlur = 25;

        // ⭐ 클릭한 점들을 중심을 기준으로 정렬하여 별 모양 유지  
        const centerX = clickedCircles.reduce((sum, p) => sum + p.x, 0) / 5;
        const centerY = clickedCircles.reduce((sum, p) => sum + p.y, 0) / 5;

        // 점들을 각도 기준으로 정렬 (별 모양을 만들기 위해)
        clickedCircles.sort((a, b) => {
            const angleA = Math.atan2(a.y - centerY, a.x - centerX);
            const angleB = Math.atan2(b.y - centerY, b.x - centerX);
            return angleA - angleB;
        });

        // ⭐ 별 모양을 만들기 위한 점 연결 순서
        const starOrder = [0, 2, 4, 1, 3, 0]; // 별을 그리는 정해진 순서

        // 별 그리기 (고정된 패턴으로 선 연결)
        ctx.beginPath();
        ctx.moveTo(clickedCircles[starOrder[0]].x, clickedCircles[starOrder[0]].y);
        for (let i = 1; i < starOrder.length; i++) {
            ctx.lineTo(clickedCircles[starOrder[i]].x, clickedCircles[starOrder[i]].y);
        }
        ctx.stroke();

        // 🌟 별을 감싸는 원 그리기 (별을 그린 후)
        drawCircleAroundStar(ctx, centerX, centerY);

        // ✨ 반짝이는 효과
        setTimeout(() => {
            const glowEffect = document.createElement("div");
            glowEffect.classList.add("glow-effect");
            document.body.appendChild(glowEffect);

            setTimeout(() => {
                // ⭐ 관리자 버튼 표시
                adminModeButton.style.display = "block";

                // ⭐ 클릭된 glow-circle 요소 삭제
                document.querySelectorAll(".glow-circle").forEach(circle => circle.remove());

                // ⭐ 캔버스 & 효과 제거
                starCanvas.remove();
                glowEffect.remove();
            }, 2000);
        }, 1000);

        // 클릭한 원 좌표 초기화
        clickedCircles = [];
    }

    // ⭐ 별을 감싸는 원 그리기 함수
    function drawCircleAroundStar(ctx, centerX, centerY) {
        // 반지름 계산: 클릭한 점들과 중심 간의 평균 거리
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