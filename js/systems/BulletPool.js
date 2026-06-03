import { Bullet } from '../entities/Bullet.js';

const POOL_SIZE = 30;

export class BulletPool {
  constructor() {
    this._pool = Array.from({ length: POOL_SIZE }, () => new Bullet());
  }

  fire(x, y, targetX, targetY, canvasWidth = 800, canvasHeight = 600, spread = 0) {
    if (spread > 0) {
      const dx = targetX - x;
      const dy = targetY - y;
      const baseAngle = Math.atan2(dy, dx);
      const angles = [baseAngle - spread, baseAngle, baseAngle + spread];
      for (const a of angles) {
        const tx = x + Math.cos(a) * 1000;
        const ty = y + Math.sin(a) * 1000;
        this._fireSingle(x, y, tx, ty, canvasWidth, canvasHeight);
      }
    } else {
      this._fireSingle(x, y, targetX, targetY, canvasWidth, canvasHeight);
    }
  }

  _fireSingle(x, y, targetX, targetY, canvasWidth, canvasHeight) {
    const bullet = this._pool.find(b => !b.active);
    if (bullet) bullet.fire(x, y, targetX, targetY, canvasWidth, canvasHeight);
    return bullet || null;
  }

  get active() {
    return this._pool.filter(b => b.active);
  }

  update(delta) {
    this._pool.forEach(b => b.update(delta));
  }

  render(ctx) {
    this._pool.forEach(b => b.render(ctx));
  }
}
