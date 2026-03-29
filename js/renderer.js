'use strict';
import { T, COLS, ROWS, HIDING_DEFS, VIEW_SCALE, ANIM_TIME } from './constants.js';
import { ctx } from './canvas.js';
import { G } from './state.js';
import { getRoomAt, lerpPos } from './utils.js';
import { getVisionTiles } from './vision.js';
import {
    drawSprite, facingToDir, getMapCache, getScanlines, getVignette,
} from './sprites.js';
import { predictNPCNext, predictGhostNext } from './turns.js';

const W = COLS * T, H = ROWS * T;

// ================================================================
// HIDING SPOT MAP (id → sprite name)
// ================================================================
const HIDING_SPRITE = {
    'bed': 'hiding_bed',
    'closet': 'hiding_closet',
    'couch': 'hiding_couch',
    'shower': 'hiding_shower',
};

// ================================================================
// MAP RENDERING
// ================================================================
export function renderMap() {
    // Blit cached static map
    const mc = getMapCache();
    if (mc) ctx.drawImage(mc, 0, 0);

    // Dynamic elements: hiding spot highlights
    for (const h of HIDING_DEFS) {
        ctx.fillStyle = 'rgba(100,150,255,0.1)';
        ctx.fillRect(h.x * T + 2, h.y * T + 2, T - 4, T - 4);
        // Subtle diamond marker
        ctx.font = '10px monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(100,150,255,0.25)';
        ctx.fillText('\u25C6', h.x * T + T / 2, h.y * T + T / 2 + 4);
    }

    // Dynamic elements: doors
    for (const door of G.doors) {
        const sx = door.x * T, sy = door.y * T;
        if (door.open) {
            const room = getRoomAt(door.x, door.y);
            ctx.fillStyle = room ? room.floor : '#6a6a62'; ctx.fillRect(sx, sy, T, T);
            // Door frame sides
            ctx.fillStyle = '#5a4a38'; ctx.fillRect(sx, sy, 3, T); ctx.fillRect(sx + T - 3, sy, 3, T);
            // Door swung open (thin strip)
            ctx.fillStyle = '#5a4030'; ctx.fillRect(sx + 3, sy, 4, T);
        } else {
            ctx.fillStyle = '#5a4030'; ctx.fillRect(sx, sy, T, T);
            // Wood grain
            ctx.fillStyle = '#6a5040'; ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
            ctx.fillStyle = '#5a4030';
            ctx.fillRect(sx + 4, sy + 4, T - 8, 1);
            ctx.fillRect(sx + 4, sy + T / 2, T - 8, 1);
            ctx.fillRect(sx + 4, sy + T - 6, T - 8, 1);
            // Frame
            ctx.fillStyle = '#4a3828'; ctx.fillRect(sx, sy, T, 2); ctx.fillRect(sx, sy, 2, T);
            ctx.fillRect(sx + T - 2, sy, 2, T); ctx.fillRect(sx, sy + T - 2, T, 2);
            // Doorknob
            ctx.fillStyle = '#bb9955';
            ctx.beginPath(); ctx.arc(sx + T - 8, sy + T / 2, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#997733';
            ctx.beginPath(); ctx.arc(sx + T - 8, sy + T / 2 + 3, 1, 0, Math.PI * 2); ctx.fill();
        }
    }

    // Exit glow when carrying Orbitz
    if (G.hasOrbitz) {
        const pulse = 0.5 + 0.5 * Math.sin(G.glowT * 5);
        ctx.fillStyle = `rgba(170,255,0,${0.15 + 0.1 * pulse})`;
        ctx.fillRect(9 * T, 13 * T, T, T); ctx.fillRect(10 * T, 13 * T, T, T);
        ctx.font = '8px monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(170,255,0,${0.4 + 0.3 * pulse})`;
        ctx.fillText('EXIT', 9.5 * T + T / 2, 13 * T + T / 2 + 3);
    }
}

// ================================================================
// ORBITZ BOTTLE
// ================================================================
const ORB_BALLS = [
    {rx:0.2, ry:0.15, color:'#ff66aa', r:1.8}, {rx:-0.15, ry:-0.1, color:'#66ccff', r:1.5},
    {rx:0.05, ry:0.3, color:'#ffaa33', r:1.6}, {rx:-0.1, ry:0.0, color:'#aa66ff', r:1.4},
    {rx:0.18, ry:-0.25, color:'#66ff99', r:1.7}, {rx:-0.2, ry:0.22, color:'#ff6666', r:1.3},
    {rx:0.0, ry:-0.18, color:'#ffff66', r:1.5}, {rx:0.12, ry:0.08, color:'#66aaff', r:1.2},
];

function drawOrbitzBottle(cx, cy, s) {
    s = s || 1;
    const bw = 7 * s, bh = 13 * s, nw = 3 * s, nh = 5 * s;
    const pulse = 0.85 + 0.15 * Math.sin(G.glowT * 3);
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22 * pulse * s);
    grad.addColorStop(0, 'rgba(180,220,255,0.4)'); grad.addColorStop(1, 'rgba(180,220,255,0)');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, 22 * pulse * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(200,230,255,0.25)'; ctx.strokeStyle = 'rgba(200,230,255,0.6)'; ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(cx - bw, cy - bh + 3 * s); ctx.quadraticCurveTo(cx - bw, cy - bh, cx - bw + 2 * s, cy - bh);
    ctx.lineTo(cx + bw - 2 * s, cy - bh); ctx.quadraticCurveTo(cx + bw, cy - bh, cx + bw, cy - bh + 3 * s);
    ctx.lineTo(cx + bw, cy + bh - 3 * s); ctx.quadraticCurveTo(cx + bw, cy + bh, cx + bw - 2 * s, cy + bh);
    ctx.lineTo(cx - bw + 2 * s, cy + bh); ctx.quadraticCurveTo(cx - bw, cy + bh, cx - bw, cy + bh - 3 * s);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(200,230,255,0.2)'; ctx.beginPath();
    ctx.moveTo(cx - nw, cy - bh); ctx.lineTo(cx - nw, cy - bh - nh); ctx.lineTo(cx + nw, cy - bh - nh); ctx.lineTo(cx + nw, cy - bh);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(220,200,100,0.8)'; ctx.fillRect(cx - nw - s, cy - bh - nh - 2 * s, (nw + s) * 2, 2.5 * s);
    for (const ball of ORB_BALLS) {
        const bx = cx + ball.rx * bw * 1.4, floatY = Math.sin(G.glowT * 1.5 + ball.rx * 10 + ball.ry * 7) * 2 * s;
        ctx.fillStyle = ball.color; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.arc(bx, cy + ball.ry * bh * 1.2 + floatY, ball.r * s, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(cx - bw + 1.5 * s, cy - bh + 2 * s, 2.5 * s, bh * 1.6);
    ctx.font = `${5 * s}px monospace`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(200,230,255,0.5)';
    ctx.fillText('ORBITZ', cx, cy + 6 * s);
}

function renderOrbitz() {
    if (G.hasOrbitz) return;
    drawOrbitzBottle((G.orbX + 0.5) * T, (G.orbY + 0.5) * T, 1);
}

// ================================================================
// ENTITIES
// ================================================================
function drawVisionBox(ex, ey, fx, fy, color) {
    const tiles = getVisionTiles(Math.round(ex), Math.round(ey), fx, fy);
    ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = color;
    for (const t of tiles) ctx.fillRect(t.x * T, t.y * T, T, T);
    ctx.restore();
}

function drawNextVisionBox(ex, ey, fx, fy, color) {
    const tiles = getVisionTiles(Math.round(ex), Math.round(ey), fx, fy);
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    for (const t of tiles) {
        ctx.strokeRect(t.x * T + 1, t.y * T + 1, T - 2, T - 2);
    }
    ctx.setLineDash([]);
    ctx.restore();
}

function renderPlayer(t) {
    const v = lerpPos(G.ppx, G.ppy, G.px, G.py, t);
    const dir = facingToDir(G.pfx, G.pfy);

    if (G.hidden) {
        // Draw hiding spot sprite with peeking eyes
        for (const h of HIDING_DEFS) {
            if (G.px === h.x && G.py === h.y) {
                const sName = HIDING_SPRITE[h.id];
                if (sName) drawSprite(ctx, sName, h.x * T, h.y * T);
                break;
            }
        }
        return;
    }

    // Walk bob
    const bob = (t < 1) ? Math.sin(t * Math.PI) * 2 : 0;
    drawSprite(ctx, 'matt_' + dir, Math.round(v.x * T), Math.round(v.y * T - bob));

    // Orbitz bottle on player
    if (G.hasOrbitz) drawOrbitzBottle((v.x + 0.5) * T + 8, (v.y + 0.5) * T - 12, 0.3);
}

function renderNPC(t) {
    const n = G.npc, v = lerpPos(n.px, n.py, n.x, n.y, t);
    const dir = facingToDir(n.fx, n.fy);
    drawVisionBox(n.x, n.y, n.fx, n.fy, '#ff6633');
    const next = predictNPCNext();
    if (next) drawNextVisionBox(next.x, next.y, next.fx, next.fy, '#ff6633');
    const bob = (t < 1) ? Math.sin(t * Math.PI) * 2 : 0;
    drawSprite(ctx, 'jay_' + dir, Math.round(v.x * T), Math.round(v.y * T - bob));
}

function renderGhosts(t) {
    for (const ghost of G.ghosts) {
        // Show next-FOV preview even for inactive ghosts about to enter
        const nextG = predictGhostNext(ghost);
        if (nextG) drawNextVisionBox(nextG.x, nextG.y, nextG.fx, nextG.fy, '#55cccc');
        if (!ghost.active) continue;
        const v = lerpPos(ghost.px, ghost.py, ghost.x, ghost.y, t);
        const dir = facingToDir(ghost.fx, ghost.fy);
        drawVisionBox(ghost.x, ghost.y, ghost.fx, ghost.fy, '#55cccc');
        ctx.globalAlpha = 0.45;
        const bob = (t < 1) ? Math.sin(t * Math.PI) * 1.5 : 0;
        drawSprite(ctx, 'ghost_' + dir, Math.round(v.x * T), Math.round(v.y * T - bob));
        ctx.globalAlpha = 1;
    }
}

// ================================================================
// VHS POST-PROCESSING
// ================================================================
function applyVHSEffects() {
    // Scanlines
    const sl = getScanlines();
    if (sl) ctx.drawImage(sl, 0, 0);

    // Warm color wash
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(255, 245, 230, 0.95)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    // Subtle warm overlay
    ctx.fillStyle = 'rgba(40, 30, 15, 0.04)';
    ctx.fillRect(0, 0, W, H);

    // VHS tracking glitch
    if (G.glitchActive > 0) {
        const imgData = ctx.getImageData(0, G.glitchBandY, W, G.glitchBandH);
        ctx.putImageData(imgData, G.glitchOffset, G.glitchBandY);
        // Static noise in the displaced band
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        for (let i = 0; i < 30; i++) {
            const nx = Math.random() * W, ny = G.glitchBandY + Math.random() * G.glitchBandH;
            ctx.fillRect(nx, ny, 2, 1);
        }
    }

    // Film grain
    for (let i = 0; i < 60; i++) {
        const gx = Math.random() * W, gy = Math.random() * H;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
        ctx.fillRect(gx, gy, 1, 1);
    }

    // Vignette (on top of everything)
    const vig = getVignette();
    if (vig) ctx.drawImage(vig, 0, 0);
}

// ================================================================
// HUD
// ================================================================
export function renderHUD() {
    // Round counter box with green accent
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(4, 4, 96, 24);
    ctx.fillStyle = '#aaff00'; ctx.fillRect(4, 4, 3, 24);
    ctx.font = 'bold 14px monospace'; ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff'; ctx.fillText('Round ' + G.round, 12, 21);

    // Step counter
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(4, 30, 80, 18);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(4, 30, 3, 18);
    ctx.font = '11px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Steps: ' + G.turnCount, 12, 44);

    // Ghost count
    if (G.recordings.length > 0) {
        const count = G.recordings.length + 1;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(4, 50, 80, 18);
        ctx.fillStyle = '#55cccc'; ctx.fillRect(4, 50, 3, 18);
        ctx.font = '11px monospace'; ctx.fillStyle = 'rgba(150,220,220,0.8)';
        ctx.fillText(count + ' selves', 12, 64);
    }

    // Objective banner
    ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
    const bannerY = H - 22;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(W / 2 - 100, bannerY - 4, 200, 20);
    if (!G.hasOrbitz) {
        ctx.fillStyle = 'rgba(170,255,0,0.8)'; ctx.fillText('FIND THE ORBITZ', W / 2, bannerY + 10);
    } else {
        const p = 0.5 + 0.5 * Math.sin(G.glowT * 6);
        ctx.fillStyle = `rgba(170,255,0,${0.5 + 0.5 * p})`;
        ctx.fillText('GET TO THE EXIT!', W / 2, bannerY + 10);
    }

    // Tutorial hint
    if (G.round === 1 && G.turnCount < 20) {
        ctx.font = '10px monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText('Arrows: Move    Space: Interact', W / 2, bannerY - 10);
    }

    // Best score
    if (G.bestRound > 0) {
        ctx.font = '10px monospace'; ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(170,255,0,0.4)';
        ctx.fillText('Best: ' + G.bestRound, W - 8, H - 8);
    }
}

// ================================================================
// SCREEN HELPERS
// ================================================================
function drawOverlay(a) { ctx.fillStyle = `rgba(10,10,26,${a})`; ctx.fillRect(0, 0, W, H); }
function drawCT(text, y, font, color) {
    ctx.font = font; ctx.textAlign = 'center'; ctx.fillStyle = color;
    ctx.fillText(text, W / 2, y);
}

// VHS noise background for screens
function drawVHSBackground() {
    ctx.fillStyle = '#08081a'; ctx.fillRect(0, 0, W, H);
    // Horizontal noise lines
    for (let i = 0; i < 40; i++) {
        const ny = (G.glowT * 20 + i * 17.3) % H;
        ctx.fillStyle = `rgba(255,255,255,${0.01 + Math.random() * 0.02})`;
        ctx.fillRect(0, ny, W, 1);
    }
    // Slow-scrolling tracking lines
    for (let i = 0; i < 3; i++) {
        const ty = ((G.glowT * 15 + i * 160) % (H + 40)) - 20;
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(0, ty, W, 3);
    }
}

// Chromatic aberration text
function drawGlitchText(text, y, font, color) {
    ctx.font = font; ctx.textAlign = 'center';
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#ff0000'; ctx.fillText(text, W / 2 - 2, y);
    ctx.fillStyle = '#00ffff'; ctx.fillText(text, W / 2 + 2, y);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color; ctx.fillText(text, W / 2, y);
}

// ================================================================
// SCREENS
// ================================================================
export function renderTitle() {
    drawVHSBackground();

    // Stacked title with decreasing opacity (self-referential humor)
    drawCT('NIRVANNA THE BAND', 95, 'bold 22px monospace', 'rgba(170,255,0,1)');
    drawCT('THE SHOW', 125, 'bold 20px monospace', 'rgba(170,255,0,0.75)');
    drawCT('THE MOVIE', 152, 'bold 18px monospace', 'rgba(170,255,0,0.55)');
    drawCT('THE GAME', 176, 'bold 16px monospace', 'rgba(170,255,0,0.4)');

    drawCT('A Time Paradox Stealth Puzzle', 215, '12px monospace', 'rgba(255,255,255,0.5)');

    if (Math.sin(G.glowT * 3) > 0)
        drawCT('Press any key to start', 310, '14px monospace', '#ffffff');

    // VHS camcorder timestamp
    const secs = Math.floor(G.glowT) % 60;
    const mins = Math.floor(G.glowT / 60) % 60;
    const ts = 'REC ' + String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    ctx.font = '11px monospace'; ctx.textAlign = 'left';
    // Blinking red dot
    if (Math.sin(G.glowT * 4) > 0) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath(); ctx.arc(16, H - 18, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#ff3333'; ctx.fillText(ts, 26, H - 14);
}

export function renderIntro() {
    drawVHSBackground();

    const fullLines = ['The apartment. 2008.', '', 'You need the Orbitz.', '', 'Get in. Grab it. Get out.', '', "Don't let anyone see you.", '', 'Not even yourself.'];

    // Typewriter effect
    let charCount = 0;
    let y = 100;
    const revealedChars = Math.floor(G.typewriterIndex);

    for (const l of fullLines) {
        if (l === '') { y += 10; continue; }
        const visible = Math.max(0, Math.min(l.length, revealedChars - charCount));
        const shown = l.substring(0, visible);
        charCount += l.length;

        if (shown.length > 0) {
            const isSpecial = l.includes('yourself');
            // Subtitle box
            const textW = ctx.measureText ? 0 : 0; // will use after setting font
            ctx.font = '14px monospace';
            const jitterX = (Math.random() - 0.5) * 0.5;
            ctx.textAlign = 'center';
            ctx.fillStyle = isSpecial ? '#aaff00' : 'rgba(255,255,255,0.9)';
            ctx.fillText(shown, W / 2 + jitterX, y);
        }
        y += 26;
    }

    if (revealedChars > charCount && Math.sin(G.glowT * 3) > 0)
        drawCT('Press any key', H - 60, '13px monospace', 'rgba(255,255,255,0.4)');
}

export function renderRoundIntro() {
    drawOverlay(0.88);

    // VHS chapter marker banner
    const bannerW = 200, bannerH = 36;
    const bannerX = W / 2 - bannerW / 2, bannerY = 165;
    ctx.fillStyle = '#000'; ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px monospace'; ctx.textAlign = 'center';
    ctx.fillText('ROUND ' + G.round, W / 2, bannerY + 27);

    // Static burst dots around banner
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 20; i++) {
        ctx.fillRect(bannerX + Math.random() * bannerW, bannerY - 5 + Math.random() * (bannerH + 10), 3, 1);
    }

    const orbRoom = getRoomAt(G.orbX, G.orbY);
    drawCT('The Orbitz is in the ' + (orbRoom ? orbRoom.name : 'apartment') + '.', 225, '13px monospace', 'rgba(255,255,255,0.7)');
    if (G.recordings.length > 0) {
        drawCT((G.recordings.length + 1) + ' past selves inside.', 252, '12px monospace', 'rgba(150,220,220,0.7)');
    } else {
        drawCT('Your past self is home.', 252, '12px monospace', 'rgba(255,150,100,0.7)');
    }
    if (Math.sin(G.glowT * 3) > 0) drawCT('Press any key', 340, '13px monospace', 'rgba(255,255,255,0.35)');
}

export function renderDialogue() {
    drawOverlay(0.92);
    const dlg = G.currentDialogue; if (!dlg) return;

    let y = 140;
    for (const l of dlg) {
        const isMatt = l.startsWith('Matt:');
        // Speaker portrait
        const portraitName = isMatt ? 'portrait_matt' : 'portrait_jay';
        const portraitX = isMatt ? 60 : W - 124;
        drawSprite(ctx, portraitName, portraitX, y - 24);

        // Speech text
        const textX = isMatt ? 140 : W / 2 - 30;
        ctx.font = '13px monospace'; ctx.textAlign = 'left';

        // Text background box
        const boxX = textX - 8, boxY = y - 14, boxW = W - textX - 40, boxH = 24;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.roundRect(boxX, boxY, boxW, boxH, 4); ctx.fill();
        ctx.fillStyle = isMatt ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.3)';
        ctx.strokeStyle = isMatt ? '#4466aa' : '#aa6633';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(boxX, boxY, boxW, boxH, 4); ctx.stroke();

        ctx.fillStyle = isMatt ? '#88aaff' : '#ffaa66';
        ctx.fillText(l, textX, y);
        y += 50;
    }

    if (Math.sin(G.glowT * 3) > 0) drawCT('Press any key', H - 60, '13px monospace', 'rgba(255,255,255,0.35)');
}

