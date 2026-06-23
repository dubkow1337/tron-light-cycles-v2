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

// ===== ЗАДЕРЖКА МЕЖДУ РАУНДАМИ =====
let roundDelayTimer = null;
let roundDelayActive = false;
const ROUND_DELAY = 2500;

// ===== ОТСРОЧКА ПОБЕДЫ =====
let victoryPending = false;
let victoryPendingTimer = null;

// ============================================================
// ===== БОНУСЫ (флаги для быстрого доступа) =====
// ============================================================
let bonusSpeedActive = false;
let bonusShieldActive = false;
let bonusCloneActive = false;
let cloneActive = false;

// След клона (отдельный массив)
let cloneTrail = [];

// cloneData объявлен в bonuses.js

// ===== ЗАДЕРЖКА МЕЖДУ РАУНДАМИ =====
function startRoundDelay(callback) {
    if (roundDelayTimer) {
        clearTimeout(roundDelayTimer);
        roundDelayTimer = null;
    }
    
    roundDelayActive = true;
    
    let remaining = Math.ceil(ROUND_DELAY / 1000);
    showMessage(`⏳ Следующий раунд через ${remaining}...`);
    
    const timerInterval = setInterval(() => {
        remaining--;
        if (remaining > 0) {
            showMessage(`⏳ Следующий раунд через ${remaining}...`);
        } else {
            clearInterval(timerInterval);
        }
    }, 1000);
    
    roundDelayTimer = setTimeout(() => {
        roundDelayActive = false;
        clearInterval(timerInterval);
        showMessage('');
        if (callback) callback();
    }, ROUND_DELAY);
}

function cancelRoundDelay() {
    if (roundDelayTimer) {
        clearTimeout(roundDelayTimer);
        roundDelayTimer = null;
    }
    roundDelayActive = false;
}

// ===== СБРОС ИГРОКОВ =====
function resetPlayers() {
    // Если режим выживания — только один игрок
    if (matchMode === 'survival') {
        players[0].x = 5;
        players[0].y = Math.floor(HEIGHT / 2);
        players[0].dirX = 1;
        players[0].dirY = 0;
        players[0].trail = [{ x: players[0].x, y: players[0].y }];
        players[0].alive = true;
        players[0].score = 0;
        
        // Второго игрока выключаем
        players[1].alive = false;
        players[1].x = -10;
        players[1].y = -10;
        players[1].trail = [];
        players[1].score = 0;
        return;
    }
    
    // Для классики и турнира — два игрока
    players[0].x = 5;
    players[0].y = Math.floor(HEIGHT / 2);
    players[0].dirX = 1;
    players[0].dirY = 0;
    players[0].trail = [{ x: players[0].x, y: players[0].y }];
    players[0].alive = true;
    players[0].score = 0;
    
    players[1].x = WIDTH - 6;
    players[1].y = Math.floor(HEIGHT / 2);
    players[1].dirX = -1;
    players[1].dirY = 0;
    players[1].trail = [{ x: players[1].x, y: players[1].y }];
    players[1].alive = true;
    players[1].score = 0;
}

