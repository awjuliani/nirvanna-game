'use strict';
import { MAP, COLS, ROWS } from './constants.js';

export function findPath(sx, sy, gx, gy) {
    sx = Math.round(sx); sy = Math.round(sy);
    gx = Math.round(gx); gy = Math.round(gy);
    if (sx === gx && sy === gy) return [];
    if (MAP[gy] === undefined || MAP[gy][gx] !== 0) return null;

    const visited = new Set(), parent = new Map();
    const queue = [`${sx},${sy}`];
    visited.add(queue[0]);
    const dirs = [[0,-1],[0,1],[-1,0],[1,0]];

    while (queue.length > 0) {
        const key = queue.shift();
        const [cx, cy] = key.split(',').map(Number);
        if (cx === gx && cy === gy) {
            const path = [];
            let k = key;
            while (parent.has(k)) {
                const [px, py] = k.split(',').map(Number);
                path.unshift({x: px, y: py});
                k = parent.get(k);
            }
            return path;
        }
        for (const [dx, dy] of dirs) {
            const nx = cx + dx, ny = cy + dy, nk = `${nx},${ny}`;
            if (!visited.has(nk) && ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && MAP[ny][nx] === 0) {
                visited.add(nk);
                parent.set(nk, key);
                queue.push(nk);
            }
        }
    }
    return null;
}
