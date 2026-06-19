// ========== ЗВУК (ВРЕМЕННАЯ ЗАГЛУШКА) ==========
let bgMusic = null;
let soundEnabled = true;

function initSound() { console.log('🔇 Звук отключён'); }
function playBgMusic() {}
function stopBgMusic() {}
function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('menuSoundToggle');
    if (btn) btn.textContent = soundEnabled ? '🔊' : '🔇';
}
function countdownBeep(step) {}
function speakVictory(text) {}
function speak(text) {}
