// 상태 관리 변수 (모듈 스코프 유지)
let loadedImages = 0;
const batchSize = 24;
let isLoadingList = false; // 중복 로딩 방지
let textNoMoreData = false; // 데이터가 더 이상 없는지 체크

/**
 * 1. 텍스트 리스트 데이터 가져오기
 */
export async function fetchTextList(append = false) {
    if (isLoadingList||(append &&textNoMoreData)) return;
    
    // 1. 부모 컨테이너 찾기
    const parentContainer = document.querySelector(".post-form-container");
    if (!parentContainer) {
        console.error("❌ 에러: '.post-form-container' 요소를 찾을 수 없습니다.");
        return;
    }

    // 2. textGallery 찾기, 없으면 동적 생성
    let container = document.getElementById("textGallery");
    if (!container) {
        container = document.createElement("div");
        container.id = "textGallery";
        container.className = "gallery-container"; // 필요에 따라 클래스 추가
        
        // 텍스트 모드일 때만 보이도록 부모 클래스 조정
        parentContainer.classList.add("text-mode");
        parentContainer.classList.remove("image-mode");
        
        parentContainer.appendChild(container);
    }

    // 3. 덮어쓰기 모드(!append)일 때 초기화
    if (!append) {
        container.innerHTML = "";
        loadedImages = 0;
        textNoMoreData = false;
    }

    isLoadingList = true;
    const url = `/api/files?offset=${loadedImages}&limit=${batchSize}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);

        const resJson = await response.json();
        
        // 🔥 [데이터 구조 매핑 수정] res.files가 있으면 그것을 사용, 없으면 배열로 간주
        const images = Array.isArray(resJson) ? resJson : (resJson.files || []);

        // 불러온 이미지가 요청한 batchSize보다 작으면 끝에 도달한 것임
        if (images.length < batchSize) {
            textNoMoreData = true;
        }

        if (images.length === 0) {
            if (!append) container.innerHTML = "<p style='text-align:center; padding:20px;'>불러올 게시물이 없습니다.</p>";
            return;
        }

        renderTextItems(images, container);
        loadedImages += images.length;

        // 불러오기 성공 후 버튼 상태 업데이트
        updateLoadButton(!textNoMoreData);
        
        console.log(`✅ 게시물 로드 완료: ${images.length}개 (누적: ${loadedImages})`);
    } catch (err) {
        console.error("❌ 게시글 로드 실패:", err);
    } finally {
        isLoadingList = false;
    }
}

/**
 * 2. 리스트 아이템 렌더링
 */
function renderTextItems(images, container) {
    const fragment = document.createDocumentFragment();

    images.forEach(image => {
        const postItem = document.createElement("div");
        postItem.className = "post-item"; // CSS와 일치하는 클래스

        // 이미지 최적화 (Thumb용 작은 사이즈 요청)
        const thumbUrl = image.file_path.includes("?") 
            ? `${image.file_path}&tr=w-100,h-100` 
            : `${image.file_path}?tr=w-100,h-100`;

        postItem.innerHTML = `
            <img src="${thumbUrl}" alt="Thumbnail" onerror="this.src='/images/no-image.png'">
            <div class="file-name">${image.title || '제목 없음'}</div>
            <div class="buttons">
                <button class="edit-button" type="button">수정</button>
                <button class="delete-button" type="button">삭제</button>
            </div>
        `;

        // 버튼 이벤트 바인딩
        const editBtn = postItem.querySelector(".edit-button");
        const deleteBtn = postItem.querySelector(".delete-button");

        editBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openEditSelectPopup(image);
        });

        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deletePost(image.id);
        });

        fragment.appendChild(postItem);
    });

    container.appendChild(fragment);
}

/**
 * 3. 게시물 삭제 로직
 */
export async function deletePost(id) {
    const executeDelete = async () => {
        try {
            const response = await fetch(`/api/files/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert('게시물이 삭제되었습니다.');
                location.reload();
            } else {
                alert(`삭제 실패: ${data.message || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error('삭제 오류:', error);
        }
    };

    // 전역 UI 함수 체크
    if (typeof window.showeditpopup === "function") {
        window.showeditpopup('게시물을 정말 삭제하시겠습니까?', executeDelete);
    } else if (confirm("게시물을 삭제하시겠습니까?")) {
        executeDelete();
    }
}

/**
 * 4. 수정 메뉴 선택 팝업
 */
function openEditSelectPopup(image) {
    let modal = document.getElementById("editSelectModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "editSelectModal";
        modal.className = "edit-modal"; // CSS 클래스 보정
        modal.innerHTML = `
            <div class="edit-modal-content">
                <button id="closeSelectModal">X</button>
                <h2 style="color:#000;">수정 메뉴</h2>
                <p style="color:#333;">수정할 항목을 선택하십시오.</p>
                <div class="edit-button-group">
                    <button id="selectTitleEdit">제목 수정</button>
                    <div class="button-separator"></div>
                    <button id="selectContentEdit">내용 수정</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector("#closeSelectModal").onclick = () => modal.style.display = "none";
    }

    modal.querySelector("#selectTitleEdit").onclick = () => {
        modal.style.display = "none";
        openTitleEditPopup(image);
    };
    modal.querySelector("#selectContentEdit").onclick = () => {
        modal.style.display = "none";
        openContentEditPopup(image);
    };

    modal.style.display = "flex";
}

