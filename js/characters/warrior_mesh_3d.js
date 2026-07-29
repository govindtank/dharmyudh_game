// ============================================================
// DHARMYUDH - 3D Humanoid Warrior Mesh Engine (Three.js)
// ============================================================

import { CONFIG, clamp } from '../engine/config.js';

export class WarriorMesh3D {
  constructor(scene, entity) {
    this.scene = scene;
    this.entity = entity;
    this.isThreeAvailable = typeof window !== 'undefined' && !!window.THREE;

    if (this.isThreeAvailable && this.scene) {
      this.build3DHumanoidMesh();
    }
  }

  build3DHumanoidMesh() {
    const THREE = window.THREE;
    this.group = new THREE.Group();

    const colors = this.entity.colors || {
      skin: 0xd4a574,
      cloth: 0x2a2a3a,
      armor: 0x1565c0,
      gold: 0xffd700
    };

    // Color conversion
    const parseHex = (c) => typeof c === 'number' ? c : parseInt(c.replace('#', '0x'), 16);
    const skinHex = parseHex(colors.skin);
    const armorHex = parseHex(colors.armor);
    const goldHex = parseHex(colors.gold);

    // Materials
    this.skinMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.55 });
    this.armorMat = new THREE.MeshStandardMaterial({ color: armorHex, roughness: 0.3, metalness: 0.7 });
    this.goldMat = new THREE.MeshStandardMaterial({ color: goldHex, roughness: 0.25, metalness: 0.95 });
    this.hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });

    // 1. Torso & Armor Chest (V-shaped 3D athletic body)
    const torsoGeo = new THREE.CylinderGeometry(24, 15, 55, 12);
    this.torsoMesh = new THREE.Mesh(torsoGeo, this.armorMat);
    this.torsoMesh.position.set(0, 85, 0);
    this.torsoMesh.castShadow = true;
    this.torsoMesh.receiveShadow = true;
    this.group.add(this.torsoMesh);

    // 2. Head & Crown (Mukut)
    const headGeo = new THREE.SphereGeometry(14, 16, 16);
    this.headMesh = new THREE.Mesh(headGeo, this.skinMat);
    this.headMesh.position.set(0, 130, 0);
    this.headMesh.castShadow = true;
    this.group.add(this.headMesh);

    // Mukut Crown
    const crownGeo = new THREE.ConeGeometry(15, 25, 8);
    this.crownMesh = new THREE.Mesh(crownGeo, this.goldMat);
    this.crownMesh.position.set(0, 145, 0);
    this.crownMesh.castShadow = true;
    this.group.add(this.crownMesh);

    // 3. Arms (Shoulders, Biceps, Forearms)
    const armGeo = new THREE.CylinderGeometry(6, 4.5, 40, 8);
    
    this.leftArmMesh = new THREE.Mesh(armGeo, this.skinMat);
    this.leftArmMesh.position.set(-25, 95, 0);
    this.leftArmMesh.castShadow = true;
    this.group.add(this.leftArmMesh);

    this.rightArmMesh = new THREE.Mesh(armGeo, this.skinMat);
    this.rightArmMesh.position.set(25, 95, 0);
    this.rightArmMesh.castShadow = true;
    this.group.add(this.rightArmMesh);

    // 4. Legs (Thighs & Calves)
    const legGeo = new THREE.CylinderGeometry(8, 6, 50, 8);

    this.leftLegMesh = new THREE.Mesh(legGeo, this.skinMat);
    this.leftLegMesh.position.set(-12, 35, 0);
    this.leftLegMesh.castShadow = true;
    this.leftLegMesh.receiveShadow = true;
    this.group.add(this.leftLegMesh);

    this.rightLegMesh = new THREE.Mesh(legGeo, this.skinMat);
    this.rightLegMesh.position.set(12, 35, 0);
    this.rightLegMesh.castShadow = true;
    this.rightLegMesh.receiveShadow = true;
    this.group.add(this.rightLegMesh);

    // 5. 3D Weapon
    this.build3DWeapon(goldHex);

    this.scene.add(this.group);
  }

  build3DWeapon(goldHex) {
    const THREE = window.THREE;
    const type = this.entity.weapon || 'Sword';

    if (type.includes('Bow')) {
      const bowGeo = new THREE.TorusGeometry(35, 3, 8, 24, Math.PI);
      this.weaponMesh = new THREE.Mesh(bowGeo, this.goldMat);
      this.weaponMesh.rotation.z = -Math.PI / 2;
    } else if (type.includes('Mace') || type.includes('Gada')) {
      const shaftGeo = new THREE.CylinderGeometry(3, 3, 60, 8);
      const headGeo = new THREE.SphereGeometry(18, 12, 12);
      this.weaponMesh = new THREE.Group();
      
      const shaft = new THREE.Mesh(shaftGeo, this.skinMat);
      const head = new THREE.Mesh(headGeo, this.goldMat);
      head.position.y = 30;

      this.weaponMesh.add(shaft);
      this.weaponMesh.add(head);
    } else {
      const bladeGeo = new THREE.BoxGeometry(4, 65, 8);
      this.weaponMesh = new THREE.Mesh(bladeGeo, this.goldMat);
    }

    this.weaponMesh.position.set(30, 80, 15);
    this.weaponMesh.castShadow = true;
    this.group.add(this.weaponMesh);
  }

  update(pose) {
    if (!this.group) return;

    // Convert 2D game position to 3D world space
    const posX = this.entity.x - CONFIG.W / 2;
    const posY = CONFIG.GROUND_Y - this.entity.y;

    this.group.position.set(posX, posY, 0);

    // Facing direction
    this.group.rotation.y = this.entity.facing === 1 ? Math.PI / 2 : -Math.PI / 2;

    // Apply joint pose rotations
    if (pose && pose.limbs) {
      if (this.leftArmMesh) this.leftArmMesh.rotation.z = pose.limbs.leftArm || 0;
      if (this.rightArmMesh) this.rightArmMesh.rotation.z = pose.limbs.rightArm || 0;
      if (this.leftLegMesh) this.leftLegMesh.rotation.z = pose.limbs.leftLeg || 0;
      if (this.rightLegMesh) this.rightLegMesh.rotation.z = pose.limbs.rightLeg || 0;
      if (this.headMesh) this.headMesh.rotation.z = pose.limbs.headAngle || 0;
      if (this.weaponMesh) this.weaponMesh.rotation.z = pose.limbs.weaponAngle || 0;
    }
  }

  destroy() {
    if (this.group && this.scene) {
      this.scene.remove(this.group);
    }
  }
}
export default WarriorMesh3D;
