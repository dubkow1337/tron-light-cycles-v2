// ========== ИНТЕРФЕЙС: ЭКРАНЫ И МЕНЮ ==========

let opponentType = '2p';
let matchMode = 'classic';
let paused = false;
let tournamentActive = false;
let tournamentScore = [0, 0];
let tournamentTarget = 3;

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
    
    const bgVideo = document.getElementById('bgVideo');
    if (bgVideo) {
        if (screenId === 'gameScreen') {
            bgVideo.style.display = 'none';
        } else {
            bgVideo.style.display = 'block';
        }
    }
    
    // ===== ПЕРЕКЛЮЧАЕМ МУЗЫКУ В ЗАВИСИМОСТИ ОТ ЭКРАНА =====
    if (typeof switchMusicForScreen === 'function') {
        setTimeout(() => {
            switchMusicForScreen(screenId);
        }, 100);
    }
}

// ===== УНИВЕРСАЛЬНАЯ ФУНКЦИЯ АКТИВНЫХ КНОПОК =====
function setMenuActive(group, activeId) {
    // Для новых кнопок (module-btn)
    const moduleButtons = document.querySelectorAll(`.module-btn[data-group="${group}"]`);
    moduleButtons.forEach(btn => btn.classList.remove('active'));
    const activeModuleBtn = document.getElementById(activeId);
    if (activeModuleBtn) {
        activeModuleBtn.classList.add('active');
    }
    
    // Для старых кнопок (menu-btn) — на случай, если остались
    const menuButtons = document.querySelectorAll(`.menu-btn[data-group="${group}"]`);
    menuButtons.forEach(btn => btn.classList.remove('active'));
    const activeMenuBtn = document.getElementById(activeId);
    if (activeMenuBtn) {
        activeMenuBtn.classList.add('active');
    }
}

// ===== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ЗВУКА КЛИКА =====
function playClickWithCheck() {
    if (typeof playClickSound === 'function') {
        playClickSound();
    }
}

