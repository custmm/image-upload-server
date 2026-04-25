import { showLoading, hideLoading } from './auth-module.js';

let net;

export async function loadAIModel() {
    try {
        console.log("AI 모델 로딩 시작...");
        net = await mobilenet.load();
        const checkBtn = document.getElementById("check-duplicate");
        if (checkBtn) {
            checkBtn.disabled = false;
            checkBtn.textContent = "게시글 중복 확인";
        }
    } catch (err) {
        console.error("AI 모델 로드 실패:", err);
    }
}

export async function runDuplicateAnalysis() {
    showLoading();
    let analysisWrapper = document.getElementById("analysisWrapper") || createAnalysisWrapper();
    initAnalysisUI(analysisWrapper);

    let currentPercent = 20;
    const progressTimer = setInterval(() => {
        if (currentPercent < 90) {
            currentPercent += Math.floor(Math.random() * 3) + 1;
            updateProgress(currentPercent);
        }
    }, 600);

    try {
        const response = await fetch("/api/admin/check-all-duplicates");
        if (!response.ok) throw new Error("서버 응답 에러");
        
        const result = await response.json();
        clearInterval(progressTimer);

        if (result.success) {
            updateProgress(100, `분석 완료: 총 ${result.duplicateCount}쌍 발견.`);
            setTimeout(() => {
                hideLoading();
                analysisWrapper.remove();
                handleAnalysisResult(result);
            }, 1000);
        }
    } catch (error) {
        clearInterval(progressTimer);
        hideLoading();
        analysisWrapper.remove();
        alert("분석 중 서버 에러가 발생했습니다.");
    }
}

// 헬퍼 함수들 (createAnalysisWrapper, initAnalysisUI 등 기존 UI 업데이트 로직 포함)