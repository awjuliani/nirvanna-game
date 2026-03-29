'use strict';
import { MAP, ROOMS, COLS, ROWS } from './constants.js';
import { G } from './state.js';

export function getRoomAt(x, y) {
    for (const r of ROOMS) if (x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2) return r;
    return null;
}

export function getDoor(x, y) {
    return G.doors.find(d => d.x === x && d.y === y);
}

export function isBlocked(tx, ty) {
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return true;
    if (MAP[ty][tx] !== 0) return true;
    const d = getDoor(tx, ty);
    if (d && !d.open) return true;
    return false;
}

export function lerpPos(px, py, cx, cy, t) {
    return {x: px + (cx - px) * t, y: py + (cy - py) * t};
}
