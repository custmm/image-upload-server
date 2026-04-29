
        // 1. 진입 시 localStorage에 preview 이미지 경로 설정 (만약 없으면)
        if (!localStorage.getItem("selectedImage")) {
            const totalPreviews = 8;
            const randomIndex = Math.floor(Math.random() * totalPreviews) + 1;
            localStorage.setItem("selectedImage", `images/indicator/preview-gunff_${randomIndex}.png`);
        }

        let isPopupOpen = false;  //  팝업 열려 있는지 여부를 추적하는 변수

        function gamepopup(message) {
            if (isPopupOpen) return;  //  팝업이 열려 있으면 실행 중단
            isPopupOpen = true;  //  팝업 열림 상태로 변경

            // 팝업 오버레이(배경 컨테이너) 생성
            const overlay = document.createElement("div");
            overlay.classList.add("hint-overlay");

            // 팝업 메시지 컨테이너 생성 (오버레이 내부에 위치)
            const popup = document.createElement("hintPopup");
            popup.classList.add("game-popup");

            // 메시지 요소 생성
            const messageEl = document.createElement("p");
            messageEl.textContent = message;
            popup.appendChild(messageEl);

            // 확인 버튼 생성 (팝업 컨테이너 안으로 넣음)
            const confirmButton = document.createElement("button");
            confirmButton.classList.add("hint-confirm-button");
            confirmButton.textContent = "확인";
            confirmButton.addEventListener("click", () => {
                overlay.remove();
                isPopupOpen = false;  //  팝업 닫힘 상태로 변경
                window.location.href = "preview.html"; //  이동 추가
            });
            popup.appendChild(confirmButton);

            // 팝업 컨테이너를 오버레이에 추가
            overlay.appendChild(popup);

            // 오버레이를 문서에 추가하여 표시
            document.body.appendChild(overlay);
        }

        function hintpopup(message) {
            if (isPopupOpen) return;  //  팝업이 열려 있으면 실행 중단
            isPopupOpen = true;  //  팝업 열림 상태로 변경

            // 팝업 오버레이(배경 컨테이너) 생성
            const overlay = document.createElement("div");
            overlay.classList.add("hint-overlay");

            // 팝업 메시지 컨테이너 생성 (오버레이 내부에 위치)
            const popup = document.createElement("hintPopup");
            popup.classList.add("hint-popup");

            // 메시지 요소 생성
            const messageEl = document.createElement("p");
            messageEl.textContent = message;
            popup.appendChild(messageEl);

            // 확인 버튼 생성 (팝업 컨테이너 안으로 넣음)
            const confirmButton = document.createElement("button");
            confirmButton.classList.add("hint-confirm-button");
            confirmButton.textContent = "확인";
            confirmButton.addEventListener("click", () => {
                overlay.remove();
                isPopupOpen = false;  //  팝업 닫힘 상태로 변경
            });
            popup.appendChild(confirmButton);

            // 팝업 컨테이너를 오버레이에 추가
            overlay.appendChild(popup);

            // 오버레이를 문서에 추가하여 표시
            document.body.appendChild(overlay);
        }

        document.addEventListener("DOMContentLoaded", function () {
            // 기존 요소 가져오기
            const selectedImageSrc = localStorage.getItem("selectedImage");
            const selectedImageElement = document.getElementById("selectedImage");
            const playerNumber = document.getElementById("playerNumber");
            const foundNumbersDisplay = document.getElementById("foundNumbers");
            const victoryScreen = document.getElementById("victoryScreen");
            const audio = document.getElementById("startAudio");
            const audio2 = document.getElementById("finishAudio");
            const audio3 = document.getElementById("ruleAudio");

            // 팝업 관련 요소
            const closePopupButton = document.getElementById("closePopupButton");
            const gameControlsPopup = document.getElementById("gameControlsPopup");
            const popupPage1 = document.getElementById("popupPage1");
            const popupPage2 = document.getElementById("popupPage2");
            const nextButton = document.getElementById("nextButton");
            const previewButton = document.getElementById("previewButton");
            const startGameButtons = document.querySelectorAll(".start-game-btn");

            // 전역 게임 상태 변수
            let gameStarted = false;         // 게임 시작 여부
            let spacePressed = false;        // 최초 스페이스바 입력 여부
            let isGameOver = false;          // 게임 종료 여부
            let canMove = false;             // 숫자 생성(숨김 효과) 후 조작 가능 여부
            let keysPressed = {};            // 동시에 눌린 키 저장
            let rotationAngle = 0;           // 회전 각도
            let rotateInProgress = false; // 회전 중인지 여부를 추적하는 변수
            let hiddenNumbers = [];
            let foundNumbers = []; // 🔹 찾은 숫자를 저장하는 배열
            let currentNumber = 1;
            let glowInterval = null; // 🔹 벽 발광 효과 타이머
            let cornerTime = 0; // 🔹 모서리에 닿은 총 누적 시간 (초 단위)
            let lastCornerCheck = null; // 🔹 마지막으로 모서리에 닿은 시간
            let health = 100; // 🔹 초기 체력 100%
            const healthDecreaseRate = 100 / 30; // 🔹 30초 동안 100% 감소 → 1초당 3.33%
            const hintMax = 4;
            let hintCount = hintMax;  // 남은 힌트 개수
            let usedHintForCurrentNumber = false;  // 현재 숫자에 대해 힌트 사용 여부
            let currentTargetNumber = getNextTargetNumber(); // 현재 찾아야 할 숫자

            // selectedImage에 localStorage에서 설정한 이미지 경로 적용
            if (selectedImageSrc) {
                selectedImageElement.src = selectedImageSrc;
            } else {
                selectedImageElement.alt = "선택된 이미지가 없습니다.";
            }

            // 첫 페이지의 "다음" 버튼을 누르면 페이지 1 숨기고 페이지 2 표시
            if (nextButton) {
                nextButton.addEventListener("click", function () {
                    popupPage1.style.display = "none";
                    popupPage2.style.display = "block";
                });
            }


            // 첫 페이지의 "이전" 버튼을 누르면 페이지 2 숨기고 페이지 1 표시
            if (previewButton) {
                previewButton.addEventListener("click", function () {
                    popupPage2.style.display = "none";
                    popupPage1.style.display = "block";
                });
            }

            // 모든 게임 시작 버튼에 이벤트 등록 (클래스 start-game-btn 사용)
            startGameButtons.forEach((btn) => {
                btn.addEventListener("click", function () {
                    gameControlsPopup.style.display = "none";
                    gameStarted = true;
                    console.log("게임 시작됨");
                });
            });

            let instructionsClosed = false; // 🔹 팝업이 닫혔는지 확인

            // 조작법 팝업 닫기
            closePopupButton.addEventListener("click", function () {
                instructionsPopup.style.display = "none";
                instructionsClosed = true; // 🔹 팝업이 닫힘 상태로 변경
                console.log("조작법 안내창 닫힘, 스페이스바 입력 가능");
            });

            // 이미지 클릭 시 게임 조작법 팝업 표시
            selectedImageElement.addEventListener("click", function () {
                if (!instructionsClosed) { // 🔹 조작법 팝업이 닫힌 경우만 실행
                    console.log(" 조작법 안내창이 열려있어 게임 대기화면으로 이동하지 않습니다.");
                    return;
                }
                gameControlsPopup.style.display = "block";
                console.log("게임 조작법 안내창 표시...");
            });

            // 게임 시작 (클릭 시)
            selectedImageElement.addEventListener("click", function () {
                if (!instructionsClosed) { // 🔹 조작법 팝업이 열려있으면 실행하지 않음
                    console.log(" 조작법 안내창이 열려있어 게임이 시작되지 않습니다.");
                    return;
                }

                const rect = selectedImageElement.getBoundingClientRect();
                const offsetTop = rect.top + window.scrollY;
                const offsetLeft = rect.left + window.scrollX;

                document.getElementById("pageTitle").style.display = "none";
                document.getElementById("imageText").style.display = "none";
                selectedImageElement.style.border = "none";
                selectedImageElement.style.position = "absolute";
                selectedImageElement.style.top = `${offsetTop}px`;
                selectedImageElement.style.left = `${offsetLeft}px`;
                selectedImageElement.style.transform = "none";

                if (!gameStarted) {
                    gameStarted = true;
                    console.log(" 게임이 시작되었습니다! 스페이스바를 눌러 숫자를 활성화하세요.");
                }
            });

            // 체력바 생성 함수 (이걸 실행하면 이동 가능)
            function createHealthBar() {
                if (!document.getElementById("healthBarContainer")) {
                    const healthBarContainer = document.createElement("div");
                    healthBarContainer.id = "healthBarContainer";
                    healthBarContainer.style.position = "fixed";
                    healthBarContainer.style.top = "10px";
                    healthBarContainer.style.left = "50%";
                    healthBarContainer.style.transform = "translateX(-50%)";
                    healthBarContainer.style.width = "200px";
                    healthBarContainer.style.height = "20px";
                    healthBarContainer.style.backgroundColor = "#ddd";
                    healthBarContainer.style.border = "2px solid #000";
                    healthBarContainer.style.borderRadius = "5px";
                    healthBarContainer.style.overflow = "hidden";
                    healthBarContainer.style.display = "flex";
                    healthBarContainer.style.alignItems = "center";
                    healthBarContainer.style.justifyContent = "flex-start"; // 왼쪽 정렬

                    const healthBar = document.createElement("div");
                    healthBar.id = "healthBar";
                    healthBar.style.width = "100%";
                    healthBar.style.height = "100%";
                    healthBar.style.backgroundColor = "#4CAF50";
                    healthBar.style.transition = "width 0.5s ease"; // 부드러운 애니메이션
                    healthBar.style.transformOrigin = "right"; // 🔹 오른쪽 끝을 기준으로 줄어들도록 설정

                    healthBarContainer.appendChild(healthBar);
                    document.body.appendChild(healthBarContainer);

                    canMove = true; // 🔹 체력바가 생성된 후 이동 가능
                }
            }

            // 체력 감소 함수
            function decreaseHealth(amount) {
                if (health > 0) {
                    health -= amount;
                    if (health < 0) health = 0;

                    // 체력바 업데이트
                    const healthBar = document.getElementById("healthBar");
                    healthBar.style.width = `${health}%`;

                    console.log(` 체력 감소! 현재 체력: ${health}%`);

                    if (health === 0) {
                        gamepopup(" 체력이 0이 되었습니다! 이동 불가!");
                        canMove = false;
                        isGameOver = true;
                    }
                }
            }

            // 모서리 닿음 체크 함수 (30초 누적 시 체력 감소)
            function checkWallAndCornerContact() {
                if (!canMove) return;

                const threshold = 5;
                let left = parseInt(selectedImageElement.style.left) || selectedImageElement.getBoundingClientRect().left;
                let top = parseInt(selectedImageElement.style.top) || selectedImageElement.getBoundingClientRect().top;
                let maxX = window.innerWidth - selectedImageElement.clientWidth;
                let maxY = window.innerHeight - selectedImageElement.clientHeight;

                // 🔹 벽 체크 (왼쪽, 오른쪽, 위쪽, 아래쪽)
                const isNearWall =
                    (left <= threshold) ||
                    (left >= maxX - threshold) ||
                    (top <= threshold) ||
                    (top >= maxY - threshold);

                // 🔹 모서리 체크 (기존 방식 유지)
                const isInCorner =
                    (left <= threshold && top <= threshold) ||
                    (left >= maxX - threshold && top <= threshold) ||
                    (left <= threshold && top >= maxY - threshold) ||
                    (left >= maxX - threshold && top >= maxY - threshold);

                if (isNearWall || isInCorner) {
                    let currentTime = Date.now();

                    if (lastCornerCheck === null) {
                        lastCornerCheck = currentTime;
                    }

                    let elapsed = (currentTime - lastCornerCheck) / 1000;
                    cornerTime += elapsed;
                    lastCornerCheck = currentTime;

                    if (cornerTime >= 1) {
                        let damage = healthDecreaseRate;
                        decreaseHealth(damage);
                        console.log(`⚠️ 체력 감소: ${damage}%`);
                        cornerTime -= 1;
                    }
                } else {
                    lastCornerCheck = null;
                }
            }

            // 0.1초마다 벽 & 모서리 충돌 감지 (스페이스바를 누른 후에만 실행됨)
            setInterval(() => {
                checkWallAndCornerContact();
            }, 100);

            // 벽 경고 효과 업데이트 함수
            function updateWallGlow(left, top, maxX, maxY) {
                const glowThreshold = 40;
                let glowBox = document.getElementById("wallGlow");

                if (!glowBox) {
                    glowBox = document.createElement("div");
                    glowBox.id = "wallGlow";
                    glowBox.style.position = "fixed";
                    glowBox.style.top = "0";
                    glowBox.style.left = "0";
                    glowBox.style.width = "100vw";
                    glowBox.style.height = "100vh";
                    glowBox.style.pointerEvents = "none";
                    document.body.appendChild(glowBox);
                }

                let glowEffect = "";

                if (left <= glowThreshold) glowEffect += "inset 10px 0px 20px red, ";
                if (top <= glowThreshold) glowEffect += "inset 0px 10px 20px red, ";
                if (left >= maxX - glowThreshold) glowEffect += "inset -10px 0px 20px red, ";
                if (top >= maxY - glowThreshold) glowEffect += "inset 0px -10px 20px red, ";

                if (glowEffect) {
                    if (!glowInterval) {
                        glowInterval = setInterval(() => {
                            glowBox.style.boxShadow = glowBox.style.boxShadow === "none" ? glowEffect.slice(0, -2) : "none";
                        }, 300);
                    }
                } else {
                    if (glowInterval) {
                        clearInterval(glowInterval);
                        glowInterval = null;
                    }
                    glowBox.style.boxShadow = "none";
                }
            }

            let numbersGenerated = false;

            function generateNumbers() {
                let hintElement = document.getElementById("gameHint");
                console.log("gameHint 요소 확인:", hintElement); // 디버깅용

                if (!hintElement) {
                    console.error(" gameHint 요소가 없습니다!");
                    return;
                }

                hiddenNumbers = [];
                foundNumbers = [];
                foundNumbersDisplay.style.display = "none";
                foundNumbersDisplay.textContent = "찾은 숫자: ";

                const threshold = 40;
                for (let i = 1; i <= 10; i++) {
                    let x = Math.random() * (window.innerWidth - 100);
                    let y = Math.random() * (window.innerHeight - 100);

                    if (x < threshold) x += threshold;
                    if (y < threshold) y += threshold;
                    if (x > window.innerWidth - threshold - 50) x -= threshold;
                    if (y > window.innerHeight - threshold - 50) y -= threshold;

                    hiddenNumbers.push({ number: i, x, y });

                    let numElem = document.createElement("div");
                    numElem.classList.add("hidden-number", "number");
                    numElem.setAttribute("data-value", i); //  `data-value` 추가  
                    numElem.textContent = i;

                    // 고정된 위치에 표시되도록 절대 위치 지정
                    numElem.style.position = "absolute";
                    numElem.style.left = `${x}px`;
                    numElem.style.top = `${y}px`;
                    numElem.style.transition = "opacity 25s ease";
                    numElem.style.opacity = 1;
                    document.body.appendChild(numElem);

                    // 즉시 투명해지도록 설정 (25초 동안 fade-out)
                    setTimeout(() => {
                        numElem.style.opacity = 0;
                    }, 0);

                    // 25초 후 엘리먼트 제거
                    setTimeout(() => {
                        numElem.style.display = "none";
                    }, 25000);
                }
                // 🏆 "게임이 시작되었습니다" 문구 생성 및 애니메이션 추가
                setTimeout(() => {
                    showGameStartMessage();
                }, 25000);
            }

            //  "게임이 시작되었습니다" 메시지 생성 및 애니메이션 적용
            function showGameStartMessage() {
                let messageElem = document.createElement("div");
                messageElem.textContent = "게임이 시작되었습니다!";
                messageElem.style.position = "fixed";
                messageElem.style.top = "50%";
                messageElem.style.left = "-50%"; // 왼쪽 화면 밖에서 시작
                messageElem.style.transform = "translate(-50%, -50%)";
                messageElem.style.fontSize = "40px";
                messageElem.style.fontWeight = "bold";
                messageElem.style.color = "black";
                messageElem.style.padding = "20px 40px";
                messageElem.style.borderRadius = "10px";
                messageElem.style.boxShadow = "0 0 10px rgba(255, 255, 255, 0.8)";
                messageElem.style.zIndex = "9999";
                messageElem.style.transition = "left 1.5s ease-in-out"; // 왼쪽 -> 중앙 이동
                messageElem.style.whiteSpace = "nowrap"; //  줄바꿈 방지 추가

                document.body.appendChild(messageElem);

                // 🎵  MP3 파일 재생 코드 추가
                let audio = new Audio("sounds/game_start.mp3");  // MP3 파일 경로 지정
                audio.play().catch(e => console.error("🔇 오디오 재생 오류:", e));

                // 중앙으로 이동
                setTimeout(() => {
                    messageElem.style.left = "50%";
                }, 100);

                // 오른쪽으로 사라짐
                setTimeout(() => {
                    messageElem.style.left = "150%";
                }, 1600);

                // 메시지 제거 후 기존 UI 업데이트 실행
                setTimeout(() => {
                    document.body.removeChild(messageElem);
                    canMove = true;
                    numbersGenerated = true; // 🔹 숫자 생성 완료 상태로 변경
                    updateHintVisibility();
                    updateHintUI(); //  힌트 UI 업데이트 추가
                    console.log("🔎 숫자를 찾으세요!");
                    foundNumbersDisplay.style.display = "block";
                }, 2500);
            }

            function updateHintVisibility() {
                let hintElements = document.querySelectorAll(".game-hint"); // 모든 힌트 요소 가져오기
                console.log("🔍 game-hint 요소 개수:", hintElements.length);

                if (hintElements.length === 0) {
                    console.error(" gameHint 요소를 찾을 수 없습니다!");
                    return;
                }

                hintElements.forEach(hint => {
                    hint.style.display = "block"; // 모든 힌트를 표시
                });

                console.log(" 힌트가 정상적으로 표시되었습니다!");
            }

            // 통합된 keydown 이벤트 리스너
            document.addEventListener("keydown", function (event) {
                if (event.code === "F5" || event.code === "F12") return;

                // 조작법 팝업이 닫히기 전에는 스페이스바 비활성화
                if (!instructionsClosed) {
                    event.preventDefault();
                    console.log("조작법 창이 닫히기 전까지 스페이스바 입력이 비활성화됩니다.");
                    return;
                }

                // 게임은 시작되었지만 아직 숫자 생성(숨김 효과)이 완료되지 않아 canMove가 false인 경우
                if (gameStarted && !numbersGenerated) {
                    // 역시 오직 스페이스바만 허용
                    if (event.code !== "Space") {
                        event.preventDefault();
                        console.log("숫자 생성 전: 스페이스바 입력만 허용됩니다.");
                        return;
                    }

                    // 스페이스바 입력 처리 (이미 처리된 경우 중복 호출 방지하려면 추가 조건 필요할 수 있음)
                    if (!spacePressed) {
                        spacePressed = true;
                        console.log("스페이스바 누름(숫자 생성 전): 숫자 생성 시작");
                        generateNumbers();
                        moveCharacter();
                        handleSpacebar(event);
                    }
                    return;
                }

                // 게임이 시작되었고, canMove가 true인 상태에서는 정상적으로 키 입력 처리
                if (numbersGenerated && canMove) {
                    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
                        console.log(`방향키 ${event.code} 입력됨`);
                        handleMovement(event);
                    }
                    else if ((event.key === 'H' || event.key === 'h') && canMove) {

                        // 1) 힌트 남은 개수 체크
                        if (hintCount <= 0) {
                            hintpopup('사용할 수 있는 힌트가 없습니다!');
                            let audio = new Audio("sounds/game_rule.mp3");  // MP3 파일 경로 지정
                            audio.play().catch(e => console.error("🔇 오디오 재생 오류:", e));
                            return;
                        }

                        // 2) 이미 현재 숫자에 대해 사용했는지 체크
                        if (usedHintForCurrentNumber) {
                            hintpopup('여러번 알려드릴 수 없습니다');
                            let audio = new Audio("sounds/game_rule.mp3");  // MP3 파일 경로 지정
                            audio.play().catch(e => console.error("🔇 오디오 재생 오류:", e));
                            return;
                        }

                        // 3) 힌트 소모 & 아이콘 제거
                        hintCount--;
                        usedHintForCurrentNumber = true;
                        const hints = document.querySelectorAll('#hints-container .game-hint');
                        if (hints.length > 0) {
                            hints[hints.length - 1].remove();
                        }
                        console.log(`H 키 입력됨 - 남은 힌트 개수: ${hints.length}`);

                        // 4) (기존 로직) 다음 목표 갱신 및 표식 생성
                        let newTarget = getNextTargetNumber();
                        if (!newTarget) {
                            console.error(" 모든 숫자를 찾음!");
                            return;
                        }

                        console.log("🟢 새로운 목표 숫자 시도:", newTarget);

                        currentTargetNumber = newTarget.number; // 📌 숫자 갱신
                        currentTargetX = newTarget.x; // 📌 X 좌표 갱신
                        currentTargetY = newTarget.y; // 📌 Y 좌표 갱신

                        // 기존 표식 제거 (중복 생성 방지)
                        let oldMarker = document.getElementById("hint-marker");
                        if (oldMarker) oldMarker.remove();

                        //  새로운 원형 표식 생성
                        let hintMarker = document.createElement("div");
                        hintMarker.id = "hint-marker";  // 고유 ID 부여
                        hintMarker.style.position = "absolute";
                        hintMarker.style.left = `${currentTargetX}px`; // 원의 중심 맞추기
                        hintMarker.style.top = `${currentTargetY}px`;
                        hintMarker.style.width = "40px";
                        hintMarker.style.height = "40px";
                        hintMarker.style.borderRadius = "50%";
                        hintMarker.style.backgroundColor = "rgba(255, 255, 0, 0.7)";
                        hintMarker.style.zIndex = "9999";
                        hintMarker.style.transition = "opacity 1s ease-out"; // 서서히 사라지는 애니메이션 추가

                        document.body.appendChild(hintMarker);

                        console.log("🔄 갱신된 목표 숫자:", currentTargetNumber);
                    }
                    else if ((event.key === "r" || event.key === "R") && canMove) {
                        rotateInProgress = true; // 회전 시작
                        console.log("R키 입력 감지, 회전 시작");
                        rotateCharacter();
                    }
                }
            });

            // 힌트 UI 초기화
            function updateHintUI() {
                const hintContainer = document.getElementById('hints-container');
                hintContainer.innerHTML = '';  // 기존 힌트 초기화

                for (let i = 0; i < 4; i++) { //  힌트 개수 4개로 고정
                    let hintIcon = document.createElement('img');
                    hintIcon.src = 'images/game_hint.png';
                    hintIcon.classList.add('game-hint');
                    hintContainer.appendChild(hintIcon);
                }

                //  힌트 컨테이너 표시
                hintContainer.style.display = "flex";
            }

            // 힌트 사용 함수
            function useHint() {
                let targetInfo = getNextTargetNumber(); // 📌 정확한 숫자와 위치 가져오기
                if (!targetInfo) {
                    alert('모든 숫자를 찾았습니다!');
                    return;
                }

                let targetElement = document.querySelector(`.hidden-number.number[data-value='${targetInfo.number}']`);
                if (targetElement) {
                    //  숫자 강조 효과 추가
                    targetElement.style.border = "4px solid yellow";
                    targetElement.style.backgroundColor = "rgba(255, 255, 0, 0.7)";
                    targetElement.style.transition = "all 0.5s ease-in-out";

                    //  깜빡이는 애니메이션 추가 (힌트 효과)
                    targetElement.animate([
                        { transform: "scale(1)", opacity: 1 },
                        { transform: "scale(1.3)", opacity: 0.6 },
                        { transform: "scale(1)", opacity: 1 }
                    ], {
                        duration: 800,
                        iterations: 3
                    });

                    hintCount--; // 힌트 차감
                    usedHintForCurrentNumber = true; // 같은 숫자에 대해 다시 사용 불가
                    updateHintUI();
                    console.log(`🔎 힌트 사용됨 - 숫자 ${targetInfo.number} 위치: (${targetInfo.x}px, ${targetInfo.y}px)`);
                }
            }

            // 숫자를 찾았을 때 이벤트 처리
            function onNumberFound(number) {
                console.log(` 숫자 ${number} 찾음!`);

                if (!foundNumbers.includes(number)) {
                    foundNumbers.push(number); // 찾은 숫자 목록에 추가
                    console.log(` 업데이트된 찾은 숫자 목록:`, foundNumbers);
                }

                // **찾은 숫자의 원형 강조 효과 제거**
                let foundElement = document.querySelector(`.hidden-number.number[data-value="${number}"]`);
                if (foundElement && foundElement.dataset.highlighted) {
                    console.log(` 숫자 ${number}의 강조 효과 제거`);

                    //  opacity를 줄여 서서히 사라지게 설정
                    foundElement.style.transition = "opacity 1s ease-out"; // 1초 동안 서서히 사라짐
                    foundElement.style.opacity = "0";

                    //  1초 후 완전히 숨김 처리
                    setTimeout(() => {
                        foundElement.style.display = "none"; // 최종적으로 완전히 제거
                        foundElement.style.border = "none";
                        foundElement.style.backgroundColor = "transparent";
                        foundElement.style.width = "";
                        foundElement.style.height = "";
                        foundElement.style.borderRadius = "";
                        foundElement.style.color = "";  // 글자 다시 보이게
                        foundElement.style.textShadow = "";

                        //  dataset에서 강조 표시 제거
                        delete foundElement.dataset.highlighted;
                    }, 1000);
                }

                let newTarget = getNextTargetNumber();
                if (newTarget !== null) {
                    console.log(`🔄 새로운 목표 숫자 갱신:`, newTarget);
                    currentTargetNumber = newTarget;
                } else {
                    console.error(" 더 이상 찾을 숫자가 없습니다!");
                }
            }

            function highlightTargetNumber(targetNumber) {
                if (!targetNumber) {
                    console.error(" 강조할 숫자가 없습니다. targetNumber:", targetNumber);
                    return;
                }

                console.log(` 숫자 ${targetNumber} 강조 표시 (표식 생성)`);

                // **목표 숫자의 위치 가져오기**
                let targetElement = document.querySelector(`.hidden-number.number[data-value="${targetNumber}"]`);

                if (!targetElement) {
                    console.error(` 강조할 숫자를 찾을 수 없습니다. (targetNumber: ${targetNumber})`);
                    return;
                }

                let rect = targetElement.getBoundingClientRect();  // 숫자의 위치 정보 가져오기
                let scrollX = window.scrollX || document.documentElement.scrollLeft;
                let scrollY = window.scrollY || document.documentElement.scrollTop;

                let elementWidth = targetElement.offsetWidth;  // 숫자 요소의 너비
                let elementHeight = targetElement.offsetHeight; // 숫자 요소의 높이

                // 📌 숫자의 **중앙 좌표**를 계산하여 표식을 정중앙에 위치
                let targetX = rect.left + scrollX + elementWidth / 2;
                let targetY = rect.top + scrollY + elementHeight / 2;

                // 기존 표식 제거 (중복 생성 방지)
                let oldMarker = document.getElementById("hint-marker");
                if (oldMarker) oldMarker.remove();

                //  새로운 원형 표식 생성
                let hintMarker = document.createElement("div");
                hintMarker.id = "hint-marker";  // 고유 ID 부여
                hintMarker.style.position = "absolute";
                hintMarker.style.left = `${targetX}px`; // 원의 중심 맞추기
                hintMarker.style.top = `${targetY}px`;
                hintMarker.style.width = "40px";
                hintMarker.style.height = "40px";
                hintMarker.style.borderRadius = "50%";
                hintMarker.style.backgroundColor = "rgba(255, 255, 0, 0.7)"; // 반투명한 노란색
                hintMarker.style.zIndex = "9999";
                hintMarker.style.transition = "opacity 1s ease-out"; // 서서히 사라지는 애니메이션 추가

                document.body.appendChild(hintMarker);

                console.log(` 힌트 사용됨 - 숫자 ${targetNumber} 위치 (${targetX}, ${targetY})에 원형 표식 표시됨`);
            }

            //  안전하게 목표 숫자를 가져오는 함수 (랜덤 방식 적용)
            function getNextTargetNumber() {
                let numbers = Array.from(document.querySelectorAll('.hidden-number.number'));

                // **🔹 숫자를 작은 순서대로 정렬 (1부터 10까지)**
                numbers.sort((a, b) => {
                    let numA = parseInt(a.textContent.trim(), 10);
                    let numB = parseInt(b.textContent.trim(), 10);
                    return numA - numB;
                });

                console.log(" 현재 찾은 숫자 목록:", foundNumbers);

                for (let numElem of numbers) {
                    let targetValue = parseInt(numElem.textContent.trim(), 10);

                    // ** 찾지 않은 숫자만 선택**
                    if (foundNumbers.includes(targetValue)) continue;

                    let wasHidden = false;

                    // ** 숫자가 `display: none` 상태인지 확인**
                    if (window.getComputedStyle(numElem).display === "none") {
                        numElem.style.display = "block";  // **임시로 보이게 변경**
                        wasHidden = true;
                    }

                    let rect = numElem.getBoundingClientRect();  // 위치 가져오기
                    let targetX = rect.left + window.scrollX;  // 뷰포트 좌표를 페이지 좌표로 변환
                    let targetY = rect.top + window.scrollY;

                    // **🔹 다시 숨김 처리**
                    if (wasHidden) {
                        numElem.style.display = "none";
                    }

                    console.log(` 다음 목표 숫자: ${targetValue}, 위치: (${targetX}px, ${targetY}px)`);

                    //  **새로운 숫자 설정 후 강조 표시**
                    currentTargetNumber = targetValue;
                    currentTargetX = targetX;
                    currentTargetY = targetY;

                    highlightTargetNumber(currentTargetNumber);

                    return { number: targetValue, x: targetX, y: targetY };
                }

                console.log("⚠️ 모든 숫자를 찾음 - 더 이상 목표 숫자 없음");
                return null;
            }

            function checkNumberFound() {
                if (!canMove) return;

                let left = parseInt(selectedImage.style.left) || selectedImage.getBoundingClientRect().left;
                let top = parseInt(selectedImage.style.top) || selectedImage.getBoundingClientRect().top;

                let target = hiddenNumbers.find(n => n.number === currentNumber);
                if (!target) return;

                // 숫자 위치 근처인지 체크 (50px 범위)
                if (Math.abs(left - target.x) < 50 && Math.abs(top - target.y) < 50) {
                    console.log(` 숫자 ${currentNumber} 찾음!`);

                    foundNumbers.push(currentNumber);
                    foundNumbersDisplay.textContent = `찾은 숫자: ${foundNumbers.join(", ")}`;

                    playerNumber.textContent = currentNumber;
                    playerNumber.style.left = `${left}px`;
                    playerNumber.style.top = `${top - 30}px`;
                    playerNumber.style.display = "block";

                    // 숫자를 찾은 위치(target.x, target.y)에 PNG 이미지를 생성합니다.
                    let pngElement = document.createElement("img");
                    pngElement.src = "images/game_check.png"; // 실제 PNG 파일 경로로 변경하세요.
                    pngElement.style.position = "absolute";
                    pngElement.style.left = `${target.x}px`;
                    pngElement.style.top = `${target.y}px`;
                    pngElement.style.width = "50px";  // 원하는 크기로 조정
                    pngElement.style.height = "50px"; // 원하는 크기로 조정
                    // 이 PNG는 제거하지 않으므로 그대로 남습니다.
                    document.body.appendChild(pngElement);

                    //  체크 사운드 재생 추가
                    const sound = new Audio("sounds/number_catch.mp3"); // 효과음 경로
                    sound.play().catch(e => console.warn("사운드 재생 실패:", e));

                    // 숫자 찾았을 때 표식 서서히 사라지게 하기
                    let hintMarker = document.getElementById("hint-marker");
                    if (hintMarker) {
                        hintMarker.style.opacity = "0";  // 점점 투명해짐
                        setTimeout(() => hintMarker.remove(), 1000); // 1초 후 삭제
                    }

                    currentNumber++;
                    usedHintForCurrentNumber = false;  // 다음 숫자에 대해 힌트 재사용 가능

                    if (currentNumber > 10) {
                        showVictoryScreen();
                        // 🎵  MP3 파일 재생 코드 추가
                        let audio = new Audio("sounds/game_finish.mp3");  // MP3 파일 경로 지정
                        audio.play().catch(e => console.error("🔇 오디오 재생 오류:", e));
                    }
                }
            }

            function showVictoryScreen() {
                canMove = false;
                victoryScreen.style.display = "block";
            }

            // 스페이스바 처리 함수
            function handleSpacebar(event) {
                if (!gameStarted) {
                    console.log(" 게임이 아직 시작되지 않았습니다! 스페이스바를 사용할 수 없습니다.");
                    return;
                }
                if (isGameOver) {
                    gamepopup(" 체력이 0이 되어 더 이상 조작할 수 없습니다!");
                    return;
                }

                if (!canMove) {
                    event.preventDefault();
                    createHealthBar();
                    canMove = true;
                    console.log(" 이동 및 충돌 감지 활성화됨!");
                }
            }

            // 캐릭터 이동 처리 함수
            function handleMovement(event) {
                if (!canMove) return;

                keysPressed[event.key] = true;
                moveCharacter();
            }

            // 캐릭터 회전 함수 (R 키)
            function rotateCharacter() {
                rotationAngle += 3;
                selectedImageElement.style.transform = `rotate(${rotationAngle}deg)`;
                console.log(` 캐릭터 회전: ${rotationAngle}도`);
            }

            // 캐릭터 이동 함수
            function moveCharacter() {
                const step = 8;
                let left = parseInt(selectedImageElement.style.left) || selectedImageElement.getBoundingClientRect().left;
                let top = parseInt(selectedImageElement.style.top) || selectedImageElement.getBoundingClientRect().top;

                // 화면 경계 설정
                const minX = 0;
                const minY = 0;
                const maxX = window.innerWidth - selectedImageElement.clientWidth;
                const maxY = window.innerHeight - selectedImageElement.clientHeight;

                // 단일 방향 이동 (화면 경계를 넘지 않도록 제한)
                if (keysPressed["ArrowLeft"] && left > minX) selectedImageElement.style.left = `${left - step}px`;
                if (keysPressed["ArrowRight"] && left < maxX) selectedImageElement.style.left = `${left + step}px`;
                if (keysPressed["ArrowUp"] && top > minY) selectedImageElement.style.top = `${top - step}px`;
                if (keysPressed["ArrowDown"] && top < maxY) selectedImageElement.style.top = `${top + step}px`;

                // 대각선 이동 (2개 키 조합, 경계 체크 추가)
                if (keysPressed["ArrowLeft"] && keysPressed["ArrowUp"] && left > minX && top > minY) {
                    selectedImageElement.style.left = `${left - step}px`;
                    selectedImageElement.style.top = `${top - step}px`;
                }
                if (keysPressed["ArrowRight"] && keysPressed["ArrowUp"] && left < maxX && top > minY) {
                    selectedImageElement.style.left = `${left + step}px`;
                    selectedImageElement.style.top = `${top - step}px`;
                }
                if (keysPressed["ArrowLeft"] && keysPressed["ArrowDown"] && left > minX && top < maxY) {
                    selectedImageElement.style.left = `${left - step}px`;
                    selectedImageElement.style.top = `${top + step}px`;
                }
                if (keysPressed["ArrowRight"] && keysPressed["ArrowDown"] && left < maxX && top < maxY) {
                    selectedImageElement.style.left = `${left + step}px`;
                    selectedImageElement.style.top = `${top + step}px`;
                }

                // 벽 발광 효과 적용
                updateWallGlow(left, top, maxX, maxY);

                // 벽/모서리 닿음 체크 (체력 감소)
                checkWallAndCornerContact();

                // 숫자 발견 체크
                checkNumberFound();
            }

            // 키를 떼면 해당 키를 객체에서 제거
            document.addEventListener("keyup", function (event) {
                delete keysPressed[event.key];
            });

            const activeTouches = new Map();

            // 모바일 키패드 터치 → 키보드 이벤트로 변환
            document.querySelectorAll('#mobile-keypad button').forEach(btn => {
                const key = btn.dataset.key;

                btn.addEventListener('touchstart', e => {
                    e.preventDefault();
                    if (activeTouches.has(key)) return; // 중복 방지

                    const interval = setInterval(() => {
                        document.dispatchEvent(new KeyboardEvent('keydown', { key, code: key }));
                    }, 50); // 50ms 간격으로 keydown 반복 발생

                    activeTouches.set(key, interval);
                });

                btn.addEventListener('touchend', e => {
                    e.preventDefault();
                    document.dispatchEvent(new KeyboardEvent('keyup', { key, code: key }));

                    if (activeTouches.has(key)) {
                        clearInterval(activeTouches.get(key));
                        activeTouches.delete(key);
                    }
                });
                btn.addEventListener('touchcancel', e => {
                    e.preventDefault();
                    document.dispatchEvent(new KeyboardEvent('keyup', { key, code: key }));

                    if (activeTouches.has(key)) {
                        clearInterval(activeTouches.get(key));
                        activeTouches.delete(key);
                    }
                });
            });
        });
