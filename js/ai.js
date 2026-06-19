// ========== ИИ ДЛЯ РЕЖИМА VS AI ==========

function aiMove() {
    if (typeof opponentType === 'undefined' || opponentType !== 'ai') return;
    if (!players[1].alive) return;
    
    const p = players[1];
    const enemy = players[0];
    const dirs = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
    ];
    let moveScores = [];
    
    // Функция проверки безопасности клетки
    function isSafeCell(x, y, trail, enemyTrail) {
        // Проверка границ (добавлен отступ в 1 клетку)
        if (x < 1 || x >= WIDTH - 1 || y < 1 || y >= HEIGHT - 1) {
            return false;
        }
        // Проверка своего следа (кроме последней точки)
        for (let i = 0; i < trail.length - 1; i++) {
            if (trail[i].x === Math.round(x) && trail[i].y === Math.round(y)) {
                return false;
            }
        }
        // Проверка следа противника
        for (let i = 0; i < enemyTrail.length - 1; i++) {
            if (enemyTrail[i].x === Math.round(x) && enemyTrail[i].y === Math.round(y)) {
                return false;
            }
        }
        return true;
    }
    
    for (const dir of dirs) {
        let newX = p.x + dir.dx;
        let newY = p.y + dir.dy;
        
        // Проверка на выход за границы
        if (newX < 1 || newX >= WIDTH - 1 || newY < 1 || newY >= HEIGHT - 1) {
            moveScores.push({ dir: dir, score: -999 });
            continue;
        }
        
        if (!isSafeCell(newX, newY, p.trail, enemy.trail)) {
            moveScores.push({ dir: dir, score: -999 });
            continue;
        }
        
        // Симуляция на 30 шагов вперёд
        let simX = newX, simY = newY;
        let simTrail = [...p.trail, { x: Math.round(simX), y: Math.round(simY) }];
        let simDirX = dir.dx, simDirY = dir.dy;
        let steps = 0;
        
        for (let step = 0; step < 30; step++) {
            const possibleMoves = [
                { dx: simDirX, dy: simDirY },
                { dx: -simDirY, dy: simDirX },
                { dx: simDirY, dy: -simDirX },
                { dx: -simDirX, dy: -simDirY }
            ];
            let moved = false;
            for (const move of possibleMoves) {
                const nextX = simX + move.dx;
                const nextY = simY + move.dy;
                if (isSafeCell(nextX, nextY, simTrail, enemy.trail)) {
                    simX = nextX; simY = nextY;
                    simDirX = move.dx; simDirY = move.dy;
                    simTrail.push({ x: Math.round(simX), y: Math.round(simY) });
                    steps++;
                    moved = true;
                    break;
                }
            }
            if (!moved) break;
        }
        
        const distToEnemy = Math.abs(simX - enemy.x) + Math.abs(simY - enemy.y);
        const aggressionBonus = (30 - distToEnemy) * 2;
        const randomBonus = Math.floor(Math.random() * 7) - 3;
        moveScores.push({ dir: dir, score: steps * 10 + aggressionBonus + randomBonus });
    }
    
    moveScores.sort((a, b) => b.score - a.score);
    const bestMove = moveScores[0]; // ✅ ИСПРАВЛЕНИЕ: берём весь объект, а не только dir
    
    if (bestMove && bestMove.score > -999) {
        p.dirX = bestMove.dir.dx;
        p.dirY = bestMove.dir.dy;
    } else {
        // Запасной вариант — безопасное направление
        const fallbackDirs = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];
        for (let d of fallbackDirs) {
            const newX = p.x + d.dx;
            const newY = p.y + d.dy;
            if (isSafeCell(newX, newY, p.trail, enemy.trail)) {
                p.dirX = d.dx;
                p.dirY = d.dy;
                break;
            }
        }
    }
    
    // ===== ДВИЖЕНИЕ =====
    const BOT_SPEED = 0.7;
    const newX = p.x + p.dirX * BOT_SPEED;
    const newY = p.y + p.dirY * BOT_SPEED;
    
    // Проверка перед движением
    if (newX < 1 || newX >= WIDTH - 1 || newY < 1 || newY >= HEIGHT - 1) {
        // Если движение ведёт к стене — разворачиваемся
        if (p.dirX !== 0 || p.dirY !== 0) {
            p.dirX = -p.dirX;
            p.dirY = -p.dirY;
        } else {
            p.dirX = 1;
            p.dirY = 0;
        }
        return;
    }
    
    if (isSafeCell(newX, newY, p.trail, enemy.trail)) {
        p.x = newX;
        p.y = newY;
    } else {
        // Если небезопасно — ищем другое безопасное направление
        const dirs2 = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];
        let moved = false;
        for (let d of dirs2) {
            const testX = p.x + d.dx * BOT_SPEED;
            const testY = p.y + d.dy * BOT_SPEED;
            if (testX >= 1 && testX < WIDTH - 1 && testY >= 1 && testY < HEIGHT - 1) {
                if (isSafeCell(testX, testY, p.trail, enemy.trail)) {
                    p.x = testX;
                    p.y = testY;
                    p.dirX = d.dx;
                    p.dirY = d.dy;
                    moved = true;
                    break;
                }
            }
        }
        if (!moved) {
            // Если совсем нет безопасного направления — стоим на месте
            p.dirX = 0;
            p.dirY = 0;
        }
    }
    
    // ===== СЛЕД =====
    const trailX = Math.round(p.x);
    const trailY = Math.round(p.y);
    if (trailX >= 0 && trailX < WIDTH && trailY >= 0 && trailY < HEIGHT) {
        if (p.trail.length === 0 || 
            p.trail[p.trail.length-1].x !== trailX || 
            p.trail[p.trail.length-1].y !== trailY) {
            p.trail.push({ x: trailX, y: trailY });
            if (p.trail.length > 20) p.trail.shift();
        }
    }
}
