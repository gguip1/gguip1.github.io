document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const menuPanel = document.getElementById('menuPanel');

    // 메뉴 토글 기능
    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        menuPanel.classList.toggle('show');
    });

    // 메뉴 외부 클릭시 닫기
    document.addEventListener('click', (e) => {
        if (!menuBtn.contains(e.target) && !menuPanel.contains(e.target)) {
            menuBtn.classList.remove('active');
            menuPanel.classList.remove('show');
        }
    });
});
