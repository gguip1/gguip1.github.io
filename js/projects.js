async function loadData() {
    try {
        const [projectsResponse, skillsResponse] = await Promise.all([
            fetch('../data/projects.json'),
            fetch('../data/skills.json')
        ]);
        
        const projectsData = await projectsResponse.json();
        const skillsData = await skillsResponse.json();
        
        renderSkills(skillsData, projectsData.projects);
        renderProjects(projectsData.projects);
    } catch (error) {
        console.error('데이터를 불러오는데 실패했습니다:', error);
    }
}

function renderSkills(skills, projects) {
    const skillsContainer = document.querySelector('.skills-container');
    skillsContainer.innerHTML = Object.entries(skills).map(([category, data]) => `
        <div class="skill-category-card">
            <h3>${category}</h3>
            <div class="skill-tags">
                ${data.tags.map(tag => `
                    <div class="skill-tag-container">
                        <span class="skill-tag" data-skill="${tag}">${tag}</span>
                        <div class="skill-popup">
                            <div class="popup-title">관련 프로젝트</div>
                            <div class="popup-content" data-skill="${tag}"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    // 스킬 태그에 프로젝트 연결
    document.querySelectorAll('.skill-tag').forEach(tag => {
        const skill = tag.dataset.skill;
        const relatedProjects = projects.filter(p => p.tags.includes(skill));
        const popup = tag.parentElement.querySelector('.popup-content');
        
        if (relatedProjects.length > 0) {
            popup.innerHTML = relatedProjects.map(project => `
                <div class="popup-project" onclick="scrollToProject('${project.title}')">
                    <div class="popup-project-title">${project.title}</div>
                    <div class="popup-project-subtitle">${project.subtitle}</div>
                </div>
            `).join('');
        } else {
            popup.innerHTML = '<div class="no-projects">관련 프로젝트가 없습니다</div>';
        }
    });
}

function renderProjects(projects) {
    const projectList = document.querySelector('.project-list');
    projectList.innerHTML = projects.map(project => `
        <article class="project-card">
            <div class="project-header">
                <h3>${project.title}</h3>
                <div class="project-meta">
                    <span class="meta-item">
                        <i class="far fa-calendar-alt"></i>
                        ${project.period}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-users"></i>
                        ${project.teamSize}명
                    </span>
                </div>
            </div>
            <div class="project-subtitle">${project.subtitle}</div>

            <div class="project-roles">
                ${project.roles.map(role => `
                    <span class="role-badge">${role}</span>
                `).join('')}
            </div>

            <div class="project-tags">
                ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>

            <div class="project-description">
                <p>${project.description}</p>
            </div>

            <div class="project-highlights">
                <ul>
                    ${project.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
                </ul>
            </div>

            <div class="project-links">
                ${project.links.map(link => `
                    <a href="${link.url}" class="github-link" target="_blank">
                        ${link.label}
                    </a>
                `).join('')}
            </div>
        </article>
    `).join('');
    
    // 프로젝트 렌더링 후 슬라이더 초기화
    initSlider(projects);
}

let currentSlide = 0; // 전역 변수로 현재 슬라이드 위치 관리

function scrollToProject(title) {
    const projectCards = document.querySelectorAll('.project-card');
    const projectIndex = Array.from(projectCards).findIndex(
        card => card.querySelector('h3').textContent === title
    );

    if (projectIndex !== -1) {
        currentSlide = projectIndex;
        updateSlider();
        
        // 해당 프로젝트 섹션으로 스크롤
        const projectSection = document.getElementById('projects');
        projectSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
        });
        
        // 하이라이트 효과
        projectCards.forEach(card => card.classList.remove('highlight'));
        projectCards[projectIndex].classList.add('highlight');
        setTimeout(() => projectCards[projectIndex].classList.remove('highlight'), 2000);
        
        // 모바일 환경에서 팝업 닫기
        if (window.innerWidth <= 768) {
            const popup = document.querySelector('.skill-popup[style*="display: block"]');
            const overlay = document.querySelector('.popup-overlay.active');
            if (popup) popup.style.display = 'none';
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
}

function initSlider(projects) {
    const totalSlides = projects.length;
    const projectList = document.querySelector('.project-list');
    const prevButton = document.querySelector('.slider-button.prev');
    const nextButton = document.querySelector('.slider-button.next');
    const indicators = document.querySelector('.project-indicators');
    
    // 인디케이터 생성
    indicators.innerHTML = projects.map((_, index) => `
        <span class="indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
    `).join('');

    function updateSlider() {
        // 슬라이드 이동
        projectList.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // 현재 카드 활성화
        document.querySelectorAll('.project-card').forEach((card, index) => {
            card.classList.toggle('active', index === currentSlide);
        });
        
        // 버튼 상태 업데이트
        prevButton.disabled = currentSlide === 0;
        nextButton.disabled = currentSlide === totalSlides - 1;
        
        // 인디케이터 업데이트
        document.querySelectorAll('.indicator').forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });

        // 현재 프로젝트의 이미지 업데이트
        const currentProject = projects[currentSlide];
        updateProjectPreview(currentProject);
    }

    // 이벤트 리스너
    prevButton.addEventListener('click', () => {
        if (currentSlide > 0) {
            currentSlide--;
            updateSlider();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentSlide < totalSlides - 1) {
            currentSlide++;
            updateSlider();
        }
    });

    // 인디케이터 클릭 이벤트
    indicators.addEventListener('click', (e) => {
        if (e.target.classList.contains('indicator')) {
            currentSlide = parseInt(e.target.dataset.index);
            updateSlider();
        }
    });

    // 키보드 네비게이션
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && currentSlide > 0) {
            currentSlide--;
            updateSlider();
        } else if (e.key === 'ArrowRight' && currentSlide < totalSlides - 1) {
            currentSlide++;
            updateSlider();
        }
    });

    // 초기 상태 설정
    updateSlider();

    // 전역 함수로 만들어 다른 곳에서도 접근 가능하게 함
    window.updateSlider = updateSlider;
}

