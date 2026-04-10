// [1] 테마 설정 및 적용
export function setTheme(mode) {
    const isDark = mode === "dark-mode" || mode === "dark";
    const actualMode = isDark ? "dark-mode" : "light-mode";
    const themeIcon = document.getElementById("themeIcon");
    const themeToggle = document.getElementById("themeToggle");    
    
    // 1. Body 클래스 교체
    document.body.classList.remove("light-mode", "dark-mode");
    document.body.classList.add(actualMode);    
    
    // 2. 체크박스 상태 동기화
    if (themeToggle) themeToggle.checked = isDark;    
    
    // 3. 배경 아이콘 교체
    if (themeIcon) {
        const iconName = isDark ? "toggle_dark.svg" : "toggle_light.svg";
        themeIcon.style.backgroundImage = `url('../images/toggle/${iconName}')`;
    }    
    // 4. 로컬 스토리지 저장
    localStorage.setItem("theme", actualMode);
}

// [2] 팝업 메시지 출력
export function showPopupMessage(msg) {
    const popup = document.createElement("div");
    popup.classList.add("popup-message");
    popup.innerHTML = msg.replace(/\n/g, "<br>");
    document.body.appendChild(popup);

    requestAnimationFrame(() => popup.style.opacity = "1");

    setTimeout(() => {
        popup.style.opacity = "0";
        setTimeout(() => popup.remove(), 300);
    }, 2000);
}