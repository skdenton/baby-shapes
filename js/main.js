// ============================================================================
// main.js — Game state, render loop, input handling, parent gate, initialization
// Depends on engine.js and levels.js being loaded first
// ============================================================================

// --- Global State ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const parentGate = document.getElementById('parent-gate');
const gateInput = document.getElementById('gate-answer');
const gateQuestion = document.getElementById('gate-question');
const gateError = document.getElementById('gate-error');

let width, height;
let shapes = [];
let holes = [];
let particles = [];
let gameActive = false;
let lastMoveTime = 0;
let currentLevel = 1;
let currentPhase = 'shapes';
let layoutDir = 'top-bottom';
let currentWord = null;

// Background interactivity
let bgOffsetX = 0, bgOffsetY = 0;
let bgVelX = 0, bgVelY = 0;
let bgDragging = false, bgPointerId = null;
let lastPointerX = 0, lastPointerY = 0;
let lastBgSoundTime = 0;

// Parent gate state
let gateAnswer = 0;
let isLocked = false; // True when in fullscreen "child lock" mode

// --- Resize ---
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    if (gameActive) setupLevel(false);
}
window.addEventListener('resize', resize);

// --- Render Loop ---
function render() {
    if (!bgDragging) {
        bgOffsetX += bgVelX; bgOffsetY += bgVelY;
        bgVelX *= 0.95; bgVelY *= 0.95;
    }

    ctx.fillStyle = '#0d1b2a';
    ctx.fillRect(0, 0, width, height);

    // Scrolling background pattern
    const sp = 120;
    let sx = (bgOffsetX % sp) - sp, sy = (bgOffsetY % sp) - sp;
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    for (let bx = sx; bx < width + sp; bx += sp) {
        for (let by = sy; by < height + sp; by += sp) {
            const gx = Math.floor((bx - bgOffsetX) / sp);
            const gy = Math.floor((by - bgOffsetY) / sp);
            const t = Math.abs(gx + gy * 3) % 3;
            ctx.beginPath();
            if (t === 0) ctx.arc(bx + sp/2, by + sp/2, 25, 0, Math.PI * 2);
            else if (t === 1) ctx.rect(bx + sp/2 - 20, by + sp/2 - 20, 40, 40);
            else { ctx.moveTo(bx+sp/2, by+sp/2-25); ctx.lineTo(bx+sp/2+25, by+sp/2+20); ctx.lineTo(bx+sp/2-25, by+sp/2+20); ctx.closePath(); }
            ctx.stroke();
        }
    }

    // Draw target holes with pulsing glow (color matches the piece)
    const now = Date.now() / 1000;
    holes.forEach((hole, i) => {
        const matched = shapes.some(s => s.isMatched && s.id === hole.id);
        if (matched) {
            // Draw a subtle filled shape for matched holes
            drawPath(ctx, hole.type, hole.x, hole.y, hole.size, hole.label);
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.fill();
            return;
        }
        // Pulsing glow using the hole's own color
        const phase = now * 2 + i * 1.5;
        const pulse = 0.3 + 0.7 * ((Math.sin(phase) + 1) / 2);

        ctx.shadowColor = hole.color;
        ctx.shadowBlur = 20 + pulse * 25;

        drawPath(ctx, hole.type, hole.x, hole.y, hole.size, hole.label);
        ctx.fillStyle = hole.color;
        ctx.globalAlpha = 0.05 + pulse * 0.08;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = 3 + pulse * 4;
        ctx.strokeStyle = hole.color;
        ctx.globalAlpha = 0.2 + pulse * 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Draw label outline on target for number/letter types
        if (hole.label) {
            ctx.globalAlpha = 0.15 + pulse * 0.2;
            drawLabel(ctx, hole.label, hole.x, hole.y, hole.size, hole.color);
            ctx.globalAlpha = 1.0;
        }

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    });

    // Sort: dragging on top, matched on bottom
    const sorted = [...shapes].sort((a, b) => {
        if (a.isDragging && !b.isDragging) return 1;
        if (!a.isDragging && b.isDragging) return -1;
        if (a.isMatched && !b.isMatched) return -1;
        return 0;
    });

    sorted.forEach(shape => {
        let rx = shape.x, ry = shape.y;
        if (shape.isDragging) {
            const w = Math.sin(Date.now() / 30) * 4;
            rx += w; ry += w;
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 30 + Math.sin(Date.now() / 100) * 15;
        } else {
            ctx.shadowColor = 'transparent';
        }

        drawPath(ctx, shape.type, rx, ry, shape.size, shape.label);
        ctx.fillStyle = shape.color;
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 6;
        ctx.strokeStyle = shape.isDragging ? 'white' : 'rgba(255,255,255,0.8)';
        ctx.stroke();

        // Draw face for shapes, label text for numbers/letters
        if (shape.type === 'number' || shape.type === 'letter') {
            drawLabel(ctx, shape.label, rx, ry, shape.size, shape.color);
        } else {
            drawFace(ctx, rx, ry, shape.size);
        }
    });

    updateAndDrawParticles(ctx);

    // Level HUD
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    const fs = Math.max(14, Math.min(width, height) * 0.025);
    ctx.font = `${fs}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(`Level ${currentLevel}  ${getPhaseLabel(currentPhase)}`, 12, 12);
    if (currentWord) {
        ctx.fillText(`Word: ${currentWord.toUpperCase()}`, 12, 12 + fs + 4);
    }

    // Lock icon when in child-lock mode
    if (isLocked) {
        ctx.textAlign = 'right';
        ctx.fillText('🔒', width - 12, 12);
    }

    if (gameActive) requestAnimationFrame(render);
}

// --- Interaction ---
function isInside(x, y, shape) {
    const t = shape.size * 1.5;
    return x >= shape.x - t && x <= shape.x + t && y >= shape.y - t && y <= shape.y + t;
}

function checkWin() {
    if (!shapes.every(s => s.isMatched)) return;

    // For word levels, announce the full word
    if (currentPhase === 'words' && currentWord) {
        setTimeout(() => sayName(currentWord), 400);
    }

    sounds.win();
    const c = EXT_COLORS;
    setTimeout(() => createFireworks(width * 0.2, height * 0.3, c[0]), 0);
    setTimeout(() => createFireworks(width * 0.8, height * 0.4, c[1]), 300);
    setTimeout(() => createFireworks(width * 0.5, height * 0.2, c[2]), 600);
    setTimeout(() => createFireworks(width * 0.3, height * 0.6, c[3]), 900);

    currentLevel++;
    setTimeout(() => setupLevel(true), 4000);
}

canvas.addEventListener('pointerdown', (e) => {
    if (!gameActive) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    let hit = false;

    for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        if (!s.isDragging && !s.isMatched && isInside(x, y, s)) {
            s.isDragging = true;
            s.pointerId = e.pointerId;
            s.dragOffsetX = s.x - x;
            s.dragOffsetY = s.y - y;
            sounds.pickup();
            if (navigator.vibrate) navigator.vibrate(50);
            shapes.push(shapes.splice(i, 1)[0]);
            hit = true;
            break;
        }
    }
    if (!hit) {
        bgDragging = true;
        bgPointerId = e.pointerId;
        lastPointerX = x; lastPointerY = y;
        if (navigator.vibrate) navigator.vibrate(15);
    }
});

canvas.addEventListener('pointermove', (e) => {
    if (!gameActive) return;
    const s = shapes.find(s => s.pointerId === e.pointerId);
    if (s && s.isDragging) {
        const rect = canvas.getBoundingClientRect();
        const ox = s.x, oy = s.y;
        s.x = Math.max(s.size, Math.min(width - s.size, (e.clientX - rect.left) + s.dragOffsetX));
        s.y = Math.max(s.size, Math.min(height - s.size, (e.clientY - rect.top) + s.dragOffsetY));
        if (Math.hypot(s.x - ox, s.y - oy) > 2) {
            createSparkle(s.x, s.y, s.color);
            const now = Date.now();
            if (now - lastMoveTime > 150) {
                sounds.moveSparkle();
                if (navigator.vibrate) navigator.vibrate(20);
                lastMoveTime = now;
            }
        }
    } else if (bgDragging && bgPointerId === e.pointerId) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const dx = x - lastPointerX, dy = y - lastPointerY;
        lastPointerX = x; lastPointerY = y;
        bgOffsetX += dx; bgOffsetY += dy;
        bgVelX = dx * 0.8; bgVelY = dy * 0.8;
        if (Math.hypot(dx, dy) > 1) {
            const bgC = ['#ff8a80','#8c9eff','#b9f6ca','#ffff8d','#e040fb'];
            createSparkle(x, y, bgC[Math.floor(Math.random() * bgC.length)]);
            const now = Date.now();
            if (now - lastBgSoundTime > 100) {
                sounds.bgMove();
                if (navigator.vibrate) navigator.vibrate(10);
                lastBgSoundTime = now;
            }
        }
    }
});

function handlePointerUp(e) {
    if (!gameActive) return;
    if (bgPointerId === e.pointerId) {
        bgDragging = false; bgPointerId = null; return;
    }
    const shape = shapes.find(s => s.pointerId === e.pointerId);
    if (!shape || !shape.isDragging) return;
    shape.isDragging = false;
    shape.pointerId = null;

    const hole = holes.find(h => h.id === shape.id);
    if (!hole) { sounds.drop(); return; }
    const dist = Math.hypot(shape.x - hole.x, shape.y - hole.y);

    if (dist < shape.size * 2.5) {
        shape.x = hole.x; shape.y = hole.y;
        shape.isMatched = true;
        sounds.match();
        sayName(shape.spokenName);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        createFireworks(hole.x, hole.y, shape.color);
        checkWin();
    } else {
        sounds.drop();
    }
}
canvas.addEventListener('pointerup', handlePointerUp);
canvas.addEventListener('pointercancel', handlePointerUp);

// --- Parent Gate (child lock) ---
// To exit fullscreen, adult must solve a simple math problem
function showParentGate() {
    const a = Math.floor(Math.random() * 10) + 3;
    const b = Math.floor(Math.random() * 10) + 3;
    gateAnswer = a + b;
    gateQuestion.textContent = `What is ${a} + ${b}?`;
    gateError.textContent = '';
    gateInput.value = '';
    parentGate.style.display = 'flex';
    gateInput.focus();
}

function checkGate() {
    if (parseInt(gateInput.value, 10) === gateAnswer) {
        parentGate.style.display = 'none';
        isLocked = false;
        if (document.fullscreenElement) document.exitFullscreen();
    } else {
        gateError.textContent = 'Try again!';
        gateInput.value = '';
        gateInput.focus();
    }
}

document.getElementById('gate-submit').addEventListener('click', checkGate);
gateInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkGate(); });
document.getElementById('gate-cancel').addEventListener('click', () => {
    parentGate.style.display = 'none';
});

// --- Fullscreen & Child Lock ---
const fsBtn = document.getElementById('fullscreen-btn');
fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            isLocked = true;
        }).catch(err => console.log('Fullscreen error:', err.message));
    } else {
        // When locked, require parent gate to exit
        if (isLocked) {
            showParentGate();
        } else {
            document.exitFullscreen();
        }
    }
});

// Re-enter fullscreen if exited while locked (e.g., accidental swipe)
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isLocked) {
        // Show a prompt to re-enter fullscreen on next tap
        isLocked = false;
    }
});

// Trap back button with history manipulation
window.addEventListener('load', () => {
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', () => {
        history.pushState(null, '', location.href);
    });
});

// --- Initialization ---
startScreen.addEventListener('click', () => {
    initAudio();
    initVoice();
    startScreen.style.display = 'none';
    gameActive = true;
    resize();
    setupLevel(true);
    render();
});

resize();
