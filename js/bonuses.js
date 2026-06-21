// ========== БОНУСЫ (ТОЛЬКО БАФФЫ) ==========

let bonuses = [];
let bonusTimer = 0;
const BONUS_SPAWN_INTERVAL = 1000; // 5 секунд между появлением
const MAX_BONUSES = 3; // максимум бонусов на поле

// Активные эффекты
let bonusEffects = {
    speed: { active: false, endTime: 0, duration: 5000 },
    shield: { active: false, endTime: 0, duration: 5000 },
    extraLife: { active: false, endTime: 0, duration: 0 }
};

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
    extraLife: {
        name: 'Дополнительная жизнь',
        color: '#ff44aa',
        symbol: '❤️',
        duration: 0,
        apply: () => {
            // Если игрок мёртв — воскрешаем
            if (players[0] && !players[0].alive) {
                players[0].alive = true;
                players[0].x = 5;
                players[0].y = Math.floor(HEIGHT / 2);
                players[0].trail = [{ x: players[0].x, y: players[0].y }];
                showMessage('❤️ ВОСКРЕШЕНИЕ!');
            } else {
                // Если жив — даём "жизнь" (можно использовать для счёта)
                showMessage('❤️ +1 ЖИЗНЬ!');
            }
        }
    }
};

function spawnBonus() {
    if (bonuses.length >= MAX_BONUSES) return;
    if (typeof players === 'undefined' || !players[0] || !players[0].alive) return;
    
    const types = ['speed', 'shield', 'extraLife'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let x, y;
    let attempts = 0;
    let free = false;
    
    while (!free && attempts < 30) {
        x = 2 + Math.floor(Math.random() * (WIDTH - 4));
        y = 2 + Math.floor(Math.random() * (HEIGHT - 4));
        free = true;
        
        // Не спавним на игроке
        if (players[0] && players[0].alive && players[0].x === x && players[0].y === y) {
            free = false;
        }
        // Не спавним на других бонусах
        for (let b of bonuses) {
            if (b.x === x && b.y === y) {
                free = false;
                break;
            }
        }
        // Не спавним на врагах (если есть)
        if (typeof survivalEnemies !== 'undefined') {
            for (let e of survivalEnemies) {
                if (e.alive && e.x === x && e.y === y) {
                    free = false;
                    break;
                }
            }
        }
        // Не спавним на боссе (если есть)
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
            life: 600, // 10 секунд на поле (60 FPS * 10)
            color: BONUS_TYPES[type].color,
            symbol: BONUS_TYPES[type].symbol
        });
    }
}

function updateBonuses() {
    // Спавн новых бонусов
    bonusTimer++;
    if (bonusTimer > BONUS_SPAWN_INTERVAL / 16) {
        bonusTimer = 0;
        spawnBonus();
    }
    
    // Обновление бонусов на поле
    for (let i = bonuses.length - 1; i >= 0; i--) {
        bonuses[i].life--;
        if (bonuses[i].life <= 0) {
            bonuses.splice(i, 1);
        }
    }
    
    // Обновление эффектов
    const now = Date.now();
    for (let key in bonusEffects) {
        if (bonusEffects[key].active && now > bonusEffects[key].endTime) {
            bonusEffects[key].active = false;
            if (BONUS_TYPES[key]) {
                showMessage(`⏳ ${BONUS_TYPES[key].name} закончился!`);
            }
        }
    }
}

function collectBonus(bonus, player) {
    const type = bonus.type;
    const config = BONUS_TYPES[type];
    
    if (config) {
        config.apply();
        // Удаляем бонус с поля
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
        
        // Свечение
        ctx.shadowBlur = 20;
        ctx.shadowColor = b.color;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = b.color;
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        
        // Символ
        ctx.fillStyle = '#000';
        ctx.font = `${size - 4}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.symbol, x + size/2, y + size/2 + 1);
    }
}

function drawBonusIndicators() {
    // Индикаторы активных эффектов (в левом верхнем углу)
    const now = Date.now();
    let offsetX = 10;
    let offsetY = 80;
    
    for (let key in bonusEffects) {
        const effect = bonusEffects[key];
        if (effect.active) {
            const remaining = Math.max(0, Math.ceil((effect.endTime - now) / 1000));
            const config = BONUS_TYPES[key];
            if (config) {
                // Фон индикатора
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.roundRect(offsetX - 2, offsetY - 12, 50, 18, 8);
                ctx.fill();
                
                // Иконка
                ctx.fillStyle = config.color;
                ctx.font = '14px monospace';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(config.symbol, offsetX, offsetY);
                
                // Таймер
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
}
