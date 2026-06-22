// ========== БОНУСЫ ==========

let bonuses = [];
let bonusTimer = 0;
const BONUS_SPAWN_INTERVAL = 1000;
const MAX_BONUSES = 3;

// Активные эффекты
let bonusEffects = {
    speed: { active: false, endTime: 0, duration: 5000 },
    shield: { active: false, endTime: 0, duration: 5000 },
    clone: { active: false, endTime: 0, duration: 3000 },
    explosion: { active: false, endTime: 0, duration: 0 }
};

// Данные для клона
let cloneData = {
    active: false,
    offsetX: 2,
    offsetY: 0,
    trail: []
};

// ===== ОТДЕЛЬНАЯ СИСТЕМА ЭФФЕКТОВ ВЗРЫВА (НЕ ЗАВИСИТ ОТ ИГРЫ) =====
// Используем window для глобального доступа
window.explosionEffects = window.explosionEffects || [];

const BONUS_TYPES = {
    speed: {
        name: 'Ускорение',
        color: '#00ff00',
        symbol: '⚡',
        duration: 5000,
        apply: () => {
            bonusEffects.speed.active = true;
            bonusEffects.speed.endTime = Date.now() + 5000;
            showMessage('⚡ СКОРОСТЬ УВЕЛИЧЕНА! (5 сек)');
        }
    },
    shield: {
        name: 'Щит',
        color: '#0088ff',
        symbol: '🛡️',
        duration: 5000,
        apply: () => {
            bonusEffects.shield.active = true;
            bonusEffects.shield.endTime = Date.now() + 5000;
            showMessage('🛡️ ЩИТ АКТИВИРОВАН! (5 сек неуязвимости)');
        }
    },
    clone: {
        name: 'Клон',
        color: '#ff44ff',
        symbol: '🌀',
        duration: 3000,
        apply: () => {
            bonusEffects.clone.active = true;
            bonusEffects.clone.endTime = Date.now() + 3000;
            
            cloneData.active = true;
            cloneData.offsetX = 2;
            cloneData.offsetY = 0;
            cloneData.trail = [];
            
            if (players[0] && players[0].trail) {
                cloneData.trail = [...players[0].trail];
            }
            
            showMessage('🌀 КЛОН АКТИВИРОВАН! (3 сек)');
        }
    },
    explosion: {
        name: 'Взрыв',
        color: '#ff4400',
        symbol: '💥',
        duration: 0,
        apply: (player) => {
            if (typeof triggerExplosion === 'function') {
                triggerExplosion(player);
            }
            showMessage('💥 ВЗРЫВ АКТИВИРОВАН!');
        }
    }
};

