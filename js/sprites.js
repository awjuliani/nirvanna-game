'use strict';
import { T, COLS, ROWS, MAP, ROOMS, HIDING_DEFS, DOOR_DEFS } from './constants.js';
import { FURNITURE_MAP, DECOR_DEFS } from './constants.js';
import { getRoomAt } from './utils.js';

const sprites = {};
let mapCache = null;
let scanlineOverlay = null;
let vignetteOverlay = null;

// ================================================================
// SPRITE CACHE SYSTEM
// ================================================================
function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
}

function create(name, w, h, fn) {
    const c = makeCanvas(w, h);
    fn(c.getContext('2d'), w, h);
    sprites[name] = c;
}

export function drawSprite(ctx, name, x, y) {
    const s = sprites[name];
    if (s) ctx.drawImage(s, Math.round(x), Math.round(y));
}

export function facingToDir(fx, fy) {
    if (fy < 0) return 'up';
    if (fy > 0) return 'down';
    if (fx < 0) return 'left';
    return 'right';
}

// ================================================================
// DRAWING HELPERS
// ================================================================
function shadow(c, cx, cy, rx, ry) {
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.fill();
}

function rr(c, x, y, w, h, r, color) {
    c.fillStyle = color;
    c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
}

// ================================================================
// MATT SPRITES (Player) — tan fedora, brown blazer, ripped jeans, wild hair
// ================================================================
const HAT = '#c8a878';      // tan/beige fedora
const HAT_DARK = '#b09060'; // hat shadow
const HAT_BAND = '#6a4a2a'; // darker leather band
const BLAZER = '#6a4a30';   // brown blazer
const BLAZER_LT = '#7a5a3a';// blazer highlight
const JEANS = '#7a9abb';    // light distressed denim
const JEANS_RIP = '#c8a882';// skin peeking through rips
const SKIN = '#d4ad82';
const HAIR = '#5a3a1a';     // wild brown hair

function mattDown(c) {
    shadow(c, 16, 28, 7, 2.5);
    // Jeans + rips
    c.fillStyle = JEANS; c.fillRect(11, 22, 4, 5); c.fillRect(17, 22, 4, 5);
    c.fillStyle = JEANS_RIP; c.fillRect(12, 24, 2, 1); c.fillRect(18, 23, 2, 1); // rip peek
    // Shoes
    c.fillStyle = '#444'; c.fillRect(11, 26, 4, 1); c.fillRect(17, 26, 4, 1);
    // Blazer body
    rr(c, 10, 14, 12, 9, 2, BLAZER);
    // Blazer lapels
    c.fillStyle = BLAZER_LT; c.fillRect(11, 14, 3, 5); c.fillRect(18, 14, 3, 5);
    // T-shirt showing under blazer
    c.fillStyle = '#ddd'; c.fillRect(14, 14, 4, 4);
    // Blazer arms
    rr(c, 7, 15, 4, 7, 1, BLAZER); rr(c, 21, 15, 4, 7, 1, BLAZER);
    // Hands
    c.fillStyle = SKIN; c.fillRect(7, 21, 4, 2); c.fillRect(21, 21, 4, 2);
    // Neck
    c.fillStyle = SKIN; c.fillRect(14, 12, 4, 3);
    // Face
    rr(c, 12, 7, 8, 6, 2, SKIN);
    // Eyes
    c.fillStyle = '#111'; c.fillRect(13, 10, 2, 1); c.fillRect(17, 10, 2, 1);
    // Wild hair poking out sides
    c.fillStyle = HAIR;
    c.fillRect(10, 8, 2, 4); c.fillRect(20, 8, 2, 4); // side tufts
    c.fillRect(12, 12, 2, 2); c.fillRect(18, 12, 2, 2); // neck hair
    // Hat brim (tan)
    c.fillStyle = HAT;
    c.beginPath(); c.ellipse(16, 8, 11, 4, 0, 0, Math.PI * 2); c.fill();
    // Hat crown
    rr(c, 10, 1, 12, 8, 2, HAT);
    // Hat top curve
    c.fillStyle = HAT;
    c.beginPath(); c.ellipse(16, 2, 6, 2, 0, 0, Math.PI * 2); c.fill();
    // Hat band
    c.fillStyle = HAT_BAND; c.fillRect(10, 6, 12, 2);
    // Hat dent/shadow
    c.fillStyle = HAT_DARK; c.fillRect(13, 1, 6, 1);
    // Hair tufts poking over hat brim
    c.fillStyle = HAIR;
    c.fillRect(9, 9, 2, 2); c.fillRect(21, 9, 2, 2);
}

