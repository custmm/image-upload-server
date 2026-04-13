// 전역 변수 설정 (함수 밖 최상단에 위치)
let loaderInterval = null;
let loaderStep = 0;


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



// 이미지로드
let loadedImages = 0;
let currentMode = "text";
const batchSize = 24;
let isLoading = false;
let noMoreImages = false;
let currentCategoryId = null;
let isPaused = false;          // 로딩 중단 상태
let currentController = null;  // fetch 취소용

let isPopupOpen = false;  //  팝업 상태 변수 추가
let chartClickHandlerRegistered = false;
let isModernized = false; //  이미지 현대화 상태 (전역)
let net;// [추가] AI 모델 변수 및 스피너 스타일

if (!window.observer) {
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
        rootMargin: "400px"
    });
}

function showpopup(message) {
    if (isPopupOpen) return;  //  팝업이 열려 있으면 실행 중단
    isPopupOpen = true;  //  팝업 열림 상태로 변경

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
        console.log(" 팝업 확인 버튼 클릭됨");  // 확인 로그
        overlay.remove();
        isPopupOpen = false;  //  팝업 닫힘 상태로 변경
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
            <div class="popup-buttons">
                <button class="popup-ok">확인</button>
                ${callback ? `<button class="popup-cancel">취소</button>` : ""}
            </div>
        `;

    document.body.appendChild(popup);

    const okBtn = popup.querySelector(".popup-ok");
    const cancelBtn = popup.querySelector(".popup-cancel");

    okBtn.onclick = async () => {
        popup.remove();
        if (callback) await callback();
    };

    if (cancelBtn) {
        cancelBtn.onclick = () => {
            popup.remove();
        };
    }
}

//  글꼴 효과 적용 함수
function formatText(command) {
    document.execCommand(command, false, null);
}

// [추가] AI 모델 로드 함수
async function loadAIModel() {
    try {
        console.log("모델 로딩 시작...");
        net = await mobilenet.load();
        console.log("모델 로딩 완료!");

        const checkBtn = document.getElementById("check-duplicate");
        if (checkBtn) {
            checkBtn.disabled = false;
            checkBtn.textContent = "게시글 중복 확인";
        }
    } catch (err) {
        console.error("AI 모델 로드 중 오류 발생:", err);
    }
}

// 스크립트가 로드되자마자 즉시 호출
loadAIModel();

document.addEventListener("DOMContentLoaded", () => {

    currentMode = "text";
    currentCategoryId = null;

    const container = document.querySelector(".post-form-container");

    // [수정] 1. 이미지 모드일 때 내부 컨테이너 스크롤 감시
    container.addEventListener("scroll", throttle(() => {
        if (currentMode !== "image") return;

        // 컨테이너 스크롤 바닥 감지 (바닥에서 20px 여유)
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 20) {
            if (!isLoading && !noMoreImages && !isPaused) {
                // 디바운스 대신 즉시 혹은 짧은 지연으로 호출
                fetchImages("image");
            }
        }
    }, 300));

    // [추가] 2. 게시글 중복 확인 버튼 이벤트
    const checkBtn = document.getElementById("check-duplicate");
    if (checkBtn) {
        checkBtn.addEventListener("click", async () => {
            // 1. 로딩 아이콘 시작 (기존 함수 호출)
            if (typeof showLoading === "function") showLoading();

            // 2. 분석 로그 창 생성 (프론트엔드 시각화)
            let logContainer = document.getElementById("analysisLogContainer");
            if (!logContainer) {
                logContainer = document.createElement("div");
                logContainer.id = "analysisLogContainer";
                logContainer.style.cssText = `
                position: fixed; 
                top: 60%; 
                left: 50%; 
                transform: translateX(-50%);
                width: 320px; 
                max-height: 150px; 
                background: rgba(0,0,0,0.7);
                color: #00ff00; 
                font-family: 'Courier New', monospace; 
                font-size: 12px;
                padding: 10px; 
                border-radius: 5px; 
                overflow-y: auto; z-index: 10001;
                border: 1px solid #444; 
                line-height: 1.5;
            `;
                document.body.appendChild(logContainer);
            }
            logContainer.innerHTML = "<div>> 시스템 초기화 중...</div>";

            const addLog = (msg) => {
                const line = document.createElement("div");
                line.innerText = `> ${msg}`;
                logContainer.appendChild(line);
                logContainer.scrollTop = logContainer.scrollHeight; // 항상 최하단 스크롤
            };

            try {
                addLog("데이터베이스 연결 시도...");
                addLog("TensorFlow AI 모델 대기 중...");

                // 가짜 로그 효과 (사용자 지루함 방지)
                setTimeout(() => addLog("ImageKit 저장소 탐색 중..."), 800);
                setTimeout(() => addLog("이미지 픽셀 데이터 추출 시작..."), 1600);

                // 3. 실제 서버 요청 시작
                const response = await fetch("/api/admin/check-all-duplicates");

                // 응답 대기 중에 반복 로그 발생
                const slowLog = setInterval(() => {
                    addLog("벡터 유사도 비교 연산 중...");
                }, 3000);

                const result = await response.json();
                clearInterval(slowLog); // 결과 나오면 반복 중단

                if (result.success) {
                    addLog(`분석 완료: 총 ${result.duplicateCount}쌍 발견.`);

                    // 4. 로딩 및 로그창 제거 후 결과 발표
                    setTimeout(() => {
                        if (typeof hideLoading === "function") hideLoading();
                        logContainer.remove();

                        if (result.duplicateCount > 0) {
                            let msg = `[분석 결과] 중복 의심 항목 ${result.duplicateCount}쌍\n\n`;
                            result.details.forEach(d => {
                                msg += `• ${d.pair[0]} ↔ ${d.pair[1]} (${d.similarity}%)\n`;
                            });
                            alert(msg);
                        } else {
                            alert("중복된 이미지가 발견되지 않았습니다.");
                        }
                    }, 800);
                }
            } catch (error) {
                if (typeof hideLoading === "function") hideLoading();
                logContainer.remove();
                alert("서버 통신 중 오류가 발생했습니다.");
            }
        });
    }

    container.classList.add("text-mode");
    container.classList.remove("image-mode");

    const textGallery = document.createElement("div");
    textGallery.id = "textGallery";
    textGallery.classList.add("gallery-container");

    container.appendChild(textGallery);

    fetchImages(currentMode, true);

    updateLoadButton();

    const loadToggleBtn = document.getElementById("loadToggleBtn");

    loadToggleBtn.addEventListener("click", () => {
        if (currentMode === "text") {
            if (!isLoading && !noMoreImages) {
                fetchImages("text");
            }
            return;
        }

        isPaused = !isPaused;

        if (isPaused) {
            if (!isLoading && !noMoreImages && !isPaused) {
                fetchImages(currentMode);
            }
        }
        updateLoadButton();
    });


    // IMAGE 모드용 (window 기준)
    window.addEventListener("scroll", throttle(() => {
        if (currentMode !== "image") return;

        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
            if (!isLoading && !noMoreImages && !isPaused) {
                fetchImagesDebounced("image");
            }
        }
    }, 700));

    renderCharts();
    bindIndicatorEvents();
    bindModeSwitchEvents();
    bindSidebarEvents();
});

function updateLoadButton() {
    if (!loadToggleBtn) return;

    //  텍스트 모드일 때만 버튼 표시
    if (currentMode === "text") {
        loadToggleBtn.style.display = "inline-block";
        loadToggleBtn.textContent = "📄 게시물 더 불러오기";
        loadToggleBtn.classList.remove("paused");
        return;
    }

    //  이미지 모드에서는 버튼 숨김
    loadToggleBtn.style.display = "none";
}

async function fetchIndicatorStatus() {
    try {
        const response = await fetch("/api/settings/indicator-status");
        if (!response.ok) throw new Error("Indicator 상태 가져오기 실패");

        const data = await response.json();

        const previewVisible = data.visible ? "visible" : "hidden";
        localStorage.setItem("previewVisible", previewVisible);

        const localModernized = localStorage.getItem("indicatorModernized");
        const modernized = localModernized !== null
            ? localModernized === "true"
            : !!data.modernized;

        localStorage.setItem("indicatorModernized", modernized ? "true" : "false");
        isModernized = modernized;

        const modernizeBtn = document.getElementById("modernize-indicator");
        if (modernizeBtn) {
            modernizeBtn.textContent = isModernized ? "이미지 원래대로" : "이미지 현대화";
        }

        // 실제 이미지 소스 적용 (함수화된 적용 사용)
        applyModernizedImages(isModernized);

    } catch (error) {
        console.error(" Indicator 상태 가져오기 오류:", error);
    }
}

async function updateIndicatorStatusOnServer(payload = {}) {
    try {
        const response = await fetch("/api/settings/indicator-status", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("서버 응답:", data);
    } catch (error) {
        console.error(" Indicator 서버 업데이트 오류:", error);
    }
}

function applyModernizedImages(isModernized) {
    const images = document.querySelectorAll("#section3 .sorting-container img");
    images.forEach((img, index) => {
        const base = `images/indicator/preview-gunff_${index + 1}`;
        img.src = isModernized ? `${base}re.png` : `${base}.png`;
    });
}

function bindIndicatorEvents() {
    const modernizeBtn = document.getElementById("modernize-indicator");
    let isModernized = localStorage.getItem("indicatorModernized") === "true";

    // 현대화 버튼 이벤트 (서버 동기화 포함)
    modernizeBtn.addEventListener("click", async () => {
        // 로컬에서 먼저 토글
        isModernized = !isModernized;
        // UI 즉시 반영
        applyModernizedImages(isModernized);
        modernizeBtn.textContent = isModernized ? "이미지 원래대로" : "이미지 현대화";
        localStorage.setItem("indicatorModernized", isModernized ? "true" : "false");

        // 서버에 modernized 상태 전송 (다른 기기/탭이 poll로 갱신되도록)
        await updateIndicatorStatusOnServer({ modernized: isModernized });

        // (선택) 성공/실패 확인을 원하면 fetch 응답을 체크해 실패 시 롤백 처리 가능
    });

    // 최초 상태 동기화
    fetchIndicatorStatus();

    // 주기적으로 서버 상태 확인 (ex: 5초마다)
    setInterval(fetchIndicatorStatus, 5000);
}

async function fetchImages(mode = "image", append = false) {

    if (isPaused || isLoading || noMoreImages) return;

    isLoading = true;
    const container = document.querySelector(".post-form-container");
    let loader = document.getElementById("image-loader");

    // 로딩 아이콘 표시
    if (mode === "image" && !loader) {
        loader = document.createElement("div");
        loader.id = "image-loader";
        loader.innerHTML = `<div class="spinner"></div><p>이미지 로드 중...</p>`;
        container.appendChild(loader);
    }

    try {
        const url = `/api/files?offset=${loadedImages}&limit=${batchSize}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);

        // 1) API가 { total, files } 형태로 내려주면 files 프로퍼티를, 아니면 그대로 배열로 처리
        const resJson = await response.json();
        const images = Array.isArray(resJson) ? resJson : resJson.files;

        // 2) 전체 개수가 필요하면 resJson.total을 사용 가능
        if (resJson.total !== undefined) {
            noMoreImages = (loadedImages + images.length) >= resJson.total;
        }

        console.log(" 서버에서 불러온 이미지:", images);

        let galleryContainer = mode === "image"
            ? document.querySelector("#imageGallery")
            : document.querySelector("#textGallery");

        if (!galleryContainer) {
            console.warn(`⚠️ ${mode} 모드 갤러리 컨테이너가 없습니다. 새로 생성합니다.`);
            galleryContainer = document.createElement("div");
            galleryContainer.id = mode === "image" ? "imageGallery" : "textGallery";

            //  여기에 삽입
            document.querySelector(".post-form-container").appendChild(galleryContainer);
        }

        //  기존 데이터 유지하면서 추가
        if (mode === "image") {
            renderImageMode(images, append);
        } else {
            renderTextMode(images, append);
        }

        loadedImages += images.length;
    } catch (error) {
        console.error("로딩 실패:", error);
    } finally {
        isLoading = false;
        if (loader) loader.remove(); // 로딩 완료 후 아이콘 제거
    }
}

