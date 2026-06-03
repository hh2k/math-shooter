import { Player } from '../entities/Player.js';
import { Target, BASE_RADIUS } from '../entities/Target.js';
import { BulletPool } from '../systems/BulletPool.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { QuestionFactory } from '../math/QuestionFactory.js';
import { HUD } from '../renderer/HUD.js';
import { EventBus } from '../core/EventBus.js';
import { AudioManager } from '../core/AudioManager.js';

const MIN_SPACING = 18; // gap between bubble edges at spawn (on top of their combined radii)
const BURST_COLORS = ['#88bbff', '#88ddff', '#88eeff', '#aaccee', '#6699dd'];

export class GameScreen {
  constructor(ctx, input, levelConfig, lives, score, streak, onLevelComplete, onGameOver) {
    this._ctx = ctx;
    this._input = input;
    this._cfg = levelConfig;
    this._onLevelComplete = onLevelComplete;
    this._onGameOver = onGameOver;

    const W = ctx.canvas.width;
    const H = ctx.canvas.height;

    this._player = new Player(W / 2, H - H * 0.1);
    this._bullets = new BulletPool();
    this._particles = new ParticleSystem();
    this._targets = Array.from({ length: this._cfg.targetCount }, () => new Target());
    this._hud = new HUD();

    this._question = null;
    this._score = score;
    this._lives = lives;
    this._streak = streak;
    this._questionsCorrect = 0;
    this._wrongHitsThisLevel = 0;
    this._scheduleNext = false;
    this._shakeTime = 0;
    this._shakeIntensity = 0;
    this._graceLeft = 0;
    this._timeLeft = null;
    this._done = false;
    this._questionElapsed = 0;
    this._floats = [];

    EventBus.on('correct-hit', d => this._onCorrectHit(d));
    EventBus.on('wrong-hit',   d => this._onWrongHit(d));

    this._nextQuestion();
  }

  destroy() {
    EventBus.off('correct-hit');
    EventBus.off('wrong-hit');
  }

  _bubbleBounds() {
    const W = this._ctx.canvas.width;
    const H = this._ctx.canvas.height;
    // Subtract the largest possible bubble radius so bubble *edges* stay within
    // the safe zone — the lower bound keeps edges above H*0.80, well clear of
    // the question panel (H*0.86) and cannon (H*0.90).
    const maxR = BASE_RADIUS * (W / 800) * (this._cfg.maxBubbleScale ?? 1.0);
    return {
      minX: W * 0.05 + maxR,
      maxX: W * 0.95 - maxR,
      minY: H * 0.09 + maxR,
      maxY: H * 0.80 - maxR,
    };
  }

  _nextQuestion() {
    this._question = QuestionFactory.generate(this._cfg.ops ?? ['+'], this._cfg);
    const values = QuestionFactory.buildTargetValues(this._question, this._cfg.targetCount);
    const scales = this._buildSizeScales(this._cfg.targetCount);
    const positions = this._spreadPositions(this._cfg.targetCount, scales);

    while (this._targets.length < this._cfg.targetCount) this._targets.push(new Target());

    this._targets.forEach((t, i) => {
      if (i < this._cfg.targetCount) {
        t.spawn(positions[i].x, positions[i].y, values[i],
          values[i] === this._question.answer, this._cfg.speed,
          this._ctx.canvas.width, scales[i]);
      } else {
        t.active = false;
      }
    });

    this._graceLeft = this._cfg.graceTime ?? 0;
    this._timeLeft  = this._cfg.timeLimit ?? null;
    this._questionElapsed = 0;
  }

  _buildSizeScales(count) {
    const min = this._cfg.minBubbleScale ?? 1.0;
    const max = this._cfg.maxBubbleScale ?? 1.0;
    return Array.from({ length: count }, () => min + Math.random() * (max - min));
  }

