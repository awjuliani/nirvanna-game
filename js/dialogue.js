'use strict';
import { G } from './state.js';

export function generateDialogue() {
    if (G.round <= 1) return null;
    const n = G.recordings.length;
    const pool = [
        ["Matt: There's another one of me in there.", "Jay: YOU'RE another one of you, Matt."],
        ["Jay: How many of you are there now?", "Matt: " + (n+1) + ". Plus the original me.", "Jay: This is getting out of hand."],
        ["Matt: I keep almost bumping into myself.", "Jay: That's literally the whole problem."],
        ["Jay: Maybe go faster this time?", "Matt: Then future-me has less to dodge. Smart."],
        ["Matt: What if I just stand still?", "Jay: Then THAT becomes a ghost too.", "Matt: ...right."],
        ["Jay: Do something you'd never do.", "Matt: Everything I do becomes something I did!"],
        ["Matt: I'm running out of new routes.", "Jay: Then make this one count."],
    ];
    if (n >= 3) pool.push(["Matt: It's getting crowded in there.", "Jay: It's all you, Matt. It's always been you."]);
    if (n >= 5) pool.push(["Jay: " + (n+1) + " versions of you in one apartment.", "Matt: At least we all have good taste in hats."]);
    return pool[Math.floor(Math.random() * pool.length)];
}
