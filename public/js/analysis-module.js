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
    // 1. 기본 로딩 애니메이션 먼저 실행
    showLoading();

    // 2. 기본 로딩 인디케이터의 z-index를 강제로 최상단으로 고정 (분석 UI보다 위로)
    const baseLoader = document.getElementById("loadingIndicator");
    if (baseLoader) {
        baseLoader.style.zIndex = "10000";
    }

    // 3. UI 요소 생성 (분석 UI는 로더 바로 아래인 9999로 설정)
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
    // 로딩 아이콘이 들어갈 공간을 확보하기 위해 padding-top 추가
    wrapper.innerHTML = `
        <div style="width: 300px; text-align: center; margin-top: 100px;">
            <h3 id="analysisStatus" style="font-weight: 300; letter-spacing: -0.5px;">이미지 중복 분석 중...</h3>
            <div style="width: 100%; background: #333; height: 6px; border-radius: 10px; margin-top: 20px; overflow: hidden;">
                <div id="analysisProgressBar" style="width: 20%; height: 100%; background: linear-gradient(90deg, #007bff, #00d4ff); transition: width 0.4s ease;"></div>
            </div>
            <p id="analysisPercent" style="margin-top: 15px; font-size: 14px; color: #aaa;">20%</p>
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