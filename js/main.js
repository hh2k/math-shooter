import { Game } from './core/Game.js';

const canvas = document.getElementById('game-canvas');
const MARGIN = 40;
const RATIO  = 4 / 3;

function resize() {
  const availW = window.innerWidth  - MARGIN * 2;
  const availH = window.innerHeight - MARGIN * 2;
  let w, h;
  if (availW / availH > RATIO) {
    // constrained by height
    h = availH;
    w = Math.round(h * RATIO);
  } else {
    // constrained by width
    w = availW;
    h = Math.round(w / RATIO);
  }
  canvas.width  = w;
  canvas.height = h;
}
resize();
window.addEventListener('resize', resize);

window.__game = new Game(canvas);
