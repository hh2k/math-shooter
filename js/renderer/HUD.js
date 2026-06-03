const HEART = '♥';

export class HUD {
  render(ctx, { score, lives, question, streak = 0, multiplier = 1,
                level = 1, questionsCorrect = 0, questionsTotal = 5,
                timeLeft = null, timeLimit = null, speedBonus = 0,
                effects = null, isBoss = false, bossHitsLeft = 0, totalBossHits = 1,
                showSpeedBonus = true }) {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const scale = W / 800;

    ctx.save();

    const hudH = Math.round(H * 0.075);
    ctx.fillStyle = 'rgba(0, 0, 30, 0.75)';
    ctx.fillRect(0, 0, W, hudH);

    const midY = hudH / 2;
    const fs = (n) => `bold ${Math.round(n * scale)}px Segoe UI, Arial`;

    // Lives
    ctx.font = fs(22);
    ctx.textBaseline = 'middle';
    const heartSpacing = Math.round(30 * scale);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < lives ? '#ff4466' : '#333355';
      ctx.fillText(HEART, 16 * scale + i * heartSpacing, midY);
    }

    // Streak multiplier
    if (multiplier > 1) {
      ctx.font = fs(18);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ff9900';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 8;
      ctx.fillText(`x${multiplier}`, 112 * scale, midY);
      ctx.shadowBlur = 0;
    }

    // Level (center top)
    ctx.font = fs(14);
    ctx.textAlign = 'center';
    ctx.fillStyle = isBoss ? '#ff8800' : '#8899cc';
    ctx.fillText(isBoss ? `★ BOSS — LEVEL ${level} ★` : `LEVEL ${level}`, W / 2, hudH * 0.3);

