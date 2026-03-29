'use strict';
import { COLS, ROWS } from './constants.js';
import { G } from './state.js';
import { isBlocked } from './utils.js';

// 3-wide, 2-deep box in front, blocked by walls/doors
export function getVisionTiles(ex, ey, efx, efy) {
    const tiles = [];
    const sx = -efy, sy = efx; // perpendicular axis
    for (let f = 1; f <= 2; f++) {
        for (let s = -1; s <= 1; s++) {
            const tx = ex + efx * f + sx * s, ty = ey + efy * f + sy * s;
            if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) continue;
            if (f === 2) {
                const fx1 = ex + efx + sx * s, fy1 = ey + efy + sy * s;
                if (isBlocked(fx1, fy1)) continue;
            }
            if (isBlocked(tx, ty)) continue;
            tiles.push({x: tx, y: ty});
        }
    }
    return tiles;
}

function isSeenBy(ex, ey, efx, efy) {
    if (G.hidden) return false;
    if (ex === G.px && ey === G.py) return true;
    const tiles = getVisionTiles(ex, ey, efx, efy);
    return tiles.some(t => t.x === G.px && t.y === G.py);
}

export function checkDetection() {
    if (isSeenBy(G.npc.x, G.npc.y, G.npc.fx, G.npc.fy)) return true;
    for (const ghost of G.ghosts) {
        if (!ghost.active) continue;
        if (isSeenBy(ghost.x, ghost.y, ghost.fx, ghost.fy)) return true;
    }
    return false;
}
