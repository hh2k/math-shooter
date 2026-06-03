import { GameLoop }       from './GameLoop.js';
import { InputManager }   from './InputManager.js';
import { EventBus }       from './EventBus.js';
import { AudioManager }   from './AudioManager.js';
import { Settings }       from './Settings.js';
import { Progress } from './Progress.js';
import { GameScreen }     from '../screens/GameScreen.js';
import { getLevel, getEndlessLevel, MAX_LEVEL } from '../math/DifficultyConfig.js';

const DAILY_DATE_FN = () => new Date().toISOString().slice(0, 10);

export class Game {
  constructor(canvas) {
    this._canvas = canvas;
    this._ctx    = canvas.getContext('2d');
    this._input  = new InputManager(canvas);
    this._loop   = new GameLoop(
      delta => this._update(delta),
      ()    => this._render()
    );
    this._screen = null;

    // Session state
    this._currentLevel = 1;
    this._lives  = 3;
    this._score  = 0;
    this._streak = 0;
    this._mode   = 'normal'; // 'normal' | 'endless' | 'daily'
    this._isDaily = false;

    // Progress
    this._progress = Progress.load();

    // Screen elements
    this._menuEl     = document.getElementById('screen-menu');
    this._lcEl       = document.getElementById('screen-levelcomplete');
    this._winEl      = document.getElementById('screen-win');
    this._gameoverEl = document.getElementById('screen-gameover');
    this._unlockEl   = document.getElementById('screen-unlock');
    this._lsEl       = document.getElementById('screen-levelselect');
    this._settingsEl = document.getElementById('screen-settings');

    // Existing buttons
    document.getElementById('btn-play').addEventListener('click', () => this._startRun());
    document.getElementById('btn-next-level').addEventListener('click', () => this._nextLevel());
    document.getElementById('btn-unlock-go').addEventListener('click', () => this._beginLevel());
    document.getElementById('btn-play-again').addEventListener('click', () => this._startRun());
    document.getElementById('btn-win-menu').addEventListener('click', () => this.showMenu());
    document.getElementById('btn-replay').addEventListener('click', () => this._startRun());
    document.getElementById('btn-menu').addEventListener('click', () => this.showMenu());

    // New menu buttons
    document.getElementById('btn-daily').addEventListener('click', () => this.startDaily());
    document.getElementById('btn-levelselect').addEventListener('click', () => this.showLevelSelect());
    document.getElementById('btn-settings').addEventListener('click', () => this.showSettings());

    // Level select
    document.getElementById('btn-levelselect-close').addEventListener('click', () => this.showMenu());

    // Settings
    document.getElementById('btn-settings-close').addEventListener('click', () => this.showMenu());
    document.getElementById('btn-toggle-sound').addEventListener('click', () => {
      Settings.toggle('sound');
      AudioManager.setMuted(!Settings.get('sound'));
      this._updateSettingsBtns();
    });
    document.getElementById('btn-toggle-speedbonus').addEventListener('click', () => {
      Settings.toggle('showSpeedBonus');
      this._updateSettingsBtns();
    });

    // Win screen - endless button
    document.getElementById('btn-win-endless').addEventListener('click', () => this.startEndless());

    // Apply initial mute state
    AudioManager.setMuted(!Settings.get('sound'));

    this._updateMenuInfo();
    this._loop.start();
  }

  // ── Public ────────────────────────────────────────────────────────────────

  showMenu() {
    this._hideAll();
    this._menuEl.classList.remove('hidden');
    this._destroyScreen();
    this._clearCanvas();
    this._updateMenuInfo();
  }

  showLevelSelect() {
    this._hideAll();
    this._lsEl.classList.remove('hidden');
    this._populateLevelGrid();
  }

  showSettings() {
    this._hideAll();
    this._settingsEl.classList.remove('hidden');
    this._updateSettingsBtns();
  }

  startDaily() {
    const today = DAILY_DATE_FN();
    this._isDaily = true;
    this._mode = 'daily';
    this._startRun();
  }

  startEndless() {
    this._mode = 'endless';
    this._isDaily = false;
    this._currentLevel = MAX_LEVEL + 1;
    this._lives  = 3;
    this._score  = 0;
    this._streak = 0;
    this._beginLevel();
  }

  // ── Private ───────────────────────────────────────────────────────────────

  _startRun() {
    this._currentLevel = 1;
    this._lives  = 3;
    this._score  = 0;
    this._streak = 0;
    if (this._mode !== 'daily' && this._mode !== 'endless') this._mode = 'normal';
    this._beginLevel();
  }

  _beginLevel() {
    this._hideAll();
    EventBus.clear();
    this._destroyScreen();
    const cfg = this._mode === 'endless' && this._currentLevel > MAX_LEVEL
      ? getEndlessLevel(this._currentLevel)
      : getLevel(this._currentLevel);

    this._screen = new GameScreen(
      this._ctx, this._input, cfg,
      this._lives, this._score, this._streak,
      stats => this._onLevelComplete(stats),
      score  => this._onGameOver(score),
      ()     => { this._destroyScreen(); this._startRun(); },
      ()     => { this._destroyScreen(); this.showMenu(); }
    );
  }

