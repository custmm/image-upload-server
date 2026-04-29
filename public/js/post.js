
let loaderStep = 1;
let loaderInterval = null;

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

function hideLoading() {
  clearInterval(loaderInterval);
  loaderInterval = null;

  document.getElementById("loadingIndicator").style.display = "none";
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
  hashtagContainer.innerHTML = '';

  if (!text) return;

  const matches = text.match(/#([\w가-힣]+)/g);
  if (!matches) return;

  matches.forEach(tag => {
    const cleanTag = tag.substring(1);
    const encoded = encodeURIComponent(cleanTag);

    const a = document.createElement('a');
    a.href = `search?tag=${encoded}`;
    a.className = 'hashtag-link';
    a.textContent = tag;

    hashtagContainer.appendChild(a);
  });
}

//  서버에서 데이터 가져오기
async function loadPostData() {
  let { id } = getParamsFromURL();
  if (!id) {
    document.getElementById("postDescription").innerHTML =
      "올바른 게시물을 찾을 수 없습니다.";
    return;
  }

  showLoading();

  try {
    const apiURL = `/api/files/${id}`;
    const response = await fetch(apiURL);
    if (!response.ok) throw new Error("서버 응답 오류");

    const postData = await response.json();

    // --- [데이터 렌더링 기존 코드] ---
    document.getElementById("postImage").src = `${postData.file_path}`;
    document.getElementById("postCategory").textContent = postData.category_name || "카테고리 없음";

    // 카테고리 클릭 이벤트 추가
    document.getElementById("postCategory").onclick = () => {
      const cat = postData.category_name;
      const sub = postData.subcategory_name;

      if (cat) {
        let url = `preview?category=${encodeURIComponent(cat)}`;
        if (sub) {
          url += `&subcategory=${encodeURIComponent(sub)}`;
        }
        window.location.href = url;
      }
    };

    document.getElementById("postSubcategory").textContent = postData.subcategory_name || "서브카테고리 없음";
    document.getElementById("postTitle").textContent = postData.title || "제목 없음";
    document.title = postData.title || "게시물";

    // 설명 및 해시태그 처리 (기존 로직)
    const descriptionText = postData.text || postData.description?.text || "";
    document.getElementById("postDescription").innerHTML = descriptionText.replace(/#([\w가-힣]+)/g, "").replace(/\n/g, "<br>").trim();
    renderHashtags(descriptionText);

    // --- [추가: 이전/다음 버튼 로직] ---
    const prevBtn = document.getElementById("prevPostButton");
    const nextBtn = document.getElementById("nextPostButton");

    // 이전 글 데이터가 있으면 이동 이벤트 연결, 없으면 버튼 숨김
    if (postData.prev_id) {
      prevBtn.style.display = "inline-block";
      prevBtn.onclick = () => { window.location.href = `post?id=${postData.prev_id}`; };
    }

    // 다음 글 데이터가 있으면 이동 이벤트 연결, 없으면 버튼 숨김
    if (postData.next_id) {
      nextBtn.style.display = "inline-block";
      nextBtn.onclick = () => { window.location.href = `post?id=${postData.next_id}`; };
    }

  } catch (error) {
    console.error("게시물 불러오기 오류:", error);
    document.getElementById("postDescription").innerHTML = "게시물을 불러오는 중 오류 발생";
  } finally {
    hideLoading();
  }
}

//  HTML 태그 유지 및 불필요한 태그 제거
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

    //  canvas 크기를 화면 표시 크기에 맞춰 재설정
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

//  다크 모드 토글 함수
function toggleTheme() {
  const body = document.body;
  const isDarkMode = body.classList.toggle("dark-mode");
  const themeIcon = document.getElementById("themeIcon");

  if (isDarkMode) {
    localStorage.setItem("theme", "dark");
    themeToggle.checked = true;
    if (themeIcon) {
      themeIcon.style.backgroundImage = "url('../images/toggle/toggle_dark.svg')";
    }
  } else {
    localStorage.setItem("theme", "light");
    themeToggle.checked = false;
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

function setTheme(mode) {
  document.body.classList.remove("light-mode", "dark-mode");
  document.body.classList.add(mode);

  localStorage.setItem("theme", mode);
}

//  페이지 로드 시 데이터 불러오기
document.addEventListener("DOMContentLoaded", () => {
  applySavedTheme(); //  테마 초기화
  loadPostData();
  bindDrawingEvents();        //  이 줄 추가
});

//  "목록으로" 버튼 클릭 시 이전 페이지로 이동
document.getElementById("backToListButton").addEventListener("click", () => {
  window.history.back(); //  이전 페이지로 이동
});

//  "공유" 버튼 클릭 시 현재 페이지 URL 복사
document.getElementById("shareButton").addEventListener("click", async () => {
  try {
    const postURL = window.location.href;
    await navigator.clipboard.writeText(postURL);
    showPopupMessage("📌 링크가 클립보드에 복사되었습니다!");
  } catch (err) {
    console.error(" 공유 실패:", err);
    showPopupMessage(" 링크 복사에 실패했습니다.");
  }
});
