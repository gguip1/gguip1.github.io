class SeasonManager {
    constructor() {
        this.currentSeason = null;
        this.container = document.getElementById('mainContainer');
        this.seasonTitle = document.getElementById('seasonTitle');
        this.seasonDescription = document.getElementById('seasonDescription');
        this.currentSeasonText = document.getElementById('currentSeasonText');
        this.connectionDot = document.getElementById('connectionDot');
        this.connectionText = document.getElementById('connectionText');

        // 애니메이션 관련 속성들
        this.animationContainer = null;
        this.animationIntervals = [];

        // 뷰포트 상태 추적
        this.lastViewportHeight = window.innerHeight;
        this.resizeTimer = null;

        // 연결 상태 추적
        this.connectionCount = 0;

        this.seasonData = {
            spring: {
                title: '봄이 왔어요! 🌸',
                description: '따뜻한 햇살과 함께 새로운 시작을 느껴보세요',
                colors: ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff']
            },
            summer: {
                title: '뜨거운 여름! ☀️',
                description: '활기찬 에너지와 시원한 바람을 만끽하세요',
                colors: ['#ff6b6b', '#ffa726', '#ffeb3b', '#66bb6a', '#42a5f5']
            },
            autumn: {
                title: '가을의 정취 🍂',
                description: '단풍잎이 흩날리는 낭만적인 계절입니다',
                colors: ['#d32f2f', '#f57c00', '#fbc02d', '#689f38', '#1976d2']
            },
            winter: {
                title: '하얀 겨울 ❄️',
                description: '순백의 눈꽃과 함께하는 고요한 시간',
                colors: ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5']
            }
        };

        // 웹소켓 확장을 위한 준비
        this.websocket = null;
        this.isConnected = false;

        this.init();
    }

    init() {
        this.setupMobileOptimization();
        this.setupEventListeners();
        this.setupResizeHandler();
        this.createAnimationContainer();
        this.setupIndicatorPositioning();

        // 초기 상태는 연결 끊김
        this.updateConnectionStatus(false, 0);

        // 웹소켓 연결 시도
        this.connectWebSocket();
    }

    setupMobileOptimization() {
        // 모바일에서 주소창 숨김을 위한 높이 조정
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                setVH();
                this.adjustIndicatorPosition();
            }, 100);
        });
    }

    setupIndicatorPositioning() {
        // 스크롤 이벤트로 브라우저 UI 변화 감지
        let scrollTimer = null;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                this.adjustIndicatorPosition();
            }, 50);
        });

        // Visual Viewport API 지원 브라우저에서 사용
        if ('visualViewport' in window) {
            window.visualViewport.addEventListener('resize', () => {
                this.adjustIndicatorPosition();
            });
        }
    }

    adjustIndicatorPosition() {
        const currentViewportHeight = window.innerHeight;
        const isLandscape = window.innerWidth > window.innerHeight;
        const isMobile = window.innerWidth <= 768;
        
        // 브라우저 UI 변화 감지 개선
        const uiState = this.detectMobileUIState();
        
        if (isMobile) {
            this.updateMobileIndicatorPosition(uiState, isLandscape);
        }

        // 이전 높이 업데이트
        this.lastViewportHeight = currentViewportHeight;
    }

    detectMobileUIState() {
        const viewportHeight = window.innerHeight;
        const screenHeight = window.screen.height;
        const documentHeight = document.documentElement.clientHeight;
        
        // Visual Viewport API 사용 가능한 경우
        if ('visualViewport' in window) {
            const visualHeight = window.visualViewport.height;
            const heightDiff = viewportHeight - visualHeight;
            
            return {
                hasBottomBar: heightDiff > 50,
                uiHeight: heightDiff,
                type: 'visual'
            };
        }
        
        // 기존 감지 방식 개선
        const heightRatio = viewportHeight / screenHeight;
        const heightDifference = screenHeight - viewportHeight;
        
        // iOS 감지
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
            return {
                hasBottomBar: heightDifference > 100 || heightRatio < 0.85,
                uiHeight: heightDifference,
                type: 'ios'
            };
        }
        
        // Android 감지
        const isAndroid = /Android/.test(navigator.userAgent);
        if (isAndroid) {
            return {
                hasBottomBar: heightDifference > 150 || heightRatio < 0.8,
                uiHeight: heightDifference,
                type: 'android'
            };
        }
        
        return {
            hasBottomBar: heightDifference > 100,
            uiHeight: heightDifference,
            type: 'generic'
        };
    }

    updateMobileIndicatorPosition(uiState, isLandscape) {
        const { hasBottomBar, uiHeight, type } = uiState;
        let dynamicBottom;
        let safeAreaBottom = 0;
        
        // Safe area 값 계산
        if (CSS.supports('padding-bottom', 'env(safe-area-inset-bottom)')) {
            // CSS가 처리할 수 있도록 0으로 설정
            safeAreaBottom = 0;
        }
        
        if (isLandscape) {
            // 가로 모드: 더 넉넉한 여백
            dynamicBottom = 25;
        } else if (hasBottomBar) {
            // 세로 모드 + 브라우저 UI 있음
            switch (type) {
                case 'ios':
                    dynamicBottom = Math.max(40, Math.min(uiHeight * 0.3, 80));
                    break;
                case 'android':
                    dynamicBottom = Math.max(45, Math.min(uiHeight * 0.25, 75));
                    break;
                case 'visual':
                    dynamicBottom = Math.max(35, Math.min(uiHeight + 20, 70));
                    break;
                default:
                    dynamicBottom = Math.max(40, Math.min(uiHeight * 0.3, 80));
            }
        } else {
            // 세로 모드 + 브라우저 UI 없음
            dynamicBottom = window.innerWidth <= 480 ? 15 : 20;
        }
        
        // CSS 커스텀 프로퍼티로 값 설정
        document.documentElement.style.setProperty('--dynamic-bottom', `${dynamicBottom}px`);
        document.documentElement.style.setProperty('--safe-area-bottom', `${safeAreaBottom}px`);
        
        // 디버그 정보 (개발 중에만 사용)
        // console.log(`UI State: ${type}, hasBottomBar: ${hasBottomBar}, dynamicBottom: ${dynamicBottom}px`);
    }

    detectBottomBar(viewportHeight) {
        // 기존 메서드는 호환성을 위해 유지하되 새로운 로직으로 리다이렉트
        const uiState = this.detectMobileUIState();
        return uiState.hasBottomBar;
    }

    updateConnectionStatus(isConnected, userCount = 0) {
        if (!this.connectionDot || !this.connectionText) return;

        this.connectionCount = userCount;
        
        if (isConnected) {
            this.connectionDot.className = 'connection-dot connected';
            this.connectionText.textContent = `사용자 수: ${userCount}`;
        } else {
            this.connectionDot.className = 'connection-dot disconnected';
            this.connectionText.textContent = '연결 끊김';
        }
    }

    setupEventListeners() {
        const seasonButtons = document.querySelectorAll('.season-btn');
        seasonButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const season = e.currentTarget.dataset.season;
                this.changeSeason(season);
            });
        });
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            // 리사이즈 디바운싱
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => {
                // 리사이즈 시 트랜지션 일시 중단
                this.disableTransitions();

                // 강제로 리플로우 실행
                this.container.offsetHeight;

                // 위치 조정
                this.adjustIndicatorPosition();

                // 다음 프레임에서 트랜지션 복원
                requestAnimationFrame(() => {
                    this.enableTransitions();
                });
            }, 100);
        });
    }

    createAnimationContainer() {
        this.animationContainer = document.createElement('div');
        this.animationContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 2;
            overflow: hidden;
        `;
        this.container.appendChild(this.animationContainer);
    }

    changeSeason(season, skipSend = false) {
        if (this.currentSeason === season) return;

        // 기존 계절 클래스 제거
        if (this.currentSeason) {
            this.container.classList.remove(this.currentSeason);
            this.stopSeasonAnimation();
        }

        // 새 계절 적용
        this.currentSeason = season;
        this.container.classList.add(season);

        // 버튼 상태 업데이트
        this.updateButtonStates(season);

        // 컨텐츠 업데이트
        this.updateContent(season);

        // 계절별 애니메이션 시작
        this.startSeasonAnimation(season);

        // 웹소켓으로 상태 전송 (추후 확장용)
        if (!skipSend) {
            this.sendSeasonUpdate(season);
        }
    }

    updateButtonStates(activeSeason) {
        const seasonButtons = document.querySelectorAll('.season-btn');
        seasonButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.season === activeSeason) {
                btn.classList.add('active');
            }
        });
    }

    updateContent(season) {
        const data = this.seasonData[season];

        // 애니메이션과 함께 컨텐츠 변경
        this.seasonTitle.style.opacity = '0';
        this.seasonDescription.style.opacity = '0';

        setTimeout(() => {
            this.seasonTitle.textContent = data.title;
            this.seasonDescription.textContent = data.description;
            this.currentSeasonText.textContent = this.getSeasonKorean(season);

            this.seasonTitle.style.opacity = '1';
            this.seasonDescription.style.opacity = '1';
        }, 300);
    }

    getSeasonKorean(season) {
        const korean = {
            spring: '봄',
            summer: '여름',
            autumn: '가을',
            winter: '겨울'
        };
        return korean[season] || '없음';
    }

    startSeasonAnimation(season) {
        this.clearFallingElements();

        switch (season) {
            case 'spring':
                this.createSpringAnimation();
                break;
            case 'summer':
                this.createSummerAnimation();
                break;
            case 'autumn':
                this.createAutumnAnimation();
                break;
            case 'winter':
                this.createWinterAnimation();
                break;
        }
    }

    stopSeasonAnimation() {
        this.animationIntervals.forEach(interval => clearInterval(interval));
        this.animationIntervals = [];
        this.clearFallingElements();
    }

    clearFallingElements() {
        if (this.animationContainer) {
            this.animationContainer.innerHTML = '';
        }
    }

    createSpringAnimation() {
        const createPetal = () => {
            const petal = document.createElement('div');
            petal.className = 'petal';

            // 고정된 색상 클래스 할당
            const colorClasses = ['color1', 'color2', 'color3'];
            const randomColor = colorClasses[Math.floor(Math.random() * colorClasses.length)];
            petal.classList.add(randomColor);

            petal.style.left = Math.random() * 90 + 5 + '%'; // 5-95% 범위로 제한
            petal.style.animationDuration = (Math.random() * 6 + 8) + 's';
            this.animationContainer.appendChild(petal);

            // 애니메이션 완료 후 제거
            setTimeout(() => {
                if (petal.parentNode) {
                    petal.remove();
                }
            }, parseFloat(petal.style.animationDuration) * 1000);
        };

        const petalInterval = setInterval(createPetal, 1200);
        this.animationIntervals.push(petalInterval);
    }

    createSummerAnimation() {
        const createSunbeam = () => {
            const sunbeam = document.createElement('div');
            sunbeam.className = 'sunbeam';

            // 고정된 색상 클래스 할당
            const colorClasses = ['color1', 'color2', 'color3'];
            const randomColor = colorClasses[Math.floor(Math.random() * colorClasses.length)];
            sunbeam.classList.add(randomColor);

            sunbeam.style.left = Math.random() * 90 + 5 + '%';
            sunbeam.style.animationDuration = (Math.random() * 5 + 7) + 's';
            this.animationContainer.appendChild(sunbeam);

            setTimeout(() => {
                if (sunbeam.parentNode) {
                    sunbeam.remove();
                }
            }, parseFloat(sunbeam.style.animationDuration) * 1000);
        };

        const sunbeamInterval = setInterval(createSunbeam, 800);
        this.animationIntervals.push(sunbeamInterval);
    }

    createAutumnAnimation() {
        const createLeaf = () => {
            const leaf = document.createElement('div');
            leaf.className = 'leaf';

            // 고정된 색상 클래스 할당
            const colorClasses = ['color1', 'color2', 'color3'];
            const randomColor = colorClasses[Math.floor(Math.random() * colorClasses.length)];
            leaf.classList.add(randomColor);

            leaf.style.left = Math.random() * 90 + 5 + '%';
            leaf.style.animationDuration = (Math.random() * 7 + 10) + 's';
            this.animationContainer.appendChild(leaf);

            setTimeout(() => {
                if (leaf.parentNode) {
                    leaf.remove();
                }
            }, parseFloat(leaf.style.animationDuration) * 1000);
        };

        const leafInterval = setInterval(createLeaf, 1500);
        this.animationIntervals.push(leafInterval);
    }

    createWinterAnimation() {
        const createSnowflake = () => {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.innerHTML = ['❄', '❅', '❆'][Math.floor(Math.random() * 3)];
            snowflake.style.left = Math.random() * 90 + 5 + '%';
            snowflake.style.animationDuration = (Math.random() * 6 + 9) + 's';
            this.animationContainer.appendChild(snowflake);

            setTimeout(() => {
                if (snowflake.parentNode) {
                    snowflake.remove();
                }
            }, parseFloat(snowflake.style.animationDuration) * 1000);
        };

        const snowInterval = setInterval(createSnowflake, 600);
        this.animationIntervals.push(snowInterval);
    }

    // 웹소켓 확장을 위한 메서드들
    connectWebSocket() {
        try {
            // 추후 웹소켓 서버 URL 설정
            this.websocket = new WebSocket('wss://female-tabby-gguip1-019595cf.koyeb.app/seasons');

            this.websocket.onopen = () => {
                this.isConnected = true;
                // console.log('WebSocket 연결됨');
                this.updateConnectionStatus(true, this.connectionCount);
            };

            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                // 각 타입을 독립적으로 처리
                if (data.type === 'seasonUpdate') {
                    this.changeSeason(data.season, true);
                }
                
                if (data.type === 'connectionCount') {
                    // ConnectionCountDto에서 count 필드 사용
                    this.updateConnectionStatus(this.isConnected, data.connectionCount);
                }
            };

            this.websocket.onclose = () => {
                this.isConnected = false;
                // console.log('WebSocket 연결 종료');
                this.updateConnectionStatus(false, 0);
                
                // 재연결 시도 (5초 후)
                setTimeout(() => {
                    if (!this.isConnected) {
                        // console.log('WebSocket 재연결 시도...');
                        this.connectWebSocket();
                    }
                }, 5000);
            };

            this.websocket.onerror = (error) => {
                // console.log('WebSocket 오류:', error);
                this.updateConnectionStatus(false, 0);
            };
        } catch (error) {
            // console.log('WebSocket 연결 실패:', error);
            this.updateConnectionStatus(false, 0);
        }
    }

    sendSeasonUpdate(season) {
        // 웹소켓이 연결되어 있다면 서버로 상태 전송
        if (this.websocket && this.isConnected) {
            const message = {
                type: 'changeRequest',
                season: season,
                timestamp: new Date().toISOString()
            };
            this.websocket.send(JSON.stringify(message));
        }

        // 로컬 스토리지에도 저장
        localStorage.setItem('currentSeason', season);
    }

    // 페이지 로드 시 이전 상태 복원
    restoreState() {
        const savedSeason = localStorage.getItem('currentSeason');
        if (savedSeason && this.seasonData[savedSeason]) {
            this.changeSeason(savedSeason);
        }
    }

    disableTransitions() {
        document.body.style.transition = 'none';
        this.container.style.transition = 'none';

        // 모든 계절별 요소들의 트랜지션도 비활성화
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            element.style.transition = 'none';
        });
    }

    enableTransitions() {
        document.body.style.transition = '';
        this.container.style.transition = '';

        // 모든 요소들의 트랜지션 복원
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            element.style.transition = '';
        });
    }
}

// 페이지 로드 시 SeasonManager 초기화
document.addEventListener('DOMContentLoaded', () => {
    const seasonManager = new SeasonManager();
    seasonManager.restoreState();
});
