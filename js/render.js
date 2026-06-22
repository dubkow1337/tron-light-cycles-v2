// ========== ОТРИСОВКА ==========

let particles = [];
let crashEffect = { active: false, x: 0, y: 0, color: '#ffffff', timer: 0 };
// boss объявлен в boss.js

// Эффекты взрыва - используем глобальную переменную
if (typeof window.explosionEffects === 'undefined') {
    window.explosionEffects = [];
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Единые настройки следа
const TRAIL_LENGTH = 50;
const TRAIL_FADE = true;

// cloneData объявлен в bonuses.js — НЕ ОБЪЯВЛЯЕМ ЕГО ЗДЕСЬ!

// ===== ВСПОМОГАТЕЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ АНИМАЦИИ =====
let gridOffset = 0;
let fogInitialized = false;

// ===== ТУМАН =====
let fogParticles = [];

function initFog() {
    if (fogInitialized) return;
    fogParticles = [];
    const count = 60;
    for (let i = 0; i < count; i++) {
        fogParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 30 + Math.random() * 80,
            speed: 0.1 + Math.random() * 0.2,
            angle: Math.random() * Math.PI * 2,
            opacity: 0.02 + Math.random() * 0.03,
            offset: Math.random() * 1000
        });
    }
    fogInitialized = true;
}

function updateFog() {
    const time = Date.now() * 0.001;
    for (let p of fogParticles) {
        p.x += Math.cos(p.angle + time * 0.05) * p.speed * 0.3;
        p.y += Math.sin(p.angle + time * 0.07) * p.speed * 0.3;
        
        if (p.x < -100) p.x = canvas.width + 100;
        if (p.x > canvas.width + 100) p.x = -100;
        if (p.y < -100) p.y = canvas.height + 100;
        if (p.y > canvas.height + 100) p.y = -100;
        
        p.opacity = (0.02 + Math.random() * 0.02) * (0.7 + 0.3 * Math.sin(time * 0.1 + p.offset));
    }
}