function mattUp(c) {
    shadow(c, 16, 28, 7, 2.5);
    c.fillStyle = JEANS; c.fillRect(11, 22, 4, 5); c.fillRect(17, 22, 4, 5);
    c.fillStyle = JEANS_RIP; c.fillRect(13, 24, 1, 1); c.fillRect(19, 25, 1, 1);
    c.fillStyle = '#444'; c.fillRect(11, 26, 4, 1); c.fillRect(17, 26, 4, 1);
    rr(c, 10, 14, 12, 9, 2, BLAZER);
    c.fillStyle = BLAZER_LT; c.fillRect(15, 14, 2, 9); // back seam
    rr(c, 7, 15, 4, 7, 1, BLAZER); rr(c, 21, 15, 4, 7, 1, BLAZER);
    c.fillStyle = SKIN; c.fillRect(7, 21, 4, 2); c.fillRect(21, 21, 4, 2);
    // Back of head
    c.fillStyle = SKIN; c.fillRect(14, 12, 4, 3);
    rr(c, 12, 7, 8, 6, 2, SKIN);
    // Wild hair visible at back & sides
    c.fillStyle = HAIR;
    c.fillRect(10, 8, 2, 5); c.fillRect(20, 8, 2, 5);
    c.fillRect(12, 12, 8, 2); // hair at nape
    // Hat brim
    c.fillStyle = HAT;
    c.beginPath(); c.ellipse(16, 8, 11, 4, 0, 0, Math.PI * 2); c.fill();
    rr(c, 10, 1, 12, 8, 2, HAT);
    c.fillStyle = HAT;
    c.beginPath(); c.ellipse(16, 2, 6, 2, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = HAT_BAND; c.fillRect(10, 6, 12, 2);
    c.fillStyle = HAT_DARK; c.fillRect(13, 1, 6, 1);
    c.fillStyle = HAIR; c.fillRect(9, 9, 2, 2); c.fillRect(21, 9, 2, 2);
}

function mattLeft(c) {
    shadow(c, 16, 28, 7, 2.5);
    // Jeans (staggered)
    c.fillStyle = JEANS; c.fillRect(10, 22, 4, 5); c.fillRect(15, 22, 4, 5);
    c.fillStyle = JEANS_RIP; c.fillRect(11, 24, 2, 1);
    c.fillStyle = '#444'; c.fillRect(10, 26, 4, 1); c.fillRect(15, 26, 4, 1);
    // Blazer body
    rr(c, 11, 14, 10, 9, 2, BLAZER);
    // Lapel (front edge)
    c.fillStyle = BLAZER_LT; c.fillRect(11, 14, 2, 5);
    // T-shirt
    c.fillStyle = '#ddd'; c.fillRect(11, 15, 3, 3);
    // Back arm
    rr(c, 19, 15, 4, 7, 1, BLAZER);
    c.fillStyle = SKIN; c.fillRect(19, 21, 4, 2);
    // Face (side profile)
    rr(c, 11, 7, 7, 6, 2, SKIN);
    c.fillStyle = '#111'; c.fillRect(12, 10, 2, 1); // eye
    c.fillStyle = '#c09070'; c.fillRect(10, 10, 1, 2); // nose
    // Wild hair at back
    c.fillStyle = HAIR;
    c.fillRect(18, 7, 3, 5); c.fillRect(17, 12, 3, 2);
    // Front arm
    rr(c, 8, 15, 4, 7, 1, BLAZER);
    c.fillStyle = SKIN; c.fillRect(8, 21, 4, 2);
    // Hat brim (extends left)
    c.fillStyle = HAT;
    c.beginPath(); c.ellipse(14, 8, 11, 4, 0, 0, Math.PI * 2); c.fill();
    rr(c, 9, 1, 11, 8, 2, HAT);
    c.fillStyle = HAT_BAND; c.fillRect(9, 6, 11, 2);
    c.fillStyle = HAT_DARK; c.fillRect(12, 1, 5, 1);
    // Hair tuft poking out
    c.fillStyle = HAIR; c.fillRect(20, 8, 2, 3);
}

function mattRight(c) {
    shadow(c, 16, 28, 7, 2.5);
    c.fillStyle = JEANS; c.fillRect(13, 22, 4, 5); c.fillRect(18, 22, 4, 5);
    c.fillStyle = JEANS_RIP; c.fillRect(19, 24, 2, 1);
    c.fillStyle = '#444'; c.fillRect(13, 26, 4, 1); c.fillRect(18, 26, 4, 1);
    rr(c, 11, 14, 10, 9, 2, BLAZER);
    c.fillStyle = BLAZER_LT; c.fillRect(19, 14, 2, 5);
    c.fillStyle = '#ddd'; c.fillRect(18, 15, 3, 3);
    rr(c, 9, 15, 4, 7, 1, BLAZER);
    c.fillStyle = SKIN; c.fillRect(9, 21, 4, 2);
    rr(c, 14, 7, 7, 6, 2, SKIN);
    c.fillStyle = '#111'; c.fillRect(18, 10, 2, 1);
    c.fillStyle = '#c09070'; c.fillRect(21, 10, 1, 2);
    c.fillStyle = HAIR;
    c.fillRect(11, 7, 3, 5); c.fillRect(12, 12, 3, 2);
    rr(c, 20, 15, 4, 7, 1, BLAZER);
    c.fillStyle = SKIN; c.fillRect(20, 21, 4, 2);
    c.fillStyle = HAT;
    c.beginPath(); c.ellipse(18, 8, 11, 4, 0, 0, Math.PI * 2); c.fill();
    rr(c, 12, 1, 11, 8, 2, HAT);
    c.fillStyle = HAT_BAND; c.fillRect(12, 6, 11, 2);
    c.fillStyle = HAT_DARK; c.fillRect(15, 1, 5, 1);
    c.fillStyle = HAIR; c.fillRect(10, 8, 2, 3);
}

// ================================================================
// JAY SPRITES (NPC) — no hat, short dark hair, plain casual clothes, stockier
// ================================================================
const JAY_SHIRT = '#4a4a55';  // dark casual shirt/hoodie
const JAY_SHIRT_LT = '#555560';
const JAY_HAIR = '#2a1a0a';  // short dark brown
const JAY_PANTS = '#3a3a44'; // dark pants
const JAY_SKIN = '#d4ad82';

function jayDown(c) {
    shadow(c, 16, 28, 8, 2.5);
    // Pants + shoes
    c.fillStyle = JAY_PANTS; c.fillRect(10, 22, 5, 5); c.fillRect(17, 22, 5, 5);
    c.fillStyle = '#555'; c.fillRect(10, 26, 5, 1); c.fillRect(17, 26, 5, 1);
    // Body (wider, casual shirt/hoodie)
    rr(c, 8, 14, 16, 9, 2, JAY_SHIRT);
    // Shirt detail (subtle collar)
    c.fillStyle = JAY_SHIRT_LT; c.fillRect(13, 14, 6, 2);
    // Arms (thicker)
    rr(c, 5, 15, 5, 7, 1, JAY_SHIRT); rr(c, 22, 15, 5, 7, 1, JAY_SHIRT);
    // Hands
    c.fillStyle = JAY_SKIN; c.fillRect(5, 21, 5, 2); c.fillRect(22, 21, 5, 2);
    // Neck
    c.fillStyle = JAY_SKIN; c.fillRect(13, 11, 6, 4);
    // Face (wider, rounder)
    rr(c, 10, 5, 12, 8, 3, JAY_SKIN);
    // Eyes
    c.fillStyle = '#111'; c.fillRect(12, 8, 2, 2); c.fillRect(18, 8, 2, 2);
    // Mouth
    c.fillStyle = '#b09070'; c.fillRect(14, 11, 4, 1);
    // Light stubble hint (very subtle, not a full beard)
    c.fillStyle = 'rgba(50,30,15,0.15)';
    c.fillRect(11, 10, 10, 3);
    // Short dark hair (neat, not wild like Matt)
    c.fillStyle = JAY_HAIR;
    rr(c, 10, 2, 12, 5, 3, JAY_HAIR);
    // Hair top
    c.beginPath(); c.ellipse(16, 3, 6, 2.5, 0, 0, Math.PI * 2); c.fill();
    // Sideburns
    c.fillRect(10, 5, 2, 3); c.fillRect(20, 5, 2, 3);
}

function jayUp(c) {
    shadow(c, 16, 28, 8, 2.5);
    c.fillStyle = JAY_PANTS; c.fillRect(10, 22, 5, 5); c.fillRect(17, 22, 5, 5);
    c.fillStyle = '#555'; c.fillRect(10, 26, 5, 1); c.fillRect(17, 26, 5, 1);
    rr(c, 8, 14, 16, 9, 2, JAY_SHIRT);
    c.fillStyle = JAY_SHIRT_LT; c.fillRect(15, 14, 2, 9);
    rr(c, 5, 15, 5, 7, 1, JAY_SHIRT); rr(c, 22, 15, 5, 7, 1, JAY_SHIRT);
    c.fillStyle = JAY_SKIN; c.fillRect(5, 21, 5, 2); c.fillRect(22, 21, 5, 2);
    c.fillStyle = JAY_SKIN; c.fillRect(13, 11, 6, 4);
    // Back of head
    rr(c, 10, 5, 12, 8, 3, JAY_SKIN);
    // Hair (back view)
    c.fillStyle = JAY_HAIR;
    rr(c, 10, 2, 12, 7, 3, JAY_HAIR);
    c.beginPath(); c.ellipse(16, 3, 6, 2.5, 0, 0, Math.PI * 2); c.fill();
    c.fillRect(10, 5, 2, 4); c.fillRect(20, 5, 2, 4);
}

function jayLeft(c) {
    shadow(c, 16, 28, 8, 2.5);
    c.fillStyle = JAY_PANTS; c.fillRect(9, 22, 5, 5); c.fillRect(15, 22, 5, 5);
    c.fillStyle = '#555'; c.fillRect(9, 26, 5, 1); c.fillRect(15, 26, 5, 1);
    rr(c, 9, 14, 14, 9, 2, JAY_SHIRT);
    rr(c, 19, 15, 5, 7, 1, JAY_SHIRT);
    c.fillStyle = JAY_SKIN; c.fillRect(19, 21, 5, 2);
    // Face (side)
    rr(c, 10, 5, 10, 8, 3, JAY_SKIN);
    c.fillStyle = '#111'; c.fillRect(12, 8, 2, 2); // eye
    c.fillStyle = '#c09070'; c.fillRect(9, 9, 1, 2); // nose
    c.fillStyle = '#b09070'; c.fillRect(11, 11, 3, 1); // mouth
    // Front arm
    rr(c, 7, 15, 5, 7, 1, JAY_SHIRT);
    c.fillStyle = JAY_SKIN; c.fillRect(7, 21, 5, 2);
    // Hair (side)
    c.fillStyle = JAY_HAIR;
    rr(c, 11, 2, 9, 5, 2, JAY_HAIR);
    c.fillRect(10, 4, 2, 4); // sideburn
    c.fillRect(13, 1, 4, 2); // top
}

function jayRight(c) {
    shadow(c, 16, 28, 8, 2.5);
    c.fillStyle = JAY_PANTS; c.fillRect(12, 22, 5, 5); c.fillRect(18, 22, 5, 5);
    c.fillStyle = '#555'; c.fillRect(12, 26, 5, 1); c.fillRect(18, 26, 5, 1);
    rr(c, 9, 14, 14, 9, 2, JAY_SHIRT);
    rr(c, 8, 15, 5, 7, 1, JAY_SHIRT);
    c.fillStyle = JAY_SKIN; c.fillRect(8, 21, 5, 2);
    rr(c, 12, 5, 10, 8, 3, JAY_SKIN);
    c.fillStyle = '#111'; c.fillRect(18, 8, 2, 2);
    c.fillStyle = '#c09070'; c.fillRect(22, 9, 1, 2);
    c.fillStyle = '#b09070'; c.fillRect(18, 11, 3, 1);
    rr(c, 20, 15, 5, 7, 1, JAY_SHIRT);
    c.fillStyle = JAY_SKIN; c.fillRect(20, 21, 5, 2);
    c.fillStyle = JAY_HAIR;
    rr(c, 12, 2, 9, 5, 2, JAY_HAIR);
    c.fillRect(20, 4, 2, 4);
    c.fillRect(15, 1, 4, 2);
}

// ================================================================
// GHOST SPRITES (teal-washed Matt with scanlines)
// ================================================================
function buildGhostSprite(dir) {
    const src = sprites['matt_' + dir];
    const c = makeCanvas(T, T);
    const gc = c.getContext('2d');
    // Draw Matt
    gc.drawImage(src, 0, 0);
    // Apply teal color wash
    gc.globalCompositeOperation = 'source-atop';
    gc.fillStyle = 'rgba(85, 187, 187, 0.5)';
    gc.fillRect(0, 0, T, T);
    // Add scanline effect
    gc.globalCompositeOperation = 'destination-out';
    gc.fillStyle = 'rgba(0,0,0,0.3)';
    for (let y = 0; y < T; y += 2) {
        gc.fillRect(0, y, T, 1);
    }
    gc.globalCompositeOperation = 'source-over';
    sprites['ghost_' + dir] = c;
}

// ================================================================
// FURNITURE SPRITES
// ================================================================
function drawBedHead(c) {
    const S = T;
    // Floor under bed
    c.fillStyle = '#7a6652'; c.fillRect(0, 0, S, S);
    // Bed frame
    c.fillStyle = '#5a3a20'; c.fillRect(2, 2, S - 4, S - 4);
    // Headboard
    c.fillStyle = '#4a2a18'; c.fillRect(2, 2, S - 4, 6);
    c.fillStyle = '#6a4a30'; c.fillRect(4, 3, S - 8, 4);
    // Pillow
    rr(c, 5, 10, S - 10, 8, 3, '#ddd8cc');
    c.fillStyle = '#c8c0b4'; c.fillRect(6, 11, 3, 6); // pillow wrinkle
    // Blanket edge
    c.fillStyle = '#4466aa'; c.fillRect(4, 20, S - 8, S - 22);
}

function drawBedFoot(c) {
    const S = T;
    c.fillStyle = '#7a6652'; c.fillRect(0, 0, S, S);
    // Bed frame
    c.fillStyle = '#5a3a20'; c.fillRect(2, 0, S - 4, S - 2);
    // Blanket
    c.fillStyle = '#4466aa'; c.fillRect(4, 0, S - 8, S - 6);
    // Blanket texture
    c.fillStyle = '#3a5a9a'; c.fillRect(6, 4, S - 12, 2);
    c.fillRect(6, 12, S - 12, 2); c.fillRect(6, 20, S - 12, 2);
    // Footboard
    c.fillStyle = '#4a2a18'; c.fillRect(2, S - 6, S - 4, 4);
    c.fillStyle = '#6a4a30'; c.fillRect(4, S - 5, S - 8, 2);
}

function drawBathtub(c) {
    const S = T;
    c.fillStyle = '#5a7a7f'; c.fillRect(0, 0, S, S);
    // Tub body
    rr(c, 2, 4, S - 4, S - 6, 4, '#e8e8e8');
    // Tub interior
    rr(c, 4, 6, S - 8, S - 10, 3, '#d0d8dd');
    // Water hint
    c.fillStyle = 'rgba(100,180,200,0.2)'; c.fillRect(5, 12, S - 10, 10);
    // Faucet
    c.fillStyle = '#999'; c.fillRect(14, 4, 4, 3);
    c.fillStyle = '#bbb'; c.fillRect(15, 2, 2, 3);
}

function drawCounter(c) {
    const S = T;
    c.fillStyle = '#8a7a5a'; c.fillRect(0, 0, S, S);
    // Counter top
    rr(c, 1, 2, S - 2, S - 4, 1, '#8a7868');
    // Surface
    c.fillStyle = '#9a8a78'; c.fillRect(2, 3, S - 4, S - 6);
    // Burners
    c.strokeStyle = '#555'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(11, 12, 4, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(21, 12, 4, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(11, 22, 3, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(21, 22, 3, 0, Math.PI * 2); c.stroke();
}

function drawFridge(c) {
    const S = T;
    c.fillStyle = '#8a7a5a'; c.fillRect(0, 0, S, S);
    // Fridge body
    rr(c, 3, 1, S - 6, S - 2, 2, '#c8c8c8');
    // Door split
    c.fillStyle = '#aaa'; c.fillRect(3, 14, S - 6, 2);
    // Handles
    c.fillStyle = '#888';
    c.fillRect(S - 10, 8, 2, 4);
    c.fillRect(S - 10, 19, 2, 5);
    // Top edge highlight
    c.fillStyle = '#ddd'; c.fillRect(4, 2, S - 8, 1);
    // Magnets (fun detail)
    c.fillStyle = '#cc4444'; c.fillRect(8, 5, 3, 3);
    c.fillStyle = '#44aa44'; c.fillRect(14, 7, 2, 2);
}

function drawCouchL(c) {
    const S = T;
    c.fillStyle = '#7a7060'; c.fillRect(0, 0, S, S);
    // Couch base
    rr(c, 0, 4, S, S - 6, 2, '#7a5a3a');
    // Seat cushion
    rr(c, 2, 6, S - 2, S - 10, 3, '#8a6a4a');
    // Back cushion
    rr(c, 2, 2, S - 2, 8, 2, '#6a4a2a');
    // Arm rest (left)
    rr(c, 0, 2, 6, S - 4, 2, '#6a4a2a');
    // Cushion line
    c.fillStyle = '#5a3a1a'; c.fillRect(S - 2, 6, 1, S - 10);
}

function drawCouchR(c) {
    const S = T;
    c.fillStyle = '#7a7060'; c.fillRect(0, 0, S, S);
    rr(c, 0, 4, S, S - 6, 2, '#7a5a3a');
    rr(c, 0, 6, S - 2, S - 10, 3, '#8a6a4a');
    rr(c, 0, 2, S - 2, 8, 2, '#6a4a2a');
    // Arm rest (right)
    rr(c, S - 6, 2, 6, S - 4, 2, '#6a4a2a');
    c.fillStyle = '#5a3a1a'; c.fillRect(1, 6, 1, S - 10);
}

function drawTVStand(c) {
    const S = T;
    c.fillStyle = '#7a7060'; c.fillRect(0, 0, S, S);
    // Stand
    rr(c, 4, 16, S - 8, S - 18, 1, '#4a3a2a');
    // TV body
    rr(c, 2, 2, S - 4, 16, 2, '#222');
    // Screen
    c.fillStyle = '#0a0a2a'; c.fillRect(4, 4, S - 8, 11);
    // Screen glow
    c.fillStyle = 'rgba(50,80,120,0.3)'; c.fillRect(5, 5, S - 10, 9);
    // Power LED
    c.fillStyle = '#ff0000'; c.fillRect(S - 7, 17, 2, 1);
    // Antenna (rabbit ears)
    c.strokeStyle = '#666'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(12, 4); c.lineTo(8, 0); c.stroke();
    c.beginPath(); c.moveTo(20, 4); c.lineTo(24, 0); c.stroke();
}

// ================================================================
// DECOR SPRITES
// ================================================================
function drawGuitar(c) {
    c.fillStyle = '#3a2a1a';
    rr(c, 6, 2, 20, T - 4, 3, '#2a1a0a'); // case
    c.fillStyle = '#4a3a2a'; c.fillRect(8, 4, 16, T - 8); // case lighter area
    // Latches
    c.fillStyle = '#888'; c.fillRect(10, 14, 3, 2); c.fillRect(19, 14, 3, 2);
    // Handle
    c.fillStyle = '#555'; c.fillRect(13, 1, 6, 3);
}

function drawAmp(c) {
    rr(c, 6, 6, 20, 20, 2, '#1a1a1a'); // body
    // Speaker mesh
    c.fillStyle = '#2a2a2a';
    for (let y = 10; y < 24; y += 2) c.fillRect(8, y, 16, 1);
    // Knobs
    c.fillStyle = '#666';
    c.beginPath(); c.arc(12, 8, 2, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(20, 8, 2, 0, Math.PI * 2); c.fill();
    // Power light
    c.fillStyle = '#ff3300'; c.fillRect(15, 7, 2, 2);
}

function drawPizza(c) {
    // Box
    rr(c, 8, 10, 18, 16, 1, '#d4a050');
    c.fillStyle = '#c09040'; c.fillRect(9, 11, 16, 14);
    // Grease stain
    c.fillStyle = 'rgba(160,120,60,0.4)';
    c.beginPath(); c.arc(17, 18, 4, 0, Math.PI * 2); c.fill();
    // Logo circle
    c.strokeStyle = '#cc3333'; c.lineWidth = 1;
    c.beginPath(); c.arc(17, 17, 3, 0, Math.PI * 2); c.stroke();
}

function drawRecords(c) {
    // Stack of vinyl records
    c.fillStyle = '#111';
    c.beginPath(); c.ellipse(16, 18, 10, 6, -0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#222';
    c.beginPath(); c.ellipse(16, 16, 10, 6, 0.1, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1a1a1a';
    c.beginPath(); c.ellipse(15, 14, 10, 6, 0, 0, Math.PI * 2); c.fill();
    // Label
    c.fillStyle = '#aa3333';
    c.beginPath(); c.ellipse(15, 14, 3, 2, 0, 0, Math.PI * 2); c.fill();
    // Album sleeve peeking out
    c.fillStyle = '#ddd';
    c.fillRect(2, 10, 4, 12);
}

function drawShoes(c) {
    // Pair of sneakers
    c.fillStyle = '#ddd';
    rr(c, 4, 14, 10, 14, 2, '#ddd'); // left shoe
    c.fillStyle = '#ccc';
    rr(c, 16, 16, 10, 12, 2, '#ccc'); // right shoe (slightly offset)
    // Soles
    c.fillStyle = '#555';
    c.fillRect(4, 26, 10, 2); c.fillRect(16, 26, 10, 2);
    // Laces
    c.fillStyle = '#888';
    c.fillRect(7, 16, 4, 1); c.fillRect(7, 19, 4, 1);
    c.fillRect(19, 18, 4, 1); c.fillRect(19, 21, 4, 1);
}

// ================================================================
// MAP CACHE BUILDER
// ================================================================
function isExteriorWall(x, y) {
    return x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1;
}

function hasFloorNeighbor(x, y) {
    const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
    for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && MAP[ny][nx] === 0) return true;
    }
    return false;
}

function drawWallTile(mc, x, y) {
    const sx = x * T, sy = y * T;

    if (isExteriorWall(x, y) || !hasFloorNeighbor(x, y)) {
        // Brick wall
        mc.fillStyle = '#2e1c12'; mc.fillRect(sx, sy, T, T);
        const colors = ['#3a2418', '#332010', '#2e1c12', '#36200e'];
        for (let by = 0; by < T; by += 4) {
            const offset = (Math.floor(by / 4) % 2) * 6;
            for (let bx = 0; bx < T; bx += 12) {
                const ci = ((x * 7 + y * 13 + bx + by) % colors.length);
                mc.fillStyle = colors[ci];
                mc.fillRect(sx + bx + offset, sy + by, 11, 3);
            }
        }
        // Mortar lines
        mc.fillStyle = 'rgba(0,0,0,0.15)';
        for (let by = 0; by < T; by += 4) mc.fillRect(sx, sy + by + 3, T, 1);
    } else {
        // Interior wall / divider (drywall)
        mc.fillStyle = '#7a6a58'; mc.fillRect(sx, sy, T, T);
        // Baseboard hint
        mc.fillStyle = '#5a4a38'; mc.fillRect(sx, sy + T - 3, T, 3);
        // Subtle panel line
        mc.fillStyle = 'rgba(0,0,0,0.06)'; mc.fillRect(sx + T / 2, sy, 1, T);
        // Top edge
        mc.fillStyle = '#8a7a68'; mc.fillRect(sx, sy, T, 2);
    }
}

function drawFloorTile(mc, x, y, room) {
    const sx = x * T, sy = y * T;
    const base = room ? room.floor : '#6a6a62';

    if (!room || room.name === 'Entry') {
        // Generic floor
        mc.fillStyle = base; mc.fillRect(sx, sy, T, T);
        mc.strokeStyle = 'rgba(0,0,0,0.08)'; mc.strokeRect(sx, sy, T, T);
        return;
    }

    mc.fillStyle = base; mc.fillRect(sx, sy, T, T);

    if (room.name === 'Bedroom' || room.name === 'Living Room' || room.name === 'Closet') {
        // Hardwood planks
        const c1 = base;
        // Darken slightly for alternate planks
        mc.fillStyle = 'rgba(0,0,0,0.06)';
        for (let py = 0; py < T; py += 8) {
            if ((Math.floor(py / 8) + x) % 2 === 0) mc.fillRect(sx, sy + py, T, 8);
        }
        // Plank gap lines
        mc.fillStyle = 'rgba(0,0,0,0.12)';
        for (let py = 0; py < T; py += 8) mc.fillRect(sx, sy + py, T, 1);
        // Vertical board edges (staggered)
        const offset = (y % 2) * 16;
        mc.fillRect(sx + offset, sy, 1, T);
        if (offset + 16 < T) mc.fillRect(sx + offset + 16, sy, 1, T);
    } else if (room.name === 'Bathroom' || room.name === 'Kitchen') {
        // Tile checkerboard
        const tileSize = 8;
        for (let ty = 0; ty < T; ty += tileSize) {
            for (let tx = 0; tx < T; tx += tileSize) {
                if ((Math.floor(tx / tileSize) + Math.floor(ty / tileSize) + x + y) % 2 === 0) {
                    mc.fillStyle = 'rgba(255,255,255,0.06)';
                } else {
                    mc.fillStyle = 'rgba(0,0,0,0.04)';
                }
                mc.fillRect(sx + tx, sy + ty, tileSize, tileSize);
            }
        }
        // Grout lines
        mc.fillStyle = 'rgba(0,0,0,0.1)';
        for (let ty = 0; ty < T; ty += tileSize) mc.fillRect(sx, sy + ty, T, 1);
        for (let tx = 0; tx < T; tx += tileSize) mc.fillRect(sx + tx, sy, 1, T);
    } else if (room.name === 'Hallway') {
        // Carpet with speckle noise
        const seed = x * 31 + y * 17;
        for (let i = 0; i < 12; i++) {
            const px = ((seed * (i + 1) * 7) % T);
            const py = ((seed * (i + 1) * 13) % T);
            mc.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
            mc.fillRect(sx + (px % T), sy + (py % T), 1, 1);
        }
    }
}

function drawFurnitureTile(mc, x, y) {
    const key = x + ',' + y;
    const type = FURNITURE_MAP[key];
    if (!type) {
        // Fallback: generic brown furniture block
        const room = getRoomAt(x, y);
        mc.fillStyle = room ? room.floor : '#6a6a62'; mc.fillRect(x * T, y * T, T, T);
        mc.fillStyle = '#4a3828'; mc.fillRect(x * T + 3, y * T + 3, T - 6, T - 6);
        mc.fillStyle = '#5a4838'; mc.fillRect(x * T + 5, y * T + 5, T - 10, T - 10);
        return;
    }
    // Draw from cached sprite
    const sName = 'furn_' + type;
    if (sprites[sName]) mc.drawImage(sprites[sName], x * T, y * T);
}

function drawDecorItems(mc) {
    for (const d of DECOR_DEFS) {
        const sName = 'decor_' + d.type;
        if (sprites[sName]) mc.drawImage(sprites[sName], d.x * T, d.y * T);
    }
}

export function rebuildMapCache() {
    if (!mapCache) {
        mapCache = makeCanvas(COLS * T, ROWS * T);
    }
    const mc = mapCache.getContext('2d');
    mc.clearRect(0, 0, COLS * T, ROWS * T);

    // Draw all tiles
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const tile = MAP[y][x];
            if (tile === 1) {
                drawWallTile(mc, x, y);
            } else if (tile === 2) {
                drawFurnitureTile(mc, x, y);
            } else {
                const room = getRoomAt(x, y);
                drawFloorTile(mc, x, y, room);
            }
        }
    }

    // Wall shadow edges (depth where wall meets floor)
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (MAP[y][x] !== 1) continue;
            // Shadow on south side
            if (y + 1 < ROWS && MAP[y + 1][x] !== 1) {
                mc.fillStyle = 'rgba(0,0,0,0.2)';
                mc.fillRect(x * T, (y + 1) * T, T, 3);
            }
            // Shadow on east side
            if (x + 1 < COLS && MAP[y][x + 1] !== 1) {
                mc.fillStyle = 'rgba(0,0,0,0.1)';
                mc.fillRect((x + 1) * T, y * T, 2, T);
            }
        }
    }

    // Decor items
    drawDecorItems(mc);

    // Room name labels
    mc.font = '9px monospace'; mc.textAlign = 'center';
    mc.fillStyle = 'rgba(255,255,255,0.15)';
    for (const r of ROOMS) {
        mc.fillText(r.name, ((r.x1 + r.x2) / 2 + 0.5) * T, ((r.y1 + r.y2) / 2 + 0.5) * T);
    }
}

export function getMapCache() { return mapCache; }

// ================================================================
// VHS OVERLAYS
// ================================================================
function buildScanlines() {
    scanlineOverlay = makeCanvas(COLS * T, ROWS * T);
    const sc = scanlineOverlay.getContext('2d');
    sc.fillStyle = 'rgba(0,0,0,0.07)';
    for (let y = 0; y < ROWS * T; y += 2) {
        sc.fillRect(0, y, COLS * T, 1);
    }
}

function buildVignette() {
    const W = COLS * T, H = ROWS * T;
    vignetteOverlay = makeCanvas(W, H);
    const vc = vignetteOverlay.getContext('2d');
    const grad = vc.createRadialGradient(W / 2, H / 2, W * 0.28, W / 2, H / 2, W * 0.72);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.35)');
    vc.fillStyle = grad;
    vc.fillRect(0, 0, W, H);
}

