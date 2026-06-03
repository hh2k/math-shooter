export class GameLoop {
  constructor(updateFn, renderFn) {
    this._update = updateFn;
    this._render = renderFn;
    this._lastTime = null;
    this._rafId = null;
    this._running = false;
  }

  start() {
    this._running = true;
    this._rafId = requestAnimationFrame(ts => this._tick(ts));
  }

  stop() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._lastTime = null;
  }

  _tick(timestamp) {
    if (!this._running) return;

    if (this._lastTime === null) this._lastTime = timestamp;
    const delta = Math.min((timestamp - this._lastTime) / 1000, 0.1); // cap at 100ms
    this._lastTime = timestamp;

    this._update(delta);
    this._render();

    this._rafId = requestAnimationFrame(ts => this._tick(ts));
  }
}
