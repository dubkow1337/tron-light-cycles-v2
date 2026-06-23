// ========== РЕЖИМ "КОРОЛЬ ГОРЫ" (FFA + РЕСПАВН) ==========

let kingZone = { x: 0, y: 0, radius: 5 };
let kingBots = [];
let kingScores = [];
let kingTimer = 0;
let kingTargetScore = 50;
let kingGameActive = false;
let kingRespawnTimers = [];
const KING_BOT_COUNT = 3; // 3 бота + игрок = 4 участника
const RESPAWN_DELAY = 5000; // 5 секунд

// ===== СТАРТОВЫЕ ПОЗИЦИИ (4 УГЛА) =====
const SPAWN_POINTS = [
    { x: 4, y: 4 },                         // Левый верхний
    { x: WIDTH - 5, y: 4 },                  // Правый верхний
    { x: 4, y: HEIGHT - 5 },                 // Левый нижний
    { x: WIDTH - 5, y: HEIGHT - 5 }          // Правый нижний
];

// ===== ЗАПУСК РЕЖИМА =====
function startKingOfTheHill() {
    // Сброс
    kingBots = [];
    kingScores = [0, 0, 0, 0]; // [игрок, бот1, бот2, бот3]
    kingTimer = 0;
    kingGameActive = true;
    kingRespawnTimers = [];
    
    // Зона в центре
    kingZone.x = Math.floor(WIDTH / 2);
    kingZone.y = Math.floor(HEIGHT / 2);
    kingZone.radius = 5;
    
    // Перемешиваем стартовые точки
    const shuffled = [...SPAWN_POINTS].sort(() => Math.random() - 0.5);
    
    // Создаём ботов (3 штуки) на разных углах
    const botColors = ['#ff3366', '#33ff66', '#3366ff'];
    const botTrailColors = ['#882222', '#228844', '#222288'];
    
    for (let i = 0; i < KING_BOT_COUNT; i++) {
        const spawn = shuffled[i + 1] || SPAWN_POINTS[i]; // Игроку оставляем первый
        kingBots.push({
            x: spawn.x, y: spawn.y,
            dirX: 1,
            dirY: 0,
            trail: [{ x: spawn.x, y: spawn.y }],
            alive: true,
            color: botColors[i],
            trailColor: botTrailColors[i],
            score: 0,
            targetX: spawn.x,
            targetY: spawn.y,
            stuckTimer: 0,
            lastX: spawn.x,
            lastY: spawn.y,
            id: i,
            aggression: 0.3 + Math.random() * 0.4,
            respawning: false
        });
    }
    
    // Сбрасываем игрока на первый угол
    players[0].x = shuffled[0].x;
    players[0].y = shuffled[0].y;
    players[0].dirX = 1;
    players[0].dirY = 0;
    players[0].trail = [{ x: players[0].x, y: players[0].y }];
    players[0].alive = true;
    players[0].score = 0;
    
    // Второго игрока отключаем
    players[1].alive = false;
    players[1].x = -10;
    players[1].y = -10;
    players[1].trail = [];
    
    showMessage('👑 КОРОЛЬ ГОРЫ! Займи зону!');
}

// ===== ПОИСК БЛИЖАЙШЕГО ВРАГА =====
function findNearestEnemy(bot, enemies) {
    let nearest = null;
    let minDist = Infinity;
    for (let e of enemies) {
        if (e === bot || !e.alive) continue;
        const dist = Math.hypot(e.x - bot.x, e.y - bot.y);
        if (dist < minDist) {
            minDist = dist;
            nearest = e;
        }
    }
    return nearest;
}

// ===== РЕСПАВН БОТА =====
function respawnBot(index) {
    const b = kingBots[index];
    if (!b) return;
    
    // Ищем свободную точку
    const allEntities = [players[0], ...kingBots];
    let spawnPoint = null;
    let attempts = 0;
    
    while (!spawnPoint && attempts < 30) {
        const point = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
        let occupied = false;
        for (let e of allEntities) {
            if (e && e.alive && e.x === point.x && e.y === point.y) {
                occupied = true;
                break;
            }
        }
        if (!occupied) {
            spawnPoint = point;
        }
        attempts++;
    }
    
    if (!spawnPoint) {
        spawnPoint = { x: 5 + Math.random() * (WIDTH - 10), y: 5 + Math.random() * (HEIGHT - 10) };
    }
    
    b.x = spawnPoint.x;
    b.y = spawnPoint.y;
    b.trail = [{ x: b.x, y: b.y }];
    b.alive = true;
    b.dirX = 1;
    b.dirY = 0;
    b.respawning = false;
}