// ===== ФУНКЦИЯ ВЗРЫВА =====
function triggerExplosion(player) {
    if (!player || !player.alive) return;
    
    const radius = 7;
    const centerX = player.x;
    const centerY = player.y;
    
    // ===== СОЗДАЕМ ЭФФЕКТ ВЗРЫВА (НЕЗАВИСИМО ОТ ИГРЫ) =====
    createExplosionEffect(centerX, centerY, radius);
    
    // Звук взрыва
    if (typeof playExplosionSound === 'function') {
        playExplosionSound();
    }
    
    let destroyedCount = 0;
    let destroyedNames = [];
    
    // Проверяем всех игроков
    for (let p of players) {
        if (p === player || !p.alive) continue;
        
        const dx = Math.abs(p.x - centerX);
        const dy = Math.abs(p.y - centerY);
        
        if (dx <= radius && dy <= radius) {
            p.alive = false;
            destroyedCount++;
            destroyedNames.push(p.name);
            
            if (typeof explode === 'function') {
                explode(p.x, p.y, p.color);
            }
            
            if (player === players[0]) {
                players[0].score++;
            } else if (player === players[1] && opponentType === '2p') {
                players[1].score++;
            }
            
            // Маленький эффект на месте врага
            createExplosionEffect(p.x, p.y, 2);
        }
    }
    
    // Проверяем бота
    if (opponentType === 'ai' && players[1].alive) {
        const dx = Math.abs(players[1].x - centerX);
        const dy = Math.abs(players[1].y - centerY);
        
        if (dx <= radius && dy <= radius) {
            players[1].alive = false;
            destroyedCount++;
            destroyedNames.push('БОТА');
            
            if (typeof explode === 'function') {
                explode(players[1].x, players[1].y, players[1].color);
            }
            players[0].score++;
            createExplosionEffect(players[1].x, players[1].y, 2);
        }
    }
    
    // Проверяем врагов в режиме "Выживание"
    if (typeof survivalEnemies !== 'undefined') {
        for (let i = survivalEnemies.length - 1; i >= 0; i--) {
            const e = survivalEnemies[i];
            if (!e.alive) continue;
            
            const dx = Math.abs(e.x - centerX);
            const dy = Math.abs(e.y - centerY);
            
            if (dx <= radius && dy <= radius) {
                e.alive = false;
                destroyedCount++;
                destroyedNames.push('ВРАГА');
                
                if (typeof explode === 'function') {
                    explode(e.x, e.y, e.color);
                }
                survivalEnemies.splice(i, 1);
                createExplosionEffect(e.x, e.y, 2);
            }
        }
    }
    
    // Проверяем босса
    if (typeof boss !== 'undefined' && boss && boss.alive) {
        const dx = Math.abs(boss.x - centerX);
        const dy = Math.abs(boss.y - centerY);
        
        if (dx <= radius && dy <= radius) {
            boss.health -= 3;
            createExplosionEffect(boss.x, boss.y, 4);
            
            if (boss.health <= 0) {
                boss.alive = false;
                destroyedCount++;
                destroyedNames.push('БОССА');
                showMessage('💥 БОСС УНИЧТОЖЕН ВЗРЫВОМ!');
                
                if (player === players[0]) {
                    players[0].score += 5;
                } else if (player === players[1] && opponentType === '2p') {
                    players[1].score += 5;
                }
            } else {
                showMessage(`💥 БОССУ НАНЕСЕН УРОН! HP: ${boss.health}/${boss.maxHealth}`);
            }
        }
    }
    
    if (destroyedCount > 0) {
        const names = destroyedNames.join(', ');
        showMessage(`💥 ВЗРЫВ УНИЧТОЖИЛ: ${names} (${destroyedCount})`);
        if (typeof updateUI === 'function') updateUI();
    } else {
        showMessage('💥 ВЗРЫВ НЕ ЗАДЕЛ ВРАГОВ!');
    }
    
    // Проверяем победу
    const alivePlayers = players.filter(p => p.alive);
    if (alivePlayers.length === 1 && destroyedCount > 0) {
        let winnerIdx = players.findIndex(p => p.alive);
        if (winnerIdx !== -1) {
            if (typeof showVictory === 'function') {
                showVictory(players[winnerIdx].name);
            }
            if (typeof updateUI === 'function') updateUI();
        }
    }
}

// ===== ЭФФЕКТЫ ВЗРЫВА (ПОЛНОСТЬЮ САМОСТОЯТЕЛЬНАЯ СИСТЕМА) =====
function createExplosionEffect(centerX, centerY, radius) {
    // Создаем волну взрыва в глобальном массиве
    window.explosionEffects.push({
        x: centerX * CELL_SIZE + CELL_SIZE / 2,
        y: centerY * CELL_SIZE + CELL_SIZE / 2,
        radius: 0,
        maxRadius: radius * CELL_SIZE,
        life: 1.0,
        color: '#ff4400',
        // Флаг, что эффект должен жить ДО КОНЦА анимации
        // даже если игра перезапустится
        persistent: true
    });
    
    // Создаем частицы (тоже в глобальном массиве particles)
    const count = 60 + Math.floor(Math.random() * 40);
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        const colors = ['#ff4400', '#ff8800', '#ffcc00', '#ff2200', '#ffffff'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        if (typeof particles !== 'undefined') {
            particles.push({
                x: centerX * CELL_SIZE + CELL_SIZE / 2,
                y: centerY * CELL_SIZE + CELL_SIZE / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: color,
                size: Math.random() * 6 + 2,
                persistent: true // Частицы тоже живут до конца
            });
        }
    }
}

// Обновление эффектов взрыва (вызывается из game.js)
function updateExplosionEffects() {
    for (let i = window.explosionEffects.length - 1; i >= 0; i--) {
        const e = window.explosionEffects[i];
        e.radius += 2;
        e.life -= 0.02;
        
        if (e.life <= 0 || e.radius >= e.maxRadius) {
            window.explosionEffects.splice(i, 1);
        }
    }
}

