import { EventBus } from '../core/EventBus.js';

export const CollisionSystem = {
  check(bullets, targets) {
    for (const bullet of bullets) {
      if (!bullet.active) continue;
      for (const target of targets) {
        if (!target.active) continue;
        const dx = bullet.x - target.x;
        const dy = bullet.y - target.y;
        const dist = Math.hypot(dx, dy);
        if (dist < bullet.radius + target.radius) {
          bullet.active = false;
          if (target.isCorrect) {
            target.active = false;
            EventBus.emit('correct-hit', { target });
          } else {
            target.flashWrong();
            EventBus.emit('wrong-hit', { target });
          }
        }
      }
    }
  }
};
