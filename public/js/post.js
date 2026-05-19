let loaderStep = 1;
let loaderInterval = null;

function showLoading() {
  const indicator = document.getElementById("loadingIndicator");
  const loader = document.getElementById("mainLoader");

  if (indicator) indicator.style.display = "flex";

  if (loader) {
    loaderInterval = setInterval(() => {
      loaderStep++;
      if (loaderStep > 4) loaderStep = 1;
      loader.className = "loader loader" + loaderStep;
    }, 150);
  }
}

function hideLoading() {
  if (loaderInterval) {
    clearInterval(loaderInterval);
    loaderInterval = null;
  }
  const indicator = document.getElementById("loadingIndicator");
  if (indicator) indicator.style.display = "none";
}

function showPopupMessage(message) {
  const popup = document.getElementById("popupMessage");
  const popupText = document.getElementById("popupText");

  if (popupText) popupText.textContent = message;
  if (popup) popup.style.display = "block";
}

function closePopup() {
  const popup = document.getElementById("popupMessage");
  if (popup) popup.style.display = "none";
}

//  URL에서 파라미터 가져오기
function getParamsFromURL() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  return {
    id: id ? parseInt(id, 10) : null
  };
}

function renderHashtags(text) {
  const hashtagContainer = document.querySelector('.hastag');
  if (!hashtagContainer) return;
  hashtagContainer.innerHTML = '';

  if (!text) return;

  const matches = text.match(/#([\w가-힣]+)/g);
  if (!matches) return;

  matches.forEach(tag => {
    const cleanTag = tag.substring(1);
    const encoded = encodeURIComponent(cleanTag);

    const a = document.createElement('a');
    a.classTarget = "_self";
    a.href = `search?tag=${encoded}`;
    a.className = 'hashtag-link';
    a.textContent = tag;

    hashtagContainer.appendChild(a);
  });
}

//  서버에서 데이터 가져오기
async function loadPostData() {
  let { id } = getParamsFromURL();
  const descEl = document.getElementById("postDescription");
  
  if (!id) {
    if (descEl) descEl.innerHTML = "올바른 게시물을 찾을 수 없습니다.";
    return;
  }

  showLoading();

  try {
    const apiURL = `/api/files/${id}`;
    const response = await fetch(apiURL);
    if (!response.ok) throw new Error("서버 응답 오류");

    const postData = await response.json();

    // 데이터 요소 가져오기
    const postImage = document.getElementById("postImage");
    const postCategory = document.getElementById("postCategory");
    const postSubcategory = document.getElementById("postSubcategory");
    const postTitle = document.getElementById("postTitle");
    const toggleBtn = document.getElementById("toggleDescButton");

    // 데이터 렌더링
    if (postImage) postImage.src = `${postData.file_path}`;
    
    if (postCategory) {
      postCategory.textContent = postData.category_name || "카테고리 없음";

      // 🔹 [핵심 수정 포인트 1] CSP 위반을 방지하기 위해 .onclick 대신 addEventListener 사용
      // 기존에 연결된 리스너 오작동 방지를 위해 고유 데이터 플래그 활용
      if (!postCategory.dataset.bound) {
        postCategory.dataset.bound = "true";
        postCategory.addEventListener("click", () => {
          const cat = postData.category_name;
          const sub = postData.subcategory_name;

          if (cat) {
            let url = `preview?category=${encodeURIComponent(cat)}`;
            if (sub) {
              url += `&subcategory=${encodeURIComponent(sub)}`;
            }
            window.location.href = url;
          }
        });
      }
    }

    if (postSubcategory) postSubcategory.textContent = postData.subcategory_name || "서브카테고리 없음";
    if (postTitle) postTitle.textContent = postData.title || "제목 없음";
    document.title = postData.title || "게시물";

    // 설명 및 해시태그 처리
    const descriptionText = postData.text || postData.description?.text || "";

    if (descEl && toggleBtn) {
      // 초기화: 펼쳐진 상태 제거 및 텍스트 삽입
      descEl.classList.remove("expanded");
      descEl.innerHTML = descriptionText
        .replace(/#([\w가-힣]+)/g, "")
        .replace(/\n/g, "<br>")
        .trim();

      renderHashtags(descriptionText);

      // 텍스트가 렌더링된 후 높이를 측정하기 위해 setTimeout 사용
      setTimeout(() => {
        if (descEl.scrollHeight > descEl.clientHeight) {
          toggleBtn.style.display = "block"; // 버튼 보여줌
          toggleBtn.textContent = "펼치기";
        } else {
          toggleBtn.style.display = "none"; // 글이 짧으면 버튼 숨김
        }
      }, 200);

      // 🔹 [핵심 수정 포인트 2] 펼치기 버튼 이벤트도 안전하게 처리
      if (!toggleBtn.dataset.bound) {
        toggleBtn.dataset.bound = "true";
        toggleBtn.addEventListener("click", () => {
          const isExpanded = descEl.classList.toggle("expanded");
          toggleBtn.textContent = isExpanded ? "접기" : "펼치기";
          if (!isExpanded) {
              descEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      }
    }

    // --- [이전/다음 버튼 로직 안전하게 연결] ---
    const prevBtn = document.getElementById("prevPostButton");
    const nextBtn = document.getElementById("nextPostButton");

    if (postData.prev_id && prevBtn && !prevBtn.dataset.bound) {
      prevBtn.dataset.bound = "true";
      prevBtn.addEventListener("click", () => {
        window.location.href = `post?id=${postData.prev_id}`;
      });
    }

    if (postData.next_id && nextBtn && !nextBtn.dataset.bound) {
      nextBtn.dataset.bound = "true";
      nextBtn.addEventListener("click", () => {
        window.location.href = `post?id=${postData.next_id}`;
      });
    }

  } catch (error) {
    console.error("게시물 불러오기 오류:", error);
    const descEl = document.getElementById("postDescription");
    if (descEl) descEl.innerHTML = "게시물을 불러오는 중 오류 발생";
  } finally {
    hideLoading();
  }
}

//  HTML 태그 유지 및 불필요한 태그 제거
function sanitizeDescription(html) {
  const allowedTags = ["b", "strong", "i", "em", "s", "strike", "u", "br", "span", "div", "p"];
  let doc = new DOMParser().parseFromString(html, "text/html");

  doc.body.querySelectorAll("*").forEach(node => {
    if (!allowedTags.includes(node.tagName.toLowerCase())) {
      node.replaceWith(document.createTextNode(node.innerText));
    }
  });

  return doc.body.innerHTML.trim();
}

function bindDrawingEvents() {
  const drawingPopup = document.getElementById("drawing-popup");
  const openDrawingBtn = document.getElementById("picture");
  const closeDrawingBtn = document.getElementById("close-drawing");
  const clearCanvasBtn = document.getElementById("clearCanvas");
  const downloadCanvasBtn = document.getElementById("downloadCanvas");
  const canvas = document.getElementById("drawingCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let isDrawing = false;

  canvas.width = 500;
  canvas.height = 300;

  function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.offsetX,
        y: e.offsetY
      };
    }
  }

  canvas.addEventListener("mousedown", function (e) {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  });

  canvas.addEventListener("mousemove", function (e) {
    if (!isDrawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  });

  canvas.addEventListener("mouseup", function () { isDrawing = false; });
  canvas.addEventListener("mouseleave", function () { isDrawing = false; });

  canvas.addEventListener("touchstart", function (e) {
    isDrawing = true;
    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener("touchmove", function (e) {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener("touchend", function () { isDrawing = false; });

  if (openDrawingBtn && drawingPopup) {
    openDrawingBtn.addEventListener("click", function () {
      drawingPopup.style.display = "block";
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    });
  }

  if (closeDrawingBtn && drawingPopup) {
    closeDrawingBtn.addEventListener("click", function () {
      drawingPopup.style.display = "none";
    });
  }

  if (clearCanvasBtn) {
    clearCanvasBtn.addEventListener("click", function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }
  
  if (downloadCanvasBtn) {
    downloadCanvasBtn.addEventListener("click", function () {
      const dataURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = `drawing_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
}

function toggleTheme() {
  const body = document.body;
  const isDarkMode = body.classList.toggle("dark-mode");
  const themeIcon = document.getElementById("themeIcon");
  const themeToggle = document.getElementById("themeToggle");

  if (isDarkMode) {
    localStorage.setItem("theme", "dark");
    if (themeToggle) themeToggle.checked = true;
    if (themeIcon) {
      themeIcon.style.backgroundImage = "url('../images/toggle/toggle_dark.svg')";
    }
  } else {
    localStorage.setItem("theme", "light");
    if (themeToggle) themeToggle.checked = false;
    if (themeIcon) {
      themeIcon.style.backgroundImage = "url('../images/toggle/toggle_light.svg')";
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
      themeIcon.style.backgroundImage = "url('../images/toggle/toggle_dark.svg')";
    }
  } else {
    document.body.classList.remove("dark-mode");
    if (themeToggle) themeToggle.checked = false;
    if (themeIcon) {
      themeIcon.style.backgroundImage = "url('../images/toggle/toggle_light.svg')";
    }
  }
}

// 🚀 페이지 로드 시 실행되는 부분
document.addEventListener("DOMContentLoaded", () => {
  applySavedTheme(); 
  loadPostData();
  bindDrawingEvents();

  const themeToggleInput = document.getElementById("themeToggle");
  if (themeToggleInput) {
    themeToggleInput.addEventListener("change", toggleTheme);
  }
  
  const closePopupBtn = document.getElementById("closePopupBtn"); // HTML 구조에 맞게 ID 확인 필요
  if (closePopupBtn) {
    closePopupBtn.addEventListener("click", closePopup);
  }
});

// "공유" 버튼 클릭 시 현재 페이지 URL 복사
const shareButton = document.getElementById("shareButton");
if (shareButton) {
  shareButton.addEventListener("click", async () => {
    try {
      const postURL = window.location.href;
      await navigator.clipboard.writeText(postURL);
      showPopupMessage(" 링크가 클립보드에 복사되었습니다!");
    } catch (err) {
      console.error(" 공유 실패:", err);
      showPopupMessage(" 링크 복사에 실패했습니다.");
    }
  });
}