export function getScanlines() { return scanlineOverlay; }
export function getVignette() { return vignetteOverlay; }

// ================================================================
// PORTRAIT SPRITES (for dialogue screens)
// ================================================================
function drawMattPortrait(c, w, h) {
    c.fillStyle = '#0a0a1a'; c.fillRect(0, 0, w, h);
    // Wild hair poking out
    c.fillStyle = HAIR;
    c.fillRect(w * 0.15, h * 0.35, w * 0.12, h * 0.15);
    c.fillRect(w * 0.73, h * 0.35, w * 0.12, h * 0.15);
    // Hat brim (tan)
    c.fillStyle = HAT;
    c.beginPath(); c.ellipse(w / 2, h * 0.38, w * 0.45, h * 0.14, 0, 0, Math.PI * 2); c.fill();
    // Hat crown
    rr(c, w * 0.2, h * 0.08, w * 0.6, h * 0.33, 4, HAT);
    c.fillStyle = HAT_BAND; c.fillRect(w * 0.2, h * 0.31, w * 0.6, 4);
    c.fillStyle = HAT_DARK; c.fillRect(w * 0.35, h * 0.08, w * 0.3, 2);
    // Face
    rr(c, w * 0.3, h * 0.42, w * 0.4, h * 0.18, 3, SKIN);
    // Eyes
    c.fillStyle = '#111';
    c.fillRect(w * 0.35, h * 0.48, 3, 2); c.fillRect(w * 0.56, h * 0.48, 3, 2);
    // Brown blazer body
    rr(c, w * 0.22, h * 0.6, w * 0.56, h * 0.38, 3, BLAZER);
    // White t-shirt peeking
    c.fillStyle = '#ddd'; c.fillRect(w * 0.38, h * 0.6, w * 0.24, h * 0.1);
    // Lapels
    c.fillStyle = BLAZER_LT;
    c.fillRect(w * 0.24, h * 0.6, w * 0.12, h * 0.2);
    c.fillRect(w * 0.64, h * 0.6, w * 0.12, h * 0.2);
}