  _nextLevel() {
    this._currentLevel++;

    if (this._mode === 'endless' && this._currentLevel > MAX_LEVEL) {
      this._beginLevel();
      return;
    }

    if (this._currentLevel > MAX_LEVEL && this._mode !== 'endless') {
      this._showWin();
      return;
    }

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
    this._score  = score;
    this._lives  = lives;
    this._streak = streak;
    this._destroyScreen();

    // Award XP and update progress
    const earnedXP = Progress.calcXP(score, stars, level);
    this._progress.xp += earnedXP;
    const prevStars = this._progress.stars[level] ?? 0;
    if (stars > prevStars) this._progress.stars[level] = stars;
    if (score > this._progress.highscore) this._progress.highscore = score;

    if (this._isDaily) {
      const today = DAILY_DATE_FN();
      if (this._progress.dailyDate !== today || score > this._progress.dailyScore) {
        this._progress.dailyDate  = today;
        this._progress.dailyScore = score;
      }
    }
    Progress.save(this._progress);

    if (this._mode === 'endless' && level > MAX_LEVEL) {
      this._hideAll();
      document.getElementById('lc-title').textContent = `Endless Level ${level} Complete!`;
      document.getElementById('lc-score').textContent = `Score: ${score}  (+${earnedXP} XP)`;
      this._renderStars('lc-stars', stars);
      this._lcEl.classList.remove('hidden');
      return;
    }

    if (level >= MAX_LEVEL && this._mode !== 'endless') {
      this._showWin();
      return;
    }

    this._hideAll();
    document.getElementById('lc-title').textContent = `Level ${level} Complete!`;
    document.getElementById('lc-score').textContent = `Score: ${score}  (+${earnedXP} XP)`;
    this._renderStars('lc-stars', stars);
    this._lcEl.classList.remove('hidden');
  }

  _onGameOver(score) {
    this._score = score;
    this._destroyScreen();

    if (score > this._progress.highscore) this._progress.highscore = score;
    Progress.save(this._progress);

    this._hideAll();
    document.getElementById('final-score').textContent = `Score: ${score}`;
    document.getElementById('gameover-highscore').textContent =
      score >= this._progress.highscore ? '★ New High Score!' : `Best: ${this._progress.highscore}`;
    this._gameoverEl.classList.remove('hidden');
  }

  _showWin() {
    if (this._score > this._progress.highscore) this._progress.highscore = this._score;
    Progress.save(this._progress);

    this._hideAll();
    document.getElementById('win-score').textContent = `Score: ${this._score}`;
    document.getElementById('win-highscore').textContent =
      this._score >= this._progress.highscore ? '★ New High Score!' : `Best: ${this._progress.highscore}`;
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

  _populateLevelGrid() {
    const grid = document.getElementById('levelselect-grid');
    grid.innerHTML = '';
    for (let n = 1; n <= MAX_LEVEL; n++) {
      const cfg = getLevel(n);
      const unlocked = Progress.isUnlocked(n, this._progress.stars);
      const stars = this._progress.stars[n] ?? 0;

      const btn = document.createElement('button');
      btn.className = 'level-btn' +
        (unlocked ? '' : ' locked') +
        (cfg.isBoss ? ' boss' : '');

      const numDiv = document.createElement('div');
      numDiv.className = 'level-btn-num';
      numDiv.textContent = n;

      const starsDiv = document.createElement('div');
      starsDiv.className = 'level-btn-stars';
      for (let s = 1; s <= 3; s++) {
        const star = document.createElement('span');
        star.textContent = '★';
        star.className = s <= stars ? 'star-filled' : 'star-empty';
        starsDiv.appendChild(star);
      }

      btn.appendChild(numDiv);
      btn.appendChild(starsDiv);

      if (unlocked) {
        btn.addEventListener('click', () => {
          this._hideAll();
          this._currentLevel = n;
          this._lives  = 3;
          this._score  = 0;
          this._streak = 0;
          this._mode   = 'normal';
          this._isDaily = false;
          this._beginLevel();
        });
      }

      grid.appendChild(btn);
    }
  }

  _updateMenuInfo() {
    const rank = Progress.getRank(this._progress.xp);
    const nextXP = Progress.getNextRankXP(this._progress.xp);
    const rankEl = document.getElementById('menu-rank');
    if (rankEl) {
      rankEl.textContent = nextXP !== null
        ? `${rank.name}  •  ${this._progress.xp} XP  (next: ${nextXP})`
        : `${rank.name}  •  ${this._progress.xp} XP  ★ MAX RANK`;
    }

    const hsEl = document.getElementById('menu-highscore');
    if (hsEl) {
      hsEl.textContent = this._progress.highscore > 0 ? `Best: ${this._progress.highscore}` : '';
    }

    const today = DAILY_DATE_FN();
    const dailyEl = document.getElementById('menu-daily-score');
    if (dailyEl) {
      dailyEl.textContent = this._progress.dailyDate === today && this._progress.dailyScore > 0
        ? `Today's best: ${this._progress.dailyScore}`
        : '';
    }
  }

  _updateSettingsBtns() {
    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn) {
      soundBtn.textContent = Settings.get('sound') ? 'ON' : 'OFF';
      soundBtn.classList.toggle('toggle-on',  Settings.get('sound'));
      soundBtn.classList.toggle('toggle-off', !Settings.get('sound'));
    }
    const sbBtn = document.getElementById('btn-toggle-speedbonus');
    if (sbBtn) {
      sbBtn.textContent = Settings.get('showSpeedBonus') ? 'ON' : 'OFF';
      sbBtn.classList.toggle('toggle-on',  Settings.get('showSpeedBonus'));
      sbBtn.classList.toggle('toggle-off', !Settings.get('showSpeedBonus'));
    }
  }

  _hideAll() {
    [this._menuEl, this._lcEl, this._winEl, this._gameoverEl,
     this._unlockEl, this._lsEl, this._settingsEl]
      .forEach(el => el && el.classList.add('hidden'));
  }

  _destroyScreen() {
    this._screen?.destroy?.();
    this._screen = null;
  }

  _update(delta) { this._screen?.update(delta); }
  _render()      { if (this._screen) this._screen.render(); }
  _clearCanvas() { this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height); }
}
