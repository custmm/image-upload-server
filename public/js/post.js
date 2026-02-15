
// ✅ 로딩 화면 표시 함수
function showLoading() {
  document.getElementById("loadingIndicator").style.display = "flex";
}

// ✅ 로딩 화면 숨김 함수
function hideLoading() {
  setTimeout(() => {
    document.getElementById("loadingIndicator").style.display = "none";
  }, 500); // 0.5초 후 숨김
}

function showPopupMessage(message) {
  const popup = document.getElementById("popupMessage");
  const popupText = document.getElementById("popupText");

  popupText.textContent = message;
  popup.style.display = "block";
}

function closePopup() {
  document.getElementById("popupMessage").style.display = "none";
}

// ✅ URL에서 파라미터 가져오기 (기본값을 사용하지 않음)
function getParamsFromURL() {
  const params = new URLSearchParams(window.location.search);
  return {
    category: params.get("category") ? decodeURIComponent(params.get("category")).trim() : null,
    subcategory: params.get("subcategory") ? decodeURIComponent(params.get("subcategory")).trim() : null,
    file: params.get("file") ? decodeURIComponent(params.get("file")).trim() : null
  };
}

function renderHashtags(text) {
  const hashtagContainer = document.querySelector('.hastag');
  hashtagContainer.innerHTML = '';

  if (!text) return;

  const matches = text.match(/#([\w가-힣]+)/g);
  if (!matches) return;

  matches.forEach(tag => {
    const cleanTag = tag.substring(1);
    const encoded = encodeURIComponent(cleanTag);

    const a = document.createElement('a');
    a.href = `tagResults?tag=${encoded}`;
    a.className = 'hashtag-link';
    a.textContent = tag;

    hashtagContainer.appendChild(a);
  });
}

// ✅ 서버에서 데이터 가져오기
async function loadPostData() {
  let { category, subcategory, file } = getParamsFromURL();

  if (!file) {
    document.getElementById("postDescription").innerHTML = "🚨 올바른 게시물을 찾을 수 없습니다.";
    return;
  }

  console.log(`📌 요청할 파일 정보: ${category} / ${subcategory} / ${file}`);

  // 🔥 로딩 시작
  showLoading();

  try {
    const apiURL = `/api/files/file?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}&file=${encodeURIComponent(file)}`;
    console.log("📌 요청 URL:", apiURL);

    const response = await fetch(apiURL);

    if (!response.ok) {
      throw new Error(`❌ 서버 응답 오류: ${response.status} - ${response.statusText}`);
    }

    const postData = await response.json();
    console.log("✅ 서버에서 불러온 게시물 데이터:", postData);

    document.getElementById("postImage").src =
      `${postData.file_path}`;
    document.getElementById("postCategory").textContent =
      postData.category_name || "카테고리 없음";

    document.getElementById("postCategory").addEventListener("click", () => {
      if (postData.category_name) {
        const categoryParam = encodeURIComponent(postData.category_name);
        window.location.href = `preview?category=${categoryParam}`;
      }
    });

    document.getElementById("postSubcategory").textContent =
      postData.subcategory_name || "서브카테고리 없음";

    document.getElementById("postTitle").textContent =
      postData.title || "제목 없음";
    document.title = postData.title || "게시물";

    const descriptionText = postData.file_description || "설명 없음";

    document.getElementById("postDescription").innerHTML =
      descriptionText.replace(/\n/g, "<br>");

    renderHashtags(descriptionText);
  } catch (error) {
    console.error("🚨 게시물 불러오기 오류:", error);
    document.getElementById("postDescription").innerHTML = "🚨 게시물을 불러오는 중 오류 발생";
  } finally {
    // 🔥 로딩 완료
    hideLoading();
  }
}

// ✅ HTML 태그 유지 및 불필요한 태그 제거
function sanitizeDescription(html) {
  // 글자 효과를 위해 필요한 태그를 추가할 수 있습니다.
  const allowedTags = ["b", "strong", "i", "em", "s", "strike", "u", "br", "span", "div", "p"];
  let doc = new DOMParser().parseFromString(html, "text/html");

  doc.body.querySelectorAll("*").forEach(node => {
    if (!allowedTags.includes(node.tagName.toLowerCase())) {
      node.replaceWith(document.createTextNode(node.innerText));
    }
  });

  // 줄바꿈 관련 치환 제거 – 엔터 1번으로 생성된 <br>가 그대로 유지됨
  return doc.body.innerHTML.trim();
}

// ✅ 페이지 로드 시 데이터 불러오기
document.addEventListener("DOMContentLoaded", () => {
  applySavedTheme(); // ✅ 테마 초기화
  loadPostData();
  bindDrawingEvents();        // 🔥 이 줄 추가
});

// ✅ "목록으로" 버튼 클릭 시 이전 페이지로 이동
document.getElementById("backToListButton").addEventListener("click", () => {
  window.history.back(); // 🔥 이전 페이지로 이동
});

// ✅ "공유" 버튼 클릭 시 현재 페이지 URL 복사
document.getElementById("shareButton").addEventListener("click", async () => {
  try {
    const postURL = window.location.href;
    await navigator.clipboard.writeText(postURL);
    showPopupMessage("📌 링크가 클립보드에 복사되었습니다!");
  } catch (err) {
    console.error("🚨 공유 실패:", err);
    showPopupMessage("❌ 링크 복사에 실패했습니다.");
  }
});
function bindDrawingEvents() {
  const drawingPopup = document.getElementById("drawing-popup");
  const openDrawingBtn = document.getElementById("picture");
  const closeDrawingBtn = document.getElementById("close-drawing");
  const clearCanvasBtn = document.getElementById("clearCanvas");
  const canvas = document.getElementById("drawingCanvas");
  const ctx = canvas.getContext("2d");

  let isDrawing = false;

  // 캔버스 크기 설정
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

  // 마우스 이벤트
  canvas.addEventListener("mousedown", function (e) {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  });

  // 그리기 중
  canvas.addEventListener("mousemove", function (e) {
    if (!isDrawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  });

  // 그리기 종료
  canvas.addEventListener("mouseup", function () {
    isDrawing = false;
  });

  canvas.addEventListener("mouseleave", function () {
    isDrawing = false;
  });

  // 터치 이벤트
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

  canvas.addEventListener("touchend", function () {
    isDrawing = false;
  });

  // 팝업 열기
  openDrawingBtn.addEventListener("click", function () {
    drawingPopup.style.display = "block";

    // 🔥 canvas 크기를 화면 표시 크기에 맞춰 재설정
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  });

  // 팝업 닫기
  closeDrawingBtn.addEventListener("click", function () {
    drawingPopup.style.display = "none";
  });

  // 캔버스 지우기
  clearCanvasBtn.addEventListener("click", function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}

// **🎨 그리기 기능 추가 (Drawing Feature)**
function initDrawingCanvas() {
  const canvas = document.getElementById("drawingCanvas");
  const ctx = canvas.getContext("2d");
  let drawing = false;

  canvas.width = 500;
  canvas.height = 400;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  canvas.addEventListener("mousedown", () => drawing = true);
  canvas.addEventListener("mouseup", () => drawing = false);
  canvas.addEventListener("mousemove", draw);

  function draw(event) {
    if (!drawing) return;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
  }

  document.getElementById("clearCanvas").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
}

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
