// ========== БОСС: LIGHT RUNNER (КВОРА) ==========

let boss = null;
const BOSS_MAX_HEALTH = 5;
const BOSS_SIZE = 3;

function spawnBoss() {
    if (boss && boss.alive) return;
    if (typeof players === 'undefined' || !players[0] || !players[0].alive) return;
    
    const player = players[0];
    let x, y;
    let dirX = 0, dirY = 0;
    
    const side = Math.floor(Math.random() * 4);
    
    switch(side) {
        case 0:
            x = 2 + Math.floor(Math.random() * (WIDTH - 4));
            y = 1;
            dirX = 0;
            dirY = 1;
            break;
        case 1:
            x = 2 + Math.floor(Math.random() * (WIDTH - 4));
            y = HEIGHT - 2;
            dirX = 0;
            dirY = -1;
            break;
        case 2:
            x = 1;
            y = 2 + Math.floor(Math.random() * (HEIGHT - 4));
            dirX = 1;
            dirY = 0;
            break;
        case 3:
            x = WIDTH - 2;
            y = 2 + Math.floor(Math.random() * (HEIGHT - 4));
            dirX = -1;
            dirY = 0;
            break;
    }
    
    boss = {
        x: x, y: y,
        dirX: dirX,
        dirY: dirY,
        trail: [],
        alive: true,
        color: '#ff3300',
        trailColor: '#ff2200',
        health: BOSS_MAX_HEALTH,
        maxHealth: BOSS_MAX_HEALTH,
        speed: 0.8,
        spawnProtection: 10,
        lastDirChange: 0,
        size: BOSS_SIZE,
        trailOffsetX: Math.floor(BOSS_SIZE / 2),
        trailOffsetY: Math.floor(BOSS_SIZE / 2),
        lastDirection: { dx: dirX, dy: dirY },
        invincible: false,
        invincibleTimer: 0,
        hitCooldown: 0
    };
    
    const startX = boss.x + boss.trailOffsetX;
    const startY = boss.y + boss.trailOffsetY;
    boss.trail.push({ x: startX, y: startY });
    
    showMessage(`⚠️ LIGHT RUNNER ПОЯВИЛСЯ! (❤️ ${BOSS_MAX_HEALTH})`);
}

