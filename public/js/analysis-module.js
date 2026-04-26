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
    
    // 1. UI 요소 생성 및 초기화
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
        if (analysisWrapper) analysisWrapper.remove();
        alert("분석 중 서버 에러가 발생했습니다.");
    }
}

// ─── 헬퍼 함수 (UI 관련 로직 추가) ───────────────────────────

function createAnalysisWrapper() {
    const wrapper = document.createElement("div");
    wrapper.id = "analysisWrapper";
    // 화면 중앙에 고정되는 오버레이 스타일
    wrapper.style = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; flex-direction: column;
        justify-content: center; align-items: center; z-index: 9999; color: white;
    `;
    document.body.appendChild(wrapper);
    return wrapper;
}

function initAnalysisUI(wrapper) {
    wrapper.innerHTML = `
        <div style="width: 300px; text-align: center;">
            <h3 id="analysisStatus">이미지 중복 분석 중...</h3>
            <div style="width: 100%; background: #444; height: 10px; border-radius: 5px; margin-top: 15px; overflow: hidden;">
                <div id="analysisProgressBar" style="width: 20%; height: 100%; background: #007bff; transition: width 0.3s;"></div>
            </div>
            <p id="analysisPercent" style="margin-top: 10px;">20%</p>
        </div>
    `;
}

function updateProgress(percent, statusText) {
    const bar = document.getElementById("analysisProgressBar");
    const percentText = document.getElementById("analysisPercent");
    const status = document.getElementById("analysisStatus");

    if (bar) bar.style.width = percent + "%";
    if (percentText) percentText.innerText = percent + "%";
    if (statusText && status) status.innerText = statusText;
}

function handleAnalysisResult(result) {
    if (result.duplicateCount === 0) {
        alert("중복된 이미지가 없습니다.");
    } else {
        // 중복 데이터가 있을 경우 결과 팝업이나 리스트를 보여주는 로직 추가
        console.log("중복 항목 리스트:", result.duplicates);
        alert(`총 ${result.duplicateCount}개의 중복 항목이 발견되었습니다. 콘솔을 확인하세요.`);
    }
}