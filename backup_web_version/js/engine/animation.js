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
        // Natural standing leg offsets (prevents overlapping leg bug)
        pose.limbs.leftLeg = 0.18;
        pose.limbs.rightLeg = -0.06;
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
        const dur = attackType === 'heavy' ? 8 : 5;
        
        // Anticipation logic: first 2 frames are wind up
        let progress = 0;
        let windUp = 0;
        if (attackFrame <= 2) {
            windUp = attackFrame / 2;
        } else {
            progress = (attackFrame - 2) / (dur - 2);
        }
        
        const eased = this.easings.easeOut(progress);
        const anticipation = this.easings.easeOut(windUp);
        
        if (progress === 0) {
            // Wind up phase
            pose.rotation = anticipation * -0.15 * (entity.facing || 1); // lean back
            pose.limbs.weaponAngle = anticipation * -Math.PI * 0.15; // pull weapon back
            pose.limbs.rightArm = anticipation * -0.3;
            pose.bodyY = anticipation * 5; // squat slightly
            pose.limbs.leftLeg = anticipation * 0.25;
            pose.limbs.rightLeg = anticipation * -0.15;
        } else {
            // Strike phase
            pose.limbs.weaponAngle = eased * Math.PI * 0.8;
            pose.rotation = eased * 0.25 * (entity.facing || 1); // lean into strike
            pose.limbs.leftLeg = 0.38 * (1 - eased);
            pose.limbs.rightLeg = -0.45 * eased;
            
            if (attackType === 'heavy') {
              pose.scaleX = 1.15;
              pose.scaleY = 0.85; // Heavy squash
              pose.limbs.rightArm = eased * Math.PI * 0.6;
            } else {
              pose.scaleX = 1.05;
              pose.scaleY = 0.95;
              pose.limbs.rightArm = eased * Math.PI * 0.45;
            }
        }
        break;
      }

      case 'hitstun': {
        // Impact jerk instead of shake
        const progress = Math.min(1, (entity.stateTimer || 0) / 0.35);
        const impact = 1 - this.easings.easeOut(progress);
        
        pose.bodyY = impact * 15; // pushed down slightly
        pose.rotation = impact * -0.35 * (entity.facing || 1); // Bend backwards
        pose.scaleX = 1 + (impact * 0.1); 
        pose.scaleY = 1 - (impact * 0.1); // squash
        pose.limbs.leftArm = impact * -0.7;
        pose.limbs.rightArm = impact * -0.5;
        pose.limbs.headAngle = impact * -0.4 * (entity.facing || 1); // Head thrown back
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
        // Defensive crouch leg stance
        pose.limbs.leftLeg = 0.35;
        pose.limbs.rightLeg = -0.22;
        break;
      }

      default:
        break;
    }

    return pose;
  }
}
