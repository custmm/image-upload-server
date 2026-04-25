/**
 * ── [차트 모듈 전체 코드] ──
 */

export async function renderDashboardCharts() {
    try {
        const response = await fetch("/api/files/category-counts");
        const categoryData = await response.json();
        
        const categories = categoryData.map(item => item.category_name);
        const total = categoryData.reduce((acc, val) => acc + Number(val.count), 0);
        const probabilities = categoryData.map(item => ((Number(item.count) / total) * 100).toFixed(2));

        // 1. 차트 생성
        renderDonutChart(categories, probabilities, total);
        renderBubbleChart(categories, probabilities);

        // 2. [추가] 도넛/버블 전환 버튼 이벤트 바인딩
        bindChartSwitchEvents();

    } catch (error) {
        console.error("차트 로드 실패:", error);
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
        };
    }
}

// --- 아래는 기존 도넛/버블 렌더링 함수 유지 ---

function renderDonutChart(labels, data, total) {
    const ctx = document.getElementById("donutChart")?.getContext("2d");
    if (!ctx) return;

    if (window.donutChartInstance) window.donutChartInstance.destroy();

    window.donutChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: async (evt, elements) => {
                if (elements.length > 0) {
                    const dataIndex = elements[0].index;
                    const categoryName = labels[dataIndex];
                    await showSubcategoryTable(categoryName);
                }
            }
        }
    });
}

function renderBubbleChart(categories, probabilities) {
    const ctx = document.getElementById("radarChart")?.getContext("2d");
    if (!ctx) return;

    if (window.barChartInstance) window.barChartInstance.destroy();

    const bubbleData = categories.map((cat, i) => {
        const val = parseFloat(probabilities[i]);
        return {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10,
            r: Math.max(12, val * 1.8),
            label: cat,
            value: val
        };
    });

    const arrangedBubbles = applyForceLayout(bubbleData);

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
            plugins: { legend: { display: false } }
        }
    });
}

export async function showSubcategoryTable(categoryName) {
    const subData = await fetch(`/api/files/subcategory-counts?category_name=${encodeURIComponent(categoryName)}`).then(res => res.json());
    const oldWrapper = document.querySelector(".subcategory-wrapper");
    if (oldWrapper) oldWrapper.remove();

    const wrapper = document.createElement("div");
    wrapper.className = "subcategory-wrapper";
    wrapper.innerHTML = `
        <h3>${categoryName} 상세</h3>
        <table id="categoryInfoTable">
            ${subData.map(item => `<tr><td>${item.subcategory_name}</td><td>${item.count}개</td></tr>`).join('')}
        </table>
    `;
    document.getElementById("chartArea")?.appendChild(wrapper);
}

function applyForceLayout(bubbles, iterations = 120) {
    const padding = 2;
    for (let k = 0; k < iterations; k++) {
        for (let i = 0; i < bubbles.length; i++) {
            for (let j = i + 1; j < bubbles.length; j++) {
                const a = bubbles[i]; const b = bubbles[j];
                const dx = b.x - a.x; const dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                const minDist = a.r + b.r + padding;
                if (dist < minDist) {
                    const force = (minDist - dist) / dist * 0.5;
                    b.x += dx * force; b.y += dy * force;
                    a.x -= dx * force; a.y -= dy * force;
                }
            }
        }
    }
    return bubbles;
}