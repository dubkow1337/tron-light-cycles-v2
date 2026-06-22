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

// ========== ЗВУК ВЗРЫВА ==========
function playExplosionSound() {
    if (!soundEnabled) return;
    
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        
        // Низкий гул (саб-бас)
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
        
        // Средний удар
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(150, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.3);
        
        // Шум (взрывной хлопок)
        const bufferSize = ctx.sampleRate * 0.4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // Шум с затуханием
            const envelope = Math.exp(-i / (ctx.sampleRate * 0.15));
            data[i] = (Math.random() * 2 - 1) * envelope * 0.8;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain3 = ctx.createGain();
        gain3.gain.setValueAtTime(0.25, ctx.currentTime);
        gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        noise.connect(gain3);
        gain3.connect(ctx.destination);
        noise.start();
        noise.stop(ctx.currentTime + 0.4);
        
        // Высокочастотный "звон" (эффект стекла/металла)
        const osc3 = ctx.createOscillator();
        const gain4 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(2000, ctx.currentTime);
        osc3.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
        gain4.gain.setValueAtTime(0.06, ctx.currentTime);
        gain4.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc3.connect(gain4);
        gain4.connect(ctx.destination);
        osc3.start();
        osc3.stop(ctx.currentTime + 0.2);
        
        // Закрываем контекст через 0.6 секунды
        setTimeout(() => {
            try { ctx.close(); } catch(e) {}
        }, 600);
        
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
