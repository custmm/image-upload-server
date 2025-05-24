    let loadedImages = 0; // ✅ 로드된 이미지 수
    const batchSize = 24; // ✅ 한 번에 24개씩 로드
    let currentCategoryId = null; // ✅ 현재 선택된 카테고리 ID
    let isLoading = false; // 이미지가 로딩 중인지 여부
    let noMoreImages = false; // 더 이상 이미지가 없는지 여부
    let currentMode = "image"; // ✅ 기본 모드는 이미지 모드
    let isPopupOpen = false;  // ✅ 팝업 상태 변수 추가
    let chartClickHandlerRegistered = false;

    if(!window.observer){
        window.observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.loaded === "false") {
                        img.src = img.dataset.src;
                        img.dataset.loaded = "true";
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: "0px 0px 200px 0px" // 로딩되는 시점을 조정 (200px 만큼 미리 로드)
        });
    }

    function showpopup(message){
        if (isPopupOpen) return;  // ✅ 팝업이 열려 있으면 실행 중단
        isPopupOpen = true;  // ✅ 팝업 열림 상태로 변경

        // 팝업 오버레이(배경 컨테이너) 생성
        const overlay = document.createElement("div");
        overlay.className = "popup-overlay";
            
        // 팝업 메시지 컨테이너 생성 (오버레이 내부에 위치)
        const popup = document.createElement("div");
        popup.className = "popup-container";

        // 메시지 요소 생성
        const messageEl = document.createElement("p");
        messageEl.textContent = message;
        popup.appendChild(messageEl);

        // 확인 버튼 생성 (팝업 컨테이너 안으로 넣음)
        const confirmButton = document.createElement("button");
        confirmButton.classList.add("popup-confirm-button");  // ← 클래스 추가
        confirmButton.textContent = "확인";
        confirmButton.addEventListener("click", () => {
            console.log("✅ 팝업 확인 버튼 클릭됨");  // 확인 로그
            overlay.remove();
            isPopupOpen = false;  // ✅ 팝업 닫힘 상태로 변경
        });

        // 확인 버튼을 팝업에 추가하고, 팝업을 오버레이에 추가 후, 오버레이를 body에 추가
        popup.appendChild(confirmButton);
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
    }

    function showeditpopup(message, callback) {
        const popup = document.createElement("div");
        popup.className = "popup-edit-container";
    
        popup.innerHTML = `
            <p style="margin-bottom: 20px;">${message}</p>
            <button id="popup-ok">확인</button>
            ${callback ? `<button id="popup-cancel" style="margin-left: 10px;">취소</button>` : ""}
        `;
    
        document.body.appendChild(popup);
    
        document.getElementById("popup-ok").onclick = () => {
            popup.remove();
            if (callback) callback();
        };
    
        const cancelButton = document.getElementById("popup-cancel");
        if (cancelButton) {
            cancelButton.onclick = () => {
                popup.remove();
            };
        }
    }
    

    document.addEventListener("DOMContentLoaded", () => {
        console.log("📌 모든 카테고리에서 이미지 로드 시작");
        currentCategoryId = null; // ✅ 모든 카테고리 로드
        
        // 스크롤 이벤트에 throttle 적용
        const container = document.querySelector(".post-form-container");
        container.classList.add("image-mode");
        container.classList.remove("text-mode");

        const imageGallery = document.createElement("div");
        imageGallery.id = "imageGallery";
        imageGallery.classList.add("gallery-container");
        Object.assign(imageGallery.style, {
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "10px",
            justifyItems: "center",
            alignItems: "center"
        });
        container.appendChild(imageGallery);

        fetchImages(currentMode,true); // ✅ 페이지 로드 시 이미지 불러오기
        // 스크롤 이벤트에 throttle 적용
        container.addEventListener("scroll", throttle(() => {
            if (container.scrollTop + container.clientHeight >= container.scrollHeight - 10) {
                if (!isLoading && !noMoreImages) {
                    fetchImagesDebounced(currentMode);
                }
            }
        }, 700));

        renderCharts();
        bindDrawingEvents();
        bindIndicatorEvents();
        bindModeSwitchEvents();
        bindSidebarEvents();
    });
       
    function bindDrawingEvents(){
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

    function updateButtonState(){       
        const showindicatorBtn = document.getElementById("show-indicator");
        const hideindicatorBtn = document.getElementById("hide-indicator");
        const previewState = localStorage.getItem("previewVisible");

        if (previewState === "hidden") {
            hideindicatorBtn.style.display = "none";
            showindicatorBtn.style.display = "inline-block";
        }else{
            hideindicatorBtn.style.display = "inline-block";
            showindicatorBtn.style.display = "none";
        }
    }   

    async function fetchIndicatorStatus() {
        try {
            const res = await fetch("/api/indicator-status");
            if (!res.ok) throw new Error("Indicator 상태 가져오기 실패");
    
            const data = await res.json();
            const previewVisible = data.visible ? "visible" : "hidden";
            localStorage.setItem("previewVisible", previewVisible);
            updateButtonState(); // 버튼 업데이트
        } catch (error) {
            console.error("🚨 Indicator 상태 가져오기 오류:", error);
        }
    }
    
    async function updateIndicatorStatusOnServer(visible) {
        try {
            await fetch("/api/indicator-status", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visible })
            });
        } catch (error) {
            console.error("🚨 Indicator 서버 업데이트 오류:", error);
        }
    }
    

    function bindIndicatorEvents(){
        const showindicatorBtn = document.getElementById("show-indicator");
        const hideindicatorBtn = document.getElementById("hide-indicator");
 
        hideindicatorBtn.addEventListener("click", async function() {            
            localStorage.setItem("previewVisible", "hidden"); // 상태 저장
            await updateIndicatorStatusOnServer(false); // 서버 반영
            updateButtonState();
            showpopup("이미지 표시기가 제거되었습니다."); // 팝업 추가
        });

        showindicatorBtn.addEventListener("click",async function() {
            localStorage.setItem("previewVisible","visible");
            await updateIndicatorStatusOnServer(true); // 서버 반영
            updateButtonState();
            showpopup("이미지 표시기가 나타났습니다."); // 팝업 추가
        });

    // 최초 상태 동기화
    fetchIndicatorStatus();

    // 주기적으로 서버 상태 확인 (ex: 5초마다)
    setInterval(fetchIndicatorStatus, 5000);
    }    

    async function fetchImages(mode = "image", append = false) {
        if (isLoading || noMoreImages) return;
        isLoading = true;
    
        try {
            const url = `/api/files?offset=${loadedImages}&limit=${batchSize}`;
            console.log(`📌 이미지 요청 URL: ${url}`);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`서버 응답 오류: ${response.status} ${response.statusText}`);
    
            // 1) API가 { total, files } 형태로 내려주면 files 프로퍼티를, 아니면 그대로 배열로 처리
            const resJson = await response.json();
            const images = Array.isArray(resJson) ? resJson : resJson.files;

            // 2) 전체 개수가 필요하면 resJson.total을 사용 가능
            if (resJson.total !== undefined) {
                // 예: 더 이상 로드할 게 없으면 noMoreImages = true
                noMoreImages = (loadedImages + images.length) >= resJson.total;
            }
            
            console.log("✅ 서버에서 불러온 이미지:", images);
    
            let galleryContainer = mode === "image"
                ? document.querySelector("#imageGallery")
                : document.querySelector("#textGallery");
    
            if (!galleryContainer) {
                console.warn(`⚠️ ${mode} 모드 갤러리 컨테이너가 없습니다. 새로 생성합니다.`);
                galleryContainer = document.createElement("div");
                galleryContainer.id = mode === "image" ? "imageGallery" : "textGallery";
      
                // ✅ 여기에 삽입
                document.querySelector(".post-form-container").appendChild(galleryContainer);
            }
    
            // ✅ 기존 데이터 유지하면서 추가
            if (mode === "image") {
                renderImageMode(images, append);
            } else {
                renderTextMode(images, append);
            }
    
            loadedImages += images.length;
        } catch (error) {
            console.error("🚨 이미지 불러오기 오류:", error);
        } finally {
            isLoading = false;
        }
    }

    function renderImageMode(images, append = false) {
        const container = document.querySelector(".post-form-container");
        container.classList.add("image-mode");
        container.classList.remove("text-mode");

        let gallery = document.querySelector("#imageGallery");
        if (!gallery) {
            gallery = document.createElement("div");
            gallery.id = "imageGallery";
            gallery.classList.add("gallery-container");

            Object.assign(container.style, {
                display: "grid", // 그리드 레이아웃 사용
                gridTemplateColumns: "repeat(6, 1fr)", // 자동 열 크기 조정
                gap: "10px", // 이미지 간 간격
                justifyItems: "center", // 아이템 수평 가운데 정렬
                alignItems: "center",    // 아이템 수직 가운데 정렬
                overflowY: "auto", // 스크롤 활성화
                minHeight: "400px"
            });
            container.appendChild(gallery);
        }
      
        const fragment = document.createDocumentFragment(); // ✅ DocumentFragment 사용
        images.forEach(image => {
            const img = document.createElement("img"); // ✅ img 변수를 `forEach` 내부에서 선언
            img.dataset.src = `${image.file_path}`; // ✅ Lazy Load 설정
            img.alt = "Uploaded Image";
            img.classList.add("post-image");
            img.dataset.loaded = "false"; // 문자열로 설정
    
            // 이미지 클릭 시 post.html 페이지로 이동 (예: 이미지 id를 쿼리 파라미터로 전달)
            img.addEventListener("click", () => {
                const category = image.category.name;
                const subcategory = encodeURIComponent(image.subcategory.name); // URL 인코딩 필수
                const file = image.file_name;
                window.location.href = `/post?category=${category}&subcategory=${subcategory}&file=${file}`;
            });
                    
            fragment.appendChild(img);
            window.observer.observe(img); // ✅ Intersection Observer 적용
        });
    
        gallery.appendChild(fragment); // ✅ 한 번에 DOM 업데이트

    }

    function renderTextMode(images, append = false) {
        const container = document.querySelector(".post-form-container");
        container.classList.add("text-mode");
        container.classList.remove("image-mode");
 
        images.forEach(image => {
            const postItem = document.createElement("div");
            postItem.classList.add("post-item");

            // ✅ 이미지
            const img = document.createElement("img");
            img.src = `${image.file_path}`;
            img.alt = "Thumbnail";

            // ✅ 파일명
            const fileName = document.createElement("div");
            fileName.classList.add("file-name");
            fileName.textContent = image.file_name;
            Object.assign(fileName.style, {
                display : "block",
                color : "#000",
                fontSize : "14px" // 필요에 따라 조정
            });

            // ✅ 버튼 그룹
            const buttonContainer = document.createElement("div");
            buttonContainer.classList.add("buttons");

            // ✅ 수정 버튼
            const editButton = document.createElement("button");
            editButton.classList.add("edit-button");
            editButton.textContent = "수정";
            editButton.onclick = () => openEditPopup(image);

            // ✅ 삭제 버튼
            const deleteButton = document.createElement("button");
            deleteButton.classList.add("delete-button");
            deleteButton.textContent = "삭제";
            deleteButton.onclick = () => deletePost(image.id);

            buttonContainer.appendChild(editButton);
            buttonContainer.appendChild(deleteButton);

            postItem.appendChild(img);
            postItem.appendChild(fileName);
            postItem.appendChild(buttonContainer);

            container.appendChild(postItem);
        });
        // 텍스트 모드 스타일 적용
        if (!append) {
            Object.assign(container.style, {
                display: "block",
                marginBottom: "20px",
                minHeight: "400px",
                overflowY: "auto"
            });
        }
    }

    async function updatePostDescription(postId, newDescription) {
        try {
            const response = await fetch(`api/files/update-post/${postId}`, {  // 🔹 서버의 업데이트 API 경로
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ description: newDescription }),
        });
        const data = await response.json();
            if(data.success){
                const descriptionElement = document.getElementById(`description-${postId}`);
                if (descriptionElement) {
                    descriptionElement.innerHTML = newDescription; // 수정된 내용을 즉시 반영
                }
                showpopup("게시물이 성공적으로 수정되었습니다.",()=>{
                    setTimeout(() => {
                        location.reload();
                    },700);
                });
            } else {
                showeditpopup("게시물 수정에 실패했습니다.");
                }
            }catch(error) {
                console.error("🚨 게시물 수정 오류:", error);
                showeditpopup("수정 중 오류가 발생했습니다.");
            }
        }

    // 수정 버튼 클릭 시 팝업창을 열어주는 함수
    function openEditPopup(image) {
        let modal = document.getElementById("editModal");

        if (!modal) {
            modal = document.createElement("div");
            modal.id = "editModal";
            Object.assign(modal.style, {
                position: "fixed",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: "10000"
            });

            modal.innerHTML = `
                <div style="background: #c0c0c0; padding: 20px; border-radius: 5px; min-width: 400px;">
                    <h2 style="margin: 10px;">게시물 수정</h2>

                    <!-- contenteditable div로 HTML 적용된 상태로 표시 -->
                    <div id="editContent" contenteditable="true" 
                    style="width: 450px; min-height: 150px; border: 1px solid #000; border-radius: 5px; 
                    background: #fff; box-shadow: none; outline: none; text-shadow: none; text-decoration: none; 
                    font-style: normal; overflow-y: auto; text-align:left"></div>

                    <div style="margin-top: 20px;">
                        <button id="saveEdit" style="margin-right: 10px;">저장</button>
                        <button id="closeEdit">취소</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        }else{
            modal.style.display = "flex";
            modal.querySelector("#editContent").innerHTML = image.file_description || "";
        }

        // ✅ 항상 최신 내용 설정
        const editContent = modal.querySelector("#editContent");
        editContent.innerHTML = image.file_description || "";

        // ✅ 저장 버튼
        const saveButton = modal.querySelector("#saveEdit");
        const closeButton = modal.querySelector("#closeEdit");

        // ✅ 기존 이벤트 제거
        saveButton.onclick = null;
        closeButton.onclick = null;
        

        // ✅ 새 이벤트 등록
        saveButton.onclick = async () => {
            // 1) 원본 innerHTML 그대로 가져오기
            const newDescription = editContent.innerHTML;

            // 2) 텍스트만 뽑아서 빈 문자열인지 확인
            const textOnly = newDescription
                .replace(/<br\s*\/?>/gi, "\n")    // <br> → 줄바꿈
                .replace(/<div[^>]*>/gi, "\n")    // <div> → 줄바꿈
                .replace(/<\/div>/gi, "")         // </div> 제거
                .replace(/<[^>]+>/g, "")          // 나머지 태그 전부 제거
                .trim();

            if (!textOnly) {
                showeditpopup("❗내용을 입력해주세요.");
                return;
            }
        
            // 3) 확인 팝업
            showeditpopup("내용을 수정하시겠습니까?", async () => {
                try{
                    await updatePostDescription(image.id, newDescription);
                    modal.style.display = "none";
                }catch(error){
                    console.error("수정 오류:", error);
                    showeditpopup("❌ 수정에 실패했습니다.");
                }
            });
        };
        
        closeButton.onclick = () => {
            modal.style.display = "none";
        };

        modal.style.display = "flex";
    }
    async function deletePost(id) {
        // 1) 사용자 확인
        showeditpopup('게시물을 삭제하시겠습니까?',async() => {
        try {
          // 2) DELETE 요청 보내기 (백엔드 라우트에 맞게 URL 조정)
          const response = await fetch(`/api/files/${id}`, {
            method: 'DELETE',
          });
          const data = await response.json();
      
          // 3) 성공 여부 확인
          if (data.success) {
            showpopup('게시물이 삭제되었습니다.',()=>{
                setTimeout(() => {
                    location.reload();
                },700);
            });
            // 4) 삭제 후 페이지 새로고침 또는 이미지 재로딩
          } else {
            showeditpopup(`삭제 실패: ${data.error || data.message}`);
          }
        } catch (error) {
          console.error('🚨 삭제 중 오류 발생:', error);
          showeditpopup('삭제 중 오류가 발생했습니다.');
        }
      });
    }
    // ── [사이드바 및 UI 제어] ───────────────────────────────
    function bindSidebarEvents() {
        const sidebar = document.getElementById("sidebar");
        const adminBar = document.querySelector(".adminbar-container");
        const sectionContainers = document.querySelectorAll(".section-container");
        const sidebarToggle = document.querySelector(".sidebar-toggle");

        function updateSidebarTogglePosition() {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                sidebarToggle.style.transform = `translateY(${scrollY}px)`;
            });
        }
        window.addEventListener("scroll", updateSidebarTogglePosition);

        // ✅ 사이드바 메뉴 클릭 시 자동으로 사이드바 닫기
        document.querySelectorAll(".sidebar a").forEach(menuItem => {
            menuItem.addEventListener("click", () => {

                sidebar.classList.remove("open"); // ✅ 사이드바 닫기
                adminBar.classList.remove("hidden"); // ✅ adminbar-container 다시 보이기

                // ✅ 모든 section-container 원래 위치로 복귀
                sectionContainers.forEach(section => {
                    section.classList.remove("shifted");
                });
            });
        });

        // ✅ 모든 change-button에 클릭 효과 추가
        document.querySelectorAll(".change-button").forEach(button => {
            button.addEventListener("click", () => {
                // 기존에 활성화된 버튼의 클래스를 제거하여 원래 색상으로 복귀
                document.querySelectorAll(".change-button").forEach(btn => {
                    btn.classList.remove("active");
                });
                button.classList.add("active");
            });
        });
    }
  

    // Lazy Load 이미지 로드 (Intersection Observer)
    function createLazyImage(img, src) {
        const imgElement = document.createElement("img");
        imgElement.dataset.src = src;
        imgElement.alt = "Uploaded Image";
        imgElement.classList.add("post-image");
        imgElement.loading = "lazy"; // ✅ Lazy Load 속성 추가
        observer.observe(imgElement); // Intersection Observer 적용
        return imgElement;
    }



    function toggleSidebar() {
        const sidebar = document.getElementById("sidebar");
        const adminBar = document.querySelector(".adminbar-container");
        const sectionContainers = document.querySelectorAll(".section-container");
        sidebar.classList.toggle("open");
        adminBar.classList.toggle("hidden");
        sectionContainers.forEach(section => section.classList.toggle("shifted"));
    }

    // ── [스크롤 이벤트 & 디바운스/스로틀] ───────────────────────────────
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    function throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return function() {
            const context = this;
            const args = arguments;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        }
    }

    // 디바운스 함수 적용
    const fetchImagesDebounced = debounce((mode) => fetchImages(mode), 250); // 300ms의 지연시간을 두고 호출

    // 기존 컨테이너를 초기화하는 함수 (모드 전환시에만 사용)
    function clearContainer(container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }

    function bindModeSwitchEvents() {
        document.getElementById("image-mode").addEventListener("click", () => {
            currentMode = "image";
            loadedImages = 0; // ✅ 초기화
            noMoreImages = false;

            const container = document.querySelector(".post-form-container");
            clearContainer(container);

            container.classList.add("image-mode");        // ✅ 추가
            container.classList.remove("text-mode");      // ✅ 추가

            // ✅ 이미지 모드일 때 필요한 DOM 요소 다시 생성
            const imageGallery = document.createElement("div");
            imageGallery.id = "imageGallery";
            imageGallery.classList.add("gallery-container");

            // ✅ grid 스타일을 직접 지정
            Object.assign(imageGallery.style, {
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: "10px",
                justifyItems: "center",
                alignItems: "center"
            });

            container.appendChild(imageGallery);

            fetchImages("image", false);
        });

        document.getElementById("text-mode").addEventListener("click", () => {
            currentMode = "text";
            loadedImages = 0; // ✅ 초기화
            noMoreImages = false; // ✅ 더 이상 이미지 없음 상태 초기화

            const container = document.querySelector(".post-form-container");
            clearContainer(container);

            container.classList.add("text-mode");
            container.classList.remove("image-mode");

            // ✅ 새 컨테이너 추가
            const textGallery = document.createElement("div");
            textGallery.id = "textGallery";
            textGallery.classList.add("gallery-container");
            container.appendChild(textGallery);

            fetchImages("text", false);
        });
    }

    // ── [차트 렌더링] ───────────────────────────────
    async function fetchCategoryCounts() {
        try {
            const response = await fetch("/api/files/category-counts");
            if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("🚨 카테고리 데이터 불러오기 오류:", error);
            return [];
        }
    }

async function renderCharts() {
    const categoryData = await fetchCategoryCounts();
    const categories = categoryData.map(item => item.category_name);
    const counts = categoryData.map(item => Number(item.count));
    const total = counts.reduce((acc, val) => acc + val, 0);
    const probabilities = counts.map(count => ((count / total) * 100).toFixed(2));

    // 도넛 차트 데이터 구성
    const chartData = {
        labels: categories,
        datasets: [{
            label: "게시물 비율",
            data: probabilities,
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
            hoverOffset: 10
        }]
    };

    // 원본 데이터/옵션 저장
    window.originalDonutChartData = JSON.parse(JSON.stringify(chartData));
    window.originalDonutChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: "right" },
            title: { display: true },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const percent = context.raw;
                        return `${percent}%`;
                    }
                }
            }
        }
    };

    const donutCanvas = document.getElementById("donutChart");

    // ⛔ Chart.js는 canvas 크기를 자동 계산하기 때문에 명시적으로 고정 필요
    donutCanvas.width = 300;
    donutCanvas.height = 300;

    const donutCtx = donutCanvas.getContext("2d");

    if (window.donutChartInstance) {
        window.donutChartInstance.destroy();
    }

    const donutOptions = {
        ...window.originalDonutChartOptions,
        responsive: true,
        maintainAspectRatio: false, // 🔥 반드시 false
        onClick: async (evt, elements) => {
            if (evt.native) evt.native.stopPropagation();

            window.donutChartInstance.setActiveElements([]);
            window.donutChartInstance.update();

            if (elements.length > 0) {
                const firstElement = elements[0];
                const dataIndex = firstElement.index;

                window.donutChartInstance.setActiveElements([{
                    datasetIndex: firstElement.datasetIndex,
                    index: dataIndex
                }]);
                window.donutChartInstance.update();

                const categoryName = window.donutChartInstance.data.labels[dataIndex];
                const subcategoryData = await fetchSubcategoryCountsByCategory(categoryName);
                showSubcategoryTable(subcategoryData, categoryName);
            }

            if (!chartClickHandlerRegistered) {
                document.addEventListener("click", function (event) {
                    const table = document.getElementById("categoryInfoTable");
                    if (table && !table.contains(event.target)) {
                        table.remove();

                        // 🧼 도넛 차트 완전 초기화
                        if (window.donutChartInstance) {
                            window.donutChartInstance.destroy();
                        }

                        const ctx = document.getElementById("donutChart").getContext("2d");
                        ctx.canvas.width = 300; // 🔁 재생성 전에도 크기 재지정
                        ctx.canvas.height = 300;

                        window.donutChartInstance = new Chart(ctx, {
                            type: "doughnut",
                            data: JSON.parse(JSON.stringify(window.originalDonutChartData)),
                            options: {
                                ...window.originalDonutChartOptions,
                                responsive: true,
                                maintainAspectRatio: false,
                                onClick: donutOptions.onClick // 다시 연결
                            }
                        });
                    }
                });
                chartClickHandlerRegistered = true;
            }
        }
    };

    window.donutChartInstance = new Chart(donutCtx, {
        type: "doughnut",
        data: chartData,
        options: donutOptions
    });

    // 막대 그래프 그대로 유지
    const barCtx = document.getElementById("radarChart").getContext("2d");
    if (window.barChartInstance) window.barChartInstance.destroy();

    const barChartDatasets = categories.map((category, index) => ({
        label: category,
        data: [probabilities[index]],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"][index % 5],
    }));

    window.barChartInstance = new Chart(barCtx, {
        type: "bar",
        data: {
            datasets: barChartDatasets,
            labels: ["게시물 비율"]
        },
        options: {
            scales: {
                x: { grid: { display: false } },
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { display: false },
                    ticks: { callback: value => value + "%" }
                }
            },
            responsive: true,
            plugins: {
                legend: { 
                    position: "right",
                    labels: {
                        boxWidth: 20,
                        padding: 10
                    }
                 },
                title: { display: true },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.raw}%`;
                        }
                    }
                }
            },
            layout: {
                padding: {
                    left: 30,
                    right: 30
                }
            }
        }
    });
}

    
    document.getElementById("showDonut").addEventListener("click", () => {
        document.getElementById("donutChart").style.display = "block";
        document.getElementById("radarChart").style.display = "none";
      });
      
      document.getElementById("showRadar").addEventListener("click", () => {
        document.getElementById("donutChart").style.display = "none";
        document.getElementById("radarChart").style.display = "block";
      });
    // 페이지 로드 시 차트 렌더링
    document.addEventListener("DOMContentLoaded", renderCharts);
  
