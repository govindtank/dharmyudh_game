// ============================================================
// DHARMYUDH - Base Character Class & Physics Engine
// ============================================================

import { CONFIG, clamp } from '../engine/config.js';

export class BaseCharacter {
  constructor(charData, isPlayer) {
    // Stat definitions
    this.id = charData.id;
    this.name = charData.name;
    this.title = charData.title;
    this.color = charData.color;
    this.colorDark = charData.colorDark;
    this.colors = charData.colors;
    this.weapon = charData.weapon;

    // Spread base stats
    this.hp = charData.stats.hp;
    this.speed = charData.stats.speed;
    this.attack = charData.stats.attack;
    this.defense = charData.stats.defense;
    this.specialDmg = charData.stats.specialDmg;
    this.currentHp = this.hp;

    // Kinematics / Physics
    const baseX = isPlayer ? 220 : CONFIG.W - 220;
    this.x = baseX;
    this.y = CONFIG.GROUND_Y;
    this.lastX = baseX;
    this.width = 80;
    this.height = 120;
    
    this.velocityX = 0;
    this.velocityY = 0;
    this.targetVelocityX = 0;
    this.grounded = true;
    this.facing = isPlayer ? 1 : -1;

    // State Machine
    this.state = 'idle'; // 'idle', 'walk', 'jump', 'hitstun', 'knockdown', 'block', 'special'
    this.stateTimer = 0;
    this.animTime = 0;
    
    // Combat Stats
    this.attacking = false;
    this.attackType = 'light'; // 'light', 'heavy', 'special'
    this.attackFrame = 0;
    
    this.energy = 0;
    this.maxEnergy = 100;
    
    this.attackCooldown = 0;
    this.specialCooldown = 0;
    this.dodgeCooldown = 0;
    this.dodgeTimer = 0;
    this.invTimer = 0;
    this.invincible = false;
    this.blocking = false;
    
    this.hitstun = 0;
    this.hitFlash = 0;
    this.died = false;

    // AI Variables
    this.aiState = 'approach';
    this.aiTimer = 0;
    this.aiOppLastAttacking = false;
    this.aiPunishWindow = 0;
  }

  update(dt, opp) {
    this.stateTimer += dt;
    this.animTime += dt * 60; // scale time to typical 60fps frame count

    // Cooldown reductions
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.invTimer = Math.max(0, this.invTimer - dt);
    this.invincible = this.invTimer > 0;
    this.hitstun = Math.max(0, this.hitstun - dt);
    
    this.hitFlash = Math.max(0, this.hitFlash - dt * 5);
    this.energy = Math.min(this.maxEnergy, this.energy + CONFIG.ENERGY_REGEN * dt);

    if (this.hitstun > 0) {
      this.state = 'hitstun';
      // Apply decelerating knockback (only modify velocity here, position updated in core physics)
      this.velocityX *= Math.pow(0.85, dt * 60);
      return;
    }

    if (this.died) {
      this.state = 'knockdown';
      return;
    }

    // Facing direction (auto-face opponent)
    if (!this.attacking) {
      this.facing = opp.x > this.x ? 1 : -1;
    }

    // Determine primary state for animations
    if (!this.grounded) {
      this.state = 'jump';
    } else if (this.blocking) {
      this.state = 'block';
    } else if (this.attacking) {
      this.state = 'attack';
    } else if (Math.abs(this.x - this.lastX) > 2) {
      this.state = 'walk';
    } else {
      this.state = 'idle';
    }

    this.lastX = this.x;
  }

  takeDamage(amount, knockbackX = 0, knockbackY = 0) {
    if (this.invincible || this.died) return { hit: false, blocked: false };

    // Apply defense stat mitigation
    const mitigation = clamp(this.defense / 100, 0, 0.75); // defense mitigates up to 75%
    let damageDealt = amount;

    if (this.blocking) {
      // Direct damage mitigation when blocking
      damageDealt = amount * 0.15; // 85% reduction
      this.velocityX = this.facing * -150; // minor block pushback
      this.hitFlash = 0.1;
      return { hit: true, blocked: true, damage: damageDealt };
    }

    damageDealt = Math.max(1, amount * (1 - mitigation));
    this.currentHp = Math.max(0, this.currentHp - damageDealt);

    // Apply Knockback
    this.velocityX = knockbackX;
    if (knockbackY !== 0) {
      this.velocityY = knockbackY;
      this.grounded = false;
    }

    this.hitstun = knockbackY !== 0 ? 0.6 : 0.25; // longer hitstun on launches
    this.hitFlash = 0.3;

    if (this.currentHp <= 0) {
      this.died = true;
      this.velocityX = this.facing * -250;
      this.velocityY = -350;
      this.grounded = false;
    }

    return { hit: true, blocked: false, damage: damageDealt };
  }
}
export default BaseCharacter;
