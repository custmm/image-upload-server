
document.addEventListener("DOMContentLoaded", () => {
  const toggleButtons = document.querySelectorAll(".detail-toggle");
  const container = document.querySelector(".explan-container");
  const savedOpacity = localStorage.getItem("sharedOpacity");

  if (savedOpacity && container) {
    container.style.opacity = savedOpacity;
  }

  toggleButtons.forEach(button => {
    button.addEventListener("click", () => {
      const detail = button.closest(".plus_container").querySelector(".detail-content");
      const isVisible = detail.style.display === "block";
      detail.style.display = isVisible ? "none" : "block";
      button.textContent = isVisible ? "▽" : "△";
    });
  });

  // 🔥 [추가] 브라우저 뒤로가기/앞으로가기 감지
  window.addEventListener("popstate", (event) => {
    // 테마나 투명도 등 저장된 설정을 다시 적용하여 화면 갱신
    applySavedTheme();
    const savedOpacity = localStorage.getItem("sharedOpacity");
    if (savedOpacity && container) {
      container.style.opacity = savedOpacity;
    }

    // 만약 해시(#explan)에 따라 보여주는 내용이 다르다면 여기서 제어
    console.log("뒤로가기 동작 감지됨");
  });

  // 체험하기 링크에 #explan 자동 붙이기
  document.querySelectorAll('.plus_container a').forEach(link => {
    if (!link.href.includes('#explan')) {
      link.href += '#explan';
    }
  });
  
  // 팝업 진입 시 가짜 히스토리 하나 추가 (뒤로가기 방어용)
  if (window.location.hash.includes('explan')) {
    history.pushState(null, null, window.location.href);
  }
});

// 다크 모드 토글 함수
function toggleTheme() {
  const body = document.body;
  const isDarkMode = body.classList.toggle("dark-mode");
  const themeIcon = document.getElementById("themeIcon");

  if (isDarkMode) {
    localStorage.setItem("theme", "dark");
    themeToggle.checked = true;
    if (themeIcon) {
      themeIcon.style.backgroundImage = "url('../images/toggle_dark.svg')";
    }
  } else {
    localStorage.setItem("theme", "light");
    themeToggle.checked = false;
    if (themeIcon) {
      themeIcon.style.backgroundImage = "url('../images/toggle_light.svg')";
    }
  }
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  const themeIcon = document.getElementById("themeIcon");
  const themeToggle = document.getElementById("themeToggle");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    if (themeToggle) themeToggle.checked = true;
    if (themeIcon) {
      themeIcon.style.backgroundImage = "url('../images/toggle_dark.svg')";
    }
  } else {
    document.body.classList.remove("dark-mode");
    if (themeToggle) themeToggle.checked = false;
    if (themeIcon) {
      themeIcon.style.backgroundImage = "url('../images/toggle_light.svg')";
    }
  }
}

function setTheme(mode) {
  document.body.classList.remove("light-mode", "dark-mode");
  document.body.classList.add(mode);

  localStorage.setItem("theme", mode);
}