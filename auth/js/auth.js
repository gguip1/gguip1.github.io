class AuthManager {
    constructor() {
        this.currentTab = 'login';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initDarkMode();
    }

    setupEventListeners() {
        // 탭 전환
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 폼 제출
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // document.getElementById('forgotForm').addEventListener('submit', (e) => {
        //     e.preventDefault();
        //     this.handleForgotPassword();
        // });

        // 로그아웃
        document.getElementById('logoutBtn').addEventListener('click', () => {
            window.authGuard.logout();
        });

        // 다크모드 토글
        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });

        // 실시간 유효성 검사
        this.setupValidation();

        // 키보드 이벤트 (Enter로 제출)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
                const form = e.target.closest('form');
                if (form && !form.classList.contains('hidden')) {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });
    }

    // 탭 전환
    switchTab(tabName) {
        // 탭 버튼 스타일 업데이트
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.className = 'tab-btn flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 text-blue-600 bg-white dark:bg-gray-600 dark:text-blue-400 shadow-sm';
            } else {
                btn.className = 'tab-btn flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white';
            }
        });

        // 폼 표시/숨김
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        const targetForm = document.getElementById(`${tabName}Form`);
        if (targetForm) {
            targetForm.classList.remove('hidden');
            // 첫 번째 입력 필드에 포커스
            const firstInput = targetForm.querySelector('input');
            if (firstInput) firstInput.focus();
        }

        this.currentTab = tabName;
        this.clearErrors();
    }

    // 실시간 유효성 검사 설정
    setupValidation() {
        // 이메일 검사
        document.querySelectorAll('input[type="email"]').forEach(input => {
            input.addEventListener('blur', () => this.validateEmail(input));
        });

        document.querySelectorAll('input[type="text"]').forEach(input => {
            input.addEventListener('blur', () => this.validateUserName(input));
        });

        // 비밀번호 검사
        document.querySelectorAll('input[type="password"]').forEach(input => {
            input.addEventListener('blur', () => this.validatePassword(input));
        });

        // 비밀번호 확인 검사
        const confirmPassword = document.getElementById('confirmPassword');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', () => this.validatePasswordMatch());
        }
    }

    // 이메일 유효성 검사
    validateEmail(input) {
        const email = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            this.showFieldError(input, '이메일을 입력해주세요.');
            return false;
        }

        if (!emailRegex.test(email)) {
            this.showFieldError(input, '올바른 이메일 형식이 아닙니다.');
            return false;
        }

        this.clearFieldError(input);
        return true;
    }

    validateUserName(input) {
        const userName = input.value.trim();

        if (!userName) {
            this.showFieldError(input, '사용자명을 입력해주세요.');
            return false;
        }

        this.clearFieldError(input);
        return true;
    }

    // 비밀번호 유효성 검사
    validatePassword(input) {
        const password = input.value;

        if (!password) {
            this.showFieldError(input, '비밀번호를 입력해주세요.');
            return false;
        }

        if (password.length < 8) {
            this.showFieldError(input, '비밀번호는 8자 이상이어야 합니다.');
            return false;
        }

        if (!/(?=.*[0-9])(?=.*[a-zA-Z])/.test(password)) {
            this.showFieldError(input, '비밀번호는 숫자와 문자를 포함해야 합니다.');
            return false;
        }

        this.clearFieldError(input);
        return true;
    }

    // 비밀번호 확인 검사
    validatePasswordMatch() {
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword');

        if (confirmPassword.value && password !== confirmPassword.value) {
            this.showFieldError(confirmPassword, '비밀번호가 일치하지 않습니다.');
            return false;
        }

        this.clearFieldError(confirmPassword);
        return true;
    }

    // 필드 에러 표시
    showFieldError(input, message) {
        const errorElement = input.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
        input.classList.add('border-red-500', 'focus:ring-red-500');
        input.classList.remove('border-gray-300', 'focus:ring-blue-500');
    }

    // 필드 에러 제거
    clearFieldError(input) {
        const errorElement = input.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
        input.classList.remove('border-red-500', 'focus:ring-red-500');
        input.classList.add('border-gray-300', 'focus:ring-blue-500');
    }

    // 모든 에러 제거
    clearErrors() {
        document.querySelectorAll('.error-message').forEach(error => {
            error.classList.add('hidden');
        });
        document.querySelectorAll('input').forEach(input => {
            this.clearFieldError(input);
        });
    }

    // 버튼 로딩 상태
    setButtonLoading(button, loading) {
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');

        if (loading) {
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
            button.disabled = true;
        } else {
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
            button.disabled = false;
        }
    }

    // 로그인 처리
    async handleLogin() {
        const form = document.getElementById('loginForm');
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        const submitBtn = form.querySelector('button[type="submit"]');

        // 유효성 검사
        const isEmailValid = this.validateEmail(emailInput);
        const isPasswordValid = this.validatePassword(passwordInput);

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        this.setButtonLoading(submitBtn, true);

        try {
            const response = await window.apiClient.login(
                emailInput.value.trim(),
                passwordInput.value
            );

            await window.authGuard.onLoginSuccess(response.user);
            form.reset();
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    // 회원가입 처리
    async handleRegister() {
        const form = document.getElementById('registerForm');
        const emailInput = document.getElementById('registerEmail');
        const userNameInput = document.getElementById('userName');
        const passwordInput = document.getElementById('registerPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const submitBtn = form.querySelector('button[type="submit"]');

        // 유효성 검사
        const isEmailValid = this.validateEmail(emailInput);
        const isUserNameValid = this.validateUserName(userNameInput);
        const isPasswordValid = this.validatePassword(passwordInput);
        const isPasswordMatch = this.validatePasswordMatch();

        if (!isEmailValid || !isUserNameValid || !isPasswordValid || !isPasswordMatch) {
            return;
        }

        this.setButtonLoading(submitBtn, true);

        try {
            const response = await window.apiClient.register(
                emailInput.value.trim(),
                userNameInput.value.trim(),
                passwordInput.value,
                confirmPasswordInput.value
            );

            // 백엔드에서 온 메시지 사용 또는 기본 메시지
            const successMessage = response.message || '회원가입이 완료되었습니다! 로그인해주세요.';
            this.showToast(successMessage, 'success');

            // 회원가입 후 로그인 탭으로 전환
            this.switchTab('login');

            // 가입한 이메일을 로그인 폼에 미리 입력
            const loginEmailInput = document.getElementById('loginEmail');
            if (loginEmailInput) {
                loginEmailInput.value = emailInput.value.trim();
            }

            form.reset();
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    // // 비밀번호 재설정 처리
    // async handleForgotPassword() {
    //     const form = document.getElementById('forgotForm');
    //     const emailInput = document.getElementById('forgotEmail');
    //     const submitBtn = form.querySelector('button[type="submit"]');

    //     // 유효성 검사
    //     if (!this.validateEmail(emailInput)) {
    //         return;
    //     }

    //     this.setButtonLoading(submitBtn, true);

    //     try {
    //         const response = await window.apiClient.forgotPassword(emailInput.value.trim());
    //         this.showToast(response.message, 'success');
    //         form.reset();
    //     } catch (error) {
    //         this.showToast(error.message, 'error');
    //     } finally {
    //         this.setButtonLoading(submitBtn, false);
    //     }
    // }

    // 다크모드 초기화
    initDarkMode() {
        const isDark = localStorage.getItem('darkMode') === 'true' ||
            (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDark) {
            document.documentElement.classList.add('dark');
        }
    }

    // 다크모드 토글
    toggleDarkMode() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', isDark);
    }

    // 토스트 표시
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');

        const typeStyles = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-black',
            info: 'bg-blue-500 text-white'
        };

        toast.className = `px-4 py-3 rounded-lg shadow-lg ${typeStyles[type]} animate-fade-in`;
        toast.textContent = message;

        container.appendChild(toast);

        // 5초 후 자동 제거
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => container.removeChild(toast), 300);
        }, 5000);

        // 클릭 시 즉시 제거
        toast.addEventListener('click', () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => container.removeChild(toast), 300);
        });
    }
}

// 전역 함수로 토스트 노출
window.showToast = (message, type) => {
    if (window.authManager) {
        window.authManager.showToast(message, type);
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
