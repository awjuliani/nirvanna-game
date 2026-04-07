'use strict';
import { G } from './state.js';
import { NPC_WAYPOINTS, HIDING_DEFS } from './constants.js';
import { getDoor, isBlocked } from './utils.js';
import { findPath } from './pathfinding.js';
import { checkDetection } from './vision.js';
import { triggerCaught, triggerSuccess } from './rounds.js';

function tryInteract() {
    // Unhide
    if (G.hidden) { G.hidden = false; return; }
    // Door (tile we're facing)
    const dx = G.px + G.pfx, dy = G.py + G.pfy;
    let door = getDoor(dx, dy);
    if (!door) door = getDoor(G.px, G.py);
    if (door) { door.open = !door.open; return; }
    // Hiding (same tile)
    for (const spot of HIDING_DEFS) {
        if (G.px === spot.x && G.py === spot.y) { G.hidden = true; return; }
    }
}

function isAtExit() {
    return (G.px === 9 || G.px === 10) && G.py === 13;
}

export function executeTurn(input) {
    // Save prev positions for animation lerp
    G.ppx = G.px; G.ppy = G.py;
    G.npc.px = G.npc.x; G.npc.py = G.npc.y;
    for (const g of G.ghosts) { g.px = g.x; g.py = g.y; }

    // Player action
    if (input.type === 'move' && !G.hidden) {
        G.pfx = input.dx; G.pfy = input.dy;
        const nx = G.px + input.dx, ny = G.py + input.dy;
        if (!isBlocked(nx, ny)) { G.px = nx; G.py = ny; }
    } else if (input.type === 'interact') {
        tryInteract();
    }

    // Auto-pickup Orbitz — paradox if player grabs one claimed by a past self
    let paradox = false;
    if (!G.hasOrbitz) {
        for (let i = 0; i < G.orbitzPositions.length; i++) {
            if (G.orbitzPickedUp[i]) continue;
            const orb = G.orbitzPositions[i];
            if (G.px === orb.x && G.py === orb.y) {
                if (G.orbitzCollected[i]) {
                    paradox = true;
                } else {
                    G.hasOrbitz = true;
                    G.currentOrbitzIdx = i;
                    G.orbitzPickedUp[i] = true;
                }
                break;
            }
        }
    }

    // Advance NPC
    G.turnCount++;
    const npc = G.npc;
    if (npc.path.length === 0) {
        npc.waypointIdx = (npc.waypointIdx + 1) % NPC_WAYPOINTS.length;
        const wp = NPC_WAYPOINTS[npc.waypointIdx];
        npc.path = findPath(npc.x, npc.y, wp.x, wp.y) || [];
    }
    if (npc.path.length > 0) {
        const next = npc.path[0];
        const door = getDoor(next.x, next.y);
        if (door && !door.open) {
            door.open = true;
        } else {
            const dfx = next.x - npc.x, dfy = next.y - npc.y;
            if (dfx !== 0 || dfy !== 0) { npc.fx = dfx; npc.fy = dfy; }
            npc.x = next.x; npc.y = next.y;
            npc.path.shift();
        }
    }

    // Advance ghosts
    for (const ghost of G.ghosts) {
        if (G.turnCount < ghost.startTurn) continue;
        if (!ghost.entered) { ghost.entered = true; ghost.active = true; ghost.recIdx = 0; continue; }
        ghost.recIdx++;
        const samples = ghost.recording.samples;
        if (ghost.recIdx >= samples.length) { ghost.active = false; continue; }
        const s = samples[ghost.recIdx];
        ghost.x = s.x; ghost.y = s.y; ghost.fx = s.fx; ghost.fy = s.fy;
    }

    // Ghosts pick up their respective Orbitz when they reach the position
    for (const ghost of G.ghosts) {
        if (!ghost.active || ghost.orbitzIdx < 0) continue;
        if (G.orbitzPickedUp[ghost.orbitzIdx]) continue;
        const orb = G.orbitzPositions[ghost.orbitzIdx];
        if (ghost.x === orb.x && ghost.y === orb.y) {
            G.orbitzPickedUp[ghost.orbitzIdx] = true;
        }
    }

    // Record player position
    G.recSamples.push({x: G.px, y: G.py, fx: G.pfx, fy: G.pfy});

    // Reset animation timer
    G.animTimer = 0;

    // Check detection & exit — defer until animation finishes
    G.pendingCaught = checkDetection() || paradox;
    G.caughtReason = paradox ? 'paradox' : 'seen';
    G.pendingSuccess = !G.pendingCaught && G.hasOrbitz && isAtExit();
}

// ================================================================
// NEXT-TURN PREDICTION (read-only, for FOV preview)
// ================================================================
export function predictNPCNext() {
    const npc = G.npc;
    if (npc.path.length > 0) {
        const next = npc.path[0];
        const door = getDoor(next.x, next.y);
        if (door && !door.open) {
            // Jay spends this turn opening the door, doesn't move
            return {x: npc.x, y: npc.y, fx: npc.fx, fy: npc.fy};
        }
        const dfx = next.x - npc.x, dfy = next.y - npc.y;
        // Facing matches movement direction (same as actual move logic)
        const fx = (dfx !== 0 || dfy !== 0) ? dfx : npc.fx;
        const fy = (dfx !== 0 || dfy !== 0) ? dfy : npc.fy;
        return {x: next.x, y: next.y, fx, fy};
    }
    // Path exhausted — simulate waypoint recalc
    const nextWpIdx = (npc.waypointIdx + 1) % NPC_WAYPOINTS.length;
    const wp = NPC_WAYPOINTS[nextWpIdx];
    const path = findPath(npc.x, npc.y, wp.x, wp.y);
    if (path && path.length > 0) {
        const fx = path[0].x - npc.x, fy = path[0].y - npc.y;
        return {x: path[0].x, y: path[0].y, fx: fx || npc.fx, fy: fy || npc.fy};
    }
    return {x: npc.x, y: npc.y, fx: npc.fx, fy: npc.fy};
}

export function predictGhostNext(ghost) {
    if (!ghost.active) {
        // Check if ghost enters next turn
        if (!ghost.entered && G.turnCount + 1 >= ghost.startTurn) {
            return {x: 9, y: 13, fx: 0, fy: -1}; // entry position
        }
        return null;
    }
    const nextIdx = ghost.recIdx + 1;
    const samples = ghost.recording.samples;
    if (nextIdx >= samples.length) return null; // will deactivate
    const s = samples[nextIdx];
    return {x: s.x, y: s.y, fx: s.fx, fy: s.fy};
}
