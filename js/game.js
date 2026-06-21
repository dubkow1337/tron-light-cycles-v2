// ========== ГЛАВНАЯ ЛОГИКА ИГРЫ ==========

let gameActive = true;
let gameLoop = null;
let countdownInterval = null;
let countdownActive = false;
let countdownValue = 3;
let currentSteps = 0;
let bestRecord = localStorage.getItem('tronRecord') ? parseInt(localStorage.getItem('tronRecord')) : 0;
let MOVE_INTERVAL = 70;
// paused объявлен в ui.js — НЕ ОБЪЯВЛЯЕМ ЕГО ЗДЕСЬ!

// ===== ТАЙМЕР РАУНДА =====
let roundTimer = 30;
let roundTimerInterval = null;
let roundTimerActive = false;

// ============================================================
// ===== БОНУСЫ (флаги для быстрого доступа) =====
// ============================================================
let bonusSpeedActive = false;
let bonusShieldActive = false;
let bonusCloneActive = false;

// cloneData объявлен в bonuses.js — НЕ ОБЪЯВЛЯЕМ ЕГО ЗДЕСЬ!

// ===== ПОБЕДА =====
function showVictory(name) {
    const overlay = document.getElementById('victoryOverlay');
    if (overlay) {
        overlay.innerText = `${name.toUpperCase()} ПОБЕДИЛ!`;
        overlay.classList.add('show');
        setTimeout(() => overlay.classList.remove('show'), 2000);
    }
    
    // Салют
    if (typeof startFireworks === 'function') {
        const color = name === 'Синий' ? '#00ffff' : '#ffaa00';
        startFireworks(color, 6);
    }
    
    // === ТУРНИР ===
    if (matchMode === 'tournament') {
        if (name === 'Синий') tournamentScore[0]++;
        else if (name === 'Оранжевый') tournamentScore[1]++;
        updateUI();
        
        if (tournamentScore[0] >= tournamentTarget || tournamentScore[1] >= tournamentTarget) {
            let finalWinner = tournamentScore[0] >= tournamentTarget ? 'Синий' : 'Оранжевый';
            showMessage(`🏆 ТУРНИР ВЫИГРАЛ ${finalWinner.toUpperCase()}! 🏆`);
            tournamentScore = [0, 0];
            tournamentActive = false;
            return;
        }
        resetGame();
        showMessage(`Счёт турнира: ${tournamentScore[0]} : ${tournamentScore[1]} (до ${tournamentTarget})`);
        return;
    }
    
    // Голос победы
    if (typeof speakVictory === 'function') {
        speakVictory(`${name} победил!`);
    }
}

