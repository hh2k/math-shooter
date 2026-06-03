export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouseX = 400;
    this.mouseY = 300;
    this._clickQueue = [];

    canvas.addEventListener('mousemove', e => {
      const { x, y } = this._toCanvas(e.clientX, e.clientY);
      this.mouseX = x;
      this.mouseY = y;
    });

    canvas.addEventListener('click', e => {
      this._clickQueue.push(this._toCanvas(e.clientX, e.clientY));
    });
  }

  // Map viewport coordinates → internal canvas coordinates
  _toCanvas(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width  / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY,
    };
  }

  consumeClicks() {
    const clicks = this._clickQueue.slice();
    this._clickQueue.length = 0;
    return clicks;
  }
}
