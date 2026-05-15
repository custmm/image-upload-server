
/**
 * ── [차트 모듈 전체 코드 수정본] ──
 */
export async function renderDashboardCharts() {
    try {
        // 1. 관리자 토큰 가져오기 (로그인 시 저장된 키값 확인 필요)
        const token = localStorage.getItem("adminToken");

        // 2. 인증 헤더를 포함하여 상대 경로로 호출
        const response = await fetch('/api/files/category-counts', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // 서버 설정에 따라 Bearer 방식 사용
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const responseData = await response.json();

        // 데이터 추출
        const categoryData = Array.isArray(responseData) ? responseData : (responseData.data || []);

        if (categoryData.length === 0) {
            console.warn('차트를 그릴 데이터가 없습니다.');
            return;
        }

        // 차트 데이터 가공
        const labels = categoryData.map(item => item.category_name || '기타');
        const dataValues = categoryData.map(item => Number(item.count) || 0);
        const totalCount = dataValues.reduce((a, b) => a + b, 0);

        // 도넛 차트 렌더링
        renderDonutChart(labels, dataValues, totalCount);

        // 버블 차트용 확률 계산 및 렌더링
        const probabilities = dataValues.map(v => ((v / totalCount) * 100).toFixed(1));
        renderBubbleChart(labels, probabilities);

        // 🔥 [수정 포인트 1] 차트를 다 그린 후, 전환 버튼 이벤트를 활성화합니다!
        bindChartSwitchEvents();
    } catch (error) {
        console.error('❌ 차트 로드 실패:', error.message);
        // 에러 발생 시 사용자에게 안내 (선택 사항)
        const chartArea = document.getElementById("chartArea");
        if (chartArea && error.message.includes("ID가 필요")) {
            chartArea.innerHTML = "<p style='color:red; text-align:center;'>인증 세션이 만료되었습니다. 다시 로그인해주세요.</p>";
        }
    }
}
// 도넛/버블 보기 전환 리스너
function bindChartSwitchEvents() {
    const showDonutBtn = document.getElementById("showDonut");
    const showRadarBtn = document.getElementById("showRadar"); // 버블차트 버튼

    if (showDonutBtn) {
        showDonutBtn.onclick = () => {
            document.getElementById("donutWrapper").style.display = "flex";
            document.getElementById("barWrapper").style.display = "none";

            const chartArea = document.getElementById("chartArea");
            if (chartArea) chartArea.style.justifyContent = "center";

            // 🔥 [수정 포인트 2-1] 도넛 차트가 다시 보일 때 크기 재계산
            if (window.donutChartInstance) window.donutChartInstance.resize();
        };
    }

    if (showRadarBtn) {
        showRadarBtn.onclick = () => {
            document.getElementById("donutWrapper").style.display = "none";
            document.getElementById("barWrapper").style.display = "flex";

            // 버블차트 볼 때는 기존 도넛 옆의 서브카테고리 표를 숨김/제거
            const oldWrapper = document.querySelector(".subcategory-wrapper");
            if (oldWrapper) oldWrapper.remove();

            const chartArea = document.getElementById("chartArea");
            if (chartArea) chartArea.style.justifyContent = "center";

            // 🔥 [수정 포인트 2-2] 숨겨져 있던 버블 차트가 나타날 때 크기 재계산 (매우 중요!)
            if (window.barChartInstance) window.barChartInstance.resize();
        };
    }
}

// --- 아래는 기존 도넛/버블 렌더링 함수 유지 ---
function renderDonutChart(labels, data, total) {
    const canvas = document.getElementById("donutChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (window.donutChartInstance) window.donutChartInstance.destroy();

    // 🔥 [추가] 중앙 텍스트 플러그인 정의
    const centerTextPlugin = {
        id: "centerText",
        afterDraw(chart) {
            const { ctx, chartArea: { left, right, top, bottom, width, height } } = chart;
            ctx.save();

            const centerX = (left + right) / 2;
            const centerY = (top + bottom) / 2;

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // 1. 첫 번째 줄: "게시글 수"
            ctx.font = "14px Pretendard, sans-serif"; // 폰트 설정
            ctx.fillStyle = "#666"; // 연한 회색
            ctx.fillText("게시글 수", centerX, centerY - 12); // 위로 12px 이동

            // 2. 두 번째 줄: 실제 숫자 (total)
            ctx.font = "bold 26px Arial, sans-serif"; // 크고 굵게
            ctx.fillStyle = "#000"; // 검은색
            ctx.fillText(total.toLocaleString(), centerX, centerY + 15); // 아래로 15px 이동

            ctx.restore();
        }
    };

    window.donutChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
                borderWidth: 2,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%', // 가운데 구멍 크기 조절 (글자가 잘 보이도록)
            plugins: {
                legend: { position: "right" }
            },
            onClick: async (evt, elements) => {
                if (elements.length > 0) {
                    const dataIndex = elements[0].index;
                    const categoryName = labels[dataIndex];
                    await showSubcategoryTable(categoryName);
                }
            }
        },
        plugins: [centerTextPlugin] // 🔥 [중요] 플러그인 등록
    });
}

