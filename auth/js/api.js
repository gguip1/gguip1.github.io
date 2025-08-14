// 프로덕션 보안 주의사항:
// - localStorage는 XSS에 취약. httpOnly 쿠키 사용 권장
// - HTTPS 필수, CSP 헤더 설정
// - JWT secret은 서버에서만 관리

class ApiClient {
    constructor() {
        // MOCK 모드 토글 - 개발 시 true, 프로덕션 시 false
        this.MOCK = true;
        this.baseURL = 'https://api.example.com'; // 실제 API URL로 변경
        this.token = this.getToken();
    }

    // JWT 토큰 관리
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

    // HTTP 요청 헬퍼
    async request(endpoint, options = {}) {
        if (this.MOCK) {
            return this.mockRequest(endpoint, options);
        }

        const url = `${this.baseURL}${endpoint}`;
        const config = {
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
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            throw new Error(error.message || '네트워크 오류가 발생했습니다.');
        }
    }

    // MOCK API 응답
    async mockRequest(endpoint, options = {}) {
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        await delay(800); // 네트워크 지연 시뮬레이션

        const { method = 'GET', body } = options;
        const data = body ? (typeof body === 'string' ? JSON.parse(body) : body) : {};

        switch (`${method} ${endpoint}`) {
            case 'POST /auth/login':
                if (data.email === 'test@example.com' && data.password === 'password123') {
                    const mockToken = this.generateMockJWT(data.email);
                    return { token: mockToken, user: { email: data.email, name: '테스트 사용자' } };
                } else {
                    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
                }

            case 'POST /auth/register':
                if (data.email === 'existing@example.com') {
                    throw new Error('이미 존재하는 이메일입니다.');
                }
                const regToken = this.generateMockJWT(data.email);
                return { token: regToken, user: { email: data.email, name: '새 사용자' } };

            case 'POST /auth/forgot':
                return { message: '비밀번호 재설정 링크를 이메일로 전송했습니다.' };

            case 'GET /users/me':
                if (this.token) {
                    try {
                        const payload = this.decodeJwt(this.token);
                        return { email: payload.email, name: payload.name || '사용자' };
                    } catch {
                        throw new Error('유효하지 않은 토큰입니다.');
                    }
                } else {
                    throw new Error('인증이 필요합니다.');
                }

            default:
                throw new Error('지원하지 않는 엔드포인트입니다.');
        }
    }

    // MOCK JWT 생성 (개발용만)
    generateMockJWT(email) {
        const header = this.base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = this.base64UrlEncode(JSON.stringify({
            email,
            name: '테스트 사용자',
            exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1시간 후 만료
            iat: Math.floor(Date.now() / 1000)
        }));
        const signature = 'mock-signature';
        return `${header}.${payload}.${signature}`;
    }

    // UTF-8 안전한 Base64 인코딩
    base64UrlEncode(str) {
        try {
            // UTF-8 문자를 안전하게 처리
            const utf8Bytes = new TextEncoder().encode(str);
            const base64 = btoa(String.fromCharCode(...utf8Bytes));
            // Base64 URL-safe 변환
            return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        } catch (error) {
            console.error('Base64 encoding error:', error);
            // 폴백: 한글 제거 후 인코딩
            const asciiOnly = str.replace(/[^\x00-\x7F]/g, "");
            return btoa(asciiOnly);
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

    // API 메서드들
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: { email, password }
        });

        if (response.token) {
            this.saveToken(response.token);
        }

        return response;
    }

    async register(email, password) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: { email, password }
        });

        if (response.token) {
            this.saveToken(response.token);
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
        return await this.request('/users/me');
    }

    logout() {
        this.clearToken();
    }
}

// 전역 인스턴스
window.apiClient = new ApiClient();
