document.querySelectorAll(".detail-toggle").forEach(button => {
    button.addEventListener("click", () => {

        // 바로 옆 요소 가져오기 (제일 안정적)
        const detail = button.nextElementSibling;

        if (!detail || !detail.classList.contains("detail-content")) return;

        detail.classList.toggle("active");
    });
});