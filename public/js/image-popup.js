let popupOffset = 0;
const popupLimit = 24;
let isPopupLoading = false; // 로딩 상태 변수 추가
let noMoreImages = false;    // 더 가져올 이미지가 없는지 확인

// --- 로딩 애니메이션 함수 (모듈 내부에서 정의하거나 import) ---
let loaderStep = 1;
let loaderInterval = null;

function showLoading() {
    const indicator = document.getElementById("loadingIndicator");
    const loader = document.getElementById("mainLoader");
    if (!indicator || !loader) return;

    // 초기 투명도 설정 (부드러운 등장을 위해)
    indicator.style.opacity = "0";
    indicator.style.display = "flex";
    indicator.style.transition = "opacity 0.4s ease";

    // 강제 리플로우 후 투명도 조절
    setTimeout(() => indicator.style.opacity = "1", 10);

    if (loaderInterval) clearInterval(loaderInterval); // 중복 방지

    loaderInterval = setInterval(() => {
        loaderStep++;
        if (loaderStep > 4) loaderStep = 1;
        loader.className = "loader loader" + loaderStep;
    }, 150);
}

function hideLoading() {
    const indicator = document.getElementById("loadingIndicator");
    if (!indicator) return;

    indicator.style.opacity = "0";
    
    // 애니메이션이 끝난 후 display: none 처리
    setTimeout(() => {
        if (indicator.style.opacity === "0") {
            indicator.style.display = "none";
            if (loaderInterval) {
                clearInterval(loaderInterval);
                loaderInterval = null;
            }
        }
    }, 400);
}

// ── [의도적 지연을 포함한 데이터 로드] ──────────────────────────
async function fetchPopupImages() {
    if (isPopupLoading || noMoreImages) return;

    isPopupLoading = true;
    showLoading(); 

    try {
        // [지연 추가] "서버 분석 중" 느낌을 주기 위해 최소 600ms 대기
        const delayPromise = new Promise(resolve => setTimeout(resolve, 600));
        
        const fetchPromise = fetch(`/api/files?offset=${popupOffset}&limit=${popupLimit}`)
            .then(res => res.json());

        // 지연 시간과 데이터 로드를 병렬로 실행하되, 둘 다 끝날 때까지 기다림
        const [_, resJson] = await Promise.all([delayPromise, fetchPromise]);
        
        const images = Array.isArray(resJson) ? resJson : resJson.files;

        if (images.length === 0) {
            noMoreImages = true;
        } else {
            renderPopupItems(images);
            popupOffset += images.length;
            
            const countDisplay = document.getElementById("popupCountDisplay");
            if(countDisplay) countDisplay.innerText = `총 ${popupOffset}개 항목 분석 완료`;
        }

    } catch (error) {
        console.error("팝업 이미지 로드 실패:", error);
    } finally {
        // 렌더링 후 로더를 바로 끄지 않고 살짝 더 유지 (부드러운 전환)
        setTimeout(() => {
            isPopupLoading = false;
            hideLoading(); 
        }, 300);
    }
}

function renderPopupItems(images) {
    const gallery = document.getElementById("popupGallery");
    const fragment = document.createDocumentFragment();

    images.forEach(image => {
        const img = document.createElement("img");
        
        // [개선] ImageKit 최적화: 팝업용으로 크기를 줄여서 로드 (렉 줄이기의 핵심)
        // URL 뒤에 ?tr=w-200 옵션을 추가하여 데이터 전송량과 메모리 사용량 절감
        const optimizedSrc = image.file_path.includes("?") 
            ? `${image.file_path}&tr=w-250,h-250` 
            : `${image.file_path}?tr=w-250,h-250`;
            
        img.src = optimizedSrc;
        img.loading = "lazy"; // 브라우저 자체 지연 로딩

        // CSS 클래스나 인라인 스타일로 object-fit이 잘 작동하도록 보장
        img.style.objectFit = "contain";
        
        img.onclick = () => { window.location.href = `post?id=${image.id}`; };
        fragment.appendChild(img);
    });

    gallery.appendChild(fragment);
}

// ── [유틸리티: 쓰로틀링 함수] ───────────────────────────────
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// ── [메인 팝업 로직 수정] ──────────────────────────────────
export function openImagePopup() {
    const overlay = document.createElement("div");
    overlay.id = "imageModePopup";
    overlay.className = "popup-overlay"; 
    
    // 스타일을 직접 제어하여 크기를 적절하게 조절합니다.
    overlay.innerHTML = `
        <div class="popup-container modal-style">
            <div class="popup-header">
                <div class="header-info">
                    <h2>이미지 모드</h2>
                    <span id="popupCountDisplay">불러오는 중...</span>
                </div>
                <button id="closeImagePopupBtn">×</button>
            </div>
            <div id="popupGallery" class="popup-gallery"></div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden"; 

    // 1. 닫기 버튼 이벤트
    document.getElementById("closeImagePopupBtn").onclick = closePopup;

    // 2. 배경(오버레이) 클릭 시 닫기 (컨테이너 밖 클릭 시)
    overlay.onclick = (e) => {
        if (e.target === overlay) closePopup();
    };

    function closePopup() {
        overlay.remove();
        document.body.style.overflow = 'auto';
        hideLoading();
    }

    const gallery = document.getElementById("popupGallery");

// [개선] 쓰로틀링 적용: 스크롤 시 200ms마다 체크하여 연산 최적화
    gallery.onscroll = throttle(() => {
        // 하단에서 100px 여유를 두고 미리 로드
        if (gallery.scrollTop + gallery.clientHeight >= gallery.scrollHeight - 100) {
            fetchPopupImages();
        }
    }, 200);

    popupOffset = 0;
    noMoreImages = false;
    gallery.innerHTML = ""; 
    fetchPopupImages();
}