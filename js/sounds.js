// ========== ЗВУК ==========
let bgMusic = null;
let soundEnabled = true;

function initSound() {
    try {
        bgMusic = new Audio('assets/sounds/tron-music.mp3');
        bgMusic.loop = true;
        bgMusic.volume = 0.45;
        bgMusic.preload = 'auto';
        console.log('🔊 bgMusic инициализирован');
    } catch (e) {
        console.warn('Не удалось инициализировать звук:', e);
    }

    const btn = document.getElementById('menuSoundToggle');
    if (btn) btn.textContent = soundEnabled ? '🔊' : '🔇';
}

function playBgMusic() {
    if (!soundEnabled || !bgMusic) return;
    const p = bgMusic.play();
    if (p && typeof p.then === 'function') {
        p.catch(err => {
            console.warn('playBgMusic() rejected:', err);
        });
    }
}

function stopBgMusic() {
    if (!bgMusic) return;
    try {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    } catch (e) {}
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('menuSoundToggle');
    if (btn) btn.textContent = soundEnabled ? '🔊' : '🔇';

    if (!soundEnabled) {
        if (bgMusic) try { bgMusic.pause(); } catch (e) {}
    } else {
        playBgMusic();
    }
}

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
    } catch (e) {
        // ignore
    }
}

function speakVictory(text) {
    if (!('speechSynthesis' in window)) return;
    try {
        const ut = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(ut);
    } catch (e) {}
}

function speak(text) {
    if (!('speechSynthesis' in window)) return;
    try {
        const ut = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(ut);
    } catch (e) {}
}
