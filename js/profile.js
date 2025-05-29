async function loadProfile() {
    try {
        const response = await fetch('../data/profile.json');
        const data = await response.json();
        renderProfile(data);
    } catch (error) {
        console.error('프로필 데이터를 불러오는데 실패했습니다:', error);
    }
}

function renderProfile(data) {
    // 헤더 정보 렌더링
    document.querySelector('h1').textContent = data.header.name;
    document.querySelector('.subtitle').textContent = data.header.title;
    
    // 경력 렌더링
    document.querySelector('.highlight-number').textContent = data.header.experience.years;
    document.querySelector('.label').textContent = data.header.experience.label;
    
    // 연락처 렌더링
    const contactDetails = document.querySelector('.contact-details');
    contactDetails.innerHTML = data.header.contacts.map(contact => `
        <div class="contact-item">
            <span class="contact-icon">
                ${contact.type === 'github' 
                    ? `<img src="./assets/icons/${contact.icon}" alt="GitHub">`
                    : contact.icon}
            </span>
            <a href="${contact.link}">${contact.value}</a>
        </div>
    `).join('');

    // 자기소개 렌더링
    document.querySelector('.profile-description').textContent = data.introduction;
    
    // 학력 렌더링
    const educationSection = document.querySelector('.education-list');
    educationSection.innerHTML = data.education.map(edu => `
        <div class="education-item">
            <div class="education-period">${edu.period}</div>
            <div class="education-details">
                <div class="education-school">${edu.school}</div>
                <div class="education-major">${edu.major}${edu.degree ? ` (${edu.degree})` : ''}</div>
                <div class="education-info">
                    ${edu.gpa ? `<span class="education-gpa">학점: ${edu.gpa}</span>` : ''}
                    ${edu.achievement ? `<span class="education-achievement">${edu.achievement}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    // 자격증 렌더링
    const certSection = document.querySelector('.certification-list');
    certSection.innerHTML = data.certifications.map(cert => `
        <div class="cert-item">
            <div class="cert-title">${cert.title}</div>
            <div class="cert-info">
                <span class="cert-organization">${cert.organization}</span>
                <span class="cert-date">${cert.date}</span>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', loadProfile);
