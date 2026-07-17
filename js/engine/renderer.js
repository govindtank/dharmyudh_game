// ============================================================
// DHARMYUDH - Visual Engine Renderer
// ============================================================

import { CONFIG, clamp } from './config.js';

export class RendererSystem {
  constructor(canvas, storage) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.storage = storage;

    // Viewport coordinates
    this.width = CONFIG.W;
    this.height = CONFIG.H;

    // Camera settings
    this.cameraX = 0;
    this.cameraY = 0;
    this.targetCameraX = 0;
    this.targetCameraY = 0;
    this.cameraZoom = 1.0;
    this.targetZoom = 1.0;
    this.shakeIntensity = 0;
    this.shakeDecay = 0.88;

    // Post processing switches based on settings
    this.quality = 'high';
    this.screenShakeEnabled = true;

    this.initQualitySettings();
  }

  initQualitySettings() {
    const settings = this.storage.getSettings();
    this.quality = settings.graphicsQuality;
    this.screenShakeEnabled = settings.screenShakeEnabled;
  }

  resize(container) {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    
    // Support device pixel ratio for sharp retina rendering
    const dpr = window.devicePixelRatio || 1;
    
    // Scale CSS dimensions of canvas to fit container
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    // Scale canvas pixels
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;

    // Scale context to draw in default game units
    this.ctx.scale(dpr, dpr);
  }

  update(dt, player, enemy) {
    this.initQualitySettings();

    // Camera targets mid-point between fighters
    if (player && enemy) {
      const midX = (player.x + enemy.x) / 2;
      const midY = (player.y + enemy.y) / 2;

      // Track relative to screen center
      this.targetCameraX = -midX + this.width / 2;
      this.targetCameraY = -midY + this.height * 0.7; // shift slightly up to see ground clearly

      // Zoom dynamically based on distance
      const distance = Math.abs(player.x - enemy.x);
      const zoomRatio = clamp(this.width / (distance + 400), 0.65, 1.25);
      this.targetZoom = zoomRatio;
    }

    // Camera interpolation (lerp)
    this.cameraX += (this.targetCameraX - this.cameraX) * 0.08;
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.08;
    this.cameraZoom += (this.targetZoom - this.cameraZoom) * 0.08;

    // Decay shake intensity
    if (this.shakeIntensity > 0.1) {
      this.shakeIntensity *= Math.pow(this.shakeDecay, dt * 60);
    } else {
      this.shakeIntensity = 0;
    }
  }

  triggerShake(intensity) {
    if (!this.screenShakeEnabled) return;
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  // Pre-rendering stage setup
  begin() {
    this.ctx.save();
    
    // Clear screen
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Apply chromatic aberration / screen shifts when shake is high
    let shakeOffset = { x: 0, y: 0 };
    if (this.shakeIntensity > 0) {
      shakeOffset.x = (Math.random() - 0.5) * this.shakeIntensity;
      shakeOffset.y = (Math.random() - 0.5) * this.shakeIntensity;
    }

    // Apply Camera Transform relative to center pivot for zoom scaling
    this.ctx.translate(this.width / 2 + shakeOffset.x, this.height * 0.6 + shakeOffset.y);
    this.ctx.scale(this.cameraZoom, this.cameraZoom);
    this.ctx.translate(-this.width / 2 - this.cameraX, -this.height * 0.6 - this.cameraY);
  }

  end() {
    this.ctx.restore();

    // Draw non-camera UI overlay (vignette, overlays, etc.)
    this.drawPostProcessingOverlay();
  }

  drawPostProcessingOverlay() {
    // Premium vignette effect
    if (this.quality === 'high' || this.quality === 'ultra') {
      const grad = this.ctx.createRadialGradient(
        this.width / 2, this.height / 2, this.width * 0.4,
        this.width / 2, this.height / 2, this.width * 0.8
      );
      grad.addColorStop(0, 'rgba(10, 10, 15, 0)');
      grad.addColorStop(1, 'rgba(5, 5, 8, 0.45)');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  // Global flash transitions
  drawScreenFlash(alpha, color = '#ffffff') {
    if (alpha <= 0) return;
    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = clamp(alpha, 0, 1);
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }
}
