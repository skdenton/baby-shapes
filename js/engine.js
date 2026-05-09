// ============================================================================
// engine.js — Audio, Voice, Drawing, and Particle systems
// Globals (canvas, ctx, shapes, holes, particles, etc.) are declared in main.js
// ============================================================================

// --- Audio Engine (Web Audio API) ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx;

function initAudio() {
    if (!actx) actx = new AudioCtx();
    if (actx.state === 'suspended') actx.resume();
}

function playTone(freq, type, duration, vol, slideFreq) {
    if (!actx) return;
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, actx.currentTime);
    if (slideFreq) osc.frequency.exponentialRampToValueAtTime(slideFreq, actx.currentTime + duration);
    gain.gain.setValueAtTime(vol, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + duration);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + duration);
}

const sounds = {
    pickup: () => playTone(300, 'triangle', 0.2, 0.3, 600),
    drop: () => playTone(250, 'sine', 0.2, 0.2, 150),
    moveSparkle: () => playTone(800 + Math.random() * 600, 'sine', 0.1, 0.05),
    bgMove: () => playTone(200 + Math.random() * 300, 'sine', 0.2, 0.03),
    match: () => {
        playTone(440, 'square', 0.3, 0.1);
        setTimeout(() => playTone(554, 'square', 0.3, 0.1), 100);
        setTimeout(() => playTone(659, 'square', 0.4, 0.1), 200);
        setTimeout(() => playTone(880, 'square', 0.5, 0.1), 300);
    },
    win: () => {
        for (let i = 0; i < 20; i++) {
            setTimeout(() => playTone(400 + Math.random() * 800, 'sine', 0.3, 0.1), i * 100);
        }
    }
};

// --- Voice Engine (Web Speech API) ---
let femaleVoice = null;

function initVoice() {
    const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        const keywords = ['female', 'samantha', 'victoria', 'karen', 'fiona', 'zira', 'hazel'];
        femaleVoice = voices.find(v => keywords.some(k => v.name.toLowerCase().includes(k)))
            || voices.find(v => v.lang.startsWith('en'))
            || voices[0];
    };
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
}

function sayName(name) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(name);
    u.rate = 0.85;
    u.pitch = 1.3;
    u.volume = 1.0;
    if (femaleVoice) u.voice = femaleVoice;
    speechSynthesis.speak(u);
}

// --- Drawing Engine ---

// Draw the outline/fill path for any game piece type
function drawPath(ctx, type, x, y, size, label) {
    ctx.beginPath();
    if (type === 'circle') {
        ctx.arc(x, y, size, 0, Math.PI * 2);
    } else if (type === 'square') {
        ctx.rect(x - size * 0.9, y - size * 0.9, size * 1.8, size * 1.8);
    } else if (type === 'triangle') {
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y + size * 0.8);
        ctx.lineTo(x - size, y + size * 0.8);
    } else if (type === 'star') {
        for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? size * 1.1 : size * 0.5;
            const a = (i * Math.PI) / 5 - Math.PI / 2;
            if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
            else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        }
    } else if (type === 'heart') {
        ctx.moveTo(x, y + size * 0.7);
        ctx.bezierCurveTo(x - size * 1.3, y, x - size * 0.7, y - size, x, y - size * 0.4);
        ctx.bezierCurveTo(x + size * 0.7, y - size, x + size * 1.3, y, x, y + size * 0.7);
    } else if (type === 'number' || type === 'letter') {
        // Rounded rectangle tile
        const w = size * 1.7, h = size * 1.9, r = size * 0.35;
        const lx = x - w / 2, ly = y - h / 2;
        ctx.moveTo(lx + r, ly);
        ctx.lineTo(lx + w - r, ly);
        ctx.quadraticCurveTo(lx + w, ly, lx + w, ly + r);
        ctx.lineTo(lx + w, ly + h - r);
        ctx.quadraticCurveTo(lx + w, ly + h, lx + w - r, ly + h);
        ctx.lineTo(lx + r, ly + h);
        ctx.quadraticCurveTo(lx, ly + h, lx, ly + h - r);
        ctx.lineTo(lx, ly + r);
        ctx.quadraticCurveTo(lx, ly, lx + r, ly);
    }
    ctx.closePath();
}

// Draw the label text (number digit or letter) centered on a tile
function drawLabel(ctx, label, x, y, size, color) {
    if (!label) return;
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 1.2}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = size * 0.06;
    ctx.strokeText(label, x, y + size * 0.05);
    ctx.fillText(label, x, y + size * 0.05);
    ctx.restore();
}

// Cute face for shape-type pieces only
function drawFace(ctx, x, y, size) {
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y - size * 0.1, size * 0.12, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x - size * 0.33, y - size * 0.13, size * 0.04, 0, Math.PI * 2);
    ctx.arc(x + size * 0.27, y - size * 0.13, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = size * 0.08;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y + size * 0.2, size * 0.4, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
}

// --- Particle System ---

function createSparkle(x, y, color) {
    particles.push({
        x: x + (Math.random() * 40 - 20), y: y + (Math.random() * 40 - 20),
        vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 6 + 4, color: color,
        life: 1.0, decay: Math.random() * 0.05 + 0.05, type: 'sparkle'
    });
}

function createFireworks(x, y, color) {
    for (let i = 0; i < 80; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * 15 + 5;
        particles.push({
            x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            size: Math.random() * 12 + 3,
            color: Math.random() > 0.3 ? color : 'white',
            life: 1.0, decay: Math.random() * 0.01 + 0.01, type: 'firework'
        });
    }
}

function updateAndDrawParticles(ctx) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.type === 'firework') p.vy += 0.4;
        p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
}
