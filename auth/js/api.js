// 프로덕션 보안 주의사항:
// - localStorage는 XSS에 취약. httpOnly 쿠키 사용 권장
// - HTTPS 필수, CSP 헤더 설정
// - JWT secret은 서버에서만 관리

class ApiClient {
    constructor() {
        // MOCK 모드 토글 - 개발 시 true, 프로덕션 시 false
        this.MOCK = false; // 실제 백엔드 API 사용
        this.DEBUG = false; // 디버그 모드 토글 - 개발 시 true, 프로덕션 시 false
        this.baseURL = 'https://api-gguip1-github-io-833999348511.asia-northeast3.run.app'; // 실제 API URL로 변경
        this.token = this.getToken();
    }

    // 디버그 로깅 메서드
    debug(message, data = null) {
        if (this.DEBUG) {
            if (data !== null) {
                console.log(`[API Debug] ${message}`, data);
            } else {
                console.log(`[API Debug] ${message}`);
            }
        }
    }

    debugError(message, error = null) {
        if (this.DEBUG) {
            if (error !== null) {
                console.error(`[API Error] ${message}`, error);
            } else {
                console.error(`[API Error] ${message}`);
            }
        }
    }

    debugWarn(message, data = null) {
        if (this.DEBUG) {
            if (data !== null) {
                console.warn(`[API Warning] ${message}`, data);
            } else {
                console.warn(`[API Warning] ${message}`);
            }
        }
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

            // Content-Type 확인
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                this.debugError('Non-JSON response:', text);
                throw new Error(`서버에서 JSON이 아닌 응답을 받았습니다. Status: ${response.status}`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            this.debugError('API Request failed:', error);

            // JSON 파싱 오류인 경우 더 명확한 메시지
            if (error.message.includes('Unexpected token')) {
                throw new Error('서버 연결 오류: API 서버가 실행 중인지 확인해주세요.');
            }

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
            case 'POST /accounts/login':
                if (data.email === 'test@example.com' && data.password === 'password123') {
                    const mockToken = this.generateMockJWT(data.email);
                    return { token: mockToken, user: { email: data.email, name: '테스트 사용자' } };
                } else {
                    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
                }

            case 'POST /accounts/register':
                if (data.email === 'existing@example.com') {
                    throw new Error('이미 존재하는 이메일입니다.');
                }
                const regToken = this.generateMockJWT(data.email);
                return { token: regToken, user: { email: data.email, name: '새 사용자' } };

            case 'POST /accounts/forgot':
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

            // 큰 배열에 대한 안전한 처리
            let binaryString = '';
            for (let i = 0; i < utf8Bytes.length; i++) {
                binaryString += String.fromCharCode(utf8Bytes[i]);
            }

            const base64 = btoa(binaryString);
            // Base64 URL-safe 변환
            return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        } catch (error) {
            this.debugError('Base64 encoding error:', error);

            // 폴백 1: 간단한 UTF-8 인코딩
            try {
                const base64 = btoa(unescape(encodeURIComponent(str)));
                return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            } catch (fallbackError) {
                this.debugError('Fallback encoding error:', fallbackError);

                // 폴백 2: ASCII만 사용
                const asciiOnly = str.replace(/[^\x00-\x7F]/g, "");
                return btoa(asciiOnly).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            }
        }
    }

    // JWT 디코딩
    decodeJwt(token) {
        try {
            if (!token) {
                throw new Error('토큰이 없습니다');
            }

            const parts = token.split('.');
            if (parts.length !== 3) throw new Error('Invalid token format');

            // Base64 URL-safe 디코딩
            let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) {
                base64 += '=';
            }

            // 안전한 디코딩 (여러 방법 시도)
            try {
                // 방법 1: UTF-8 안전한 디코딩
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const utf8String = new TextDecoder().decode(bytes);
                return JSON.parse(utf8String);
            } catch (utf8Error) {
                this.debugWarn('UTF-8 디코딩 실패, 폴백 시도:', utf8Error);

                try {
                    // 방법 2: 간단한 디코딩
                    const decoded = atob(base64);
                    return JSON.parse(decodeURIComponent(escape(decoded)));
                } catch (fallbackError) {
                    this.debugWarn('폴백 디코딩 실패, 직접 파싱 시도:', fallbackError);

                    // 방법 3: 직접 파싱
                    const decoded = atob(base64);
                    return JSON.parse(decoded);
                }
            }
        } catch (error) {
            this.debugError('JWT decode error:', error);
            this.debugError('Token:', token);
            throw new Error('토큰 디코딩 실패');
        }
    }

    // API 메서드들
    async login(email, password) {
        const response = await this.request('/accounts/login/', {
            method: 'POST',
            body: { email, password }
        });

        this.debug('Login response:', response);

        // 다양한 토큰 필드명 확인
        const token = response.token || response.access || response.access_token || response.accessToken;

        if (token) {
            this.saveToken(token);
            this.debug('Token saved:', token);
        } else {
            this.debugError('No token found in response:', response);
            throw new Error('서버에서 토큰을 받지 못했습니다.');
        }

        return response;
    }

    async register(email, userName, password, password2) {
        const response = await this.request('/accounts/register/', {
            method: 'POST',
            body: {
                username: userName,
                email,
                password,
                password2
            }
        });

        this.debug('Register response:', response);

        // 회원가입은 토큰을 반환하지 않음 - 별도 로그인 필요
        // 일반적으로 201 Created 상태코드와 함께 성공 메시지 반환
        return {
            ...response,
            message: response.message || '회원가입이 성공적으로 완료되었습니다.'
        };
    }

    async forgotPassword(email) {
        return await this.request('/accounts/forgot/', {
            method: 'POST',
            body: { email }
        });
    }

    async getCurrentUser() {
        return await this.request('/accounts/me/', {
            method: 'GET'
        });
    }

    logout() {
        this.clearToken();
    }
}

// 전역 인스턴스
window.apiClient = new ApiClient();