// [추가] 유사도 계산 함수
function calculateSimilarity(v1, v2) {
    let dot = 0, nA = 0, nB = 0;
    for (let i = 0; i < v1.length; i++) {
        dot += v1[i] * v2[i];
        nA += v1[i] * v1[i];
        nB += v2[i] * v2[i];
    }
    return dot / (Math.sqrt(nA) * Math.sqrt(nB));
}

// 이미지모드진입시
function renderImageMode(images, append = false) {
    const container = document.querySelector(".post-form-container");
    container.classList.add("image-mode");
    container.classList.remove("text-mode");

    let gallery = document.querySelector("#imageGallery");

    if (!gallery) {
        gallery = document.createElement("div");
        gallery.id = "imageGallery";
        gallery.classList.add("gallery-container");
        container.appendChild(gallery);
    }

    const fragment = document.createDocumentFragment();

    images.forEach(image => {
        const img = document.createElement("img");

        img.dataset.src = `${image.file_path}`;
        img.dataset.loaded = "false";

        img.addEventListener("click", () => {
            window.location.href = `post?id=${image.id}`;
        });

        fragment.appendChild(img);
        window.observer.observe(img);
    });

    gallery.appendChild(fragment);

}

// 텍스트모드 진입시
function renderTextMode(images, append = false) {
    const container = document.querySelector(".post-form-container");

    container.classList.add("text-mode");
    container.classList.remove("image-mode");

    images.forEach(image => {
        const postItem = document.createElement("div");
        postItem.classList.add("post-item");

        // 이미지
        const img = document.createElement("img");
        img.src = `${image.file_path}`;
        img.alt = "Thumbnail";

        // 제목
        const fileName = document.createElement("div");
        fileName.classList.add("file-name");
        fileName.textContent = image.title;

        // 버튼 그룹
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("buttons");

        // 수정 버튼 그룹
        const editButton = document.createElement("button");
        editButton.classList.add("edit-button");
        editButton.textContent = "수정";
        editButton.onclick = () => openEditSelectPopup(image);

        // 삭제 버튼
        const deleteButton = document.createElement("button");
        deleteButton.classList.add("delete-button");
        deleteButton.textContent = "삭제";
        deleteButton.onclick = () => deletePost(image.id);

        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);

        postItem.appendChild(img);
        postItem.appendChild(fileName);
        postItem.appendChild(buttonContainer);

        const gallery = document.querySelector("#textGallery");
        gallery.appendChild(postItem);
    });
}

