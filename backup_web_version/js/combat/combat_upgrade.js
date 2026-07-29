// ============================================================
// DHARMYUDH - Unique Combat Systems (Dharma/Karma Meter, Clash, Juggle, Astras)
// ============================================================

import { CONFIG, clamp, rng } from '../engine/config.js';

export class CombatUpgradeSystem {
  constructor(game) {
    this.game = game;
    
    // Dharma/Karma balance values (-100 = full Adharma/crimson, 100 = full Dharma/gold)
    this.karma = 0; 
    
    // Astra cinematic variables
    this.astraActive = false;
    this.astraTimer = 0;
    this.astraCaster = null;
    this.astraCutsceneProgress = 0;
  }

  // Adjust karma balance based on actions
  adjustKarma(amount) {
    if (this.game.gameMode === 'training') return;
    
    const prevKarma = this.karma;
    this.karma = clamp(this.karma + amount, -100, 100);
    
    // Spawn floating alerts when hitting extreme thresholds
    if (prevKarma < 100 && this.karma === 100) {
      this.game.ui.showToast('DIVINE ASTRA UNLOCKED! (Full Dharma)');
      this.game.audio.playSfx('win', 1.5);
    }
    if (prevKarma > -100 && this.karma === -100) {
      this.game.ui.showToast('DARK ASTRA UNLOCKED! (Full Adharma)');
      this.game.audio.playSfx('death', 1.5);
    }
  }

  update(dt) {
    // Tick active Astra cinematics
    if (this.astraActive) {
      this.astraTimer -= dt;
      this.astraCutsceneProgress = 1.0 - (this.astraTimer / 2.0); // 2 second cinematic time
      
      // Keep game updates frozen during the cinematic cutscene
      this.game.hitStopTimer = 0.1; 
      
      // Dynamic camera zoom during cinematic
      this.game.renderer.cameraZoom = 1.5 + Math.sin(this.astraCutsceneProgress * Math.PI) * 0.4;
      this.game.renderer.triggerShake(5);

      if (this.astraTimer <= 0) {
        this.executeAstraAttack();
      }
    }
  }

  // ─── ASTRA SYSTEM (Divine Ultimates) ────────────────────────
  triggerAstra(caster) {
    if (this.astraActive) return;

    this.astraActive = true;
    this.astraTimer = 2.0; // 2 seconds of cinematic freeze
    this.astraCaster = caster;
    this.astraCutsceneProgress = 0;

    // Dim background & trigger slow motion
    this.game.audio.playSfx('special', 0.5, 2.0);
    this.game.renderer.triggerShake(20);
    
    // Spawn spectacular particle spirals around the caster
    const color = this.karma >= 0 ? '#ffd700' : '#d50000'; // Gold vs Dark Crimson aura
    for (let i = 0; i < 30; i++) {
      this.game.particles.spawn(caster.x, caster.y - 60, {
        type: 'aura',
        color: color,
        speed: rng(150, 300),
        life: 1.5,
        size: rng(15, 30)
      });
    }

    this.game.ui.showToast(`${caster.name.toUpperCase()} SUMMONS THE ASTRA!`);
  }

  executeAstraAttack() {
    this.astraActive = false;
    const caster = this.astraCaster;
    const opp = caster === this.game.player ? this.game.enemy : this.game.player;
    
    // Divine damage math (takes 45% of opponent's total HP)
    const rawDamage = opp.hp * 0.45;
    
    // Screen flash overlay
    this.game.flashEffect = 0.8;
    this.game.audio.playSfx('ko', 1.0, 2.0);
    
    // Trigger launch knockbacks
    opp.takeDamage(rawDamage, caster.facing * 500, -450);
    
    // Giant burst of sparks
    const color = this.karma >= 0 ? '#ffd700' : '#880e4f';
    this.game.particles.spawnHeavyHitSparks(opp.x, opp.y - 50, color);
    
    // Reset karma after summon
    this.karma = 0;
    this.astraCaster = null;
  }