function setupEventListeners() {
    // ===== ГРУППА 1: ПРОТИВНИК =====
    const btn2p = document.getElementById('menuOpponent2p');
    const btnAI = document.getElementById('menuOpponentAI');
    
    if (btn2p) {
        btn2p.addEventListener('click', () => {
            playClickWithCheck();
            opponentType = '2p';
            setMenuActive('opponent', 'menuOpponent2p');
            showMessage('Противник: 2 игрока');
        });
    }
    if (btnAI) {
        btnAI.addEventListener('click', () => {
            playClickWithCheck();
            opponentType = 'ai';
            setMenuActive('opponent', 'menuOpponentAI');
            showMessage('Противник: VS AI');
        });
    }
    
    // ===== ГРУППА 2: РЕЖИМ МАТЧА =====
    const btnClassic = document.getElementById('menuMatchClassic');
    const btnTournament = document.getElementById('menuMatchTournament');
    const btnSurvival = document.getElementById('menuMatchSurvival');
    const btnRace = document.getElementById('menuMatchRace');
    
    if (btnClassic) {
        btnClassic.addEventListener('click', () => {
            playClickWithCheck();
            matchMode = 'classic';
            setMenuActive('match', 'menuMatchClassic');
            tournamentActive = false;
            showMessage('Режим: Классика');
        });
    }
    if (btnTournament) {
        btnTournament.addEventListener('click', () => {
            playClickWithCheck();
            matchMode = 'tournament';
            setMenuActive('match', 'menuMatchTournament');
            tournamentScore = [0, 0];
            tournamentActive = true;
            showMessage('Режим: ТУРНИР до 3 побед');
        });
    }
    if (btnSurvival) {
        btnSurvival.addEventListener('click', () => {
            playClickWithCheck();
            matchMode = 'survival';
            setMenuActive('match', 'menuMatchSurvival');
            tournamentActive = false;
            opponentType = 'survival';
            showMessage('Режим: ВЫЖИВАНИЕ');
        });
    }
    if (btnRace) {
        btnRace.addEventListener('click', () => {
            playClickWithCheck();
            matchMode = 'race';
            setMenuActive('match', 'menuMatchRace');
            tournamentActive = false;
            showMessage('Режим: ГОНКИ');
        });
    }
    
    // ===== КНОПКА ИГРАТЬ =====
    const playBtn = document.getElementById('menuPlayBtn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            playClickWithCheck();
            if (typeof bonuses !== 'undefined') {
                bonuses = [];
            }
            
            if (matchMode === 'race') {
                if (typeof startRace === 'function') {
                    startRace();
                } else {
                    console.error('Функция startRace не найдена!');
                }
            } else {
                if (typeof updateUI === 'function') updateUI();
                showScreen('gameScreen');
                if (typeof resetGame === 'function') resetGame();
            }
        });
    }
    
    // ===== ЗВУК =====
    const soundBtn = document.getElementById('menuSoundToggle');
    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            playClickWithCheck();
            if (typeof toggleSound === 'function') toggleSound();
        });
    }
    
    // ===== КНОПКА НАЗАД (ПОЛНАЯ ОСТАНОВКА) =====
    const backBtn = document.getElementById('backToMenuBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            playClickWithCheck();
            // ===== 1. ОСТАНАВЛИВАЕМ ВСЕ ИНТЕРВАЛЫ =====
            if (typeof gameLoop !== 'undefined' && gameLoop) {
                clearInterval(gameLoop);
                gameLoop = null;
            }
            
            if (typeof countdownInterval !== 'undefined' && countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            
            if (typeof roundTimerInterval !== 'undefined' && roundTimerInterval) {
                clearInterval(roundTimerInterval);
                roundTimerInterval = null;
            }
            
            // ===== 2. ОСТАНАВЛИВАЕМ ЗАДЕРЖКИ =====
            if (typeof victoryPendingTimer !== 'undefined' && victoryPendingTimer) {
                clearTimeout(victoryPendingTimer);
                victoryPendingTimer = null;
            }
            if (typeof victoryPending !== 'undefined') victoryPending = false;
            
            if (typeof roundDelayTimer !== 'undefined' && roundDelayTimer) {
                clearTimeout(roundDelayTimer);
                roundDelayTimer = null;
            }
            if (typeof roundDelayActive !== 'undefined') roundDelayActive = false;
            
            // ===== 3. СБРАСЫВАЕМ ФЛАГИ =====
            if (typeof gameActive !== 'undefined') gameActive = false;
            paused = false;
            if (typeof countdownActive !== 'undefined') countdownActive = false;
            if (typeof roundTimerActive !== 'undefined') roundTimerActive = false;
            
            // ===== 4. ОСТАНАВЛИВАЕМ МУЗЫКУ =====
            if (typeof stopAllMusic === 'function') {
                stopAllMusic();
            } else if (typeof stopBgMusic === 'function') {
                stopBgMusic();
            }
            
            // ===== 5. СБРАСЫВАЕМ ВРАГОВ И БОССА =====
            if (typeof survivalEnemies !== 'undefined') {
                survivalEnemies = [];
            }
            
            if (typeof resetBoss === 'function') {
                resetBoss();
            }
            
            // ===== 6. СБРАСЫВАЕМ БОНУСЫ =====
            if (typeof resetBonuses === 'function') {
                resetBonuses();
            }
            
            // ===== 7. СБРАСЫВАЕМ ЭФФЕКТЫ ВЗРЫВА =====
            if (typeof window.explosionEffects !== 'undefined') {
                window.explosionEffects = [];
            }
            
            // ===== 8. СБРАСЫВАЕМ КЛОНА =====
            if (typeof cloneData !== 'undefined' && cloneData) {
                cloneData.active = false;
                cloneData.trail = [];
            }
            if (typeof cloneTrail !== 'undefined') {
                cloneTrail = [];
            }
            if (typeof cloneActive !== 'undefined') {
                cloneActive = false;
            }
            
            // ===== 9. СБРОС РЕЖИМА ВЫЖИВАНИЯ =====
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
            
            // ===== 10. ВОЗВРАЩАЕМСЯ В МЕНЮ =====
            showScreen('menuScreen');
            
            // ===== 11. ОБНОВЛЯЕМ РЕКОРД =====
            const recordDisplay = document.getElementById('menuRecordDisplay');
            if (recordDisplay && typeof bestRecord !== 'undefined') {
                recordDisplay.innerText = bestRecord;
            }
            
            showMessage('Выберите противника и режим матча, затем нажмите ИГРАТЬ');
        });
    }
    
    // ===== КНОПКА "ИГРАТЬ СНОВА" =====
    const restartBtn = document.getElementById('restartGameBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            playClickWithCheck();
            if (typeof roundTimerInterval !== 'undefined' && roundTimerInterval) {
                clearInterval(roundTimerInterval);
                roundTimerInterval = null;
            }
            if (typeof roundTimerActive !== 'undefined') roundTimerActive = false;
            if (typeof roundTimer !== 'undefined') roundTimer = 30;
            
            if (matchMode === 'race') {
                if (typeof startRace === 'function') {
                    startRace();
                }
            } else {
                if (typeof resetGame === 'function') {
                    resetGame();
                }
            }
        });
    }
    
    // ===== КЛАВИАТУРА =====
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const gameScreen = document.getElementById('gameScreen');
            if (gameScreen && gameScreen.classList.contains('active')) {
                e.preventDefault();
                if (matchMode === 'race') return;
                if (typeof gameActive !== 'undefined' && gameActive && !countdownActive) {
                    paused = !paused;
                    
                    // ===== ЕСЛИ ПАУЗА - ОСТАНАВЛИВАЕМ ТАЙМЕР =====
                    if (paused && roundTimerInterval) {
                        clearInterval(roundTimerInterval);
                        roundTimerInterval = null;
                    }
                    // ===== ЕСЛИ СНЯЛИ ПАУЗУ - ЗАПУСКАЕМ ТАЙМЕР =====
                    if (!paused && (matchMode === 'classic' || matchMode === 'tournament') && roundTimerActive) {
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
                    
                    if (typeof draw === 'function') draw();
                }
            }
        }
        
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen || !gameScreen.classList.contains('active')) return;
        
        if (matchMode === 'race') {
            if (typeof raceState !== 'undefined' && raceState.active && !raceState.gameOver) {
                const p = raceState.player;
                if (e.key === 'ArrowUp' && p.dirY !== 1) { p.dirY = -1; p.dirX = 0; }
                else if (e.key === 'ArrowDown' && p.dirY !== -1) { p.dirY = 1; p.dirX = 0; }
                else if (e.key === 'ArrowLeft' && p.dirX !== 1) { p.dirX = -1; p.dirY = 0; }
                else if (e.key === 'ArrowRight' && p.dirX !== -1) { p.dirX = 1; p.dirY = 0; }
            }
            return;
        }
        
        if (typeof gameActive === 'undefined' || !gameActive || paused || countdownActive) return;
        
        if (players[0].alive) {
            if (e.key === 'ArrowUp' && players[0].dirY !== 1) {
                players[0].dirX = 0; players[0].dirY = -1;
            }
            if (e.key === 'ArrowDown' && players[0].dirY !== -1) {
                players[0].dirX = 0; players[0].dirY = 1;
            }
            if (e.key === 'ArrowLeft' && players[0].dirX !== 1) {
                players[0].dirX = -1; players[0].dirY = 0;
            }
            if (e.key === 'ArrowRight' && players[0].dirX !== -1) {
                players[0].dirX = 1; players[0].dirY = 0;
            }
        }
        
        if (opponentType === '2p' && players[1].alive) {
            if (e.key === 'w' && players[1].dirY !== 1) {
                players[1].dirX = 0; players[1].dirY = -1;
            }
            if (e.key === 's' && players[1].dirY !== -1) {
                players[1].dirX = 0; players[1].dirY = 1;
            }
            if (e.key === 'a' && players[1].dirX !== 1) {
                players[1].dirX = -1; players[1].dirY = 0;
            }
            if (e.key === 'd' && players[1].dirX !== -1) {
                players[1].dirX = 1; players[1].dirY = 0;
            }
        }
    });
}