  _spreadPositions(count, scales = []) {
    const b = this._bubbleBounds(); // already inset by max bubble radius
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

  _multiplier() {
    return 1 + Math.floor(this._streak / 3);
  }

  _speedBonus() {
    return Math.max(0, 200 - Math.floor(this._questionElapsed * 25));
  }

  _onCorrectHit({ target }) {
    if (this._done) return;
    const bonus = this._speedBonus();
    this._streak++;
    const pts = (100 + bonus) * this._multiplier();
    this._score += pts;
    this._questionsCorrect++;

    // Floating score text at bubble
    const label = bonus >= 150 ? 'FAST! ' : bonus >= 80 ? 'QUICK! ' : '';
    this._floats.push({
      x: target.x, y: target.y - target.radius,
      text: `${label}+${pts}`,
      life: 1.3, total: 1.3,
      color: bonus >= 150 ? '#ff9900' : bonus >= 80 ? '#ffdd44' : '#88ff88',
      size: bonus >= 150 ? 22 : 18,
    });
    this._particles.burst(target.x, target.y, BURST_COLORS[target._colorIdx] || '#88bbff', 16);
    AudioManager.correct();

    if (this._questionsCorrect >= this._cfg.questionsToComplete) {
      this._done = true;
      const stars = this._wrongHitsThisLevel === 0 ? 3
        : this._wrongHitsThisLevel <= 2 ? 2 : 1;
      setTimeout(() => this._onLevelComplete({
        level: this._cfg.level,
        score: this._score,
        lives: this._lives,
        streak: this._streak,
        stars
      }), 600);
    } else {
      this._scheduleNext = true;
    }
  }

  _onWrongHit() {
    if (this._done) return;
    this._streak = 0;
    this._wrongHitsThisLevel++;
    this._lives--;
    AudioManager.wrong();
    this._shakeTime = 0.35;
    this._shakeIntensity = 8;
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

  update(delta) {
    if (this._done) return;

    const { mouseX, mouseY } = this._input;
    this._player.update(delta, mouseX, mouseY);
    this._bullets.update(delta);
    this._targets.forEach(t => t.update(delta, this._bubbleBounds()));
    this._separateBubbles();
    this._clearShootingLane();
    this._particles.update(delta);
    this._questionElapsed += delta;
    this._floats = this._floats.filter(f => f.life > 0);
    this._floats.forEach(f => { f.life -= delta; });

    if (this._shakeTime > 0) this._shakeTime -= delta;

    // Grace period ticks down silently; timer only starts after grace expires
    if (this._graceLeft > 0) {
      this._graceLeft -= delta;
    } else if (this._timeLeft !== null) {
      this._timeLeft -= delta;
      if (this._timeLeft <= 0) { this._timeLeft = 0; this._onTimeout(); return; }
    }

    CollisionSystem.check(this._bullets.active, this._targets);

    for (const click of this._input.consumeClicks()) {
      if (this._player.canShoot()) {
        this._bullets.fire(this._player.x, this._player.y, click.x, click.y,
          this._ctx.canvas.width);
        this._player.shoot();
        AudioManager.shoot();
      }
    }

    if (this._scheduleNext) { this._scheduleNext = false; this._nextQuestion(); }
  }

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
    this._particles.render(ctx);
    this._bullets.render(ctx);
    this._player.render(ctx);
    this._renderFloats(ctx);
    this._hud.render(ctx, {
      score: this._score,
      lives: this._lives,
      question: this._question,
      streak: this._streak,
      multiplier: this._multiplier(),
      level: this._cfg.level,
      questionsCorrect: this._questionsCorrect,
      questionsTotal: this._cfg.questionsToComplete,
      timeLeft: this._graceLeft > 0 ? null : this._timeLeft,
      timeLimit: this._cfg.timeLimit,
      speedBonus: this._speedBonus(),
    });

    ctx.restore();

    this._renderCrosshair(ctx);
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
    // horizontal
    ctx.moveTo(mouseX - gap - arm, mouseY); ctx.lineTo(mouseX - gap, mouseY);
    ctx.moveTo(mouseX + gap,       mouseY); ctx.lineTo(mouseX + gap + arm, mouseY);
    // vertical
    ctx.moveTo(mouseX, mouseY - gap - arm); ctx.lineTo(mouseX, mouseY - gap);
    ctx.moveTo(mouseX, mouseY + gap);       ctx.lineTo(mouseX, mouseY + gap + arm);
    ctx.stroke();
    // centre dot
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 2 * s, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.shadowBlur = 0;
    ctx.fill();
    ctx.restore();
  }

  _separateBubbles() {
    const scale = this._ctx.canvas.width / 800;
    const gap = 22 * scale; // visible daylight between any two bubbles
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
        a.x -= nx * half;
        a.y -= ny * half;
        b.x += nx * half;
        b.y += ny * half;

        // Elastic velocity exchange so they bounce away
        const aDot = a._vx * nx + a._vy * ny;
        const bDot = b._vx * nx + b._vy * ny;
        if (aDot - bDot > 0) {
          a._vx += (bDot - aDot) * nx;
          a._vy += (bDot - aDot) * ny;
          b._vx += (aDot - bDot) * nx;
          b._vy += (aDot - bDot) * ny;
        }
      }
    }
  }

  // Push any bubble that blocks the straight line from cannon to the correct bubble
  // sideways, so there is always a clear shot available.
  _clearShootingLane() {
    const correct = this._targets.find(t => t.active && t.isCorrect);
    if (!correct) return;

    const px = this._player.x;
    const py = this._player.y;
    const dx = correct.x - px;
    const dy = correct.y - py;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len; // unit along ray (cannon → correct)
    const uy = dy / len;
    const perpX = -uy;   // perpendicular (left of ray)
    const perpY =  ux;

    for (const t of this._targets) {
      if (!t.active || t === correct) continue;

      const rx = t.x - px;
      const ry = t.y - py;
      const along = rx * ux + ry * uy;
      // Only relevant when bubble is between cannon and correct bubble
      if (along <= 0 || along >= len) continue;

      const signedPerp = rx * perpX + ry * perpY;
      const needed = t.radius + 16 * (this._ctx.canvas.width / 800); // lane half-width

      if (Math.abs(signedPerp) < needed) {
        const push = needed - Math.abs(signedPerp);
        const side = signedPerp >= 0 ? 1 : -1;
        // Snap position out of the lane immediately
        t.x += perpX * side * push;
        t.y += perpY * side * push;
        // Steer velocity to keep it clear
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
    ctx.strokeStyle = 'rgba(40, 60, 120, 0.2)';
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