function drawJayPortrait(c, w, h) {
    c.fillStyle = '#0a0a1a'; c.fillRect(0, 0, w, h);
    // Short dark hair
    c.fillStyle = JAY_HAIR;
    rr(c, w * 0.22, h * 0.1, w * 0.56, h * 0.22, 6, JAY_HAIR);
    c.beginPath(); c.ellipse(w / 2, h * 0.12, w * 0.25, h * 0.08, 0, 0, Math.PI * 2); c.fill();
    // Sideburns
    c.fillRect(w * 0.2, h * 0.22, w * 0.08, h * 0.12);
    c.fillRect(w * 0.72, h * 0.22, w * 0.08, h * 0.12);
    // Face (rounder, wider)
    rr(c, w * 0.22, h * 0.22, w * 0.56, h * 0.35, 6, JAY_SKIN);
    // Eyes
    c.fillStyle = '#111';
    c.fillRect(w * 0.32, h * 0.35, 3, 3); c.fillRect(w * 0.58, h * 0.35, 3, 3);
    // Mouth
    c.fillStyle = '#b09070'; c.fillRect(w * 0.4, h * 0.48, w * 0.2, 2);
    // Subtle stubble
    c.fillStyle = 'rgba(50,30,15,0.12)';
    c.fillRect(w * 0.28, h * 0.44, w * 0.44, h * 0.1);
    // Dark casual shirt body
    rr(c, w * 0.18, h * 0.58, w * 0.64, h * 0.4, 3, JAY_SHIRT);
    // Collar
    c.fillStyle = JAY_SHIRT_LT; c.fillRect(w * 0.36, h * 0.58, w * 0.28, h * 0.06);
}