// ===== ОСНОВНОЙ ИГРОВОЙ ЦИКЛ =====
function updateGame() {
    if (!gameActive) return;
    
    // ============================================================
    // ===== ОБНОВЛЕНИЕ БОНУСОВ =====
    // ============================================================
    if (typeof updateBonuses === 'function') {
        updateBonuses();
    }
    
    // === СБОР БОНУСОВ ===
    if (typeof bonuses !== 'undefined') {
        for (let i = 0; i < bonuses.length; i++) {
            const b = bonuses[i];
            if (players[0].alive && players[0].x === b.x && players[0].y === b.y) {
                if (typeof collectBonus === 'function') {
                    collectBonus(b, players[0]);
                }
                bonuses.splice(i, 1);
                i--;
            }
        }
    }
    
    // ============================================================
    // ===== ПРОВЕРКА ЭФФЕКТОВ БОНУСОВ =====
    // ============================================================
    let speedMultiplier = 1;
    let shieldActive = false;
    let cloneActive = false;
    
    if (typeof bonusEffects !== 'undefined') {
        if (bonusEffects.speed && bonusEffects.speed.active) {
            speedMultiplier = 1.5;
        }
        if (bonusEffects.shield && bonusEffects.shield.active) {
            shieldActive = true;
        }
        if (bonusEffects.clone && bonusEffects.clone.active) {
            cloneActive = true;
        }
    }
    
    // Обновляем глобальные флаги
    bonusSpeedActive = speedMultiplier > 1;
    bonusShieldActive = shieldActive;
    bonusCloneActive = cloneActive;
    
    // ============================================================
    // ===== ДВИЖЕНИЕ ИГРОКОВ (с ускорением) =====
    // ============================================================
    for (let p of players) {
        if (!p.alive) continue;
        p.x += p.dirX * speedMultiplier;
        p.y += p.dirY * speedMultiplier;
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 15) p.trail.shift();
        if (typeof addParticles === 'function') addParticles(p.x, p.y, p.color);
    }
    
    // ============================================================
    // ===== ОБНОВЛЕНИЕ СЛЕДА КЛОНА =====
    // ============================================================
    if (cloneActive && players[0].alive) {
        if (typeof cloneData === 'undefined' || !cloneData) {
            // Если данных нет — создаём (но они должны быть из bonuses.js)
        }
        if (cloneData) {
            cloneData.active = true;
            const cloneX = players[0].x + (cloneData.offsetX || 2);
            const cloneY = players[0].y + (cloneData.offsetY || 0);
            
            if (cloneData.trail.length === 0 || 
                cloneData.trail[cloneData.trail.length-1].x !== Math.round(cloneX) ||
                cloneData.trail[cloneData.trail.length-1].y !== Math.round(cloneY)) {
                cloneData.trail.push({ x: Math.round(cloneX), y: Math.round(cloneY) });
                if (cloneData.trail.length > 30) cloneData.trail.shift();
            }
        }
    } else if (typeof cloneData !== 'undefined' && cloneData) {
        cloneData.active = false;
        cloneData.trail = [];
    }
    
    // ============================================================
    // ===== КЛОН АТАКУЕТ ВРАГОВ =====
    // ============================================================
    if (cloneActive && players[0].alive && cloneData && cloneData.active) {
        const cloneX = Math.round(players[0].x + (cloneData.offsetX || 2));
        const cloneY = Math.round(players[0].y + (cloneData.offsetY || 0));
        
        // === VS AI ===
        if (opponentType === 'ai' && players[1] && players[1].alive) {
            if (cloneX === Math.round(players[1].x) && cloneY === Math.round(players[1].y)) {
                players[1].alive = false;
                if (typeof explode === 'function') explode(players[1].x, players[1].y, '#ff44ff');
                showMessage('🌀 КЛОН СБИЛ БОТА!');
                players[0].score++;
                updateUI();
            }
        }
        
        // === ВЫЖИВАНИЕ ===
        if (typeof survivalEnemies !== 'undefined') {
            for (let e of survivalEnemies) {
                if (e.alive && cloneX === e.x && cloneY === e.y) {
                    e.alive = false;
                    if (typeof explode === 'function') explode(e.x, e.y, '#ff44ff');
                }
            }
        }
        
        // === БОСС ===
        if (typeof boss !== 'undefined' && boss && boss.alive) {
            for (let dx = 0; dx < boss.size; dx++) {
                for (let dy = 0; dy < boss.size; dy++) {
                    if (cloneX === boss.x + dx && cloneY === boss.y + dy) {
                        boss.health--;
                        if (typeof explode === 'function') explode(boss.x, boss.y, '#ff44ff');
                        if (boss.health <= 0) {
                            boss.alive = false;
                            showMessage('🌀 КЛОН УНИЧТОЖИЛ БОССА!');
                            boss = null;
                        } else {
                            showMessage(`💥 КЛОН РАНИЛ БОССА! ❤️ ${boss.health}/${boss.maxHealth}`);
                        }
                    }
                }
            }
        }
    }
    
    // === ОБНОВЛЕНИЕ РЕЖИМОВ ===
    if (opponentType === 'ai') {
        if (typeof aiMove === 'function') aiMove();
    }
    
    if (typeof updateParticles === 'function') updateParticles();
    
    // ============================================================
    // ===== ПРОВЕРКА СТОЛКНОВЕНИЙ (с учётом щита) =====
    // ============================================================
    for (let p of players) {
        if (!p.alive) continue;
        
        // === ЩИТ (полная неуязвимость) ===
        if (shieldActive && p === players[0]) {
            continue;
        }
        
        // Границы
        if (p.x < 0 || p.x >= WIDTH || p.y < 0 || p.y >= HEIGHT) {
            p.alive = false;
            crashEffect = { active: true, x: p.x, y: p.y, color: p.color, timer: 5 };
            if (typeof explode === 'function') explode(p.x, p.y, p.color);
            continue;
        }
        
        // Свой след
        for (let i = 0; i < p.trail.length - 2; i++) {
            if (p.trail[i].x === p.x && p.trail[i].y === p.y) {
                p.alive = false;
                crashEffect = { active: true, x: p.x, y: p.y, color: p.color, timer: 5 };
                if (typeof explode === 'function') explode(p.x, p.y, p.color);
                break;
            }
        }
        if (!p.alive) continue;
        
        // Следы других игроков
        for (let other of players) {
            if (other === p) continue;
            for (let i = 0; i < other.trail.length - 1; i++) {
                const seg = other.trail[i];
                const nextSeg = other.trail[i+1];
                const px = p.x * CELL_SIZE + CELL_SIZE/2;
                const py = p.y * CELL_SIZE + CELL_SIZE/2;
                const dist = pointToSegmentDistance(px, py,
                    seg.x * CELL_SIZE + CELL_SIZE/2, seg.y * CELL_SIZE + CELL_SIZE/2,
                    nextSeg.x * CELL_SIZE + CELL_SIZE/2, nextSeg.y * CELL_SIZE + CELL_SIZE/2);
                if (dist < CELL_SIZE/2) {
                    p.alive = false;
                    crashEffect = { active: true, x: p.x, y: p.y, color: p.color, timer: 5 };
                    if (typeof explode === 'function') explode(p.x, p.y, p.color);
                    break;
                }
            }
            if (!p.alive) break;
        }
    }
    
    // === ТАЙМЕР РАУНДА ===
    if ((matchMode === 'classic' || matchMode === 'tournament') && roundTimerActive) {
        if (roundTimer <= 0) {
            gameActive = false;
            if (roundTimerInterval) {
                clearInterval(roundTimerInterval);
                roundTimerInterval = null;
            }
            roundTimerActive = false;
            showMessage('⏰ НИЧЬЯ! ВРЕМЯ ВЫШЛО!');
            if (typeof stopBgMusic === 'function') stopBgMusic();
            updateUI();
            if (typeof draw === 'function') draw();
            return;
        }
    }
    
    // === ОПРЕДЕЛЕНИЕ ПОБЕДИТЕЛЯ ===
    const alivePlayers = players.filter(p => p.alive);
    if (alivePlayers.length === 1) {
        let winnerIdx = players.findIndex(p => p.alive);
        players[winnerIdx].score++;
        gameActive = false;
        if (roundTimerInterval) {
            clearInterval(roundTimerInterval);
            roundTimerInterval = null;
        }
        roundTimerActive = false;
        showVictory(players[winnerIdx].name);
        updateUI();
        if (typeof draw === 'function') draw();
        showMessage(`${players[winnerIdx].name} победил! Нажмите ИГРАТЬ`);
        if (typeof stopBgMusic === 'function') stopBgMusic();
        return;
    }
    
    if (alivePlayers.length === 0) {
        gameActive = false;
        if (roundTimerInterval) {
            clearInterval(roundTimerInterval);
            roundTimerInterval = null;
        }
        roundTimerActive = false;
        showMessage('Ничья!');
        if (typeof stopBgMusic === 'function') stopBgMusic();
        return;
    }
    
    currentSteps++;
    updateUI();
    if (typeof draw === 'function') draw();
}

