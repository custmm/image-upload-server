const frames = [
  "../images/alian/ester_01.png",
  "../images/alian/ester_02.png",
  "../images/alian/ester_03.png",
  "../images/alian/ester_04.png",
  "../images/alian/ester_05.png"
];

let currentFrame = 0;
let frameTimer = null;

/**
 * 로딩 애니메이션 시작
 */
function startLoading() {
  const frameElement = document.getElementById("loading-frame");
  const screenElement = document.getElementById("loading-screen");

  if (!frameElement || !screenElement) {
    console.warn("Loading elements not found");
    return;
  }

  // 🔥 오버레이 표시
  screenElement.style.display = "flex";
  screenElement.style.opacity = "1";

  currentFrame = 0;
  frameElement.src = frames[currentFrame];

  // 이미 타이머 있으면 중복 실행 방지
  if (frameTimer) return;

  frameTimer = setInterval(() => {
    currentFrame = (currentFrame + 1) % frames.length;
    frameElement.src = frames[currentFrame];
  }, 120);
}

/**
 * 로딩 종료
 */
function finishLoading() {
  const screenElement = document.getElementById("loading-screen");

  if (!screenElement) return;

  clearInterval(frameTimer);
  frameTimer = null;

  screenElement.style.opacity = "0";

  setTimeout(() => {
    screenElement.style.display = "none";
  }, 600);
}
