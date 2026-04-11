// Q&A 질문박스(한 번에 하나씩만)
$(function() {

    // .answer 박스 숨기기
    $(".answer").hide();

    // .question 박스 클릭하면,
    $(".question").click(function() {

        // 다른 열려있는 answer 박스 닫기
        $(".answer").not($(this).next()).slideUp();

        // 다른 question 박스의 아이콘을 원리대로
        $(".qeustion").not(this).children().children('img').removeClass('turn');

        // 현재 클릭한 박스 토글
        $(this).next().slideToggle();
        $(this).children().children('img').toggleClass('turn');
    });
});