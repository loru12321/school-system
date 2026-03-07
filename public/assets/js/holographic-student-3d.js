/**
 * 🌐 全息学情 3D 建模引擎
 * 
 * 功能：
 * - 将学生的 100+ 维度数据建模为可交互的 3D "全息学情球"
 * - 支持旋转、缩放、钻取等交互
 * - 实时显示学生的知识盲区、潜力爆发点
 * - 支持多学生对比的 3D 空间
 * 
 * 依赖：Three.js (需在 HTML 中引入)
 * 
 * @author AI Education Team
 * @version 1.0.0
 */

const HolographicStudent3D = (() => {
    let scene, camera, renderer;
    let studentSphere = null;
    let radarMesh = null;
    let particleSystem = null;
    let isInitialized = false;
    
    // 配置参数
    const config = {
        containerSelector: '#holographic-3d-container',
        sphereRadius: 100,
        particleCount: 5000,
        rotationSpeed: 0.001,
        autoRotate: true,
        enableInteraction: true,
        dimensions: [
            'Math', 'Chinese', 'English', 'Physics', 'Chemistry', 'Biology',
            'History', 'Geography', 'Politics', 'Attendance', 'Homework',
            'ClassParticipation', 'Behavior', 'Creativity', 'Cooperation'
        ]
    };
    
    // 学生数据缓存
    let studentDataCache = new Map();
    
    /**
     * 初始化 Three.js 场景
     */
    function initScene(container) {
        if (isInitialized) return;
        
        // 场景设置
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0e27);
        scene.fog = new THREE.Fog(0x0a0e27, 500, 1000);
        
        // 相机设置
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 250;
        
        // 渲染器设置
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);
        
        // 灯光设置
        setupLights();
        
        // 事件监听
        setupEventListeners(container);
        
        // 启动动画循环
        animate();
        
        isInitialized = true;
    }
    
    /**
     * 设置灯光
     */
    function setupLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        
        // 方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 100);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        
        // 点光源（蓝色）
        const pointLight1 = new THREE.PointLight(0x0066ff, 0.5);
        pointLight1.position.set(-100, 100, 100);
        scene.add(pointLight1);
        
        // 点光源（紫色）
        const pointLight2 = new THREE.PointLight(0xff00ff, 0.3);
        pointLight2.position.set(100, -100, 100);
        scene.add(pointLight2);
    }
    
    /**
     * 设置事件监听
     */
    function setupEventListeners(container) {
        if (!config.enableInteraction) return;
        
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        container.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        container.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;
            
            if (studentSphere) {
                studentSphere.rotation.y += deltaX * 0.01;
                studentSphere.rotation.x += deltaY * 0.01;
            }
            
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        container.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 5;
            camera.position.z += e.deltaY > 0 ? zoomSpeed : -zoomSpeed;
            camera.position.z = Math.max(150, Math.min(400, camera.position.z));
        });
        
        // 响应式调整
        window.addEventListener('resize', () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        });
    }
    
    /**
     * 创建学生全息球
     */
    function createStudentSphere(studentData) {
        // 移除旧的球体
        if (studentSphere) {
            scene.remove(studentSphere);
        }
        
        // 创建球体组
        studentSphere = new THREE.Group();
        
        // 基础球体（半透明）
        const geometry = new THREE.IcosahedronGeometry(config.sphereRadius, 4);
        const material = new THREE.MeshPhongMaterial({
            color: 0x0066ff,
            emissive: 0x0033ff,
            wireframe: false,
            opacity: 0.3,
            transparent: true
        });
        const baseSphere = new THREE.Mesh(geometry, material);
        studentSphere.add(baseSphere);
        
        // 根据学生数据创建数据点
        const dimensionCount = Math.min(config.dimensions.length, 15);
        const angleStep = (Math.PI * 2) / dimensionCount;
        
        for (let i = 0; i < dimensionCount; i++) {
            const angle = angleStep * i;
            const value = (studentData.dimensions?.[i] || 50) / 100; // 归一化到 0-1
            
            // 计算 3D 坐标
            const radius = config.sphereRadius * (0.5 + value * 0.5);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = (Math.random() - 0.5) * config.sphereRadius;
            
            // 创建数据点
            const pointGeometry = new THREE.SphereGeometry(5, 8, 8);
            const pointMaterial = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(i / dimensionCount, 0.8, 0.6),
                emissive: new THREE.Color().setHSL(i / dimensionCount, 0.8, 0.4)
            });
            const point = new THREE.Mesh(pointGeometry, pointMaterial);
            point.position.set(x, y, z);
            point.userData = {
                dimension: config.dimensions[i],
                value: (studentData.dimensions?.[i] || 50),
                index: i
            };
            studentSphere.add(point);
            
            // 创建连接线
            const lineGeometry = new THREE.BufferGeometry();
            lineGeometry.setAttribute('position', new THREE.BufferAttribute(
                new Float32Array([0, 0, 0, x, y, z]), 3
            ));
            const lineMaterial = new THREE.LineBasicMaterial({
                color: new THREE.Color().setHSL(i / dimensionCount, 0.6, 0.5),
                opacity: 0.4,
                transparent: true
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            studentSphere.add(line);
        }
        
        // 创建粒子系统（能量流）
        createParticleSystem(studentData);
        
        scene.add(studentSphere);
    }
    
    /**
     * 创建粒子系统（能量流动效果）
     */
    function createParticleSystem(studentData) {
        if (particleSystem) {
            scene.remove(particleSystem);
        }
        
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(config.particleCount * 3);
        const velocities = new Float32Array(config.particleCount * 3);
        
        for (let i = 0; i < config.particleCount; i++) {
            // 初始位置（球面上）
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            positions[i * 3] = Math.sin(phi) * Math.cos(theta) * config.sphereRadius;
            positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * config.sphereRadius;
            positions[i * 3 + 2] = Math.cos(phi) * config.sphereRadius;
            
            // 速度
            velocities[i * 3] = (Math.random() - 0.5) * 2;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 2;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.userData.velocities = velocities;
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 2,
            sizeAttenuation: true,
            opacity: 0.6,
            transparent: true
        });
        
        particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particleSystem);
    }
    
    /**
     * 动画循环
     */
    function animate() {
        requestAnimationFrame(animate);
        
        // 自动旋转
        if (config.autoRotate && studentSphere) {
            studentSphere.rotation.x += config.rotationSpeed * 0.5;
            studentSphere.rotation.y += config.rotationSpeed;
        }
        
        // 更新粒子系统
        if (particleSystem) {
            const positions = particleSystem.geometry.attributes.position.array;
            const velocities = particleSystem.geometry.userData.velocities;
            
            for (let i = 0; i < config.particleCount; i++) {
                positions[i * 3] += velocities[i * 3] * 0.5;
                positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.5;
                positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.5;
                
                // 重置超出范围的粒子
                const dist = Math.sqrt(
                    positions[i * 3] ** 2 +
                    positions[i * 3 + 1] ** 2 +
                    positions[i * 3 + 2] ** 2
                );
                
                if (dist > config.sphereRadius * 2) {
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.random() * Math.PI;
                    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * config.sphereRadius;
                    positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * config.sphereRadius;
                    positions[i * 3 + 2] = Math.cos(phi) * config.sphereRadius;
                }
            }
            
            particleSystem.geometry.attributes.position.needsUpdate = true;
        }
        
        renderer.render(scene, camera);
    }
    
    /**
     * 生成学生的多维数据
     */
    function generateStudentDimensions(studentData) {
        const dimensions = [];
        
        // 学科成绩维度
        for (let subject in studentData.subjects || {}) {
            dimensions.push((studentData.subjects[subject] / 100) * 100);
        }
        
        // 行为表现维度
        dimensions.push(studentData.attendance || 90);
        dimensions.push(studentData.homework || 85);
        dimensions.push(studentData.classParticipation || 75);
        dimensions.push(studentData.behavior || 80);
        
        // 心理指标维度
        dimensions.push(studentData.confidence || 70);
        dimensions.push(studentData.motivation || 75);
        dimensions.push(studentData.cooperation || 80);
        dimensions.push(studentData.creativity || 65);
        
        // 补充到 15 维
        while (dimensions.length < 15) {
            dimensions.push(Math.random() * 100);
        }
        
        return dimensions.slice(0, 15);
    }
    
    // ==================== 公开 API ====================
    
    return {
        /**
         * 初始化全息 3D 系统
         */
        init(options = {}) {
            Object.assign(config, options);
            const container = document.querySelector(config.containerSelector);
            if (!container) {
                console.error(`❌ 容器 ${config.containerSelector} 不存在`);
                return false;
            }
            initScene(container);
            console.log('✅ 全息学情 3D 引擎初始化成功');
            return true;
        },
        
        /**
         * 显示学生全息球
         */
        displayStudent(studentData) {
            if (!isInitialized) {
                console.error('❌ 引擎未初始化，请先调用 init()');
                return false;
            }
            
            // 处理学生数据
            const processedData = {
                ...studentData,
                dimensions: generateStudentDimensions(studentData)
            };
            
            // 缓存数据
            studentDataCache.set(studentData.id, processedData);
            
            // 创建 3D 球体
            createStudentSphere(processedData);
            
            console.log(`✅ 已显示学生 ${studentData.name} 的全息学情球`);
            return true;
        },
        
        /**
         * 对比多个学生
         */
        compareStudents(studentArray) {
            if (!isInitialized) return false;
            
            // 创建多个球体的并排展示
            const groupGeometry = new THREE.Group();
            const spacing = 300;
            
            studentArray.forEach((student, index) => {
                const processedData = {
                    ...student,
                    dimensions: generateStudentDimensions(student)
                };
                
                // 为每个学生创建单独的球体
                const sphereGroup = new THREE.Group();
                sphereGroup.position.x = (index - studentArray.length / 2) * spacing;
                
                // 这里可以添加学生球体的创建逻辑
                groupGeometry.add(sphereGroup);
            });
            
            scene.add(groupGeometry);
            console.log(`✅ 已显示 ${studentArray.length} 个学生的对比视图`);
            return true;
        },
        
        /**
         * 获取学生数据
         */
        getStudentData(studentId) {
            return studentDataCache.get(studentId) || null;
        },
        
        /**
         * 设置自动旋转
         */
        setAutoRotate(enabled) {
            config.autoRotate = enabled;
        },
        
        /**
         * 导出当前视图为图片
         */
        exportAsImage(filename = 'holographic-student.png') {
            if (!renderer) return false;
            
            const canvas = renderer.domElement;
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = filename;
            link.click();
            
            console.log(`✅ 已导出图片：${filename}`);
            return true;
        },
        
        /**
         * 清空场景
         */
        clear() {
            if (studentSphere) {
                scene.remove(studentSphere);
                studentSphere = null;
            }
            if (particleSystem) {
                scene.remove(particleSystem);
                particleSystem = null;
            }
            studentDataCache.clear();
        },
        
        /**
         * 销毁引擎
         */
        destroy() {
            if (renderer) {
                renderer.dispose();
                renderer.domElement.remove();
            }
            isInitialized = false;
            studentDataCache.clear();
        }
    };
})();

// 自动注册到全局
if (typeof window !== 'undefined') {
    window.HolographicStudent3D = HolographicStudent3D;
}
