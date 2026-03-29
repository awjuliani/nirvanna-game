'use strict';
import { G } from './state.js';

const keyMap = {
    'ArrowUp':'up','ArrowDown':'down','ArrowLeft':'left','ArrowRight':'right',
    'w':'up','s':'down','a':'left','d':'right',
    'W':'up','S':'down','A':'left','D':'right',
    ' ':'space','Enter':'space',
};

window.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
    const k = keyMap[e.key];
    if (!k) return;
    G.keys[k] = true;
    if (k === 'space') G.spaceJust = true;
    if (G.inputQueue.length < 2) {
        if (k === 'space' && !e.repeat) G.inputQueue.push({type:'interact'});
        else if (k === 'up') G.inputQueue.push({type:'move', dx:0, dy:-1});
        else if (k === 'down') G.inputQueue.push({type:'move', dx:0, dy:1});
        else if (k === 'left') G.inputQueue.push({type:'move', dx:-1, dy:0});
        else if (k === 'right') G.inputQueue.push({type:'move', dx:1, dy:0});
    }
});
window.addEventListener('keyup', e => { const k = keyMap[e.key]; if (k) G.keys[k] = false; });

let screenKeyReady = false;
window.addEventListener('keyup', () => { screenKeyReady = true; });

export function consumeScreenKey() {
    if (G.spaceJust) { screenKeyReady = false; return true; }
    if (screenKeyReady) { for (const k of Object.values(G.keys)) if (k) { screenKeyReady = false; return true; } }
    return false;
}
