import { Player }           from '../entities/Player.js';
import { Target, BASE_RADIUS } from '../entities/Target.js';
import { BulletPool }       from '../systems/BulletPool.js';
import { ParticleSystem }   from '../systems/ParticleSystem.js';
import { CollisionSystem }  from '../systems/CollisionSystem.js';
import { QuestionFactory }  from '../math/QuestionFactory.js';
import { HUD }              from '../renderer/HUD.js';
import { EventBus }         from '../core/EventBus.js';
import { AudioManager }     from '../core/AudioManager.js';
import { Settings }         from '../core/Settings.js';
import { PowerUp, POWERUP_TYPES } from '../entities/PowerUp.js';
import { EnemyProjectile }  from '../entities/EnemyProjectile.js';

const MIN_SPACING   = 18;
const BURST_COLORS  = ['#88bbff', '#88ddff', '#88eeff', '#aaccee', '#6699dd'];
const COMBO_MSGS    = { 3: 'NICE!', 5: 'ON FIRE!', 10: 'UNSTOPPABLE!', 15: 'MATH GOD!' };
const BOMB_RADIUS   = 26;
const BOMB_FUSE     = 5;
const POWERUP_INTERVAL_MIN = 18;
const POWERUP_INTERVAL_MAX = 25;
const BOMB_INTERVAL_MIN    = 30;
const BOMB_INTERVAL_MAX    = 45;

export class GameScreen {
  constructor(ctx, input, levelConfig, lives, score, streak,
              onLevelComplete, onGameOver,
              onPauseRestart, onPauseMenu) {
    this._ctx = ctx;
    this._input = input;
    this._cfg = levelConfig;
    this._onLevelComplete = onLevelComplete;
    this._onGameOver = onGameOver;
    this._onPauseRestart = onPauseRestart || (() => {});
    this._onPauseMenu = onPauseMenu || (() => {});

    const W = ctx.canvas.width;
    const H = ctx.canvas.height;

    this._player   = new Player(W / 2, H - H * 0.1);
    this._bullets  = new BulletPool();
    this._particles = new ParticleSystem();
    this._targets  = Array.from({ length: this._cfg.targetCount }, () => new Target());
    this._hud      = new HUD();

    this._question           = null;
    this._score              = score;
    this._lives              = lives;
    this._streak             = streak;
    this._questionsCorrect   = 0;
    this._wrongHitsThisLevel = 0;
    this._scheduleNext       = false;
    this._shakeTime          = 0;
    this._shakeIntensity     = 0;
    this._graceLeft          = 0;
    this._timeLeft           = null;
    this._done               = false;
    this._questionElapsed    = 0;
    this._floats             = [];

    // Pause
    this._paused = false;
    this._pauseBtns = {};

    // Active effects
    this._effects = { freezeLeft: 0, multishotLeft: 0, shieldActive: false };

    // Power-ups
    this._powerups = [];
    this._powerupTimer = POWERUP_INTERVAL_MIN + Math.random() * (POWERUP_INTERVAL_MAX - POWERUP_INTERVAL_MIN);

    // Bombs
    this._bombs = [];
    this._bombTimer = BOMB_INTERVAL_MIN + Math.random() * (BOMB_INTERVAL_MAX - BOMB_INTERVAL_MIN);

    // Enemy projectiles (cosmetic)
    this._enemyProjectiles = [];

    // Boss
    this._bossHitsLeft  = this._cfg.isBoss ? this._cfg.questionsToComplete : 0;
    this._totalBossHits = this._cfg.questionsToComplete;

    EventBus.on('correct-hit', d => this._onCorrectHit(d));
    EventBus.on('wrong-hit',   d => this._onWrongHit(d));

    this._nextQuestion();
  }

  destroy() {
    EventBus.off('correct-hit');
    EventBus.off('wrong-hit');
  }

  // ── Bounds ────────────────────────────────────────────────────────────────

  _bubbleBounds() {
    const W = this._ctx.canvas.width;
    const H = this._ctx.canvas.height;
    const maxR = BASE_RADIUS * (W / 800) * (this._cfg.maxBubbleScale ?? 1.0);
    return {
      minX: W * 0.05 + maxR,
      maxX: W * 0.95 - maxR,
      minY: H * 0.09 + maxR,
      maxY: H * 0.80 - maxR,
    };
  }