// ================================================================
// HIDING SPOT SPRITES
// ================================================================
function drawHidingBed(c) {
    // Dark gap under bed
    c.fillStyle = '#7a6652'; c.fillRect(0, 0, T, T);
    c.fillStyle = '#1a1008'; c.fillRect(2, 4, T - 4, T - 8);
    // Bed frame edges visible
    c.fillStyle = '#5a3a20'; c.fillRect(2, 2, T - 4, 3); c.fillRect(2, T - 5, T - 4, 3);
    // Subtle eyes peeking
    c.fillStyle = '#ffffff';
    c.fillRect(12, 14, 2, 2); c.fillRect(18, 14, 2, 2);
    c.fillStyle = '#111';
    c.fillRect(13, 14, 1, 1); c.fillRect(19, 14, 1, 1);
}

function drawHidingCloset(c) {
    c.fillStyle = '#55554a'; c.fillRect(0, 0, T, T);
    // Closet door (ajar)
    c.fillStyle = '#5a4030'; c.fillRect(2, 0, T - 6, T);
    c.fillStyle = '#3a2a18'; c.fillRect(T - 8, 0, 6, T);
    // Darkness inside
    c.fillStyle = '#0a0808'; c.fillRect(T - 7, 2, 4, T - 4);
    // Hanging clothes visible
    c.fillStyle = '#333'; c.fillRect(T - 6, 4, 2, 6);
    c.fillStyle = '#446'; c.fillRect(T - 6, 12, 2, 6);
    // Eyes
    c.fillStyle = '#fff'; c.fillRect(T - 5, 20, 2, 2); c.fillRect(T - 5, 24, 2, 2);
    c.fillStyle = '#111'; c.fillRect(T - 4, 20, 1, 1); c.fillRect(T - 4, 24, 1, 1);
}

