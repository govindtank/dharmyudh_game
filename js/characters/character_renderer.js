// ============================================================
// DHARMYUDH - Production-Grade Detailed Character Renderer
// ============================================================

import { CONFIG, lerp, clamp } from '../engine/config.js';
import { WarriorMesh3D } from './warrior_mesh_3d.js';

export class CharacterRenderer {
  constructor(animEngine) {
    this.anim = animEngine;
    this.mesh3DMap = new Map();
  }

  /**
   * Draws a detailed mythological warrior with anatomical shading, metallic highlights,
   * customized crowns, cloth dynamics, and weapon motion slash arcs.
   */
  draw(ctx, entity, renderer) {
    if (!entity) return;

    // Get current pose joint offsets from animation engine
    const pose = this.anim.getPose(entity.state, entity.animTime || 0, entity);

    // 3D Three.js WebGL Rendering (if available)
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

    // Dynamic drop shadow (scales based on jump height)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    const shadowScale = clamp(1 - (CONFIG.GROUND_Y - entity.y) * 0.005, 0.2, 1);
    ctx.beginPath();
    ctx.ellipse(entity.x, CONFIG.GROUND_Y, 38 * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Position character center pivot
    ctx.translate(entity.x, entity.y);
    ctx.scale(entity.facing * pose.scaleX, pose.scaleY);

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
      this.drawDivineAura(ctx, entity);
    }

    // Joint anchors relative to character center (150px realistic height)
    const headX = 0, headY = -135 + pose.bodyY;
    const neckX = 0, neckY = -120 + pose.bodyY;
    const hipsX = 0, hipsY = -70 + pose.bodyY;
    const shoulderLX = -24, shoulderLY = -110 + pose.bodyY;
    const shoulderRX = 24, shoulderRY = -110 + pose.bodyY;

    // Render components in depth layer order (Z-indexing):
    // 1. Back Leg & Back Arm
    this.drawLeg(ctx, hipsX, hipsY, pose.limbs.leftLeg, colors, isFlashing, 'left', entity);
    this.drawArm(ctx, shoulderLX, shoulderLY, pose.limbs.leftArm, colors, isFlashing, 'left', entity);

    // 2. Torso, Muscular Contours & Metallic Armor
    this.drawTorso(ctx, neckX, neckY, hipsX, hipsY, colors, isFlashing, entity);

    // 3. Head, Mukut Crown, Hair, Tilak, Facial Details
    this.drawHead(ctx, headX, headY, pose.limbs.headAngle, colors, isFlashing, entity);

    // 4. Front Leg
    this.drawLeg(ctx, hipsX, hipsY, pose.limbs.rightLeg, colors, isFlashing, 'right', entity);

    // 5. Front Arm & Weapon with Motion Slash Arc
    this.drawArm(ctx, shoulderRX, shoulderRY, pose.limbs.rightArm, colors, isFlashing, 'right', entity);
    this.drawWeapon(ctx, shoulderRX, shoulderRY, pose.limbs.rightArm, pose.limbs.weaponAngle, entity, colors, isFlashing);

    ctx.restore();
  }

  /**
   * Draws Divine Astra Energy Aura
   */
  drawDivineAura(ctx, entity) {
    ctx.save();
    const auraPulse = 0.7 + Math.sin((entity.animTime || 0) * 8) * 0.3;
    const isKarna = entity.id === 'karna';
    const isDraupadi = entity.id === 'draupadi';
    const isAshwatthama = entity.id === 'ashwatthama';

    let colorInner = 'rgba(255, 215, 0, ';
    let colorMid = 'rgba(255, 140, 0, ';
    
    if (isKarna) {
      colorInner = 'rgba(255, 235, 59, ';
      colorMid = 'rgba(255, 112, 67, ';
    } else if (isDraupadi) {
      colorInner = 'rgba(255, 61, 0, ';
      colorMid = 'rgba(216, 67, 21, ';
    } else if (isAshwatthama) {
      colorInner = 'rgba(0, 176, 255, ';
      colorMid = 'rgba(1, 87, 155, ';
    }

    const auraGrad = ctx.createRadialGradient(0, -75, 10, 0, -75, 85);
    auraGrad.addColorStop(0, colorInner + (0.6 * auraPulse) + ')');
    auraGrad.addColorStop(0.5, colorMid + (0.35 * auraPulse) + ')');
    auraGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');

    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, -75, 85, 0, Math.PI * 2);
    ctx.fill();