  // ── Questions ─────────────────────────────────────────────────────────────

  _nextQuestion() {
    this._question = QuestionFactory.generate(this._cfg.ops ?? ['+'], this._cfg);
    const count  = this._cfg.targetCount;
    const values = QuestionFactory.buildTargetValues(this._question, count);
    const correctIdx = values.indexOf(this._question.answer);
    const scales = this._buildSizeScales(count, correctIdx);
    const positions = this._spreadPositions(count, scales);

    while (this._targets.length < count) this._targets.push(new Target());

    this._targets.forEach((t, i) => {
      if (i < count) {
        t.spawn(positions[i].x, positions[i].y, values[i],
          values[i] === this._question.answer, this._cfg.speed,
          this._ctx.canvas.width, scales[i]);
      } else {
        t.active = false;
      }
    });

    this._graceLeft       = this._cfg.graceTime ?? 0;
    this._timeLeft        = this._cfg.timeLimit ?? null;
    this._questionElapsed = 0;
  }

  _buildSizeScales(count, correctIdx = -1) {
    const min = this._cfg.minBubbleScale ?? 1.0;
    const max = this._cfg.maxBubbleScale ?? 1.0;
    return Array.from({ length: count }, (_, i) => {
      if (this._cfg.isBoss) {
        return i === correctIdx ? 2.0 : 0.7;
      }
      return min + Math.random() * (max - min);
    });
  }

  _spreadPositions(count, scales = []) {
    const b = this._bubbleBounds();
    const canvasScale = this._ctx.canvas.width / 800;
    const positions = [];
    let attempts = 0;
    while (positions.length < count && attempts < 500) {
      const x = b.minX + Math.random() * (b.maxX - b.minX);
      const y = b.minY + Math.random() * (b.maxY - b.minY);
      const ri = BASE_RADIUS * canvasScale * (scales[positions.length] ?? 1);
      const fits = positions.every((p, i) => {
        const rp = BASE_RADIUS * canvasScale * (scales[i] ?? 1);
        return Math.hypot(p.x - x, p.y - y) > ri + rp + MIN_SPACING * canvasScale;
      });
      if (fits) positions.push({ x, y });
      attempts++;
    }
    return positions;
  }

  // ── Scoring helpers ───────────────────────────────────────────────────────

  _multiplier() {
    return 1 + Math.floor(this._streak / 3);
  }