// ===== GAME OVER (ДЛЯ РЕЖИМА ВЫЖИВАНИЯ) =====
function showGameOver() {
    const overlay = document.getElementById('victoryOverlay');
    if (!overlay) return;
    
    // Останавливаем музыку
    if (typeof stopBgMusic === 'function') {
        stopBgMusic();
    }
    
    const steps = currentSteps || 0;
    
    // Обновляем рекорд
    if (steps > bestRecord) {
        bestRecord = steps;
        localStorage.setItem('tronRecord', bestRecord.toString());
        const recordDisplay = document.getElementById('menuRecordDisplay');
        if (recordDisplay) recordDisplay.innerText = bestRecord;
    }
    
    overlay.innerText = `💀 GAME OVER\n🏆 СЧЁТ: ${steps}`;
    overlay.style.fontSize = 'clamp(28px, 4vw, 48px)';
    overlay.style.borderColor = '#ff3333';
    overlay.style.boxShadow = '0 0 80px rgba(255, 0, 0, 0.4), inset 0 0 80px rgba(255, 0, 0, 0.1)';
    overlay.style.textShadow = '0 0 40px #ff3333, 0 0 80px #ff0000, 0 0 120px #cc0000';
    overlay.style.color = '#ff3333';
    overlay.style.whiteSpace = 'pre-line';
    overlay.style.textAlign = 'center';
    overlay.style.lineHeight = '1.4';
    overlay.classList.remove('tournament');
    overlay.classList.add('show');
    
    // Задержка 4 секунды и выход в меню
    setTimeout(() => {
        overlay.classList.remove('show');
        overlay.style.whiteSpace = '';
        overlay.style.textAlign = '';
        overlay.style.color = '';
        overlay.style.borderColor = '';
        overlay.style.boxShadow = '';
        overlay.style.textShadow = '';
        overlay.style.fontSize = '';
        overlay.style.lineHeight = '';
        
        // Полная остановка игры
        if (typeof gameLoop !== 'undefined' && gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        gameActive = false;
        
        // Сбрасываем бонусы, врагов и босса
        if (typeof resetBonuses === 'function') resetBonuses();
        if (typeof resetBoss === 'function') resetBoss();
        if (typeof survivalEnemies !== 'undefined') survivalEnemies = [];
        if (typeof resetSurvivalTimer === 'function') resetSurvivalTimer();
        
        showScreen('menuScreen');
        showMessage('Выберите режим и нажмите ИГРАТЬ');
    }, 4000);
}

// ===== ПОБЕДА =====
function showVictory(name, isTournamentFinal = false) {
    const overlay = document.getElementById('victoryOverlay');
    if (overlay) {
        const isBlue = name === 'Синий';
        const mainColor = isBlue ? '#00ffff' : '#ffaa00';
        const glowColor = isBlue ? '#0088ff' : '#ff6600';
        
        if (isTournamentFinal) {
            overlay.innerText = `🏆 ${name.toUpperCase()} ВЫИГРАЛ ТУРНИР! 🏆`;
            overlay.style.fontSize = 'clamp(32px, 5vw, 56px)';
            overlay.style.borderColor = '#ffd700';
            overlay.style.boxShadow = '0 0 80px rgba(255, 215, 0, 0.4), inset 0 0 80px rgba(255, 215, 0, 0.1)';
            overlay.style.textShadow = '0 0 40px #ffd700, 0 0 80px #ff8800, 0 0 120px #ff4400';
            overlay.classList.add('show');
            overlay.classList.add('tournament');
            
            if (typeof startFireworks === 'function') {
                setTimeout(() => startFireworks(mainColor, 12), 0);
                setTimeout(() => startFireworks('#ffd700', 8), 500);
                setTimeout(() => startFireworks('#ff4400', 8), 1000);
                setTimeout(() => startFireworks(mainColor, 10), 1500);
            }
            
            showMessage(`🏆 ФИНАЛЬНЫЙ СЧЁТ: ${tournamentScore[0]} : ${tournamentScore[1]}`);
            
            setTimeout(() => {
                overlay.classList.remove('show');
                overlay.classList.remove('tournament');
                overlay.style.fontSize = '';
                overlay.style.borderColor = '';
                overlay.style.boxShadow = '';
                overlay.style.textShadow = '';
                showScreen('menuScreen');
            }, 6000);
            
        } else {
            overlay.innerText = `${name.toUpperCase()} ПОБЕДИЛ!`;
            overlay.style.fontSize = '';
            overlay.style.borderColor = mainColor;
            overlay.style.boxShadow = `0 0 60px rgba(${isBlue ? '0, 255, 255' : '255, 170, 0'}, 0.4), inset 0 0 60px rgba(${isBlue ? '0, 255, 255' : '255, 170, 0'}, 0.1)`;
            overlay.style.textShadow = `0 0 30px ${mainColor}, 0 0 60px ${glowColor}`;
            overlay.style.color = mainColor;
            overlay.classList.remove('tournament');
            overlay.classList.add('show');
            
            if (typeof startFireworks === 'function') {
                startFireworks(mainColor, 6);
            }
            
            setTimeout(() => {
                overlay.classList.remove('show');
                overlay.style.color = '';
                overlay.style.borderColor = '';
                overlay.style.boxShadow = '';
                overlay.style.textShadow = '';
            }, 4000);
        }
    }
}

// ===== ПРОВЕРКА ПОБЕДЫ С ЗАДЕРЖКОЙ =====
function checkVictoryWithDelay() {
    if (victoryPending) return;
    
    const alivePlayers = players.filter(p => p.alive);
    
    if (alivePlayers.length === 1) {
        victoryPending = true;
        let winnerIdx = players.findIndex(p => p.alive);
        let winnerName = players[winnerIdx].name;
        
        players[winnerIdx].score++;
        
        if (matchMode === 'tournament') {
            if (winnerName === 'Синий') tournamentScore[0]++;
            else if (winnerName === 'Оранжевый') tournamentScore[1]++;
        }
        
        if (roundTimerInterval) {
            clearInterval(roundTimerInterval);
            roundTimerInterval = null;
        }
        roundTimerActive = false;
        gameActive = false;
        
        if (typeof stopBgMusic === 'function') stopBgMusic();
        
        updateUI();
        if (typeof draw === 'function') draw();
        
        showMessage(`🏆 ${winnerName} победил! Эффекты доигрывают...`);
        
        victoryPendingTimer = setTimeout(() => {
            victoryPending = false;
            victoryPendingTimer = null;
            
            showMessage('');
            
            const isTournamentFinal = matchMode === 'tournament' && 
                (tournamentScore[0] >= tournamentTarget || tournamentScore[1] >= tournamentTarget);
            
            if (isTournamentFinal) {
                showVictory(winnerName, true);
                tournamentScore = [0, 0];
                tournamentActive = false;
            } else if (matchMode === 'tournament') {
                const savedScore = [...tournamentScore];
                showVictory(winnerName, false);
                startRoundDelay(() => {
                    resetGame();
                    tournamentScore = savedScore;
                    updateUI();
                    showMessage(`Счёт турнира: ${tournamentScore[0]} : ${tournamentScore[1]} (до ${tournamentTarget})`);
                });
            } else {
                showVictory(winnerName, false);
                startRoundDelay(() => {
                    resetGame();
                    showMessage('Новый раунд!');
                });
            }
        }, 3000);
    }
    
    if (alivePlayers.length === 0) {
        gameActive = false;
        if (roundTimerInterval) {
            clearInterval(roundTimerInterval);
            roundTimerInterval = null;
        }
        roundTimerActive = false;
        showMessage('🤝 Ничья!');
        if (typeof stopBgMusic === 'function') stopBgMusic();
        if (typeof draw === 'function') draw();
        
        setTimeout(() => {
            resetGame();
        }, 2000);
    }
}

// ===== ОСНОВНОЙ ИГРОВОЙ ЦИКЛ =====
function updateGame() {
    if (!gameActive && !victoryPending) return;
    
    if (typeof updateExplosionEffects === 'function') {
        updateExplosionEffects();
    }
    
    if (!gameActive) {
        if (typeof updateParticles === 'function') updateParticles();
        if (typeof draw === 'function') draw();
        return;
    }
    
    if (typeof updateBonuses === 'function') {
        updateBonuses();
    }
    
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
    
    let speedMultiplier = 1;
    let shieldActive = false;
    cloneActive = false;
    
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
    
    bonusSpeedActive = speedMultiplier > 1;
    bonusShieldActive = shieldActive;
    bonusCloneActive = cloneActive;
    
    // ===== ДВИЖЕНИЕ ИГРОКОВ =====
    for (let p of players) {
        if (!p.alive) continue;
        p.x += p.dirX * speedMultiplier;
        p.y += p.dirY * speedMultiplier;
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 50) p.trail.shift();
        if (typeof addParticles === 'function') addParticles(p.x, p.y, p.color);
    }
    
    // ============================================================
    // ===== КЛОН: ДВИЖЕНИЕ И СЛЕД =====
    // ============================================================
    if (cloneActive && players[0].alive) {
        const cloneX = players[0].x + 2;
        const cloneY = players[0].y;
        
        cloneTrail.push({ x: Math.round(cloneX), y: Math.round(cloneY) });
        if (cloneTrail.length > 50) cloneTrail.shift();
        
        if (cloneData) {
            cloneData.active = true;
            cloneData.offsetX = 2;
            cloneData.offsetY = 0;
            cloneData.trail = cloneTrail;
        }
    } else {
        cloneTrail = [];
        if (cloneData) {
            cloneData.active = false;
            cloneData.trail = [];
        }
    }
    
    // ============================================================
    // ===== РЕЖИМ ВЫЖИВАНИЕ =====
    // ============================================================
    if (matchMode === 'survival') {
        if (typeof updateSurvival === 'function') {
            updateSurvival();
        }
        // ===== БОСС В ВЫЖИВАНИИ =====
        if (typeof updateBoss === 'function' && boss && boss.alive) {
            updateBoss();
        }
    }
    
    // ===== ИИ ТОЛЬКО В РЕЖИМЕ VS AI (НЕ В ВЫЖИВАНИИ) =====
    if (opponentType === 'ai' && matchMode !== 'survival') {
        if (typeof aiMove === 'function') aiMove();
    }
    
    if (typeof updateParticles === 'function') updateParticles();
    
    // ===== ПРОВЕРКА СТОЛКНОВЕНИЙ =====
    for (let p of players) {
        if (!p.alive) continue;
        
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
                // ===== ВЫЗОВ ТАБЛО ДЛЯ ВЫЖИВАНИЯ =====
                if (matchMode === 'survival' && typeof showGameOver === 'function') {
                    setTimeout(showGameOver, 300);
                }
                break;
            }
        }
        if (!p.alive) continue;
        
        // ===== СЛЕДЫ ДРУГИХ ИГРОКОВ (ТОЛЬКО НЕ В ВЫЖИВАНИИ) =====
        if (matchMode !== 'survival') {
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
        if (!p.alive) continue;
        
        // ===== СЛЕД КЛОНА (ОПАСЕН ТОЛЬКО ДЛЯ БОТА) =====
        if (cloneTrail.length > 1) {
            if (p === players[1] && opponentType === 'ai' && matchMode !== 'survival') {
                for (let i = 0; i < cloneTrail.length - 1; i++) {
                    const seg = cloneTrail[i];
                    const nextSeg = cloneTrail[i+1];
                    const px = p.x * CELL_SIZE + CELL_SIZE/2;
                    const py = p.y * CELL_SIZE + CELL_SIZE/2;
                    const dist = pointToSegmentDistance(px, py,
                        seg.x * CELL_SIZE + CELL_SIZE/2, seg.y * CELL_SIZE + CELL_SIZE/2,
                        nextSeg.x * CELL_SIZE + CELL_SIZE/2, nextSeg.y * CELL_SIZE + CELL_SIZE/2);
                    if (dist < CELL_SIZE/2) {
                        p.alive = false;
                        if (typeof explode === 'function') explode(p.x, p.y, '#ff44ff');
                        players[0].score++;
                        showMessage('🌀 КЛОН СБИЛ БОТА!');
                        updateUI();
                        break;
                    }
                }
            }
        }
        if (!p.alive) continue;
        
        // ===== ВРАГИ (ВЫЖИВАНИЕ) =====
        if (typeof survivalEnemies !== 'undefined') {
            for (let e of survivalEnemies) {
                if (!e.alive) continue;
                for (let i = 0; i < e.trail.length - 1; i++) {
                    const seg = e.trail[i];
                    const nextSeg = e.trail[i+1];
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
        
        // ===== БОСС =====
        if (!p.alive) continue;
        if (typeof boss !== 'undefined' && boss && boss.alive) {
            for (let dx = 0; dx < boss.size; dx++) {
                for (let dy = 0; dy < boss.size; dy++) {
                    const bx = boss.x + dx;
                    const by = boss.y + dy;
                    if (p.x === bx && p.y === by) {
                        p.alive = false;
                        crashEffect = { active: true, x: p.x, y: p.y, color: p.color, timer: 5 };
                        if (typeof explode === 'function') explode(p.x, p.y, p.color);
                        break;
                    }
                }
                if (!p.alive) break;
            }
        }
    }
    
    // ===== ТАЙМЕР РАУНДА (ТОЛЬКО ДЛЯ КЛАССИКИ И ТУРНИРА) =====
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
            
            setTimeout(() => {
                resetGame();
            }, 2000);
            return;
        }
    }
    
    // ===== ПРОВЕРКА ПОБЕДЫ (ТОЛЬКО ДЛЯ КЛАССИКИ И ТУРНИРА) =====
    if (matchMode === 'classic' || matchMode === 'tournament') {
        checkVictoryWithDelay();
    }
    
    currentSteps++;
    updateUI();
    if (typeof draw === 'function') draw();
}