    // Progress dots
    const dotR = Math.round(5 * scale);
    const dotSpacing = Math.round(14 * scale);
    const dotsStartX = W / 2 - ((questionsTotal - 1) * dotSpacing) / 2;
    for (let i = 0; i < questionsTotal; i++) {
      ctx.beginPath();
      ctx.arc(dotsStartX + i * dotSpacing, hudH * 0.72, dotR, 0, Math.PI * 2);
      ctx.fillStyle = i < questionsCorrect ? '#66dd88' : '#1a2a55';
      ctx.fill();
      ctx.strokeStyle = i < questionsCorrect ? '#33bb66' : '#334488';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Score
    ctx.fillStyle = '#ffdd66';
    ctx.font = fs(20);
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${score}`, W - 16 * scale, midY);

    // Effects bar
    if (effects) {
      this._drawEffects(ctx, effects, hudH, scale);
    }

    // Boss HP bar
    if (isBoss && totalBossHits > 0) {
      this._drawBossBar(ctx, W, H, scale, bossHitsLeft, totalBossHits);
    }

    // Timer bar
    if (timeLimit !== null && timeLeft !== null) {
      const barW = W * 0.5;
      const barH = Math.round(8 * scale);
      const barX = W * 0.25;
      const barY = H * 0.845;
      const ratio = Math.max(0, timeLeft / timeLimit);
      const timerColor = ratio > 0.5 ? '#44cc66' : ratio > 0.25 ? '#ffaa22' : '#ff4444';

      const fadeIn = Math.min(1, (timeLimit - timeLeft) / 0.4);
      ctx.globalAlpha = fadeIn;

      ctx.fillStyle = 'rgba(0,0,20,0.6)';
      roundRect(ctx, barX, barY, barW, barH, 4);
      ctx.fill();

      if (ratio > 0) {
        ctx.fillStyle = timerColor;
        ctx.shadowColor = timerColor;
        ctx.shadowBlur = 6 * scale;
        roundRect(ctx, barX, barY, barW * ratio, barH, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (timeLeft <= 3) {
        ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 120) * 0.3;
        ctx.font = fs(15);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff4444';
        ctx.fillText('HURRY!', W / 2, barY - 6 * scale);
      }

      ctx.globalAlpha = 1;
    }

    // Question panel (bottom center)
    if (question) {
      const text = `${question.operandA}  ${question.operator}  ${question.operandB}  =  ?`;
      ctx.font = fs(28);
      ctx.textAlign = 'center';
      const textW = ctx.measureText(text).width;
      const panelW = textW + 48 * scale;
      const panelH = 52 * scale;
      const panelX = W / 2 - panelW / 2;
      const panelY = H * 0.86;

      ctx.fillStyle = 'rgba(10, 20, 60, 0.88)';
      roundRect(ctx, panelX, panelY, panelW, panelH, 10 * scale);
      ctx.fill();
      ctx.strokeStyle = isBoss ? '#884400' : '#3a5aaa';
      ctx.lineWidth = 2;
      roundRect(ctx, panelX, panelY, panelW, panelH, 10 * scale);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, W / 2, panelY + panelH / 2);

      if (showSpeedBonus && speedBonus > 0) {
        const intensity = speedBonus / 200;
        ctx.font = fs(13);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.5 + intensity * 0.5;
        ctx.fillStyle = speedBonus >= 150 ? '#ff9900' : speedBonus >= 80 ? '#ffdd44' : '#aaaaaa';
        ctx.shadowColor = speedBonus >= 100 ? '#ff8800' : 'transparent';
        ctx.shadowBlur = intensity * 10 * scale;
        ctx.fillText(`⚡ +${speedBonus} speed bonus`, W / 2, panelY - 14 * scale);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();
  }

  _drawEffects(ctx, effects, hudH, scale) {
    const icons = [];
    if (effects.freezeLeft > 0)   icons.push({ icon: '❄', color: '#00eeff', label: effects.freezeLeft.toFixed(1) + 's' });
    if (effects.multishotLeft > 0) icons.push({ icon: '⚡', color: '#ff9900', label: effects.multishotLeft.toFixed(1) + 's' });
    if (effects.shieldActive)      icons.push({ icon: '🛡', color: '#44ff88', label: 'ON' });

    if (icons.length === 0) return;

    const barY = hudH + 4 * scale;
    const itemW = 60 * scale;
    let x = 8 * scale;

    ctx.save();
    ctx.font = `bold ${Math.round(12 * scale)}px Segoe UI, Arial`;
    ctx.textBaseline = 'top';

    for (const item of icons) {
      ctx.fillStyle = 'rgba(0,0,30,0.6)';
      roundRect(ctx, x, barY, itemW, 22 * scale, 4 * scale);
      ctx.fill();
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 1.5;
      roundRect(ctx, x, barY, itemW, 22 * scale, 4 * scale);
      ctx.stroke();

      ctx.font = `${Math.round(14 * scale)}px serif`;
      ctx.textAlign = 'left';
      ctx.fillText(item.icon, x + 4 * scale, barY + 4 * scale);

      ctx.font = `bold ${Math.round(11 * scale)}px Segoe UI, Arial`;
      ctx.fillStyle = item.color;
      ctx.textAlign = 'left';
      ctx.fillText(item.label, x + 22 * scale, barY + 5 * scale);

      x += itemW + 6 * scale;
    }
    ctx.restore();
  }

  _drawBossBar(ctx, W, H, scale, hitsLeft, totalHits) {
    const barW = W * 0.6;
    const barH = 14 * scale;
    const barX = W * 0.2;
    const barY = H * 0.815;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,20,0.7)';
    roundRect(ctx, barX, barY, barW, barH, 6 * scale);
    ctx.fill();

    const ratio = Math.max(0, hitsLeft / totalHits);
    if (ratio > 0) {
      const bossGrad = ctx.createLinearGradient(barX, 0, barX + barW * ratio, 0);
      bossGrad.addColorStop(0, '#ff4400');
      bossGrad.addColorStop(1, '#ff8800');
      ctx.fillStyle = bossGrad;
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 8 * scale;
      roundRect(ctx, barX, barY, barW * ratio, barH, 6 * scale);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.font = `bold ${Math.round(10 * scale)}px Segoe UI, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`BOSS HP: ${hitsLeft} / ${totalHits}`, W / 2, barY + barH / 2);

    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 2;
    roundRect(ctx, barX, barY, barW, barH, 6 * scale);
    ctx.stroke();

    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  if (w <= 0 || h <= 0) return;
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