  _speedBonus() {
    return Math.max(0, 200 - Math.floor(this._questionElapsed * 25));
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  _onCorrectHit({ target }) {
    if (this._done) return;
    const bonus = this._speedBonus();
    this._streak++;
    const pts = (100 + bonus) * this._multiplier();
    this._score += pts;
    this._questionsCorrect++;

    if (this._cfg.isBoss) {
      this._bossHitsLeft = Math.max(0, this._bossHitsLeft - 1);
      AudioManager.bossHit();
      this._floats.push({
        x: target.x, y: target.y - target.radius,
        text: '★ BOSS HIT! +' + pts,
        life: 1.5, total: 1.5,
        color: '#ff8800', size: 24,
      });
    } else {
      const label = bonus >= 150 ? 'FAST! ' : bonus >= 80 ? 'QUICK! ' : '';
      this._floats.push({
        x: target.x, y: target.y - target.radius,
        text: `${label}+${pts}`,
        life: 1.3, total: 1.3,
        color: bonus >= 150 ? '#ff9900' : bonus >= 80 ? '#ffdd44' : '#88ff88',
        size: bonus >= 150 ? 22 : 18,
      });
      AudioManager.correct();
    }

    this._particles.burst(target.x, target.y, BURST_COLORS[target._colorIdx] || '#88bbff', 16);

    // Combo announcer
    const msg = COMBO_MSGS[this._streak];
    if (msg) {
      const W = this._ctx.canvas.width;
      const H = this._ctx.canvas.height;
      this._floats.push({
        x: W / 2, y: H * 0.45,
        text: msg,
        life: 1.8, total: 1.8,
        color: '#ffdd00', size: 40,
      });
      AudioManager.combo(this._streak);
    }

    if (this._questionsCorrect >= this._cfg.questionsToComplete) {
      this._done = true;
      const stars = this._wrongHitsThisLevel === 0 ? 3
        : this._wrongHitsThisLevel <= 2 ? 2 : 1;
      setTimeout(() => this._onLevelComplete({
        level: this._cfg.level,
        score: this._score,
        lives: this._lives,
        streak: this._streak,
        stars,
      }), 600);
    } else {
      this._scheduleNext = true;
    }
  }

  _onWrongHit({ target }) {
    if (this._done) return;

    if (this._effects.shieldActive) {
      this._effects.shieldActive = false;
      this._floats.push({
        x: this._ctx.canvas.width / 2, y: this._ctx.canvas.height * 0.5,
        text: '🛡 SHIELD ABSORBED!', life: 1.4, total: 1.4,
        color: '#44ff88', size: 22,
      });
      return;
    }

    this._streak = 0;
    this._wrongHitsThisLevel++;
    this._lives--;
    AudioManager.wrong();
    this._shakeTime = 0.35;
    this._shakeIntensity = 8;

    // Cosmetic counter-attack
    const ep = new EnemyProjectile();
    ep.fire(target.x, target.y, this._player.x, this._player.y, this._ctx.canvas.width);
    this._enemyProjectiles.push(ep);

    if (this._lives <= 0) {
      this._done = true;
      setTimeout(() => this._onGameOver(this._score), 400);
    }
  }

  _onTimeout() {
    if (this._done) return;
    this._streak = 0;
    this._wrongHitsThisLevel++;
    this._lives--;
    AudioManager.wrong();
    this._shakeTime = 0.4;
    this._shakeIntensity = 10;
    this._timeLeft = null;
    if (this._lives <= 0) {
      this._done = true;
      setTimeout(() => this._onGameOver(this._score), 400);
    } else {
      this._nextQuestion();
    }
  }

  // ── Main update ──────────────────────────────────────────────────────────

  update(delta) {
    if (this._done) return;

    // Pause toggle
    if (this._input.consumeKey('Escape')) {
      this._paused = !this._paused;
    }

    if (this._paused) return;

    const W = this._ctx.canvas.width;
    const H = this._ctx.canvas.height;
    const { mouseX, mouseY } = this._input;

    this._player.update(delta, mouseX, mouseY);
    this._bullets.update(delta);

    // Freeze effect: skip target movement
    if (this._effects.freezeLeft <= 0) {
      this._targets.forEach(t => t.update(delta, this._bubbleBounds()));
    }
    this._separateBubbles();
    this._clearShootingLane();
    this._particles.update(delta);
    this._questionElapsed += delta;
    this._floats = this._floats.filter(f => f.life > 0);
    this._floats.forEach(f => { f.life -= delta; });

    if (this._shakeTime > 0) this._shakeTime -= delta;

    // Effects countdowns
    if (this._effects.freezeLeft > 0) this._effects.freezeLeft -= delta;
    if (this._effects.multishotLeft > 0) this._effects.multishotLeft -= delta;

    // Grace / timer
    if (this._graceLeft > 0) {
      this._graceLeft -= delta;
    } else if (this._timeLeft !== null) {
      this._timeLeft -= delta;
      if (this._timeLeft <= 0) { this._timeLeft = 0; this._onTimeout(); return; }
    }

    // Power-up spawner
    this._powerupTimer -= delta;
    if (this._powerupTimer <= 0) {
      this._spawnPowerUp();
      this._powerupTimer = POWERUP_INTERVAL_MIN + Math.random() * (POWERUP_INTERVAL_MAX - POWERUP_INTERVAL_MIN);
    }
    const bounds = this._bubbleBounds();
    for (const pu of this._powerups) pu.update(delta, bounds);
    this._powerups = this._powerups.filter(pu => pu.active);

    // Bomb spawner
    this._bombTimer -= delta;
    if (this._bombTimer <= 0) {
      this._spawnBomb();
      this._bombTimer = BOMB_INTERVAL_MIN + Math.random() * (BOMB_INTERVAL_MAX - BOMB_INTERVAL_MIN);
    }
    for (const b of this._bombs) {
      b._fuse -= delta;
      if (b._fuse <= 0) {
        b.active = false;
        this._lives--;
        AudioManager.bomb();
        this._shakeTime = 0.5;
        this._shakeIntensity = 14;
        this._floats.push({
          x: b.x, y: b.y,
          text: '💥 BOMB!', life: 1.5, total: 1.5,
          color: '#ff4400', size: 26,
        });
        if (this._lives <= 0) {
          this._done = true;
          setTimeout(() => this._onGameOver(this._score), 400);
          return;
        }
      }
    }
    this._bombs = this._bombs.filter(b => b.active);

    // Enemy projectiles
    for (const ep of this._enemyProjectiles) ep.update(delta);
    this._enemyProjectiles = this._enemyProjectiles.filter(ep => ep.active);

    // Collisions — targets
    CollisionSystem.check(this._bullets.active, this._targets);

    // Bullet vs power-up collision
    for (const bullet of this._bullets.active) {
      for (const pu of this._powerups) {
        if (!pu.active) continue;
        if (Math.hypot(bullet.x - pu.x, bullet.y - pu.y) < bullet.radius + pu.radius) {
          bullet.active = false;
          pu.active = false;
          this._applyPowerUp(pu.type);
          AudioManager.powerup();
          break;
        }
      }
    }

    // Bullet vs bomb collision (defuse)
    for (const bullet of this._bullets.active) {
      for (const bomb of this._bombs) {
        if (!bomb.active) continue;
        const bombR = BOMB_RADIUS * (W / 800);
        if (Math.hypot(bullet.x - bomb.x, bullet.y - bomb.y) < bullet.radius + bombR) {
          bullet.active = false;
          bomb.active = false;
          this._score += 150;
          AudioManager.defuse();
          this._floats.push({
            x: bomb.x, y: bomb.y,
            text: '+150 DEFUSED!', life: 1.3, total: 1.3,
            color: '#00ffaa', size: 20,
          });
          break;
        }
      }
    }
    this._bombs = this._bombs.filter(b => b.active);

    // Shooting
    for (const click of this._input.consumeClicks()) {
      if (this._player.canShoot()) {
        const spread = this._effects.multishotLeft > 0 ? 0.18 : 0;
        this._bullets.fire(
          this._player.x, this._player.y, click.x, click.y,
          W, H, spread
        );
        this._player.shoot();
        AudioManager.shoot();
      }
    }

    if (this._scheduleNext) { this._scheduleNext = false; this._nextQuestion(); }
  }

  _applyPowerUp(type) {
    if (type === 'freeze') {
      this._effects.freezeLeft = 4;
      AudioManager.freeze();
      this._floats.push({
        x: this._ctx.canvas.width / 2, y: this._ctx.canvas.height * 0.45,
        text: '❄ FREEZE!', life: 1.4, total: 1.4,
        color: '#00eeff', size: 28,
      });
    } else if (type === 'multishot') {
      this._effects.multishotLeft = 8;
      this._floats.push({
        x: this._ctx.canvas.width / 2, y: this._ctx.canvas.height * 0.45,
        text: '⚡ MULTISHOT!', life: 1.4, total: 1.4,
        color: '#ff9900', size: 28,
      });
    } else if (type === 'shield') {
      this._effects.shieldActive = true;
      this._floats.push({
        x: this._ctx.canvas.width / 2, y: this._ctx.canvas.height * 0.45,
        text: '🛡 SHIELD!', life: 1.4, total: 1.4,
        color: '#44ff88', size: 28,
      });
    }
  }

  _spawnPowerUp() {
    const W = this._ctx.canvas.width;
    const H = this._ctx.canvas.height;
    const bounds = this._bubbleBounds();
    const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
    const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    const pu = new PowerUp();
    pu.spawn(x, y, type, W);
    this._powerups.push(pu);
  }

  _spawnBomb() {
    const W = this._ctx.canvas.width;
    const bounds = this._bubbleBounds();
    const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
    const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
    this._bombs.push({ x, y, active: true, _fuse: BOMB_FUSE });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  render() {
    const ctx = this._ctx;
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    ctx.clearRect(0, 0, W, H);

    let shakeX = 0, shakeY = 0;
    if (this._shakeTime > 0) {
      shakeX = (Math.random() - 0.5) * 2 * this._shakeIntensity;
      shakeY = (Math.random() - 0.5) * 2 * this._shakeIntensity;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    this._drawBackground(ctx, W, H);
    this._targets.forEach(t => t.render(ctx));
    this._powerups.forEach(pu => pu.render(ctx));
    this._bombs.forEach(b => this._renderBomb(ctx, b));
    this._enemyProjectiles.forEach(ep => ep.render(ctx));
    this._particles.render(ctx);
    this._bullets.render(ctx);
    this._player.render(ctx);
    this._renderFloats(ctx);

    this._hud.render(ctx, {
      score:            this._score,
      lives:            this._lives,
      question:         this._question,
      streak:           this._streak,
      multiplier:       this._multiplier(),
      level:            this._cfg.level,
      questionsCorrect: this._questionsCorrect,
      questionsTotal:   this._cfg.questionsToComplete,
      timeLeft:         this._graceLeft > 0 ? null : this._timeLeft,
      timeLimit:        this._cfg.timeLimit,
      speedBonus:       this._speedBonus(),
      effects:          this._effects,
      isBoss:           this._cfg.isBoss || false,
      bossHitsLeft:     this._bossHitsLeft,
      totalBossHits:    this._totalBossHits,
      showSpeedBonus:   Settings.get('showSpeedBonus'),
    });

    ctx.restore();

    if (this._paused) {
      this._renderPauseOverlay(ctx, W, H);
    } else {
      this._renderCrosshair(ctx);
    }
  }

  _renderBomb(ctx, b) {
    if (!b.active) return;
    const W = ctx.canvas.width;
    const s = W / 800;
    const r = BOMB_RADIUS * s;
    const fuseRatio = b._fuse / BOMB_FUSE;
    const pulse = 1 + Math.sin(Date.now() / (150 * fuseRatio + 50)) * 0.08;

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(pulse, pulse);

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
    ctx.strokeStyle = fuseRatio > 0.5 ? '#ff8800' : '#ff2200';
    ctx.lineWidth = 2.5 * s;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 12 * s;
    ctx.stroke();

    ctx.font = `${Math.round(r * 1.2)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText('💣', 0, 1 * s);

    ctx.font = `bold ${Math.round(12 * s)}px Segoe UI, Arial`;
    ctx.fillStyle = fuseRatio > 0.5 ? '#ffcc00' : '#ff4400';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 6 * s;
    ctx.fillText(b._fuse.toFixed(1) + 's', 0, r + 14 * s);

    ctx.restore();
  }

  _renderPauseOverlay(ctx, W, H) {
    const scale = W / 800;
    ctx.save();

    ctx.fillStyle = 'rgba(6, 6, 30, 0.82)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#7eb8ff';
    ctx.font = `bold ${Math.round(52 * scale)}px Segoe UI, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(126,184,255,0.5)';
    ctx.shadowBlur = 24 * scale;
    ctx.fillText('PAUSED', W / 2, H * 0.32);
    ctx.shadowBlur = 0;

    const btns = [
      { id: 'resume',  label: 'Resume',       y: H * 0.48 },
      { id: 'restart', label: 'Restart',       y: H * 0.58 },
      { id: 'menu',    label: 'Main Menu',     y: H * 0.68 },
    ];

    const btnW = 220 * scale;
    const btnH = 48 * scale;

    this._pauseBtns = {};

    for (const btn of btns) {
      const x = W / 2 - btnW / 2;
      const y = btn.y - btnH / 2;
      this._pauseBtns[btn.id] = { x, y, w: btnW, h: btnH };

      ctx.fillStyle = 'rgba(42, 74, 138, 0.9)';
      roundRectFill(ctx, x, y, btnW, btnH, 8 * scale);
      ctx.strokeStyle = '#4a7acc';
      ctx.lineWidth = 2;
      roundRectStroke(ctx, x, y, btnW, btnH, 8 * scale);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(18 * scale)}px Segoe UI, Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, W / 2, btn.y);
    }

    ctx.restore();

    // Check click-on-pause-buttons
    for (const click of this._input.consumeClicks()) {
      for (const [id, rect] of Object.entries(this._pauseBtns)) {
        if (click.x >= rect.x && click.x <= rect.x + rect.w &&
            click.y >= rect.y && click.y <= rect.y + rect.h) {
          if (id === 'resume')  this._paused = false;
          if (id === 'restart') this._onPauseRestart();
          if (id === 'menu')    this._onPauseMenu();
        }
      }
    }
  }

  _renderCrosshair(ctx) {
    const { mouseX, mouseY } = this._input;
    if (mouseX == null) return;
    const s = ctx.canvas.width / 800;
    const arm = 14 * s;
    const gap =  5 * s;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5 * s;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(mouseX - gap - arm, mouseY); ctx.lineTo(mouseX - gap, mouseY);
    ctx.moveTo(mouseX + gap,       mouseY); ctx.lineTo(mouseX + gap + arm, mouseY);
    ctx.moveTo(mouseX, mouseY - gap - arm); ctx.lineTo(mouseX, mouseY - gap);
    ctx.moveTo(mouseX, mouseY + gap);       ctx.lineTo(mouseX, mouseY + gap + arm);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 2 * s, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.shadowBlur = 0;
    ctx.fill();
    ctx.restore();
  }

  _separateBubbles() {
    const scale = this._ctx.canvas.width / 800;
    const gap = 22 * scale;
    const active = this._targets.filter(t => t.active);
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i], b = active[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const minDist = a.radius + b.radius + gap;
        if (dist >= minDist) continue;

        const nx = dx / dist;
        const ny = dy / dist;
        const half = (minDist - dist) * 0.5;
        a.x -= nx * half; a.y -= ny * half;
        b.x += nx * half; b.y += ny * half;

        const aDot = a._vx * nx + a._vy * ny;
        const bDot = b._vx * nx + b._vy * ny;
        if (aDot - bDot > 0) {
          a._vx += (bDot - aDot) * nx; a._vy += (bDot - aDot) * ny;
          b._vx += (aDot - bDot) * nx; b._vy += (aDot - bDot) * ny;
        }
      }
    }
  }

  _clearShootingLane() {
    const correct = this._targets.find(t => t.active && t.isCorrect);
    if (!correct) return;

    const px = this._player.x;
    const py = this._player.y;
    const dx = correct.x - px;
    const dy = correct.y - py;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const perpX = -uy;
    const perpY =  ux;

    for (const t of this._targets) {
      if (!t.active || t === correct) continue;
      const rx = t.x - px;
      const ry = t.y - py;
      const along = rx * ux + ry * uy;
      if (along <= 0 || along >= len) continue;
      const signedPerp = rx * perpX + ry * perpY;
      const needed = t.radius + 16 * (this._ctx.canvas.width / 800);
      if (Math.abs(signedPerp) < needed) {
        const push = needed - Math.abs(signedPerp);
        const side = signedPerp >= 0 ? 1 : -1;
        t.x += perpX * side * push;
        t.y += perpY * side * push;
        const vPerp = t._vx * perpX + t._vy * perpY;
        if (vPerp * side < 0) {
          t._vx -= perpX * vPerp;
          t._vy -= perpY * vPerp;
        }
      }
    }
  }

  _renderFloats(ctx) {
    const scale = ctx.canvas.width / 800;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of this._floats) {
      const t = 1 - f.life / f.total;
      ctx.globalAlpha = Math.min(1, f.life / f.total * 3);
      ctx.font = `bold ${Math.round(f.size * scale)}px Segoe UI, Arial`;
      ctx.fillStyle = f.color;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 8 * scale;
      ctx.fillText(f.text, f.x, f.y - t * 70 * scale);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  _drawBackground(ctx, W, H) {
    ctx.save();

    const timeLeft = this._graceLeft > 0 ? null : this._timeLeft;
    const isUrgent = timeLeft !== null && timeLeft < 3;

    if (isUrgent) {
      const pulse = 0.5 + Math.abs(Math.sin(Date.now() / 200)) * 0.5;
      ctx.strokeStyle = `rgba(200, 40, 20, ${0.18 + pulse * 0.22})`;
    } else {
      ctx.strokeStyle = 'rgba(40, 60, 120, 0.2)';
    }

    ctx.lineWidth = 1;
    const step = Math.round(W / 20);
    for (let x = 0; x <= W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();
  }
}

function roundRectFill(ctx, x, y, w, h, r) {
  _roundRectPath(ctx, x, y, w, h, r);
  ctx.fill();
}

function roundRectStroke(ctx, x, y, w, h, r) {
  _roundRectPath(ctx, x, y, w, h, r);
  ctx.stroke();
}

function _roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
