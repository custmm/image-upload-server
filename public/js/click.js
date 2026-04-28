
document.addEventListener("DOMContentLoaded", () => {
  // 1. 요소 선택
  const container = document.querySelector(".explan-container");
  const toggleButtons = document.querySelectorAll(".detail-toggle");

  const backBtn = document.querySelector(".back-button");
  const themeToggle = document.getElementById("themeToggle");


  // 1. 뒤로가기 버튼 이벤트 (가장 확실한 방법)
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = 'preview.html';
    });
  }

  // 2. 초기 상태 적용
  const savedOpacity = localStorage.getItem("sharedOpacity");
  if (savedOpacity && container) {
    container.style.opacity = savedOpacity;
  }
  applySavedTheme();

  // 3. 다크모드 토글
  if (themeToggle) {
    themeToggle.addEventListener("change", () => {
      toggleTheme();
    });
  }

  // 4. 상세 내용 토글 (▽/△)
  toggleButtons.forEach(button => {
    button.addEventListener("click", () => {
      const detail = button.closest(".plus_container").querySelector(".detail-content");
      const isVisible = detail.style.display === "block";
      detail.style.display = isVisible ? "none" : "block";
      button.textContent = isVisible ? "▽" : "△";
    });
  });

  // 5. 체험하기 링크 해시태그 추가
  document.querySelectorAll('.plus_container a').forEach(link => {
    if (!link.href.includes('#explan')) {
      link.href += '#explan';
    }
  });

  // 6. 팝업 진입 시 히스토리 추가 (뒤로가기 제어용)
  if (window.location.hash.includes('explan')) {
    // 상태 객체({ page: 'explan' })를 명확히 전달
    history.pushState({ page: 'explan' }, "", window.location.href);
  }

  // 7. [뒤로가기 강화] 브라우저 뒤로가기 감지
  window.addEventListener("popstate", () => {
    // A. 테마 및 불투명도 재적용
    applySavedTheme();
    const currentOpacity = localStorage.getItem("sharedOpacity");
    if (currentOpacity && container) {
      container.style.opacity = currentOpacity;
    }

    // B. 페이지 이탈 로직
    // 사용자가 뒤로가기를 눌러 state가 사라졌거나 explan 페이지가 아니라면 이동
    if (!event.state || event.state.page !== 'explan') {
      window.location.href = 'preview.html';
    }
  });
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