// ===== ОБНОВЛЕНИЕ РЕЖИМА =====
function updateKing() {
    if (!kingGameActive) return;
    if (matchMode !== 'king') return;
    
    const player = players[0];
    if (!player.alive) {
        // Игрок мёртв — начинаем респавн
        if (!player.respawning) {
            player.respawning = true;
            player.respawnTimer = RESPAWN_DELAY;
        }
        player.respawnTimer -= 16;
        if (player.respawnTimer <= 0) {
            // Респавн игрока
            const allEntities = [player, ...kingBots];
            let spawnPoint = null;
            let attempts = 0;
            while (!spawnPoint && attempts < 30) {
                const point = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
                let occupied = false;
                for (let e of allEntities) {
                    if (e && e.alive && e.x === point.x && e.y === point.y) {
                        occupied = true;
                        break;
                    }
                }
                if (!occupied) {
                    spawnPoint = point;
                }
                attempts++;
            }
            if (!spawnPoint) {
                spawnPoint = { x: 5 + Math.random() * (WIDTH - 10), y: 5 + Math.random() * (HEIGHT - 10) };
            }
            player.x = spawnPoint.x;
            player.y = spawnPoint.y;
            player.trail = [{ x: player.x, y: player.y }];
            player.alive = true;
            player.respawning = false;
            showMessage('🔄 ВЫ ВОСКРЕСЛИ!');
        }
        // Если игрок мёртв — всё равно обновляем ботов
    }
    
    // ===== ОБНОВЛЕНИЕ ОЧКОВ В ЗОНЕ =====
    const inZone = (x, y) => {
        return Math.abs(x - kingZone.x) <= kingZone.radius && Math.abs(y - kingZone.y) <= kingZone.radius;
    };
    
    // Проверяем всех живых (игрок + боты)
    const allAlive = [player, ...kingBots].filter(e => e && e.alive);
    
    for (let e of allAlive) {
        if (inZone(e.x, e.y)) {
            if (e === player) {
                kingScores[0] += 0.1;
            } else {
                const idx = kingBots.indexOf(e);
                if (idx !== -1) {
                    kingScores[idx + 1] += 0.1;
                }
            }
        }
    }
    
    // ===== ЛОГИКА БОТОВ (КАЖДЫЙ САМ ЗА СЕБЯ) =====
    const aliveEntities = [player, ...kingBots].filter(e => e && e.alive);
    
    for (let i = 0; i < kingBots.length; i++) {
        const b = kingBots[i];
        if (!b.alive) {
            // Респавн бота через 5 секунд
            if (!b.respawning) {
                b.respawning = true;
                b.respawnTimer = RESPAWN_DELAY;
            }
            b.respawnTimer -= 16;
            if (b.respawnTimer <= 0) {
                respawnBot(i);
            }
            continue;
        }
        
        // Находим всех врагов (все, кроме себя)
        const enemies = aliveEntities.filter(e => e !== b);
        const nearestEnemy = findNearestEnemy(b, enemies);
        
        // ===== ПРИОРИТЕТЫ БОТА =====
        const inZoneNow = inZone(b.x, b.y);
        const nearZone = Math.hypot(b.x - kingZone.x, b.y - kingZone.y) < kingZone.radius + 3;
        
        let targetX = kingZone.x;
        let targetY = kingZone.y;
        
        // Если в зоне — защищаем её
        if (inZoneNow) {
            // Если враг рядом — атакуем
            if (nearestEnemy && Math.hypot(nearestEnemy.x - b.x, nearestEnemy.y - b.y) < 6) {
                targetX = nearestEnemy.x;
                targetY = nearestEnemy.y;
            } else {
                // Иначе двигаемся внутри зоны случайно
                targetX = kingZone.x + (Math.random() - 0.5) * kingZone.radius * 0.8;
                targetY = kingZone.y + (Math.random() - 0.5) * kingZone.radius * 0.8;
            }
        } else {
            // Если не в зоне — бежим к ней
            targetX = kingZone.x + (Math.random() - 0.5) * 2;
            targetY = kingZone.y + (Math.random() - 0.5) * 2;
            
            // Если враг рядом и мешает — атакуем
            if (nearestEnemy && Math.hypot(nearestEnemy.x - b.x, nearestEnemy.y - b.y) < 4) {
                targetX = nearestEnemy.x;
                targetY = nearestEnemy.y;
            }
        }
        
        // Движение к цели
        const tdx = targetX - b.x;
        const tdy = targetY - b.y;
        const distToTarget = Math.hypot(tdx, tdy);
        
        if (distToTarget > 0.5) {
            if (Math.abs(tdx) > Math.abs(tdy)) {
                b.dirX = tdx > 0 ? 1 : -1;
                b.dirY = 0;
            } else {
                b.dirX = 0;
                b.dirY = tdy > 0 ? 1 : -1;
            }
        } else {
            const dirs = [
                { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
            ];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            b.dirX = dir.dx;
            b.dirY = dir.dy;
        }
        
        // Движение
        b.x += b.dirX;
        b.y += b.dirY;
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 30) b.trail.shift();
        
        // Проверка границ
        if (b.x < 0 || b.x >= WIDTH || b.y < 0 || b.y >= HEIGHT) {
            b.alive = false;
            continue;
        }
        
        // Проверка на свой след
        for (let t = 0; t < b.trail.length - 2; t++) {
            if (b.trail[t].x === b.x && b.trail[t].y === b.y) {
                b.alive = false;
                if (typeof explode === 'function') explode(b.x, b.y, b.color);
                break;
            }
        }
        if (!b.alive) continue;
        
        // Проверка на следы всех остальных (включая игрока и других ботов)
        for (let e of aliveEntities) {
            if (e === b) continue;
            if (!e || !e.alive) continue;
            for (let t = 0; t < e.trail.length - 1; t++) {
                if (e.trail[t].x === b.x && e.trail[t].y === b.y) {
                    b.alive = false;
                    if (typeof explode === 'function') explode(b.x, b.y, b.color);
                    break;
                }
            }
            if (!b.alive) break;
        }
        if (!b.alive) continue;
        
        // Столкновение с игроком
        if (player.alive && b.x === player.x && b.y === player.y) {
            // Игрок умирает
            player.alive = false;
            if (typeof explode === 'function') explode(player.x, player.y, player.color);
            showMessage('💀 ВАС УБИЛ БОТ! Респавн через 5 сек...');
            continue;
        }
        
        // Столкновение с другими ботами (отталкивание)
        for (let j = 0; j < kingBots.length; j++) {
            if (i === j) continue;
            const other = kingBots[j];
            if (!other.alive) continue;
            if (b.x === other.x && b.y === other.y) {
                b.x += b.dirX * 2;
                b.y += b.dirY * 2;
                other.x -= other.dirX * 2;
                other.y -= other.dirY * 2;
            }
        }
    }
    
    // ===== ПРОВЕРКА ПОБЕДЫ =====
    // Игрок победил?
    if (kingScores[0] >= kingTargetScore) {
        kingGameActive = false;
        showMessage(`👑 ВЫ ПОБЕДИЛИ! СЧЁТ: ${Math.floor(kingScores[0])}`);
        if (typeof showVictory === 'function') {
            showVictory('Синий', false);
        }
        return;
    }
    
    // Бот победил?
    let winnerBot = -1;
    for (let i = 0; i < kingBots.length; i++) {
        if (kingScores[i + 1] >= kingTargetScore) {
            winnerBot = i;
            break;
        }
    }
    if (winnerBot !== -1) {
        kingGameActive = false;
        showMessage(`🤖 БОТ ПОБЕДИЛ! СЧЁТ: ${Math.floor(kingScores[winnerBot + 1])}`);
        return;
    }
    
    // Обновляем UI
    if (typeof updateUI === 'function') updateUI();
}

