// ========== UI ДЛЯ 3D ВЕРСИИ ==========

let soundEnabled = true;

document.addEventListener('DOMContentLoaded', () => {
    // ===== СПЛАШ =====
    const splashBtn = document.getElementById('splashEnterBtn');
    if (splashBtn) {
        splashBtn.addEventListener('click', () => {
            const splash = document.getElementById('splashScreen');
            splash.classList.add('hidden');
            setTimeout(() => {
                splash.style.display = 'none';
                document.getElementById('menuScreen').classList.add('active');
                if (typeof playMenuMusic === 'function') {
                    playMenuMusic();
                }
            }, 800);
        });
    }
    
    // ===== КНОПКИ МЕНЮ =====
    const btn2p = document.getElementById('menuOpponent2p');
    const btnAI = document.getElementById('menuOpponentAI');
    const btnClassic = document.getElementById('menuMatchClassic');
    const btnTournament = document.getElementById('menuMatchTournament');
    const btnSurvival = document.getElementById('menuMatchSurvival');
    const playBtn = document.getElementById('menuPlayBtn');
    const backBtn = document.getElementById('backToMenuBtn');
    const restartBtn = document.getElementById('restartGameBtn');
    const soundToggle = document.getElementById('menuSoundToggle');
    
    // Противник
    if (btn2p) {
        btn2p.addEventListener('click', () => {
            window.opponentType = '2p';
            document.querySelectorAll('.module-btn[data-group="opponent"]').forEach(b => b.classList.remove('active'));
            btn2p.classList.add('active');
            showMessage('Противник: 2 игрока');
        });
        btn2p.classList.add('active');
    }
    if (btnAI) {
        btnAI.addEventListener('click', () => {
            window.opponentType = 'ai';
            document.querySelectorAll('.module-btn[data-group="opponent"]').forEach(b => b.classList.remove('active'));
            btnAI.classList.add('active');
            showMessage('Противник: VS AI');
        });
    }
    
    // Режим
    if (btnClassic) {
        btnClassic.addEventListener('click', () => {
            window.matchMode = 'classic';
            document.querySelectorAll('.module-btn[data-group="match"]').forEach(b => b.classList.remove('active'));
            btnClassic.classList.add('active');
            showMessage('Режим: Классика');
        });
        btnClassic.classList.add('active');
    }
    if (btnTournament) {
        btnTournament.addEventListener('click', () => {
            window.matchMode = 'tournament';
            document.querySelectorAll('.module-btn[data-group="match"]').forEach(b => b.classList.remove('active'));
            btnTournament.classList.add('active');
            showMessage('Режим: Турнир');
        });
    }
    if (btnSurvival) {
        btnSurvival.addEventListener('click', () => {
            window.matchMode = 'survival';
            document.querySelectorAll('.module-btn[data-group="match"]').forEach(b => b.classList.remove('active'));
            btnSurvival.classList.add('active');
            showMessage('Режим: Выживание');
        });
    }
    
    // Кнопка ИГРАТЬ
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (typeof window.startGame === 'function') {
                window.startGame();
            } else {
                console.error('startGame не найден!');
            }
        });
    }
    
    // Кнопка НАЗАД
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (typeof window.stopGame === 'function') {
                window.stopGame();
            }
            document.getElementById('gameContainer').style.display = 'none';
            document.getElementById('gameUI').style.display = 'none';
            document.getElementById('menuScreen').classList.add('active');
            if (typeof playMenuMusic === 'function') {
                playMenuMusic();
            }
            showMessage('Выберите режим и нажмите ЗАПУСТИТЬ');
        });
    }
    
    // Кнопка ИГРАТЬ СНОВА
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            if (typeof window.startGame === 'function') {
                document.getElementById('victoryOverlay').className = 'victory-overlay';
                window.startGame();
            }
        });
    }
    
    // Кнопка ЗВУК
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            if (typeof toggleSound === 'function') {
                toggleSound();
                soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
            }
        });
    }
});

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function showMessage(msg) {
    const el = document.getElementById('gameMessage');
    if (el) el.textContent = msg;
}

function updateUI() {
    // UI обновляется через game.js
}
