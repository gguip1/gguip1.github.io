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

        // 뷰포트 높이 추적을 위한 변수 추가
        this.isInitialized = false;

        this.init();
    }

    init() {
        this.setupMobileOptimization();
        this.setupEventListeners();
        this.setupResizeHandler();
        this.createAnimationContainer();

        // 초기화 완료 후 인디케이터 위치 설정
        this.adjustIndicatorPosition();
        this.isInitialized = true;

        // 초기 상태는 연결 끊김
        this.updateConnectionStatus(false, 0);
        this.updateButtonsState(false); // 버튼들을 비활성화 상태로 시작

        // 웹소켓 연결 시도
        this.connectWebSocket();
    }

    setupMobileOptimization() {
        // 개선된 뷰포트 높이 설정
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);

            // 초기화 완료 후에만 인디케이터 위치 조정
            if (this.isInitialized) {
                this.adjustIndicatorPosition();
            }
        };

        // 초기 설정
        setVH();

        // 이벤트 리스너 설정 (디바운스 적용)
        let resizeTimeout;
        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                setVH();
            }, 100);
        };

        window.addEventListener('resize', debouncedResize);
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                setVH();
            }, 200);
        });

        // Visual Viewport API 지원 브라우저
        if ('visualViewport' in window) {
            window.visualViewport.addEventListener('resize', () => {
                setTimeout(() => {
                    this.adjustIndicatorPosition();
                }, 50);
            });
        }
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
        const screenHeight = window.screen.height;
        const isLandscape = window.innerWidth > window.innerHeight;
        const isMobile = window.innerWidth <= 768;

        if (!isMobile) {
            // 데스크톱에서는 기본값 사용
            document.documentElement.style.setProperty('--browser-ui-height', '0px');
            return;
        }

        // 모바일 브라우저 UI 감지 개선
        const uiState = this.detectMobileUIState(currentViewportHeight, screenHeight);
        this.updateMobileIndicatorPosition(uiState, isLandscape);

        // 이전 높이 업데이트
        this.lastViewportHeight = currentViewportHeight;
    }

    detectMobileUIState(viewportHeight, screenHeight) {
        // Visual Viewport API가 가장 정확함
        if ('visualViewport' in window) {
            const visualHeight = window.visualViewport.height;
            const heightDiff = viewportHeight - visualHeight;

            return {
                hasBottomBar: heightDiff > 20,
                uiHeight: Math.max(0, heightDiff),
                type: 'visual',
                confidence: 'high'
            };
        }

        // 플랫폼별 감지
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        const heightDifference = screenHeight - viewportHeight;
        const heightRatio = viewportHeight / screenHeight;

        if (isIOS) {
            // iOS Safari의 경우
            return {
                hasBottomBar: heightRatio < 0.9 || heightDifference > 100,
                uiHeight: Math.max(0, heightDifference * 0.3),
                type: 'ios',
                confidence: 'medium'
            };
        }

        if (isAndroid) {
            // Android Chrome의 경우
            return {
                hasBottomBar: heightRatio < 0.85 || heightDifference > 120,
                uiHeight: Math.max(0, heightDifference * 0.25),
                type: 'android',
                confidence: 'medium'
            };
        }

        // 일반적인 경우
        return {
            hasBottomBar: heightDifference > 80,
            uiHeight: Math.max(0, heightDifference * 0.2),
            type: 'generic',
            confidence: 'low'
        };
    }

    updateMobileIndicatorPosition(uiState, isLandscape) {
        const { hasBottomBar, uiHeight, type, confidence } = uiState;
        let browserUIHeight = 0;

        // 브라우저 UI 높이 계산
        if (hasBottomBar && uiHeight > 0) {
            if (isLandscape) {
                // 가로 모드에서는 UI 높이를 줄임
                browserUIHeight = Math.min(uiHeight * 0.5, 30);
            } else {
                // 세로 모드에서 타입별 조정
                switch (type) {
                    case 'visual':
                        browserUIHeight = Math.min(uiHeight + 10, 60);
                        break;
                    case 'ios':
                        browserUIHeight = Math.min(uiHeight, 50);
                        break;
                    case 'android':
                        browserUIHeight = Math.min(uiHeight, 45);
                        break;
                    default:
                        browserUIHeight = Math.min(uiHeight, 40);
                }
            }
        }

        // CSS 변수 업데이트
        document.documentElement.style.setProperty('--browser-ui-height', `${browserUIHeight}px`);

        // 강제 리렌더링 (필요한 경우만)
        if (confidence === 'high') {
            this.forceIndicatorUpdate();
        }
    }

    forceIndicatorUpdate() {
        // 더 부드러운 강제 업데이트
        const indicators = [
            document.getElementById('connectionStatusIndicator'),
            document.getElementById('currentSeasonIndicator')
        ];

        indicators.forEach(indicator => {
            if (indicator) {
                // transform을 이용한 GPU 가속 업데이트
                indicator.style.transform = 'translateZ(0) translateY(0.1px)';
                requestAnimationFrame(() => {
                    indicator.style.transform = 'translateZ(0)';
                });
            }
        });
    }

    updateConnectionStatus(isConnected, userCount = 0) {
        if (!this.connectionDot || !this.connectionText) return;

        this.connectionCount = userCount;

        if (isConnected) {
            this.connectionDot.className = 'w-2 h-2 rounded-full transition-colors duration-300 connected bg-green-500 animate-pulse';
            this.connectionDot.style.boxShadow = '0 0 8px rgba(76, 175, 80, 0.6)';
            this.connectionText.textContent = `사용자 수: ${userCount}`;
            this.updateButtonsState(true); // 버튼들을 활성화
        } else {
            this.connectionDot.className = 'w-2 h-2 rounded-full transition-colors duration-300 disconnected bg-red-500';
            this.connectionDot.style.boxShadow = '0 0 8px rgba(244, 67, 54, 0.6)';
            this.connectionText.textContent = '연결 끊김';
            this.updateButtonsState(false); // 버튼들을 비활성화
        }
    }

    setupEventListeners() {
        const seasonButtons = document.querySelectorAll('.season-btn');
        seasonButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 웹소켓이 연결되지 않았으면 계절 변경 차단
                if (!this.isConnected) {
                    this.showConnectionMessage();
                    return;
                }

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
        this.animationContainer.className = 'absolute inset-0 pointer-events-none overflow-hidden z-[5]';
        this.container.appendChild(this.animationContainer);
    }

    changeSeason(season, skipSend = false) {
        // 웹소켓이 연결되지 않았고, 서버에서 온 요청이 아니라면 차단
        if (!this.isConnected && !skipSend) {
            this.showConnectionMessage();
            return;
        }

        if (this.currentSeason === season) return;

        // 기존 계절 클래스 제거
        if (this.currentSeason) {
            this.container.classList.remove(this.currentSeason);
            this.stopSeasonAnimation();
        }

        // 새 계절 적용 - Tailwind 클래스로 배경 변경
        this.currentSeason = season;
        this.container.classList.add(season);

        // 배경 그라디언트 및 애니메이션 적용
        switch (season) {
            case 'spring':
                this.container.style.background = 'linear-gradient(135deg, #ffb3ba 0%, #ffdfba 25%, #ffffba 50%, #baffc9 75%, #bae1ff 100%)';
                this.container.style.backgroundSize = '400% 400%';
                this.container.style.animation = 'springBreeze 20s ease-in-out infinite';
                break;
            case 'summer':
                this.container.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 25%, #ffeb3b 50%, #66bb6a 75%, #42a5f5 100%)';
                this.container.style.backgroundSize = '400% 400%';
                this.container.style.animation = 'summerHeat 25s ease-in-out infinite';
                break;
            case 'autumn':
                this.container.style.background = 'linear-gradient(135deg, #d32f2f 0%, #f57c00 25%, #fbc02d 50%, #689f38 75%, #1976d2 100%)';
                this.container.style.backgroundSize = '400% 400%';
                this.container.style.animation = 'autumnWind 18s ease-in-out infinite';
                break;
            case 'winter':
                this.container.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 25%, #90caf9 50%, #64b5f6 75%, #42a5f5 100%)';
                this.container.style.backgroundSize = '400% 400%';
                this.container.style.animation = 'winterChill 30s ease-in-out infinite';
                break;
        }

        // 버튼 상태 업데이트
        this.updateButtonStates(season);

        // 컨텐츠 업데이트
        this.updateContent(season);

        // 계절 변경 후 약간의 지연을 두고 인디케이터 위치 재조정
        setTimeout(() => {
            this.adjustIndicatorPosition();
        }, 300); // 계절 애니메이션이 시작된 후

        // 계절별 애니메이션 시작
        this.startSeasonAnimation(season);

        // 웹소켓으로 상태 전송
        if (!skipSend) {
            this.sendSeasonUpdate(season);
        }
    }

    updateButtonStates(activeSeason) {
        const seasonButtons = document.querySelectorAll('.season-btn');
        seasonButtons.forEach(btn => {
            btn.classList.remove('bg-white/40', 'border-white/60', '-translate-y-[5px]');
            if (btn.dataset.season === activeSeason) {
                btn.classList.add('bg-white/40', 'border-white/60', '-translate-y-[5px]');
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

            // 계절별 텍스트 색상 적용
            this.updateTextColors(season);

            this.seasonTitle.style.opacity = '1';
            this.seasonDescription.style.opacity = '1';
        }, 300);
    }

    updateTextColors(season) {
        // 기존 색상 클래스 제거
        this.seasonTitle.className = 'text-6xl font-bold mb-6 transition-all duration-300 ease-in-out max-md:text-[2.5rem] max-[480px]:text-4xl';
        this.seasonDescription.className = 'text-2xl max-w-[600px] leading-relaxed transition-all duration-300 ease-in-out max-md:text-xl max-md:px-4 max-[480px]:text-lg';

        // 계절별 색상 적용
        switch (season) {
            case 'spring':
                this.seasonTitle.className += ' text-orange-800';
                this.seasonDescription.className += ' text-orange-700';
                break;
            case 'summer':
                this.seasonTitle.className += ' text-white';
                this.seasonDescription.className += ' text-white/95';
                break;
            case 'autumn':
                this.seasonTitle.className += ' text-white';
                this.seasonDescription.className += ' text-white/95';
                break;
            case 'winter':
                this.seasonTitle.className += ' text-blue-900';
                this.seasonDescription.className += ' text-blue-800';
                break;
        }
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

    // 버튼들의 활성화/비활성화 상태 관리
    updateButtonsState(isEnabled) {
        const seasonButtons = document.querySelectorAll('.season-btn');
        seasonButtons.forEach(btn => {
            if (isEnabled) {
                btn.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
                btn.classList.add('cursor-pointer');
            } else {
                btn.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
                btn.classList.remove('cursor-pointer');
            }
        });
    }

    // 연결되지 않았을 때 표시할 메시지
    showConnectionMessage() {
        // 잠깐 연결 상태를 강조 표시
        const indicator = document.getElementById('connectionStatusIndicator');
        if (indicator) {
            indicator.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                indicator.style.animation = '';
            }, 500);
        }
    }

    // 웹소켓 연결 성공 시 초기 컨텐츠 설정
    setInitialContent() {
        // 저장된 계절이 있다면 복원, 없다면 기본 메시지 표시
        const savedSeason = localStorage.getItem('currentSeason');
        if (savedSeason && this.seasonData[savedSeason]) {
            // 서버에서 온 데이터로 복원하므로 skipSend = true
            this.changeSeason(savedSeason, true);
        } else {
            // 기본 상태로 설정
            this.seasonTitle.textContent = '계절을 선택해주세요';
            this.seasonDescription.textContent = '위의 버튼을 클릭하여 원하는 계절을 선택하세요';
        }
    }

    // 연결이 끊어졌을 때 원래 상태로 되돌림
    resetToConnectionState() {
        // 기존 계절 클래스 제거
        if (this.currentSeason) {
            this.container.classList.remove(this.currentSeason);
            this.stopSeasonAnimation();
            this.currentSeason = null;
        }

        // 배경을 기본 상태로 복원
        this.container.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        this.container.style.backgroundSize = '';
        this.container.style.animation = '';

        // 버튼 상태 초기화
        const seasonButtons = document.querySelectorAll('.season-btn');
        seasonButtons.forEach(btn => {
            btn.classList.remove('bg-white/40', 'border-white/60', '-translate-y-[5px]');
        });

        // 텍스트를 서버 연결 중으로 되돌림
        this.seasonTitle.textContent = '서버 연결 중...';
        this.seasonDescription.textContent = '느린 서버와 함께 하는 중...';
        this.currentSeasonText.textContent = '없음';
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
            petal.className = 'absolute w-3 h-3 bg-pink-400 opacity-80 animate-petal-fall';
            petal.style.borderRadius = '50% 0 50% 0';

            // 고정된 색상 클래스 할당
            const colorClasses = ['bg-pink-400', 'bg-pink-300', 'bg-pink-200'];
            const randomColor = colorClasses[Math.floor(Math.random() * colorClasses.length)];
            petal.className = `absolute w-3 h-3 ${randomColor} opacity-80 animate-petal-fall`;
            petal.style.borderRadius = '50% 0 50% 0';

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
            sunbeam.className = 'absolute w-[10px] h-[10px] rounded-full opacity-90 animate-sunbeam-fall';

            // 고정된 색상 클래스 할당
            const colors = [
                'radial-gradient(circle, #ffeb3b 20%, #ffc107 70%)',
                'radial-gradient(circle, #ffd700 20%, #ffb347 70%)',
                'radial-gradient(circle, #fff700 20%, #ffa500 70%)'
            ];
            const shadows = [
                '0 0 6px rgba(255, 235, 59, 0.6)',
                '0 0 6px rgba(255, 215, 0, 0.6)',
                '0 0 6px rgba(255, 247, 0, 0.6)'
            ];
            const randomIndex = Math.floor(Math.random() * colors.length);
            sunbeam.style.background = colors[randomIndex];
            sunbeam.style.boxShadow = shadows[randomIndex];

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
            leaf.className = 'absolute w-[14px] h-[14px] opacity-90 animate-leaf-fall';

            // 고정된 색상 및 모양 클래스 할당
            const leafTypes = [
                { color: 'bg-orange-600', borderRadius: '0 100% 0 100%' },
                { color: 'bg-yellow-600', borderRadius: '100% 0 100% 0' },
                { color: 'bg-red-600', borderRadius: '50% 0 50% 50%' }
            ];
            const randomLeaf = leafTypes[Math.floor(Math.random() * leafTypes.length)];
            leaf.className += ` ${randomLeaf.color}`;
            leaf.style.borderRadius = randomLeaf.borderRadius;

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
            snowflake.className = 'absolute text-white text-base opacity-90 animate-snow-fall';
            snowflake.style.textShadow = '0 0 4px rgba(255, 255, 255, 0.8)';
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

                // 연결 성공 시 초기 상태 설정
                this.setInitialContent();
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

                // 연결이 끊어지면 "서버 연결 중..." 메시지로 되돌림
                this.resetToConnectionState();

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
                this.resetToConnectionState();
            };
        } catch (error) {
            // console.log('WebSocket 연결 실패:', error);
            this.updateConnectionStatus(false, 0);
            this.resetToConnectionState();
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
