// ============================================================
// DHARMYUDH - Detailed Character Renderer (Skeletal/Joint-Based)
// ============================================================

import { CONFIG, lerp, clamp } from '../engine/config.js';

export class CharacterRenderer {
  constructor(animEngine) {
    this.anim = animEngine;
  }

  /**
   * Draws a detailed mythological warrior using joint-based math
   * @param {CanvasRenderingContext2D} ctx 
   * @param {object} entity The character state/kinematic object
   */
  draw(ctx, entity) {
    if (!entity) return;

    // Get current pose joint offsets from the animation engine
    const pose = this.anim.getPose(entity.state, entity.animTime || 0, entity);

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
    this.drawTorso(ctx, neckX, neckY, hipsX, hipsY, colors, isFlashing);

    // 3. Head, Crown, Hair, Facial details
    this.drawHead(ctx, headX, headY, pose.limbs.headAngle, colors, isFlashing);

    // 4. Front Leg
    this.drawLeg(ctx, hipsX, hipsY, pose.limbs.rightLeg, colors, isFlashing, 'right');

    // 5. Front Arm & Weapon
    this.drawArm(ctx, shoulderRX, shoulderRY, pose.limbs.rightArm, colors, isFlashing, 'right');
    this.drawWeapon(ctx, shoulderRX, shoulderRY, pose.limbs.rightArm, pose.limbs.weaponAngle, entity, colors, isFlashing);

    ctx.restore();
  }

  drawHead(ctx, hx, hy, angle, colors, isFlashing) {
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

    // Eyes (Expressive)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, -3, 4, 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(3.5, -3, 2, 2);

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
    ctx.fillStyle = '#00e5ff';
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

  drawTorso(ctx, nx, ny, hx, hy, colors, isFlashing) {
    ctx.save();

    if (isFlashing) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-22, ny, 44, hy - ny);
      ctx.restore();
      return;
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
        // Draw Authentic Recurve Bow Arc
        ctx.strokeStyle = colors.gold;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -36); // Top tip
        ctx.bezierCurveTo(22, -36, 18, -10, 6, 0); // Top recurve
        ctx.bezierCurveTo(18, 10, 22, 36, 0, 36); // Bottom recurve
        ctx.stroke();

        // Draw Bowstring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -32);
        ctx.lineTo(0, 32);
        ctx.stroke();

        // Draw Arrow if special or attacking
        if (entity.attacking || entity.specialActive) {
          ctx.strokeStyle = '#00e5ff';
          ctx.fillStyle = '#00e5ff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-10, 0);
          ctx.lineTo(25, 0); // pointing outwards
          ctx.stroke();

          // Arrow tip
          ctx.beginPath();
          ctx.moveTo(25, 0);
          ctx.lineTo(19, -4);
          ctx.lineTo(19, 4);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }

      case 'Gada (Mace)':
      case 'Iron Mace': {
        // Thick Wooden/Iron Shaft
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.lineTo(0, -28);
        ctx.stroke();

        // Authentic Heavy Fluted Gada Head
        const headRadius = type === 'Gada (Mace)' ? 18 : 15;
        const gadColor = type === 'Gada (Mace)' ? colors.gold : '#757575';
        const gadShadow = type === 'Gada (Mace)' ? colors.goldShadow : '#424242';
        
        const maceGrad = ctx.createRadialGradient(-5, -38, 5, 0, -35, headRadius);
        maceGrad.addColorStop(0, '#ffffff');
        maceGrad.addColorStop(0.3, gadColor);
        maceGrad.addColorStop(1, gadShadow);
        ctx.fillStyle = maceGrad;
        
        // Draw fluted (ribbed) edges for the mace
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const nx = Math.cos(angle) * headRadius;
          const ny = -35 + Math.sin(angle) * headRadius;
          // Rib curves
          if (i === 0) ctx.moveTo(nx, ny);
          else ctx.quadraticCurveTo(0, -35, nx, ny);
        }
        ctx.closePath();
        ctx.fill();

        // Top finial (point)
        ctx.fillStyle = gadColor;
        ctx.beginPath();
        ctx.moveTo(-3, -35 - headRadius);
        ctx.lineTo(3, -35 - headRadius);
        ctx.lineTo(0, -45 - headRadius);
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
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 25);
        ctx.lineTo(0, -60);
        ctx.stroke();

        // Glowing golden spear tip (Vajra-like)
        ctx.fillStyle = colors.gold;
        ctx.beginPath();
        ctx.moveTo(-6, -60);
        ctx.lineTo(0, -82);
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