/**
 * 5. 제목 수정
 */
function openTitleEditPopup(image) {
    const newTitle = prompt("새 제목을 입력하세요:", image.title);
    if (newTitle !== null && newTitle.trim() !== "") {
        updatePost(image.id, { title: newTitle.trim() }, "title");
    }
}

/**
 * 6. 상세 내용 수정 에디터
 */
function openContentEditPopup(image) {
    let modal = document.getElementById("editModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "editModal";
        modal.innerHTML = `
            <div class="edit-modal">
                <div class="edit-modal-content">
                    <h2 style="color:#000;">내용 수정</h2>
                    <div class="edit-container">
                        <div class="editor-buttons">
                            <button type="button" id="btnBold"><b>B</b></button>
                            <button type="button" id="btnStrike"><s>S</s></button>
                        </div>
                        <hr class="dashed-line"> 
                        <div id="editContent" contenteditable="true" class="edit-content" style="color:#000; background:#fff;"></div>
                        <p><span id="descriptionCounter">0 / 1000</span></p>
                    </div>
                    <div class="edit-button-group">
                        <button id="saveEdit">저장</button>
                        <div class="button-separator"></div>
                        <button id="closeEdit">취소</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const editContent = modal.querySelector("#editContent");
    const counter = modal.querySelector("#descriptionCounter");
    
    // 데이터 로드
    editContent.innerHTML = image.description?.text || image.text || "";

    editContent.oninput = () => {
        counter.textContent = `${editContent.innerText.length} / 1000`;
    };

    modal.querySelector("#btnBold").onclick = () => document.execCommand('bold');
    modal.querySelector("#btnStrike").onclick = () => document.execCommand('strikethrough');
    modal.querySelector("#closeEdit").onclick = () => modal.style.display = "none";
    
    modal.querySelector("#saveEdit").onclick = async () => {
        const updatedDesc = editContent.innerHTML;
        if (!editContent.innerText.trim()) {
            alert("내용을 입력해주세요.");
            return;
        }
        await updatePost(image.id, { description: updatedDesc }, "post");
        modal.style.display = "none";
    };

    modal.style.display = "flex";
}

/**
 * 7. 업데이트 통신
 */
export async function updatePost(postId, payload, type) {
    const url = type === "title" ? `/api/files/update-title/${postId}` : `/api/files/update-post/${postId}`;
    
    try {
        const response = await fetch(url, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (data.success) {
            alert("수정되었습니다.");
            location.reload();
        } else {
            alert(`수정 실패: ${data.message}`);
        }
    } catch (error) {
        console.error("수정 오류:", error);
    }
}