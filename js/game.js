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
const ROUND_DELAY = 2500; // 2.5 секунды задержки

// ===== ОТСРОЧКА ПОБЕДЫ =====
let victoryPending = false;
let victoryPendingTimer = null;
let victoryFreezeTimer = null;

// ============================================================
// ===== БОНУСЫ (флаги для быстрого доступа) =====
// ============================================================
let bonusSpeedActive = false;
let bonusShieldActive = false;
let bonusCloneActive = false;
let cloneActive = false;

// След клона (отдельный массив)
let cloneTrail = [];

// cloneData объявлен в bonuses.js — используем его для позиции

// ===== ЗАДЕРЖКА МЕЖДУ РАУНДАМИ =====
function startRoundDelay(callback) {
    // Отменяем предыдущую задержку если была
    if (roundDelayTimer) {
        clearTimeout(roundDelayTimer);
        roundDelayTimer = null;
    }
    
    roundDelayActive = true;
    
    // Показываем таймер задержки на экране
    let remaining = Math.ceil(ROUND_DELAY / 1000);
    showMessage(`⏳ Следующий раунд через ${remaining}...`);
    
    // Обновляем таймер каждую секунду
    const timerInterval = setInterval(() => {
        remaining--;
        if (remaining > 0) {
            showMessage(`⏳ Следующий раунд через ${remaining}...`);
        } else {
            clearInterval(timerInterval);
        }
    }, 1000);
    
    // Запускаем задержку
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
    
    // Голос победы
    if (typeof speakVictory === 'function') {
        speakVictory(`${name} победил!`);
    }
}

