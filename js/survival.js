// ========== РЕЖИМ ВЫЖИВАНИЯ (БЕСКОНЕЧНОЕ НАКОПЛЕНИЕ) ==========

let survivalEnemies = [];
let spawnTimer = 0;
let lastSpawnTime = 0;
let bossSpawnTimer = 0;
const SPAWN_INTERVAL = 3000;
const MAX_ENEMIES = 12;

function spawnSurvivalEnemies() {
    if (typeof resetBoss === 'function') {
        resetBoss();
    }
    
    survivalEnemies = [];
    spawnTimer = 0;
    lastSpawnTime = Date.now();
    bossSpawnTimer = 0;
    
    if (typeof currentSteps !== 'undefined') {
        currentSteps = 0;
    }
    
    for (let i = 0; i < 3; i++) {
        spawnSingleEnemy();
    }
    
    setTimeout(() => {
        if (typeof spawnBoss === 'function' && players[0] && players[0].alive) {
            spawnBoss();
            showMessage('⚠️ LIGHT RUNNER ПРИБЫВАЕТ!');
        }
    }, 2000);
}

function spawnSingleEnemy() {
    if (typeof players === 'undefined' || !players[0] || !players[0].alive) return;
    if (survivalEnemies.filter(e => e.alive).length >= MAX_ENEMIES) return;
    
    const player = players[0];
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
        case 0:
            x = 5 + Math.floor(Math.random() * (WIDTH - 10));
            y = 2;
            break;
        case 1:
            x = 5 + Math.floor(Math.random() * (WIDTH - 10));
            y = HEIGHT - 3;
            break;
        case 2:
            x = 2;
            y = 5 + Math.floor(Math.random() * (HEIGHT - 10));
            break;
        case 3:
            x = WIDTH - 3;
            y = 5 + Math.floor(Math.random() * (HEIGHT - 10));
            break;
    }
    
    if (player && Math.abs(x - player.x) < 4 && Math.abs(y - player.y) < 4) {
        x = (x + 5) % WIDTH;
        y = (y + 5) % HEIGHT;
    }
    
    const colors = ['#ff3366', '#ff6633', '#ff9933', '#ff33aa', '#ffaa33', '#ff5555', '#ff8844'];
    const trailColors = ['#882222', '#884422', '#886622', '#882266', '#886622', '#884444', '#886633'];
    const colorIndex = Math.floor(Math.random() * colors.length);
    
    const difficulty = Math.min(5, Math.floor((survivalEnemies.filter(e => e.alive).length) / 3));
    const isHunter = Math.random() < 0.2 + difficulty * 0.06;
    
    survivalEnemies.push({
        x: x, y: y,
        dirX: 0,
        dirY: 0,
        trail: [{ x: x, y: y }],
        alive: true,
        color: colors[colorIndex],
        trailColor: trailColors[colorIndex],
        spawnProtection: 0,
        role: isHunter ? 'hunter' : 'flanker',
        speed: 1 + difficulty * 0.05
    });
}

