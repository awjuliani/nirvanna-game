'use strict';
import { G } from './state.js';
import { DOOR_DEFS, GHOST_ENTRY_DELAY } from './constants.js';
import { pickOrbitzPos } from './constants.js';
import { rebuildMapCache } from './sprites.js';

export function startRound(round) {
    G.round = round;
    G.state = 'playing';
    G.hasOrbitz = false;
    G.px = 9; G.py = 13; G.ppx = 9; G.ppy = 13;
    G.pfx = 0; G.pfy = -1;
    G.hidden = false;
    G.animTimer = 1; G.turnCount = 0;
    // NPC
    G.npc = {x:4, y:2, px:4, py:2, fx:1, fy:0, path:[], waypointIdx:0};
    // Ghosts with staggered entry
    G.ghosts = G.recordings.map((rec, i) => ({
        recording: rec, startTurn: (i + 1) * GHOST_ENTRY_DELAY,
        entered: false, active: false, recIdx: 0,
        x: 9, y: 13, px: 9, py: 13, fx: 0, fy: -1,
    }));
    G.doors = DOOR_DEFS.map(d => ({...d, open: true}));
    const orb = pickOrbitzPos();
    G.orbX = orb.x; G.orbY = orb.y;
    G.recSamples = [];
    G.inputQueue = [];
    rebuildMapCache();
}

export function triggerCaught() {
    G.state = 'caught';
    G.screenGuard = 0.5;
    G.screenShakeDur = 0.4;
}

export function triggerSuccess() {
    G.recordings.push({samples: G.recSamples.slice()});
    if (G.round > G.bestRound) G.bestRound = G.round;
    G.state = 'success';
    G.screenTimer = 1.2;
}
