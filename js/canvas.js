'use strict';
import { T, COLS, ROWS } from './constants.js';

// roundRect polyfill for older browsers
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'number') r = [r];
        const rad = r[0] || 0;
        this.moveTo(x + rad, y);
        this.arcTo(x + w, y, x + w, y + h, rad);
        this.arcTo(x + w, y + h, x, y + h, rad);
        this.arcTo(x, y + h, x, y, rad);
        this.arcTo(x, y, x + w, y, rad);
        this.closePath();
    };
}

export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');
canvas.width = COLS * T;
canvas.height = ROWS * T;

function fitCanvas() {
    const r = canvas.width / canvas.height;
    let w = window.innerWidth, h = window.innerHeight;
    if (w / h > r) w = h * r; else h = w / r;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();
