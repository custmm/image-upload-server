// 페이지 이동 함수 정의 (전역)
window.prevPage = async function() {
    if (page > 0) {
      page--;                           // 한 페이지 뒤로
      await loadPage(selectedCategory, selectedSubcategory);
    }
  };
  
  window.nextPage = async function() {
    if (!noMoreImages) {
      await loadPage(selectedCategory, selectedSubcategory);
    }
  };
  
document.addEventListener("DOMContentLoaded", async () => {
    const categoryTabContainer = document.querySelector(".tab-design"); // 메인 카테고리 탭
    const subTabContainer = document.getElementById("subTabContainer"); // 서브 카테고리 탭
    const imageGallery = document.getElementById("imageGallery"); // 이미지 갤러리
    const currentCategory = document.getElementById("currentCategory"); // 현재 카테고리 표시
    const previewContainer = document.getElementById("previewImagesContainer");
    const paginationContainer = document.getElementById("pagination-container");

    let selectedCategory = null;
    let selectedSubcategory = null;
    let categories = [];

    // 페이지네이션 변수
    let page          = 0;
    const limit       = 20;    // 5×4
    let noMoreImages  = false;
    

    // ✅ 카테고리 한글 ↔ 영문 매핑 (필요한 경우 적용)
    const categoryMappings = {
        "puzzle": "퍼즐",
        "bizz": "보석비즈",
        "solidbodypuzzle": "입체퍼즐",
        "deforme": "디폼블럭",
        "legoCompatibleblock": "레고호환블럭"
    };
    
    // ✅ 로딩 화면 표시 함수
    function showLoading() {
        document.getElementById("loadingIndicator").style.display = "flex";
    }

    // ✅ 로딩 화면 숨김 함수
    function hideLoading() {
        setTimeout(() => {
        document.getElementById("loadingIndicator").style.display = "none";
        },500);
    }

    // ✅ URL 파라미터로 카테고리 자동 선택
    const urlParams = new URLSearchParams(window.location.search);
    let categoryParam = urlParams.get("category");

    // ✅ URL에서 받은 카테고리가 영문이면 한글로 변환
    if (categoryParam && categoryMappings[categoryParam]) {
        categoryParam = categoryMappings[categoryParam];
    }

  // 1) 카테고리 로드
  async function loadCategories() {
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) throw new Error("카테고리를 가져오는 데 실패함");

        categories = await response.json();
        categories = categories.filter(category => category.name.toLowerCase() !== "uncategorized");

        clearCategoryTabs(); // ✅ 기존 카테고리 탭 삭제

        categories.forEach(category => {
            const btn = document.createElement("button");
            btn.className = "tab-btn";
            btn.textContent = category.name;
            btn.onclick = () => loadCategory(category.id, btn);
            categoryTabContainer.appendChild(btn);
        });

        setTimeout(() => initializeCategorySelection(),300);

        return categories;
      } catch (error) {
          console.error("🚨 카테고리를 불러오는 중 오류 발생:", error);
      }
  }
  await loadCategories(); // ✅ 카테고리 불러오기 실행

  // 2) 카테고리 선택 시
  async function loadCategory(categoryId, tabButton){
    showLoading(); // 🔥 로딩 화면 표시

    // ✅ URL 업데이트 (브라우저 히스토리 변경)
    const newCategoryName = tabButton.textContent.trim();
    const newURL = `preview.html?category=${encodeURIComponent(newCategoryName)}`;

    // ✅ 같은 상태를 중복으로 저장하지 않도록 검사 후 pushState()
    if (window.location.search !== `?category=${encodeURIComponent(newCategoryName)}`) {
        history.pushState({ category: newCategoryName }, "", newURL); // 🔥 URL 변경
    }

    selectedCategory = categoryId;
    selectedSubcategory = null;
    subTabContainer.innerHTML ="";

    document.querySelectorAll(".tab-btn.active").forEach(btn => btn.classList.remove("active"));
    tabButton.classList.add("active");

    // ✅ 현재 선택된 카테고리명 업데이트 (요소가 존재할 경우에만)
    if (currentCategory) {
        currentCategory.textContent = newCategoryName;
    }
    
    // 1) 서브카테고리 탭 채우기
    await loadSubcategories(categoryId);

    // 2) 페이지 초기화 후 첫 페이지 로드
    page = 0;
    noMoreImages = false;
    clearGallery();
    await loadPage(categoryId, selectedSubcategory);
    hideLoading(); // 🔥 로딩 완료 후 숨김
  };    

    // 3) 서브카테고리 로드
    async function loadSubcategories(categoryId) {
        try {
            const response = await fetch(`/api/categories/${categoryId}/subcategories`);
            if (!response.ok) throw new Error("서브카테고리를 가져오는 데 실패함");

            const subcategories = await response.json();
            subTabContainer.innerHTML = "";

            if (subcategories.length === 0) {
                console.log("📌 서브카테고리가 없습니다. 기본 카테고리 이미지 로딩.");
                selectedSubcategory = null;
                return;
            }

            subcategories.forEach((sub, index) => {
                const btn = document.createElement("button");
                btn.className = "sub-tab";
                btn.textContent = sub.name;
                btn.onclick = () => loadSubcategory(categoryId, sub.id, btn);
                subTabContainer.appendChild(btn);
            });

            // 첫 번째 탭 자동 선택
            const firstBtn = subTabContainer.firstChild;
            firstBtn.classList.add("active");
            selectedSubcategory = subcategories[0].id;
        } catch (error) {
            console.error("🚨 서브카테고리를 불러오는 중 오류 발생:", error);
        }
    }

    // 4) 서브카테고리 클릭 시
    async function loadSubcategory(categoryId, subcategoryId, tabButton) {
        document.querySelectorAll(".sub-tab.active")
                .forEach(btn => btn.classList.remove("active"));
        tabButton.classList.add("active");
    
        selectedSubcategory = subcategoryId;
        // 페이지 초기화 & 첫 페이지 로드
        page = 0;
        noMoreImages = false;
        clearGallery();
        await loadPage(categoryId, selectedSubcategory);
    }

      // 5) 페이지별 이미지 로드
  async function loadPage(categoryId, subcategoryId = null) {
    showLoading();
    const offset = page * limit;
    let url = `/api/files?offset=${offset}&limit=${limit}&category_id=${categoryId}`;
    if (subcategoryId) url += `&subcategory_id=${subcategoryId}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("이미지 로드 실패");
      const { total, files: images } = await res.json();

      // 총 페이지 계산
      const totalPages = Math.ceil(total / limit);
      noMoreImages = images.length < limit;

      clearGallery();
      images.forEach(image => {
        // 기존 loadImages 반복문 내용
        const imgContainer = document.createElement("div");
        imgContainer.classList.add("image-container");
        const placeholder = document.createElement("div");
        placeholder.classList.add("image-placeholder");
        const img = document.createElement("img");
        img.dataset.src = image.file_path;
        img.alt = "Uploaded Image";
        img.classList.add("gallery-image");
        observer.observe(img);

        const cat  = encodeURIComponent(image.category_name  || "uncategorized");
        const sub  = encodeURIComponent(image.subcategory_name || "general");
        const file = encodeURIComponent(image.file_name);
        img.onclick = () => window.location.href = `post.html?category=${cat}&subcategory=${sub}&file=${file}`;

        imgContainer.appendChild(placeholder);
        imgContainer.appendChild(img);
        imageGallery.appendChild(imgContainer);
      });

      renderPagination(totalPages);
      // page 증가는 버튼 클릭에서만 하므로 여기선 제거
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  }

  // 6) Prev/번호/Next 렌더링
  function renderPagination(totalPages) {
    const pag = document.getElementById("pagination-container");
    if (!pag) return;  // pagination 요소가 없으면 아무것도 안 함
    pag.innerHTML = "";

    // ◀ Prev 버튼
    const prev = document.createElement("button");
    prev.classList.add("pagination-button");
    prev.textContent = "‹";                // 버튼 레이블 추가
    prev.disabled = page === 0;
    prev.onclick  = () => {
        page--;
        loadPage(selectedCategory, selectedSubcategory);
    };
    pag.appendChild(prev);

    const info = document.createElement("span");
    info.textContent = ` ${page+1} / ${totalPages} `;
    info.style.margin = "0 10px";
    pag.appendChild(info);

    // ▶ Next 버튼
    const next = document.createElement("button");
    next.classList.add("pagination-button");
    next.textContent = "›";                // 버튼 레이블 추가
    next.disabled = (page+1) >= totalPages;
    next.onclick  = () => {
        page++;
        loadPage(selectedCategory, selectedSubcategory);
    };
    pag.appendChild(next);
  }


    /** ✅ 이미지 불러오기 (4x5 배열 적용) */
    async function loadImages(categoryId, subcategoryId = null) {
        try {
            let url = `/api/files?category_id=${categoryId}`;
            if (subcategoryId) {
                url += `&subcategory_id=${subcategoryId}`;
            }

            console.log("📌 이미지 요청 URL:", url);

            const response = await fetch(url);
            if (!response.ok) {
                const errorMessage = await response.json();
                throw new Error(errorMessage.error || "이미지를 가져오는 데 실패함");
            }

            const images = await response.json();
            console.log("✅ 서버 응답:", images);

            clearGallery(); // ✅ 기존 이미지 삭제 (innerHTML = "" 대신 사용)

            if (!Array.isArray(images) || images.length === 0) {
                imageGallery.classList.remove("grid-layout");
                imageGallery.classList.add("flex-center");

                const noImageMessage = document.createElement("div");
                noImageMessage.classList.add("no-image-message");
                noImageMessage.innerHTML = "📂 해당 카테고리에 이미지가 없습니다.";
                imageGallery.appendChild(noImageMessage);
                return;
            }

            imageGallery.classList.remove("flex-center");
            imageGallery.classList.add("grid-layout");

            images.forEach(image => {
                const imgContainer = document.createElement("div");
                imgContainer.classList.add("image-container");

                const placeholder = document.createElement("div");
                placeholder.classList.add("image-placeholder");

                const img = document.createElement("img");
                img.dataset.src = `${image.file_path}`;
                img.alt = "Uploaded Image";
                img.classList.add("gallery-image");
                
                observer.observe(img); // ✅ Intersection Observer로 감지
            
                // ✅ 문제 해결: `image.category_name`과 `image.subcategory_name`을 직접 사용
                const categoryName = image.category_name ? encodeURIComponent(image.category_name) : "uncategorized";
                const subcategoryName = image.subcategory_name ? encodeURIComponent(image.subcategory_name) : "general";
                const fileName = encodeURIComponent(image.file_name);
                const postURL = `post.html?category=${categoryName}&subcategory=${subcategoryName}&file=${fileName}`;
            
                img.onclick = () => {
                    console.log(`✅ 이동할 URL: ${postURL}`);
                    window.location.href = postURL;
                };
            
                imgContainer.appendChild(placeholder);
                imgContainer.appendChild(img);
                imageGallery.appendChild(imgContainer);
            });
        } catch (error) {
            console.error("🚨 이미지를 불러오는 중 오류 발생:", error);
            imageGallery.classList.remove("grid-layout");
            imageGallery.classList.add("flex-center");
            imageGallery.innerHTML = `<p class="no-image-message">오류: ${error.message}</p>`;
        }
    }

    /** ✅ 다크 모드 토글 기능 */
    window.toggleTheme = function () {
        const body = document.body;
        const isDarkMode = body.classList.toggle("dark-mode"); // ✅ 다크 모드 토글
    
        if (isDarkMode) {
            localStorage.setItem("theme", "dark");
            themeToggle.checked = true;
        } else {
            localStorage.setItem("theme", "light");
            themeToggle.checked = false;
        }
    };
    
    /** ✅ 페이지 로드 시 저장된 다크 모드 적용 */
    function applySavedTheme() {
        const savedTheme = localStorage.getItem("theme") || "light";
    
        if (savedTheme === "dark") {
            document.body.classList.add("dark-mode");
            if (themeToggle) themeToggle.checked = true;
        } else {
            document.body.classList.remove("dark-mode");
            if (themeToggle) themeToggle.checked = false;
        }
    }

    
        const themeToggle = document.getElementById("themeToggle"); // ✅ 추가
        let wasOverlapping = false;
        let overlapTimer = null;

        function checkOverlap(img) {
            const imgRect = img.getBoundingClientRect();
            const toggleRect = document.querySelector('.toggle-switch .slider').getBoundingClientRect();
            console.log("[debug] imgRect, toggleRect:", imgRect, toggleRect);
    
            const x_overlap = Math.max(0, Math.min(imgRect.right, toggleRect.right) - Math.max(imgRect.left, toggleRect.left));
            const y_overlap = Math.max(0, Math.min(imgRect.bottom, toggleRect.bottom) - Math.max(imgRect.top, toggleRect.top));
            const overlapArea = x_overlap * y_overlap;

            const toggleArea = toggleRect.width * toggleRect.height;
            const ratioToggle = overlapArea / toggleArea;
            console.log("[debug] overlapArea:", overlapArea,
                "toggleArea:", toggleArea,
                "ratioToggle:", ratioToggle);

            // 토글 면적의 80% 이상 겹쳤을 때
            if (ratioToggle >= 0.8 && !wasOverlapping) {
                overlapTimer = setTimeout(() => window.location.href = "killing_game.html", 10000);
            }
            if (ratioToggle < 0.8 && wasOverlapping) {
                clearTimeout(overlapTimer);
            }
            wasOverlapping = ratioToggle >= 0.8;
            }

        function updatePreviewImage() {
            wasOverlapping = false; // 이전 상태 추적
            clearTimeout(overlapTimer);
            overlapTimer = null;

            previewContainer.innerHTML = "";
            previewContainer.style.position = "relative";
    
            const totalPreviews = 11;
            const randomIndex = Math.floor(Math.random() * totalPreviews) + 1;
            const selectedImage = `images/preview-gunff_${randomIndex}.png`;
        
            localStorage.setItem("selectedImage", selectedImage);
        
            const img = document.createElement("img");
            img.src = selectedImage;
            img.alt = `Preview Image`;
            img.style.position = "absolute";
            img.style.cursor = "grab";
            img.style.left = "0px";  // 초기 좌표 설정
            img.style.top = "0px";   // 초기 좌표 설정

        
            let isDragging = false; 
            let offsetX = 0; 
            let offsetY = 0;

            let animationFrameId = null;

            function startOverlapCheckLoop(img) {
                function loop() {
                    if (isDragging) {
                        checkOverlap(img);
                        animationFrameId = requestAnimationFrame(loop);
                    }
                }
                animationFrameId = requestAnimationFrame(loop);
            }
            
            function stopOverlapCheckLoop() {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
            }

            img.addEventListener("mousedown", (e) => {
                isDragging = true;
                const rect = img.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                img.style.cursor = "grabbing";
                e.preventDefault();

                startOverlapCheckLoop(img); // 👈 겹침 감지 루프 시작
            });
        
            document.addEventListener("mousemove", (e) => {
                if (!isDragging) return;
                const containerRect = previewContainer.getBoundingClientRect();
                let left = e.clientX - containerRect.left - offsetX;
                let top = e.clientY - containerRect.top - offsetY;
                img.style.left = left + "px";
                img.style.top = top + "px";

                checkOverlap(img); // 👈 실시간 감지용 강제 호출 추가!
            });
        
            document.addEventListener("mouseup", () => {
                if (isDragging) {
                    isDragging = false;
                    img.style.cursor = "grab";
                    stopOverlapCheckLoop(); // 👈 루프 멈추기
                }
            });
        
            img.onerror = function () {
                console.error(`이미지 로드 실패: ${img.src}`);
            };
        
            previewContainer.appendChild(img);

            // ✅ 변수 선언 후 호출하도록 아래로 이동
            checkOverlap(img);
        }


    // 표시기 상태 업데이트 함수
    function updatePreviewVisibility() {
        const previewState = localStorage.getItem("previewVisible");

        if (!previewContainer) {
            console.error("❌ #previewImagesContainer 요소를 찾을 수 없음!");
            return;
        }

        // previewContainer 내의 img 요소 찾기
        const img = previewContainer.querySelector("img");
        if (!img) {
            console.warn("⚠️ 표시할 이미지가 없음.");
            return;
        }

        if (previewState === "hidden") {
            img.style.display = "none"; // 숨기기
         } else {
            img.style.display = "flex"; // 보이기
        }
    }

    // ✅ `localStorage` 변경 감지 (admin-dashboard에서 변경되면 자동 반영)
    window.addEventListener("storage", updatePreviewVisibility);


    // ✅ 뒤로 가기(←) 또는 앞으로 가기(→) 시 카테고리 변경 처리
    window.onpopstate = async function(event) {
        const urlParams = new URLSearchParams(window.location.search);
        let categoryParam = urlParams.get("category");

        if (!categoryParam) return; // URL에 카테고리 정보가 없으면 실행하지 않음

        console.log(`🔄 뒤로 가기 이벤트 발생, 선택할 카테고리: ${categoryParam}`);

        // ✅ 현재 로드된 `categories` 배열에서 `category_name`을 기반으로 `category_id` 찾기
        const matchedCategory = categories.find(cat => cat.name.trim() === categoryParam.trim());

        if (!matchedCategory) {
            console.error(`⚠ 카테고리 (${categoryParam})에 해당하는 category_id를 찾을 수 없음`);
            return;
        }

        const categoryId = matchedCategory.id; // ✅ 올바른 category_id 가져오기

        // ✅ 카테고리 버튼 찾기
        const categoryButton = [...document.querySelectorAll(".tab-btn")]
            .find(btn => btn.textContent.trim() === categoryParam.trim());

        if (categoryButton) {
            console.log(`✅ 뒤로 가기로 ${categoryParam} 선택 (category_id: ${categoryId})`);
            await loadCategory(categoryId, categoryButton); // ✅ 올바른 category_id로 loadCategory 실행
        }
    };


    // ✅ 모든 카테고리 로드 후, URL 파라미터와 일치하는 카테고리 자동 선택
    async function initializeCategorySelection(retryCount = 5) {
        const urlParams = new URLSearchParams(window.location.search);
        let categoryParam = urlParams.get("category");

        // URL에서 받은 카테고리가 영문이면 한글로 변환 (여기서도 적용)
        if (categoryParam && categoryMappings[categoryParam]) {
            categoryParam = categoryMappings[categoryParam];
        }

        if(!categoryParam){
            console.warn("⚠ URL에 카테고리가 없음. 기본값 설정 중...");
            if(categories.length > 0){
                categoryParam = categories[0].name;
            } else {
                console.error("🚨 사용할 수 있는 카테고리가 없음!");
                return;
            }
        }

        console.log(`📌 URL에서 전달된 카테고리: ${categoryParam}`);

        // ✅ 현재 로드된 `categories` 배열에서 `category_name`을 기반으로 `category_id` 찾기
        const matchedCategory = categories.find(cat => cat.name.trim() === categoryParam.trim());

        if (!matchedCategory) {
            console.error(`⚠ 카테고리 (${categoryParam})에 해당하는 category_id를 찾을 수 없음`);
            return;
        }

        // 여기서 categoryId를 추출
        const categoryId = matchedCategory.id;

        // ✅ 카테고리 이름과 매칭되는 버튼을 찾아 클릭 실행
        const categoryButton = [...document.querySelectorAll(".tab-btn")]
            .find(btn => btn.textContent.trim() === categoryParam.trim());

        if (categoryButton) {
            console.log(`✅ 카테고리 자동 선택: ${categoryParam} (category_id: ${categoryId})`);
            await loadCategory(categoryId, categoryButton);
        }
    }

    function clearCategoryTabs() {
        while (categoryTabContainer.firstChild) {
            categoryTabContainer.removeChild(categoryTabContainer.firstChild);
        }
    }
    
    function clearGallery() {
        while (imageGallery.firstChild) {
            imageGallery.removeChild(imageGallery.firstChild);
        }
    }

    // ✅ Intersection Observer 먼저 정의
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src; // ✅ 실제 이미지 로드
                img.classList.add("loaded");
                observer.unobserve(img); // ✅ 감지 중지
            }
        });
    }, { rootMargin: "100px", threshold: 0.1 });


    updatePreviewImage();
    setInterval(updatePreviewImage, 30000);
    applySavedTheme();
    loadCategories();
    // 초기 상태 반영
    updatePreviewVisibility();

    // localStorage 변경 감지 (admin-dashboard에서 변경되면 자동 반영)
    window.addEventListener("storage", updatePreviewVisibility);
});
