// ============================================================
// DHARMYUDH - Detailed Character Renderer (Skeletal/Joint-Based)
// ============================================================

import { CONFIG, lerp, clamp } from '../engine/config.js';
import { WarriorMesh3D } from './warrior_mesh_3d.js';

export class CharacterRenderer {
  constructor(animEngine) {
    this.anim = animEngine;
    this.mesh3DMap = new Map();
  }

  /**
   * Draws a detailed mythological warrior using joint-based math (2D + 3D WebGL)
   * @param {CanvasRenderingContext2D} ctx 
   * @param {object} entity The character state/kinematic object
   * @param {object} renderer Optional WebGL renderer reference
   */
  draw(ctx, entity, renderer) {
    if (!entity) return;

    // Get current pose joint offsets from the animation engine
    const pose = this.anim.getPose(entity.state, entity.animTime || 0, entity);

    // 3D Three.js WebGL Rendering
    if (renderer && renderer.isThreeAvailable && renderer.scene) {
      if (!this.mesh3DMap.has(entity)) {
        this.mesh3DMap.set(entity, new WarriorMesh3D(renderer.scene, entity));
      }
      const mesh3D = this.mesh3DMap.get(entity);
      if (mesh3D) {
        mesh3D.update(pose);
      }
    }

    if (!ctx) return;

    ctx.save();
    
    // Global transparency
    ctx.globalAlpha = pose.alpha;

    // Draw dynamic drop shadow (scales based on height)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    const shadowScale = clamp(1 - (CONFIG.GROUND_Y - entity.y) * 0.005, 0.2, 1);
    ctx.beginPath();
    ctx.ellipse(entity.x, CONFIG.GROUND_Y, 35 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Position character center pivot
    ctx.translate(entity.x, entity.y);
    ctx.scale(entity.facing * pose.scaleX, pose.scaleY);
    // Apply general hit-flash styling
    let isFlashing = entity.hitFlash > 0;

    // Retrieve warrior colors
    const colors = entity.colors || {
      skin: '#d4a574', skinShadow: '#b8885a', hair: '#1a1a1a', 
      cloth: '#2a2a3a', clothLight: '#3a3a4a', armor: '#1565c0', 
      armorLight: '#1e88e5', dhoti: '#e8d5b0', dhotiShadow: '#c4a882', 
      gold: '#ffd700', goldShadow: '#c8a000'
    };

    // Render Divine Astra Aura when 100% Karma / Energy Ready
    if (entity.energy >= CONFIG.SPECIAL_COST || entity.specialActive) {
      ctx.save();
      const auraPulse = 0.7 + Math.sin((entity.animTime || 0) * 8) * 0.3;
      const auraGrad = ctx.createRadialGradient(0, -75, 10, 0, -75, 80);
      auraGrad.addColorStop(0, 'rgba(255, 215, 0, ' + (0.5 * auraPulse) + ')');
      auraGrad.addColorStop(0.5, 'rgba(255, 140, 0, ' + (0.3 * auraPulse) + ')');
      auraGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, -75, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Joint anchors relative to character center (scaled for 150px realistic height)
    const headX = 0, headY = -135 + pose.bodyY;
    const neckX = 0, neckY = -120 + pose.bodyY;
    const hipsX = 0, hipsY = -70 + pose.bodyY;
    const shoulderLX = -22, shoulderLY = -110 + pose.bodyY;
    const shoulderRX = 22, shoulderRY = -110 + pose.bodyY;

    // Render components in correct depth layer order (Z-indexing)
    // 1. Back Arm & Back Leg (relative to facing direction)
    this.drawLeg(ctx, hipsX, hipsY, pose.limbs.leftLeg, colors, isFlashing, 'left');
    this.drawArm(ctx, shoulderLX, shoulderLY, pose.limbs.leftArm, colors, isFlashing, 'left');

    // 2. Torso and Armor
    this.drawTorso(ctx, neckX, neckY, hipsX, hipsY, colors, isFlashing, entity);

    // 3. Head, Crown, Hair, Facial details
    this.drawHead(ctx, headX, headY, pose.limbs.headAngle, colors, isFlashing, entity);

    // 4. Front Leg
    this.drawLeg(ctx, hipsX, hipsY, pose.limbs.rightLeg, colors, isFlashing, 'right');

    // 5. Front Arm & Weapon
    this.drawArm(ctx, shoulderRX, shoulderRY, pose.limbs.rightArm, colors, isFlashing, 'right');
    this.drawWeapon(ctx, shoulderRX, shoulderRY, pose.limbs.rightArm, pose.limbs.weaponAngle, entity, colors, isFlashing);

    ctx.restore();
  }

  drawHead(ctx, hx, hy, angle, colors, isFlashing, entity) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle);

    if (isFlashing) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }

