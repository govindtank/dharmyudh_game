// ============================================================
// DHARMYUDH - Animation Engine
// ============================================================

import { easeOut, easeInOut } from './config.js';

export class AnimationEngine {
  constructor() {
    this.easings = {
      linear: (t) => t,
      easeOut: easeOut,
      easeInOut: easeInOut,
      easeIn: (t) => t * t,
      elasticOut: (t) => {
        const p = 0.3;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
      },
      bounceOut: (t) => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
      }
    };
  }

  // Generate bone/joint offset coordinates dynamically
  // based on character state, elapsed frames, and speed coefficients
  getPose(state, time, entity = {}) {
    const pose = {
      bodyY: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      limbs: {
        leftLeg: 0,
        rightLeg: 0,
        leftArm: 0,
        rightArm: 0,
        weaponAngle: 0,
        headAngle: 0
      }
    };

    switch (state) {
      case 'idle': {
        // Soft breathing pose
        const f = time * 0.05;
        pose.bodyY = Math.sin(f) * 2.5;
        pose.limbs.headAngle = Math.sin(f) * 0.02;
        pose.limbs.leftArm = Math.sin(f) * 0.05;
        pose.limbs.rightArm = -Math.sin(f) * 0.05;
        // Weapon sway
        pose.limbs.weaponAngle = Math.sin(f * 0.8) * 0.04;
        break;
      }

      case 'walk': {
        // Leg swing loop
        const speed = entity.speed || 150;
        const speedMultiplier = speed / 150;
        const f = time * 0.08 * speedMultiplier;
        pose.bodyY = Math.abs(Math.sin(f)) * -1.5; // slight bobbing
        pose.limbs.leftLeg = Math.sin(f) * 0.45;
        pose.limbs.rightLeg = -Math.sin(f) * 0.45;
        pose.limbs.leftArm = -Math.sin(f) * 0.3;
        pose.limbs.rightArm = Math.sin(f) * 0.3;
        pose.rotation = 0.05 * (entity.facing || 1); // lean forward
        break;
      }

      case 'jump': {
        // Arc-based pose
        const vy = entity.velocityY || 0;
        pose.bodyY = vy * 0.02;
        pose.limbs.leftLeg = 0.15;
        pose.limbs.rightLeg = -0.1;
        pose.limbs.leftArm = -0.3;
        pose.limbs.rightArm = 0.3;
        // Squash & Stretch based on jump velocity
        if (vy < 0) { // Going up
          pose.scaleX = 0.92;
          pose.scaleY = 1.1;
        } else { // Falling
          pose.scaleX = 0.95;
          pose.scaleY = 1.05;
        }
        break;
      }

      case 'attack': {
        const attackFrame = entity.attackFrame || 0;
        const attackType = entity.attackType || 'light';
        const progress = attackFrame / (attackType === 'heavy' ? 8 : 5);
        
        // Easing calculations for swings
        const eased = this.easings.easeOut(progress);
        pose.limbs.weaponAngle = eased * Math.PI * 0.8;
        
        if (attackType === 'heavy') {
          pose.scaleX = 1.15;
          pose.scaleY = 0.85; // Heavy squash
          pose.limbs.rightArm = eased * Math.PI * 0.6;
        } else {
          pose.scaleX = 1.05;
          pose.scaleY = 0.95;
          pose.limbs.rightArm = eased * Math.PI * 0.45;
        }
        break;
      }

      case 'hitstun': {
        // High frequency shake
        const f = time * 0.3;
        pose.bodyY = 0;
        pose.rotation = Math.sin(f) * 0.15;
        pose.scaleX = 0.95;
        pose.scaleY = 1.05;
        pose.limbs.leftArm = -0.4;
        pose.limbs.rightArm = -0.4;
        break;
      }

      case 'knockdown': {
        // Fixed: replaced undefined p with Math.PI
        const t = clamp(entity.stateTimer || 0, 0, 1);
        pose.bodyY = -t * 60;
        pose.rotation = -t * 0.8 * Math.PI * (entity.facing || 1);
        pose.alpha = 1 - t;
        pose.limbs.leftLeg = 0.2;
        pose.limbs.rightLeg = 0.2;
        break;
      }

      case 'block': {
        pose.scaleX = 0.95;
        pose.scaleY = 0.9;
        pose.limbs.leftArm = 0.6; // Raise shield/guard
        pose.limbs.rightArm = 0.2;
        break;
      }

      default:
        break;
    }

    return pose;
  }
}