export function renderCaught() {
    drawOverlay(0.85);

    // Screen shake offset
    const shakeX = G.screenShakeDur > 0 ? G.screenShakeX : 0;
    const shakeY = G.screenShakeDur > 0 ? G.screenShakeY : 0;

    // TIME PARADOX with chromatic aberration
    drawGlitchText('TIME PARADOX', 200 + shakeY, 'bold 34px monospace', '#ff3333');

    // Static burst
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 80; i++) {
        ctx.fillRect(Math.random() * W + shakeX, 170 + Math.random() * 50 + shakeY, 3, 1);
    }

    drawCT('One of your past selves saw you.', 250, '13px monospace', 'rgba(255,255,255,0.7)');
    if (G.round > 1) drawCT('Made it to round ' + G.round + '.', 275, '12px monospace', 'rgba(255,255,255,0.5)');
    drawCT('Timeline reset.', 296, '12px monospace', 'rgba(255,255,255,0.35)');
    if (Math.sin(G.glowT * 3) > 0) drawCT('Press any key', 356, '13px monospace', 'rgba(255,255,255,0.35)');
}

export function renderSuccess() {
    drawOverlay(0.55);

    // Green glow behind text
    const pulse = 0.5 + 0.5 * Math.sin(G.glowT * 3);
    const grad = ctx.createRadialGradient(W / 2, 200, 10, W / 2, 200, 120);
    grad.addColorStop(0, `rgba(170,255,0,${0.15 * pulse})`);
    grad.addColorStop(1, 'rgba(170,255,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(W / 2 - 120, 140, 240, 120);

    drawCT('GOT OUT!', 200, 'bold 30px monospace', '#aaff00');
    drawCT(G.round + ' bottle' + (G.round > 1 ? 's' : '') + ' collected', 238, '14px monospace', 'rgba(255,255,255,0.6)');
    drawCT("But now there's another you in there...", 268, '11px monospace', 'rgba(150,220,220,0.6)');

    // VHS fast-forward bars
    for (let i = 0; i < 2; i++) {
        const by = ((G.glowT * 100 + i * 120) % (H + 20)) - 10;
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(0, by, W, 4);
    }
}

// ================================================================
// CAMERA & GAME VIEW
// ================================================================
function getCam(vx, vy) {
    const vw = W / VIEW_SCALE, vh = H / VIEW_SCALE;
    let cx = (vx + 0.5) * T - vw / 2, cy = (vy + 0.5) * T - vh / 2;
    cx = Math.max(0, Math.min(cx, W - vw));
    cy = Math.max(0, Math.min(cy, H - vh));
    return {x: cx, y: cy};
}

export function renderGameView() {
    const t = Math.min(G.animTimer / ANIM_TIME, 1);
    const vp = lerpPos(G.ppx, G.ppy, G.px, G.py, t);
    const cam = getCam(vp.x, vp.y);

    ctx.save();
    ctx.scale(VIEW_SCALE, VIEW_SCALE);
    ctx.translate(-cam.x, -cam.y);
    renderMap(); renderOrbitz(); renderGhosts(t); renderNPC(t); renderPlayer(t);
    ctx.restore();

    // Apply VHS effects over the game view
    applyVHSEffects();
}