function updateProjectPreview(project) {
    const previewImage = document.querySelector('.preview-image');
    const previewThumbnails = document.querySelector('.preview-thumbnails');
    
    if (project.images && project.images.length > 0) {
        // 메인 이미지 업데이트
        previewImage.innerHTML = `<img src="${project.images[0]}" alt="${project.title}">`;
        
        // 썸네일 업데이트
        previewThumbnails.innerHTML = project.images.map((img, index) => `
            <div class="preview-thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                <img src="${img}" alt="${project.title} thumbnail ${index + 1}">
            </div>
        `).join('');

        // 썸네일 클릭 이벤트
        previewThumbnails.querySelectorAll('.preview-thumbnail').forEach(thumb => {
            thumb.addEventListener('click', () => {
                const imgSrc = project.images[thumb.dataset.index];
                previewImage.querySelector('img').src = imgSrc;
                
                // 활성화된 썸네일 표시
                previewThumbnails.querySelectorAll('.preview-thumbnail').forEach(t => 
                    t.classList.toggle('active', t === thumb));
            });
        });
    }
}

// 인터섹션 옵저버 설정 추가
function setupPreviewVisibility() {
    const projectSection = document.getElementById('projects');
    const previewElement = document.querySelector('.project-preview');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                previewElement.style.visibility = 'visible';
                previewElement.style.opacity = '1';
            } else {
                previewElement.style.visibility = 'hidden';
                previewElement.style.opacity = '0';
            }
        });
    }, {
        // 프로젝트 섹션이 절반 이상 보일 때 활성화
        threshold: 0.5
    });

    observer.observe(projectSection);
}

function setupPreviewToggle() {
    const toggleBtn = document.getElementById('togglePreview');
    const previewElement = document.querySelector('.project-preview');
    let isVisible = true; // 초기값을 true로 변경

    // 초기 상태 설정
    toggleBtn.classList.add('active'); // 버튼 활성화 상태로 시작
    const toggleText = toggleBtn.querySelector('.toggle-text');
    toggleText.textContent = '이미지 숨기기'; // 초기 텍스트 설정
    
    toggleBtn.addEventListener('click', () => {
        isVisible = !isVisible;
        previewElement.classList.toggle('hidden');
        toggleBtn.classList.toggle('active');
        
        // 버튼 텍스트 변경
        toggleText.textContent = isVisible ? '이미지 숨기기' : '이미지 보기';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupPreviewVisibility();
    setupPreviewToggle(); // 토글 기능 초기화 추가
});