// --- 수정된 버블 차트 렌더링 함수 ---
function renderBubbleChart(categories, probabilities) {
    const canvas = document.getElementById("radarChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (window.barChartInstance) window.barChartInstance.destroy();

    // 3. 버블 데이터 생성 (중앙 집중형으로 더 긴밀하게 유도)
    const bubbleData = categories.map((cat, i) => {
        const val = parseFloat(probabilities[i]) || 0;
        return {
            // ✨ 분산도를 기존 * 10에서 * 4 정도로 줄여 (0,0) 주변에 더욱 옹기종기 모이게 만듭니다.
            x: (Math.random() - 0.5) * 4, 
            y: (Math.random() - 0.5) * 4,
            r: Math.max(12, val * 1.8),
            label: cat,
            value: val
        };
    });

    // 4. 힘 기반 레이아웃 적용
    const arrangedBubbles = applyForceLayout(bubbleData);

    // 5. 차트 렌더링
    window.barChartInstance = new Chart(ctx, {
        type: "bubble",
        data: {
            datasets: [{
                data: arrangedBubbles,
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.raw.label}: ${context.raw.value}%`
                    }
                }
            },
            scales: {
                x: {
                    display: false,
                    grid: { display: false },
                    // ✨ 중요: 정중앙(0)을 기준으로 좌우 대칭 범위를 균등하게 좁혀 버블들을 화면 가운데로 모읍니다.
                    min: -12,
                    max: 12
                },
                y: {
                    display: false,
                    grid: { display: false },
                    // ✨ 중요: 위아래 대칭 범위를 균등하게 고정하여 위아래로 길쭉하게 퍼지는 현상을 방지합니다.
                    min: -12,
                    max: 12
                }
            }
        }
    });
}

// ---------------------------------------------------------
// 🔥 [이 부분 필수 추가] 버블 위치 계산 및 충돌 방지 로직
// ---------------------------------------------------------
function applyForceLayout(bubbles, iterations = 150) {
    const padding = 3; // 버블 간 최소 간격
    
    for (let k = 0; k < iterations; k++) {
        // 1. 버블 간 충돌 방지 (서로 밀어냄)
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

        // 2. 중앙 수렴 효과 (중앙 (0,0)으로 모든 버블을 당김)
        bubbles.forEach(b => {
            // ✅ 핵심: 좌표를 0 방향으로 조금씩 이동시킴 (0.95는 수렴 강도)
            b.x *= 0.95; 
            b.y *= 0.95;
        });
    }
    return bubbles;
}
/**
 * 서브카테고리 상세 표 (인증 헤더 추가)
 */
export async function showSubcategoryTable(categoryName) {
    try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch(`/api/files/subcategory-counts?category_name=${encodeURIComponent(categoryName)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("데이터 로드 실패");

        const subData = await response.json();
        const oldWrapper = document.querySelector(".subcategory-wrapper");
        if (oldWrapper) oldWrapper.remove();

        const wrapper = document.createElement("div");
        wrapper.className = "subcategory-wrapper";

        if (!Array.isArray(subData) || subData.length === 0) {
            wrapper.innerHTML = `<h3>${categoryName} 상세</h3><p>데이터가 없습니다.</p>`;
        } else {
            wrapper.innerHTML = `
                <h3>${categoryName} 상세</h3>
                <table id="categoryInfoTable">
                    ${subData.map(item => `
                        <tr>
                            <td>${item.subcategory_name || '미지정'}</td>
                            <td>${item.count}개</td>
                        </tr>`).join('')}
                </table>
            `;
        }
        document.getElementById("chartArea")?.appendChild(wrapper);
    } catch (err) {
        console.error("상세 데이터 로드 실패:", err);
    }
}