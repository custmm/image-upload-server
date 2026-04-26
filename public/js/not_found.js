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
    // --- [CSP 해결을 위한 클릭 이벤트 리스너 추가] ---
    const btnBack = document.getElementById("btnBack");
    if (btnBack) {
        btnBack.addEventListener("click", () => {
            history.back(); // 이전 페이지로 이동
        });
    }
});

window.addEventListener('offline', () => {
    alert("인터넷 연결이 끊겼습니다! 오프라인 모드로 전환합니다.");
    window.location.href = "./not_found.html";
});

window.addEventListener('online', () => {

    alert("인터넷이 다시 연결되었습니다!");

});