  // ─── WEAPON CLASH SYSTEM ──────────────────────────────────
  checkWeaponClash(p1, p2) {
    // If both players are in the active strike frame of their attacks
    if (p1.attacking && p1.attackFrame === 2 && p2.attacking && p2.attackFrame === 2) {
      const distance = Math.abs(p1.x - p2.x);
      
      // If close enough to strike each other's weapons
      if (distance < 110) {
        // Cancel both attacks
        p1.attacking = false;
        p2.attacking = false;
        p1.attackCooldown = 0.5;
        p2.attackCooldown = 0.5;

        // Apply recoil pushbacks
        p1.velocityX = p1.facing * -200;
        p2.velocityX = p2.facing * -200;

        // Visual spark shower at mid-point
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2 - 40;
        
        this.game.particles.spawnHitSparks(midX, midY, '#ffffff');
        this.game.particles.spawn(midX, midY, { type: 'ring', color: '#ffb300', size: 40 });
        this.game.particles.spawnFloatingText(midX, midY - 30, 'CLASH!', '#ffd700');
        
        // Dynamic slowdown and sound
        this.game.hitStopTimer = 0.15;
        this.game.audio.playSfx('clash');
        this.game.renderer.triggerShake(10);
        
        return true;
      }
    }
    return false;
  }

  // ─── JUGGLE PHYSICS SYSTEM ────────────────────────────────
  applyJuggleForce(entity, knockbackY) {
    // If opponent is already airborne (juggle state)
    if (!entity.grounded) {
      // Reduce vertical force slightly to prevent infinite height launches (damage scaling gravity)
      entity.velocityY = Math.max(-550, entity.velocityY + knockbackY * 0.75);
      entity.velocityX *= 1.1; // push slightly further horizontally
      
      // Spawn float text indicating juggle hit
      this.game.particles.spawnFloatingText(entity.x, entity.y - 90, 'JUGGLE!', '#ffd700');
    }
  }

  // ─── WALL BREAK & STAGE TRANSITIONS ────────────────────────
  checkStageTransition(entity) {
    const minX = 50;
    const maxX = CONFIG.W - 50;
    
    // If character gets slammed into the screen boundaries with massive force
    if ((entity.x <= minX || entity.x >= maxX) && entity.hitstun > 0 && Math.abs(entity.velocityX) > 280) {
      
      // Perform screen transition wall break
      this.game.flashEffect = 0.7;
      this.game.renderer.triggerShake(25);
      this.game.audio.playSfx('heavy');

      // Spawn concrete crumbling debris particles
      for (let i = 0; i < 15; i++) {
        this.game.particles.spawn(entity.x, entity.y - rng(20, 100), {
          type: 'shard',
          color: '#555',
          size: rng(5, 12),
          speed: rng(100, 300)
        });
      }

      // Transition stage coordinates (teleport both players towards center in new stage layer)
      const player = this.game.player;
      const enemy = this.game.enemy;
      
      player.x = CONFIG.W / 2 - 200;
      enemy.x = CONFIG.W / 2 + 200;
      player.velocityX = 0;
      enemy.velocityX = 0;

      // Cycle to a different stage layer visually
      const stages = ['kurukshetra', 'indraprastha', 'hastinapura', 'celestial_realm', 'forest_of_dharma', 'bridge_of_lanka'];
      const currentIdx = stages.indexOf(this.game.stage.currentStage);
      const nextStage = stages[(currentIdx + 1) % stages.length];
      this.game.stage.setStage(nextStage);

      this.game.ui.showToast(`WALL BREAK! STAGE TRANSITION: ${nextStage.toUpperCase()}`);
    }
  }

  // Draw HUD indicators for Karma split balance bar
  drawKarmaHUD(ctx) {
    ctx.save();
    
    // Position split bar at bottom center
    const x = CONFIG.W / 2;
    const y = CONFIG.H - 50;
    const width = 300;
    const height = 10;

    // Draw backing container
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x - width / 2, y, width, height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(x - width / 2, y, width, height);

    // Draw center indicator
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 2, y - 4, 4, height + 8);

    // Split balance rendering
    if (this.karma > 0) {
      // Golden Dharma meter (filled to the right)
      const fillW = (this.karma / 100) * (width / 2);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(x, y + 1, fillW, height - 2);
    } else if (this.karma < 0) {
      // Crimson Adharma meter (filled to the left)
      const fillW = (Math.abs(this.karma) / 100) * (width / 2);
      ctx.fillStyle = '#d50000';
      ctx.fillRect(x - fillW, y + 1, fillW, height - 2);
    }

    // Labeled tags
    ctx.fillStyle = '#d50000';
    ctx.font = 'bold 12px Rajdhani';
    ctx.textAlign = 'right';
    ctx.fillText('ADHARMA', x - width / 2 - 10, y + 9);

    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'left';
    ctx.fillText('DHARMA', x + width / 2 + 10, y + 9);

    ctx.restore();
  }
}
export default CombatUpgradeSystem;
