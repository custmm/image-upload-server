
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
      // 체험하기 링크에 #explan 자동 붙이기
      document.querySelectorAll('.plus_container a').forEach(link => {
        if (!link.href.includes('#explan')) {
          link.href += '#explan';
        }
      });
    });
    
    // ✅ 다크 모드 토글 함수
    function toggleTheme() {
      const body = document.body;
      const isDarkMode = body.classList.toggle("dark-mode");
      const themeIcon = document.getElementById("themeIcon");

      if (isDarkMode) {
        localStorage.setItem("theme", "dark");
        themeToggle.checked = true;
        if (themeIcon) themeIcon.textContent = "💤";
      } else {
        localStorage.setItem("theme", "light");
        themeToggle.checked = false;
        if (themeIcon) themeIcon.textContent = "☀️";
      }
    }

    function applySavedTheme() {
      const savedTheme = localStorage.getItem("theme") || "light";
      const themeIcon = document.getElementById("themeIcon");

      if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        themeToggle.checked = true;
        if (themeIcon) themeIcon.textContent = "💤";
      } else {
        document.body.classList.remove("dark-mode");
        themeToggle.checked = false;
        if (themeIcon) themeIcon.textContent = "☀️";
      }
    }