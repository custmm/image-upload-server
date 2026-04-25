// 전역 변수 설정
let loaderInterval = null;
let loaderStep = 0;

export function showLoading() {
    const indicator = document.getElementById("loadingIndicator");
    const loader = document.getElementById("mainLoader");
    if (!indicator || !loader) return;

    indicator.style.display = "flex";
    loaderInterval = setInterval(() => {
        loaderStep++;
        if (loaderStep > 4) loaderStep = 1;
        loader.className = "loader loader" + loaderStep;
    }, 100);
}

export function hideLoading() {
    if (loaderInterval) {
        clearInterval(loaderInterval);
        loaderInterval = null;
    }
    const indicator = document.getElementById("loadingIndicator");
    if (indicator) indicator.style.display = "none";
}

export function checkAuth() {
    const token = localStorage.getItem("adminToken");
    const loader = document.getElementById("authLoader");

    const isExpired = (token) => {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.exp < Date.now() / 1000;
        } catch { return true; }
    };

    if (!token || isExpired(token)) {
        localStorage.removeItem("adminToken");
        alert("관리자 인증이 필요합니다.");
        window.location.href = "admin-login.html";
        return false;
    }

    if (loader) loader.style.display = "none";
    document.body.classList.remove("auth-lock");
    return true;
}