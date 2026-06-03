const HEART = '♥';

export class HUD {
  render(ctx, { score, lives, question, streak = 0, multiplier = 1,
                level = 1, questionsCorrect = 0, questionsTotal = 5,
                timeLeft = null, timeLimit = null, speedBonus = 0 }) {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const scale = W / 800; // font/layout scale relative to original 800px width

    ctx.save();

    // Top HUD strip
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
    ctx.fillStyle = '#8899cc';
    ctx.fillText(`LEVEL ${level}`, W / 2, hudH * 0.3);

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

    // Timer bar — appears after grace period expires
    if (timeLimit !== null && timeLeft !== null) {
      const barW = W * 0.5;
      const barH = Math.round(8 * scale);
      const barX = W * 0.25;
      const barY = H * 0.845;
      const ratio = Math.max(0, timeLeft / timeLimit);
      const timerColor = ratio > 0.5 ? '#44cc66' : ratio > 0.25 ? '#ffaa22' : '#ff4444';

      // Fade the whole bar in over the first 0.4s of the timer being visible
      // We approximate this by checking how close timeLeft is to timeLimit
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

      // "Hurry!" nudge when under 3 seconds
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
      ctx.strokeStyle = '#3a5aaa';
      ctx.lineWidth = 2;
      roundRect(ctx, panelX, panelY, panelW, panelH, 10 * scale);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, W / 2, panelY + panelH / 2);

      // Speed bonus indicator above question panel
      if (speedBonus > 0) {
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
}

function roundRect(ctx, x, y, w, h, r) {
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
