// ============================================================
// DHARMYUDH - Dynamic 2D Lighting System
// ============================================================

import { CONFIG, clamp } from '../engine/config.js';

export class LightingSystem {
  constructor(game) {
    this.game = game;
    this.ambientColor = 'rgba(10, 10, 20, 0.4)'; // Night/dusk combat lighting
    this.lights = [];
  }

  addLight(x, y, radius, color, intensity = 1.0) {
    this.lights.push({ x, y, radius, color, intensity });
  }

  clearLights() {
    this.lights = [];
  }

  // Draw lighting masks on the screen
  draw(ctx) {
    const player = this.game.player;
    const enemy = this.game.enemy;

    // 1. Draw Feet Shadows (ambient occlusion) on ground
    if (player && !player.died) {
      this.drawFeetShadow(ctx, player);
    }
    if (enemy && !enemy.died) {
      this.drawFeetShadow(ctx, enemy);
    }

    // 2. Draw Dynamic Glow Auras when specials are active
    if (player && player.specialActive) {
      this.drawCharacterAura(ctx, player, player.color || '#4fc3f7');
    }
    if (enemy && enemy.specialActive) {
      this.drawCharacterAura(ctx, enemy, enemy.color || '#ff5252');
    }

    // 3. Render any manual registered point light sources (sparks, projectiles)
    this.drawPointLights(ctx);
  }

  drawFeetShadow(ctx, entity) {
    ctx.save();
    
    // Shadow scales down as entity jumps higher
    const heightAboveGround = CONFIG.GROUND_Y - entity.y;
    const shadowScale = clamp(1.0 - heightAboveGround / 250, 0.1, 1.0);
    const shadowAlpha = 0.5 * shadowScale;
    
    ctx.translate(entity.x, CONFIG.GROUND_Y);
    ctx.scale(1.0 * shadowScale, 0.25 * shadowScale); // flat ellipse shadow

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
    grad.addColorStop(0, `rgba(0, 0, 0, ${shadowAlpha})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawCharacterAura(ctx, entity, color) {
    ctx.save();
    
    // Switch composition mode to screen for gorgeous light bleed
    ctx.globalCompositeOperation = 'screen';
    
    const timePulse = Math.sin(performance.now() * 0.006) * 10;
    const size = 90 + timePulse;
    
    ctx.translate(entity.x, entity.y - 60); // aura centered on character chest

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    grad.addColorStop(0, color);
    grad.addColorStop(0.3, this.hexToRgba(color, 0.35));
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawPointLights(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (const light of this.lights) {
      const grad = ctx.createRadialGradient(
        light.x, light.y, 0,
        light.x, light.y, light.radius
      );
      grad.addColorStop(0, this.hexToRgba(light.color, light.intensity));
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    this.clearLights(); // clear each frame, dynamically repopulated
  }

  hexToRgba(hex, alpha) {
    // Basic color parsers
    let c = hex.substring(1);
    if (c.length === 3) {
      c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