function drawExplosionEffects() {
    for (let e of window.explosionEffects) {
        ctx.save();
        ctx.globalAlpha = e.life * 0.6;
        
        // Внешнее свечение
        ctx.shadowBlur = 40;
        ctx.shadowColor = e.color;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Внутреннее свечение
        ctx.shadowBlur = 60;
        ctx.shadowColor = '#ff8800';
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        // Яркая точка в центре
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

// ===== ОСТАЛЬНЫЕ ФУНКЦИИ =====
function spawnBonus() {
    if (bonuses.length >= MAX_BONUSES) return;
    if (typeof players === 'undefined' || !players[0] || !players[0].alive) return;
    
    const types = ['speed', 'shield', 'clone', 'explosion'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let x, y;
    let attempts = 0;
    let free = false;
    
    while (!free && attempts < 30) {
        x = 2 + Math.floor(Math.random() * (WIDTH - 4));
        y = 2 + Math.floor(Math.random() * (HEIGHT - 4));
        free = true;
        
        if (players[0] && players[0].alive && players[0].x === x && players[0].y === y) {
            free = false;
        }
        for (let b of bonuses) {
            if (b.x === x && b.y === y) {
                free = false;
                break;
            }
        }
        if (typeof survivalEnemies !== 'undefined') {
            for (let e of survivalEnemies) {
                if (e.alive && e.x === x && e.y === y) {
                    free = false;
                    break;
                }
            }
        }
        if (typeof boss !== 'undefined' && boss && boss.alive) {
            for (let dx = 0; dx < boss.size; dx++) {
                for (let dy = 0; dy < boss.size; dy++) {
                    if (boss.x + dx === x && boss.y + dy === y) {
                        free = false;
                        break;
                    }
                }
                if (!free) break;
            }
        }
        attempts++;
    }
    
    if (free) {
        bonuses.push({
            x: x,
            y: y,
            type: type,
            life: 600,
            color: BONUS_TYPES[type].color,
            symbol: BONUS_TYPES[type].symbol
        });
    }
}

function updateBonuses() {
    bonusTimer++;
    if (bonusTimer > BONUS_SPAWN_INTERVAL / 16) {
        bonusTimer = 0;
        spawnBonus();
    }
    
    for (let i = bonuses.length - 1; i >= 0; i--) {
        bonuses[i].life--;
        if (bonuses[i].life <= 0) {
            bonuses.splice(i, 1);
        }
    }
    
    const now = Date.now();
    for (let key in bonusEffects) {
        if (bonusEffects[key].active && now > bonusEffects[key].endTime) {
            bonusEffects[key].active = false;
            if (BONUS_TYPES[key] && key !== 'explosion') {
                showMessage(`⏳ ${BONUS_TYPES[key].name} закончился!`);
            }
            if (key === 'clone') {
                cloneData.active = false;
                cloneData.trail = [];
            }
        }
    }
    
    // Обновляем эффекты взрыва
    if (typeof updateExplosionEffects === 'function') {
        updateExplosionEffects();
    }
}

function collectBonus(bonus, player) {
    const type = bonus.type;
    const config = BONUS_TYPES[type];
    
    if (config) {
        if (type === 'explosion') {
            config.apply(player);
        } else {
            config.apply();
        }
        const index = bonuses.indexOf(bonus);
        if (index !== -1) bonuses.splice(index, 1);
    }
}

function drawBonuses() {
    for (let b of bonuses) {
        const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.005 + b.x + b.y);
        const x = b.x * CELL_SIZE;
        const y = b.y * CELL_SIZE;
        const size = CELL_SIZE;
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = b.color;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = b.color;
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#000';
        ctx.font = `${size - 4}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.symbol, x + size/2, y + size/2 + 1);
    }
    
    // Отрисовываем эффекты взрыва
    if (typeof drawExplosionEffects === 'function') {
        drawExplosionEffects();
    }
}

function drawBonusIndicators() {
    const now = Date.now();
    let offsetX = 10;
    let offsetY = 80;
    
    for (let key in bonusEffects) {
        const effect = bonusEffects[key];
        if (effect.active) {
            const remaining = Math.max(0, Math.ceil((effect.endTime - now) / 1000));
            const config = BONUS_TYPES[key];
            if (config && key !== 'explosion') {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(offsetX - 2, offsetY - 12, 50, 18, 8);
                } else {
                    ctx.fillRect(offsetX - 2, offsetY - 12, 50, 18);
                }
                ctx.fill();
                
                ctx.fillStyle = config.color;
                ctx.font = '14px monospace';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(config.symbol, offsetX, offsetY);
                
                ctx.fillStyle = '#ffffff';
                ctx.font = '10px monospace';
                ctx.fillText(`${remaining}s`, offsetX + 20, offsetY);
                offsetX += 55;
            }
        }
    }
}

function resetBonuses() {
    bonuses = [];
    bonusTimer = 0;
    for (let key in bonusEffects) {
        bonusEffects[key].active = false;
    }
    cloneData.active = false;
    cloneData.trail = [];
    // НЕ ТРОГАЕМ window.explosionEffects - они живут своей жизнью!
}
