// 전역 변수로 선언하여 어디서든 접근 가능하게 합니다.
let loaderInterval = null;
let loaderStep = 1;

function showLoading() {
    const indicator = document.getElementById("loadingIndicator");
    const loader = document.getElementById("mainLoader");

    if (!indicator || !loader) return;

    indicator.style.display = "flex";

    // 초기화
    loaderStep = 1;
    if (loaderInterval) clearInterval(loaderInterval);

    // 클래스를 순차적으로 변경하여 애니메이션 효과를 줍니다.
    loaderInterval = setInterval(() => {
        loader.className = "loader loader" + loaderStep;
        loaderStep++;
        if (loaderStep > 8) loaderStep = 1; // HTML에 div가 8개이므로 8단계까지 순환
    }, 150); // 1000ms는 너무 느리므로 150ms 정도로 변경 권장
}

function hideLoading() {
    if (loaderInterval) {
        clearInterval(loaderInterval);
        loaderInterval = null;
    }
    const indicator = document.getElementById("loadingIndicator");
    if (indicator) {
        indicator.style.display = "none";
    }
}

// 먼저 화면 잠금 (body 존재 보장)
document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("auth-lock");

    function isExpired(token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const now = Date.now() / 1000;
            return payload.exp < now;
        } catch {
            return true;
        }
    }
    function redirectToLogin() {
        alert("관리자 인증이 필요합니다.");
        window.location.href = "admin-login.html";
    }

    function checkAuth() {
        const token = localStorage.getItem("adminToken");
        const loader = document.getElementById("authLoader");

        // 토큰 없거나 만료
        if (!token || isExpired(token)) {
            localStorage.removeItem("adminToken"); // 정리까지 같이
            redirectToLogin();
            return;
        }

        // 인증 성공
        if (loader) loader.style.display = "none";
        document.body.classList.remove("auth-lock");
    }

    // 실행
    checkAuth();
});