function updateSurvival() {
    // ===== ЕСЛИ ИГРА НЕ АКТИВНА — ВЫХОДИМ =====
    if (typeof gameActive === 'undefined' || !gameActive) return;
    if (matchMode !== 'survival') return;
    
    const player = players[0];
    
    // ===== ЕСЛИ ИГРОК МЕРТВ — ПОЛНАЯ ОСТАНОВКА =====
    if (!player || !player.alive) {
        survivalEnemies = [];
        if (typeof resetBoss === 'function') {
            resetBoss();
        }
        if (typeof gameLoop !== 'undefined' && gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        if (typeof gameActive !== 'undefined') {
            gameActive = false;
        }
        return;
    }
    
    if (typeof currentSteps !== 'undefined') {
        currentSteps++;
    }
    
    const now = Date.now();
    if (now - lastSpawnTime > SPAWN_INTERVAL) {
        lastSpawnTime = now;
        const count = Math.random() > 0.5 ? 1 : 2;
        for (let i = 0; i < count; i++) {
            spawnSingleEnemy();
        }
        const aliveCount = survivalEnemies.filter(e => e.alive).length;
        if (aliveCount > 0 && aliveCount % 3 === 0) {
            showMessage(`⚠️ ВРАГОВ: ${aliveCount}`);
        }
    }
    
    if (typeof boss !== 'undefined' && typeof spawnBoss === 'function') {
        bossSpawnTimer += 16;
        
        if (bossSpawnTimer >= 15000) {
            bossSpawnTimer = 0;
            
            if (!boss || !boss.alive) {
                const bossCount = Math.random() < 0.3 ? 2 : 1;
                
                for (let i = 0; i < bossCount; i++) {
                    setTimeout(() => {
                        if (players[0] && players[0].alive && typeof spawnBoss === 'function') {
                            spawnBoss();
                            if (bossCount > 1) {
                                showMessage(`⚠️ LIGHT RUNNER ×${bossCount} ПРИБЫВАЮТ!`);
                            } else {
                                showMessage('⚠️ LIGHT RUNNER ПРИБЫВАЕТ!');
                            }
                        }
                    }, i * 300);
                }
            }
        }
        
        if (typeof updateBoss === 'function' && boss && boss.alive) {
            updateBoss();
        }
    }
    
    const aliveEnemies = survivalEnemies.filter(e => e.alive);
    const enemyCount = aliveEnemies.length;
    
    if (enemyCount === 0) return;
    
    for (let i = 0; i < survivalEnemies.length; i++) {
        let e = survivalEnemies[i];
        if (!e.alive) continue;
        
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const distToPlayer = Math.hypot(dx, dy);
        
        let targetX = player.x;
        let targetY = player.y;
        
        if (e.role === 'hunter' && enemyCount >= 2) {
            if (distToPlayer < 4) {
                targetX = e.x - dx * 0.5;
                targetY = e.y - dy * 0.5;
            } else {
                targetX = player.x;
                targetY = player.y;
            }
        } else {
            const angle = Math.atan2(dy, dx);
            const flankAngle = angle + (Math.random() > 0.5 ? 1 : -1) * 1.2;
            const futureX = player.x + player.dirX * 4;
            const futureY = player.y + player.dirY * 4;
            targetX = futureX + Math.cos(flankAngle) * 4;
            targetY = futureY + Math.sin(flankAngle) * 4;
        }
        
        targetX = Math.max(1, Math.min(WIDTH - 2, targetX));
        targetY = Math.max(1, Math.min(HEIGHT - 2, targetY));
        
        const targetDx = targetX - e.x;
        const targetDy = targetY - e.y;
        const distToTarget = Math.hypot(targetDx, targetDy);
        
        let newDirX = e.dirX;
        let newDirY = e.dirY;
        
        if (distToTarget > 0.5) {
            const prob = Math.random();
            if (prob < 0.1) {
                const dirs = [
                    { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                    { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
                ];
                const dir = dirs[Math.floor(Math.random() * dirs.length)];
                newDirX = dir.dx;
                newDirY = dir.dy;
            } else if (Math.abs(targetDx) > Math.abs(targetDy)) {
                newDirX = targetDx > 0 ? 1 : -1;
                newDirY = 0;
            } else {
                newDirX = 0;
                newDirY = targetDy > 0 ? 1 : -1;
            }
        }
        
        let newX = e.x + newDirX;
        let newY = e.y + newDirY;
        let isSafe = true;
        
        for (let t of e.trail) {
            if (t.x === newX && t.y === newY) { isSafe = false; break; }
        }
        
        if (!isSafe) {
            const altDirs = [
                { dx: newDirY, dy: -newDirX },
                { dx: -newDirY, dy: newDirX },
                { dx: -newDirX, dy: -newDirY }
            ];
            for (let alt of altDirs) {
                const testX = e.x + alt.dx;
                const testY = e.y + alt.dy;
                let altSafe = true;
                for (let t of e.trail) {
                    if (t.x === testX && t.y === testY) { altSafe = false; break; }
                }
                if (altSafe) {
                    newDirX = alt.dx;
                    newDirY = alt.dy;
                    break;
                }
            }
        }
        
        e.dirX = newDirX;
        e.dirY = newDirY;
        
        const speed = e.speed || 1;
        e.x += e.dirX * speed;
        e.y += e.dirY * speed;
        e.trail.push({ x: e.x, y: e.y });
        
        if (e.trail.length > 30) {
            e.trail.shift();
        }
        
        let enemyDied = false;
        
        if (e.x < 0 || e.x >= WIDTH || e.y < 0 || e.y >= HEIGHT) {
            enemyDied = true;
        }
        
        if (!enemyDied) {
            for (let t = 0; t < e.trail.length - 2; t++) {
                if (e.trail[t].x === e.x && e.trail[t].y === e.y) {
                    enemyDied = true;
                    break;
                }
            }
        }
        
        if (!enemyDied) {
            for (let other of survivalEnemies) {
                if (other === e || !other.alive) continue;
                for (let t = 0; t < other.trail.length - 1; t++) {
                    if (other.trail[t].x === e.x && other.trail[t].y === e.y) {
                        enemyDied = true;
                        break;
                    }
                }
                if (enemyDied) break;
            }
        }
        
        // ===== СЛЕД ИГРОКА УБИВАЕТ ВРАГА =====
        if (!enemyDied) {
            for (let t = 0; t < player.trail.length - 1; t++) {
                if (player.trail[t].x === e.x && player.trail[t].y === e.y) {
                    enemyDied = true;
                    break;
                }
            }
        }
        
        // ===== СТОЛКНОВЕНИЕ С ИГРОКОМ =====
        if (!enemyDied && player.alive) {
            if (Math.round(e.x) === Math.round(player.x) && Math.round(e.y) === Math.round(player.y)) {
                player.alive = false;
                enemyDied = true;
                if (typeof explode === 'function') explode(player.x, player.y, player.color);
                gameActive = false;
                showMessage('💀 GAME OVER!');
                if (typeof stopBgMusic === 'function') stopBgMusic();
                if (typeof resetBoss === 'function') {
                    resetBoss();
                }
                survivalEnemies = [];
                if (typeof gameLoop !== 'undefined' && gameLoop) {
                    clearInterval(gameLoop);
                    gameLoop = null;
                }
                // ===== ПОКАЗЫВАЕМ ТАБЛО GAME OVER =====
                if (typeof showGameOver === 'function') {
                    setTimeout(() => showGameOver(), 300);
                }
                return;
            }
        }
        
        if (enemyDied) {
            e.alive = false;
            if (typeof explode === 'function') explode(e.x, e.y, e.color);
        }
    }
    
    survivalEnemies = survivalEnemies.filter(e => e.alive);
    if (typeof updateUI === 'function') updateUI();
}

function resetSurvivalTimer() {
    spawnTimer = 0;
    lastSpawnTime = Date.now();
    bossSpawnTimer = 0;
    if (typeof resetBoss === 'function') {
        resetBoss();
    }
    if (typeof currentSteps !== 'undefined') {
        currentSteps = 0;
    }
}

function clearSurvivalEnemies() {
    survivalEnemies = [];
    if (typeof resetBoss === 'function') {
        resetBoss();
    }
}
