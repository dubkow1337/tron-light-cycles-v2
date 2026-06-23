// ========== ЗВУК ==========
let bgMusic = null;
let menuMusic = null;
let soundEnabled = true;
let currentMusicType = 'menu';
let musicInitialized = false;

function initSound() {
    try {
        // ===== ИГРОВАЯ МУЗЫКА =====
        bgMusic = new Audio('assets/sounds/tron-music.mp3');
        bgMusic.loop = true;
        bgMusic.volume = 0.45;
        bgMusic.preload = 'auto';
        console.log('🔊 bgMusic инициализирован');
        
        // ===== МУЗЫКА ДЛЯ МЕНЮ =====
        menuMusic = new Audio('assets/sounds/menu-music.mp3');
        menuMusic.loop = true;
        menuMusic.volume = 0.35;
        menuMusic.preload = 'auto';
        console.log('🔊 menuMusic инициализирован');
    } catch (e) {
        console.warn('Не удалось инициализировать звук:', e);
    }

    const btn = document.getElementById('menuSoundToggle');
    if (btn) btn.textContent = soundEnabled ? '🔊' : '🔇';
    
    // ===== ЗАПУСКАЕМ МУЗЫКУ МЕНЮ СРАЗУ =====
    if (soundEnabled && menuMusic) {
        const p = menuMusic.play();
        if (p && typeof p.then === 'function') {
            p.catch(err => {
                console.warn('playMenuMusic() rejected:', err);
            });
        }
        currentMusicType = 'menu';
    }
    musicInitialized = true;
}

// ===== МУЗЫКА МЕНЮ =====
function playMenuMusic() {
    if (!soundEnabled || !menuMusic) return;
    if (bgMusic && !bgMusic.paused) {
        try { bgMusic.pause(); } catch(e) {}
    }
    if (menuMusic.paused) {
        const p = menuMusic.play();
        if (p && typeof p.then === 'function') {
            p.catch(err => {
                console.warn('playMenuMusic() rejected:', err);
            });
        }
        currentMusicType = 'menu';
    }
}

function stopMenuMusic() {
    if (!menuMusic) return;
    try {
        menuMusic.pause();
        menuMusic.currentTime = 0;
    } catch (e) {}
}

// ===== ИГРОВАЯ МУЗЫКА =====
function playBgMusic() {
    if (!soundEnabled || !bgMusic) return;
    if (menuMusic && !menuMusic.paused) {
        try { menuMusic.pause(); } catch(e) {}
    }
    if (bgMusic.paused) {
        const p = bgMusic.play();
        if (p && typeof p.then === 'function') {
            p.catch(err => {
                console.warn('playBgMusic() rejected:', err);
            });
        }
        currentMusicType = 'game';
    }
}

function stopBgMusic() {
    if (!bgMusic) return;
    try {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    } catch (e) {}
}

// ===== ОСТАНОВКА ВСЕЙ МУЗЫКИ =====
function stopAllMusic() {
    stopMenuMusic();
    stopBgMusic();
}

// ===== ПЕРЕКЛЮЧЕНИЕ МУЗЫКИ В ЗАВИСИМОСТИ ОТ ЭКРАНА =====
function switchMusicForScreen(screenId) {
    if (!soundEnabled) return;
    
    if (screenId === 'gameScreen') {
        stopMenuMusic();
        playBgMusic();
    } else {
        stopBgMusic();
        playMenuMusic();
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('menuSoundToggle');
    if (btn) btn.textContent = soundEnabled ? '🔊' : '🔇';

    if (!soundEnabled) {
        stopAllMusic();
    } else {
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen && gameScreen.classList.contains('active')) {
            playBgMusic();
        } else {
            playMenuMusic();
        }
    }
}

// ===== ОСТАЛЬНЫЕ ФУНКЦИИ =====
function countdownBeep(step) {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = step === 0 ? 880 : 600;
        g.gain.value = 0.05;
        o.connect(g); g.connect(ctx.destination);
        o.start();
        setTimeout(() => { o.stop(); ctx.close(); }, 120);
    } catch (e) {}
}

function playExplosionSound() {
    if (!soundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        // ... (оставляем как было)
        setTimeout(() => { try { ctx.close(); } catch(e) {} }, 600);
    } catch (e) {}
}

function speakVictory(text) { return; }
function speak(text) { return; }
function playTournamentWinSound() { return; }

// ===== ЗАПУСК МУЗЫКИ МЕНЮ ПРИ ЗАГРУЗКЕ =====
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (soundEnabled && menuMusic) {
            const p = menuMusic.play();
            if (p && typeof p.then === 'function') {
                p.catch(err => {
                    console.warn('Автозапуск музыки меню:', err);
                });
            }
        }
    }, 300);
});
