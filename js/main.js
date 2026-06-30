import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
 
// ============================================================
// ===== 1. СЦЕНА, КАМЕРА, РЕНДЕР =====
// ============================================================

const container = document.getElementById('gameContainer');
const canvas = document.getElementById('gameCanvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020408);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(25, 28, 32);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// ============================================================
// ===== 2. ПОСТ-ОБРАБОТКА (НЕОНОВОЕ СВЕЧЕНИЕ) =====
// ============================================================

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.4,   // Сила свечения
    0.3,   // Радиус
    0.1    // Порог
);
composer.addPass(bloomPass);

// ============================================================
// ===== 3. УПРАВЛЕНИЕ КАМЕРОЙ =====
// ============================================================

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 0, 0);
controls.maxPolarAngle = Math.PI / 2.2;
controls.minDistance = 10;
controls.maxDistance = 80;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.3;

// ============================================================
// ===== 4. СВЕТ =====
// ============================================================

const ambientLight = new THREE.AmbientLight(0x222244, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x00ffff, 2.5);
dirLight.position.set(15, 30, 15);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 80;
dirLight.shadow.camera.left = -40;
dirLight.shadow.camera.right = 40;
dirLight.shadow.camera.top = 40;
dirLight.shadow.camera.bottom = -40;
scene.add(dirLight);

const backLight = new THREE.DirectionalLight(0x0088ff, 0.8);
backLight.position.set(-15, 20, -20);
scene.add(backLight);

const fillLight = new THREE.DirectionalLight(0x4400ff, 0.3);
fillLight.position.set(0, 10, -30);
scene.add(fillLight);

// ============================================================
// ===== 5. НЕОНОВАЯ СЕТКА (3D) =====
// ============================================================

const gridGroup = new THREE.Group();
const gridSize = 40;
const cellSize = 2;

// Основные линии
const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.12
});

for (let i = -gridSize; i <= gridSize; i += cellSize) {
    const points1 = [
        new THREE.Vector3(i, 0, -gridSize),
        new THREE.Vector3(i, 0, gridSize)
    ];
    const geo1 = new THREE.BufferGeometry().setFromPoints(points1);
    const line1 = new THREE.Line(geo1, lineMaterial);
    gridGroup.add(line1);

    const points2 = [
        new THREE.Vector3(-gridSize, 0, i),
        new THREE.Vector3(gridSize, 0, i)
    ];
    const geo2 = new THREE.BufferGeometry().setFromPoints(points2);
    const line2 = new THREE.Line(geo2, lineMaterial);
    gridGroup.add(line2);
}

// Акцентные линии (каждые 10 клеток)
const accentMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.25
});

for (let i = -gridSize; i <= gridSize; i += 10) {
    const points1 = [
        new THREE.Vector3(i, 0, -gridSize),
        new THREE.Vector3(i, 0, gridSize)
    ];
    const geo1 = new THREE.BufferGeometry().setFromPoints(points1);
    const line1 = new THREE.Line(geo1, accentMaterial);
    gridGroup.add(line1);

    const points2 = [
        new THREE.Vector3(-gridSize, 0, i),
        new THREE.Vector3(gridSize, 0, i)
    ];
    const geo2 = new THREE.BufferGeometry().setFromPoints(points2);
    const line2 = new THREE.Line(geo2, accentMaterial);
    gridGroup.add(line2);
}

// Центральный крест (яркий)
const crossMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.4
});

const crossPoints1 = [
    new THREE.Vector3(0, 0, -gridSize),
    new THREE.Vector3(0, 0, gridSize)
];
const crossGeo1 = new THREE.BufferGeometry().setFromPoints(crossPoints1);
const crossLine1 = new THREE.Line(crossGeo1, crossMaterial);
gridGroup.add(crossLine1);

const crossPoints2 = [
    new THREE.Vector3(-gridSize, 0, 0),
    new THREE.Vector3(gridSize, 0, 0)
];
const crossGeo2 = new THREE.BufferGeometry().setFromPoints(crossPoints2);
const crossLine2 = new THREE.Line(crossGeo2, crossMaterial);
gridGroup.add(crossLine2);

scene.add(gridGroup);

// ============================================================
// ===== 6. НЕОНОВАЯ РАМКА =====
// ============================================================

const borderMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.15
});

const borderPoints = [
    new THREE.Vector3(-gridSize, 0, -gridSize),
    new THREE.Vector3(gridSize, 0, -gridSize),
    new THREE.Vector3(gridSize, 0, gridSize),
    new THREE.Vector3(-gridSize, 0, gridSize),
    new THREE.Vector3(-gridSize, 0, -gridSize)
];
const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
const borderLine = new THREE.Line(borderGeo, borderMaterial);
scene.add(borderLine);

// ============================================================
// ===== 7. МОТОЦИКЛ (3D-МОДЕЛЬ) =====
// ============================================================