    // Hair bun / Jata
    ctx.fillStyle = colors.hair;
    ctx.beginPath();
    ctx.arc(0, -14, 6, 0, Math.PI * 2);
    ctx.fill();

    // Main Head (Tighter human head radius)
    const skinGrad = ctx.createLinearGradient(-11, -11, 11, 11);
    skinGrad.addColorStop(0, colors.skin);
    skinGrad.addColorStop(1, colors.skinShadow);
    ctx.fillStyle = skinGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // Forehead Tilak (Traditional vertical mark)
    ctx.fillStyle = '#ff3b30'; // Red Tilak
    ctx.fillRect(-1.5, -6, 3, 7);
    ctx.fillStyle = '#ffd700'; // Yellow dot
    ctx.beginPath(); ctx.arc(0, 2, 1.5, 0, Math.PI * 2); ctx.fill();

    // Dynamic Facial Expression
    const isHurt = entity && (entity.hitstun > 0 || entity.died);
    const isAttacking = entity && (entity.attacking || entity.specialActive);
    const isVictory = entity && entity.state === 'victory';

    // Eyebrows
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (isAttacking) {
      ctx.moveTo(1, -6); ctx.lineTo(7, -4);
    } else if (isHurt) {
      ctx.moveTo(1, -4); ctx.lineTo(7, -6);
    } else {
      ctx.moveTo(1, -5); ctx.lineTo(7, -5);
    }
    ctx.stroke();

