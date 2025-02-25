async function loadData() {
    try {
        const response = await fetch('../data/projects.json');
        const data = await response.json();
        renderSkills(data.skills, data.projects); // projects 매개변수 추가
        renderProjects(data.projects);
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

    // 스킬 태그에 이벤트 리스너 추가
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
}

// 프로젝트로 스크롤하는 함수 수정
function scrollToProject(title) {
    // 정확한 프로젝트 제목으로 검색하도록 수정
    const projectElement = Array.from(document.querySelectorAll('.project-card h3'))
        .find(element => element.textContent === title);

    if (projectElement) {
        const card = projectElement.closest('.project-card');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 다른 프로젝트의 하이라이트 효과 제거
        document.querySelectorAll('.project-card').forEach(card => {
            card.classList.remove('highlight');
        });
        
        // 선택된 프로젝트 하이라이트
        card.classList.add('highlight');
        setTimeout(() => card.classList.remove('highlight'), 2000);
    }
}

document.addEventListener('DOMContentLoaded', loadData);
