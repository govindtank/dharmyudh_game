// ============================================================
// DHARMYUDH - Visual Particle System (Object Pooled)
// ============================================================

import { clamp, rng } from '../engine/config.js';

class Particle {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.gravity = 0;
    this.drag = 0.97;
    this.life = 0;
    this.maxLife = 0;
    this.size = 0;
    this.color = '#ff6b35';
    this.type = 'spark'; // 'spark', 'smoke', 'ring', 'shard', 'aura', 'text'
    this.alpha = 1;
    this.rotation = 0;
    this.rotSpeed = 0;
    this.text = '';
    this.trail = [];
    this.maxTrail = 6;
  }

  init(x, y, cfg = {}) {
    this.active = true;
    this.x = x;
    this.y = y;
    this.type = cfg.type || 'spark';
    this.life = cfg.life || 1.0;
    this.maxLife = this.life;
    this.size = cfg.size || 4;
    this.color = cfg.color || '#ff6b35';
    this.gravity = cfg.gravity || 0;
    this.drag = cfg.drag || 0.97;
    this.rotation = rng(0, Math.PI * 2);
    this.rotSpeed = cfg.rotSpeed || rng(-5, 5);
    this.text = cfg.text || '';
    this.alpha = 1.0;
    this.trail = [];
    this.maxTrail = cfg.trail ? (cfg.maxTrail || 6) : 0;

    const angle = cfg.angle !== undefined ? cfg.angle : rng(0, Math.PI * 2);
    const speed = cfg.speed !== undefined ? cfg.speed : rng(50, 200);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    if (!this.active) return;

    // Save trail position
    if (this.maxTrail > 0) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrail) {
        this.trail.shift();
      }
    }

    // Apply physics
    this.vx *= this.drag;
    this.vy *= this.drag;
    this.vy += this.gravity * dt;
    
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    this.rotation += this.rotSpeed * dt;
    this.life -= dt;
    
    this.alpha = clamp(this.life / this.maxLife, 0, 1);

    if (this.life <= 0) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Render trail if active
    if (this.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size * 0.4;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    switch (this.type) {
      case 'spark':
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'smoke':
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Puff scale expansion
        const sizeMult = 1.0 + (1.0 - this.alpha) * 1.5;
        ctx.arc(0, 0, this.size * sizeMult, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'ring':
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size * 0.25;
        ctx.beginPath();
        const radius = this.size * (2.0 - this.alpha);
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'shard':
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(0, -this.size * 1.5);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0, this.size * 1.5);
        ctx.closePath();
        ctx.fill();
        break;

      case 'aura':
        // Soft gradient glowing dust
        const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        radGrad.addColorStop(0, this.color);
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'text':
        ctx.rotate(-this.rotation); // Keep text upright
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px Rajdhani`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add shadow outline for visibility
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(this.text, 0, 0);
        ctx.fillText(this.text, 0, 0);
        break;
    }

    ctx.restore();
  }
}

export class ParticleSystem {
  constructor(maxParticles = 500) {
    this.maxParticles = maxParticles;
    this.pool = [];
    
    // Instantiate pool to avoid allocation overhead during active fights
    for (let i = 0; i < maxParticles; i++) {
      this.pool.push(new Particle());
    }
  }

  // Retrieve an inactive particle from the pool
  spawn(x, y, cfg = {}) {
    const particle = this.pool.find(p => !p.active);
    if (particle) {
      particle.init(x, y, cfg);
      return particle;
    }
    return null;
  }

  update(dt) {
    for (let i = 0; i < this.maxParticles; i++) {
      if (this.pool[i].active) {
        this.pool[i].update(dt);
      }
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.maxParticles; i++) {
      if (this.pool[i].active) {
        this.pool[i].draw(ctx);
      }
    }
  }

  clear() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool[i].active = false;
    }
  }

  // Pre-configured burst helper algorithms
  spawnHitSparks(x, y, color = '#ff8f00') {
    // 15 Standard sparks
    for (let i = 0; i < 15; i++) {
      this.spawn(x, y, {
        type: 'spark',
        color: color,
        life: rng(0.2, 0.5),
        size: rng(2, 5),
        speed: rng(100, 250),
        drag: 0.95,
        trail: true,
        maxTrail: 4
      });
    }
    
    // 3 expanding aura glows
    for (let i = 0; i < 3; i++) {
      this.spawn(x, y, {
        type: 'aura',
        color: color,
        life: rng(0.15, 0.3),
        size: rng(20, 45),
        speed: rng(10, 40)
      });
    }

    // 1 expanding ring
    this.spawn(x, y, {
      type: 'ring',
      color: '#ffffff',
      life: 0.25,
      size: 30,
      speed: 0
    });
  }

  spawnHeavyHitSparks(x, y, color = '#e65100') {
    // Standard hit sparks but larger and faster
    for (let i = 0; i < 25; i++) {
      this.spawn(x, y, {
        type: 'shard',
        color: color,
        life: rng(0.3, 0.7),
        size: rng(3, 7),
        speed: rng(200, 400),
        drag: 0.94,
        gravity: 300,
        trail: true,
        maxTrail: 6
      });
    }

    // Expanding shock rings
    for (let i = 0; i < 2; i++) {
      this.spawn(x, y, {
        type: 'ring',
        color: '#ffffff',
        life: 0.35,
        size: 50 + i * 20,
        speed: 0
      });
    }
  }

  spawnSpecialBurst(x, y, color = '#8e24aa') {
    // Divine aura bursts (lots of particles)
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      this.spawn(x, y, {
        type: 'spark',
        color: color,
        life: rng(0.4, 0.9),
        size: rng(3, 6),
        angle: angle,
        speed: rng(250, 450),
        drag: 0.96,
        trail: true,
        maxTrail: 8
      });
    }
  }

  spawnFloatingText(x, y, text, color = '#ffd700') {
    this.spawn(x, y - 20, {
      type: 'text',
      color: color,
      text: text,
      life: 0.8,
      size: 24,
      angle: -Math.PI / 2 + rng(-0.2, 0.2), // float upwards
      speed: rng(60, 100),
      drag: 0.96
    });
  }
}