// 텍스트모드 제목 수정버튼 동작
async function updatePostTitle(postId, newTitle) {
    try {
        const response = await fetch(`api/files/update-title/${postId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ title: newTitle }),
        });

        const data = await response.json();

        if (data.success) {
            showpopup("제목이 성공적으로 수정되었습니다.", () => {
                setTimeout(() => {
                    location.reload();
                }, 700);
            });
        } else {
            showeditpopup("제목 수정 실패");
        }

    } catch (error) {
        console.error(" 제목 수정 오류:", error);
        showeditpopup("오류가 발생했습니다.");
    }
}

// 텍스트모드 내용 수정버튼 동작
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
        if (data.success) {
            const descriptionElement = document.getElementById(`description-${postId}`);
            if (descriptionElement) {
                descriptionElement.innerHTML = newDescription; // 수정된 내용을 즉시 반영
            }
            showpopup("게시물이 성공적으로 수정되었습니다.", () => {
                setTimeout(() => {
                    location.reload();
                }, 700);
            });
        } else {
            showeditpopup("게시물 수정에 실패했습니다.");
        }
    } catch (error) {
        console.error(" 게시물 수정 오류:", error);
        showeditpopup("수정 중 오류가 발생했습니다.");
    }
}

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

        // 🔥 [중요] 이벤트 리스너를 '생성 시점'에 한 번만 등록합니다.
        const titleBtn = modal.querySelector("#selectTitleEdit");
        const contentBtn = modal.querySelector("#selectContentEdit");
        const closeBtn = modal.querySelector("#closeSelectModal");

        titleBtn.addEventListener("click", () => {
            modal.style.display = "none";
            // 여기서 image는 클로저(Closure)를 통해 전달됩니다.
            // 하지만 매번 다른 이미지를 처리해야 하므로 아래 호출 방식을 유지합니다.
        });

        contentBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });

        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    // 🔥 매번 호출될 때마다 버튼의 동작이 해당 'image'를 가리키도록 업데이트
    const titleBtn = modal.querySelector("#selectTitleEdit");
    const contentBtn = modal.querySelector("#selectContentEdit");

    // 기존 리스너와 충돌을 피하기 위해, 호출 시점에 로직을 다시 할당하거나 
    // 위에서 등록한 리스너가 최신 image를 참조하게 만듭니다.
    // 가장 간단한 방법은 아래처럼 재할당하는 것입니다.
    titleBtn.onclick = () => {
        modal.style.display = "none";
        openTitleEditPopup(image);
    };
    contentBtn.onclick = () => {
        modal.style.display = "none";
        openEditPopup(image);
    };

    modal.style.display = "flex";
}

function openTitleEditPopup(image) {
    let modal = document.getElementById("editTitleModal");

    if (!modal) {
        modal = document.createElement("div");
        modal.id = "editTitleModal";

        modal.innerHTML = `
            <div class="edit-modal">
                <div class="edit-modal-content">
                    <h2>제목 수정</h2>
                    <input type="text" id="editTitleInput" class="title-input"/>
                    <div class="edit-button-group">
                        <button id="saveTitleBtn">저장</button>
                        <div class="button-separator"></div>
                        <button id="closeTitleBtn">취소</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    const input = modal.querySelector("#editTitleInput");
    input.value = image.title;

    const saveBtn = modal.querySelector("#saveTitleBtn");
    const closeBtn = modal.querySelector("#closeTitleBtn");

    saveBtn.onclick = async () => {
        const newTitle = input.value.trim();

        if (!newTitle) {
            showeditpopup("❗제목을 입력해주세요.");
            return;
        }

        showeditpopup("제목을 수정하시겠습니까?", async () => {
            await updatePostTitle(image.id, newTitle);
            modal.style.display = "none";
        });
    };

    closeBtn.onclick = () => {
        modal.style.display = "none";
    };

    modal.style.display = "flex";
}

// 수정 버튼 클릭 시 팝업창 오픈
function openEditPopup(image) {
    let modal = document.getElementById("editModal");

    if (!modal) {
        modal = document.createElement("div");
        modal.id = "editModal";

        modal.innerHTML = `
                <div class="edit-modal">
                    <div class="edit-modal-content">
                        <h2>내용 수정</h2>
                        <div class="edit-container">
                            <div class="editor-buttons">
                                <button onclick="formatText('bold')"><i class="fas fa-bold"></i></button>
                                <button onclick="formatText('italic')"><i class="fas fa-italic"></i></button>
                                <button onclick="formatText('strikethrough')"><i class="fas fa-strikethrough"></i></button>
                                <button onclick="formatText('underline')"><i class="fas fa-underline"></i></button>
                            <hr class="dashed-line"> 
                                <div id="editContent" contenteditable="true" class="edit-content"></div>
                                    <p><span id="editHashtagDisplay"></span><span id="descriptionCounter">0 / 500</span></p>
                                </div>
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
    modal.classList.remove("hidden");   // 표시


    //  항상 최신 내용 설정
    const editContent = modal.querySelector("#editContent");
    const descriptionCounter = modal.querySelector("#descriptionCounter");
    editContent.innerHTML = image.text || image.description?.text || "";
    const hashtagDisplay = modal.querySelector("#editHashtagDisplay");

    //  입력 시 실시간 글자 수 업데이트
    editContent.addEventListener("input", () => {
        const rawText = editContent.innerText;

        //  한글 해시태그까지 포함
        const hashtags = rawText.match(/#[\w가-힣]+/g) || [];

        // 해시태그 제거 후 글자 수 계산
        const textWithoutTags = rawText.replace(/#[\w가-힣]+/g, '').trim();
        const charCount = textWithoutTags.length;

        // 카운터 표시 업데이트
        descriptionCounter.textContent = `${charCount} / 500`;

        //  해시태그 표시에도 사용
        hashtagDisplay.textContent = hashtags.join(' ');

    });


    //  저장 버튼
    const saveButton = modal.querySelector("#saveEdit");
    const closeButton = modal.querySelector("#closeEdit");

    //  기존 이벤트 제거
    saveButton.onclick = null;
    closeButton.onclick = null;


    //  새 이벤트 등록
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
            try {
                await updatePostDescription(image.id, newDescription);
                modal.style.display = "none";
            } catch (error) {
                console.error("수정 오류:", error);
                showeditpopup("수정에 실패했습니다.");
            }
        });
    };

    closeButton.onclick = () => {
        modal.style.display = "none";
    };

    modal.style.display = "flex";
}

// 게시물삭제(delete)
async function deletePost(id) {
    showeditpopup('게시물을 삭제하시겠습니까?', async () => {
        try {
            const response = await fetch(`/api/files/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();

            if (data.success) {
                showpopup('게시물이 삭제되었습니다.', () => {
                    setTimeout(() => {
                        location.reload();
                    }, 700);
                });
            } else {
                showeditpopup(`삭제 실패: ${data.error || data.message}`);
            }
        } catch (error) {
            console.error(' 삭제 중 오류 발생:', error);
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

    //  사이드바 메뉴 클릭 시 자동으로 사이드바 닫기
    document.querySelectorAll(".sidebar a").forEach(menuItem => {
        menuItem.addEventListener("click", () => {
            sidebar.classList.remove("open"); //  사이드바 닫기
            adminBar.classList.remove("hidden"); //  adminbar-container 다시 보이기

            //  모든 section-container 원래 위치로 복귀
            sectionContainers.forEach(section => {
                section.classList.toggle("shifted");

                // 내부 요소 강제 폭 제한 (선택적)
                const chart = section.querySelector(".post-chart-container");
                if (chart) {
                    chart.style.maxWidth = "100%";
                }
            });
        });
    });

    //  모든 change-button에 클릭 효과 추가
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
    imgElement.loading = "lazy"; //  Lazy Load 속성 추가
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
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function () {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function () {
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
        loadedImages = 0;
        noMoreImages = false;

        const container = document.querySelector(".post-form-container");
        clearContainer(container);

        container.classList.add("image-mode");
        container.classList.remove("text-mode");

        const imageGallery = document.createElement("div");
        imageGallery.id = "imageGallery";
        imageGallery.classList.add("gallery-container");

        container.appendChild(imageGallery);

        fetchImages("image", false);
        updateLoadButton();
    });

    document.getElementById("text-mode").addEventListener("click", () => {
        currentMode = "text";
        loadedImages = 0;
        noMoreImages = false;

        const container = document.querySelector(".post-form-container");
        clearContainer(container);

        container.classList.add("text-mode");
        container.classList.remove("image-mode");

        const textGallery = document.createElement("div");
        textGallery.id = "textGallery";
        textGallery.classList.add("gallery-container");
        container.appendChild(textGallery);

        fetchImages("text", false);
        updateLoadButton();
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
        console.error(" 카테고리 데이터 불러오기 오류:", error);
        return [];
    }
}

function applyForceLayout(bubbles, iterations = 120) {

    const padding = 2;

    for (let k = 0; k < iterations; k++) {

        for (let i = 0; i < bubbles.length; i++) {
            for (let j = i + 1; j < bubbles.length; j++) {

                const a = bubbles[i];
                const b = bubbles[j];

                const dx = b.x - a.x;
                const dy = b.y - a.y;

                const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;

                const minDist = a.r + b.r + padding;

                if (dist < minDist) {

                    const force = (minDist - dist) / dist * 0.5;

                    const moveX = dx * force;
                    const moveY = dy * force;

                    b.x += moveX;
                    b.y += moveY;

                    a.x -= moveX;
                    a.y -= moveY;

                }
            }
        }

        bubbles.forEach(b => {
            b.x *= 0.98;
            b.y *= 0.98;
        });
    }

    return bubbles;
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

    const centerTextPlugin = {
        id: "centerText",
        afterDraw(chart) {

            const { ctx } = chart;

            ctx.save();

            const centerX = chart.width / 2;
            const centerY = chart.height / 2;

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // 위 텍스트
            ctx.font = "14px Arial";
            ctx.fillStyle = "#666";
            ctx.fillText("총 게시물", centerX - 75, centerY - 5);

            // 숫자
            ctx.font = "bold 26px Arial";
            ctx.fillStyle = "#000";
            ctx.fillText(total, centerX - 75, centerY + 25);

            ctx.restore();
        }
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

    const donutCtx = donutCanvas.getContext("2d");

    if (window.donutChartInstance) {
        window.donutChartInstance.destroy();
    }

    const donutOptions = {
        ...window.originalDonutChartOptions,
        responsive: true,
        maintainAspectRatio: false, // 반드시 false
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

                //  표가 생기면 차트 정렬 왼쪽으로
                document.querySelector(".post-chart-container");

                const chartArea = document.getElementById("chartArea");

                chartArea.style.display = "flex";
                chartArea.style.flexDirection = "row";
                chartArea.style.alignItems = "center";  // ⬅️ 중요!
                chartArea.style.justifyContent = "center";  // ⬅️ 중요!
                document.querySelector(".post-chart-container").style.justifyContent = "center";
            }

            if (!chartClickHandlerRegistered) {
                document.addEventListener("click", function (event) {
                    const table = document.getElementById("categoryInfoTable");
                    const chartArea = document.getElementById("chartArea");

                    const isClickInsideChart = chartArea.contains(event.target);

                    if (table && !isClickInsideChart) {
                        //  서브카테고리 래퍼 제거
                        const wrapper = chartArea.querySelector(".subcategory-wrapper");
                        if (wrapper) wrapper.remove();

                        //  chartArea 중앙 정렬 복원
                        chartArea.style.justifyContent = "center";

                        //  donutChart 재삽입 (필요 시)
                        const donutCanvas = document.getElementById("donutChart");
                        if (!chartArea.contains(donutCanvas)) {
                            chartArea.innerHTML = ""; // chartArea 초기화
                            const canvasWrapper = document.createElement("div");
                            canvasWrapper.className = "chart-wrapper";
                            canvasWrapper.appendChild(donutCanvas);
                            chartArea.appendChild(canvasWrapper);
                        }

                        //  도넛 차트 재생성
                        if (window.donutChartInstance) {
                            window.donutChartInstance.destroy();
                        }

                        const ctx = donutCanvas.getContext("2d");
                        window.donutChartInstance = new Chart(ctx, {
                            type: "doughnut",
                            data: JSON.parse(JSON.stringify(window.originalDonutChartData)),
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    tooltip: {
                                        callbacks: {
                                            label: function (context) {
                                                const data = context.raw;
                                                return `${data.label} : ${data.value}%`;
                                            }
                                        }
                                    },
                                    legend: {
                                        display: false
                                    },
                                    title: {
                                        display: true,
                                        text: "게시물 비율 버블 차트"
                                    }
                                },
                                scales: {
                                    x: {
                                        display: false
                                    },
                                    y: {
                                        display: false
                                    }
                                }
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
        options: donutOptions,
        plugins: [centerTextPlugin]
    });

    // 막대 그래프 그대로 유지
    const barCtx = document.getElementById("radarChart").getContext("2d");
    const isMobile = window.innerWidth <= 480;
    barCtx.canvas.width = isMobile ? 300 : 500;
    barCtx.canvas.height = isMobile ? 300 : 500;

    // 기존 차트 제거
    if (window.barChartInstance) window.barChartInstance.destroy();

    //  bar chart 데이터셋 하나로
    const bubbleData = categories.map((cat, i) => {

        const value = parseFloat(probabilities[i]);

        return {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10,
            r: Math.max(10, value * 1.5),
            label: cat,
            value: value
        };

    });
    const arrangedBubbles = applyForceLayout(bubbleData);

    // 초기 차트 생성
    window.barChartInstance = new Chart(barCtx, {
        type: "bubble",
        data: {
            datasets: [{
                label: "게시물 비율",
                data: arrangedBubbles,
                backgroundColor: [
                    "#FF6384",
                    "#36A2EB",
                    "#FFCE56",
                    "#4BC0C0",
                    "#9966FF"
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const data = context.raw;
                            return `${data.label} : ${data.value}%`;
                        }
                    }
                }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });

    document.getElementById("showDonut").addEventListener("click", () => {
        document.getElementById("donutWrapper").style.display = "flex";
        document.getElementById("barWrapper").style.display = "none";

        const chartArea = document.getElementById("chartArea");
        chartArea.style.justifyContent = "center";
    });

    document.getElementById("showRadar").addEventListener("click", () => {
        document.getElementById("donutWrapper").style.display = "none";
        document.getElementById("barWrapper").style.display = "flex";

        document.getElementById("lineChart").style.display = "none";

        const wrapper = document.querySelector(".subcategory-wrapper");
        if (wrapper) wrapper.remove();

        const chartArea = document.getElementById("chartArea");
        chartArea.style.justifyContent = "center";
    });

    // ── [유틸리티 함수] ───────────────────────────────
    function stripHtmlTags(html) {
        let doc = new DOMParser().parseFromString(html, "text/html");
        return doc.body.textContent || "";
    }

    // autoResize 함수 정의
    function autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(textarea.scrollHeight, 50) + 'px';
    }

    function showSubcategoryTable(subcategories, categoryName) {
        // 기존 wrapper 제거
        const oldWrapper = document.querySelector(".subcategory-wrapper");
        if (oldWrapper) oldWrapper.remove();

        // 새 wrapper 생성
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

        subcategories.forEach((item) => {
            const dataRow = document.createElement("tr");
            dataRow.innerHTML = `
                <td>${item.subcategory_name}</td>
                <td>${item.count}개</td>
            `;
            table.appendChild(dataRow);
        });

        wrapper.appendChild(table);

        //  chartArea 내에 표 추가 (도넛 차트 옆에 붙도록)
        document.getElementById("chartArea").appendChild(wrapper);
    }

    async function fetchSubcategoryCountsByCategory(categoryName) {
        try {
            const response = await fetch(`/api/files/subcategory-counts?category_name=${encodeURIComponent(categoryName)}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("서브카테고리 데이터 가져오기 실패", error);
            return [];
        }
    }
}