// ===== ПРОВЕРКА ПОБЕДЫ С ЗАДЕРЖКОЙ =====
function checkVictoryWithDelay() {
    // Если уже есть ожидающая победа - не проверяем
    if (victoryPending) return;
    
    const alivePlayers = players.filter(p => p.alive);
    
    // Если остался 1 игрок
    if (alivePlayers.length === 1) {
        victoryPending = true;
        let winnerIdx = players.findIndex(p => p.alive);
        let winnerName = players[winnerIdx].name;
        
        // Увеличиваем счет сразу
        players[winnerIdx].score++;
        
        // Обновляем турнирный счет
        if (matchMode === 'tournament') {
            if (winnerName === 'Синий') tournamentScore[0]++;
            else if (winnerName === 'Оранжевый') tournamentScore[1]++;
        }
        
        // Останавливаем таймер
        if (roundTimerInterval) {
            clearInterval(roundTimerInterval);
            roundTimerInterval = null;
        }
        roundTimerActive = false;
        gameActive = false;
        
        // Останавливаем музыку
        if (typeof stopBgMusic === 'function') stopBgMusic();
        
        // Обновляем UI
        updateUI();
        if (typeof draw === 'function') draw();
        
        // ===== ЗАДЕРЖКА 3 СЕКУНДЫ - ДАЕМ ВЗРЫВУ ДОИГРАТЬ =====
        showMessage(`🏆 ${winnerName} победил! Эффекты доигрывают...`);
        
        victoryPendingTimer = setTimeout(() => {
            victoryPending = false;
            victoryPendingTimer = null;
            
            // Скрываем сообщение
            showMessage('');
            
            // Теперь показываем полноценное табло
            showVictory(winnerName);
            
            // === ТУРНИР ===
            if (matchMode === 'tournament') {
                // Проверяем, достиг ли кто-то цели
                if (tournamentScore[0] >= tournamentTarget || tournamentScore[1] >= tournamentTarget) {
                    let finalWinner = tournamentScore[0] >= tournamentTarget ? 'Синий' : 'Оранжевый';
                    showMessage(`🏆 ТУРНИР ВЫИГРАЛ ${finalWinner.toUpperCase()}! 🏆`);
                    // Сбрасываем турнирный счет только после окончания турнира
                    tournamentScore = [0, 0];
                    tournamentActive = false;
                    // Задержка перед возвратом в меню
                    setTimeout(() => {
                        showScreen('menuScreen');
                    }, 3000);
                    return;
                }
                
                // Сохраняем счет перед рестартом
                const savedScore = [...tournamentScore];
                startRoundDelay(() => {
                    resetGame();
                    // Восстанавливаем счет после рестарта
                    tournamentScore = savedScore;
                    updateUI();
                    showMessage(`Счёт турнира: ${tournamentScore[0]} : ${tournamentScore[1]} (до ${tournamentTarget})`);
                });
            } else {
                // Классика
                startRoundDelay(() => {
                    resetGame();
                    showMessage('Новый раунд!');
                });
            }
        }, 3000);
    }
    
    // Если все умерли - ничья
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
    // Если игра не активна, но есть ожидающая победа - продолжаем обновлять эффекты
    if (!gameActive && !victoryPending) return;
    
    // ============================================================
    // ===== ОБНОВЛЕНИЕ ЭФФЕКТОВ ВЗРЫВА (ВСЕГДА) =====
    // ============================================================
    if (typeof updateExplosionEffects === 'function') {
        updateExplosionEffects();
    }
    
    // Если игра не активна - только эффекты, больше ничего не делаем
    if (!gameActive) {
        if (typeof updateParticles === 'function') updateParticles();
        if (typeof draw === 'function') draw();
        return;
    }
    
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
    
    // ============================================================
    // ===== ДВИЖЕНИЕ ИГРОКОВ (с ускорением) =====
    // ============================================================
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
        if (cloneTrail.length > 30) cloneTrail.shift();
        
        if (cloneData) {
            cloneData.active = true;
            cloneData.offsetX = 2;
            cloneData.offsetY = 0;
        }
    } else {
        cloneTrail = [];
        if (cloneData) {
            cloneData.active = false;
            cloneData.trail = [];
        }
    }
    
    // === ОБНОВЛЕНИЕ РЕЖИМОВ ===
    if (opponentType === 'ai') {
        if (typeof aiMove === 'function') aiMove();
    }
    
    if (typeof updateParticles === 'function') updateParticles();
    
    // ============================================================
    // ===== ПРОВЕРКА СТОЛКНОВЕНИЙ =====
    // ============================================================
    for (let p of players) {
        if (!p.alive) continue;
        
        if (shieldActive && p === players[0]) {
            continue;
        }
        
        if (p.x < 0 || p.x >= WIDTH || p.y < 0 || p.y >= HEIGHT) {
            p.alive = false;
            crashEffect = { active: true, x: p.x, y: p.y, color: p.color, timer: 5 };
            if (typeof explode === 'function') explode(p.x, p.y, p.color);
            continue;
        }
        
        for (let i = 0; i < p.trail.length - 2; i++) {
            if (p.trail[i].x === p.x && p.trail[i].y === p.y) {
                p.alive = false;
                crashEffect = { active: true, x: p.x, y: p.y, color: p.color, timer: 5 };
                if (typeof explode === 'function') explode(p.x, p.y, p.color);
                break;
            }
        }
        if (!p.alive) continue;
        
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
        if (!p.alive) continue;
        
        if (cloneTrail.length > 1) {
            if (p === players[1] && opponentType === 'ai') {
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
            
            setTimeout(() => {
                resetGame();
            }, 2000);
            return;
        }
    }
    
    // === ОПРЕДЕЛЕНИЕ ПОБЕДИТЕЛЯ ===
    checkVictoryWithDelay();
    
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
    
    // Сброс состояния победы
    if (victoryPendingTimer) {
        clearTimeout(victoryPendingTimer);
        victoryPendingTimer = null;
    }
    victoryPending = false;
    
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
    // Отменяем ожидающую победу
    if (victoryPendingTimer) {
        clearTimeout(victoryPendingTimer);
        victoryPendingTimer = null;
    }
    victoryPending = false;
    
    // Отменяем задержку между раундами
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
    // Эффекты взрыва НЕ сбрасываем
    initGame();
}