    // Radiant energy sparks
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const angle = (entity.animTime * 0.1 + i * (Math.PI / 2)) % (Math.PI * 2);
      const rx = Math.cos(angle) * (50 + auraPulse * 15);
      const ry = -75 + Math.sin(angle) * (50 + auraPulse * 15);
      ctx.beginPath();
      ctx.arc(rx, ry, 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draws Head, Mukut Crown, Hair, Tilak, and Expressions
   */
  drawHead(ctx, hx, hy, angle, colors, isFlashing, entity) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle);

    if (isFlashing) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }

    const id = entity ? entity.id : 'arjuna';

    // 1. Hair & Bun (Jata)
    ctx.fillStyle = id === 'bhishma' ? '#eceff1' : colors.hair;
    ctx.beginPath();
    ctx.arc(0, -15, 7, 0, Math.PI * 2); // Jata bun
    ctx.fill();

    if (id === 'bhishma') {
      // Long flowing white hair of age
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.quadraticCurveTo(-18, 5, -14, 20);
      ctx.lineTo(-6, 20);
      ctx.quadraticCurveTo(-10, 5, -5, -10);
      ctx.closePath();
      ctx.fill();
    } else if (id === 'draupadi') {
      // Long dark flowing locks
      ctx.beginPath();
      ctx.moveTo(-12, -8);
      ctx.quadraticCurveTo(-22, 10, -18, 30);
      ctx.lineTo(-8, 30);
      ctx.quadraticCurveTo(-12, 10, -5, -8);
      ctx.closePath();
      ctx.fill();
    }

    // 2. Head Shape (Anatomical Jaw & Chin)
    const skinGrad = ctx.createLinearGradient(-12, -12, 12, 12);
    skinGrad.addColorStop(0, colors.skin);
    skinGrad.addColorStop(1, colors.skinShadow);
    ctx.fillStyle = skinGrad;

    ctx.beginPath();
    ctx.arc(0, -2, 11.5, 0, Math.PI * 2);
    ctx.fill();

    // 3. Beards & Facial Hair
    if (id === 'bhishma') {
      // Majestic White Patriarch Beard
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(2, 3);
      ctx.quadraticCurveTo(8, 10, 4, 18);
      ctx.quadraticCurveTo(-2, 18, -4, 5);
      ctx.closePath();
      ctx.fill();
    } else if (id === 'bhima') {
      // Rugged Dark Warrior Beard
      ctx.fillStyle = '#1c1c1c';
      ctx.beginPath();
      ctx.moveTo(1, 4);
      ctx.lineTo(8, 5);
      ctx.lineTo(6, 12);
      ctx.lineTo(0, 11);
      ctx.closePath();
      ctx.fill();
    }

    // 4. Forehead Tilak & Sacred Marks
    if (id === 'ashwatthama') {
      // Glowing Red Forehead Gem (Mani)
      ctx.fillStyle = '#ff1744';
      ctx.beginPath(); ctx.arc(3, -5, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(4, -6, 1.2, 0, Math.PI * 2); ctx.fill(); // Specular shine
    } else {
      // Traditional Red & Gold Devanagari Tilak
      ctx.fillStyle = '#d32f2f'; // Red Tilak line
      ctx.fillRect(-1.5, -7, 3, 7);
      ctx.fillStyle = colors.gold;
      ctx.beginPath(); ctx.arc(0, 1.5, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    // 5. Dynamic Expressions (Eyes & Eyebrows)
    const isHurt = entity && (entity.hitstun > 0 || entity.died);
    const isAttacking = entity && (entity.attacking || entity.specialActive);
    const isVictory = entity && entity.state === 'victory';

    // Eyebrows
    ctx.strokeStyle = colors.hair || '#1a1a1a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (isAttacking) {
      ctx.moveTo(1, -6); ctx.lineTo(8, -3.5); // Angled fierce eyebrow
    } else if (isHurt) {
      ctx.moveTo(1, -3.5); ctx.lineTo(8, -6); // Pained eyebrow
    } else {
      ctx.moveTo(1, -5); ctx.lineTo(8, -5);
    }
    ctx.stroke();

    // Eye Sclera & Iris
    ctx.fillStyle = isHurt ? '#ff8a80' : '#ffffff';
    ctx.fillRect(2.5, -3, 4.5, 2.5);
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(isAttacking ? 4.5 : 4, -3, 1.8, 2.5);

    // Mouth Expression
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.3;
    if (isHurt) {
      ctx.fillStyle = '#261c14';
      ctx.beginPath(); ctx.arc(4, 3.5, 2, 0, Math.PI * 2); ctx.fill();
    } else if (isVictory) {
      ctx.beginPath(); ctx.arc(4, 2.5, 3.5, 0.1, Math.PI * 0.9); ctx.stroke();
    } else if (isAttacking) {
      ctx.beginPath(); ctx.moveTo(2, 4); ctx.lineTo(7, 5); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(2.5, 3.5); ctx.lineTo(6, 3.5); ctx.stroke();
    }

    // 6. Ornamented Crown (Mukut) with Metallic Gold & Gems
    const mukutGrad = ctx.createLinearGradient(-14, -8, 14, -28);
    mukutGrad.addColorStop(0, colors.gold);
    mukutGrad.addColorStop(0.5, '#fff176'); // Metallic shine
    mukutGrad.addColorStop(1, colors.goldShadow);
    ctx.fillStyle = mukutGrad;

    ctx.beginPath();
    ctx.moveTo(-13, -7);
    ctx.lineTo(-4, -18);
    ctx.lineTo(0, -28); // High central peak
    ctx.lineTo(4, -18);
    ctx.lineTo(13, -7);
    ctx.lineTo(0, -4);
    ctx.closePath();
    ctx.fill();

    // Mukut Bevel Highlights
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -28); ctx.lineTo(0, -4);
    ctx.stroke();

    // Crown Jewel Centerpiece
    ctx.fillStyle = colors.armorLight || '#00e5ff';
    ctx.beginPath(); ctx.arc(0, -14, 2.5, 0, Math.PI * 2); ctx.fill();

    // ARJUNA'S MAYUR PANKH (PEACOCK FEATHER)
    if (id === 'arjuna') {
      ctx.save();
      ctx.translate(0, -28);
      ctx.rotate(-0.25);
      
      // Feather stem
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-12, -22); ctx.stroke();

      // Feather Eye Spot (Iridescent Teal/Emerald/Gold)
      const featherGrad = ctx.createRadialGradient(-12, -22, 1, -12, -22, 8);
      featherGrad.addColorStop(0, '#00b0ff'); // Deep blue core
      featherGrad.addColorStop(0.4, '#00e676'); // Emerald green
      featherGrad.addColorStop(0.8, '#ffd700'); // Gold rim
      featherGrad.addColorStop(1, 'rgba(0, 230, 118, 0)');

      ctx.fillStyle = featherGrad;
      ctx.beginPath();
      ctx.ellipse(-12, -22, 6, 9, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Gold Kundal Earrings
    ctx.fillStyle = colors.gold;
    ctx.beginPath(); ctx.arc(-12, 3, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  /**
   * Draws Torso, Muscular Contours, Metallic Armor (Kavacha), and Sashes
   */
  drawTorso(ctx, nx, ny, hx, hy, colors, isFlashing, entity) {
    ctx.save();

    if (isFlashing) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-22, ny, 44, hy - ny);
      ctx.restore();
      return;
    }

    const id = entity ? entity.id : 'arjuna';

    // 1. Flowing Royal Sash (Uttariya) Physics
    if (entity) {
      const time = entity.animTime || 0;
      const moveSway = (entity.velocityX || 0) * 0.05;
      const sashWave = Math.sin(time * 6) * 4 - moveSway * 8;
      
      ctx.fillStyle = colors.clothLight || colors.cloth;
      ctx.beginPath();
      ctx.moveTo(-18, ny + 10);
      ctx.quadraticCurveTo(-28 + sashWave, ny + 35, -22 + sashWave * 1.5, hy + 30);
      ctx.lineTo(-14 + sashWave * 1.5, hy + 30);
      ctx.quadraticCurveTo(-20 + sashWave, ny + 35, -14, ny + 10);
      ctx.closePath();
      ctx.fill();
    }

    // 2. Neck & Shoulder Base (Anatomical Trapezius)
    const skinGrad = ctx.createLinearGradient(-24, ny, 24, ny + 14);
    skinGrad.addColorStop(0, colors.skin);
    skinGrad.addColorStop(1, colors.skinShadow);
    ctx.fillStyle = skinGrad;
    ctx.fillRect(-24, ny, 48, 14);

    // 3. Tapered Athletic V-Torso (Cloth Base)
    ctx.fillStyle = colors.cloth;
    ctx.beginPath();
    ctx.moveTo(-23, ny + 12);
    ctx.lineTo(23, ny + 12);
    ctx.lineTo(13, hy);
    ctx.lineTo(-13, hy);
    ctx.closePath();
    ctx.fill();

    // 4. Golden/Metallic Armor Plate (Kavacha) with Specular Bevels
    const armorGrad = ctx.createLinearGradient(-22, ny + 8, 22, hy - 6);
    if (id === 'karna') {
      armorGrad.addColorStop(0, '#ffffff'); // Radiant Sun Kavach
      armorGrad.addColorStop(0.3, colors.gold);
      armorGrad.addColorStop(1, colors.goldShadow);
    } else if (id === 'bhishma') {
      armorGrad.addColorStop(0, '#ffffff'); // Silver Patriarch Kavach
      armorGrad.addColorStop(0.5, '#cfd8dc');
      armorGrad.addColorStop(1, '#90a4ae');
    } else {
      armorGrad.addColorStop(0, colors.armorLight);
      armorGrad.addColorStop(0.6, colors.armor);
      armorGrad.addColorStop(1, colors.armor);
    }
    ctx.fillStyle = armorGrad;
    
    ctx.beginPath();
    ctx.moveTo(-21, ny + 8);
    ctx.lineTo(21, ny + 8);
    ctx.lineTo(12, hy - 6);
    ctx.lineTo(-12, hy - 6);
    ctx.closePath();
    ctx.fill();

    // Anatomical Pectoral & Abdominal Contour Lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1.2;
    // Pectoral split line
    ctx.beginPath(); ctx.moveTo(0, ny + 10); ctx.lineTo(0, hy - 10); ctx.stroke();
    // Pectoral bottom curves
    ctx.beginPath(); ctx.arc(-7, ny + 20, 6, 0, Math.PI * 0.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(7, ny + 20, 6, Math.PI * 0.2, Math.PI); ctx.stroke();

    // Specular Shine Strip
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-16, ny + 12);
    ctx.lineTo(-8, hy - 12);
    ctx.stroke();

    // Ornamented Necklace (Har)
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, ny + 8, 10, 0, Math.PI);
    ctx.stroke();

    // Golden Belt (Kamarbandh)
    ctx.fillStyle = colors.gold;
    ctx.fillRect(-14, hy - 6, 28, 6);
    ctx.fillStyle = colors.goldShadow;
    ctx.fillRect(-3, hy - 6, 6, 14); // Central sash drop

    ctx.restore();
  }

  /**
   * Draws Arm (Upper arm bicep, wrist band, forearm)
   */
  drawArm(ctx, sx, sy, armAngle, colors, isFlashing, side, entity) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(armAngle);

    if (isFlashing) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, 0, 12, 52);
      ctx.restore();
      return;
    }

    // Shoulder Pauldron Ornament (Angada / Keyur)
    const pauldronGrad = ctx.createLinearGradient(-9, 0, 9, 8);
    pauldronGrad.addColorStop(0, colors.gold);
    pauldronGrad.addColorStop(1, colors.goldShadow);
    ctx.fillStyle = pauldronGrad;
    ctx.fillRect(-9, 0, 18, 7);

    // Anatomical Bicep Bulge (Skin)
    const armGrad = ctx.createLinearGradient(-8, 7, 8, 32);
    armGrad.addColorStop(0, colors.skin);
    armGrad.addColorStop(1, colors.skinShadow);
    ctx.fillStyle = armGrad;

    ctx.beginPath();
    ctx.moveTo(-6, 7);
    ctx.quadraticCurveTo(-10, 19, -4.5, 32); // Outer bicep curve
    ctx.lineTo(4.5, 32);
    ctx.quadraticCurveTo(8, 19, 5.5, 7);
    ctx.closePath();
    ctx.fill();

    // Wrist Guard (Bazu-Band / Kangan)
    ctx.fillStyle = colors.gold;
    ctx.fillRect(-5.5, 32, 11, 6);

    // Forearm & Hand
    ctx.fillStyle = armGrad;
    ctx.fillRect(-4, 38, 8, 14);

    ctx.restore();
  }

  /**
   * Draws Leg (Dhoti folds, knee band, calf muscle, payal anklet, foot)
   */
  drawLeg(ctx, hx, hy, legAngle, colors, isFlashing, side, entity) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(legAngle);

    if (isFlashing) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-9, 0, 18, 72);
      ctx.restore();
      return;
    }

    const isBackLeg = side === 'left';

    // Upper Leg w/ Pleated Silk Dhoti
    const dhotiGrad = ctx.createLinearGradient(-12, 0, 12, 38);
    if (isBackLeg) {
      dhotiGrad.addColorStop(0, colors.dhotiShadow);
      dhotiGrad.addColorStop(1, '#756044');
    } else {
      dhotiGrad.addColorStop(0, colors.dhoti);
      dhotiGrad.addColorStop(1, colors.dhotiShadow);
    }
    ctx.fillStyle = dhotiGrad;
    ctx.fillRect(-11, 0, 22, 38);

    // Pleated Cloth Fold Lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-5, 2); ctx.lineTo(-2, 36);
    ctx.moveTo(3, 2); ctx.lineTo(5, 36);
    ctx.stroke();

    // Knee Band
    ctx.fillStyle = isBackLeg ? colors.goldShadow : colors.gold;
    ctx.fillRect(-9, 37, 18, 4);

    // Lower Leg Anatomical Calf Muscle (Skin)
    const legGrad = ctx.createLinearGradient(-8, 41, 8, 62);
    if (isBackLeg) {
      legGrad.addColorStop(0, colors.skinShadow);
      legGrad.addColorStop(1, '#7a5735');
    } else {
      legGrad.addColorStop(0, colors.skin);
      legGrad.addColorStop(1, colors.skinShadow);
    }
    ctx.fillStyle = legGrad;

    ctx.beginPath();
    ctx.moveTo(-6.5, 41);
    ctx.quadraticCurveTo(-12, 51, -5.5, 63); // Calf muscle bulge
    ctx.lineTo(5.5, 63);
    ctx.lineTo(5.5, 41);
    ctx.closePath();
    ctx.fill();

    // Golden Anklet (Payal / Nupur)
    ctx.fillStyle = isBackLeg ? colors.goldShadow : colors.gold;
    ctx.fillRect(-5.5, 63, 11, 3.5);

    // Foot (Horizontal projection)
    ctx.fillStyle = legGrad;
    ctx.fillRect(-5.5, 66.5, 15, 7.5);

    ctx.restore();
  }

  /**
   * Draws Mythological Weapon Models & Motion Slash Arc Trails
   */
  drawWeapon(ctx, sx, sy, armAngle, weaponAngle, entity, colors, isFlashing) {
    const type = entity.weapon || 'Sword';
    
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(armAngle);
    ctx.translate(0, 52); // Hand position
    ctx.rotate(weaponAngle);

    if (isFlashing) {
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
    }

    // Dynamic Weapon Motion Slash Arc (Drawn when attacking)
    if (entity.attacking) {
      ctx.save();
      const trailGrad = ctx.createLinearGradient(0, 0, 50, -60);
      trailGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      trailGrad.addColorStop(0.5, entity.color || colors.gold);
      trailGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');

      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.arc(0, -10, 65, -Math.PI * 0.6, Math.PI * 0.35, false);
      ctx.lineTo(0, -10);
      ctx.fill();
      ctx.restore();
    }

    switch (type) {
      case 'Gandiva Bow':
      case 'Vijaya Bow': {
        const isVijaya = type === 'Vijaya Bow';
        const bowColor = isVijaya ? '#ffb300' : colors.gold;

        // Recurve Bow Arc
        ctx.strokeStyle = bowColor;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, -45);
        ctx.bezierCurveTo(26, -45, 22, -12, 7, 0);
        ctx.bezierCurveTo(22, 12, 26, 45, 0, 45);
        ctx.stroke();

        // Glowing Bowstring
        ctx.strokeStyle = isVijaya ? '#ffff8d' : 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(0, 40); ctx.stroke();

        // Arrow
        if (entity.attacking || entity.specialActive) {
          const arrowColor = isVijaya ? '#ff3d00' : '#00e5ff';
          ctx.strokeStyle = arrowColor;
          ctx.fillStyle = arrowColor;
          ctx.lineWidth = 3.5;
          ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(32, 0); ctx.stroke();

          // Arrow tip
          ctx.beginPath();
          ctx.moveTo(32, 0); ctx.lineTo(23, -5.5); ctx.lineTo(23, 5.5);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }

      case 'Gada (Mace)':
      case 'Iron Mace': {
        // Wooden/Iron Shaft
        ctx.strokeStyle = type === 'Gada (Mace)' ? '#4e342e' : '#212121';
        ctx.lineWidth = 5.5;
        ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(0, -32); ctx.stroke();

        // Fluted Heavy Gada Head
        const headRadius = type === 'Gada (Mace)' ? 20 : 17;
        const gadColor = type === 'Gada (Mace)' ? colors.gold : '#757575';
        const gadShadow = type === 'Gada (Mace)' ? colors.goldShadow : '#424242';
        
        const maceGrad = ctx.createRadialGradient(-6, -40, 4, 0, -36, headRadius);
        maceGrad.addColorStop(0, '#ffffff');
        maceGrad.addColorStop(0.35, gadColor);
        maceGrad.addColorStop(1, gadShadow);
        ctx.fillStyle = maceGrad;
        
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const nx = Math.cos(angle) * headRadius;
          const ny = -36 + Math.sin(angle) * headRadius;
          if (i === 0) ctx.moveTo(nx, ny);
          else ctx.quadraticCurveTo(0, -36, nx, ny);
        }
        ctx.closePath();
        ctx.fill();

        // Central Ruby Jewel
        ctx.fillStyle = '#ff1744';
        ctx.beginPath(); ctx.arc(0, -36, 4.5, 0, Math.PI * 2); ctx.fill();

        // Finial Spike
        ctx.fillStyle = gadColor;
        ctx.beginPath();
        ctx.moveTo(-4, -36 - headRadius);
        ctx.lineTo(4, -36 - headRadius);
        ctx.lineTo(0, -50 - headRadius);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'Sword & Shield':
      case 'Sword': {
        // Curved Rajput Talwar / Khanda Blade
        const bladeGrad = ctx.createLinearGradient(-3, -42, 5, 0);
        bladeGrad.addColorStop(0, '#ffffff');
        bladeGrad.addColorStop(0.4, '#e0e0e0');
        bladeGrad.addColorStop(1, '#9e9e9e');
        ctx.fillStyle = isFlashing ? '#ffffff' : bladeGrad;
        
        ctx.beginPath();
        ctx.moveTo(-2.5, 0);
        ctx.lineTo(-2.5, -38);
        ctx.quadraticCurveTo(-2.5, -58, 13, -64); // Indian talwar curve
        ctx.quadraticCurveTo(7, -42, 4.5, -20);
        ctx.lineTo(3.5, 0);
        ctx.closePath();
        ctx.fill();

        // Basket Hilt (Hand Guard)
        ctx.fillStyle = colors.gold;
        ctx.fillRect(-9, -2, 18, 4.5);
        
        ctx.strokeStyle = colors.goldShadow;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 5, 8.5, Math.PI, Math.PI * 2.5);
        ctx.stroke();

        ctx.fillStyle = '#3e2723';
        ctx.fillRect(-2.5, 2, 5, 11);
        
        // Pommel
        ctx.fillStyle = colors.gold;
        ctx.beginPath(); ctx.arc(0, 14, 3.5, 0, Math.PI * 2); ctx.fill();
        break;
      }

      case 'Divine Spear': {
        // Long Shaft
        ctx.strokeStyle = '#4e342e';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(0, -65); ctx.stroke();

        // Golden Spear Tip
        ctx.fillStyle = colors.gold;
        ctx.beginPath();
        ctx.moveTo(-7, -65);
        ctx.lineTo(0, -90);
        ctx.lineTo(7, -65);
        ctx.lineTo(0, -58);
        ctx.closePath();
        ctx.fill();

        // Fluttering Silk Spear Banner
        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.moveTo(0, -54);
        ctx.lineTo(-16, -48);
        ctx.lineTo(0, -42);
        ctx.closePath();
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }
}
export default CharacterRenderer;
