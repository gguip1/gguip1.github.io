// document.addEventListener('DOMContentLoaded', () => {
//     const sections = document.querySelectorAll('section');

//     const observerOptions = {
//         root: null,
//         rootMargin: '0px',
//         threshold: 0.1
//     };

//     const observer = new IntersectionObserver((entries, observer) => {
//         entries.forEach(entry => {
//             if (entry.isIntersecting) {
//                 entry.target.style.opacity = '1';
//                 entry.target.style.transform = 'translateY(0)';
//             }
//         });
//     }, observerOptions);

//     sections.forEach(section => {
//         section.style.opacity = '0';
//         section.style.transform = 'translateY(20px)';
//         section.style.transition = 'all 0.5s ease-in-out';
//         observer.observe(section);
//     });
// });
