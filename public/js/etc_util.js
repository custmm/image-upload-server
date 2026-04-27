document.querySelectorAll(".detail-toggle").forEach(button => {
    button.addEventListener("click", () => {

        // 바로 옆 요소 가져오기 (제일 안정적)
        const detail = button.nextElementSibling;

        if (!detail || !detail.classList.contains("detail-content")) return;

        detail.classList.toggle("active");
    });
});

document.querySelectorAll('a[href="#mini_mp3"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault(); // 기본 이동 막기
        
        const targetTable = document.getElementById('mini_mp3');
        targetTable.classList.add('active'); // 표 나타내기
        
        // 해당 위치로 부드럽게 이동
        targetTable.scrollIntoView({ behavior: 'smooth' });
    });
});