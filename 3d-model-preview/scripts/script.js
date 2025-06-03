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
        
        // 모델 리스트는 JSON에서 로드됨
        this.modelList = [];
        this.currentModelIndex = 0;
        this.isLoading = false;
        this.modelsLoaded = false;
        
        this.settings = {
            autoRotate: true,
            wireframe: false,
            rotationSpeed: 0.5,
            backgroundColor: 0x1a1a1a,
            modelBrightness: 1,
            followSystemTheme: true
        };
        
        this.themeColors = {
            dark: 0x1a1a1a,
            light: 0xf5f5f5
        };
        
        this.init();
        this.setupThemeDetection();
        this.loadModelList(); // JSON 파일에서 모델 리스트 로드
        this.setupControls();
        this.animate();
    }
    
    async loadModelList() {
        try {
            const response = await fetch('./models/models.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.modelList = data.models || [];
            
            if (this.modelList.length === 0) {
                throw new Error('모델 리스트가 비어있습니다');
            }
            
            this.modelsLoaded = true;
            this.setupModelSelector();
            this.loadModel();
            
            console.log(`${this.modelList.length}개의 모델을 로드했습니다`);
        } catch (error) {
            console.error('모델 리스트 로딩 실패:', error);
            
            // 기본 모델 리스트로 폴백
            this.modelList = [
            ];
            
            this.modelsLoaded = true;
            this.setupModelSelector();
            this.loadModel();
            
            // 사용자에게 알림
            const loadingElement = document.getElementById('loading');
            const loadingText = loadingElement.querySelector('p');
            loadingText.innerHTML = 'JSON 파일 로딩 실패, 기본 모델을 사용합니다.<br>잠시 후 자동으로 로딩됩니다.';
            
            setTimeout(() => {
                if (this.modelsLoaded) {
                    loadingElement.style.display = 'none';
                }
            }, 2000);
        }
    }
    
    setupModelSelector() {
        if (!this.modelsLoaded || this.modelList.length === 0) {
            return;
        }
        
        const modelSelect = document.getElementById('model-select');
        
        // 기존 옵션들 제거
        modelSelect.innerHTML = '';
        
        // 모델 리스트로 옵션 생성
        this.modelList.forEach((model, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = model.name;
            if (model.description) {
                option.title = model.description;
            }
            if (index === this.currentModelIndex) {
                option.selected = true;
            }
            modelSelect.appendChild(option);
        });
        
        // 모델 선택 이벤트
        modelSelect.addEventListener('change', (e) => {
            const newIndex = parseInt(e.target.value);
            if (newIndex !== this.currentModelIndex && !this.isLoading) {
                this.switchModel(newIndex);
            }
        });
    }
    
    switchModel(newIndex) {
        if (newIndex < 0 || newIndex >= this.modelList.length || this.isLoading || !this.modelsLoaded) {
            return;
        }
        
        this.currentModelIndex = newIndex;
        this.isLoading = true;
        
        // 로딩 상태 표시
        const loadingElement = document.getElementById('loading');
        const loadingText = loadingElement.querySelector('p');
        loadingElement.style.display = 'block';
        loadingText.textContent = `${this.modelList[newIndex].name} 로딩중...`;
        
        // 기존 모델 제거
        if (this.model) {
            this.scene.remove(this.model);
            this.disposeObject(this.model);
            this.model = null;
        }
        
        // 기존 애니메이션 정리
        if (this.mixer) {
            this.mixer.stopAllActions();
            this.mixer = null;
        }
        
        // 새 모델 로드
        this.loadModel();
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
        
        // console.log(`테마 변경: ${isDarkMode ? '다크 모드' : '라이트 모드'}`);
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
        if (!this.modelsLoaded || this.modelList.length === 0) {
            console.warn('모델 리스트가 아직 로드되지 않았습니다');
            return;
        }
        
        const loader = new GLTFLoader();
        const currentModel = this.modelList[this.currentModelIndex];
        
        loader.load(
            currentModel.path,
            (gltf) => {
                this.model = gltf.scene;
                
                // 모델 최적화 및 매테리얼 수정
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // 매테리얼 처리 개선
                        if (child.material) {
                            const materials = Array.isArray(child.material) ? child.material : [child.material];
                            
                            materials.forEach(material => {
                                if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                                    material.envMapIntensity = 1;
                                    material.wireframe = this.settings.wireframe;
                                    material.needsUpdate = true;
                                } else if (material.isMeshBasicMaterial) {
                                    const newMaterial = new THREE.MeshStandardMaterial({
                                        map: material.map,
                                        color: material.color,
                                        transparent: material.transparent,
                                        opacity: material.opacity,
                                        wireframe: this.settings.wireframe
                                    });
                                    child.material = newMaterial;
                                }
                            });
                        }
                        
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
                const scale = 3 / maxDim;
                this.model.scale.multiplyScalar(scale);
                
                this.model.position.sub(center.multiplyScalar(scale));
                this.model.position.y = 0;
                
                this.scene.add(this.model);
                
                // 카메라 위치 및 타겟 조정
                this.camera.position.set(0, 0, 5);
                this.controls.target.set(0, 0, 0);
                this.controls.update();
                
                // 애니메이션 설정 (있는 경우)
                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(this.model);
                    gltf.animations.forEach((clip) => {
                        this.mixer.clipAction(clip).play();
                    });
                }
                
                // 로딩 완료
                this.isLoading = false;
                document.getElementById('loading').style.display = 'none';
                console.log(`${currentModel.name} 로드 완료`);
            },
            (progress) => {
                // console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error(`${currentModel.name} 로딩 실패:`, error);
                this.isLoading = false;
                const loadingElement = document.getElementById('loading');
                const loadingText = loadingElement.querySelector('p');
                loadingText.innerHTML = `${currentModel.name} 로딩에 실패했습니다.<br>파일 경로를 확인해주세요.`;
                
                // 3초 후 로딩 메시지 숨기기
                setTimeout(() => {
                    loadingElement.style.display = 'none';
                }, 3000);
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
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    new ModelViewer();
});
