// ========== ТОЧКА ВХОДА ==========

// canvas и ctx объявлены в render.js, НЕ ОБЪЯВЛЯЕМ ИХ ЗДЕСЬ!

function init() {
    // Используем глобальные canvas и ctx из render.js
    if (typeof canvas === 'undefined' || typeof ctx === 'undefined') {
        console.error('❌ canvas или ctx не найдены!');
        return;
    }
    
    window.canvas = canvas;
    window.ctx = ctx;
    
    if (typeof initSound === 'function') initSound();
    if (typeof setupEventListeners === 'function') setupEventListeners();
    
    // Загружаем рекорд
    const recordDisplay = document.getElementById('menuRecordDisplay');
    if (recordDisplay && typeof bestRecord !== 'undefined') {
        recordDisplay.innerText = bestRecord;
    }
    
    // Показываем сообщение в меню
    if (typeof showMessage === 'function') {
        showMessage('Выберите настройки и нажмите ИГРАТЬ');
    }
    
    // Ждём загрузки draw()
    function waitForDraw() {
        if (typeof draw === 'function') {
            draw();
            console.log('✅ draw() найдена и вызвана');
        } else {
            console.log('⏳ Ждём загрузки draw()...');
            setTimeout(waitForDraw, 100);
        }
    }
    waitForDraw();
}

// Запуск после загрузки страницы
window.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM loaded');
    
    // Устанавливаем активные кнопки
    if (typeof setActiveButton === 'function') {
        setActiveButton('.mode-selector .mode-btn', 'opponent2p');
        setActiveButton('.arena-selector .mode-btn', 'matchClassic');
    }
    
    // Глобальные переменные
    window.opponentType = '2p';
    window.matchMode = 'classic';
    window.tournamentActive = false;
    
    init();
});
