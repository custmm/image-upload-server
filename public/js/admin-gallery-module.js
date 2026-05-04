// 상태 관리 변수 (모듈 스코프 유지)
let loadedImages = 0;
const batchSize = 24;
let isLoadingList = false; // 중복 로딩 방지
let textNoMoreData = false; // 데이터가 더 이상 없는지 체크


/**
 * 1. 텍스트 리스트 데이터 가져오기
 */
export async function fetchTextList(append = false) {
    if (isLoadingList || (append && textNoMoreData)) return;

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
        postItem.setAttribute("data-id", image.id); // ID 저장

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

// [추가] 게시물 더보기 버튼 상태 업데이트 함수
function updateLoadButton(hasMore) {
    const loadToggleBtn = document.getElementById("loadToggleBtn");

    if (!loadToggleBtn) return; // 버튼 요소가 없으면 무시

    if (hasMore) {
        loadToggleBtn.style.display = "block"; // 데이터가 더 있으면 보이기
        loadToggleBtn.innerText = "게시물 로드";
    } else {
        loadToggleBtn.style.display = "none"; // 더 불러올 데이터가 없으면 숨기기
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
async function openTitleEditPopup(image) {
    const newTitle = prompt("새 제목을 입력하세요:", image.title);
    
    if (newTitle !== null && newTitle.trim() !== "") {
        const result = await updatePost(image.id, { title: newTitle.trim() }, "title");

        // ✅ 여기에 추가합니다!
        if (result.success) {
            // 1. DOM에서 해당 ID를 가진 post-item 찾기
            const targetItem = document.querySelector(`.post-item[data-id="${image.id}"]`);
            
            if (targetItem) {
                // 2. 해당 아이템 내의 제목 텍스트 업데이트
                targetItem.querySelector(".file-name").innerText = newTitle.trim();
                
                // 3. 메모리 데이터(image 객체)도 업데이트하여 이후 수정 시 반영되게 함
                image.title = newTitle.trim(); 
            }
        }
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
        const result = await updatePost(image.id, { description: updatedDesc }, "post");

        if (result.success) {
            // 새로고침 없이 데이터 반영
            image.description = { text: updatedDesc }; // 데이터 객체 업데이트
            modal.style.display = "none";
        }
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
            return { success: true, payload };
        } else {
            alert(`수정 실패: ${data.message}`);
            return { success: false };
        }
    } catch (error) {
        console.error("수정 오류:", error);
        return { success: false };
    }
}

/**
 * 8. PDF 데이터 다운로드 팝업 호출
 */
document.addEventListener("DOMContentLoaded", () => {
    const pdfBtn = document.getElementById("pdf");

    if (pdfBtn) {
        pdfBtn.addEventListener("click", (e) => {
            e.preventDefault();

            // [수정 포인트] 변수명을 일치시킵니다.
            const placeholderUrl = "about:blank";

            // placeholderUrl을 인자로 전달합니다.
            openPdfPreview(placeholderUrl);

            console.log("📍 PDF 팝업 호출됨");
        });
    }
});

/**
 * PDF 전용 핀 팝업 생성 및 표시
 */
function openPdfPreview(url) {
    // 1. 기존 previewOverlayInfo 구조 활용 (이미 HTML에 있는 경우)
    const overlay = document.getElementById("previewOverlayInfo");
    const frame = document.getElementById("previewFrameInfo");

    if (overlay && frame) {
        frame.src = url;
        overlay.style.display = "flex";

        // 드래그 가능하게 설정 (기존 함수 재사용)
        if (typeof makePopupDraggable === "function") {
            makePopupDraggable("previewOverlayInfo");
        }
    } else {
        // 2. 만약 전용 요소가 없다면 새로 창을 띄우거나 알림
        alert("미리보기 팝업 요소를 찾을 수 없습니다. 새 탭에서 엽니다.");
        window.open(url, "_blank", "noopener,noreferrer");
    }
}