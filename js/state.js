'use strict';

export const G = {
    state: 'title', round: 1, bestRound: 0,
    currentDialogue: null, screenTimer: 0, screenGuard: 0.5,
    // Turn
    animTimer: 1, turnCount: 0,
    // Player (grid coords)
    px: 9, py: 13, ppx: 9, ppy: 13,
    pfx: 0, pfy: -1,
    hidden: false, hasOrbitz: false,
    // NPC
    npc: {x:4, y:2, px:4, py:2, fx:1, fy:0, path:[], waypointIdx:0},
    // Ghosts & recordings
    ghosts: [], recordings: [], recSamples: [],
    // Doors
    doors: [],
    // Orbitz
    orbX: 15, orbY: 2,
    // Input
    keys: {}, spaceJust: false, inputQueue: [],
    // Deferred turn results
    pendingCaught: false,
    pendingSuccess: false,
    // Anim
    glowT: 0,
    // VHS effects
    glitchTimer: 5 + Math.random() * 3,
    glitchActive: 0,
    glitchBandY: 0,
    glitchBandH: 30,
    glitchOffset: 4,
    // UI anim
    typewriterIndex: 0,
    screenShakeX: 0,
    screenShakeY: 0,
    screenShakeDur: 0,
};

export function initGame() {
    G.recordings = [];
    G.bestRound = 0;
}
