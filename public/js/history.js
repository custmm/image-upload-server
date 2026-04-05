document.addEventListener('DOMContentLoaded', () => {
    const toggleButtons = document.querySelectorAll('.detail-toggle');

    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const content = button.nextElementSibling; // 버튼 바로 뒤의 .detail-content 선택

            // 활성화 상태 토글
            content.classList.toggle('active');

            // 버튼 모양 변경 (선택 사항)
            if (content.classList.contains('active')) {
                button.textContent = '△';
            } else {
                button.textContent = '▽';
            }
        });
    });
});