// ============================================================
// DHARMYUDH - Screen Visual Effects
// ============================================================

import { CONFIG, clamp } from '../engine/config.js';

export class ScreenEffectsSystem {
  constructor(game) {
    this.game = game;
  }

  // Freeze time temporarily on hit to sell kinetic impact ("hit stop")
  triggerHitStop(type = 'light') {
    let duration = 0.06;
    if (type === 'heavy') duration = 0.12;
    if (type === 'special') duration = 0.18;
    this.game.hitStopTimer = duration;
  }

  // Dynamic dramatic time slowdown
  triggerSlowMo(duration = 0.4) {
    this.game.slowMo = duration;
  }

  // KO dramatic screen flash
  triggerKoFlash() {
    this.game.koFlash = 1.0;
    this.game.renderer.triggerShake(35);
    this.triggerSlowMo(1.5);
    this.game.koFreezeTimer = 0.5; // Freeze loop briefly
  }

  // Render high-action overlays on canvas (e.g. speed lines when special is charging)
  draw(ctx) {
    const player = this.game.player;
    const enemy = this.game.enemy;

    // Draw speed lines if either character is launching a special
    const isSpecialActive = (player && player.specialActive && player.specialTimer > 0.4) || 
                            (enemy && enemy.specialActive && enemy.specialTimer > 0.4);

    if (isSpecialActive) {
      this.drawSpeedLines(ctx);
    }
  }

  drawSpeedLines(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;

    const centerX = CONFIG.W / 2;
    const centerY = CONFIG.H / 2;
    const radius = 600;

    // Draw radial motion lines converging on screen center
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const startDist = radius + Math.random() * 200;
      const endDist = radius - Math.random() * 300;

      const sx = centerX + Math.cos(angle) * startDist;
      const sy = centerY + Math.sin(angle) * startDist;
      const ex = centerX + Math.cos(angle) * endDist;
      const ey = centerY + Math.sin(angle) * endDist;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }

    ctx.restore();
  }
}
