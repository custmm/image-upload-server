document.querySelectorAll(".detail-toggle").forEach(button => {
    button.addEventListener("click", () => {

        // 그냥 바로 다음 요소 잡기
        const detail = button.parentElement.querySelector("#detail-content");

        if (!detail) return; // 안전장치

        const isVisible = detail.style.display === "block";
        detail.style.display = isVisible ? "none" : "block";
    });
});