    // Eyes
    ctx.fillStyle = isHurt ? '#ff8a80' : '#ffffff';
    ctx.fillRect(2, -3, 4, 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(isAttacking ? 4 : 3.5, -3, 1.5, 2);

    // Mouth / Expression
    ctx.strokeStyle = '#4a2c11';
    ctx.lineWidth = 1.2;
    if (isHurt) {
      ctx.fillStyle = '#3e2723';
      ctx.beginPath();
      ctx.arc(3, 3, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (isVictory) {
      ctx.beginPath();
      ctx.arc(3, 2, 3, 0.1, Math.PI * 0.9);
      ctx.stroke();
    } else if (isAttacking) {
      ctx.beginPath();
      ctx.moveTo(2, 3);
      ctx.lineTo(6, 4);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(2, 3);
      ctx.lineTo(5, 3);
      ctx.stroke();
    }

    // Ornamented Crown (Mukut)
    ctx.fillStyle = colors.gold;
    ctx.beginPath();
    ctx.moveTo(-12, -7);
    ctx.lineTo(0, -24); // High central peak
    ctx.lineTo(12, -7);
    ctx.lineTo(0, -4);
    ctx.closePath();
    ctx.fill();

    // Crown Jewel
    ctx.fillStyle = colors.armorLight || '#00e5ff';
    ctx.beginPath();
    ctx.arc(0, -13, 2, 0, Math.PI * 2);
    ctx.fill();

    // Gold Earrings (Kundala)
    ctx.fillStyle = colors.gold;
    ctx.beginPath();
    ctx.arc(-11, 3, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawTorso(ctx, nx, ny, hx, hy, colors, isFlashing, entity) {
    ctx.save();

    if (isFlashing) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-22, ny, 44, hy - ny);
      ctx.restore();
      return;
    }

    // Flowing Royal Sash / Uttariya Physics
    if (entity) {
      const time = entity.animTime || 0;
      const moveSway = (entity.velocityX || 0) * 0.05;
      const sashWave = Math.sin(time * 6) * 4 - moveSway * 8;
      
      ctx.fillStyle = colors.clothLight || colors.cloth;
      ctx.beginPath();
      ctx.moveTo(-18, ny + 10);
      ctx.quadraticCurveTo(-26 + sashWave, ny + 35, -20 + sashWave * 1.5, hy + 25);
      ctx.lineTo(-12 + sashWave * 1.5, hy + 25);
      ctx.quadraticCurveTo(-18 + sashWave, ny + 35, -14, ny + 10);
      ctx.closePath();
      ctx.fill();
    }

    // Shoulder Line
    ctx.fillStyle = colors.skin;
    ctx.fillRect(-24, ny, 48, 14);

    // Torso Base (Chest & Abdomen - Tapered athletic human V-shape)
    ctx.fillStyle = colors.cloth;
    ctx.beginPath();
    ctx.moveTo(-22, ny + 12);
    ctx.lineTo(22, ny + 12);
    ctx.lineTo(12, hy);
    ctx.lineTo(-12, hy);
    ctx.closePath();
    ctx.fill();

    // Golden Armor Plate (Kavacha - Tapered contours)
    const armorGrad = ctx.createLinearGradient(-20, ny + 8, 20, hy - 6);
    armorGrad.addColorStop(0, colors.armorLight);
    armorGrad.addColorStop(0.5, colors.armor);
    armorGrad.addColorStop(1, colors.armor);
    ctx.fillStyle = armorGrad;
    
    ctx.beginPath();
    ctx.moveTo(-20, ny + 8);
    ctx.lineTo(20, ny + 8);
    ctx.lineTo(11, hy - 6);
    ctx.lineTo(-11, hy - 6);
    ctx.closePath();
    ctx.fill();

    // Ornamented golden collar/necklace (Har)
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, ny + 8, 9, 0, Math.PI);
    ctx.stroke();

    // Traditional Devanagari seal on breastplate
    ctx.fillStyle = colors.gold;
    ctx.font = 'bold 9px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('ध', 0, ny + 22);

    // Golden Belt (Kamarbandh)
    ctx.fillStyle = colors.gold;
    ctx.fillRect(-13, hy - 6, 26, 6);
    ctx.fillStyle = colors.goldShadow;
    ctx.fillRect(-3, hy - 6, 6, 12); // belt sash

    ctx.restore();
  }

  drawArm(ctx, sx, sy, armAngle, colors, isFlashing, side) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(armAngle);

    if (isFlashing) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, 0, 12, 50);
      ctx.restore();
      return;
    }

    // Shoulder Ornament (Angada / Keyur)
    ctx.fillStyle = colors.gold;
    ctx.fillRect(-8, 0, 16, 6);

    // Upper Arm (Skin) - Anatomical Bicep Curve (Extended for realism)
    const armGrad = ctx.createLinearGradient(-8, 6, 8, 30);
    armGrad.addColorStop(0, colors.skinLight || colors.skin);
    armGrad.addColorStop(1, colors.skinShadow);
    ctx.fillStyle = armGrad;
    ctx.beginPath();
    ctx.moveTo(-6, 6);
    ctx.quadraticCurveTo(-9, 18, -4, 30); // Outer bicep bulge
    ctx.lineTo(4, 30);
    ctx.quadraticCurveTo(7, 18, 5, 6); // Inner arm curve
    ctx.closePath();
    ctx.fill();

    // Elbow Joint (Wrist Band / Kangan)
    ctx.fillStyle = colors.gold;
    ctx.fillRect(-5, 30, 10, 5);

    // Forearm (Extended)
    ctx.fillStyle = armGrad;
    ctx.fillRect(-3.5, 35, 7, 15);

    ctx.restore();
  }

  drawLeg(ctx, hx, hy, legAngle, colors, isFlashing, side) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(legAngle);

    if (isFlashing) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-8, 0, 16, 70);
      ctx.restore();
      return;
    }

    const isBackLeg = side === 'left';

    // Upper Leg w/ pleated Dhoti curves (Extended, shadowed if back leg)
    const dhotiGrad = ctx.createLinearGradient(-12, 0, 12, 35);
    if (isBackLeg) {
      dhotiGrad.addColorStop(0, colors.dhotiShadow);
      dhotiGrad.addColorStop(1, '#857051'); // Darker shade of dhotiShadow
    } else {
      dhotiGrad.addColorStop(0, colors.dhoti);
      dhotiGrad.addColorStop(1, colors.dhotiShadow);
    }
    ctx.fillStyle = dhotiGrad;
    ctx.fillRect(-10, 0, 20, 35);

    // Knee Band
    ctx.fillStyle = isBackLeg ? colors.goldShadow : colors.gold;
    ctx.fillRect(-8, 34, 16, 4);

    // Lower Leg (Skin) - Anatomical Calf Curve (Extended, shadowed if back leg)
    const legGrad = ctx.createLinearGradient(-8, 38, 8, 60);
    if (isBackLeg) {
      legGrad.addColorStop(0, colors.skinShadow);
      legGrad.addColorStop(1, '#8a653f'); // Darker skin shadow
    } else {
      legGrad.addColorStop(0, colors.skinLight || colors.skin);
      legGrad.addColorStop(1, colors.skinShadow);
    }
    ctx.fillStyle = legGrad;
    ctx.beginPath();
    ctx.moveTo(-6, 38);
    ctx.quadraticCurveTo(-11, 48, -5, 60); // Calf muscle bulge
    ctx.lineTo(5, 60);
    ctx.lineTo(5, 38);
    ctx.closePath();
    ctx.fill();

    // Golden Anklet (Payal)
    ctx.fillStyle = isBackLeg ? colors.goldShadow : colors.gold;
    ctx.fillRect(-5, 60, 10, 3);

    // Foot (Realistic horizontal projection)
    ctx.fillStyle = legGrad;
    ctx.fillRect(-5, 63, 14, 7);

    ctx.restore();
  }

  drawWeapon(ctx, sx, sy, armAngle, weaponAngle, entity, colors, isFlashing) {
    const type = entity.weapon || 'Sword';
    
    ctx.save();
    // Translate to arm tip (hand position roughly +50px down rotated arm)
    ctx.translate(sx, sy);
    ctx.rotate(armAngle);
    ctx.translate(0, 50);
    ctx.rotate(weaponAngle);

    if (isFlashing) {
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
    }

    switch (type) {
      case 'Gandiva Bow':
      case 'Vijaya Bow': {
        const isVijaya = type === 'Vijaya Bow';
        const bowColor = isVijaya ? '#ffb300' : colors.gold;

        // Draw Authentic Recurve Bow Arc
        ctx.strokeStyle = bowColor;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(0, -42); // Top tip
        ctx.bezierCurveTo(24, -42, 20, -12, 6, 0); // Top recurve
        ctx.bezierCurveTo(20, 12, 24, 42, 0, 42); // Bottom recurve
        ctx.stroke();

        // Solar Flames / Energy aura on Vijaya
        if (isVijaya) {
          ctx.fillStyle = 'rgba(255, 87, 34, 0.6)';
          ctx.beginPath();
          ctx.arc(0, -42, 5, 0, Math.PI * 2);
          ctx.arc(0, 42, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Glowing Bowstring
        ctx.strokeStyle = isVijaya ? '#ffeb3b' : 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -38);
        ctx.lineTo(0, 38);
        ctx.stroke();

        // Draw Arrow if special or attacking
        if (entity.attacking || entity.specialActive) {
          const arrowColor = isVijaya ? '#ff3d00' : '#00e5ff';
          ctx.strokeStyle = arrowColor;
          ctx.fillStyle = arrowColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-12, 0);
          ctx.lineTo(30, 0); // pointing outwards
          ctx.stroke();

          // Glowing Arrow tip
          ctx.beginPath();
          ctx.moveTo(30, 0);
          ctx.lineTo(22, -5);
          ctx.lineTo(22, 5);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }

      case 'Gada (Mace)':
      case 'Iron Mace': {
        // Shaft
        ctx.strokeStyle = type === 'Gada (Mace)' ? '#4e342e' : '#212121';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(0, -30);
        ctx.stroke();

        // Authentic Heavy Fluted Gada Head
        const headRadius = type === 'Gada (Mace)' ? 19 : 16;
        const gadColor = type === 'Gada (Mace)' ? colors.gold : '#757575';
        const gadShadow = type === 'Gada (Mace)' ? colors.goldShadow : '#424242';
        
        const maceGrad = ctx.createRadialGradient(-5, -38, 5, 0, -35, headRadius);
        maceGrad.addColorStop(0, '#ffffff');
        maceGrad.addColorStop(0.3, gadColor);
        maceGrad.addColorStop(1, gadShadow);
        ctx.fillStyle = maceGrad;
        
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const nx = Math.cos(angle) * headRadius;
          const ny = -35 + Math.sin(angle) * headRadius;
          if (i === 0) ctx.moveTo(nx, ny);
          else ctx.quadraticCurveTo(0, -35, nx, ny);
        }
        ctx.closePath();
        ctx.fill();

        // Spikes on Gada for Bhima / Duryodhana
        ctx.fillStyle = '#ff1744'; // Central Ruby jewel
        ctx.beginPath();
        ctx.arc(0, -35, 4, 0, Math.PI * 2);
        ctx.fill();

        // Top finial
        ctx.fillStyle = gadColor;
        ctx.beginPath();
        ctx.moveTo(-4, -35 - headRadius);
        ctx.lineTo(4, -35 - headRadius);
        ctx.lineTo(0, -48 - headRadius);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'Sword & Shield':
      case 'Sword': {
        // Draw Authentic Curved Talwar/Khanda Blade
        const bladeGrad = ctx.createLinearGradient(-3, -40, 4, 0);
        bladeGrad.addColorStop(0, '#ffffff');
        bladeGrad.addColorStop(1, '#9e9e9e');
        ctx.fillStyle = isFlashing ? '#ffffff' : bladeGrad;
        
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.lineTo(-2, -35); // Straight base
        ctx.quadraticCurveTo(-2, -55, 12, -60); // Distinct Indian sword curve
        ctx.quadraticCurveTo(6, -40, 4, -20); // Inner curve
        ctx.lineTo(3, 0);
        ctx.closePath();
        ctx.fill();

        // Indian Basket Hilt (Hand Guard)
        ctx.fillStyle = colors.gold;
        ctx.fillRect(-8, -2, 16, 4); // Crossguard
        
        ctx.strokeStyle = colors.goldShadow;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 5, 8, Math.PI, Math.PI * 2.5); // Knuckle guard loop
        ctx.stroke();

        ctx.fillStyle = '#4e342e'; // Leather/wood grip
        ctx.fillRect(-2, 2, 4, 10);
        
        // Pommel spike
        ctx.fillStyle = colors.gold;
        ctx.beginPath();
        ctx.arc(0, 13, 3, 0, Math.PI*2);
        ctx.fill();
        break;
      }

      case 'Divine Spear': {
        // Long shaft
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(0, 25);
        ctx.lineTo(0, -60);
        ctx.stroke();

        // Glowing golden spear tip (Vajra-like)
        ctx.fillStyle = colors.gold;
        ctx.beginPath();
        ctx.moveTo(-6, -60);
        ctx.lineTo(0, -84);
        ctx.lineTo(6, -60);
        ctx.lineTo(0, -54);
        ctx.closePath();
        ctx.fill();

        // Small spear banner
        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.moveTo(0, -50);
        ctx.lineTo(-14, -45);
        ctx.lineTo(0, -40);
        ctx.closePath();
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }
}
export default CharacterRenderer;