function drawFog() {
    for (let p of fogParticles) {
        const cx = p.x;
        const cy = p.y;
        const size = p.size;
        
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
        gradient.addColorStop(0, `rgba(0, 180, 255, ${p.opacity * 0.5})`);
        gradient.addColorStop(0.5, `rgba(0, 150, 255, ${p.opacity * 0.3})`);
        gradient.addColorStop(1, `rgba(0, 100, 200, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ===== ПАДАЮЩИЕ ОГНИ В БЕЗДНЕ =====
let fallingLights = [];

function initFallingLights() {
    fallingLights = [];
    for (let i = 0; i < 40; i++) {
        fallingLights.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.3 + canvas.height * 0.7,
            size: 1 + Math.random() * 2,
            speed: 0.2 + Math.random() * 0.4,
            opacity: 0.1 + Math.random() * 0.2,
            offset: Math.random() * 1000
        });
    }
}
initFallingLights();

function updateFallingLights() {
    const time = Date.now() * 0.001;
    for (let p of fallingLights) {
        p.y += p.speed;
        p.opacity = (0.1 + Math.random() * 0.1) * (0.7 + 0.3 * Math.sin(time * 0.2 + p.offset));
        if (p.y > canvas.height) {
            p.y = canvas.height * 0.7;
            p.x = Math.random() * canvas.width;
        }
    }
}

function drawFallingLights() {
    for (let p of fallingLights) {
        ctx.globalAlpha = p.opacity * 0.4;
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(0, 200, 255, 0.3)';
        ctx.fillStyle = '#00ccff';
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        ctx.fillRect(p.x - p.size/2 - 1, p.y - p.size/2 - 1, p.size + 2, p.size + 2);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

// ===== ОТРИСОВКА КРАСИВОГО ФОНА =====
function drawBackground() {
    const time = Date.now() * 0.001;
    const w = canvas.width;
    const h = canvas.height;
    
    // Градиентный фон
    const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
    gradient.addColorStop(0, '#0a1a2a');
    gradient.addColorStop(0.5, '#050d18');
    gradient.addColorStop(1, '#020408');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    // Неоновая дымка
    const glow1 = ctx.createRadialGradient(w*0.3, h*0.4, 0, w*0.3, h*0.4, w*0.3);
    glow1.addColorStop(0, `rgba(0, 150, 255, ${0.02 + 0.01 * Math.sin(time * 0.3)})`);
    glow1.addColorStop(1, 'rgba(0, 150, 255, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, w, h);
    
    const glow2 = ctx.createRadialGradient(w*0.7, h*0.6, 0, w*0.7, h*0.6, w*0.25);
    glow2.addColorStop(0, `rgba(0, 200, 255, ${0.015 + 0.01 * Math.sin(time * 0.4 + 1)})`);
    glow2.addColorStop(1, 'rgba(0, 200, 255, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, w, h);
    
    // Звезды
    const starCount = 80;
    for (let i = 0; i < starCount; i++) {
        const sx = (i * 137.5 + 42) % w;
        const sy = (i * 97.3 + 13) % h;
        const brightness = 0.1 + 0.15 * Math.sin(time * (0.2 + i * 0.01) + i);
        ctx.globalAlpha = brightness;
        ctx.fillStyle = '#88ccff';
        ctx.fillRect(sx, sy, 1, 1);
    }
    ctx.globalAlpha = 1;
}

// ===== ОТРИСОВКА КРАСИВОЙ СЕТКИ =====
function drawGrid() {
    const time = Date.now() * 0.001;
    
    // Основная сетка
    ctx.strokeStyle = 'rgba(15, 63, 58, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= WIDTH; i++) {
        const x = i * CELL_SIZE;
        const alpha = 0.15 + 0.05 * Math.sin(time * 0.3 + i * 0.1);
        ctx.strokeStyle = `rgba(15, 63, 58, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= HEIGHT; i++) {
        const y = i * CELL_SIZE;
        const alpha = 0.15 + 0.05 * Math.sin(time * 0.25 + i * 0.12);
        ctx.strokeStyle = `rgba(15, 63, 58, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Акцентные линии (каждые 5 клеток)
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= WIDTH; i += 5) {
        const x = i * CELL_SIZE;
        const alpha = 0.15 + 0.1 * Math.sin(time * 0.2 + i * 0.05);
        ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(0, 200, 255, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= HEIGHT; i += 5) {
        const y = i * CELL_SIZE;
        const alpha = 0.15 + 0.1 * Math.sin(time * 0.18 + i * 0.06);
        ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(0, 200, 255, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
}

// ===== НЕОНОВАЯ РАМКА ПО КРАЯМ =====
function drawNeonBorder() {
    const time = Date.now() * 0.001;
    const w = canvas.width;
    const h = canvas.height;
    const padding = 4;
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.8);
    
    // Основная рамка
    ctx.shadowBlur = 20 + 10 * pulse;
    ctx.shadowColor = `rgba(0, 200, 255, ${0.3 + 0.2 * pulse})`;
    ctx.strokeStyle = `rgba(0, 200, 255, ${0.4 + 0.3 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(padding, padding, w - padding * 2, h - padding * 2);
    
    // Внутренняя рамка (тонкая)
    ctx.shadowBlur = 40 + 20 * pulse;
    ctx.shadowColor = `rgba(0, 200, 255, ${0.1 + 0.1 * pulse})`;
    ctx.strokeStyle = `rgba(0, 200, 255, ${0.15 + 0.1 * pulse})`;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(padding + 8, padding + 8, w - padding * 2 - 16, h - padding * 2 - 16);
    
    // Угловые акценты
    const cornerSize = 20;
    const corners = [
        [padding, padding, 0, 0],
        [w - padding, padding, 1, 0],
        [padding, h - padding, 0, 1],
        [w - padding, h - padding, 1, 1]
    ];
    
    ctx.shadowBlur = 30 + 15 * pulse;
    ctx.shadowColor = `rgba(0, 200, 255, ${0.4 + 0.3 * pulse})`;
    ctx.strokeStyle = `rgba(0, 220, 255, ${0.6 + 0.4 * pulse})`;
    ctx.lineWidth = 2;
    
    for (let [cx, cy, dx, dy] of corners) {
        const signX = dx === 0 ? -1 : 1;
        const signY = dy === 0 ? -1 : 1;
        const x1 = cx + signX * cornerSize;
        const y1 = cy + signY * cornerSize;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x1, cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, y1);
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
}

// ============================================================
// ===== ОСНОВНЫЕ ФУНКЦИИ =====
// ============================================================

function explode(x, y, color) {
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        particles.push({
            x: x * CELL_SIZE + CELL_SIZE / 2,
            y: y * CELL_SIZE + CELL_SIZE / 2,
            vx: vx, vy: vy,
            life: 0.8,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

function addParticles(x, y, color) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: x * CELL_SIZE + CELL_SIZE / 2,
            y: y * CELL_SIZE + CELL_SIZE / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 0.5,
            color: color,
            size: Math.random() * 3 + 1
        });
    }
}

function updateParticles() {
    for (let i = 0; i < particles.length; i++) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life -= 0.02;
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
    if (typeof updateFireworks === 'function') {
        updateFireworks();
    }
}

function drawParticles() {
    for (let p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

// ===== УНИВЕРСАЛЬНАЯ ОТРИСОВКА СЛЕДА =====
function drawTrail(trail, color, shadowColor, lineWidth) {
    if (!trail || trail.length < 2) return;
    
    const len = trail.length;
    const maxLen = TRAIL_LENGTH;
    const start = Math.max(0, len - maxLen);
    const points = trail.slice(start);
    const pointsLen = points.length;
    
    if (pointsLen < 2) return;
    
    for (let i = 0; i < pointsLen - 1; i++) {
        const progress = i / pointsLen;
        const alpha = TRAIL_FADE ? Math.pow(progress, 0.6) : 1;
        
        ctx.beginPath();
        ctx.lineWidth = lineWidth || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 6 * alpha;
        ctx.shadowColor = shadowColor || color;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        
        const p1 = points[i];
        const p2 = points[i+1];
        ctx.moveTo(p1.x * CELL_SIZE + CELL_SIZE/2, p1.y * CELL_SIZE + CELL_SIZE/2);
        ctx.lineTo(p2.x * CELL_SIZE + CELL_SIZE/2, p2.y * CELL_SIZE + CELL_SIZE/2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

// ===== ЭФФЕКТЫ ВЗРЫВА =====
function createExplosionEffect(centerX, centerY, radius) {
    const effects = window.explosionEffects;
    
    effects.push({
        x: centerX * CELL_SIZE + CELL_SIZE / 2,
        y: centerY * CELL_SIZE + CELL_SIZE / 2,
        radius: 0,
        maxRadius: radius * CELL_SIZE,
        life: 1.0,
        color: '#ff4400'
    });
    
    const count = 60 + Math.floor(Math.random() * 40);
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        const colors = ['#ff4400', '#ff8800', '#ffcc00', '#ff2200', '#ffffff'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push({
            x: centerX * CELL_SIZE + CELL_SIZE / 2,
            y: centerY * CELL_SIZE + CELL_SIZE / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color: color,
            size: Math.random() * 6 + 2
        });
    }
}

function updateExplosionEffects() {
    const effects = window.explosionEffects;
    for (let i = effects.length - 1; i >= 0; i--) {
        const e = effects[i];
        e.radius += 2;
        e.life -= 0.02;
        
        if (e.life <= 0 || e.radius >= e.maxRadius) {
            effects.splice(i, 1);
        }
    }
}

function drawExplosionEffects() {
    const effects = window.explosionEffects;
    for (let e of effects) {
        ctx.save();
        ctx.globalAlpha = e.life * 0.6;
        
        ctx.shadowBlur = 40;
        ctx.shadowColor = e.color;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.shadowBlur = 60;
        ctx.shadowColor = '#ff8800';
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        if (e.radius < e.maxRadius * 0.3) {
            ctx.shadowBlur = 80;
            ctx.shadowColor = '#ffffff';
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(e.x, e.y, 4 * (1 - e.radius / (e.maxRadius * 0.3)), 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// ============================================================
// ===== ГЛАВНАЯ ФУНКЦИЯ DRAW =====
// ============================================================

function draw() {
    if (!ctx) return;
    
    // ===== 1. ФОН =====
    drawBackground();
    
    // ===== 2. ИНИЦИАЛИЗАЦИЯ ТУМАНА =====
    if (!fogInitialized) {
        initFog();
    }
    updateFog();
    
    // ===== 3. САЛЮТ =====
    if (typeof drawFireworks === 'function') {
        drawFireworks();
    }
    
    // ===== 4. РИСУЕМ ТУМАН (под игрой) =====
    drawFog();
    
    // ===== 5. ПАДАЮЩИЕ ОГНИ В БЕЗДНЕ =====
    updateFallingLights();
    drawFallingLights();
    
    // ===== 6. СЕТКА =====
    drawGrid();
    
    // ===== 7. НЕОНОВАЯ РАМКА =====
    drawNeonBorder();
    
    // ===== 8. СЛЕДЫ =====
    if (typeof players !== 'undefined') {
        for (let p of players) {
            drawTrail(p.trail, p.trailColor, p.trailColor, 3);
        }
    }
    
    if (typeof cloneData !== 'undefined' && cloneData && cloneData.active && cloneData.trail && cloneData.trail.length > 1) {
        drawTrail(cloneData.trail, '#ff44ff', '#ff44ff', 3);
    }
    
    if (typeof survivalEnemies !== 'undefined') {
        for (let e of survivalEnemies) {
            drawTrail(e.trail, e.trailColor, e.trailColor, 3);
        }
        for (let e of survivalEnemies) {
            const cx = e.x * CELL_SIZE + CELL_SIZE / 2;
            const cy = e.y * CELL_SIZE + CELL_SIZE / 2;
            ctx.save();
            ctx.translate(cx, cy);
            if (e.dirX === 1) ctx.rotate(0);
            else if (e.dirX === -1) ctx.rotate(Math.PI);
            else if (e.dirY === -1) ctx.rotate(-Math.PI / 2);
            else if (e.dirY === 1) ctx.rotate(Math.PI / 2);
            ctx.shadowBlur = 8;
            ctx.shadowColor = e.color;
            ctx.fillStyle = e.color;
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(-4, -5);
            ctx.lineTo(-4, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
    
    if (typeof boss !== 'undefined' && boss && boss.alive) {
        drawTrail(boss.trail, boss.trailColor || '#ff2200', boss.trailColor || '#ff2200', 5);
        const size = boss.size || 3;
        const cx = boss.x * CELL_SIZE + (size * CELL_SIZE) / 2;
        const cy = boss.y * CELL_SIZE + (size * CELL_SIZE) / 2;
        ctx.save();
        ctx.translate(cx, cy);
        if (boss.dirX === 1) ctx.rotate(0);
        else if (boss.dirX === -1) ctx.rotate(Math.PI);
        else if (boss.dirY === -1) ctx.rotate(-Math.PI / 2);
        else if (boss.dirY === 1) ctx.rotate(Math.PI / 2);
        ctx.shadowBlur = 25;
        ctx.shadowColor = boss.color || '#ff3300';
        ctx.fillStyle = boss.color || '#ff3300';
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -14);
        ctx.lineTo(-10, -5);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-10, 5);
        ctx.lineTo(-10, 14);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        if (boss.maxHealth) {
            const healthBarWidth = 60;
            const healthBarX = boss.x * CELL_SIZE - healthBarWidth/2 + (size * CELL_SIZE) / 2;
            const healthBarY = boss.y * CELL_SIZE - 16;
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth, 4);
            ctx.fillStyle = '#ff3300';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth * (boss.health / boss.maxHealth), 4);
        }
    }
    
    // ===== 9. БОНУСЫ =====
    if (typeof drawBonuses === 'function') {
        drawBonuses();
    }
    
    // ===== 10. ИНДИКАТОРЫ =====
    if (typeof drawBonusIndicators === 'function') {
        drawBonusIndicators();
    }
    
    // ===== 11. ЧАСТИЦЫ =====
    drawParticles();
    
    // ===== 12. ЭФФЕКТЫ ВЗРЫВА =====
    if (typeof drawExplosionEffects === 'function') {
        drawExplosionEffects();
    }
    
    if (crashEffect.active) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = crashEffect.color;
        ctx.fillRect(crashEffect.x * CELL_SIZE, crashEffect.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        crashEffect.timer--;
        if (crashEffect.timer <= 0) crashEffect.active = false;
    }
    
    // ===== 13. МОТОЦИКЛЫ =====
    if (typeof players !== 'undefined') {
        for (let p of players) {
            if (p.alive) {
                const cx = p.x * CELL_SIZE + CELL_SIZE / 2;
                const cy = p.y * CELL_SIZE + CELL_SIZE / 2;
                ctx.save();
                ctx.translate(cx, cy);
                if (p.dirX === 1) ctx.rotate(0);
                else if (p.dirX === -1) ctx.rotate(Math.PI);
                else if (p.dirY === -1) ctx.rotate(-Math.PI / 2);
                else if (p.dirY === 1) ctx.rotate(Math.PI / 2);
                ctx.shadowBlur = 12 + 3 * Math.sin(Date.now() * 0.01);
                ctx.shadowColor = p.color;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(-5, -7);
                ctx.lineTo(-5, 7);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.moveTo(5, 0);
                ctx.lineTo(-2, -3);
                ctx.lineTo(-2, 3);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }
    }
    
    if (typeof cloneData !== 'undefined' && cloneData && cloneData.active && players[0] && players[0].alive) {
        const cloneX = players[0].x + (cloneData.offsetX || 2);
        const cloneY = players[0].y + (cloneData.offsetY || 0);
        
        if (cloneX >= 0 && cloneX < WIDTH && cloneY >= 0 && cloneY < HEIGHT) {
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.translate(cloneX * CELL_SIZE + CELL_SIZE/2, cloneY * CELL_SIZE + CELL_SIZE/2);
            
            if (players[0].dirX === 1) ctx.rotate(0);
            else if (players[0].dirX === -1) ctx.rotate(Math.PI);
            else if (players[0].dirY === -1) ctx.rotate(-Math.PI / 2);
            else if (players[0].dirY === 1) ctx.rotate(Math.PI / 2);
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff44ff';
            ctx.fillStyle = '#ff44ff';
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-5, -6);
            ctx.lineTo(-5, 6);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(5, 0);
            ctx.lineTo(-2, -3);
            ctx.lineTo(-2, 3);
            ctx.closePath();
            ctx.fill();
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }
    
    // ===== 14. ТЕКСТ =====
    if (typeof countdownActive !== 'undefined' && countdownActive) {
        ctx.font = 'bold 64px "Courier New"';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#00ffff';
        let text = countdownValue > 0 ? countdownValue.toString() : '';
        if (countdownValue === 0) text = 'GO!';
        if (text) {
            let scale = 1 + Math.sin(Date.now() * 0.02) * 0.2;
            ctx.save();
            ctx.translate(canvas.width/2, canvas.height/2);
            ctx.scale(scale, scale);
            ctx.fillText(text, -ctx.measureText(text).width/2, 20);
            ctx.restore();
        }
    }
    
    if (paused && gameActive && !countdownActive) {
        ctx.font = 'bold 36px "Courier New"';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('⏸ ПАУЗА', canvas.width/2 - 70, canvas.height/2);
    }
    
    ctx.shadowBlur = 0;
}

// ============================================================
// ===== САЛЮТ =====
// ============================================================

let fireworkParticles = [];
let fireworkActive = false;

function startFireworks(color, count = 6) {
    try {
        if (!canvas || !ctx) return;
        fireworkParticles = [];
        fireworkActive = true;
        const colors = color === '#00ffff' ? ['#00ffff', '#0088ff', '#00ffcc'] : ['#ffaa00', '#ff6600', '#ffcc44'];
        
        for (let burst = 0; burst < count; burst++) {
            const x1 = 50 + Math.random() * 150;
            const y1 = 50 + Math.random() * (canvas.height - 100);
            createFireworkBurst(x1, y1, colors);
            const x2 = canvas.width - 50 - Math.random() * 150;
            const y2 = 50 + Math.random() * (canvas.height - 100);
            createFireworkBurst(x2, y2, colors);
        }
        
        setTimeout(() => {
            fireworkActive = false;
            fireworkParticles = [];
        }, 5000);
    } catch(e) {
        console.warn('Салют не удался:', e);
    }
}

function createFireworkBurst(x, y, colors) {
    const count = 50 + Math.floor(Math.random() * 40);
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 2 + Math.random() * 4;
        fireworkParticles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            decay: 0.01 + Math.random() * 0.02,
            color: color,
            size: size
        });
    }
}

function updateFireworks() {
    if (!fireworkActive) return;
    try {
        for (let i = fireworkParticles.length - 1; i >= 0; i--) {
            const p = fireworkParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.03;
            p.vx *= 0.99;
            p.life -= p.decay;
            if (p.life <= 0) {
                fireworkParticles.splice(i, 1);
            }
        }
    } catch(e) {}
}

function drawFireworks() {
    if (!fireworkActive || fireworkParticles.length === 0) return;
    try {
        for (const p of fireworkParticles) {
            ctx.globalAlpha = p.life;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    } catch(e) {}
        }
