export async function renderDashboardCharts() {
    const categoryData = await fetch("/api/files/category-counts").then(res => res.json());
    const categories = categoryData.map(item => item.category_name);
    const counts = categoryData.map(item => Number(item.count));
    const total = counts.reduce((acc, val) => acc + val, 0);
    const probabilities = counts.map(count => ((count / total) * 100).toFixed(2));

    renderDonutChart(categories, probabilities, total);
    renderBubbleChart(categories, probabilities);
}

function renderDonutChart(labels, data, total) {
    const ctx = document.getElementById("donutChart").getContext("2d");
    // 기존 Chart 생성 로직 (onClick 이벤트 및 서브카테고리 테이블 호출 포함)
}

export async function showSubcategoryTable(categoryName) {
    const subData = await fetch(`/api/files/subcategory-counts?category_name=${encodeURIComponent(categoryName)}`).then(res => res.json());
    // 테이블 생성 및 DOM 삽입 로직
}