function drawHidingCouch(c) {
    c.fillStyle = '#7a7060'; c.fillRect(0, 0, T, T);
    // Couch back
    c.fillStyle = '#6a4a2a'; c.fillRect(0, 0, T, 10);
    // Gap behind couch
    c.fillStyle = '#1a1208'; c.fillRect(2, 10, T - 4, T - 12);
    // Eyes peeking over couch
    c.fillStyle = '#fff'; c.fillRect(12, 6, 2, 2); c.fillRect(18, 6, 2, 2);
    c.fillStyle = '#111'; c.fillRect(13, 6, 1, 1); c.fillRect(19, 6, 1, 1);
}

function drawHidingShower(c) {
    c.fillStyle = '#5a7a7f'; c.fillRect(0, 0, T, T);
    // Shower curtain
    c.fillStyle = '#d8d0c4';
    c.fillRect(0, 0, T, T);
    // Curtain folds
    for (let x = 0; x < T; x += 6) {
        c.fillStyle = x % 12 === 0 ? '#c8c0b4' : '#e0d8cc';
        c.fillRect(x, 0, 6, T);
    }
    // Curtain rod
    c.fillStyle = '#aaa'; c.fillRect(0, 0, T, 2);
    // Rings
    c.fillStyle = '#ccc';
    for (let x = 3; x < T; x += 8) {
        c.beginPath(); c.arc(x, 2, 2, 0, Math.PI * 2); c.fill();
    }
    // Gap showing darkness + eyes
    c.fillStyle = '#1a2a2e'; c.fillRect(T - 8, 4, 6, T - 6);
    c.fillStyle = '#fff'; c.fillRect(T - 6, 12, 2, 2); c.fillRect(T - 6, 16, 2, 2);
    c.fillStyle = '#111'; c.fillRect(T - 5, 12, 1, 1); c.fillRect(T - 5, 16, 1, 1);
}