function updateBoss() {
    if (!boss || !boss.alive) return;
    
    const player = players[0];
    if (!player || !player.alive) {
        boss.alive = false;
        boss = null;
        return;
    }
    
    if (boss.spawnProtection > 0) {
        boss.spawnProtection--;
        return;
    }
    
    if (boss.hitCooldown > 0) {
        boss.hitCooldown--;
    }
    
    // ============================================================
    // ===== ГОЛОВА БОССА УБИВАЕТ ИГРОКА =====
    // ============================================================
    let hitPlayer = false;
    for (let dx = 0; dx < boss.size; dx++) {
        for (let dy = 0; dy < boss.size; dy++) {
            const bx = Math.round(boss.x + dx);
            const by = Math.round(boss.y + dy);
            if (player.alive && bx === Math.round(player.x) && by === Math.round(player.y)) {
                hitPlayer = true;
                break;
            }
        }
        if (hitPlayer) break;
    }
    
    if (hitPlayer) {
        player.alive = false;
        if (typeof explode === 'function') explode(player.x, player.y, player.color);
        gameActive = false;
        showMessage('💀 ВАС РАЗДАВИЛ LIGHT RUNNER!');
        if (typeof stopBgMusic === 'function') stopBgMusic();
        if (typeof gameLoop !== 'undefined' && gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        return;
    }
    
    // ============================================================
    // ===== СЛЕД БОССА УБИВАЕТ ИГРОКА =====
    // ============================================================
    for (let i = 0; i < boss.trail.length - 1; i++) {
        const seg = boss.trail[i];
        if (player.alive && Math.round(player.x) === Math.round(seg.x) && Math.round(player.y) === Math.round(seg.y)) {
            player.alive = false;
            if (typeof explode === 'function') explode(player.x, player.y, player.color);
            gameActive = false;
            showMessage('💀 ВАС УБИЛ СЛЕД LIGHT RUNNER!');
            if (typeof stopBgMusic === 'function') stopBgMusic();
            if (typeof gameLoop !== 'undefined' && gameLoop) {
                clearInterval(gameLoop);
                gameLoop = null;
            }
            return;
        }
    }
    
    // ============================================================
    // ===== УРОН БОССУ ОТ ЛИНИЙ ИГРОКА =====
    // ============================================================
    if (boss.hitCooldown === 0 && !boss.invincible) {
        const playerTrail = player.trail || [];
        for (let t = 0; t < playerTrail.length - 1; t++) {
            const seg = playerTrail[t];
            for (let dx = 0; dx < boss.size; dx++) {
                for (let dy = 0; dy < boss.size; dy++) {
                    const bx = Math.round(boss.x + dx);
                    const by = Math.round(boss.y + dy);
                    if (bx === Math.round(seg.x) && by === Math.round(seg.y)) {
                        boss.health--;
                        boss.hitCooldown = 15;
                        boss.invincible = true;
                        boss.invincibleTimer = 15;
                        
                        if (typeof explode === 'function') explode(boss.x, boss.y, '#ffaa00');
                        
                        if (boss.health <= 0) {
                            boss.alive = false;
                            for (let i = 0; i < 5; i++) {
                                setTimeout(() => {
                                    if (typeof explode === 'function') {
                                        explode(
                                            boss.x + (Math.random() - 0.5) * 5,
                                            boss.y + (Math.random() - 0.5) * 5,
                                            '#ff3300'
                                        );
                                    }
                                }, i * 100);
                            }
                            showMessage(`🎉 LIGHT RUNNER УНИЧТОЖЕН! +10 шагов к рекорду`);
                            if (typeof currentSteps !== 'undefined') currentSteps += 10;
                            boss = null;
                            return;
                        } else {
                            showMessage(`💥 LIGHT RUNNER РАНЕН! ❤️ ${boss.health}/${boss.maxHealth}`);
                            boss.dirX = -boss.dirX || 1;
                            boss.dirY = -boss.dirY || 1;
                            boss.lastDirection = { dx: boss.dirX, dy: boss.dirY };
                        }
                        return;
                    }
                }
            }
        }
    }
    
    if (boss.invincible && boss.invincibleTimer > 0) {
        boss.invincibleTimer--;
        if (boss.invincibleTimer <= 0) {
            boss.invincible = false;
        }
    }
    
    // ============================================================
    // ===== СТОЛКНОВЕНИЕ БОССА СО СВОИМ СЛЕДОМ =====
    // ============================================================
    for (let i = 0; i < boss.trail.length - 2; i++) {
        const seg = boss.trail[i];
        for (let dx = 0; dx < boss.size; dx++) {
            for (let dy = 0; dy < boss.size; dy++) {
                const bx = Math.round(boss.x + dx);
                const by = Math.round(boss.y + dy);
                if (bx === Math.round(seg.x) && by === Math.round(seg.y)) {
                    const dirs = [
                        { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                        { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
                    ];
                    const newDir = dirs[Math.floor(Math.random() * dirs.length)];
                    boss.dirX = newDir.dx;
                    boss.dirY = newDir.dy;
                    boss.lastDirection = { dx: boss.dirX, dy: boss.dirY };
                    return;
                }
            }
        }
    }
    
    // ============================================================
    // ===== ДВИЖЕНИЕ БОССА (преследует игрока) =====
    // ============================================================
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const distToPlayer = Math.hypot(dx, dy);
    
    boss.lastDirChange++;
    if (boss.lastDirChange > 3 + Math.floor(Math.random() * 4)) {
        boss.lastDirChange = 0;
        
        let newDirX = 0, newDirY = 0;
        
        if (distToPlayer > 5) {
            const angle = Math.atan2(dy, dx);
            const randomOffset = (Math.random() - 0.5) * 0.5;
            const finalAngle = angle + randomOffset;
            newDirX = Math.round(Math.cos(finalAngle));
            newDirY = Math.round(Math.sin(finalAngle));
        } else {
            const angle = Math.atan2(dy, dx);
            const fleeAngle = angle + (Math.random() > 0.5 ? 1.2 : -1.2);
            newDirX = Math.round(Math.cos(fleeAngle));
            newDirY = Math.round(Math.sin(fleeAngle));
        }
        
        if (newDirX !== 0 && newDirY !== 0) {
            if (Math.abs(newDirX) > Math.abs(newDirY)) {
                newDirY = 0;
            } else {
                newDirX = 0;
            }
        }
        
        if (newDirX === 0 && newDirY === 0) {
            const dirs = [
                { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
            ];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            newDirX = dir.dx;
            newDirY = dir.dy;
        }
        
        if (boss.lastDirection) {
            const isReverseX = newDirX === -boss.lastDirection.dx && newDirY === 0;
            const isReverseY = newDirY === -boss.lastDirection.dy && newDirX === 0;
            if (isReverseX || isReverseY) {
                if (newDirX !== 0) {
                    newDirX = 0;
                    newDirY = (Math.random() < 0.5) ? 1 : -1;
                } else if (newDirY !== 0) {
                    newDirY = 0;
                    newDirX = (Math.random() < 0.5) ? 1 : -1;
                }
            }
        }
        
        boss.dirX = newDirX;
        boss.dirY = newDirY;
        boss.lastDirection = { dx: newDirX, dy: newDirY };
    }
    
    // ===== ДВИЖЕНИЕ =====
    for (let step = 0; step < boss.speed; step++) {
        const newX = boss.x + boss.dirX;
        const newY = boss.y + boss.dirY;
        
        if (newX < 0 || newX >= WIDTH || newY < 0 || newY >= HEIGHT) {
            const dirs = [
                { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
            ];
            const newDir = dirs[Math.floor(Math.random() * dirs.length)];
            boss.dirX = newDir.dx;
            boss.dirY = newDir.dy;
            boss.lastDirection = { dx: boss.dirX, dy: boss.dirY };
            continue;
        }
        
        boss.x = newX;
        boss.y = newY;
        
        const trailX = boss.x + boss.trailOffsetX;
        const trailY = boss.y + boss.trailOffsetY;
        boss.trail.push({ x: trailX, y: trailY });
        if (boss.trail.length > 150) boss.trail.shift();
    }
}

function hitBoss() {
    if (!boss || !boss.alive) return;
    if (boss.spawnProtection > 0) return;
    if (boss.invincible) return;
    if (boss.hitCooldown > 0) return;
    
    const player = players[0];
    if (!player || !player.alive) return;
    
    let hit = false;
    for (let dx = 0; dx < boss.size; dx++) {
        for (let dy = 0; dy < boss.size; dy++) {
            const bx = Math.round(boss.x + dx);
            const by = Math.round(boss.y + dy);
            if (Math.round(player.x) === bx && Math.round(player.y) === by) {
                hit = true;
                break;
            }
        }
        if (hit) break;
    }
    
    if (!hit) return;
    
    boss.health--;
    boss.hitCooldown = 15;
    if (typeof explode === 'function') explode(boss.x, boss.y, '#ffaa00');
    
    if (boss.health <= 0) {
        boss.alive = false;
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                if (typeof explode === 'function') {
                    explode(
                        boss.x + (Math.random() - 0.5) * 5,
                        boss.y + (Math.random() - 0.5) * 5,
                        '#ff3300'
                    );
                }
            }, i * 100);
        }
        showMessage(`🎉 LIGHT RUNNER УНИЧТОЖЕН! +10 шагов к рекорду`);
        if (typeof currentSteps !== 'undefined') currentSteps += 10;
        boss = null;
    } else {
        showMessage(`💥 LIGHT RUNNER РАНЕН! ❤️ ${boss.health}/${boss.maxHealth}`);
    }
}

function resetBoss() {
    boss = null;
}
