'use strict';
import './canvas.js';
import './input.js';
import { COLS, ROWS, T, ANIM_TIME } from './constants.js';
import { ctx } from './canvas.js';
import { G, initGame } from './state.js';
import { consumeScreenKey } from './input.js';
import { startRound, triggerCaught, triggerSuccess } from './rounds.js';
import { executeTurn } from './turns.js';
import { generateDialogue } from './dialogue.js';
import { initSprites, rebuildMapCache } from './sprites.js';
import {
    renderTitle, renderIntro, renderRoundIntro, renderDialogue,
    renderGameView, renderHUD, renderCaught, renderSuccess, renderVictory,
} from './renderer.js';

// Init sprites on load
initSprites();

// ================================================================
// UPDATE
// ================================================================
function update(dt) {
    G.glowT += dt;
    if (G.screenGuard > 0) G.screenGuard -= dt;

    // VHS glitch timer
    G.glitchTimer -= dt;
    if (G.glitchTimer <= 0) {
        G.glitchActive = 0.1 + Math.random() * 0.1;
        G.glitchBandY = Math.floor(Math.random() * (ROWS * T - 40));
        G.glitchBandH = 20 + Math.floor(Math.random() * 20);
        G.glitchOffset = 2 + Math.floor(Math.random() * 5);
        G.glitchTimer = 5 + Math.random() * 3;
    }
    if (G.glitchActive > 0) G.glitchActive -= dt;

    // Screen shake decay
    if (G.screenShakeDur > 0) {
        G.screenShakeDur -= dt;
        G.screenShakeX = (Math.random() - 0.5) * 6;
        G.screenShakeY = (Math.random() - 0.5) * 4;
    } else {
        G.screenShakeX = 0; G.screenShakeY = 0;
    }

    switch (G.state) {
    case 'title':
        if (G.screenGuard <= 0 && consumeScreenKey()) { G.state = 'intro'; G.screenGuard = 0.3; G.typewriterIndex = 0; }
        break;
    case 'intro':
        // Typewriter reveal
        G.typewriterIndex += dt * 30; // ~30 chars per second
        if (G.screenGuard <= 0 && consumeScreenKey()) {
            initGame(); G.round = 1;
            rebuildMapCache();
            G.state = 'round_intro'; G.screenGuard = 0.3;
        }
        break;
    case 'round_intro':
        if (G.screenGuard <= 0 && consumeScreenKey()) { startRound(G.round); G.screenGuard = 0.3; }
        break;
    case 'dialogue':
        if (G.screenGuard <= 0 && consumeScreenKey()) { G.state = 'round_intro'; G.screenGuard = 0.3; }
        break;
    case 'playing':
        if (G.animTimer < ANIM_TIME) G.animTimer += dt;
        // After animation finishes, check deferred outcomes
        if (G.animTimer >= ANIM_TIME) {
            if (G.pendingCaught) { G.pendingCaught = false; triggerCaught(G.caughtReason); break; }
            if (G.pendingSuccess) { G.pendingSuccess = false; triggerSuccess(); break; }
            if (G.inputQueue.length > 0) executeTurn(G.inputQueue.shift());
        }
        break;
    case 'caught':
        if (G.screenGuard <= 0 && consumeScreenKey()) {
            initGame(); G.round = 1;
            rebuildMapCache();
            G.state = 'round_intro'; G.screenGuard = 0.3;
        }
        break;
    case 'success':
        G.screenTimer -= dt;
        if (G.screenTimer <= 0) {
            G.round++;
            G.currentDialogue = generateDialogue();
            G.state = G.currentDialogue ? 'dialogue' : 'round_intro';
            G.screenGuard = 0.3;
        }
        break;
    case 'victory':
        if (G.screenGuard <= 0 && consumeScreenKey()) {
            G.state = 'title'; G.screenGuard = 0.3;
        }
        break;
    }
    G.spaceJust = false;
}

// ================================================================
// RENDER
// ================================================================
function render() {
    ctx.clearRect(0, 0, COLS * T, ROWS * T);
    switch (G.state) {
    case 'title':      renderTitle(); break;
    case 'intro':      renderIntro(); break;
    case 'round_intro': renderRoundIntro(); break;
    case 'dialogue':   renderDialogue(); break;
    case 'playing':    renderGameView(); renderHUD(); break;
    case 'caught':     renderGameView(); renderHUD(); renderCaught(); break;
    case 'success':    renderGameView(); renderHUD(); renderSuccess(); break;
    case 'victory':    renderVictory(); break;
    }
}

// ================================================================
// GAME LOOP
// ================================================================
let lastTime = 0;
function gameLoop(ts) {
    const dt = Math.min((ts - lastTime) / 1000, 0.1);
    lastTime = ts;
    update(dt);
    render();
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(ts => { lastTime = ts; gameLoop(ts); });