// ================================================================
// INIT
// ================================================================
export function initSprites() {
    // Matt (4 directions)
    create('matt_down', T, T, (c) => mattDown(c));
    create('matt_up', T, T, (c) => mattUp(c));
    create('matt_left', T, T, (c) => mattLeft(c));
    create('matt_right', T, T, (c) => mattRight(c));

    // Jay (4 directions)
    create('jay_down', T, T, (c) => jayDown(c));
    create('jay_up', T, T, (c) => jayUp(c));
    create('jay_left', T, T, (c) => jayLeft(c));
    create('jay_right', T, T, (c) => jayRight(c));

    // Ghosts (derived from Matt)
    ['down', 'up', 'left', 'right'].forEach(buildGhostSprite);

    // Furniture
    create('furn_bed_head', T, T, drawBedHead);
    create('furn_bed_foot', T, T, drawBedFoot);
    create('furn_bathtub', T, T, drawBathtub);
    create('furn_counter', T, T, drawCounter);
    create('furn_fridge', T, T, drawFridge);
    create('furn_couch_l', T, T, drawCouchL);
    create('furn_couch_r', T, T, drawCouchR);
    create('furn_tv_stand', T, T, drawTVStand);

    // Decor
    create('decor_guitar', T, T, drawGuitar);
    create('decor_amp', T, T, drawAmp);
    create('decor_pizza', T, T, drawPizza);
    create('decor_records', T, T, drawRecords);
    create('decor_shoes', T, T, drawShoes);

    // Hiding spots
    create('hiding_bed', T, T, drawHidingBed);
    create('hiding_closet', T, T, drawHidingCloset);
    create('hiding_couch', T, T, drawHidingCouch);
    create('hiding_shower', T, T, drawHidingShower);

    // Portraits (64x64 for dialogue)
    create('portrait_matt', 64, 64, (c) => drawMattPortrait(c, 64, 64));
    create('portrait_jay', 64, 64, (c) => drawJayPortrait(c, 64, 64));

    // VHS overlays
    buildScanlines();
    buildVignette();
}
