// 1. 모듈 가져오기 (파일 경로 확인 필수)
import { checkAuth } from './auth-module.js';
import { loadAIModel, runDuplicateAnalysis } from './analysis-module.js';
import { renderDashboardCharts } from './chart-module.js';
import { fetchTextList } from './admin-gallery-module.js';
import { openImagePopup } from './image-popup.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 2. 보안 체크 (실패 시 로그인 페이지로 튕김)
    if (!checkAuth()) return;

    // 3. UI 및 데이터 초기 로드
    // AI 모델은 비동기로 백그라운드에서 로드되도록 둡니다.
    loadAIModel(); 
    
    // 차트와 텍스트 리스트 렌더링
    await renderDashboardCharts();
    await fetchTextList();

    // 4. 이벤트 바인딩 (이미 존재하던 버튼 ID 기준)
    
    // [이미지 모드] 이제 성능 저하 없는 팝업 방식으로 실행됩니다.
    const imageModeBtn = document.getElementById("image-mode");
    if (imageModeBtn) {
        imageModeBtn.addEventListener("click", openImagePopup);
    }

    // [중복 확인] AI 분석 실행
    const checkBtn = document.getElementById("check-duplicate");
    if (checkBtn) {
        checkBtn.addEventListener("click", runDuplicateAnalysis);
    }

    // [텍스트 모드 더보기]
    const loadToggleBtn = document.getElementById("loadToggleBtn");
    if (loadToggleBtn) {
        loadToggleBtn.addEventListener("click", () => {
            fetchTextList(true); // true를 인자로 주어 기존 리스트에 추가(append)
        });
    }
});