document.addEventListener("DOMContentLoaded", async () => {
    // ==========================================
    // 1️⃣ DOM 요소 선택 (상단에 모아두기)
    // ==========================================
    const backBtn = document.querySelector(".back-button");
    const fileInput = document.getElementById("fileInput");
    const previewContainer = document.getElementById("previewContainer");
    const uploadButton = document.getElementById("uploadButton");
    const titleInput = document.getElementById("title_name");
    const categorySelect = document.getElementById("category");
    const subcategorySelect = document.getElementById("subcategory");
    const descriptionEditor = document.getElementById("descriptionEditor");
    const descriptionCounter = document.getElementById("descriptionCounter");

    // ==========================================
    // 2️⃣ 설정 데이터
    // ==========================================
    const categoryTranslations = {
        "puzzle": "퍼즐",
        "bizz": "보석비즈",
        "solidbodypuzzle": "3D퍼즐",
        "deforme": "디폼블럭",
        "brickfigure": "브릭피규어"
    };

    // ==========================================
    // 3️⃣ 유틸리티 및 UI 조작 함수
    // ==========================================
    function showPopup(message) {
        //  기존 팝업이 있으면 제거
        const existingPopup = document.querySelector(".popup-message");
        if (existingPopup) existingPopup.remove();

        //  팝업 요소 생성
        const popup = document.createElement("div");
        popup.className = "popup-message";
        popup.innerHTML = `
            <p>${message}</p>
            <div class="popup-buttons">
                <button class="popup-close">확인</button>
    `;
        document.body.appendChild(popup);
        // 확인 버튼 클릭 시 팝업 제거
        popup.querySelector(".popup-close").addEventListener("click", () => {
            popup.remove();
        });
    }

    function showuploadPopup(message, postURL = null) {
        const existingPopup = document.querySelector(".popup-message");
        if (existingPopup) existingPopup.remove();

        const popup = document.createElement("div");
        popup.className = "popup-message";

        // 로직 가독성을 위해 innerHTML을 깔끔하게 정리
        popup.innerHTML = `
        <p style="margin-bottom: 15px;">${message}</p>
        <div class="popup-buttons" style="display: flex; gap: 10px; justify-content: center;">
            <button class="popup-button" id="continueUpload">계속 업로드</button>
            ${postURL ? `<button class="popup-button" id="viewPost">확인</button>` : ""}
        </div>
    `;

        document.body.appendChild(popup);

        // 계속 업로드: 현재 페이지를 새로고침하거나 초기화하여 폼을 비움
        document.getElementById("continueUpload").addEventListener("click", () => {
            window.location.reload(); // 단순히 upload.html로 가는 것보다 폼 초기화에 효과적
        });

        // 확인 버튼: 전달받은 postURL로 이동
        if (postURL) {
            document.getElementById("viewPost").addEventListener("click", () => {
                // 주소 인코딩이 꼬이지 않도록 한 번 더 확인하며 이동
                window.location.href = postURL;
            });
        }
    }

    function resetForm() {
        previewContainer.innerHTML = "";
        descriptionEditor.innerHTML = "";
        fileInput.value = "";
        titleInput.value = "";
        categorySelect.value = "";
        subcategorySelect.innerHTML = "<option value=''>선택 없음</option>";
    }

    function sanitizeDescription(html) {
        const allowedTags = ["b", "strong", "i", "em", "s", "strike", "u", "br", "span", "div", "p"];
        let doc = new DOMParser().parseFromString(html, "text/html");

        doc.body.querySelectorAll("*").forEach(node => {
            if (!allowedTags.includes(node.tagName.toLowerCase())) {
                node.replaceWith(document.createTextNode(node.innerText));
            }
        });

        // 줄바꿈 태그 치환 부분 제거 – 엔터 1번으로 생성된 <br>도 그대로 유지됨
        return doc.body.innerHTML.trim();
    }

    function stripHtmlTags(html) {
        let doc = new DOMParser().parseFromString(html, "text/html");
        return doc.body.textContent || "";
    }

    window.insertHTML = function (text) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = text; // 삽입할 HTML을 임시 div에 넣기
        while (tempDiv.firstChild) fragment.appendChild(tempDiv.firstChild);
        range.deleteContents(); // 기존 선택 영역 삭제
        range.insertNode(fragment); // 새로운 HTML 삽입
    };

    function handlePaste(event) {
        event.preventDefault();
        const clipboardData = event.clipboardData || window.clipboardData;
        let pasteHtml = clipboardData.getData("text/html") || clipboardData.getData("text/plain") || "";

        if (pasteHtml) {
            pasteHtml = pasteHtml
                .replace(/<\/?(div|p)>/g, "<br>")  // `<div>`, `<p>` → `<br>` 변환
                .replace(/(<br\s*\/?>){2,}/g, "<br>");  //  중복 `<br>` 제거
        } else {
            pasteHtml = pasteHtml.replace(/\n/g, "<br>");
        }

        //  현재 커서 위치에 붙여넣기 내용 삽입
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement("div");

        tempDiv.innerHTML = pasteHtml;
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }

        range.deleteContents();
        range.insertNode(fragment);
    }

    // ==========================================
    // 4️⃣ API 통신 함수 (데이터 로드)
    // ==========================================
    async function loadCategories() {
        try {
            const response = await fetch("/api/categories");
            if (!response.ok) throw new Error("카테고리를 가져오는 데 실패함");

            const categories = await response.json();
            categorySelect.innerHTML = "<option value=''>카테고리 선택</option>"; //  기본값 추가

            categories.forEach(category => {
                if (category.name.toLowerCase() !== "uncategorized") { //  uncategorized 제외
                    const option = document.createElement("option");
                    option.value = category.id;
                    option.textContent = categoryTranslations[category.name] || category.name; // 한글 변환
                    categorySelect.appendChild(option);
                }
            });

            if (categories.length > 0) {
                loadSubcategories(categories[0].id);
            }
        } catch (error) {
            console.error(" 카테고리를 불러오는 중 오류 발생:", error);
        }
    }

    async function loadSubcategories(categoryId) {
        try {
            const response = await fetch(`/api/categories/${categoryId}/subcategories`);
            if (!response.ok) throw new Error("서브카테고리를 가져오는 데 실패함");

            const subcategories = await response.json();
            subcategorySelect.innerHTML = "<option value=''>선택 없음</option>"; //  기본값 추가
            subcategories.forEach(sub => {
                const option = document.createElement("option");
                option.value = sub.id;
                option.textContent = sub.name;
                subcategorySelect.appendChild(option);
            });
        } catch (error) {
            console.error(" 서브카테고리를 불러오는 중 오류 발생:", error);
        }
    }

    // ==========================================
    // 5️⃣ 이벤트 리스너 등록
    // ==========================================
    // [CSP 보안 오류 방지용] 에디터 스타일 버튼 이벤트 바인딩
    const btnBold = document.getElementById("btnBold");
    const btnStrike = document.getElementById("btnStrike");

    if (btnBold) {
        btnBold.addEventListener("click", (event) => {
            event.preventDefault(); // 폼 전송 등의 기본 동작 방지
            document.execCommand("bold", false, null);
            descriptionEditor.focus(); // 효과 부여 후 에디터에 포커스 유지
        });
    }

    if (btnStrike) {
        btnStrike.addEventListener("click", (event) => {
            event.preventDefault();
            document.execCommand("strikethrough", false, null);
            descriptionEditor.focus();
        });
    }
    
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            // 단순히 이동하고 싶다면 아래 코드
            window.location.href = "mode-selection.html";

            // 만약 브라우저 히스토리 상의 진짜 '이전 페이지'로 가고 싶다면 아래 코드 권장
            // window.history.back(); 
        });
    }

    if (fileInput) {
        fileInput.addEventListener("change", event => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => previewContainer.innerHTML = `<img src="${reader.result}" alt="미리보기">`;
            reader.readAsDataURL(file);
        });
    }

    if (categorySelect) {
        categorySelect.addEventListener("change", (event) => loadSubcategories(event.target.value));
    }

    if (descriptionEditor && descriptionCounter) {
        descriptionEditor.addEventListener("input", () => {
            const rawText = descriptionEditor.innerText.trim();
            const hashtags = rawText.match(/#[\w가-힣]+/g) || [];
            const textWithoutTags = rawText.replace(/#[\w가-힣]+/g, '').trim();
            const length = textWithoutTags.length;

            descriptionCounter.textContent = `${length} / 1000`;
            descriptionCounter.style.color = length > 1000 ? "red" : "gray";

            const hashtagDisplay = document.getElementById("hashtagDisplay");
            if (hashtagDisplay) hashtagDisplay.textContent = hashtags.join(' ');
        });

        descriptionEditor.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                const selection = window.getSelection();
                if (!selection.rangeCount) return;
                const range = selection.getRangeAt(0);
                const br = document.createElement("br");
                range.deleteContents();
                range.insertNode(br);
                range.setStartAfter(br);
                range.setEndAfter(br);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });

        descriptionEditor.removeEventListener("paste", handlePaste);
        descriptionEditor.addEventListener("paste", handlePaste);
    }

    if (uploadButton) {
        uploadButton.addEventListener("click", async () => {
            const file = fileInput?.files[0];
            const title = titleInput?.value.trim();
            const categoryId = categorySelect.value;
            const subcategoryId = subcategorySelect.value || "";
            const categoryName = categorySelect.options[categorySelect.selectedIndex]?.text.trim();
            const subcategoryName = subcategorySelect.options[subcategorySelect.selectedIndex]?.text.trim() || "general";

            let description = sanitizeDescription(descriptionEditor.innerHTML.trim());
            const textOnlyDescription = stripHtmlTags(description);

            // 유효성 검사
            if (!file) return showPopup("파일을 선택해주세요.");
            if (!title) return showPopup("제목을 입력해주세요.");
            if (title.length > 50) return showPopup("제목은 최대 50자까지 입력 가능합니다.");
            if (!categoryId) return showPopup("카테고리를 선택해주세요.");
            if (!subcategoryId) return showPopup("서브카테고리를 선택해주세요.");
            if (textOnlyDescription.length === 0) return showPopup("설명을 입력해주세요.");
            if (textOnlyDescription.length > 1000) return showPopup("설명은 최대 1000자까지만 입력 가능합니다.");

            const formData = new FormData();
            formData.append("file", file);
            formData.append("title", title);
            formData.append("category_id", categoryId);
            formData.append("subcategory_id", subcategoryId);
            formData.append("category_name", categoryName);
            formData.append("subcategory_name", subcategoryName);
            formData.append("description", description);

            try {
                if (typeof showLoading === 'function') showLoading();

                const response = await fetch("/api/files/upload", {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();

                setTimeout(() => {
                    if (typeof hideLoading === 'function') hideLoading();

                    if (!response.ok) {
                        return showPopup(`업로드 실패: ${result.error || "알 수 없는 오류"}`);
                    }

                    const postId = result.file.id;
                    const postURL = `post.html?id=${postId}`;
                    showuploadPopup("업로드 성공!", postURL);
                    resetForm();
                }, 1000);
            } catch (error) {
                console.error("업로드 중 네트워크 오류:", error);
                if (typeof hideLoading === 'function') hideLoading();
                showPopup("업로드 실패! 서버에 문제가 있습니다.");
            }
        });
    }

    // ==========================================
    // 6️⃣ 초기화 실행 (모든 준비가 끝난 후 마지막에 호출)
    // ==========================================
    if (categorySelect) {
        loadCategories();
    }
});
