/**
 * ── [차트 모듈 전체 코드] ──
 */

// 1. 메인 데이터 로드 및 차트 초기화 함수
export async function renderDashboardCharts() {
    try {
        const response = await fetch("/api/files/category-counts");
        if (!response.ok) throw new Error("차트 데이터 로드 실패");
        
        const categoryData = await response.json();
        
        const categories = categoryData.map(item => item.category_name);
        const counts = categoryData.map(item => Number(item.count));
        const total = counts.reduce((acc, val) => acc + val, 0);
        const probabilities = counts.map(count => ((count / total) * 100).toFixed(2));

        // 차트 생성 함수 호출
        renderDonutChart(categories, probabilities, total);
        renderBubbleChart(categories, probabilities);

    } catch (error) {
        console.error("대시보드 차트 렌더링 중 오류:", error);
    }
}

// 2. 도넛 차트 (세부 클릭 이벤트 포함)
function renderDonutChart(labels, data, total) {
    const canvas = document.getElementById("donutChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (window.donutChartInstance) window.donutChartInstance.destroy();

    // 중앙 텍스트 플러그인
    const centerTextPlugin = {
        id: "centerText",
        afterDraw(chart) {
            const { ctx } = chart;
            ctx.save();
            const centerX = chart.getDatasetMeta(0).data[0].x;
            const centerY = chart.getDatasetMeta(0).data[0].y;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "14px Arial";
            ctx.fillStyle = "#666";
            ctx.fillText("총 게시물", centerX, centerY - 15);
            ctx.font = "bold 24px Arial";
            ctx.fillStyle = "#000";
            ctx.fillText(total, centerX, centerY + 15);
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
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "right" }
            },
            onClick: async (evt, elements) => {
                if (elements.length > 0) {
                    const dataIndex = elements[0].index;
                    const categoryName = labels[dataIndex];
                    // 클릭 시 상세 테이블 호출
                    await showSubcategoryTable(categoryName);
                }
            }
        },
        plugins: [centerTextPlugin]
    });
}

// 3. 버블 차트 (분산 레이아웃 적용)
function renderBubbleChart(categories, probabilities) {
    const canvas = document.getElementById("radarChart"); // HTML상 ID가 radarChart인 경우
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (window.barChartInstance) window.barChartInstance.destroy();

    // 초기 버블 데이터 생성
    const bubbleData = categories.map((cat, i) => {
        const val = parseFloat(probabilities[i]);
        return {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10,
            r: Math.max(12, val * 1.8), // 비율에 따른 크기
            label: cat,
            value: val
        };
    });

    // 겹침 방지 알고리즘 실행
    const arrangedBubbles = applyForceLayout(bubbleData);

    window.barChartInstance = new Chart(ctx, {
        type: "bubble",
        data: {
            datasets: [{
                label: "게시물 비율",
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
                        label: (ctx) => `${ctx.raw.label}: ${ctx.raw.value}%`
                    }
                }
            },
            scales: { x: { display: false }, y: { display: false } }
        }
    });
}

// 4. 서브카테고리 상세 테이블 표시
export async function showSubcategoryTable(categoryName) {
    try {
        const subData = await fetch(`/api/files/subcategory-counts?category_name=${encodeURIComponent(categoryName)}`)
                        .then(res => res.json());

        // 기존 테이블 제거
        const oldWrapper = document.querySelector(".subcategory-wrapper");
        if (oldWrapper) oldWrapper.remove();

        // 새 테이블 구조 생성
        const wrapper = document.createElement("div");
        wrapper.className = "subcategory-wrapper";
        wrapper.innerHTML = `
            <h3>${categoryName} 상세 정보</h3>
            <table id="categoryInfoTable">
                <thead>
                    <tr><th>서브카테고리</th><th>게시물 수</th></tr>
                </thead>
                <tbody>
                    ${subData.map(item => `
                        <tr>
                            <td>${item.subcategory_name}</td>
                            <td>${item.count}개</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // 차트 영역 근처에 삽입 (chartArea ID를 가진 컨테이너 기준)
        const chartArea = document.getElementById("chartArea");
        if (chartArea) {
            chartArea.appendChild(wrapper);
            chartArea.style.justifyContent = "space-between";
        }

    } catch (error) {
        console.error("서브카테고리 테이블 생성 실패:", error);
    }
}

// 5. 유틸리티: 버블 충돌 방지 알고리즘
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
                    b.x += dx * force;
                    b.y += dy * force;
                    a.x -= dx * force;
                    a.y -= dy * force;
                }
            }
        }
    }
    return bubbles;
}