// ===== ИНИЦИАЛИЗАЦИЯ ИГРЫ =====
function initGame() {
    if (typeof resetPlayers === 'function') resetPlayers();
    
    // === СБРОС БОНУСОВ ===
    if (typeof resetBonuses === 'function') {
        resetBonuses();
    }
    
    gameActive = false;
    countdownActive = true;
    countdownValue = 3;
    crashEffect.active = false;
    particles = [];
    currentSteps = 0;
    
    // === СБРОС ТАЙМЕРА РАУНДА ===
    roundTimer = 30;
    roundTimerActive = false;
    if (roundTimerInterval) {
        clearInterval(roundTimerInterval);
        roundTimerInterval = null;
    }
    
    updateUI();
    if (typeof draw === 'function') draw();
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    countdownInterval = setInterval(() => {
        countdownValue--;
        if (countdownValue === 2) {
            const msgDiv = document.getElementById('gameMessage');
            if (msgDiv) msgDiv.textContent = '2...';
            if (typeof countdownBeep === 'function') countdownBeep(2);
            if (typeof draw === 'function') draw();
        } else if (countdownValue === 1) {
            const msgDiv = document.getElementById('gameMessage');
            if (msgDiv) msgDiv.textContent = '1...';
            if (typeof countdownBeep === 'function') countdownBeep(1);
            if (typeof draw === 'function') draw();
        } else if (countdownValue === 0) {
            const msgDiv = document.getElementById('gameMessage');
            if (msgDiv) msgDiv.textContent = 'GO!';
            if (typeof countdownBeep === 'function') countdownBeep(0);
            if (typeof draw === 'function') draw();
        } else if (countdownValue < 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            const msgDiv = document.getElementById('gameMessage');
            if (msgDiv) msgDiv.textContent = '';
            gameActive = true;
            countdownActive = false;
            paused = false;
            
            // === ЗАПУСК ТАЙМЕРА РАУНДА ===
            if (matchMode === 'classic' || matchMode === 'tournament') {
                roundTimer = 30;
                roundTimerActive = true;
                if (roundTimerInterval) {
                    clearInterval(roundTimerInterval);
                    roundTimerInterval = null;
                }
                roundTimerInterval = setInterval(() => {
                    roundTimer--;
                    updateUI();
                    if (typeof draw === 'function') draw();
                }, 1000);
            }
            
            if (typeof playBgMusic === 'function') playBgMusic();
            if (gameLoop) clearInterval(gameLoop);
            gameLoop = setInterval(() => {
                if (paused || !gameActive) return;
                updateGame();
            }, MOVE_INTERVAL);
        }
    }, 1000);
}

function resetGame() {
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = null;
    paused = false;
    if (roundTimerInterval) {
        clearInterval(roundTimerInterval);
        roundTimerInterval = null;
    }
    roundTimerActive = false;
    // Сбрасываем данные клона
    if (typeof cloneData !== 'undefined' && cloneData) {
        cloneData.active = false;
        cloneData.trail = [];
    }
    initGame();
}
