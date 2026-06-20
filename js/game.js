// ========== ГЛАВНАЯ ЛОГИКА ИГРЫ ==========

let gameActive = true;
let gameLoop = null;
let countdownInterval = null;
let countdownActive = false;
let countdownValue = 3;
let currentSteps = 0;
let bestRecord = localStorage.getItem('tronRecord') ? parseInt(localStorage.getItem('tronRecord')) : 0;
let MOVE_INTERVAL = 70;

// ===== ROUND TIMER =====
const ROUND_DURATION = 30; // seconds
let roundEndTime = null; // timestamp in ms

// paused объявлен в ui.js — НЕ ОБЪЯВЛЯЕМ ЕГО ЗДЕСЬ!

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
    
    // === ВЫЖИВАНИЕ (рекорд) ===
    if (opponentType === 'survival' && currentSteps > bestRecord) {
        bestRecord = currentSteps;
        localStorage.setItem('tronRecord', bestRecord);
        const recordDisplay = document.getElementById('menuRecordDisplay');
        if (recordDisplay) recordDisplay.innerText = bestRecord;
        showMessage(`🏆 НОВЫЙ РЕКОРД: ${bestRecord} шагов!`);
    }
    
    // Голос победы
    if (typeof speakVictory === 'function') {
        speakVictory(`${name} победил!`);
    }
}

// ===== HANDLE ROUND TIMEOUT =====
function handleRoundTimeout() {
    gameActive = false;
    showMessage('⏱ Время раунда истекло!');
    if (typeof stopBgMusic === 'function') stopBgMusic();
    // В турнире — ничья (ничего не начисляется), запускаем следующий раунд
    if (matchMode === 'tournament') {
        setTimeout(() => { resetGame(); }, 1500);
    } else if (matchMode === 'classic') {
        // В классике — ничья, показываем и reset
        setTimeout(() => { resetGame(); }, 1500);
    } else {
        // Для других режимов просто reset
        setTimeout(() => { resetGame(); }, 1500);
    }
}

// ===== ОСНОВНОЙ ИГРОВОЙ ЦИКЛ =====
function updateGame() {
    if (!gameActive) return;
    
    // Обновляем таймер раунда (показываем между счётом)
    const timerEl = document.getElementById('roundTimer');
    if (timerEl) {
        const timeLeft = roundEndTime ? Math.max(0, Math.ceil((roundEndTime - Date.now()) / 1000)) : ROUND_DURATION;
        timerEl.innerText = String(timeLeft);
        if (timeLeft <= 0) {
            handleRoundTimeout();
            return;
        }
    }
    
    // === РЕЖИМ ГОНКИ ===
    if (matchMode === 'race') {
        if (typeof updateRace === 'function') updateRace();
        if (typeof drawRace === 'function') drawRace();
        updateUI();
        return;
    }

    // === ВЫЗОВ ИИ (если выбран) — делаем это перед движением игроков, чтобы направление применялось сразу ===
    if (opponentType === 'ai') {
        if (typeof aiMove === 'function') aiMove();
    }
    
    // === ДВИЖЕНИЕ ИГРОКОВ ===
    for (let p of players) {
        if (!p.alive) continue;
        p.x += p.dirX;
        p.y += p.dirY;
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 15) p.trail.shift();
        if (typeof addParticles === 'function') addParticles(p.x, p.y, p.color);
    }
    
    // === ОБНОВЛЕНИЕ РЕЖИМОВ ===
    if (matchMode === 'classic') {
        if (typeof updateClassic === 'function') updateClassic();
    } else if (matchMode === 'tournament') {
        // Турнир — ничего дополнительного не нужно
    }

    if (opponentType === 'survival') {
        if (typeof updateSurvival === 'function') updateSurvival();
    }
    
    if (typeof updateParticles === 'function') updateParticles();
    
    // === ПРОВЕРКА СТОЛКНОВЕНИЙ ===
    for (let p of players) {
        if (!p.alive) continue;
        
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
        
        // Следы врагов (выживание)
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
        
        // Босс (только в выживании)
        if (!p.alive) continue;
        if (opponentType === 'survival' && typeof boss !== 'undefined' && boss && boss.alive) {
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
    
    // === ОПРЕДЕЛЕНИЕ ПОБЕДИТЕЛЯ ===
    const alivePlayers = players.filter(p => p.alive);
    if (alivePlayers.length === 1 && opponentType !== 'survival') {
        let winnerIdx = players.findIndex(p => p.alive);
        players[winnerIdx].score++;
        gameActive = false;
        showVictory(players[winnerIdx].name);
        updateUI();
        if (typeof draw === 'function') draw();
        showMessage(`${players[winnerIdx].name} победил! Нажмите ИГРАТЬ`);
        if (typeof stopBgMusic === 'function') stopBgMusic();
        return;
    }
    
    if (alivePlayers.length === 0 && opponentType !== 'survival') {
        gameActive = false;
        showMessage('Ничья!');
        if (typeof stopBgMusic === 'function') stopBgMusic();
        return;
    }
    
    if (opponentType === 'survival' && !players[0].alive) {
        gameActive = false;
        showMessage('ВЫ ПРОИГРАЛИ! Нажмите ИГРАТЬ');
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
    
    // сбрасываем таймер раунда
    roundEndTime = null;
    
    if (opponentType === 'survival') {
        if (typeof spawnSurvivalEnemies === 'function') spawnSurvivalEnemies();
        players[1].alive = false;
    }
    
    gameActive = false;
    countdownActive = true;
    countdownValue = 3;
    crashEffect.active = false;
    particles = [];
    currentSteps = 0;
    
    // показать начальное значение таймера в UI
    const timerEl = document.getElementById('roundTimer');
    if (timerEl) timerEl.innerText = String(ROUND_DURATION);
    
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
            if (typeof playBgMusic === 'function') playBgMusic();
            // устанавливаем окончание раунда
            roundEndTime = Date.now() + ROUND_DURATION * 1000;
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
    initGame();
}
