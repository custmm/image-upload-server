
document.addEventListener("DOMContentLoaded", () => {
  // 1. 요소 선택
  const container = document.querySelector(".explan-container");
  const toggleButtons = document.querySelectorAll(".detail-toggle");
  const backBtn = document.getElementById("backBtn");
  const themeToggle = document.getElementById("themeToggle");

  // 2. 초기 상태 적용 (투명도 & 테마)
  const savedOpacity = localStorage.getItem("sharedOpacity");
  if (savedOpacity && container) {
    container.style.opacity = savedOpacity;
  }
  applySavedTheme();

  // 3. [보안 해결] 뒤로가기 버튼 이벤트 연결 (CSP 에러 방지)
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = 'preview.html';
    });
  }

  // 4. [보안 해결] 다크모드 토글 이벤트 연결 (CSP 에러 방지)
  if (themeToggle) {
    themeToggle.addEventListener("change", () => {
      toggleTheme();
    });
  }

  // 5. 상세 내용 토글 로직 (▽/△)
  toggleButtons.forEach(button => {
    button.addEventListener("click", () => {
      const detail = button.closest(".plus_container").querySelector(".detail-content");
      const isVisible = detail.style.display === "block";
      detail.style.display = isVisible ? "none" : "block";
      button.textContent = isVisible ? "▽" : "△";
    });
  });

  // 6. [뒤로가기 강화] 브라우저 뒤로가기 감지
  window.addEventListener("popstate", () => {
    applySavedTheme();
    const currentOpacity = localStorage.getItem("sharedOpacity");
    if (currentOpacity && container) {
      container.style.opacity = currentOpacity;
    }
  });

  // 7. 체험하기 링크에 #explan 자동 붙이기
  document.querySelectorAll('.plus_container a').forEach(link => {
    if (!link.href.includes('#explan')) {
      link.href += '#explan';
    }
  });

  // 8. 팝업 진입 시 가짜 히스토리 추가 (뒤로가기 활성화용)
  if (window.location.hash.includes('explan')) {
    history.pushState({ page: 'explan' }, "", window.location.href);
  }

  // [추가] 브라우저 뒤로가기/앞으로가기 감지
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



  // 팝업 진입 시 가짜 히스토리 하나 추가 (뒤로가기 방어용)
  if (window.location.hash.includes('explan')) {
    history.pushState(null, null, window.location.href);
  }
});

/**
 * 1. 테마 상태에 따라 UI를 한꺼번에 업데이트하는 함수 (중복 제거)
 */
function setThemeUI(isDark) {
  const body = document.body;
  const themeIcon = document.getElementById("themeIcon");
  const themeToggle = document.getElementById("themeToggle");
  const mode = isDark ? "dark" : "light";

  // 클래스 교체
  body.classList.toggle("dark-mode", isDark);
  body.classList.toggle("light-mode", !isDark);

  // 체크박스 상태 동기화 (CSP 에러 방지를 위해 요소 존재 확인)
  if (themeToggle) {
    themeToggle.checked = isDark;
  }

  // 아이콘 이미지 변경
  if (themeIcon) {
    themeIcon.style.backgroundImage = `url('../images/toggle/toggle_${mode}.svg')`;
  }

  // 데이터 저장
  localStorage.setItem("theme", mode);
}

/**
 * 2. 클릭했을 때 실행되는 토글 함수
 */
function toggleTheme() {
  // 현재 다크모드인지 확인 후 반대로 설정
  const isCurrentlyDark = document.body.classList.contains("dark-mode");
  setThemeUI(!isCurrentlyDark);
}

/**
 * 3. 페이지 로드 시 저장된 테마를 불러오는 함수
 */
function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme") || "light-mode";
  // 'dark'가 포함되어 있으면 다크모드로 판단
  const isDark = savedTheme.includes("dark");
  setThemeUI(isDark);
}

function setTheme(mode) {
  document.body.classList.remove("light-mode", "dark-mode");
  document.body.classList.add(mode);

  localStorage.setItem("theme", mode);
}