// ── [유틸리티 함수] ───────────────────────────────
function stripHtmlTags(html) {
    let doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
}

// autoResize 함수 정의
function autoResize(textarea) {
    // 텍스트의 내용에 따라 높이 자동 조정
    textarea.style.height = 'auto';  // 높이를 초기화
    textarea.style.height = (textarea.scrollHeight,50) + 'px';  // 내용에 맞게 높이 조정
}

function showSubcategoryTable(subcategories, categoryName) {
    // 기존 wrapper 제거
    const oldWrapper = document.querySelector(".subcategory-wrapper");
    if (oldWrapper) oldWrapper.remove();

    const wrapper = document.createElement("div");
    wrapper.className = "subcategory-wrapper";

    const table = document.createElement("table");
    table.id = "categoryInfoTable";

    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
        <th>서브카테고리명</th>
        <th>게시물 수</th>
    `;
    table.appendChild(headerRow);

    subcategories.forEach((item, index) => {
        const dataRow = document.createElement("tr");
        dataRow.innerHTML = `
            <td>${item.subcategory_name}</td>
            <td>${item.count}개</td>
        `;
        table.appendChild(dataRow);
    });

    wrapper.appendChild(table);
    document.querySelector(".post-chart-container").appendChild(wrapper);
}

async function fetchSubcategoryCountsByCategory(categoryName) {
    try {
        const res = await fetch(`/api/files/subcategory-counts?category_name=${encodeURIComponent(categoryName)}`);
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("서브카테고리 데이터 가져오기 실패", error);
        return [];
    }
}
