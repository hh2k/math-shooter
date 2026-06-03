import { Bullet } from '../entities/Bullet.js';

const POOL_SIZE = 20;

export class BulletPool {
  constructor() {
    this._pool = Array.from({ length: POOL_SIZE }, () => new Bullet());
  }

  fire(x, y, targetX, targetY, canvasWidth = 800) {
    const bullet = this._pool.find(b => !b.active);
    if (bullet) bullet.fire(x, y, targetX, targetY, canvasWidth);
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
