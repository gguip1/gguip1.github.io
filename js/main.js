document.addEventListener('DOMContentLoaded', () => {
    // 카드 호버 효과 개선
    const cards = document.querySelectorAll('.nav-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            cards.forEach(c => {
                if (c !== card) c.style.opacity = '0.7';
            });
        });

        card.addEventListener('mouseleave', () => {
            cards.forEach(c => c.style.opacity = '1');
        });
    });
});
