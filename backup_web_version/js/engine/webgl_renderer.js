// ============================================================
// DHARMYUDH - 3D WebGL Renderer (Three.js Engine)
// ============================================================

import { CONFIG, clamp } from './config.js';

export class WebGLRendererSystem {
  constructor(canvas, storage) {
    this.canvas = canvas;
    this.storage = storage;

    this.isThreeAvailable = typeof window !== 'undefined' && !!window.THREE;
    this.width = CONFIG.W;
    this.height = CONFIG.H;

    this.cameraX = 0;
    this.cameraY = 0;
    this.targetCameraX = 0;
    this.targetCameraY = 0;
    this.cameraZoom = 1.0;
    this.targetZoom = 1.0;
    this.shakeIntensity = 0;
    this.shakeDecay = 0.88;

    this.screenShakeEnabled = true;

    if (this.isThreeAvailable) {
      this.initThreeScene();
    } else {
      // 2D Canvas fallback context
      this.ctx = canvas.getContext('2d');
    }
  }

  initThreeScene() {
    const THREE = window.THREE;
    
    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a14);
    this.scene.fog = new THREE.FogExp2(0x0a0a14, 0.0008);

    // 2. Perspective Camera (Cinematic 3D View)
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 3000);
    this.camera.position.set(0, 180, 520);
    this.camera.lookAt(0, 100, 0);

    // 3. WebGL Renderer with Shadows & Antialiasing
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting System
    // Ambient celestial light
    this.ambientLight = new THREE.AmbientLight(0xdbe6ff, 0.65);
    this.scene.add(this.ambientLight);

    // Main Sunlight (Kurukshetra Sun)
    this.sunLight = new THREE.DirectionalLight(0xffeaad, 1.3);
    this.sunLight.position.set(250, 450, 300);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 1200;
    this.sunLight.shadow.camera.left = -700;
    this.sunLight.shadow.camera.right = 700;
    this.sunLight.shadow.camera.top = 500;
    this.sunLight.shadow.camera.bottom = -200;
    this.scene.add(this.sunLight);

    // Warm Rim Light for character highlights
    this.rimLight = new THREE.DirectionalLight(0xff7700, 0.7);
    this.rimLight.position.set(-300, 200, -200);
    this.scene.add(this.rimLight);

    // 5. 3D Kurukshetra Battlefield Arena
    this.build3DArena();
  }

  build3DArena() {
    const THREE = window.THREE;

    // Ground Plane (Ancient Kurukshetra Battlefield Dirt)
    const groundGeo = new THREE.PlaneGeometry(3000, 1500);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x3d2b1f,
      roughness: 0.85,
      metalness: 0.1
    });
    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = 0;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    // Ancient Stone Pillars (3D Background Elements)
    const pillarGeo = new THREE.CylinderGeometry(20, 25, 220, 12);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x5c4d41,
      roughness: 0.7,
      metalness: 0.2
    });

    for (let i = -4; i <= 4; i++) {
      if (i === 0) continue;
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(i * 280, 110, -350);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);
    }
  }

  resize(container) {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    if (this.isThreeAvailable && this.renderer) {
      this.renderer.setSize(rect.width, rect.height);
      this.camera.aspect = rect.width / rect.height;
      this.camera.updateProjectionMatrix();
    } else if (this.ctx) {
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.scale(dpr, dpr);
    }
  }

  update(dt, player, enemy) {
    // Camera dynamic framing relative to fighters
    if (player && enemy) {
      const midX = (player.x + enemy.x) / 2;
      const midY = (player.y + enemy.y) / 2;

      this.targetCameraX = midX - CONFIG.W / 2;
      this.targetCameraY = midY - CONFIG.H * 0.7;

      const distance = Math.abs(player.x - enemy.x);
      const zoomRatio = clamp(CONFIG.W / (distance + 400), 0.65, 1.25);
      this.targetZoom = zoomRatio;
    }

    this.cameraX += (this.targetCameraX - this.cameraX) * 0.08;
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.08;
    this.cameraZoom += (this.targetZoom - this.cameraZoom) * 0.08;

    if (this.shakeIntensity > 0.1) {
      this.shakeIntensity *= Math.pow(this.shakeDecay, dt * 60);
    } else {
      this.shakeIntensity = 0;
    }

    // Update 3D Camera Position
    if (this.isThreeAvailable && this.camera) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;

      const targetZ = 520 / this.cameraZoom;
      this.camera.position.x = (this.cameraX + CONFIG.W / 2 - 640) + shakeX;
      this.camera.position.y = 180 - (this.cameraY * 0.3) + shakeY;
      this.camera.position.z = targetZ;

      this.camera.lookAt((this.cameraX + CONFIG.W / 2 - 640), 90, 0);
    }
  }

  triggerShake(intensity) {
    if (!this.screenShakeEnabled) return;
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  drawScreenFlash(alpha, color = '#ffffff') {
    if (alpha <= 0.01) return;
    if (this.ctx) {
      this.ctx.save();
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = clamp(alpha, 0, 1);
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.restore();
    }
  }

  begin() {
    if (this.isThreeAvailable && this.renderer) {
      // 3D scene gets rendered automatically at end of frame
    } else if (this.ctx) {
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.translate(this.width / 2, this.height * 0.6);
      this.ctx.scale(this.cameraZoom, this.cameraZoom);
      this.ctx.translate(this.cameraX, this.cameraY);
    }
  }

  end() {
    if (this.isThreeAvailable && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    } else if (this.ctx) {
      this.ctx.restore();
    }
  }
}
export default WebGLRendererSystem;