// ===== ЗАГРУЗОЧНЫЙ ЭКРАН: КНОПКА "НАЧАТЬ ПОГРУЖЕНИЕ" =====
const splashBtn = document.getElementById('splashEnterBtn');
if (splashBtn) {
    splashBtn.addEventListener('click', () => {
        // ===== ЗВУК КЛИКА =====
        if (typeof playClickSound === 'function') {
            playClickSound();
        }
        
        // ===== 1. ЗАПУСКАЕМ МУЗЫКУ МЕНЮ =====
        if (typeof playMenuMusic === 'function') {
            playMenuMusic();
        }
        
        // ===== 2. ПЛАВНЫЙ ПЕРЕХОД =====
        const splash = document.getElementById('splashScreen');
        if (splash) {
            splash.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            splash.style.opacity = '0';
            splash.style.transform = 'scale(1.05)';
            
            setTimeout(() => {
                splash.classList.remove('active');
                splash.style.display = 'none';
                splash.style.opacity = '1';
                splash.style.transform = 'scale(1)';
                // Показываем основное меню
                showScreen('menuScreen');
            }, 900);
        }
        
        // Обновляем кнопку звука
        const soundBtn = document.getElementById('menuSoundToggle');
        if (soundBtn) {
            soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
        }
    });
}

