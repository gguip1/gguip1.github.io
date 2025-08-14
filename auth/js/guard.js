class AuthGuard {
    constructor() {
        this.user = null;
        this.tokenExpiry = null;
        this.expiryTimer = null;
        this.warningShown = false;
    }

    // 인증 상태 초기화
    init() {
        this.checkAuthState();
        this.setupExpiryTimer();
    }

    // 현재 인증 상태 확인
    checkAuthState() {
        const token = window.apiClient.getToken();

        if (!token) {
            this.showAuthForms();
            return false;
        }

        try {
            const payload = window.apiClient.decodeJwt(token);

            // 토큰 만료 체크
            if (this.isTokenExpired(payload.exp)) {
                window.apiClient.clearToken();
                this.showToast('세션이 만료되었습니다. 다시 로그인해주세요.', 'warning');
                this.showAuthForms();
                return false;
            }

            this.user = { email: payload.email, name: payload.name };
            this.tokenExpiry = payload.exp;
            this.showUserInfo();
            return true;
        } catch (error) {
            window.apiClient.clearToken();
            this.showToast('유효하지 않은 토큰입니다.', 'error');
            this.showAuthForms();
            return false;
        }
    }

    // 토큰 만료 체크
    isTokenExpired(exp) {
        return Date.now() >= exp * 1000;
    }

    // 토큰 만료까지 남은 시간 계산
    getTimeLeft(exp) {
        const now = Date.now();
        const expiry = exp * 1000;
        const diff = expiry - now;

        if (diff <= 0) return null;

        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}일 ${hours % 24}시간`;
        if (hours > 0) return `${hours}시간 ${minutes % 60}분`;
        return `${minutes}분`;
    }

    // 만료 임박 경고 (5분 미만)
    isExpiryWarning(exp) {
        const diff = (exp * 1000) - Date.now();
        return diff < (5 * 60 * 1000) && diff > 0; // 5분 미만
    }

    // 만료 타이머 설정
    setupExpiryTimer() {
        if (this.expiryTimer) {
            clearInterval(this.expiryTimer);
        }

        if (!this.tokenExpiry) return;

        this.expiryTimer = setInterval(() => {
            if (this.isTokenExpired(this.tokenExpiry)) {
                this.logout();
                return;
            }

            this.updateExpiryDisplay();

            // 만료 임박 경고
            if (this.isExpiryWarning(this.tokenExpiry) && !this.warningShown) {
                this.showToast('토큰이 곧 만료됩니다. 다시 로그인해주세요.', 'warning');
                this.warningShown = true;
            }
        }, 1000);
    }

    // 만료 시간 표시 업데이트
    updateExpiryDisplay() {
        const element = document.getElementById('tokenExpiry');
        if (!element || !this.tokenExpiry) return;

        const timeLeft = this.getTimeLeft(this.tokenExpiry);
        if (timeLeft) {
            element.textContent = timeLeft;

            // 만료 임박 시 스타일 변경
            if (this.isExpiryWarning(this.tokenExpiry)) {
                element.className = 'text-lg font-semibold text-red-600 dark:text-red-400';
            }
        } else {
            element.textContent = '만료됨';
            element.className = 'text-lg font-semibold text-red-600 dark:text-red-400';
        }
    }

    // 사용자 정보 표시
    showUserInfo() {
        document.getElementById('authForms').classList.add('hidden');
        document.getElementById('userInfo').classList.remove('hidden');

        const emailElement = document.getElementById('userEmail');
        if (emailElement && this.user) {
            emailElement.textContent = this.user.email;
        }

        this.updateExpiryDisplay();
    }

    // 인증 폼 표시
    showAuthForms() {
        document.getElementById('userInfo').classList.add('hidden');
        document.getElementById('authForms').classList.remove('hidden');

        this.user = null;
        this.tokenExpiry = null;
        this.warningShown = false;

        if (this.expiryTimer) {
            clearInterval(this.expiryTimer);
            this.expiryTimer = null;
        }
    }

    // 로그인 성공 처리
    onLoginSuccess(userData) {
        try {
            const token = window.apiClient.getToken();
            const payload = window.apiClient.decodeJwt(token);

            this.user = userData;
            this.tokenExpiry = payload.exp;
            this.warningShown = false;

            this.showUserInfo();
            this.setupExpiryTimer();
            this.showToast('로그인되었습니다.', 'success');
        } catch (error) {
            this.showToast('로그인 처리 중 오류가 발생했습니다.', 'error');
        }
    }

    // 로그아웃
    logout() {
        window.apiClient.logout();
        this.showAuthForms();
        this.showToast('로그아웃되었습니다.', 'info');
    }

    // 토스트 표시 (auth.js의 함수 사용)
    showToast(message, type) {
        if (window.showToast) {
            window.showToast(message, type);
        }
    }
}

// 전역 인스턴스
window.authGuard = new AuthGuard();

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.authGuard.init();
});
