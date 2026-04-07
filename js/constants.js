'use strict';

// Tile & grid
export const T = 32, COLS = 20, ROWS = 15;

// Timing & visuals
export const ANIM_TIME = 0.1;          // seconds for move animation lerp
export const VIEW_SCALE = 2.0;
export const GHOST_ENTRY_DELAY = 10;   // ticks between each ghost entering
export const TOTAL_ORBITZ = 8;         // bottles to steal across all rounds

// NPC patrol waypoints
export const NPC_WAYPOINTS = [
    {x:4,y:2},{x:15,y:2},{x:12,y:10},{x:7,y:3},
];

// MAP (0=floor, 1=wall, 2=furniture)
export const MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,2,2,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,1,0,2,0,0,0,0,2,0,0,2,0,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,1],
    [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export const ROOMS = [
    {name:'Bedroom',    x1:1,y1:1,x2:5,y2:4, floor:'#7a6652'},
    {name:'Bathroom',   x1:7,y1:1,x2:9,y2:4, floor:'#5a7a7f'},
    {name:'Kitchen',    x1:11,y1:1,x2:18,y2:4,floor:'#8a7a5a'},
    {name:'Hallway',    x1:1,y1:6,x2:18,y2:7, floor:'#6a6a62'},
    {name:'Closet',     x1:1,y1:9,x2:3,y2:11, floor:'#55554a'},
    {name:'Living Room',x1:5,y1:9,x2:18,y2:12,floor:'#7a7060'},
    {name:'Entry',      x1:9,y1:13,x2:10,y2:13,floor:'#6a6a62'},
];

export const DOOR_DEFS = [
    {x:6,y:2,id:'bed_bath'},{x:10,y:3,id:'bath_kit'},
    {x:2,y:5,id:'bed_hall'},{x:8,y:5,id:'bath_hall'},{x:15,y:5,id:'kit_hall'},
    {x:2,y:8,id:'closet_hall'},{x:6,y:8,id:'liv_hall_L'},{x:16,y:8,id:'liv_hall_R'},
    {x:4,y:10,id:'closet_liv'},
];

export const HIDING_DEFS = [
    {x:4,y:3,id:'bed',name:'Under Bed'},
    {x:1,y:10,id:'closet',name:'In Closet'},
    {x:9,y:11,id:'couch',name:'Behind Couch'},
    {x:7,y:4,id:'shower',name:'In Shower'},
];

// Furniture types mapped by position
export const FURNITURE_MAP = {
    '2,2': 'bed_head', '3,2': 'bed_foot',       // Bedroom
    '8,3': 'bathtub',                             // Bathroom
    '13,3': 'counter', '16,3': 'fridge',         // Kitchen
    '10,10': 'couch_l', '11,10': 'couch_r',     // Living Room
    '15,11': 'tv_stand',                          // Living Room
};

// Non-blocking floor decorations
export const DECOR_DEFS = [
    {x:8, y:10, type:'guitar'},     // Living Room
    {x:7, y:10, type:'amp'},        // Living Room
    {x:14, y:10, type:'pizza'},     // Living Room
    {x:17, y:9, type:'records'},    // Living Room
    {x:13, y:11, type:'shoes'},     // Living Room
];

// Pre-computed valid Orbitz spawn positions
export const ORBITZ_CANDIDATES = [];
for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (MAP[y][x] !== 0) continue;
    if (x >= 8 && x <= 11 && y >= 12) continue;
    if (DOOR_DEFS.some(d => d.x === x && d.y === y)) continue;
    if (HIDING_DEFS.some(h => h.x === x && h.y === y)) continue;
    if (DECOR_DEFS.some(d => d.x === x && d.y === y)) continue;
    ORBITZ_CANDIDATES.push({x, y});
}

export function pickOrbitzPos() {
    return ORBITZ_CANDIDATES[Math.floor(Math.random() * ORBITZ_CANDIDATES.length)];
}

export function pickMultipleOrbitzPos(n) {
    const positions = [];
    const available = [...ORBITZ_CANDIDATES];
    for (let i = 0; i < n && available.length > 0; i++) {
        const idx = Math.floor(Math.random() * available.length);
        positions.push(available[idx]);
        available.splice(idx, 1);
    }
    return positions;
}