function updateUI() {
    const p1Score = document.getElementById('gamePlayer1Score');
    const p2Score = document.getElementById('gamePlayer2Score');
    const timerDisplay = document.getElementById('roundTimer');
    const recordDisplay = document.getElementById('menuRecordDisplay');
    
    // === РЕЖИМ ГОНКИ ===
    if (matchMode === 'race') {
        if (p1Score) {
            p1Score.innerText = typeof raceState !== 'undefined' && raceState.player ? raceState.player.x : 0;
        }
        if (p2Score) {
            p2Score.innerText = typeof raceState !== 'undefined' && raceState.win ? '🏁' : '🚧';
        }
        if (timerDisplay) timerDisplay.style.display = 'none';
        if (recordDisplay && typeof bestRecord !== 'undefined') {
            recordDisplay.innerText = bestRecord;
        }
        return;
    }
    
    // === ВЫЖИВАНИЕ ===
    if (matchMode === 'survival') {
        if (p1Score) {
            p1Score.innerText = currentSteps || 0;
        }
        if (p2Score) {
            const alive = typeof survivalEnemies !== 'undefined' ? survivalEnemies.filter(e => e.alive).length : 0;
            p2Score.innerText = alive;
        }
        if (timerDisplay) timerDisplay.style.display = 'none';
        if (recordDisplay && typeof bestRecord !== 'undefined') {
            recordDisplay.innerText = bestRecord;
        }
        return;
    }
    
    // === КЛАССИКА И ТУРНИР ===
    if (p1Score) {
        p1Score.innerText = matchMode === 'tournament' ? tournamentScore[0] : players[0].score;
    }
    if (p2Score) {
        p2Score.innerText = matchMode === 'tournament' ? tournamentScore[1] : players[1].score;
    }
    
    // === ТАЙМЕР РАУНДА ===
    if (timerDisplay) {
        if (matchMode === 'classic' || matchMode === 'tournament') {
            timerDisplay.style.display = 'inline-block';
            timerDisplay.innerText = roundTimer !== undefined ? roundTimer : 30;
            if (roundTimer <= 10 && roundTimer > 0) {
                timerDisplay.style.color = '#ff3333';
                timerDisplay.style.textShadow = '0 0 20px #ff3333';
                timerDisplay.className = 'round-timer warning';
            } else {
                timerDisplay.style.color = '#00ffcc';
                timerDisplay.style.textShadow = '0 0 10px #00ffcc';
                timerDisplay.className = 'round-timer';
            }
        } else {
            timerDisplay.style.display = 'none';
        }
    }
    
    if (recordDisplay && typeof bestRecord !== 'undefined') {
        recordDisplay.innerText = bestRecord;
    }
}

function showMessage(msg) {
    const msgDiv = document.getElementById('gameMessage');
    if (msgDiv) msgDiv.innerText = msg;
}

function setActiveButton(group, activeId) {
    const buttons = document.querySelectorAll(group);
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add('active');
}
