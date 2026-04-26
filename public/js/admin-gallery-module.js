// 상태 관리 변수
let loadedImages = 0;
const batchSize = 24;

/**
 * 1. 텍스트 리스트 데이터 가져오기
 */
export async function fetchTextList(append = false) {
    const container = document.getElementById("textGallery");
    if (!container) return;

    if (!append) {
        container.innerHTML = "";
        loadedImages = 0;
    }

    const url = `/api/files?offset=${loadedImages}&limit=${batchSize}`;

    try {
        const res = await fetch(url).then(r => r.json());
        const images = Array.isArray(res) ? res : res.files;

        renderTextItems(images, container);
        loadedImages += images.length;
    } catch (err) {
        console.error("데이터 로드 실패:", err);
    }
}

/**
 * 2. 리스트 아이템 렌더링
 */
function renderTextItems(images, container) {
    const fragment = document.createDocumentFragment();

    images.forEach(image => {
        const postItem = document.createElement("div");
        postItem.classList.add("post-item");

        postItem.innerHTML = `
            <img src="${image.file_path}" alt="Thumbnail">
            <div class="file-name">${image.title}</div>
            <div class="buttons">
                <button class="edit-button">수정</button>
                <button class="delete-button">삭제</button>
            </div>
        `;

        // 버튼 이벤트 바인딩
        postItem.querySelector(".edit-button").onclick = () => openEditSelectPopup(image);
        postItem.querySelector(".delete-button").onclick = () => deletePost(image.id);

        fragment.appendChild(postItem);
    });

    container.appendChild(fragment);
}

/**
 * 3. 게시물 삭제 로직 (커스텀 팝업 연동)
 */
export async function deletePost(id) {
    const deleteAction = async () => {
        try {
            const response = await fetch(`/api/files/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert('게시물이 삭제되었습니다.');
                location.reload();
            } else {
                alert(`삭제 실패: ${data.message}`);
            }
        } catch (error) {
            console.error('삭제 오류:', error);
        }
    };

    if (typeof window.showeditpopup === "function") {
        window.showeditpopup('게시물을 정말 삭제하시겠습니까?', deleteAction);
    } else {
        if (confirm("게시물을 삭제하시겠습니까?")) deleteAction();
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
        modal.className = "edit-modal-overlay"; // CSS 클래스명 확인
        modal.innerHTML = `
            <div class="edit-modal">
                <div class="edit-modal-content">
                    <button id="closeSelectModal">X</button>
                    <h2>수정 메뉴</h2>
                    <p>수정할 항목을 선택하십시오.</p>
                    <div class="edit-button-group">
                        <button id="selectTitleEdit">제목 수정</button>
                        <div class="button-separator"></div>
                        <button id="selectContentEdit">내용 수정</button>
                    </div>
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
        openContentEditPopup(image); // 상세 에디터 실행
    };

    modal.style.display = "flex";
}

/**
 * 5. 제목 수정 팝업 (Input형식)
 */
function openTitleEditPopup(image) {
    const newTitle = prompt("새 제목을 입력하세요:", image.title);
    if (newTitle && newTitle.trim() !== "") {
        updatePost(image.id, { title: newTitle.trim() }, "title");
    }
}

/**
 * 6. 상세 내용 수정 에디터 (기존의 복잡한 로직 통합)
 */
function openContentEditPopup(image) {
    let modal = document.getElementById("editModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "editModal";
        modal.className = "edit-modal-overlay";
        modal.innerHTML = `
            <div class="edit-modal">
                <div class="edit-modal-content">
                    <h2>내용 수정</h2>
                    <div class="edit-container">
                        <div class="editor-buttons">
                            <button type="button" id="btnBold"><b>B</b></button>
                            <button type="button" id="btnStrike"><s>S</s></button>
                        </div>
                        <hr class="dashed-line"> 
                        <div id="editContent" contenteditable="true" class="edit-content"></div>
                        <p><span id="editHashtagDisplay"></span> <span id="descriptionCounter">0 / 1000</span></p>
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
    
    // 🔥 중요: 서버에서 온 데이터 매핑 (image.description.text 또는 image.text)
    editContent.innerHTML = image.description?.text || image.text || "";

    // 실시간 글자 수 체크
    editContent.oninput = () => {
        const text = editContent.innerText;
        counter.textContent = `${text.length} / 1000`;
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
 * 7. 공통 업데이트 통신 함수
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
            alert("성공적으로 수정되었습니다.");
            location.reload();
        } else {
            alert(`수정 실패: ${data.message}`);
        }
    } catch (error) {
        console.error("수정 오류:", error);
    }
}