
document.addEventListener("DOMContentLoaded", async () => {
    const fileInput = document.getElementById("fileInput");
    const previewContainer = document.getElementById("previewContainer");
    const uploadButton = document.getElementById("uploadButton");
    const categorySelect = document.getElementById("category");
    const subcategorySelect = document.getElementById("subcategory");
    const descriptionEditor = document.getElementById("descriptionEditor");
    const descriptionCounter = document.getElementById("descriptionCounter");


    // ✅ 팝업 스타일 메시지 표시 함수
    function showPopup(message) {
        // ✅ 기존 팝업이 있으면 제거
        const existingPopup = document.querySelector(".popup-message");
        if (existingPopup) existingPopup.remove();

        // ✅ 팝업 요소 생성
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
    // ✅ 팝업 메시지 스타일 추가
    const style = document.createElement("style");
    style.innerHTML = `
    .popup-message {
        position: fixed;
        top: 50%;
        right: 50%;
        transform: translate(50%, -50%);
        width: 300px;
        background-color: #ffffff;
        color: black;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        padding: 20px;
        border-radius: 6px;
        border: 1px solid #ccc;
        font-size: 18px;
        z-index: 9999;
        opacity: 1;
        transition: opacity 0.5s ease-in-out;
        margin: 20px;
    }

    .popup-message.hide {
        opacity: 0;
    }
    .popup-buttons {
        display: flex;
        justify-content: center;
        margin-top: 20px;
    }
    .popup-button {
        background-color: #000000;
        border-radius: 5px;
        padding: 8px 17px;
        cursor: pointer;
        color: white;
    }
    .popup-button:hover {
        background-color: #755a6a;
    }
    .popup-close{
        background-color: #000000;
        border-radius: 5px;
        padding: 8px 17px;
        cursor: pointer;
        color: white;
    }
    .popup-close:hover {
        background-color: #755a6a;
    }`;
    document.head.appendChild(style);

    function showLoading() {
        const loadingDiv = document.createElement("div");
        loadingDiv.id = "loadingScreen";
        loadingDiv.style.position = "fixed";
        loadingDiv.style.top = "0";
        loadingDiv.style.left = "0";
        loadingDiv.style.width = "100%";
        loadingDiv.style.height = "100%";
        loadingDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        loadingDiv.style.display = "flex";
        loadingDiv.style.flexDirection = "column";  // 🔥 수직 정렬
        loadingDiv.style.justifyContent = "center";
        loadingDiv.style.alignItems = "center";
        loadingDiv.style.color = "#fff";
        loadingDiv.style.fontSize = "24px";

        // ✅ 로딩 GIF 이미지 추가
        const loadingImg = document.createElement("img");
        loadingImg.src = "images/loading.gif";
        loadingImg.alt = "로딩 중...";
        loadingImg.style.width = "100px"; // 🔥 원하는 크기로 조절
        loadingImg.style.height = "100px";
        loadingImg.style.marginBottom = "15px"; // 🔥 텍스트와 간격 조정

        const loadingText = document.createElement("p");
        loadingText.textContent = "업로드 중입니다...";
        loadingText.style.margin = "0";
        loadingText.style.padding = "0";
        loadingText.style.color = "#fff";
        loadingText.style.fontSize = "20px";

        loadingDiv.appendChild(loadingImg);
        loadingDiv.appendChild(loadingText);

        document.body.appendChild(loadingDiv);
    }

    function hideLoading() {
        const loadingDiv = document.getElementById("loadingScreen");
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }


    /** ✅ 요소가 존재하는 경우에만 이벤트 추가 */
    if (fileInput) {
        fileInput.addEventListener("change", event => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                previewContainer.innerHTML = `<img src="${reader.result}" alt="미리보기">`;
            };
            reader.readAsDataURL(file);
        });
    }


    /** ✅ 3️⃣ 카테고리 및 서브카테고리 로드 */
    categorySelect.addEventListener("change", (event) => {
        const categoryId = event.target.value;
        loadSubcategories(categoryId);
    });

    loadCategories();

    if (descriptionEditor && descriptionCounter) {
        descriptionEditor.addEventListener("input", () => {
            const rawText = descriptionEditor.innerText.trim();

            // ✅ 한글 포함 해시태그 추출
            const hashtags = rawText.match(/#[\w가-힣]+/g) || [];

            // ✅ 해시태그 제거한 텍스트 길이 계산
            const textWithoutTags = rawText.replace(/#[\w가-힣]+/g, '').trim();
            const length = textWithoutTags.length;

            // ✅ 글자 수 표시
            descriptionCounter.textContent = `${length} / 500`;
            descriptionCounter.style.color = length > 500 ? "red" : "gray";

            // ✅ 해시태그 표시 (왼쪽)
            const hashtagDisplay = document.getElementById("hashtagDisplay");
            if (hashtagDisplay) {
                hashtagDisplay.textContent = hashtags.join(' ');
            }
        });

        // ✅ 엔터 키 입력 시 `<br>` 삽입 (최신 방식)
        descriptionEditor.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault(); // 기본 엔터 동작 방지

                // 현재 커서 위치에 `<br>` 삽입
                const selection = window.getSelection();
                if (!selection.rangeCount) return;

                const range = selection.getRangeAt(0);
                const br = document.createElement("br");

                range.deleteContents(); // 기존 선택 영역 삭제
                range.insertNode(br); // <br> 삽입

                // 커서를 <br> 다음 줄로 이동
                range.setStartAfter(br);
                range.setEndAfter(br);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });
    }
    function showuploadPopup(message, postURL = null) {
        // ✅ 기존 팝업이 있으면 제거
        const existingPopup = document.querySelector(".popup-message");
        if (existingPopup) existingPopup.remove();

        // ✅ 팝업 요소 생성
        const popup = document.createElement("div");
        popup.className = "popup-message";
        popup.innerHTML = `
            <p>${message}</p>
            <div class="popup-buttons">
                <button class="popup-button" id="continueUpload">계속 업로드</button>
                ${postURL ? `<button class="popup-button" id="viewPost">확인</button>` : ""}
            </div>
        `;

        document.body.appendChild(popup);

        // ✅ "계속 업로드" 버튼 이벤트 (그냥 `upload.html`로 이동)
        document.getElementById("continueUpload").addEventListener("click", () => {
            window.location.href = "upload.html";
        });

        // ✅ "확인" 버튼 이벤트 (post.html로 이동)
        if (postURL) {
            document.getElementById("viewPost").addEventListener("click", () => {
                window.location.href = postURL;
            });
        }
    }

    // ✅ insertHTML 함수 정의
    window.insertHTML = function (text) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement("div");

        tempDiv.innerHTML = text; // 🔥 삽입할 HTML을 임시 div에 넣기

        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }

        range.deleteContents(); // 🔥 기존 선택 영역 삭제
        range.insertNode(fragment); // 🔥 새로운 HTML 삽입
    };

    function handlePaste(event) {
        event.preventDefault();
        const clipboardData = event.clipboardData || window.clipboardData;
        let pasteHtml = clipboardData.getData("text/html") || clipboardData.getData("text/plain") || "";

        if (pasteHtml) {
            pasteHtml = pasteHtml
                .replace(/<\/?(div|p)>/g, "<br>")  // `<div>`, `<p>` → `<br>` 변환
                .replace(/(<br\s*\/?>){2,}/g, "<br>");  // ✅ 중복 `<br>` 제거
        } else {
            pasteHtml = pasteHtml.replace(/\n/g, "<br>");
        }

        // ✅ 현재 커서 위치에 붙여넣기 내용 삽입
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

    // ✅ 붙여넣기 이벤트 적용
    if (descriptionEditor) {
        descriptionEditor.removeEventListener("paste", handlePaste); // 기존 이벤트 제거
        descriptionEditor.addEventListener("paste", handlePaste);
    }

    // ✅ 클라이언트에서도 허용된 태그만 유지
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

    uploadButton.addEventListener("click", async () => {
        const file = fileInput?.files[0];
        const categoryId = categorySelect.value;
        const subcategoryId = subcategorySelect.value || "";

        // ✅ 올바른 category_name 가져오기 (categoryId와 매칭)
        const categoryName = categorySelect.options[categorySelect.selectedIndex]?.text.trim();
        const subcategoryName = subcategorySelect.options[subcategorySelect.selectedIndex]?.text.trim() || "general";

        let description = descriptionEditor.innerHTML.trim(); // ✅ HTML 태그 유지
        description = sanitizeDescription(description); // 🔥 여기서 함수 사용 (불필요한 태그 제거)

        // ✅ 순수 텍스트 길이 검사 (HTML 태그 제외)
        function stripHtmlTags(html) {
            let doc = new DOMParser().parseFromString(html, "text/html");
            return doc.body.textContent || "";
        }
        const textOnlyDescription = stripHtmlTags(description);

        if (!file) {
            showPopup("파일을 선택해주세요.");
            return;
        }

        if (!categoryId) {
            showPopup("카테고리를 선택해주세요.");
            return;
        }

        if (!subcategoryId) {
            showPopup("서브카테고리를 선택해주세요.");
            return;
        }

        if (textOnlyDescription.length === 0) {
            showPopup("설명을 입력해주세요.");
            return;
        }

        if (textOnlyDescription.length > 500) {
            showPopup("설명은 최대 500자까지만 입력 가능합니다.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("category_id", categoryId);
        formData.append("subcategory_id", subcategoryId);
        formData.append("category_name", categoryName);  // ✅ 서버에 카테고리 이름 전송
        formData.append("subcategory_name", subcategoryName);
        formData.append("description", description);

        console.log("📌 FormData 확인:");
        for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }

        try {
            showLoading(); // ✅ 로딩 시작

            const response = await fetch("/api/files/upload", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            setTimeout(() => {
                hideLoading(); // ✅ 1초 후 로딩 제거

                if (!response.ok) {
                    console.error("🚨 서버 오류 응답:", result);
                    showPopup(`업로드 실패: ${result.error || "알 수 없는 오류"}`);
                    return;
                }

                console.log("✅ 서버 응답:", result);

                // ✅ 업로드된 파일 정보 가져오기
                const { file_name, category_name, subcategory_name } = result.file; // 🔥 DB에서 가져온 값 사용

                // ✅ URL 생성 시 올바른 카테고리명 사용
                const postURL = `post.html?category=${encodeURIComponent(category_name)}&subcategory=${encodeURIComponent(subcategory_name)}&file=${encodeURIComponent(file_name)}`;

                showuploadPopup("✅ 업로드 성공!", postURL);
            }, 1000); // ✅ 1초 후 실행
            resetForm();
        } catch (error) {
            console.error("🚨 업로드 중 네트워크 오류:", error);
            showPopup("업로드 실패! 서버에 문제가 있습니다.");
        }
    });

    // ✅ 카테고리 한글 매핑
    const categoryTranslations = {
        "puzzle": "퍼즐",
        "bizz": "보석비즈",
        "solidbodypuzzle": "입체퍼즐",
        "deforme": "디폼블럭",
        "brickfigure": "브릭피규어"
    };
    /** ✅ 3️⃣ 카테고리 & 서브카테고리 동적 불러오기 */
    async function loadCategories() {
        try {
            const response = await fetch("/api/categories");
            if (!response.ok) throw new Error("카테고리를 가져오는 데 실패함");

            const categories = await response.json();
            categorySelect.innerHTML = "<option value=''>카테고리 선택</option>"; // ✅ 기본값 추가

            categories.forEach(category => {
                if (category.name.toLowerCase() !== "uncategorized") { // ✅ uncategorized 제외
                    const option = document.createElement("option");
                    option.value = category.id;
                    option.textContent = categoryTranslations[category.name] || category.name; // 🔥 한글 변환
                    categorySelect.appendChild(option);
                }
            });

            if (categories.length > 0) {
                loadSubcategories(categories[0].id);
            }
        } catch (error) {
            console.error("🚨 카테고리를 불러오는 중 오류 발생:", error);
        }
    }

    async function loadSubcategories(categoryId) {
        try {
            const response = await fetch(`/api/categories/${categoryId}/subcategories`);
            if (!response.ok) throw new Error("서브카테고리를 가져오는 데 실패함");

            const subcategories = await response.json();
            subcategorySelect.innerHTML = "<option value=''>선택 없음</option>"; // ✅ 기본값 추가
            subcategories.forEach(sub => {
                const option = document.createElement("option");
                option.value = sub.id;
                option.textContent = sub.name;
                subcategorySelect.appendChild(option);
            });
        } catch (error) {
            console.error("🚨 서브카테고리를 불러오는 중 오류 발생:", error);
        }
    }
    /** ✅ 6️⃣ 폼 초기화 함수 */
    function resetForm() {
        previewContainer.innerHTML = "";
        descriptionEditor.innerHTML = "";
        fileInput.value = "";
        categorySelect.value = "";
        subcategorySelect.innerHTML = "<option value=''>선택 없음</option>";
    }

    /** ✅ 초기 데이터 로드 */
    if (categorySelect) loadCategories();
});
