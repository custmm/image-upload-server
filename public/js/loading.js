const frames = [
  "../images/alian/ester_01.png",
  "../images/alian/ester_02.png",
  "../images/alian/ester_03.png",
  "../images/alian/ester_04.png",
  "../images/alian/ester_05.png"
];

let currentFrame = 0;
let frameTimer = null;
let frameElement = null;
let screenElement = null;

/**
 * 로딩 애니메이션 시작
 */
function startLoading() {
  frameElement = document.getElementById("loading-frame");
  screenElement = document.getElementById("loading-screen");

  if (!frameElement || !screenElement) {
    console.warn("Loading elements not found");
    return;
  }

  screenElement.style.display = "flex";

  frameElement.src = frames[0];

  frameTimer = setInterval(() => {
    currentFrame = (currentFrame + 1) % frames.length;
    frameElement.src = frames[currentFrame];
  }, 120);
}

/**
 * 로딩 종료
 */
function finishLoading() {
  if (!screenElement) return;

  clearInterval(frameTimer);
  frameTimer = null;
  currentFrame = 0;

  screenElement.style.opacity = "0";
  screenElement.style.transition = "opacity 0.6s ease";

  setTimeout(() => {
    screenElement.style.display = "none";
  }, 600);
}
