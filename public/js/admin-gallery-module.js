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
        
        // 버튼 텍스트 업데이트 등 추가 로직이 필요하면 여기서 수행
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
 * 3. 게시물 삭제 로직
 */
export async function deletePost(id) {
    // 기존에 정의된 showeditpopup이 전역에 있다고 가정하거나, 
    // 필요시 별도 UI 모듈에서 import 해야 합니다.
    if (typeof showeditpopup !== "function") {
        if (!confirm("게시물을 삭제하시겠습니까?")) return;
    } else {
        showeditpopup('게시물을 삭제하시겠습니까?', async () => {
            await executeDelete(id);
        });
        return;
    }
    await executeDelete(id);
}

async function executeDelete(id) {
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
}

/**
 * 4. 수정 메뉴 선택 팝업 (제목 vs 내용)
 */
function openEditSelectPopup(image) {
    let modal = document.getElementById("editSelectModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "editSelectModal";
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
        openContentEditPopup(image);
    };

    modal.style.display = "flex";
}

/**
 * 5. 제목 수정 팝업 및 통신
 */
function openTitleEditPopup(image) {
    const newTitle = prompt("새 제목을 입력하세요:", image.title);
    if (newTitle && newTitle.trim() !== "") {
        updatePost(image.id, { title: newTitle.trim() }, "title");
    }
}

/**
 * 6. 내용 수정 팝업 및 통신 (기존의 상세 에디터 로직)
 */
function openContentEditPopup(image) {
    // 기존에 복잡했던 openEditPopup(image) 로직을 여기에 구현하거나 호출합니다.
    // 여기서는 간단하게 처리 로직만 보여드립니다.
    const newDesc = prompt("새 내용을 입력하세요:", image.text || "");
    if (newDesc !== null) {
        updatePost(image.id, { description: newDesc }, "post");
    }
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
            alert("수정되었습니다.");
            location.reload();
        } else {
            alert("수정 실패");
        }
    } catch (error) {
        console.error("수정 오류:", error);
    }
}