// ===== ОТРИСОВКА ЗОНЫ =====
function drawKingZone() {
    if (matchMode !== 'king') return;
    if (!kingGameActive && kingScores[0] < kingTargetScore) return;
    
    const cx = kingZone.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = kingZone.y * CELL_SIZE + CELL_SIZE / 2;
    const radius = kingZone.radius * CELL_SIZE;
    const time = Date.now() * 0.001;
    
    const pulse = 0.8 + 0.2 * Math.sin(time * 0.8);
    const glowPulse = 0.5 + 0.5 * Math.sin(time * 0.6);
    
    // Внешнее свечение
    ctx.shadowBlur = 40 + 20 * glowPulse;
    ctx.shadowColor = `rgba(255, 215, 0, ${0.3 + 0.2 * glowPulse})`;
    
    // Основная заливка
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, `rgba(255, 215, 0, ${0.15 + 0.1 * pulse})`);
    grad.addColorStop(0.5, `rgba(255, 200, 0, ${0.08 + 0.05 * pulse})`);
    grad.addColorStop(1, `rgba(255, 180, 0, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Граница зоны
    ctx.shadowBlur = 20 + 10 * glowPulse;
    ctx.shadowColor = `rgba(255, 215, 0, ${0.3 + 0.2 * glowPulse})`;
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + 0.3 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Пунктирная внутренняя линия
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.15 + 0.1 * glowPulse})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 10]);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Корона в центре
    ctx.shadowBlur = 30;
    ctx.shadowColor = `rgba(255, 215, 0, ${0.3 + 0.2 * glowPulse})`;
    ctx.font = `${CELL_SIZE * 1.5}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(255, 215, 0, ${0.6 + 0.3 * pulse})`;
    ctx.fillText('👑', cx, cy + 2);
    
    ctx.shadowBlur = 0;
    
    // Счёт игрока над зоной
    ctx.font = 'bold 16px "Courier New"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
    ctx.fillText(`🏆 ${Math.floor(kingScores[0])}/${kingTargetScore}`, cx, cy - radius - 8);
    ctx.shadowBlur = 0;
    
    // Таймер респавна игрока
    if (!players[0].alive && players[0].respawning) {
        const remaining = Math.ceil(players[0].respawnTimer / 1000);
        ctx.font = 'bold 24px "Courier New"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ff4444';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0000';
        ctx.fillText(`⏳ РЕСПАВН: ${remaining}с`, cx, cy + radius + 20);
        ctx.shadowBlur = 0;
    }
}

// ===== СБРОС =====
function resetKing() {
    kingGameActive = false;
    kingBots = [];
    kingScores = [0, 0, 0, 0];
}
