// 프로덕션 보안 주의사항:
// - localStorage는 XSS에 취약. httpOnly 쿠키 사용 권장
// - HTTPS 필수, CSP 헤더 설정
// - JWT secret은 서버에서만 관리

class ApiClient {
    constructor() {
        // MOCK 모드 토글 - 개발 시 true, 프로덕션 시 false
        this.MOCK = false;
        this.baseURL = 'https://api-gguip1-github-io-833999348511.asia-northeast3.run.app';
        this.token = this.getToken();
        this.refreshing = null; // 중복 refresh 요청 방지
    }

    // JWT 토큰 관리 (access token만 localStorage에 저장)
    saveToken(token) {
        localStorage.setItem('auth_token', token);
        this.token = token;
    }

    getToken() {
        return localStorage.getItem('auth_token');
    }

    clearToken() {
        localStorage.removeItem('auth_token');
        this.token = null;
    }

    // 토큰 갱신
    async refreshToken() {
        // 이미 refresh 요청이 진행 중이면 기다림
        if (this.refreshing) {
            return this.refreshing;
        }

        try {
            this.refreshing = fetch(`${this.baseURL}/accounts/refresh/`, {
                method: 'POST',
                credentials: 'include', // httpOnly 쿠키 전송
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const response = await this.refreshing;

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();

            if (data.access) {
                this.saveToken(data.access);
                return data.access;
            } else {
                throw new Error('No access token in refresh response');
            }
        } catch (error) {
            // refresh 실패 시 로그아웃 처리
            this.clearToken();
            throw error;
        } finally {
            this.refreshing = null;
        }
    }

    // HTTP 요청 헬퍼 (자동 토큰 갱신 포함)
    async request(endpoint, options = {}) {
        if (this.MOCK) {
            return this.mockRequest(endpoint, options);
        }

        return this._requestWithRetry(endpoint, options);
    }

    async _requestWithRetry(endpoint, options = {}, isRetry = false) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            credentials: 'include', // 쿠키 전송
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);

            // 401 에러이고 아직 재시도하지 않았다면 토큰 갱신 후 재시도
            if (response.status === 401 && !isRetry && this.token) {
                try {
                    await this.refreshToken();
                    // 새로운 토큰으로 원래 요청 재시도
                    const updatedConfig = {
                        ...config,
                        headers: {
                            ...config.headers,
                            Authorization: `Bearer ${this.token}`
                        }
                    };
                    return this._requestWithRetry(endpoint, { ...options, headers: updatedConfig.headers }, true);
                } catch (refreshError) {
                    // refresh 실패 시 로그인 페이지로 리다이렉트
                    window.location.href = '/auth/';
                    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
                }
            }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.detail || data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error('네트워크 오류가 발생했습니다.');
            }
            throw error;
        }
    }

    // API 메서드들
    async login(email, password) {
        const response = await this.request('/accounts/login/', {
            method: 'POST',
            body: { email, password }
        });

        if (response.access) {
            this.saveToken(response.access);
        }

        return response;
    }

    async register(email, username, password, password2) {
        const response = await this.request('/accounts/register/', {
            method: 'POST',
            body: { email, username, password, password2 }
        });

        if (response.access) {
            this.saveToken(response.access);
        }

        return response;
    }

    async forgotPassword(email) {
        return await this.request('/auth/forgot', {
            method: 'POST',
            body: { email }
        });
    }

    async getCurrentUser() {
        return await this.request('/accounts/me/');
    }

    async logout() {
        try {
            // 서버에 로그아웃 요청 (refresh 쿠키 제거)
            await this.request('/accounts/logout/', {
                method: 'POST'
            });
        } catch (error) {
            // 로그아웃은 항상 성공으로 처리
            console.warn('Logout API call failed:', error);
        } finally {
            // 로컬 토큰 제거
            this.clearToken();
        }
    }

    // JWT 디코딩
    decodeJwt(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) throw new Error('Invalid token format');

            // Base64 URL-safe 디코딩
            let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) {
                base64 += '=';
            }

            // UTF-8 안전한 디코딩
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const utf8String = new TextDecoder().decode(bytes);

            return JSON.parse(utf8String);
        } catch (error) {
            throw new Error('토큰 디코딩 실패');
        }
    }
}

// 전역 인스턴스
window.apiClient = new ApiClient();
