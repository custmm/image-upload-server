const frames = [
  "images/alian/ester_01.png",
  "images/alian/ester_02.png",
  "images/alian/ester_03.png",
  "images/alian/ester_04.png",
  "images/alian/ester_05.png"
];

let currentFrame = 0;
const frameElement = document.getElementById("loading-frame");

// 프레임 애니메이션
const frameTimer = setInterval(() => {
  currentFrame = (currentFrame + 1) % frames.length;
  frameElement.src = frames[currentFrame];
}, 120);

// 가짜 로딩 시간 (테스트용)
setTimeout(() => {
  finishLoading();
}, 3000);

function finishLoading() {
  clearInterval(frameTimer);

  const screen = document.getElementById("loading-screen");
  screen.style.opacity = "0";
  screen.style.transition = "opacity 0.6s ease";

  setTimeout(() => {
    // 실제 서비스에서는 여기서 메인 페이지로 이동
    // location.href = "../index.html";
    console.log("Loading finished");
  }, 600);
}