// ===== ИНИЦИАЛИЗАЦИЯ ИГРЫ =====
function initGame() {
    if (typeof resetPlayers === 'function') resetPlayers();
    
    if (typeof resetBonuses === 'function') {
        resetBonuses();
    }
    
    gameActive = false;
    countdownActive = true;
    countdownValue = 3;
    crashEffect.active = false;
    particles = [];
    currentSteps = 0;
    
    cloneTrail = [];
    cloneActive = false;
    if (typeof cloneData !== 'undefined' && cloneData) {
        cloneData.active = false;
        cloneData.trail = [];
    }
    
    roundTimer = 30;
    roundTimerActive = false;
    if (roundTimerInterval) {
        clearInterval(roundTimerInterval);
        roundTimerInterval = null;
    }
    
    if (victoryPendingTimer) {
        clearTimeout(victoryPendingTimer);
        victoryPendingTimer = null;
    }
    victoryPending = false;
    
    // ===== СБРОС РЕЖИМА ВЫЖИВАНИЯ =====
    if (matchMode === 'survival') {
        if (typeof survivalEnemies !== 'undefined') {
            survivalEnemies = [];
        }
        if (typeof resetSurvivalTimer === 'function') {
            resetSurvivalTimer();
        }
        if (typeof resetBoss === 'function') {
            resetBoss();
        }
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
            
            // ===== ЗАПУСК ТАЙМЕРА (ТОЛЬКО ДЛЯ КЛАССИКИ И ТУРНИРА) =====
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
            } else if (matchMode === 'survival') {
                roundTimerActive = false;
                if (roundTimerInterval) {
                    clearInterval(roundTimerInterval);
                    roundTimerInterval = null;
                }
            }
            
            // ===== ЗАПУСК РЕЖИМА ВЫЖИВАНИЯ =====
            if (matchMode === 'survival') {
                if (typeof spawnSurvivalEnemies === 'function') {
                    spawnSurvivalEnemies();
                }
            }
            
            if (typeof playBgMusic === 'function') playBgMusic();
            if (gameLoop) clearInterval(gameLoop);
            gameLoop = setInterval(() => {
                if (paused || !gameActive) {
                    if (typeof updateExplosionEffects === 'function') {
                        updateExplosionEffects();
                    }
                    if (typeof updateParticles === 'function') updateParticles();
                    if (typeof draw === 'function') draw();
                    return;
                }
                updateGame();
            }, MOVE_INTERVAL);
        }
    }, 1000);
}

function resetGame() {
    if (victoryPendingTimer) {
        clearTimeout(victoryPendingTimer);
        victoryPendingTimer = null;
    }
    victoryPending = false;
    
    cancelRoundDelay();
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = null;
    paused = false;
    if (roundTimerInterval) {
        clearInterval(roundTimerInterval);
        roundTimerInterval = null;
    }
    roundTimerActive = false;
    cloneTrail = [];
    cloneActive = false;
    if (typeof cloneData !== 'undefined' && cloneData) {
        cloneData.active = false;
        cloneData.trail = [];
    }
    
    // ===== СБРОС РЕЖИМА ВЫЖИВАНИЯ =====
    if (matchMode === 'survival') {
        if (typeof survivalEnemies !== 'undefined') {
            survivalEnemies = [];
        }
        if (typeof resetSurvivalTimer === 'function') {
            resetSurvivalTimer();
        }
        if (typeof resetBoss === 'function') {
            resetBoss();
        }
        if (typeof clearSurvivalEnemies === 'function') {
            clearSurvivalEnemies();
        }
        if (typeof currentSteps !== 'undefined') {
            currentSteps = 0;
        }
    }
    
    initGame();
}
