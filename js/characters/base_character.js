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
    this.taunts = [charData.taunt, charData.taunt2, charData.taunt3, charData.taunt4].filter(Boolean);

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
    this.hasHit = false; // Track if current attack already connected
    
    this.energy = 0;
    this.maxEnergy = 100;
    
    this.attackCooldown = 0;
    this.specialCooldown = 0;
    this.dodgeCooldown = 0;
    this.dodgeTimer = 0;
    this.invTimer = 0;
    this.invincible = false;
    this.blocking = false;
    
    this.tauntCooldown = 0;
    
    this.hitstun = 0;
    this.hitFlash = 0;
    this.died = false;

    // AI Variables
    this.aiState = 'approach';
    this.aiTimer = 0;
    this.aiOppLastAttacking = false;
    this.aiPunishWindow = 0;

    // ─── PASSIVE SYSTEM ──────────────────────────────────
    this.passive = charData.passive || null;
    this.passiveData = {};

    // Initialize passive-tracking state based on passive ID
    this._initPassiveState();
  }

  _initPassiveState() {
    if (!this.passive) return;

    switch (this.passive.id) {
      case 'gandiva_precision':
        this.passiveData.consecutiveLights = 0;
        break;
      case 'vayu_wrath':
        break; // Passive is applied via multipliers in damage calculation
      case 'solar_kavach':
        this.passiveData.regenTimer = 0;
        this.passiveData.damageReduction = 0.15;
        break;
      case 'indomitable_will':
        break; // Checked dynamically when HP < 30%
      case 'blade_dance':
        break; // Cooldown reduction applied in update()
      case 'dharma_aura':
        this.passiveData.regenTimer = 0;
        this.passiveData.regenInterval = 2.0;
        break;
      case 'chakravyuha_tactician':
        this.passiveData.roundFirstHitLanded = false;
        break;
      case 'immortal_resolve':
        this.passiveData.immortalUsed = false;
        break;
      case 'sacred_flame':
        this.passiveData.vengeanceStacks = 0;
        this.passiveData.maxVengeanceStacks = 5;
        break;
      case 'vow_of_protection':
        this.passiveData.tauntHealUsed = false;
        this.passiveData.blockAbsorption = 0.92;
        break;
    }
  }

  // Reset round-specific passive state (called at round start)
  resetRoundPassive() {
    if (!this.passive) return;

    switch (this.passive.id) {
      case 'chakravyuha_tactician':
        this.passiveData.roundFirstHitLanded = false;
        break;
      case 'vow_of_protection':
        this.passiveData.tauntHealUsed = false;
        break;
    }
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
    this.tauntCooldown = Math.max(0, this.tauntCooldown - dt);
    
    this.hitFlash = Math.max(0, this.hitFlash - dt * 5);
    this.energy = Math.min(this.maxEnergy, this.energy + CONFIG.ENERGY_REGEN * dt);

    // ─── PASSIVE EFFECTS ────────────────────────────────
    this._updatePassive(dt);

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
      // Advance attack frames based on dt (equivalent to ~22fps or 45ms per frame)
      this.attackFrame += dt * (1000 / 45);
      const dur = this.attackType === 'heavy' ? 8 : (this.attackType === 'special' ? 10 : 5);
      if (this.attackFrame >= dur) {
        this.attacking = false;
        this.specialActive = false;
        this.hasHit = false;
      }
    } else if (Math.abs(this.x - this.lastX) > 2) {
      this.state = 'walk';
    } else {
      this.state = 'idle';
    }

    this.lastX = this.x;
  }

  _updatePassive(dt) {
    if (!this.passive) return;

    switch (this.passive.id) {
      case 'blade_dance': {
        // Light attack cooldown reduced by 25%
        // We apply ahead-of-time by reducing the cooldown timer faster,
        // and affecting attackCooldown set by caller
        break;
      }
      case 'solar_kavach': {
        // Regenerate 3 HP every 5 seconds
        this.passiveData.regenTimer += dt;
        if (this.passiveData.regenTimer >= 5.0 && this.currentHp > 0 && this.currentHp < this.hp) {
          this.currentHp = Math.min(this.hp, this.currentHp + 3);
          this.passiveData.regenTimer = 0;
        }
        break;
      }
      case 'dharma_aura': {
        // Regenerate 1 HP every 2 seconds
        if (this.currentHp > 0 && this.currentHp < this.hp) {
          this.passiveData.regenTimer += dt;
          if (this.passiveData.regenTimer >= this.passiveData.regenInterval) {
            this.currentHp = Math.min(this.hp, this.currentHp + 1);
            this.passiveData.regenTimer = 0;
          }
        }
        break;
      }
      case 'indomitable_will': {
        // Faster hitstun recovery when below 30% HP - applied in core.js
        break;
      }
    }
  }

  takeDamage(amount, knockbackX = 0, knockbackY = 0) {
    if (this.invincible || this.died) return { hit: false, blocked: false };

    // Apply defensive mitigation from stats
    let mitigation = clamp(this.defense / 100, 0, 0.75); // defense mitigates up to 75%
    let damageDealt = amount;

    // ─── PASSIVE DAMAGE MODIFIERS ───────────────────────
    // Solar Kavach: 15% damage reduction
    if (this.passive && this.passive.id === 'solar_kavach') {
      mitigation = Math.min(0.75, mitigation + this.passiveData.damageReduction);
    }

    // Vow of Protection: improved block absorption
    let blockMitigation = 0.85; // default 85% reduction
    if (this.passive && this.passive.id === 'vow_of_protection') {
      blockMitigation = this.passiveData.blockAbsorption;
    }

    if (this.blocking) {
      damageDealt = amount * (1 - blockMitigation); // improved blocking
      this.velocityX = this.facing * -150; // minor block pushback
      this.hitFlash = 0.1;
      return { hit: true, blocked: true, damage: damageDealt };
    }

    damageDealt = Math.max(1, amount * (1 - mitigation));
    this.currentHp = Math.max(0, this.currentHp - damageDealt);

    // ─── IMMORTAL RESOLVE PASSIVE ─────────────────────
    if (this.currentHp <= 0 && this.passive && this.passive.id === 'immortal_resolve' && !this.passiveData.immortalUsed) {
      this.passiveData.immortalUsed = true;
      this.currentHp = 1; // Survive with 1 HP!
      // Trigger massive knockback on attacker (handled via returned flag)
      return { hit: true, blocked: false, damage: damageDealt, immortalSaved: true, knockbackForce: knockbackX * 2 };
    }

    // ─── DRAUPADI'S SACRED FLAME ──────────────────────
    // When Draupadi takes damage, she gains vengeance stacks
    if (this.passive && this.passive.id === 'sacred_flame' && this.currentHp > 0) {
      this.passiveData.vengeanceStacks = Math.min(
        this.passiveData.maxVengeanceStacks,
        this.passiveData.vengeanceStacks + 1
      );
    }

    // Apply Knockback
    this.velocityX = knockbackX;
    if (knockbackY !== 0) {
      this.velocityY = knockbackY;
      this.grounded = false;
    }

    // Indomitable Will: faster hitstun recovery when below 30% HP
    if (this.passive && this.passive.id === 'indomitable_will' && this.currentHp < this.hp * 0.3) {
      this.hitstun = (knockbackY !== 0 ? 0.6 : 0.25) * 0.7; // 30% faster recovery
    } else {
      this.hitstun = knockbackY !== 0 ? 0.6 : 0.25; // longer hitstun on launches
    }

    this.hitFlash = 0.3;

    if (this.currentHp <= 0) {
      this.died = true;
      this.velocityX = this.facing * -250;
      this.velocityY = -350;
      this.grounded = false;
    }

    return { hit: true, blocked: false, damage: damageDealt };
  }

  // Get attack damage bonus from passives
  getDamageBonus(attackType) {
    if (!this.passive) return 1.0;

    let bonus = 1.0;

    switch (this.passive.id) {
      case 'gandiva_precision':
        // Every 3rd light attack during combo deals extra 25% damage
        if (attackType === 'light' && this.passiveData.consecutiveLights >= 2) {
          bonus = 1.25;
        }
        break;
      case 'vayu_wrath':
        // Heavy attacks deal 25% more damage
        if (attackType === 'heavy') {
          bonus = 1.25;
        }
        break;
      case 'indomitable_will':
        // Below 30% HP: +20% damage
        if (this.currentHp < this.hp * 0.3) {
          bonus = 1.20;
        }
        break;
      case 'dharma_aura':
        // Special attacks deal 15% more damage
        if (attackType === 'special') {
          bonus = 1.15;
        }
        break;
      case 'chakravyuha_tactician':
        // First hit of round deals +30% damage
        if (!this.passiveData.roundFirstHitLanded) {
          bonus = 1.30;
        }
        break;
      case 'sacred_flame':
        // Vengeance stacks increase next attack damage
        if (this.passiveData.vengeanceStacks > 0) {
          bonus = 1.0 + (this.passiveData.vengeanceStacks * 0.06);
          // Reset stacks on landing a hit
          this.passiveData.vengeanceStacks = 0;
        }
        break;
    }

    return bonus;
  }

  // Get knockback multiplier from passives
  getKnockbackBonus(attackType) {
    if (!this.passive) return 1.0;
    if (this.passive.id === 'vayu_wrath' && attackType === 'heavy') {
      return 1.4; // 40% more knockback on heavy attacks
    }
    return 1.0;
  }

  // Get attack cooldown multiplier from passives
  getCooldownMultiplier(attackType) {
    if (!this.passive) return 1.0;
    if (this.passive.id === 'blade_dance' && attackType === 'light') {
      return 0.75; // 25% faster cooldown
    }
    if (this.passive.id === 'blade_dance') {
      return 0.8; // 20% faster dodge cooldown (applied globally for dodge)
    }
    return 1.0;
  }

  // Called when the character lands a hit (for passive tracking)
  onHitLanded(attackType) {
    if (!this.passive) return;

    switch (this.passive.id) {
      case 'gandiva_precision':
        if (attackType === 'light') {
          this.passiveData.consecutiveLights = (this.passiveData.consecutiveLights + 1) % 3;
        } else {
          this.passiveData.consecutiveLights = 0; // Reset on non-light
        }
        break;
      case 'chakravyuha_tactician':
        this.passiveData.roundFirstHitLanded = true;
        break;
      case 'sacred_flame':
        // Track if max stacks consumed for visual effect
        this.passiveData.vengeanceJustTriggered = this.passiveData.vengeanceStacks >= this.passiveData.maxVengeanceStacks;
        // Stacks consumed in getDamageBonus, but we reset here as fallback
        this.passiveData.vengeanceStacks = 0;
        break;
    }
  }
}
export default BaseCharacter;
