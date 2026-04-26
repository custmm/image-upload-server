// 전역 변수 설정 (함수 밖 최상단에 위치)
let loaderInterval = null;
let loaderStep = 0;


function showLoading() {
    const indicator = document.getElementById("loadingIndicator");
    const loader = document.getElementById("mainLoader");

    indicator.style.display = "flex";

    loaderInterval = setInterval(() => {
        loaderStep++;
        if (loaderStep > 4) loaderStep = 1;

        loader.className = "loader loader" + loaderStep;
    }, 150); // 속도 조절 가능
}


document.addEventListener("DOMContentLoaded", () => {
    showLoading(); // 페이지 열리자마자 아이콘이 뜨는지 확인
});