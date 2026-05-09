// ============================================================================
// levels.js — Level configuration, layout engine, and level creation
// Globals (shapes, holes, width, height, currentLevel, layoutDir) from main.js
// ============================================================================

// --- Level Configuration ---
const SHAPE_TYPES = ['circle', 'square', 'triangle', 'star', 'heart'];
const SHAPE_COLORS = ['#FF5252', '#448AFF', '#FFEB3B', '#69F0AE', '#E040FB'];
const SHAPE_NAMES = ['Circle', 'Square', 'Triangle', 'Star', 'Heart'];
const NUMBER_NAMES = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'];
const WORD_LIST = ['cat','dog','sun','hat','cup','ball','fish','star','moon','tree','bird','frog','book','cake','love'];
const EXT_COLORS = ['#FF5252','#448AFF','#FFEB3B','#69F0AE','#E040FB','#FF6D00','#00BCD4','#AB47BC','#EC407A','#D4E157','#26A69A'];
const LAYOUT_DIRS = ['top-bottom','bottom-top','left-right','right-left'];

// Determine phase from level number
// L1-5: shapes (5 shapes including heart)
// L6-15: numbers (1 up to 1-10, sequential)
// L16+: words (letter matching)
function getPhase(level) {
    if (level <= 5) return 'shapes';
    if (level <= 15) return 'numbers';
    return 'words';
}

function getPhaseLabel(phase) {
    if (phase === 'shapes') return '🔵 Shapes';
    if (phase === 'numbers') return '🔢 Numbers';
    return '🔤 Words';
}

// --- Layout Engine ---
// Compute target and item positions based on current layoutDir and screen size
function computePositions(numItems) {
    const isVert = (layoutDir === 'top-bottom' || layoutDir === 'bottom-top');
    const isFlip = (layoutDir === 'bottom-top' || layoutDir === 'right-left');

    const baseSize = Math.min(width, height) * 0.10;
    const axisLen = isVert ? width : height;
    const size = Math.min(baseSize, axisLen / (numItems * 2.8));

    const targets = [], items = [];

    if (isVert) {
        const spacing = width / numItems;
        const sA = height * 0.22, sB = height * 0.78;
        const tY = isFlip ? sB : sA, iY = isFlip ? sA : sB;
        for (let i = 0; i < numItems; i++) {
            const xp = spacing / 2 + i * spacing;
            targets.push({ x: xp, y: tY });
            items.push({ x: xp, y: iY });
        }
    } else {
        const spacing = height / numItems;
        const sA = width * 0.18, sB = width * 0.82;
        const tX = isFlip ? sB : sA, iX = isFlip ? sA : sB;
        for (let i = 0; i < numItems; i++) {
            const yp = spacing / 2 + i * spacing;
            targets.push({ x: tX, y: yp });
            items.push({ x: iX, y: yp });
        }
    }
    return { size, targets, items };
}

// Shuffle helper
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// --- Level Creation ---
function createLevel() {
    shapes = [];
    holes = [];
    currentPhase = getPhase(currentLevel);
    layoutDir = LAYOUT_DIRS[Math.floor(Math.random() * LAYOUT_DIRS.length)];
    currentWord = null;

    if (currentPhase === 'shapes') createShapeLevel();
    else if (currentPhase === 'numbers') createNumberLevel();
    else createWordLevel();
}

function makePiece(id, type, label, pos, size, color, spokenName) {
    return {
        id, type, label,
        x: pos.x + (Math.random() * 30 - 15),
        y: pos.y + (Math.random() * 30 - 15),
        startX: pos.x, startY: pos.y,
        size, color, spokenName,
        isMatched: false, isDragging: false,
        pointerId: null, dragOffsetX: 0, dragOffsetY: 0
    };
}

function makeHole(id, type, label, pos, size, color, spokenName) {
    return { id, type, label, x: pos.x, y: pos.y, size, color, spokenName };
}

function createShapeLevel() {
    const count = Math.min(currentLevel, 5);
    const { size, targets, items } = computePositions(count);
    const indices = shuffle([0,1,2,3,4]).slice(0, count);
    const shuffledPos = shuffle([...Array(count).keys()]);

    for (let i = 0; i < count; i++) {
        const idx = indices[i];
        const id = 'shape-' + SHAPE_TYPES[idx];
        holes.push(makeHole(id, SHAPE_TYPES[idx], '', targets[i], size, SHAPE_COLORS[idx], SHAPE_NAMES[idx]));
        shapes.push(makePiece(id, SHAPE_TYPES[idx], '', items[shuffledPos[i]], size, SHAPE_COLORS[idx], SHAPE_NAMES[idx]));
    }
}

function createNumberLevel() {
    // Sequential numbers: L6=1, L7=1-2, L8=1-2-3, ... L15=1-2-3-4-5-6-7-8-9-10
    const count = Math.min(1 + (currentLevel - 6), 10);
    const { size, targets, items } = computePositions(count);
    const shuffledPos = shuffle([...Array(count).keys()]);

    // Numbers always go in order for the targets (1, 2, 3, ...)
    for (let i = 0; i < count; i++) {
        const n = i + 1; // Start from 1, not 0
        const id = 'num-' + n;
        const color = EXT_COLORS[n % EXT_COLORS.length];
        holes.push(makeHole(id, 'number', String(n), targets[i], size, color, NUMBER_NAMES[n]));
        shapes.push(makePiece(id, 'number', String(n), items[shuffledPos[i]], size, color, NUMBER_NAMES[n]));
    }
}

function createWordLevel() {
    const wordIdx = (currentLevel - 16) % WORD_LIST.length;
    currentWord = WORD_LIST[wordIdx];
    const letters = currentWord.toUpperCase().split('');
    const count = letters.length;
    const { size, targets, items } = computePositions(count);
    const shuffledPos = shuffle([...Array(count).keys()]);

    for (let i = 0; i < count; i++) {
        const id = 'letter-' + i;
        const color = EXT_COLORS[i % EXT_COLORS.length];
        holes.push(makeHole(id, 'letter', letters[i], targets[i], size, color, letters[i]));
        shapes.push(makePiece(id, 'letter', letters[i], items[shuffledPos[i]], size, color, letters[i]));
    }
}

// Reposition on resize without resetting match state
function setupLevel(resetMatches) {
    if (resetMatches || shapes.length === 0) {
        createLevel();
        return;
    }
    const numItems = holes.length;
    const { size, targets, items } = computePositions(numItems);

    holes.forEach((h, i) => { h.x = targets[i].x; h.y = targets[i].y; h.size = size; });

    let ui = 0;
    shapes.forEach(s => {
        s.size = size;
        if (s.isMatched) {
            const hole = holes.find(h => h.id === s.id);
            if (hole) { s.x = hole.x; s.y = hole.y; }
        } else if (ui < items.length) {
            s.x = items[ui].x; s.y = items[ui].y;
            s.startX = s.x; s.startY = s.y;
            ui++;
        }
    });
}
