import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class ModelViewer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.mixer = null;
        this.clock = new THREE.Clock();
        
        this.settings = {
            autoRotate: true,
            wireframe: false,
            rotationSpeed: 0.5,
            backgroundColor: 0x1a1a1a,
            modelBrightness: 1,
            followSystemTheme: true // 시스템 테마 따라가기 설정
        };
        
        this.activeEffects = new Set();
        this.effectObjects = [];
        this.particles = [];
        
        // 테마 색상 정의
        this.themeColors = {
            dark: 0x1a1a1a,
            light: 0xf5f5f5
        };
        
        this.init();
        this.setupThemeDetection();
        this.loadModel();
        this.setupControls();
        this.setupEffects();
        this.animate();
    }
    
    setupThemeDetection() {
        // 초기 테마 설정
        this.updateTheme();
        
        // 시스템 테마 변경 감지
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
            if (this.settings.followSystemTheme) {
                this.updateTheme();
            }
        });
    }
    
    updateTheme() {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const newBackgroundColor = isDarkMode ? this.themeColors.dark : this.themeColors.light;
        
        // 배경색 업데이트
        this.settings.backgroundColor = newBackgroundColor;
        if (this.scene) {
            this.scene.background = new THREE.Color(this.settings.backgroundColor);
        }
        
        // 색상 입력 컨트롤 값도 업데이트
        const bgColorInput = document.getElementById('bg-color');
        if (bgColorInput) {
            bgColorInput.value = `#${new THREE.Color(newBackgroundColor).getHexString()}`;
        }
        
        console.log(`테마 변경: ${isDarkMode ? '다크 모드' : '라이트 모드'}`);
    }
    
    init() {
        const container = document.getElementById('canvas-container');
        
        // Scene 생성
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.settings.backgroundColor);
        
        // Camera 생성
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 5);
        
        // Renderer 생성
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        
        container.appendChild(this.renderer.domElement);
        
        // Controls 생성
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = this.settings.autoRotate;
        this.controls.autoRotateSpeed = this.settings.rotationSpeed;
        this.controls.maxDistance = 20;
        this.controls.minDistance = 1;
        
        // 조명 설정
        this.setupLighting();
        
        // 리사이즈 이벤트
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupLighting() {
        // 환경광
        this.ambientLight = new THREE.AmbientLight(0x404040, 1.2 * this.settings.modelBrightness);
        this.scene.add(this.ambientLight);
        
        // 주광원
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 2 * this.settings.modelBrightness);
        this.directionalLight.position.set(5, 10, 5);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 50;
        this.scene.add(this.directionalLight);
        
        // 보조광원들
        this.pointLight1 = new THREE.PointLight(0x4CAF50, 1 * this.settings.modelBrightness, 100);
        this.pointLight1.position.set(-10, 10, 10);
        this.scene.add(this.pointLight1);
        
        this.pointLight2 = new THREE.PointLight(0xffffff, 0.8 * this.settings.modelBrightness, 100);
        this.pointLight2.position.set(10, -10, -10);
        this.scene.add(this.pointLight2);
        
        // 바닥 반사광
        this.hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.6 * this.settings.modelBrightness);
        this.scene.add(this.hemisphereLight);
    }
    
    loadModel() {
        const loader = new GLTFLoader();
        
        loader.load(
            './assets/Blade_of_Lumina.glb',
            (gltf) => {
                this.model = gltf.scene;
                
                // 모델 최적화 및 매테리얼 수정
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // 매테리얼 처리 개선
                        if (child.material) {
                            // 배열인 경우와 단일 매테리얼인 경우 모두 처리
                            const materials = Array.isArray(child.material) ? child.material : [child.material];
                            
                            materials.forEach(material => {
                                if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                                    material.envMapIntensity = 1;
                                    material.needsUpdate = true;
                                } else if (material.isMeshBasicMaterial) {
                                    // BasicMaterial을 StandardMaterial로 교체
                                    const newMaterial = new THREE.MeshStandardMaterial({
                                        map: material.map,
                                        color: material.color,
                                        transparent: material.transparent,
                                        opacity: material.opacity
                                    });
                                    child.material = newMaterial;
                                }
                            });
                        }
                        
                        // Geometry 확인 및 수정
                        if (child.geometry) {
                            child.geometry.computeVertexNormals();
                            if (!child.geometry.attributes.normal) {
                                child.geometry.computeVertexNormals();
                            }
                        }
                    }
                });
                
                // 모델 크기 및 위치 조정
                const box = new THREE.Box3().setFromObject(this.model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 3 / maxDim; // 스케일 증가
                this.model.scale.multiplyScalar(scale);
                
                // 모델을 정중앙에 위치시키기
                this.model.position.sub(center.multiplyScalar(scale));
                this.model.position.y = 0; // Y축 중앙에 위치
                
                this.scene.add(this.model);
                
                // 카메라 위치 및 타겟 조정 - 모델 중앙을 바라보도록
                this.camera.position.set(0, 0, 5);
                this.controls.target.set(0, 0, 0); // 정중앙을 타겟으로
                this.controls.update();
                
                // 애니메이션 설정 (있는 경우)
                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(this.model);
                    gltf.animations.forEach((clip) => {
                        this.mixer.clipAction(clip).play();
                    });
                }
                
                // 로딩 완료
                document.getElementById('loading').style.display = 'none';
                console.log('Model loaded successfully');
            },
            (progress) => {
                console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading model:', error);
                document.getElementById('loading').innerHTML = 
                    '<p>모델 로딩에 실패했습니다.<br>파일 경로를 확인해주세요.</p>';
            }
        );
    }
    
    setupControls() {
        // 자동 회전 토글
        document.getElementById('auto-rotate').addEventListener('change', (e) => {
            this.settings.autoRotate = e.target.checked;
            this.controls.autoRotate = this.settings.autoRotate;
        });
        
        // 와이어프레임 토글
        document.getElementById('wireframe').addEventListener('change', (e) => {
            this.settings.wireframe = e.target.checked;
            if (this.model) {
                this.model.traverse((child) => {
                    if (child.isMesh && child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(material => {
                            material.wireframe = this.settings.wireframe;
                        });
                    }
                });
            }
        });
        
        // 배경색 변경 - input 이벤트로 실시간 변경
        document.getElementById('bg-color').addEventListener('input', (e) => {
            this.settings.backgroundColor = new THREE.Color(e.target.value);
            this.scene.background = this.settings.backgroundColor;
            // 수동으로 색상을 변경하면 시스템 테마 따라가기 비활성화
            this.settings.followSystemTheme = false;
        });
        
        // 배경색 초기화 (시스템 테마로 돌아가기)
        document.getElementById('bg-color').addEventListener('dblclick', () => {
            this.settings.followSystemTheme = true;
            this.updateTheme();
        });
        
        // 회전 속도 조절
        document.getElementById('rotation-speed').addEventListener('input', (e) => {
            this.settings.rotationSpeed = parseFloat(e.target.value);
            this.controls.autoRotateSpeed = this.settings.rotationSpeed;
        });

        // 모델 밝기 조절
        document.getElementById('model-brightness').addEventListener('input', (e) => {
            this.settings.modelBrightness = parseFloat(e.target.value);
            this.updateLightingBrightness();
        });
    }

    updateLightingBrightness() {
        if (this.ambientLight) {
            this.ambientLight.intensity = 1.2 * this.settings.modelBrightness;
        }
        if (this.directionalLight) {
            this.directionalLight.intensity = 2 * this.settings.modelBrightness;
        }
        if (this.pointLight1) {
            this.pointLight1.intensity = 1 * this.settings.modelBrightness;
        }
        if (this.pointLight2) {
            this.pointLight2.intensity = 0.8 * this.settings.modelBrightness;
        }
        if (this.hemisphereLight) {
            this.hemisphereLight.intensity = 0.6 * this.settings.modelBrightness;
        }
    }

    removeEffect(effectType) {
        this.activeEffects.delete(effectType);
        
        // 해당 효과 객체들 제거 및 메모리 정리
        this.effectObjects = this.effectObjects.filter(obj => {
            if (obj.effectType === effectType) {
                // 재귀적으로 모든 자식 객체 제거
                this.disposeObject(obj);
                this.scene.remove(obj);
                return false;
            }
            return true;
        });
        
        // 파티클 시스템 제거
        this.particles = this.particles.filter(particleSystem => {
            if (particleSystem.effectType === effectType) {
                this.disposeObject(particleSystem);
                this.scene.remove(particleSystem);
                return false;
            }
            return true;
        });
        
        // 모델 매테리얼 원복 (특정 효과들)
        if (effectType === 'glow' || effectType === 'pulse') {
            this.resetModelMaterials();
        }
    }

    disposeObject(obj) {
        // 메모리 정리 함수
        if (obj.geometry) {
            obj.geometry.dispose();
        }
        
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(material => {
                    if (material.map) material.map.dispose();
                    material.dispose();
                });
            } else {
                if (obj.material.map) obj.material.map.dispose();
                obj.material.dispose();
            }
        }
        
        // 자식 객체들도 재귀적으로 정리
        if (obj.children) {
            obj.children.forEach(child => {
                this.disposeObject(child);
            });
        }
    }

    clearAllEffects() {
        // 모든 효과 객체 제거 및 메모리 정리
        this.effectObjects.forEach(obj => {
            this.disposeObject(obj);
            this.scene.remove(obj);
        });
        
        this.particles.forEach(particleSystem => {
            this.disposeObject(particleSystem);
            this.scene.remove(particleSystem);
        });
        
        // 배열 초기화
        this.effectObjects = [];
        this.particles = [];
        this.activeEffects.clear();
        
        // 버튼 상태 초기화
        document.querySelectorAll('.effect-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 모델 매테리얼 원복
        this.resetModelMaterials();
        
        console.log('모든 효과가 제거되었습니다.');
    }

    resetModelMaterials() {
        if (!this.model) return;
        
        this.model.traverse((child) => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(material => {
                    material.emissive = new THREE.Color(0x000000);
                    material.emissiveIntensity = 0;
                    material.needsUpdate = true;
                });
            }
        });
    }

    setupEffects() {
        const effectButtons = document.querySelectorAll('.effect-btn');
        
        effectButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const effect = button.dataset.effect;
                
                if (effect === 'clear') {
                    this.clearAllEffects();
                } else {
                    // 클릭 상태 즉시 반영
                    if (this.activeEffects.has(effect)) {
                        button.classList.remove('active');
                    } else {
                        button.classList.add('active');
                    }
                    
                    this.toggleEffect(effect, button);
                }
            });
        });
        
        // 추가적인 이벤트 리스너 (안전장치)
        document.getElementById('clear-all-effects').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.clearAllEffects();
        });
    }

    toggleEffect(effectType, button) {
        if (this.activeEffects.has(effectType)) {
            this.removeEffect(effectType);
            console.log(`${effectType} 효과가 제거되었습니다.`);
        } else {
            this.addEffect(effectType);
            console.log(`${effectType} 효과가 추가되었습니다.`);
        }
    }

    addEffect(effectType) {
        if (!this.model) return;
        
        this.activeEffects.add(effectType);
        
        switch (effectType) {
            case 'enhance':
                this.createEnhanceEffect();
                break;
            case 'holy':
                this.createHolyEffect();
                break;
            case 'dark':
                this.createDarkEffect();
                break;
            case 'sparkle':
                this.createSparkleEffect();
                break;
            case 'glow':
                this.createGlowEffect();
                break;
            case 'pulse':
                this.createPulseEffect();
                break;
            case 'fire':
                this.createFireEffect();
                break;
            case 'ice':
                this.createIceEffect();
                break;
            case 'lightning':
                this.createLightningEffect();
                break;
        }
    }

    createEnhanceEffect() {
        // 다층 강화 오라 링
        for (let i = 0; i < 3; i++) {
            const geometry = new THREE.TorusGeometry(2.5 + i * 0.3, 0.05, 8, 32);
            const material = new THREE.MeshBasicMaterial({ 
                color: new THREE.Color().setHSL(0.15, 1, 0.6 + i * 0.1),
                transparent: true, 
                opacity: 0.8 - i * 0.2,
                blending: THREE.AdditiveBlending
            });
            const torus = new THREE.Mesh(geometry, material);
            torus.position.y = -1.5;
            torus.rotation.x = Math.PI / 2;
            torus.effectType = 'enhance';
            torus.enhanceLayer = i;
            
            this.scene.add(torus);
            this.effectObjects.push(torus);
        }

        // 상승하는 에너지 스파이럴
        this.createEnhanceSpiral();
    }

    createEnhanceSpiral() {
        const spiralGeometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        for (let i = 0; i < 200; i++) {
            const t = i / 200;
            const angle = t * Math.PI * 8;
            const radius = 1.5 * (1 - t * 0.5);
            const y = t * 6 - 2;
            
            positions.push(
                Math.cos(angle) * radius,
                y,
                Math.sin(angle) * radius
            );
            
            const color = new THREE.Color().setHSL(0.15, 1, 0.8);
            colors.push(color.r, color.g, color.b);
        }
        
        spiralGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        spiralGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const spiralMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const spiral = new THREE.Points(spiralGeometry, spiralMaterial);
        spiral.effectType = 'enhance';
        this.scene.add(spiral);
        this.effectObjects.push(spiral);
    }

    createHolyEffect() {
        // 신성한 기둥 빛
        const cylinderGeometry = new THREE.CylinderGeometry(0.1, 3, 10, 32, 1, true);
        const cylinderMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const lightColumn = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        lightColumn.position.y = 2;
        lightColumn.effectType = 'holy';
        
        this.scene.add(lightColumn);
        this.effectObjects.push(lightColumn);

        // 떠다니는 십자가들
        for (let i = 0; i < 8; i++) {
            const crossGroup = this.createFloatingCross();
            const angle = (i / 8) * Math.PI * 2;
            crossGroup.position.set(
                Math.cos(angle) * 4,
                Math.random() * 3 + 1,
                Math.sin(angle) * 4
            );
            crossGroup.effectType = 'holy';
            crossGroup.orbitAngle = angle;
            this.scene.add(crossGroup);
            this.effectObjects.push(crossGroup);
        }

        // 신성한 파티클
        this.createAdvancedParticles(0xffffff, 100, 'holy', {
            size: 0.2,
            movement: 'float',
            glow: true
        });
    }

    createFloatingCross() {
        const group = new THREE.Group();
        
        // 십자가 형태
        const vBar = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.8, 0.1),
            new THREE.MeshBasicMaterial({ 
                color: 0xffffff, 
                transparent: true, 
                opacity: 0.8,
                blending: THREE.AdditiveBlending 
            })
        );
        
        const hBar = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.1, 0.1),
            new THREE.MeshBasicMaterial({ 
                color: 0xffffff, 
                transparent: true, 
                opacity: 0.8,
                blending: THREE.AdditiveBlending 
            })
        );
        hBar.position.y = 0.2;
        
        group.add(vBar);
        group.add(hBar);
        
        return group;
    }

    createDarkEffect() {
        // 어둠의 소용돌이
        const vortexGeometry = new THREE.PlaneGeometry(6, 6, 32, 32);
        const vortexMaterial = new THREE.MeshBasicMaterial({
            color: 0x4a0080,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        
        const vortex = new THREE.Mesh(vortexGeometry, vortexMaterial);
        vortex.rotation.x = -Math.PI / 2;
        vortex.position.y = -2;
        vortex.effectType = 'dark';
        
        this.scene.add(vortex);
        this.effectObjects.push(vortex);

        // 어둠의 촉수들
        for (let i = 0; i < 6; i++) {
            const tentacle = this.createDarkTentacle();
            const angle = (i / 6) * Math.PI * 2;
            tentacle.position.set(
                Math.cos(angle) * 2,
                -1,
                Math.sin(angle) * 2
            );
            tentacle.effectType = 'dark';
            tentacle.baseAngle = angle;
            this.scene.add(tentacle);
            this.effectObjects.push(tentacle);
        }

        // 어둠 파티클
        this.createAdvancedParticles(0x8b00ff, 80, 'dark', {
            size: 0.15,
            movement: 'spiral',
            glow: true
        });
    }

    createDarkTentacle() {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0.5, 1, 0.5),
            new THREE.Vector3(-0.3, 2, 0.8),
            new THREE.Vector3(0.2, 3, 0.3)
        ]);
        
        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.1, 8, false);
        const tubeMaterial = new THREE.MeshBasicMaterial({
            color: 0x4a0080,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        return new THREE.Mesh(tubeGeometry, tubeMaterial);
    }

    createSparkleEffect() {
        // 다이아몬드 모양 반짝임
        for (let i = 0; i < 50; i++) {
            const sparkle = this.createDiamondSparkle();
            sparkle.position.set(
                (Math.random() - 0.5) * 6,
                Math.random() * 5,
                (Math.random() - 0.5) * 6
            );
            sparkle.effectType = 'sparkle';
            sparkle.baseScale = Math.random() * 0.5 + 0.1;
            sparkle.twinkleSpeed = Math.random() * 2 + 1;
            this.scene.add(sparkle);
            this.effectObjects.push(sparkle);
        }
    }

    createDiamondSparkle() {
        const geometry = new THREE.OctahedronGeometry(0.1);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        return new THREE.Mesh(geometry, material);
    }

    createGlowEffect() {
        if (!this.model) return;
        
        // 모델에 강력한 발광 효과 적용
        this.model.traverse((child) => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(material => {
                    material.emissive = new THREE.Color(0x00ff88);
                    material.emissiveIntensity = 0.5;
                });
            }
        });

        // 주변 광채 효과
        const glowSphere = new THREE.Mesh(
            new THREE.SphereGeometry(3.5, 32, 32),
            new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                transparent: true,
                opacity: 0.1,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide
            })
        );
        glowSphere.effectType = 'glow';
        
        this.scene.add(glowSphere);
        this.effectObjects.push(glowSphere);
    }

    createFireEffect() {
        // 불꽃 파티클 시스템
        this.createAdvancedParticles(0xff4400, 150, 'fire', {
            size: 0.3,
            movement: 'fire',
            glow: true,
            gradient: true
        });

        // 화염 기둥
        for (let i = 0; i < 5; i++) {
            const flame = this.createFlameColumn();
            const angle = (i / 5) * Math.PI * 2;
            flame.position.set(
                Math.cos(angle) * 2,
                -1,
                Math.sin(angle) * 2
            );
            flame.effectType = 'fire';
            this.scene.add(flame);
            this.effectObjects.push(flame);
        }
    }

    createFlameColumn() {
        const geometry = new THREE.ConeGeometry(0.3, 2, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const flame = new THREE.Mesh(geometry, material);
        flame.position.y = 1;
        return flame;
    }

    createIceEffect() {
        // 얼음 결정들
        for (let i = 0; i < 20; i++) {
            const crystal = this.createIceCrystal();
            crystal.position.set(
                (Math.random() - 0.5) * 6,
                Math.random() * 4,
                (Math.random() - 0.5) * 6
            );
            crystal.effectType = 'ice';
            crystal.floatSpeed = Math.random() * 0.02 + 0.01;
            this.scene.add(crystal);
            this.effectObjects.push(crystal);
        }

        // 얼음 바람 파티클
        this.createAdvancedParticles(0x88ddff, 100, 'ice', {
            size: 0.1,
            movement: 'wind',
            glow: true
        });
    }

    createIceCrystal() {
        const geometry = new THREE.ConeGeometry(0.1, 0.8, 6);
        const material = new THREE.MeshBasicMaterial({
            color: 0x88ddff,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        return new THREE.Mesh(geometry, material);
    }

    createLightningEffect() {
        // 번개 볼트들
        for (let i = 0; i < 8; i++) {
            const bolt = this.createLightningBolt();
            bolt.effectType = 'lightning';
            bolt.boltIndex = i;
            this.scene.add(bolt);
            this.effectObjects.push(bolt);
        }

        // 전기 구체
        const electricSphere = new THREE.Mesh(
            new THREE.SphereGeometry(2, 16, 16),
            new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.2,
                blending: THREE.AdditiveBlending,
                wireframe: true
            })
        );
        electricSphere.effectType = 'lightning';
        
        this.scene.add(electricSphere);
        this.effectObjects.push(electricSphere);
    }

    createLightningBolt() {
        const points = [];
        const segments = 20;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = (Math.random() - 0.5) * 0.5;
            const y = t * 4 - 2;
            const z = (Math.random() - 0.5) * 0.5;
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        return new THREE.Line(geometry, material);
    }

    createAdvancedParticles(color, count, effectType, options = {}) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const scales = [];
        
        for (let i = 0; i < count; i++) {
            positions.push(
                (Math.random() - 0.5) * 4,
                Math.random() * 4,
                (Math.random() - 0.5) * 4
            );
            
            switch (options.movement) {
                case 'fire':
                    velocities.push(
                        (Math.random() - 0.5) * 0.01,
                        Math.random() * 0.05 + 0.02,
                        (Math.random() - 0.5) * 0.01
                    );
                    break;
                case 'spiral':
                    velocities.push(
                        Math.random() * 0.02,
                        Math.random() * 0.01,
                        Math.random() * 0.02
                    );
                    break;
                case 'wind':
                    velocities.push(
                        Math.random() * 0.03,
                        (Math.random() - 0.5) * 0.01,
                        (Math.random() - 0.5) * 0.02
                    );
                    break;
                default:
                    velocities.push(
                        (Math.random() - 0.5) * 0.02,
                        Math.random() * 0.02,
                        (Math.random() - 0.5) * 0.02
                    );
            }
            
            scales.push(Math.random() * 0.5 + 0.5);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: color,
            size: options.size || 0.2,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.effectType = effectType;
        particles.velocities = velocities;
        particles.scales = scales;
        particles.options = options;
        
        this.scene.add(particles);
        this.effectObjects.push(particles);
        this.particles.push(particles);
    }

    updateEffects() {
        const time = Date.now() * 0.001;
        
        this.effectObjects.forEach(obj => {
            switch (obj.effectType) {
                case 'enhance':
                    if (obj.enhanceLayer !== undefined) {
                        obj.rotation.z += 0.01 * (obj.enhanceLayer + 1);
                        obj.material.opacity = 0.8 + Math.sin(time * 2 + obj.enhanceLayer) * 0.2;
                    }
                    break;
                    
                case 'holy':
                    if (obj.orbitAngle !== undefined) {
                        obj.orbitAngle += 0.02;
                        obj.position.x = Math.cos(obj.orbitAngle) * 4;
                        obj.position.z = Math.sin(obj.orbitAngle) * 4;
                        obj.position.y += Math.sin(time * 3) * 0.01;
                        obj.rotation.y += 0.05;
                    }
                    break;
                    
                case 'dark':
                    if (obj.baseAngle !== undefined) {
                        obj.rotation.y += 0.03;
                        obj.position.y = -1 + Math.sin(time * 2 + obj.baseAngle) * 0.5;
                    } else if (obj.geometry && obj.geometry.type === 'PlaneGeometry') {
                        obj.rotation.z += 0.02;
                        obj.material.opacity = 0.3 + Math.sin(time * 4) * 0.2;
                    }
                    break;
                    
                case 'sparkle':
                    if (obj.baseScale && obj.twinkleSpeed) {
                        const scale = obj.baseScale + Math.sin(time * obj.twinkleSpeed) * obj.baseScale * 0.5;
                        obj.scale.setScalar(scale);
                        obj.rotation.x += 0.1;
                        obj.rotation.y += 0.15;
                    }
                    break;
                    
                case 'fire':
                    if (obj.geometry && obj.geometry.type === 'ConeGeometry') {
                        obj.scale.x = 1 + Math.sin(time * 8) * 0.3;
                        obj.scale.z = 1 + Math.sin(time * 8) * 0.3;
                        obj.scale.y = 1 + Math.sin(time * 6) * 0.2;
                        obj.material.opacity = 0.4 + Math.random() * 0.4;
                    }
                    break;
                    
                case 'ice':
                    if (obj.floatSpeed) {
                        obj.position.y += Math.sin(time * 2) * obj.floatSpeed;
                        obj.rotation.y += 0.02;
                    }
                    break;
                    
                case 'lightning':
                    if (obj.boltIndex !== undefined) {
                        obj.material.opacity = Math.random() * 0.8 + 0.2;
                        if (Math.random() < 0.1) {
                            this.regenerateLightningBolt(obj);
                        }
                    } else if (obj.geometry && obj.geometry.type === 'SphereGeometry') {
                        obj.rotation.x += 0.05;
                        obj.rotation.y += 0.08;
                    }
                    break;
            }
        });

        // 파티클 업데이트
        this.particles.forEach(particleSystem => {
            const positions = particleSystem.geometry.attributes.position.array;
            const velocities = particleSystem.velocities;
            
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i];
                positions[i + 1] += velocities[i + 1];
                positions[i + 2] += velocities[i + 2];
                
                // 효과별 특수 처리
                if (particleSystem.effectType === 'fire' && positions[i + 1] > 5) {
                    positions[i] = (Math.random() - 0.5) * 2;
                    positions[i + 1] = -1;
                    positions[i + 2] = (Math.random() - 0.5) * 2;
                } else if (positions[i + 1] > 6 || positions[i + 1] < -3) {
                    positions[i] = (Math.random() - 0.5) * 4;
                    positions[i + 1] = Math.random() * 4;
                    positions[i + 2] = (Math.random() - 0.5) * 4;
                }
            }
            
            particleSystem.geometry.attributes.position.needsUpdate = true;
        });

        // 펄스 효과
        if (this.activeEffects.has('pulse') && this.model) {
            const intensity = (Math.sin(time * 4) + 1) * 0.3;
            this.model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(material => {
                        material.emissive = new THREE.Color(0x00ffff);
                        material.emissiveIntensity = intensity;
                    });
                }
            });
        }
    }

    createPulseEffect() {
        // 맥동 효과를 위한 객체 추가 (효과 제거 감지용)
        const pulseMarker = new THREE.Object3D();
        pulseMarker.effectType = 'pulse';
        this.scene.add(pulseMarker);
        this.effectObjects.push(pulseMarker);
        
        // 모델에 맥동 효과 적용
        if (this.model) {
            this.model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(material => {
                        material.emissive = new THREE.Color(0x00ffff);
                        material.emissiveIntensity = 0.3;
                    });
                }
            });
        }
    }

    regenerateLightningBolt(bolt) {
        const points = [];
        const segments = 20;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = (Math.random() - 0.5) * 0.8;
            const y = t * 4 - 2;
            const z = (Math.random() - 0.5) * 0.8;
            points.push(new THREE.Vector3(x, y, z));
        }
        
        bolt.geometry.setFromPoints(points);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        if (this.mixer) {
            this.mixer.update(delta);
        }
        
        this.updateEffects();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    new ModelViewer();
});
