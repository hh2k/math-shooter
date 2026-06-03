import { GameLoop } from './GameLoop.js';
import { InputManager } from './InputManager.js';
import { EventBus } from './EventBus.js';
import { GameScreen } from '../screens/GameScreen.js';
import { getLevel, MAX_LEVEL } from '../math/DifficultyConfig.js';

const HS_KEY = 'mathshooter_highscore';

export class Game {
  constructor(canvas) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._input = new InputManager(canvas);
    this._loop = new GameLoop(
      delta => this._update(delta),
      () => this._render()
    );
    this._screen = null;

    // Session state persisted across levels
    this._currentLevel = 1;
    this._lives = 3;
    this._score = 0;
    this._streak = 0;

    this._menuEl      = document.getElementById('screen-menu');
    this._lcEl        = document.getElementById('screen-levelcomplete');
    this._winEl       = document.getElementById('screen-win');
    this._gameoverEl  = document.getElementById('screen-gameover');
    this._unlockEl    = document.getElementById('screen-unlock');

    document.getElementById('btn-play').addEventListener('click', () => this._startRun());
    document.getElementById('btn-next-level').addEventListener('click', () => this._nextLevel());
    document.getElementById('btn-unlock-go').addEventListener('click', () => this._beginLevel());
    document.getElementById('btn-play-again').addEventListener('click', () => this._startRun());
    document.getElementById('btn-win-menu').addEventListener('click', () => this.showMenu());
    document.getElementById('btn-replay').addEventListener('click', () => this._startRun());
    document.getElementById('btn-menu').addEventListener('click', () => this.showMenu());

    this._updateMenuHighscore();
    this._loop.start();
  }

  // ── Public ────────────────────────────────────────────────

  showMenu() {
    this._hideAll();
    this._menuEl.classList.remove('hidden');
    this._destroyScreen();
    this._clearCanvas();
    this._updateMenuHighscore();
  }

  // ── Private ───────────────────────────────────────────────

  _startRun() {
    this._currentLevel = 1;
    this._lives = 3;
    this._score = 0;
    this._streak = 0;
    this._beginLevel();
  }

  _beginLevel() {
    this._hideAll();
    EventBus.clear();
    this._destroyScreen();
    const cfg = getLevel(this._currentLevel);
    this._screen = new GameScreen(
      this._ctx, this._input, cfg,
      this._lives, this._score, this._streak,
      stats => this._onLevelComplete(stats),
      score  => this._onGameOver(score)
    );
  }

  _nextLevel() {
    this._currentLevel++;
    const cfg = getLevel(this._currentLevel);
    if (cfg.unlockMessage) {
      this._showUnlock(cfg);
    } else {
      this._beginLevel();
    }
  }

  _showUnlock(cfg) {
    this._hideAll();
    const opLabels = { '+': 'Addition', '-': 'Subtraction', '×': 'Multiplication', '÷': 'Division' };
    const newOp = cfg.ops[cfg.ops.length - 1];
    document.getElementById('unlock-title').textContent = opLabels[newOp] || cfg.unlockMessage;
    document.getElementById('unlock-subtitle').textContent = `Level ${cfg.level} — ${cfg.unlockMessage}`;
    this._unlockEl.classList.remove('hidden');
  }

  _onLevelComplete({ level, score, lives, streak, stars }) {
    this._score = score;
    this._lives = lives;
    this._streak = streak;
    this._destroyScreen();

    if (level >= MAX_LEVEL) {
      this._showWin();
      return;
    }

    this._hideAll();
    document.getElementById('lc-title').textContent = `Level ${level} Complete!`;
    document.getElementById('lc-score').textContent = `Score: ${score}`;
    this._renderStars('lc-stars', stars);
    this._lcEl.classList.remove('hidden');
  }

  _onGameOver(score) {
    this._score = score;
    this._destroyScreen();
    const hs = this._updateHighscore(score);
    this._hideAll();
    document.getElementById('final-score').textContent = `Score: ${score}`;
    document.getElementById('gameover-highscore').textContent =
      score >= hs ? '★ New High Score!' : `Best: ${hs}`;
    this._gameoverEl.classList.remove('hidden');
  }

  _showWin() {
    const hs = this._updateHighscore(this._score);
    this._hideAll();
    document.getElementById('win-score').textContent = `Score: ${this._score}`;
    document.getElementById('win-highscore').textContent =
      this._score >= hs ? '★ New High Score!' : `Best: ${hs}`;
    this._winEl.classList.remove('hidden');
  }

  _renderStars(containerId, count) {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
      const span = document.createElement('span');
      span.textContent = '★';
      span.className = i <= count ? 'star-filled' : 'star-empty';
      el.appendChild(span);
    }
  }

  _updateHighscore(score) {
    const prev = parseInt(localStorage.getItem(HS_KEY) || '0', 10);
    const best = Math.max(prev, score);
    localStorage.setItem(HS_KEY, best);
    return best;
  }

  _updateMenuHighscore() {
    const hs = parseInt(localStorage.getItem(HS_KEY) || '0', 10);
    document.getElementById('menu-highscore').textContent =
      hs > 0 ? `Best: ${hs}` : '';
  }

  _hideAll() {
    [this._menuEl, this._lcEl, this._winEl, this._gameoverEl, this._unlockEl]
      .forEach(el => el.classList.add('hidden'));
  }

  _destroyScreen() {
    this._screen?.destroy?.();
    this._screen = null;
  }

  _update(delta) { this._screen?.update(delta); }
  _render()      { if (this._screen) this._screen.render(); }
  _clearCanvas() { this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height); }
}
