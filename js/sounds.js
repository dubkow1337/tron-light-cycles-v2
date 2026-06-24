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

function stopAllMusic() {
    stopMenuMusic();
    stopBgMusic();
}

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

// ============================================================
// ===== ЗВУКОВЫЕ ЭФФЕКТЫ =====
// ============================================================

// ===== ЗВУК ВЗРЫВА =====
function playExplosionSound() {
    if (!soundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(80, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5);
        gain1.gain.setValueAtTime(0.3, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.5);
        
        const bufferSize = ctx.sampleRate * 0.4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const envelope = Math.exp(-i / (ctx.sampleRate * 0.15));
            data[i] = (Math.random() * 2 - 1) * envelope * 0.8;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0.25, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        noise.connect(gain2);
        gain2.connect(ctx.destination);
        noise.start();
        noise.stop(ctx.currentTime + 0.4);
        
        setTimeout(() => { try { ctx.close(); } catch(e) {} }, 600);
    } catch (e) {}
}

// ===== БОНУС (КОРОТКИЙ "ПИУ") =====
function playBonusSound() {
    if (!soundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
        setTimeout(() => { try { ctx.close(); } catch(e) {} }, 100);
    } catch (e) {}
}

// ===== СТОЛКНОВЕНИЕ =====
function playCrashSound() {
    if (!soundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        setTimeout(() => { try { ctx.close(); } catch(e) {} }, 200);
    } catch (e) {}
}

// ===== СМЕРТЬ ИГРОКА =====
function playPlayerDieSound() {
    if (!soundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
        setTimeout(() => { try { ctx.close(); } catch(e) {} }, 500);
    } catch (e) {}
}

// ===== ПОБЕДА (КОРОТКАЯ) =====
function playVictorySound() {
    if (!soundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const notes = [523, 659, 784];
        let time = 0;
        for (let note of notes) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = note;
            gain.gain.setValueAtTime(0.08, ctx.currentTime + time);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + time);
            osc.stop(ctx.currentTime + time + 0.12);
            time += 0.12;
        }
        setTimeout(() => { try { ctx.close(); } catch(e) {} }, time * 1000 + 200);
    } catch (e) {}
}

// ===== ТУРНИРНАЯ ПОБЕДА (ЭПИЧНАЯ) =====
function playTournamentWinSound() {
    if (!soundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const notes = [523, 659, 784, 1047, 784, 659, 523];
        let time = 0;
        for (let note of notes) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = note;
            gain.gain.setValueAtTime(0.08, ctx.currentTime + time);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + time);
            osc.stop(ctx.currentTime + time + 0.15);
            time += 0.12;
        }
        const bass = ctx.createOscillator();
        const gainBass = ctx.createGain();
        bass.type = 'sine';
        bass.frequency.value = 110;
        gainBass.gain.setValueAtTime(0.15, ctx.currentTime + time);
        gainBass.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.3);
        bass.connect(gainBass);
        gainBass.connect(ctx.destination);
        bass.start(ctx.currentTime + time);
        bass.stop(ctx.currentTime + time + 0.3);
        time += 0.3;
        setTimeout(() => { try { ctx.close(); } catch(e) {} }, time * 1000 + 300);
    } catch (e) {}
}

// ===== GAME OVER =====
function playGameOverSound() {
    if (!soundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const notes = [523, 440, 349];
        let time = 0;
        for (let note of notes) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = note;
            gain.gain.setValueAtTime(0.08, ctx.currentTime + time);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + time);
            osc.stop(ctx.currentTime + time + 0.3);
            time += 0.3;
        }
        setTimeout(() => { try { ctx.close(); } catch(e) {} }, time * 1000 + 300);
    } catch (e) {}
}

// ===== БОСС: ПОЯВЛЕНИЕ =====
function playBossSpawnSound() {
    if (!soundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
        setTimeout(() => { try { ctx.close(); } catch(e) {} }, 500);
    } catch (e) {}
}

// ===== БОСС: УРОН =====
function playBossHitSound() {
    if (!soundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
        setTimeout(() => { try { ctx.close(); } catch(e) {} }, 200);
    } catch (e) {}
}

// ===== БОСС: СМЕРТЬ =====
function playBossDeathSound() {
    if (!soundEnabled) return;
    playExplosionSound();
    setTimeout(() => playExplosionSound(), 300);
    setTimeout(() => playExplosionSound(), 600);
}

// ===== ВРАГ: ПОЯВЛЕНИЕ =====
function playEnemySpawnSound() {
    if (!soundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
        setTimeout(() => { try { ctx.close(); } catch(e) {} }, 100);
    } catch (e) {}
}

// ===== ВРАГ: СМЕРТЬ =====
function playEnemyDeathSound() {
    if (!soundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
        setTimeout(() => { try { ctx.close(); } catch(e) {} }, 150);
    } catch (e) {}
}

// ===== ОБРАТНЫЙ ОТСЧЁТ =====
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

// ===== КЛИК ПО КНОПКЕ =====
function playClickSound() {
    if (!soundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1200;
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.03);
        setTimeout(() => { try { ctx.close(); } catch(e) {} }, 50);
    } catch (e) {}
}

// ===== СТАРЫЕ ФУНКЦИИ ДЛЯ СОВМЕСТИМОСТИ =====
function speakVictory(text) { return; }
function speak(text) { return; }