function createBike(color, emissiveColor) {
    const group = new THREE.Group();
    
    // Корпус
    const bodyGeo = new THREE.BoxGeometry(1.2, 0.3, 2.5);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: emissiveColor,
        emissiveIntensity: 0.4,
        metalness: 0.9,
        roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);
    
    // Передняя часть
    const frontGeo = new THREE.BoxGeometry(0.8, 0.2, 0.8);
    const frontMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: emissiveColor,
        emissiveIntensity: 0.3,
        metalness: 0.9,
        roughness: 0.2
    });
    const front = new THREE.Mesh(frontGeo, frontMat);
    front.position.set(0, 0.35, 1.6);
    front.castShadow = true;
    group.add(front);
    
    // Колеса (диски)
    const wheelMat = new THREE.MeshStandardMaterial({
        color: emissiveColor,
        emissive: emissiveColor,
        emissiveIntensity: 0.6,
        metalness: 0.9,
        roughness: 0.1
    });
    const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 16);
    
    const wheel1 = new THREE.Mesh(wheelGeo, wheelMat);
    wheel1.position.set(0.8, 0.15, 0.9);
    wheel1.rotation.x = Math.PI / 2;
    wheel1.castShadow = true;
    group.add(wheel1);
    
    const wheel2 = new THREE.Mesh(wheelGeo, wheelMat);
    wheel2.position.set(0.8, 0.15, -0.9);
    wheel2.rotation.x = Math.PI / 2;
    wheel2.castShadow = true;
    group.add(wheel2);
    
    // Свечение под мотоциклом
    const glowGeo = new THREE.PlaneGeometry(2, 3);
    const glowMat = new THREE.MeshBasicMaterial({
        color: emissiveColor,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.01;
    group.add(glow);
    
    return group;
}

// ============================================================
// ===== 8. ИГРОВЫЕ ОБЪЕКТЫ =====
// ============================================================

const player1Bike = createBike(0x00ffff, 0x00ffff);
player1Bike.position.set(-15, 0, 0);
scene.add(player1Bike);

const player2Bike = createBike(0xffaa00, 0xffaa00);
player2Bike.position.set(15, 0, 0);
scene.add(player2Bike);

// ============================================================
// ===== 9. ЭФФЕКТЫ (ВЗРЫВЫ, ЧАСТИЦЫ) =====
// ============================================================

let particleSystems = [];

function createExplosion(position, color) {
    const count = 150;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    const colorObj = new THREE.Color(color);
    
    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 1 + Math.random() * 4;
        
        positions[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
        positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
        positions[i * 3 + 2] = Math.cos(phi) * speed;
        
        colors[i * 3] = colorObj.r;
        colors[i * 3 + 1] = colorObj.g;
        colors[i * 3 + 2] = colorObj.b;
        
        sizes[i] = 0.1 + Math.random() * 0.3;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.position.copy(position);
    scene.add(particles);
    
    particleSystems.push({
        mesh: particles,
        life: 1.0,
        speed: 0.02
    });
}

function updateParticles() {
    for (let i = particleSystems.length - 1; i >= 0; i--) {
        const p = particleSystems[i];
        p.life -= p.speed;
        p.mesh.material.opacity = p.life;
        p.mesh.scale.setScalar(1 + (1 - p.life) * 0.5);
        
        if (p.life <= 0) {
            scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
            particleSystems.splice(i, 1);
        }
    }
}

// ============================================================
// ===== 10. АНИМАЦИЯ =====
// ============================================================

let time = 0;

function animate() {
    requestAnimationFrame(animate);
    time += 0.01;
    
    // Вращение мотоциклов (тест)
    player1Bike.rotation.y += 0.01;
    player2Bike.rotation.y -= 0.01;
    
    // Пульсация мотоциклов
    const pulse = 0.8 + 0.2 * Math.sin(time * 2);
    player1Bike.children.forEach(child => {
        if (child.material && child.material.emissiveIntensity !== undefined) {
            child.material.emissiveIntensity = 0.3 * pulse;
        }
    });
    player2Bike.children.forEach(child => {
        if (child.material && child.material.emissiveIntensity !== undefined) {
            child.material.emissiveIntensity = 0.3 * pulse;
        }
    });
    
    // Пульсация сетки
    gridGroup.children.forEach((line, index) => {
        if (line.material) {
            const baseOpacity = index % 2 === 0 ? 0.12 : 0.25;
            line.material.opacity = baseOpacity * (0.8 + 0.2 * Math.sin(time * 0.3 + index * 0.1));
        }
    });
    
    updateParticles();
    controls.update();
    composer.render();
}

// ============================================================
// ===== 11. АДАПТАЦИЯ =====
// ============================================================

window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
});

// ============================================================
// ===== 12. УПРАВЛЕНИЕ =====
// ============================================================

document.addEventListener('keydown', (e) => {
    const speed = 0.5;
    switch(e.key) {
        case 'ArrowUp':
            player1Bike.position.z -= speed;
            break;
        case 'ArrowDown':
            player1Bike.position.z += speed;
            break;
        case 'ArrowLeft':
            player1Bike.position.x -= speed;
            break;
        case 'ArrowRight':
            player1Bike.position.x += speed;
            break;
        case 'w':
            player2Bike.position.z -= speed;
            break;
        case 's':
            player2Bike.position.z += speed;
            break;
        case 'a':
            player2Bike.position.x -= speed;
            break;
        case 'd':
            player2Bike.position.x += speed;
            break;
        case ' ':
            // Тестовый взрыв
            createExplosion(
                new THREE.Vector3(
                    (Math.random() - 0.5) * 20,
                    0,
                    (Math.random() - 0.5) * 20
                ),
                0x00ffff
            );
            break;
    }
});

// ============================================================
// ===== 13. ЗАПУСК =====
// ============================================================

console.log('🚀 TRON 3D ЗАПУЩЕН!');
console.log('📖 Управление:');
console.log('  🔵 Синий: стрелки');
console.log('  🟠 Оранжевый: WASD');
console.log('  ␣ Пробел: тестовый взрыв');

animate();
