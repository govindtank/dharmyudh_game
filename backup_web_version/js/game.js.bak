// ============================================================
// DHARMYUDH v2.0 - The Great War of Kurukshetra
// Enhanced Battle Game Engine
// ============================================================

// ─── CONFIG ────────────────────────────────────────────────
const CONFIG = {
  W: 1280, H: 720,
  GROUND_Y: 520,
  GRAVITY: 1800,
  HIT_STOP: 60,      // ms of hitstop on impact
  SLOWMO_THRESHOLD: 0.15, // HP ratio for slow-mo
  COMBO_WINDOW: 0.4,
  MAX_COMBO: 20,
  ENERGY_REGEN: 12,
  SPECIAL_COST: 50,
  SPECIAL_COOLDOWN: 2,
};

// ─── UTILITY ──────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rng(min, max) { return min + Math.random() * (max - min); }
function rngInt(min, max) { return Math.floor(rng(min, max + 1)); }
function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }

// ─── AUDIO ENGINE ─────────────────────────────────────────
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.initialized = false;
    this.musicPlaying = false;
    this.musicOscs = [];
    this.musicIntensity = 0;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.12;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) { console.warn('Audio:', e); }
  }

  ensureInit() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  playSfx(type, pitch = 1, vol = 1) {
    this.ensureInit();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.sfxGain);
    const baseVol = vol * 0.3;

    switch (type) {
      case 'hit': case 'hit1':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(60 * pitch, now + 0.08);
        gain.gain.setValueAtTime(baseVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
        // noise burst
        this._noiseBurst(now, 0.05, baseVol * 0.5);
        break;
      case 'hit2': case 'heavy':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(30 * pitch, now + 0.15);
        gain.gain.setValueAtTime(baseVol * 1.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now); osc.stop(now + 0.18);
        this._noiseBurst(now, 0.12, baseVol);
        break;
      case 'special':
        osc.type = 'square';
        osc.frequency.setValueAtTime(400 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(1000 * pitch, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(80 * pitch, now + 0.4);
        gain.gain.setValueAtTime(baseVol * 1.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
        const o2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        o2.connect(g2); g2.connect(this.sfxGain);
        o2.type = 'sine';
        o2.frequency.setValueAtTime(600 * pitch, now);
        o2.frequency.exponentialRampToValueAtTime(1800 * pitch, now + 0.08);
        g2.gain.setValueAtTime(baseVol * 0.6, now);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        o2.start(now); o2.stop(now + 0.3);
        break;
      case 'block':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(50 * pitch, now + 0.06);
        gain.gain.setValueAtTime(baseVol * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now); osc.stop(now + 0.08);
        break;
      case 'death':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(15 * pitch, now + 1.0);
        gain.gain.setValueAtTime(baseVol * 1.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        osc.start(now); osc.stop(now + 1.0);
        break;
      case 'select':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500 * pitch, now);
        osc.frequency.setValueAtTime(700 * pitch, now + 0.06);
        gain.gain.setValueAtTime(baseVol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
        break;
      case 'win':
        [400, 500, 600, 800].forEach((f, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g); g.connect(this.sfxGain);
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now + i * 0.12);
          g.gain.setValueAtTime(baseVol * 0.6, now + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
          o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.3);
        });
        break;
      case 'combo':
        osc.type = 'square';
        osc.frequency.setValueAtTime(400 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(1400 * pitch, now + 0.12);
        gain.gain.setValueAtTime(baseVol * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
        break;
      case 'ko':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);
        gain.gain.setValueAtTime(baseVol * 1.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.start(now); osc.stop(now + 1.2);
        break;
      case 'jump':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(500 * pitch, now + 0.1);
        gain.gain.setValueAtTime(baseVol * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now); osc.stop(now + 0.12);
        break;
      case 'dodge':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(800 * pitch, now + 0.06);
        gain.gain.setValueAtTime(baseVol * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now); osc.stop(now + 0.08);
        break;
    }
  }

  _noiseBurst(now, dur, vol) {
    if (!this.ctx) return;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(g); g.connect(this.sfxGain);
    src.start(now);
  }

  startMusic(intensity = 0) {
    if (this.musicPlaying || !this.ctx) return;
    this.musicPlaying = true;
    this.musicIntensity = intensity;
    this.ensureInit();
    const now = this.ctx.currentTime;
    const base = 110; // A2 drone

    // Drone
    const d1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    d1.type = 'sine'; d1.frequency.value = base;
    g1.gain.value = 0.06;
    d1.connect(g1); g1.connect(this.musicGain);
    d1.start(now);
    this.musicOscs.push(d1);

    // Fifth
    const d2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    d2.type = 'sine'; d2.frequency.value = base * 1.5;
    g2.gain.value = 0.04;
    d2.connect(g2); g2.connect(this.musicGain);
    d2.start(now);
    this.musicOscs.push(d2);

    // Tabla pulse
    const pulse = this.ctx.createOscillator();
    const pg = this.ctx.createGain();
    pulse.type = 'triangle';
    pulse.frequency.value = base * 2;
    pg.gain.setValueAtTime(0, now);
    const pulseInterval = setInterval(() => {
      if (!this.musicPlaying) { clearInterval(pulseInterval); return; }
      const t = this.ctx.currentTime;
      const vol = 0.04 + this.musicIntensity * 0.08;
      pg.gain.setValueAtTime(vol, t);
      pg.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      setTimeout(() => {
        if (!this.musicPlaying) return;
        const t2 = this.ctx.currentTime;
        pg.gain.setValueAtTime(vol * 0.5, t2);
        pg.gain.exponentialRampToValueAtTime(0.001, t2 + 0.04);
      }, 200);
    }, 400);
    pulse.connect(pg); pg.connect(this.musicGain);
    pulse.start(now);
    this.musicOscs.push(pulse);
    this._pulseInterval = pulseInterval;
  }

  setMusicIntensity(v) {
    this.musicIntensity = clamp(v, 0, 1);
    if (this.musicGain) {
      this.musicGain.gain.value = 0.08 + this.musicIntensity * 0.15;
    }
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this._pulseInterval) clearInterval(this._pulseInterval);
    this.musicOscs.forEach(o => { try { o.stop(); } catch (e) {} });
    this.musicOscs = [];
  }
}

// ─── PARTICLE SYSTEM ─────────────────────────────────────
class Particle {
  constructor(x, y, config = {}) {
    this.x = x; this.y = y;
    this.type = config.type || 'spark';
    this.life = config.life || 1;
    this.maxLife = this.life;
    this.size = config.size || 4;
    this.speed = config.speed || 200;
    this.angle = config.angle || Math.random() * Math.PI * 2;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.gravity = config.gravity || 0;
    this.drag = config.drag || 0.97;
    this.color = config.color || '#ff6b35';
    this.colors = config.colors || null;
    this.alpha = 1;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 10;
    this.trail = config.trail || false;
    this.trailPos = [];
    this.maxTrail = 6;
    this.fadeOut = config.fadeOut !== false;
    this.scaleX = 1;
    this.scaleY = 1;
  }

  update(dt) {
    this.trailPos.push({ x: this.x, y: this.y });
    if (this.trailPos.length > this.maxTrail) this.trailPos.shift();
    this.vx *= this.drag;
    this.vy *= this.drag;
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotSpeed * dt;
    this.life -= dt;
    if (this.fadeOut) this.alpha = Math.max(0, this.life / this.maxLife);
  }

  get dead() { return this.life <= 0; }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scaleX, this.scaleY);
    const color = this.colors ? this.colors[Math.floor(Math.random() * this.colors.length)] : this.color;

    if (this.trail && this.trailPos.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.trailPos[0].x - this.x, this.trailPos[0].y - this.y);
      for (let i = 1; i < this.trailPos.length; i++)
        ctx.lineTo(this.trailPos[i].x - this.x, this.trailPos[i].y - this.y);
      ctx.strokeStyle = color;
      ctx.globalAlpha = this.alpha * 0.4;
      ctx.lineWidth = this.size * 0.4;
      ctx.stroke();
    }

    ctx.globalAlpha = this.alpha;
    switch (this.type) {
      case 'spark':
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(0, 0, this.size * this.alpha, 0, Math.PI * 2); ctx.fill();
        break;
      case 'glow': {
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2.5);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, this.size * 2.5, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'ring':
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * (1 + (1 - this.alpha) * 3), 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'shard':
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -this.size * this.alpha);
        ctx.lineTo(this.size * 0.5 * this.alpha, 0);
        ctx.lineTo(0, this.size * this.alpha);
        ctx.lineTo(-this.size * 0.5 * this.alpha, 0);
        ctx.closePath(); ctx.fill();
        break;
      case 'smoke':
        ctx.fillStyle = color;
        ctx.globalAlpha = this.alpha * 0.25;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * (2 - this.alpha * 0.5), 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'sparkle':
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        const s = this.size * this.alpha;
        ctx.fillRect(-s / 2, -s / 2, s, s);
        break;
      case 'blood':
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * this.alpha, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'text':
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.floor(this.size * this.alpha)}px Rajdhani, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(config.text || '', 0, 0);
        break;
    }
    ctx.restore();
  }
}

// Config for text particle
Particle.createText = (x, y, text, color = '#ffd700', size = 28) => {
  return new Particle(x, y, {
    type: null, life: 0.8, size, color, gravity: -100,
    speed: 100, angle: -Math.PI / 2,
    fadeOut: true, drag: 0.95,
    _text: text, _isText: true,
  });
};

class ParticleSystem {
  constructor() { this.particles = []; }

  emit(x, y, config = {}) {
    const count = config.count || 10;
    for (let i = 0; i < count; i++) {
      const p = new Particle(x, y, {
        type: config.type || 'spark',
        life: (config.life || 0.5) * (0.7 + Math.random() * 0.6),
        size: (config.size || 4) * (0.5 + Math.random()),
        speed: (config.speed || 200) * (0.5 + Math.random()),
        angle: config.spread
          ? config.angle + (Math.random() - 0.5) * config.spread
          : Math.random() * Math.PI * 2,
        color: Array.isArray(config.color)
          ? config.color[Math.floor(Math.random() * config.color.length)]
          : config.color || '#ff6b35',
        colors: config.colors || null,
        gravity: config.gravity || 0,
        drag: config.drag || 0.97,
        trail: config.trail || false,
        fadeOut: config.fadeOut !== false,
      });
      this.particles.push(p);
    }
  }

  emitText(x, y, text, color = '#ffd700', size = 28) {
    const p = Particle.createText(x, y, text, color, size);
    p._text = text;
    this.particles.push(p);
  }

  hitSparks(x, y, color = '#ff6b35') {
    this.emit(x, y, {
      count: 15, type: 'spark', speed: 350, life: 0.3, size: 3,
      spread: Math.PI, color: [color, '#ffffff', '#ffd700'],
      gravity: 300, drag: 0.94,
    });
    this.emit(x, y, {
      count: 5, type: 'glow', speed: 50, life: 0.2, size: 15, color,
    });
    this.emit(x, y, {
      count: 6, type: 'blood', speed: 200, life: 0.5, size: 4,
      spread: Math.PI * 0.8, color: '#cc0000', gravity: 400,
    });
  }

  heavyHitSparks(x, y) {
    this.emit(x, y, {
      count: 30, type: 'spark', speed: 500, life: 0.4, size: 5,
      spread: Math.PI * 2, color: ['#ff4400', '#ffffff', '#ffd700', '#ff8800'],
      gravity: 200, trail: true,
    });
    this.emit(x, y, {
      count: 8, type: 'ring', speed: 0, life: 0.4, size: 25, color: '#ff4400',
    });
    this.emit(x, y, {
      count: 10, type: 'glow', speed: 80, life: 0.3, size: 30, color: '#ffd700',
    });
  }

  specialBurst(x, y, color = '#ffd700') {
    this.emit(x, y, {
      count: 40, type: 'spark', speed: 450, life: 0.6, size: 5,
      spread: Math.PI * 2, color: [color, '#ffffff', '#ff8800', '#ff4400'],
      gravity: 100, trail: true,
    });
    this.emit(x, y, {
      count: 8, type: 'ring', speed: 0, life: 0.5, size: 20, color,
    });
    this.emit(x, y, {
      count: 12, type: 'glow', speed: 80, life: 0.4, size: 25, color,
    });
  }

  deathBurst(x, y) {
    this.emit(x, y, {
      count: 80, type: 'spark', speed: 600, life: 0.9, size: 7,
      spread: Math.PI * 2, color: ['#ff4400', '#ff8800', '#ffd700', '#ffffff'],
      gravity: 150, trail: true,
    });
    this.emit(x, y, {
      count: 15, type: 'ring', speed: 0, life: 0.8, size: 40, color: '#ff4400',
    });
    this.emit(x, y, {
      count: 25, type: 'smoke', speed: 120, life: 1.2, size: 35,
      spread: Math.PI * 2, color: '#333333', gravity: -30,
    });
    this.emit(x, y, {
      count: 20, type: 'glow', speed: 150, life: 0.5, size: 30,
      color: '#ff4400',
    });
  }

  footstep(x, y) {
    this.emit(x, y, {
      count: 2, type: 'smoke', speed: 20, life: 0.2, size: 6,
      spread: 0.5, color: '#554433', gravity: 0,
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (this.particles[i].dead) this.particles.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const p of this.particles) p.draw(ctx);
  }

  clear() { this.particles.length = 0; }
}

// ─── CHARACTER DEFINITIONS ──────────────────────────────
const CHARACTERS = [
  {
    id: 'arjuna', name: 'Arjuna', title: 'The Peerless Archer',
    devanagari: 'अर्जुन', color: '#4fc3f7', colorDark: '#0288d1',
    weapon: 'Gandiva Bow', weaponDevanagari: 'गाण्डीव',
    stats: { hp: 100, speed: 180, attack: 12, defense: 8, specialDmg: 32 },
    taunt: 'I am Arjuna, the greatest archer!',
    taunt2: 'Pashupatastra, arise!',
    defeatQuote: 'Dharma always triumphs...',
    draw: (ctx, x, y, w, h, facing, animFrame, state, flash) => {
      ctx.save(); ctx.translate(x, y);
      if (facing < 0) ctx.scale(-1, 1);
      const bob = Math.sin(animFrame * 0.08) * 2;
      const atkSwing = state.attacking ? Math.sin(animFrame * 0.25) * 18 : 0;
      if (state.specialActive) {
        ctx.shadowColor = '#4fc3f7'; ctx.shadowBlur = 40 + Math.sin(animFrame * 0.15) * 10;
      }
      // Body
      ctx.fillStyle = flash ? '#ffffff' : '#2a2a3a';
      ctx.fillRect(-w*0.25, -h*0.5 + bob, w*0.5, h*0.5);
      // Armor
      ctx.fillStyle = flash ? '#ffffff' : '#1565c0';
      ctx.fillRect(-w*0.2, -h*0.45 + bob, w*0.4, h*0.25);
      // Chest emblem
      ctx.fillStyle = flash ? '#ffffff' : '#ffd700';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ॐ', 0, -h*0.3 + bob);
      // Dhoti
      ctx.fillStyle = flash ? '#ffffff' : '#e8d5b0';
      ctx.fillRect(-w*0.22, -h*0.1 + bob, w*0.44, h*0.3);
      // Head
      ctx.fillStyle = flash ? '#ffffff' : '#d4a574';
      ctx.beginPath(); ctx.arc(0, -h*0.5 + bob, w*0.18, 0, Math.PI * 2); ctx.fill();
      // Hair bun
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(w*0.08, -h*0.6 + bob, w*0.12, 0, Math.PI * 2); ctx.fill();
      // Crown
      ctx.fillStyle = flash ? '#ffffff' : '#ffd700';
      ctx.beginPath();
      ctx.moveTo(-w*0.15, -h*0.58 + bob); ctx.lineTo(0, -h*0.68 + bob);
      ctx.lineTo(w*0.15, -h*0.58 + bob); ctx.closePath(); ctx.fill();
      // Eyes
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(-w*0.06, -h*0.52 + bob, w*0.04, w*0.04);
      ctx.fillRect(w*0.02, -h*0.52 + bob, w*0.04, w*0.04);
      // Quiver
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(-w*0.32, -h*0.4 + bob, w*0.08, h*0.35);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-w*0.33, -h*0.35 + bob + i * 10, 2, 12);
      }
      // Bow
      ctx.strokeStyle = flash ? '#ffffff' : '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(w*0.3, bob, w*0.2, -Math.PI/3, Math.PI/3); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w*0.3 + w*0.2*Math.cos(-Math.PI/3), bob + w*0.2*Math.sin(-Math.PI/3));
      ctx.lineTo(w*0.3 + w*0.2*Math.cos(Math.PI/3), bob + w*0.2*Math.sin(Math.PI/3));
      ctx.stroke();
      // Legs
      ctx.fillStyle = flash ? '#ffffff' : '#e8d5b0';
      const leg = Math.sin(animFrame * 0.05) * 5;
      ctx.fillRect(-w*0.2, h*0.15 + leg + bob, w*0.15, h*0.25);
      ctx.fillRect(w*0.05, h*0.15 - leg + bob, w*0.15, h*0.25);
      ctx.restore();
    },
    specialEffect: (game, x, y, facing) => {
      game.particles.specialBurst(x, y, '#4fc3f7');
      game.screenShake = 10;
      game.audio.playSfx('special', 0.8);
      // Arrow rain
      for (let i = 0; i < 18; i++) {
        setTimeout(() => {
          if (!game.battleActive) return;
          const tx = x + (Math.random() - 0.5) * 350;
          const ty = y - 250 - Math.random() * 150;
          game.particles.emit(tx, ty, {
            count: 6, type: 'spark', speed: 600, life: 0.4, size: 3,
            angle: Math.PI / 2 + (Math.random() - 0.5) * 0.3,
            color: ['#4fc3f7', '#ffffff', '#81d4fa'],
            gravity: 500, trail: true,
          });
        }, i * 50);
      }
    }
  },
  {
    id: 'bhima', name: 'Bhima', title: 'The Mighty',
    devanagari: 'भीम', color: '#ff7043', colorDark: '#d84315',
    weapon: 'Gada (Mace)', weaponDevanagari: 'गदा',
    stats: { hp: 150, speed: 130, attack: 20, defense: 12, specialDmg: 48 },
    taunt: 'None can match Bhima\'s strength!',
    taunt2: 'Feel the might of my gada!',
    defeatQuote: 'Argh... my strength... fades...',
    draw: (ctx, x, y, w, h, facing, animFrame, state, flash) => {
      ctx.save(); ctx.translate(x, y);
      if (facing < 0) ctx.scale(-1, 1);
      const bob = Math.sin(animFrame * 0.08) * 2;
      const atkSwing = state.attacking ? Math.sin(animFrame * 0.22) * 22 : 0;
      if (state.specialActive) { ctx.shadowColor = '#ff7043'; ctx.shadowBlur = 35; }
      ctx.fillStyle = flash ? '#ffffff' : '#3a2a1a';
      ctx.fillRect(-w*0.3, -h*0.5 + bob, w*0.6, h*0.55);
      ctx.fillStyle = flash ? '#ffffff' : '#b71c1c';
      ctx.fillRect(-w*0.25, -h*0.45 + bob, w*0.5, h*0.25);
      // Belly band
      ctx.fillStyle = flash ? '#ffffff' : '#ffd700';
      ctx.fillRect(-w*0.18, -h*0.12 + bob, w*0.36, 4);
      ctx.fillStyle = flash ? '#ffffff' : '#e8d5b0';
      ctx.fillRect(-w*0.28, -h*0.05 + bob, w*0.56, h*0.3);
      ctx.fillStyle = flash ? '#ffffff' : '#c49a6c';
      ctx.beginPath(); ctx.arc(0, -h*0.5 + bob, w*0.22, 0, Math.PI * 2); ctx.fill();
      // Wild hair
      ctx.fillStyle = '#1a1a1a';
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath(); ctx.arc(i * w*0.06, -h*0.6 + bob + Math.abs(i)*2, w*0.08, 0, Math.PI * 2); ctx.fill();
      }
      // Angry red eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-w*0.09, -h*0.52 + bob, w*0.06, w*0.03);
      ctx.fillRect(w*0.03, -h*0.52 + bob, w*0.06, w*0.03);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-w*0.08, -h*0.52 + bob, w*0.04, w*0.03);
      ctx.fillRect(w*0.04, -h*0.52 + bob, w*0.04, w*0.03);
      // Mace
      ctx.fillStyle = flash ? '#ffffff' : '#757575';
      ctx.fillRect(w*0.2, -h*0.2 + bob + atkSwing, w*0.06, h*0.3);
      ctx.fillStyle = flash ? '#ffffff' : '#9e9e9e';
      ctx.beginPath(); ctx.arc(w*0.23, -h*0.25 + bob + atkSwing, w*0.1, 0, Math.PI * 2); ctx.fill();
      for (let a = 0; a < 6; a++) {
        const angle = a * Math.PI / 3;
        ctx.fillStyle = flash ? '#ffffff' : '#616161';
        ctx.beginPath(); ctx.arc(w*0.23 + Math.cos(angle) * w*0.12, -h*0.25 + bob + Math.sin(angle) * w*0.12 + atkSwing, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = flash ? '#ffffff' : '#e8d5b0';
      const leg = Math.sin(animFrame * 0.05) * 5;
      ctx.fillRect(-w*0.25, h*0.2 + leg + bob, w*0.2, h*0.2);
      ctx.fillRect(w*0.05, h*0.2 - leg + bob, w*0.2, h*0.2);
      ctx.restore();
    },
    specialEffect: (game, x, y, facing) => {
      game.particles.specialBurst(x, y + 20, '#ff7043');
      game.screenShake = 25;
      game.audio.playSfx('special', 1.2);
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          game.particles.emit(x, y + 10, {
            count: 15, type: 'ring', speed: 0, life: 0.3,
            size: 25 + i * 35, color: '#ff7043',
          });
        }, i * 50);
      }
    }
  },
  {
    id: 'karna', name: 'Karna', title: 'The Radiant Warrior',
    devanagari: 'कर्ण', color: '#ffd700', colorDark: '#f9a825',
    weapon: 'Vijaya Bow', weaponDevanagari: 'विजय धनुष',
    stats: { hp: 110, speed: 170, attack: 16, defense: 9, specialDmg: 40 },
    taunt: 'My Vijaya bow will decide your fate!',
    taunt2: 'This armor is my birthright!',
    defeatQuote: 'A worthy opponent... I salute you...',
    draw: (ctx, x, y, w, h, facing, animFrame, state, flash) => {
      ctx.save(); ctx.translate(x, y);
      if (facing < 0) ctx.scale(-1, 1);
      const bob = Math.sin(animFrame * 0.08) * 2;
      if (state.specialActive) { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 45 + Math.sin(animFrame * 0.1)*10; }
      ctx.fillStyle = flash ? '#ffffff' : '#2a1a0a';
      ctx.fillRect(-w*0.25, -h*0.5 + bob, w*0.5, h*0.5);
      ctx.fillStyle = flash ? '#ffffff' : '#ffd700';
      ctx.fillRect(-w*0.22, -h*0.45 + bob, w*0.44, h*0.3);
      ctx.strokeStyle = '#ff8f00'; ctx.lineWidth = 1;
      ctx.strokeRect(-w*0.22, -h*0.45 + bob, w*0.44, h*0.3);
      // Kavach pattern
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#ff8f00';
        ctx.beginPath();
        ctx.arc(-w*0.15 + i * w*0.12, -h*0.3 + bob, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = flash ? '#ffffff' : '#e8d5b0';
      ctx.fillRect(-w*0.22, -h*0.1 + bob, w*0.44, h*0.3);
      ctx.fillStyle = flash ? '#ffffff' : '#c49a6c';
      ctx.beginPath(); ctx.arc(0, -h*0.5 + bob, w*0.18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = flash ? '#ffffff' : '#ffd700';
      ctx.beginPath();
      ctx.moveTo(-w*0.18, -h*0.58 + bob); ctx.lineTo(0, -h*0.7 + bob);
      ctx.lineTo(w*0.18, -h*0.58 + bob); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff8f00';
      ctx.beginPath(); ctx.arc(0, -h*0.7 + bob, 4, 0, Math.PI * 2); ctx.fill();
      // Kundal (earrings)
      ctx.fillStyle = flash ? '#ffffff' : '#ffd700';
      ctx.beginPath(); ctx.arc(-w*0.18, -h*0.47 + bob, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(w*0.18, -h*0.47 + bob, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(-w*0.06, -h*0.52 + bob, w*0.04, w*0.04);
      ctx.fillRect(w*0.02, -h*0.52 + bob, w*0.04, w*0.04);
      // Bow
      ctx.strokeStyle = flash ? '#ffffff' : '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(w*0.3, bob, w*0.22, -Math.PI/3, Math.PI/3); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w*0.3 + w*0.22*Math.cos(-Math.PI/3), bob + w*0.22*Math.sin(-Math.PI/3));
      ctx.lineTo(w*0.3 + w*0.22*Math.cos(Math.PI/3), bob + w*0.22*Math.sin(Math.PI/3));
      ctx.stroke();
      ctx.fillStyle = flash ? '#ffffff' : '#e8d5b0';
      const leg = Math.sin(animFrame * 0.05) * 5;
      ctx.fillRect(-w*0.2, h*0.15 + leg + bob, w*0.15, h*0.25);
      ctx.fillRect(w*0.05, h*0.15 - leg + bob, w*0.15, h*0.25);
      ctx.restore();
    },
    specialEffect: (game, x, y, facing) => {
      game.particles.specialBurst(x, y, '#ffd700');
      game.screenShake = 12;
      game.audio.playSfx('special', 1.0);
      for (let i = 0; i < 22; i++) {
        setTimeout(() => {
          if (!game.battleActive) return;
          const angle = -Math.PI/2 + (Math.random() - 0.5) * 1.8;
          game.particles.emit(x + Math.cos(angle) * 50, y + Math.sin(angle) * 50, {
            count: 5, type: 'sparkle', speed: 650, life: 0.5, size: 4,
            angle, color: ['#ffd700', '#ffffff', '#ffecb3'], gravity: 200, trail: true,
          });
        }, i * 35);
      }
    }
  },
  {
    id: 'duryodhana', name: 'Duryodhana', title: 'The Crowned Prince',
    devanagari: 'दुर्योधन', color: '#b71c1c', colorDark: '#7f0000',
    weapon: 'Iron Mace', weaponDevanagari: 'लौह गदा',
    stats: { hp: 140, speed: 145, attack: 18, defense: 11, specialDmg: 44 },
    taunt: 'I am the rightful king of Hastinapur!',
    taunt2: 'No one can stand against me!',
    defeatQuote: 'This is not over...',
    draw: (ctx, x, y, w, h, facing, animFrame, state, flash) => {
      ctx.save(); ctx.translate(x, y);
      if (facing < 0) ctx.scale(-1, 1);
      const bob = Math.sin(animFrame * 0.08) * 2;
      if (state.specialActive) { ctx.shadowColor = '#ff1744'; ctx.shadowBlur = 30; }
      ctx.fillStyle = flash ? '#ffffff' : '#3a2a1a';
      ctx.fillRect(-w*0.3, -h*0.5 + bob, w*0.6, h*0.55);
      ctx.fillStyle = flash ? '#ffffff' : '#4a148c';
      ctx.fillRect(-w*0.28, -h*0.45 + bob, w*0.56, h*0.25);
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
      ctx.strokeRect(-w*0.28, -h*0.45 + bob, w*0.56, h*0.25);
      ctx.fillStyle = flash ? '#ffffff' : '#e8d5b0';
      ctx.fillRect(-w*0.28, -h*0.05 + bob, w*0.56, h*0.3);
      ctx.fillStyle = flash ? '#ffffff' : '#c49a6c';
      ctx.beginPath(); ctx.arc(0, -h*0.5 + bob, w*0.22, 0, Math.PI * 2); ctx.fill();
      // Elaborate crown
      ctx.fillStyle = flash ? '#ffffff' : '#ffd700';
      ctx.beginPath();
      ctx.moveTo(-w*0.2, -h*0.58 + bob); ctx.lineTo(-w*0.13, -h*0.7 + bob);
      ctx.lineTo(-w*0.05, -h*0.6 + bob); ctx.lineTo(0, -h*0.73 + bob);
      ctx.lineTo(w*0.05, -h*0.6 + bob); ctx.lineTo(w*0.13, -h*0.7 + bob);
      ctx.lineTo(w*0.2, -h*0.58 + bob); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff0000';
      ctx.beginPath(); ctx.arc(0, -h*0.73 + bob, 3, 0, Math.PI * 2); ctx.fill();
      // Angry red eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-w*0.09, -h*0.52 + bob, w*0.06, w*0.03);
      ctx.fillRect(w*0.03, -h*0.52 + bob, w*0.06, w*0.03);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-w*0.08, -h*0.52 + bob, w*0.04, w*0.03);
      ctx.fillRect(w*0.04, -h*0.52 + bob, w*0.04, w*0.03);
      // Mace
      ctx.fillStyle = flash ? '#ffffff' : '#616161';
      ctx.fillRect(w*0.22, -h*0.15 + bob, w*0.06, h*0.25);
      ctx.fillStyle = flash ? '#ffffff' : '#424242';
      ctx.beginPath(); ctx.arc(w*0.25, -h*0.22 + bob, w*0.12, 0, Math.PI * 2); ctx.fill();
      for (let a = 0; a < 8; a++) {
        const angle = a * Math.PI / 4;
        ctx.fillStyle = flash ? '#ffffff' : '#757575';
        ctx.beginPath(); ctx.arc(w*0.25 + Math.cos(angle) * w*0.14, -h*0.22 + bob + Math.sin(angle) * w*0.14, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = flash ? '#ffffff' : '#e8d5b0';
      const leg = Math.sin(animFrame * 0.05) * 5;
      ctx.fillRect(-w*0.25, h*0.2 + leg + bob, w*0.2, h*0.2);
      ctx.fillRect(w*0.05, h*0.2 - leg + bob, w*0.2, h*0.2);
      ctx.restore();
    },
    specialEffect: (game, x, y, facing) => {
      game.particles.specialBurst(x, y, '#b71c1c');
      game.screenShake = 22;
      game.audio.playSfx('special', 0.7);
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          game.particles.emit(x + (Math.random() - 0.5) * 250, y - 60, {
            count: 12, type: 'shard', speed: 350, life: 0.5, size: 8,
            spread: Math.PI, color: ['#b71c1c', '#7f0000', '#ff1744'], gravity: 350,
          });
        }, i * 55);
      }
    }
  },
  {
    id: 'nakula', name: 'Nakula', title: 'The Swordmaster',
    devanagari: 'नकुल', color: '#66bb6a', colorDark: '#2e7d32',
    weapon: 'Sword & Shield', weaponDevanagari: 'खड्ग एवं ढाल',
    stats: { hp: 90, speed: 220, attack: 12, defense: 6, specialDmg: 30 },
    taunt: 'Speed is my greatest weapon!',
    taunt2: 'You cannot hit what you cannot see!',
    defeatQuote: 'I was not fast enough...',
    draw: (ctx, x, y, w, h, facing, animFrame, state, flash) => {
      ctx.save(); ctx.translate(x, y);
      if (facing < 0) ctx.scale(-1, 1);
      const bob = Math.sin(animFrame * 0.08) * 2;
      ctx.fillStyle = flash ? '#ffffff' : '#2a2a3a';
      ctx.fillRect(-w*0.22, -h*0.5 + bob, w*0.44, h*0.5);
      ctx.fillStyle = flash ? '#ffffff' : '#2e7d32';
      ctx.fillRect(-w*0.2, -h*0.45 + bob, w*0.4, h*0.25);
      ctx.fillStyle = flash ? '#ffffff' : '#e8d5b0';
      ctx.fillRect(-w*0.2, -h*0.1 + bob, w*0.4, h*0.3);
      ctx.fillStyle = flash ? '#ffffff' : '#d4a574';
      ctx.beginPath(); ctx.arc(0, -h*0.5 + bob, w*0.16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(0, -h*0.6 + bob, w*0.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = flash ? '#ffffff' : '#ffd700';
      ctx.beginPath(); ctx.moveTo(-w*0.12, -h*0.56 + bob); ctx.lineTo(0, -h*0.66 + bob);
      ctx.lineTo(w*0.12, -h*0.56 + bob); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(-w*0.05, -h*0.52 + bob, w*0.04, w*0.04);
      ctx.fillRect(w*0.01, -h*0.52 + bob, w*0.04, w*0.04);
      // Sword
      ctx.save();
      ctx.translate(w*0.25, -h*0.1 + bob);
      ctx.rotate(state.attacking ? Math.sin(animFrame * 0.3) * 0.5 : 0);
      ctx.fillStyle = flash ? '#ffffff' : '#b0bec5';
      ctx.fillRect(-1, -25, 3, 35);
      ctx.fillStyle = flash ? '#ffffff' : '#ffd700';
      ctx.fillRect(-2, -18, 5, 8);
      ctx.restore();
      // Shield
      ctx.fillStyle = flash ? '#ffffff' : '#5d4037';
      ctx.beginPath(); ctx.arc(-w*0.2, -h*0.15 + bob, w*0.1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(-w*0.2, -h*0.15 + bob, w*0.1, 0, Math.PI * 2); ctx.stroke();
      // Shield emblem
      ctx.fillStyle = '#ffd700';
      ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('॥', -w*0.2, -h*0.15 + bob + 3);
      ctx.fillStyle = flash ? '#ffffff' : '#e8d5b0';
      const leg = Math.sin(animFrame * 0.05) * 8;
      ctx.fillRect(-w*0.18, h*0.15 + leg + bob, w*0.14, h*0.25);
      ctx.fillRect(w*0.04, h*0.15 - leg + bob, w*0.14, h*0.25);
      ctx.restore();
    },
    specialEffect: (game, x, y, facing) => {
      game.particles.specialBurst(x, y, '#66bb6a');
      game.audio.playSfx('combo', 0.9);
      game.screenShake = 8;
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const angle = (i / 8) * Math.PI * 2;
          game.particles.emit(x + Math.cos(angle)*50, y + Math.sin(angle)*50, {
            count: 8, type: 'spark', speed: 250, life: 0.3, size: 4,
            color: ['#66bb6a', '#ffffff', '#a5d6a7'],
          });
          // Slash trail
          game.particles.emit(x + Math.cos(angle)*30, y + Math.sin(angle)*30, {
            count: 3, type: 'sparkle', speed: 100, life: 0.2, size: 6,
            color: '#ffffff',
          });
        }, i * 35);
      }
    }
  },
  {
    id: 'yudhishthira', name: 'Yudhishthira', title: 'The Dharmic King',
    devanagari: 'युधिष्ठिर', color: '#ab47bc', colorDark: '#6a1b9a',
    weapon: 'Divine Spear', weaponDevanagari: 'दिव्य भाला',
    stats: { hp: 120, speed: 155, attack: 13, defense: 14, specialDmg: 36 },
    taunt: 'Dharma protects those who uphold it!',
    taunt2: 'Justice shall prevail!',
    defeatQuote: 'Even in defeat, dharma stands eternal...',
    draw: (ctx, x, y, w, h, facing, animFrame, state, flash) => {
      ctx.save(); ctx.translate(x, y);
      if (facing < 0) ctx.scale(-1, 1);
      const bob = Math.sin(animFrame * 0.08) * 2;
      if (state.specialActive) { ctx.shadowColor = '#ab47bc'; ctx.shadowBlur = 40 + Math.sin(animFrame * 0.1)*10; }
      ctx.fillStyle = flash ? '#ffffff' : '#2a2a3a';
      ctx.fillRect(-w*0.24, -h*0.5 + bob, w*0.48, h*0.5);
      ctx.fillStyle = flash ? '#ffffff' : '#6a1b9a';
      ctx.fillRect(-w*0.22, -h*0.45 + bob, w*0.44, h*0.25);
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
      ctx.strokeRect(-w*0.22, -h*0.45 + bob, w*0.44, h*0.25);
      // Dharma symbol
      ctx.fillStyle = '#ffd700';
      ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('ध', 0, -h*0.3 + bob);
      ctx.fillStyle = flash ? '#ffffff' : '#e8d5b0';
      ctx.fillRect(-w*0.22, -h*0.1 + bob, w*0.44, h*0.3);
      ctx.fillStyle = flash ? '#ffffff' : '#d4a574';
      ctx.beginPath(); ctx.arc(0, -h*0.5 + bob, w*0.18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = flash ? '#ffffff' : '#ffd700';
      ctx.beginPath();
      ctx.moveTo(-w*0.18, -h*0.57 + bob); ctx.lineTo(-w*0.1, -h*0.68 + bob);
      ctx.lineTo(0, -h*0.58 + bob); ctx.lineTo(w*0.1, -h*0.68 + bob);
      ctx.lineTo(w*0.18, -h*0.57 + bob); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(-w*0.05, -h*0.52 + bob, w*0.04, w*0.03);
      ctx.fillRect(w*0.01, -h*0.52 + bob, w*0.04, w*0.03);
      // Spear
      ctx.fillStyle = flash ? '#ffffff' : '#9e9e9e';
      ctx.fillRect(w*0.2, -h*0.5 + bob, 3, h*0.6);
      ctx.fillStyle = flash ? '#ffffff' : '#ffd700';
      ctx.beginPath();
      ctx.moveTo(w*0.215, -h*0.5 + bob - 18);
      ctx.lineTo(w*0.18, -h*0.5 + bob - 5);
      ctx.lineTo(w*0.215, -h*0.5 + bob);
      ctx.lineTo(w*0.25, -h*0.5 + bob - 5);
      ctx.closePath(); ctx.fill();
      // Spear banner
      ctx.fillStyle = flash ? '#ffffff' : '#ab47bc';
      ctx.beginPath();
      ctx.moveTo(w*0.215, -h*0.5 + bob - 12);
      ctx.lineTo(w*0.215 + 15 + Math.sin(animFrame * 0.05) * 5, -h*0.5 + bob - 8);
      ctx.lineTo(w*0.215, -h*0.5 + bob - 4);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = flash ? '#ffffff' : '#e8d5b0';
      const leg = Math.sin(animFrame * 0.05) * 5;
      ctx.fillRect(-w*0.19, h*0.15 + leg + bob, w*0.16, h*0.25);
      ctx.fillRect(w*0.03, h*0.15 - leg + bob, w*0.16, h*0.25);
      ctx.restore();
    },
    specialEffect: (game, x, y, facing) => {
      game.particles.specialBurst(x, y, '#ab47bc');
      game.screenShake = 10;
      game.audio.playSfx('special', 1.1);
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          game.particles.emit(x, y, {
            count: 20, type: 'ring', speed: 0, life: 0.4,
            size: 35 + i * 45, color: '#ab47bc',
          });
          game.particles.emit(x, y, {
            count: 12, type: 'glow', speed: 100, life: 0.4,
            size: 20, color: '#ce93d8',
          });
        }, i * 70);
      }
    }
  }
];

// ─── BACKGROUND SYSTEM ──────────────────────────────────
class BackgroundSystem {
  constructor(game) {
    this.game = game;
    this.stars = [];
    this.clouds = [];
    this.torches = [];
    this.banners = [];
    this.weather = { type: 'clear', intensity: 0, particles: [] };
    this.time = 0;

    // Generate stars
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * CONFIG.W, y: Math.random() * (CONFIG.GROUND_Y - 50),
        size: 0.5 + Math.random() * 2, speed: 0.02 + Math.random() * 0.05,
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    // Clouds
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * CONFIG.W, y: 40 + Math.random() * 100,
        w: 80 + Math.random() * 150, speed: 5 + Math.random() * 10,
        opacity: 0.1 + Math.random() * 0.15,
      });
    }

    // Torches
    for (let i = 0; i < 6; i++) {
      this.torches.push({
        x: 50 + i * 240, y: CONFIG.GROUND_Y - 5,
        flameOffset: Math.random() * Math.PI * 2,
        intensity: 0.7 + Math.random() * 0.3,
      });
    }

    // Banners
    for (let i = 0; i < 4; i++) {
      this.banners.push({
        x: 150 + i * 350, y: CONFIG.GROUND_Y - 60,
        color: i % 2 === 0 ? '#b71c1c' : '#ffd700',
        waveOffset: i * 1.5,
      });
    }
  }

  update(dt) {
    this.time += dt;
    // Clouds
    for (const c of this.clouds) {
      c.x += c.speed * dt;
      if (c.x > CONFIG.W + c.w) c.x = -c.w;
    }
    // Weather
    for (let i = this.weather.particles.length - 1; i >= 0; i--) {
      const p = this.weather.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.y > CONFIG.GROUND_Y || p.life <= 0 || p.x < -50 || p.x > CONFIG.W + 50) {
        this.weather.particles.splice(i, 1);
      }
    }
    // Spawn weather
    if (this.weather.type === 'rain' && this.weather.particles.length < 200) {
      for (let i = 0; i < 5; i++) {
        this.weather.particles.push({
          x: Math.random() * CONFIG.W, y: -10,
          vx: -20, vy: 400 + Math.random() * 200,
          life: 2, size: 1 + Math.random(),
          alpha: 0.3 + Math.random() * 0.3,
        });
      }
    }
  }

  draw(ctx) {
    const W = CONFIG.W, H = CONFIG.H;
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CONFIG.GROUND_Y);
    skyGrad.addColorStop(0, '#0a0a2e');
    skyGrad.addColorStop(0.4, '#1a0a2e');
    skyGrad.addColorStop(0.7, '#2a1520');
    skyGrad.addColorStop(1, '#2a1a10');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, CONFIG.GROUND_Y);

    // Stars
    for (const s of this.stars) {
      const twinkle = 0.3 + Math.sin(this.time * s.speed * 3 + s.twinkle) * 0.3;
      ctx.globalAlpha = twinkle * 0.8;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;

    // Moon
    ctx.save();
    ctx.fillStyle = 'rgba(255,220,150,0.06)';
    ctx.beginPath(); ctx.arc(1000, 100, 90, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,150,0.12)';
    ctx.beginPath(); ctx.arc(1000, 100, 55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,150,0.2)';
    ctx.beginPath(); ctx.arc(1000, 100, 35, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Clouds
    for (const c of this.clouds) {
      ctx.globalAlpha = c.opacity;
      ctx.fillStyle = '#1a1a2a';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w * 0.5, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(c.x - c.w * 0.25, c.y + 5, c.w * 0.3, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(c.x + c.w * 0.3, c.y + 3, c.w * 0.25, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Mountains (background layer)
    ctx.fillStyle = 'rgba(20,15,30,0.5)';
    for (let i = 0; i < 8; i++) {
      const mx = i * 180 - 20;
      const mh = 80 + Math.sin(i * 2.3) * 60;
      ctx.beginPath();
      ctx.moveTo(mx - 100, CONFIG.GROUND_Y);
      ctx.quadraticCurveTo(mx, CONFIG.GROUND_Y - mh, mx + 100, CONFIG.GROUND_Y);
      ctx.fill();
    }

    // Ground
    const groundGrad = ctx.createLinearGradient(0, CONFIG.GROUND_Y, 0, H);
    groundGrad.addColorStop(0, '#4a3520');
    groundGrad.addColorStop(0.1, '#3a2510');
    groundGrad.addColorStop(0.4, '#2a1a0a');
    groundGrad.addColorStop(1, '#1a0a00');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, CONFIG.GROUND_Y, W, H - CONFIG.GROUND_Y);

    // Ground texture lines
    ctx.strokeStyle = 'rgba(100,70,40,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      const lx = (i * 97 + 30) % W;
      const ly = CONFIG.GROUND_Y + 10 + (i * 23) % (H - CONFIG.GROUND_Y - 20);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + 20 + i % 5 * 5, ly + 5 + i % 3);
      ctx.stroke();
    }

    // Ground line glow
    ctx.strokeStyle = 'rgba(255,200,100,0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.GROUND_Y);
    ctx.lineTo(W, CONFIG.GROUND_Y);
    ctx.stroke();

    // Banners
    for (const b of this.banners) {
      const wave = Math.sin(this.time * 2 + b.waveOffset) * 8;
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 0.4;
      // Pole
      ctx.strokeStyle = 'rgba(180,150,100,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x, b.y - 50);
      ctx.stroke();
      // Flag
      ctx.beginPath();
      ctx.moveTo(b.x, b.y - 50);
      ctx.quadraticCurveTo(b.x + 20 + wave * 0.5, b.y - 42, b.x + 30 + wave, b.y - 35);
      ctx.lineTo(b.x, b.y - 30);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Torches
    for (const t of this.torches) {
      const flicker = Math.sin(this.time * 8 + t.flameOffset) * 0.15 + 0.85;
      const fh = 10 + Math.sin(this.time * 5 + t.flameOffset * 2) * 4;
      // Flame
      const fl = ctx.createRadialGradient(t.x, t.y - 20, 0, t.x, t.y - 20, 15 * flicker);
      fl.addColorStop(0, `rgba(255,200,100,${0.6 * flicker})`);
      fl.addColorStop(0.4, `rgba(255,150,50,${0.4 * flicker})`);
      fl.addColorStop(1, 'rgba(255,100,20,0)');
      ctx.fillStyle = fl;
      ctx.beginPath();
      ctx.arc(t.x, t.y - 20 - fh * 0.3, 15 * flicker, 0, Math.PI * 2);
      ctx.fill();
      // Glow on ground
      const fg = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, 30 * flicker);
      fg.addColorStop(0, `rgba(255,200,100,${0.1 * flicker})`);
      fg.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 30 * flicker, 0, Math.PI * 2);
      ctx.fill();
      // Wooden post
      ctx.fillStyle = 'rgba(80,50,30,0.3)';
      ctx.fillRect(t.x - 2, t.y - 25, 4, 25);
    }

    // Weather particles
    for (const p of this.weather.particles) {
      ctx.strokeStyle = `rgba(150,180,255,${p.alpha})`;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 0.02, p.y + p.vy * 0.02);
      ctx.stroke();
    }
  }

  setWeather(type) {
    this.weather.type = type;
    this.weather.particles = [];
  }
}

// ─── GAME CLASS ─────────────────────────────────────────
class DharmYudhGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.W = this.canvas.width = CONFIG.W;
    this.H = this.canvas.height = CONFIG.H;

    // Systems
    this.audio = new AudioEngine();
    this.particles = new ParticleSystem();
    this.background = new BackgroundSystem(this);

    // Game state
    this.state = 'loading';
    this.battleActive = false;
    this.playerChar = null;
    this.enemyChar = null;
    this.player = null;
    this.enemy = null;
    this.gameTime = 0;
    this.screenShake = 0;
    this.screenShakeX = 0;
    this.screenShakeY = 0;
    this.round = 1;
    this.playerWins = 0;
    this.enemyWins = 0;
    this.maxRounds = 3;
    this.comboCount = 0;
    this.hitStopTimer = 0;
    this.slowMo = 0;
    this.battleTimer = 0;
    this.maxBattleTime = 60; // 60 second round limit
    this.damageNumbers = [];
    this.roundIntroTimer = 0;

    // Game mode
    this.gameMode = 'versus'; // 'versus', 'survival', 'practice'
    this.survivalWave = 1;
    this.survivalKills = 0;

    // Difficulty
    this.difficulty = 'normal'; // 'easy', 'normal', 'hard'

    // Input
    this.keys = {};
    this.lastKeyPress = 0;
    this.keyJustPressed = {};
    this.prevKeys = {};

    // Menu
    this.selectedChar = 0;
    this.menuItems = ['Quick Battle', 'Survival Mode', 'How to Play'];
    this.selectedMenuItem = 0;
    this.showingHelp = false;
    this.showingModeSelect = false;
    this.titlePulse = 0;

    // Toast
    this.toastMessage = '';
    this.toastTimer = 0;

    // Special effects
    this.flashEffect = 0;
    this.koFlash = 0;

    // Bind events
    this.bindInput();
    this.resize();

    // Start loading
    this.loadAssets();
  }

  resize() {
    const container = document.getElementById('game-container');
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  loadAssets() {
    let progress = 0;
    const loadInterval = setInterval(() => {
      progress += Math.random() * 12 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(loadInterval);
        document.getElementById('loading-bar').style.width = '100%';
        setTimeout(() => {
          document.getElementById('loading-screen').classList.add('hidden');
          this.state = 'menu';
          this.audio.init();
          this.gameLoop();
        }, 500);
      }
      document.getElementById('loading-bar').style.width = progress + '%';
      if (progress < 30) document.querySelector('.loading-text').textContent = 'Summoning Warriors...';
      else if (progress < 60) document.querySelector('.loading-text').textContent = 'Forging Divine Weapons...';
      else if (progress < 85) document.querySelector('.loading-text').textContent = 'Preparing Kurukshetra...';
      else document.querySelector('.loading-text').textContent = 'Blessing by Gods...';
    }, 200);
  }

  bindInput() {
    document.addEventListener('keydown', (e) => {
      if (!this.keys[e.key]) this.keyJustPressed[e.key] = true;
      this.keys[e.key] = true;
      this.lastKeyPress = Date.now();

      if (this.state === 'battle' && !this.battleActive && !this.roundActive) {
        if (e.key === 'Enter' || e.key === ' ') this.startRound();
      }

      if (e.key === 'Enter' || e.key === ' ') {
        if (this.state === 'menu') this.menuSelect();
        else if (this.state === 'characterSelect') this.confirmCharacter();
        else if (this.state === 'result') this.handleResultInput();
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (this.state === 'menu') {
          if (e.key === 'ArrowUp') this.selectedMenuItem = Math.max(0, (this.selectedMenuItem - 1 + this.menuItems.length) % this.menuItems.length);
          if (e.key === 'ArrowDown') this.selectedMenuItem = (this.selectedMenuItem + 1) % this.menuItems.length;
          this.audio.playSfx('select', 0.5);
        }
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (this.state === 'characterSelect') {
          const dir = e.key === 'ArrowLeft' ? -1 : 1;
          this.selectedChar = (this.selectedChar + dir + CHARACTERS.length) % CHARACTERS.length;
          this.audio.playSfx('select');
        }
      }

      if (e.key === 'Escape') {
        if (this.showingHelp) this.showingHelp = false;
        else if (this.state === 'characterSelect') this.state = 'menu';
        else if (this.state === 'result') this.state = 'menu';
      }

      if (e.key === '1') this.difficulty = 'easy';
      if (e.key === '2') this.difficulty = 'normal';
      if (e.key === '3') this.difficulty = 'hard';
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    this.setupTouchControls();
  }

  setupTouchControls() {
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (this.state === 'menu') this.menuSelect();
      else if (this.state === 'characterSelect') {
        if (touch.clientX < window.innerWidth / 2) {
          this.selectedChar = (this.selectedChar - 1 + CHARACTERS.length) % CHARACTERS.length;
        } else {
          this.selectedChar = (this.selectedChar + 1) % CHARACTERS.length;
        }
        this.audio.playSfx('select');
      }
      if (this.state === 'result') this.handleResultInput();
      if (this.state === 'battle' && !this.battleActive && !this.roundActive) this.startRound();
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }

  // ─── MENU ─────────────────────────────────────────────
  menuSelect() {
    switch (this.selectedMenuItem) {
      case 0: // Quick Battle
        this.state = 'characterSelect';
        this.selectedChar = 0;
        this.gameMode = 'versus';
        this.audio.playSfx('select', 1.2);
        break;
      case 1: // Survival Mode
        this.state = 'characterSelect';
        this.selectedChar = 0;
        this.gameMode = 'survival';
        this.survivalWave = 1;
        this.survivalKills = 0;
        this.audio.playSfx('select', 1.2);
        break;
      case 2: // How to Play
        this.showingHelp = !this.showingHelp;
        this.audio.playSfx('select');
        break;
    }
  }

  confirmCharacter() {
    this.playerChar = CHARACTERS[this.selectedChar];
    let enemies;
    if (this.gameMode === 'survival') {
      enemies = CHARACTERS.filter(c => c.id !== this.playerChar.id);
      this.enemyChar = enemies[Math.floor(Math.random() * enemies.length)];
    } else {
      enemies = CHARACTERS.filter(c => c.id !== this.playerChar.id);
      this.enemyChar = enemies[Math.floor(Math.random() * enemies.length)];
    }
    this.startBattle();
    this.audio.playSfx('select', 1.5);
  }

  handleResultInput() {
    if (this.state === 'result') {
      if (this.gameMode === 'survival' && this.lastMatchWon) {
        // Continue survival
        this.survivalWave++;
        this.survivalKills++;
        this.state = 'characterSelect';
        this.selectedChar = CHARACTERS.findIndex(c => c.id === this.playerChar.id);
        this.audio.playSfx('select', 1.2);
      } else {
        this.state = 'menu';
        this.audio.playSfx('select');
      }
    }
  }

  // ─── BATTLE ───────────────────────────────────────────
  startBattle() {
    this.state = 'battle';
    this.battleActive = false;
    this.round = 1;
    this.playerWins = 0;
    this.enemyWins = 0;
    this.comboCount = 0;
    this.survivalWave = this.survivalWave || 1;
    this.background.setWeather('clear');

    this.audio.startMusic();
    this.showToast(`${this.playerChar.name} VS ${this.enemyChar.name}!`);
    this.roundIntroTimer = 2.5;

    setTimeout(() => {
      if (this.state === 'battle') this.startRound();
    }, 2500);
  }

  createEntity(charData, isPlayer) {
    const baseX = isPlayer ? 180 : CONFIG.W - 180;
    return {
      ...charData.stats,
      currentHp: charData.stats.hp,
      x: baseX, y: CONFIG.GROUND_Y,
      w: 80, h: 120,
      facing: isPlayer ? 1 : -1,
      state: 'idle',
      stateTimer: 0,
      animFrame: 0,
      attacking: false,
      attackType: 'light',
      attackFrame: 0,
      attackCooldown: 0,
      specialCooldown: 0,
      specialActive: false,
      specialTimer: 0,
      energy: 0,
      maxEnergy: 100,
      blocking: false,
      blockTimer: 0,
      hitFlash: 0,
      invincible: false,
      invTimer: 0,
      died: false,
      velocityX: 0,
      velocityY: 0,
      grounded: true,
      jumpTimer: 0,
      dodgeTimer: 0,
      dodgeCooldown: 0,
      comboCount: 0,
      comboTimer: 0,
      lastX: baseX,
      moveIntent: 0,
      tauntTimer: 0,
      damageDealt: 0,
      hitstun: 0,
    };
  }

  startRound() {
    if (this.state !== 'battle') return;
    this.battleActive = true;
    this.roundActive = true;

    this.player = this.createEntity(this.playerChar, true);
    this.enemy = this.createEntity(this.enemyChar, false);

    // Survival mode: buff enemy per wave
    if (this.gameMode === 'survival') {
      const buff = 1 + (this.survivalWave - 1) * 0.12;
      this.enemy.stats.hp = Math.floor(charData => charData.stats.hp * buff);
      this.enemy.stats.attack = Math.floor(this.enemyChar.stats.attack * buff);
      this.enemy.stats.defense = Math.floor(this.enemyChar.stats.defense * buff);
      this.enemy.currentHp = this.enemy.stats.hp;
    }

    this.gameTime = 0;
    this.battleTimer = this.maxBattleTime;
    this.screenShake = 0;
    this.particles.clear();
    this.flashEffect = 0;
    this.koFlash = 0;
    this.hitStopTimer = 0;
    this.slowMo = 0;
    this.damageNumbers = [];

    this.audio.setMusicIntensity(0.3);
    this.showToast(`Round ${this.round} — FIGHT!`);
    this.audio.playSfx('win');
  }

  showToast(msg) {
    this.toastMessage = msg;
    this.toastTimer = 2;
  }

  // ─── UPDATE ───────────────────────────────────────────
  update(dt) {
    // Prevent dt explosion
    if (dt > 0.05) dt = 0.05;

    this.animFrame = (this.animFrame || 0) + 1;
    this.gameTime += dt;
    this.titlePulse += dt;
    this.particles.update(dt);
    this.background.update(dt);

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShakeX = (Math.random() - 0.5) * this.screenShake * 2;
      this.screenShakeY = (Math.random() - 0.5) * this.screenShake * 2;
      this.screenShake *= Math.pow(0.9, dt * 60);
      if (this.screenShake < 0.3) this.screenShake = 0;
    } else {
      this.screenShakeX = 0;
      this.screenShakeY = 0;
    }

    // Flash decay
    if (this.flashEffect > 0) this.flashEffect -= dt * 3;
    if (this.koFlash > 0) this.koFlash -= dt * 2;

    // Hit stop
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return; // Skip updates during hit stop
    }

    // Toast timer
    if (this.toastTimer > 0) this.toastTimer -= dt;

    // Round intro
    if (this.roundIntroTimer > 0) {
      this.roundIntroTimer -= dt;
      return;
    }

    // Slow mo
    if (this.slowMo > 0) {
      this.slowMo -= dt * 2;
      dt *= 0.3; // Slow motion effect
    }

    if (this.state !== 'battle' || !this.battleActive || !this.roundActive) return;

    // Battle timer
    this.battleTimer -= dt;
    if (this.battleTimer <= 0) {
      this.endRound('time');
      return;
    }

    // Update music intensity based on HP
    const avgHpRatio = ((this.player.currentHp / this.player.stats.hp) + (this.enemy.currentHp / this.enemy.stats.hp)) / 2;
    this.audio.setMusicIntensity(1 - avgHpRatio * 0.7);

    // Combo counter global
    if (this.comboTimer > 0) this.comboTimer -= dt;
    else this.comboCount = 0;

    this.updateEntity(this.player, dt, false);
    this.updateEntity(this.enemy, dt, true);

    // Check round end
    if (this.player.died && this.enemy.died) this.endRound('draw');
    else if (this.player.died) this.endRound('enemy');
    else if (this.enemy.died) this.endRound('player');

    // Resolution
    this.keyJustPressed = {};
  }

  updateEntity(entity, dt, isAI) {
    if (entity.died) return;

    // Timers
    entity.attackCooldown = Math.max(0, entity.attackCooldown - dt);
    entity.specialCooldown = Math.max(0, entity.specialCooldown - dt);
    entity.hitFlash = Math.max(0, entity.hitFlash - dt * 5);
    entity.invTimer = Math.max(0, entity.invTimer - dt);
    entity.invincible = entity.invTimer > 0;
    entity.hitstun = Math.max(0, entity.hitstun - dt);
    entity.dodgeCooldown = Math.max(0, entity.dodgeCooldown - dt);

    // Energy regen
    entity.energy = Math.min(entity.maxEnergy, entity.energy + CONFIG.ENERGY_REGEN * dt);

    // Special active
    if (entity.specialActive) {
      entity.specialTimer -= dt;
      if (entity.specialTimer <= 0) entity.specialActive = false;
    }

    // Combo timer
    if (entity.comboTimer > 0) entity.comboTimer -= dt;
    else entity.comboCount = 0;

    // Dodge timer
    if (entity.dodgeTimer > 0) entity.dodgeTimer -= dt;

    // Hitstun animation
    if (entity.hitstun > 0) {
      entity.animFrame += dt * 60;
      entity.x += entity.velocityX * dt * 0.5;
      return;
    }

    // Physics
    if (!entity.grounded) {
      entity.velocityY += CONFIG.GRAVITY * dt;
      entity.y += entity.velocityY * dt;
      if (entity.y >= CONFIG.GROUND_Y) {
        entity.y = CONFIG.GROUND_Y;
        entity.velocityY = 0;
        entity.grounded = true;
      }
    }
    entity.x += entity.velocityX * dt;
    entity.velocityX *= 0.9;

    // Keep in bounds
    entity.x = clamp(entity.x, 40, CONFIG.W - 40);

    // Face opponent
    const opp = isAI ? this.player : this.enemy;
    if (!entity.attacking && entity.hitstun <= 0) {
      entity.facing = opp.x > entity.x ? 1 : -1;
    }

    // Animation
    entity.animFrame += dt * 60;

    // Footstep particles
    if (Math.abs(entity.x - (entity.lastX || entity.x)) > 3 && Math.random() < 0.15) {
      this.particles.footstep(entity.x, entity.y);
    }
    entity.lastX = entity.x;

    if (isAI) this.updateAI(entity, dt, opp);
    else this.updatePlayer(entity, dt, opp);
  }

  updatePlayer(entity, dt, opp) {
    if (entity.attacking || entity.hitstun > 0) return;

    const dist = Math.abs(entity.x - opp.x);

    // Movement
    entity.moveIntent = 0;
    if (this.keys['ArrowLeft'] || this.keys['a']) { entity.x -= entity.speed * dt; entity.moveIntent = -1; }
    if (this.keys['ArrowRight'] || this.keys['d']) { entity.x += entity.speed * dt; entity.moveIntent = 1; }

    // Jump (W or ArrowUp)
    if ((this.keyJustPressed['w'] || this.keyJustPressed['W'] || this.keyJustPressed['ArrowUp']) && entity.grounded && entity.dodgeCooldown <= 0) {
      entity.velocityY = -600;
      entity.grounded = false;
      entity.jumpTimer = 0.3;
      this.audio.playSfx('jump', rng(0.8, 1.2));
    }

    // Dodge (S or ArrowDown)
    if ((this.keyJustPressed['s'] || this.keyJustPressed['S'] || this.keyJustPressed['ArrowDown']) && entity.dodgeCooldown <= 0 && entity.grounded) {
      entity.dodgeTimer = 0.15;
      entity.dodgeCooldown = 0.6;
      entity.invTimer = 0.2;
      entity.velocityX = entity.facing * -400;
      this.audio.playSfx('dodge', rng(0.9, 1.1));
      this.particles.emit(entity.x, entity.y, {
        count: 5, type: 'smoke', speed: 100, life: 0.2,
        spread: 1, color: '#888888', gravity: 0,
      });
    }

    // Light attack (J)
    if ((this.keyJustPressed['j'] || this.keyJustPressed['J'] || this.keyJustPressed['z'] || this.keyJustPressed['Z']) && entity.attackCooldown <= 0) {
      this.performAttack(entity, opp, 'light');
    }

    // Heavy attack (K)
    if ((this.keyJustPressed['k'] || this.keyJustPressed['K'] || this.keyJustPressed['x'] || this.keyJustPressed['X']) && entity.attackCooldown <= 0 && entity.grounded) {
      this.performAttack(entity, opp, 'heavy');
    }

    // Special (L or C)
    if ((this.keyJustPressed['l'] || this.keyJustPressed['L'] || this.keyJustPressed['c'] || this.keyJustPressed['C']) && entity.specialCooldown <= 0 && entity.energy >= CONFIG.SPECIAL_COST) {
      this.performSpecial(entity, opp);
    }

    // Block (Shift hold)
    entity.blocking = !!(this.keys['Shift'] && !entity.attacking && entity.grounded);
    if (entity.blocking) {
      entity.speed = entity.stats.speed * 0.5;
    } else {
      entity.speed = entity.stats.speed;
    }
  }

  updateAI(entity, dt, opp) {
    if (entity.attacking || entity.hitstun > 0) return;

    entity.stateTimer -= dt;
    const dist = Math.abs(entity.x - opp.x);

    // Difficulty modifiers
    let reactionTime = 0.2;
    let aggressiveness = 0.6;
    let blockChance = 0.2;
    let dodgeChance = 0.1;
    if (this.difficulty === 'easy') { reactionTime = 0.35; aggressiveness = 0.4; blockChance = 0.1; dodgeChance = 0.05; }
    else if (this.difficulty === 'hard') { reactionTime = 0.1; aggressiveness = 0.8; blockChance = 0.35; dodgeChance = 0.2; }

    if (entity.stateTimer <= 0) {
      const roll = Math.random();

      // Dodge if opponent is attacking and close
      if (opp.attacking && dist < 120 && roll < dodgeChance && entity.grounded) {
        entity.dodgeTimer = 0.15;
        entity.dodgeCooldown = 0.6;
        entity.invTimer = 0.2;
        entity.velocityX = entity.facing * -400;
        this.audio.playSfx('dodge', rng(0.9, 1.1));
        entity.stateTimer = 0.3;
        return;
      }

      // Special attack
      if (dist < 150 && entity.energy >= CONFIG.SPECIAL_COST && entity.specialCooldown <= 0 && roll < aggressiveness * 0.25) {
        this.performSpecial(entity, opp);
        entity.stateTimer = 1.5;
        return;
      }

      // Heavy attack
      if (dist < 100 && entity.attackCooldown <= 0 && roll < aggressiveness * 0.4) {
        this.performAttack(entity, opp, 'heavy');
        entity.stateTimer = 0.8;
        return;
      }

      // Light attack
      if (dist < 100 && entity.attackCooldown <= 0 && roll < aggressiveness * 0.6) {
        this.performAttack(entity, opp, 'light');
        entity.stateTimer = 0.5;
        return;
      }

      // Block
      if (dist < 120 && roll < blockChance && entity.grounded) {
        entity.blocking = true;
        entity.blockTimer = 0.2 + Math.random() * 0.3;
        entity.stateTimer = 0.4;
        return;
      }

      // Jump toward opponent
      if (dist > 150 && entity.grounded && roll < 0.3) {
        entity.velocityY = -550;
        entity.grounded = false;
        entity.stateTimer = 0.5;
        // Air attack
        setTimeout(() => {
          if (!this.battleActive || entity.died || !entity.grounded) return;
          const newDist = Math.abs(entity.x - opp.x);
          if (newDist < 120 && entity.attackCooldown <= 0) {
            this.performAttack(entity, opp, 'light');
          }
        }, 200);
      }

      // Move toward/away
      if (!entity.blocking) {
        const moveDir = (dist > 120) ? 1 : (dist < 60 ? -1 : (roll < 0.5 ? 1 : -1));
        entity.x += moveDir * entity.speed * dt * (0.3 + Math.random() * 0.5) * aggressiveness;
      }

      entity.stateTimer = reactionTime + Math.random() * 0.3;
    }

    // Block maintenance
    if (entity.blocking) {
      entity.blockTimer -= dt;
      if (entity.blockTimer <= 0) entity.blocking = false;
    }
  }

  performAttack(attacker, defender, type) {
    const isHeavy = type === 'heavy';
    attacker.attacking = true;
    attacker.attackType = type;
    attacker.attackFrame = 0;
    attacker.attackCooldown = isHeavy ? 0.6 : 0.35;

    if (!attacker.grounded) {
      // Air attack
      attacker.velocityY = 200;
      attacker.attackCooldown = 0.4;
    }

    // Forward lunge
    attacker.velocityX = attacker.facing * (isHeavy ? 200 : 120);

    const hitDelay = isHeavy ? 250 : 120;
    const hitDist = isHeavy ? 130 : 90;

    setTimeout(() => {
      if (!this.battleActive || attacker.died || !this.roundActive) {
        attacker.attacking = false;
        return;
      }

      const dist = Math.abs(attacker.x - defender.x);
      if (dist < hitDist && !defender.invincible) {
        let damage = isHeavy ? attacker.attack * 1.5 + rng(0, 4) : attacker.attack + rng(0, 3);
        const canKnockdown = isHeavy;
        const knockback = isHeavy ? 60 : 30;

        if (defender.blocking) {
          damage *= 0.2;
          this.particles.hitSparks((attacker.x + defender.x) / 2, defender.y - 20, '#ffd700');
          this.audio.playSfx('block');
          defender.blocking = false;
          defender.hitstun = 0.1;
        } else {
          // Hit stop
          this.hitStopTimer = isHeavy ? 0.1 : 0.05;

          if (isHeavy) {
            this.particles.heavyHitSparks(defender.x, defender.y - 20);
            this.screenShake = 12;
            this.audio.playSfx('heavy', 0.8 + Math.random() * 0.3);
          } else {
            this.particles.hitSparks(defender.x, defender.y - 20, '#ff6b35');
            this.screenShake = 5;
            this.audio.playSfx('hit', 0.8 + Math.random() * 0.4);
          }

          defender.hitFlash = 1;
          defender.hitstun = isHeavy ? 0.35 : 0.15;

          // Knockback
          const kbDir = defender.x > attacker.x ? 1 : -1;
          defender.velocityX = kbDir * knockback;
          if (canKnockdown) {
            defender.velocityY = -200;
            defender.grounded = false;
          }

          // Combo
          attacker.comboCount++;
          attacker.comboTimer = CONFIG.COMBO_WINDOW;
          if (attacker.comboCount >= 3) {
            this.comboCount = Math.max(this.comboCount, attacker.comboCount);
            this.flashEffect = 0.3;
          }
          if (attacker.comboCount > 1) {
            damage *= 1 + (attacker.comboCount - 1) * 0.08;
            if (attacker.comboCount % 3 === 0) this.audio.playSfx('combo');
          }

          // Damage number
          this.damageNumbers.push({
            x: defender.x, y: defender.y - 40,
            text: Math.ceil(damage).toString(),
            color: isHeavy ? '#ff4400' : '#ffd700',
            life: 0.8, maxLife: 0.8,
            vy: -80 - Math.random() * 40,
          });

          attacker.damageDealt += damage;
        }

        defender.currentHp = Math.max(0, defender.currentHp - damage);

        if (defender.currentHp <= 0 && !defender.died) {
          defender.died = true;
          this.particles.deathBurst(defender.x, defender.y - 30);
          this.screenShake = 20;
          this.audio.playSfx('death');
          // Slow mo on kill
          this.slowMo = 0.3;
          this.koFlash = 1;
        }
      }

      attacker.attacking = false;
    }, hitDelay);

    // Animation tick
    const attackAnim = setInterval(() => {
      attacker.attackFrame++;
      if (attacker.attackFrame > (isHeavy ? 5 : 3)) clearInterval(attackAnim);
    }, 50);
  }

  performSpecial(user, target) {
    user.energy -= CONFIG.SPECIAL_COST;
    user.specialCooldown = CONFIG.SPECIAL_COOLDOWN;
    user.specialActive = true;
    user.specialTimer = 0.6;
    user.attacking = true;

    const char = (user === this.player) ? this.playerChar : this.enemyChar;
    if (char && char.specialEffect) {
      char.specialEffect(this, user.x, user.y - 30, user.facing);
    }

    setTimeout(() => {
      if (!this.battleActive || user.died || !this.roundActive) {
        user.attacking = false;
        return;
      }
      const dist = Math.abs(user.x - target.x);
      let damage = user.specialDmg + rng(0, 8);

      if (dist < 200) {
        if (target.blocking) {
          damage *= 0.3;
          this.audio.playSfx('block');
        } else {
          this.hitStopTimer = 0.15;
          this.screenShake = 18;
        }

        target.currentHp = Math.max(0, target.currentHp - damage);
        target.hitFlash = 1;
        target.hitstun = 0.4;
        target.velocityX = (target.x > user.x ? 1 : -1) * 80;
        target.velocityY = -150;
        target.grounded = false;

        this.damageNumbers.push({
          x: target.x, y: target.y - 50,
          text: Math.ceil(damage).toString(),
          color: '#ff00ff',
          life: 1.0, maxLife: 1.0,
          vy: -100,
        });

        // Slow mo on special hit
        this.slowMo = 0.2;

        this.particles.hitSparks(target.x, target.y - 20, '#ffffff');
        this.audio.playSfx('hit', 1.5);

        if (target.currentHp <= 0 && !target.died) {
          target.died = true;
          this.particles.deathBurst(target.x, target.y - 30);
          this.screenShake = 25;
          this.koFlash = 1.5;
          this.slowMo = 0.5;
          this.audio.playSfx('death');
          this.audio.playSfx('ko');
        }
      }
      user.attacking = false;
    }, 400);

    // Animation ticks
    const anim = setInterval(() => {
      user.attackFrame++;
      if (user.attackFrame > 6) clearInterval(anim);
    }, 60);
  }

  endRound(winner) {
    this.battleActive = false;
    this.roundActive = false;

    if (winner === 'player') {
      this.playerWins++;
      this.showToast('You Win the Round!');
      this.audio.playSfx('win');
    } else if (winner === 'enemy') {
      this.enemyWins++;
      this.showToast('Opponent Wins!');
    } else if (winner === 'draw') {
      this.showToast('Draw!');
    } else if (winner === 'time') {
      if (this.player.currentHp > this.enemy.currentHp) {
        this.playerWins++;
        this.showToast('Time! You Win!');
      } else if (this.enemy.currentHp > this.player.currentHp) {
        this.enemyWins++;
        this.showToast('Time! Opponent Wins!');
      } else {
        this.showToast('Time! Draw!');
      }
    }

    if (this.gameMode === 'versus') {
      if (this.playerWins >= 2 || this.enemyWins >= 2) {
        this.endMatch(this.playerWins > this.enemyWins ? 'player' : 'enemy');
      } else {
        this.round++;
        setTimeout(() => {
          if (this.state === 'battle') {
            this.showToast(`Round ${this.round}`);
            setTimeout(() => this.startRound(), 1200);
          }
        }, 1500);
      }
    } else if (this.gameMode === 'survival') {
      if (winner === 'player') {
        // Next survival wave
        this.survivalWave++;
        this.survivalKills++;
        setTimeout(() => {
          if (this.state === 'battle') {
            let enemies = CHARACTERS.filter(c => c.id !== this.playerChar.id);
            this.enemyChar = enemies[Math.floor(Math.random() * enemies.length)];
            this.showToast(`Wave ${this.survivalWave} — ${this.enemyChar.name}!`);
            setTimeout(() => this.startRound(), 1500);
          }
        }, 2000);
      } else {
        this.endMatch('enemy');
      }
    }
  }

  endMatch(winner) {
    this.audio.stopMusic();
    this.state = 'result';
    this.matchWinner = winner;
    this.lastMatchWon = winner === 'player';
    if (winner === 'player') this.audio.playSfx('win');
    else {
      this.audio.playSfx('death');
      this.audio.playSfx('ko');
    }
  }

  // ─── DRAW ─────────────────────────────────────────────
  draw() {
    const ctx = this.ctx;
    ctx.save();

    // Screen shake
    if (this.screenShake > 0.3) {
      ctx.translate(this.screenShakeX, this.screenShakeY);
    }

    // Background
    this.background.draw(ctx);

    // State-specific content
    switch (this.state) {
      case 'menu': this.drawMenu(ctx); break;
      case 'characterSelect': this.drawCharacterSelect(ctx); break;
      case 'battle': this.drawBattle(ctx); break;
      case 'result': this.drawBattle(ctx); this.drawResult(ctx); break;
    }

    // Flash overlay
    if (this.flashEffect > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashEffect * 0.3})`;
      ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
    }

    // KO flash
    if (this.koFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.sin(this.koFlash * 20) * 0.3 * this.koFlash})`;
      ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
    }

    // Toast
    if (this.toastTimer > 0) this.drawToast(ctx);

    ctx.restore();
  }

  drawToast(ctx) {
    const alpha = Math.min(1, this.toastTimer * 2);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeStyle = 'rgba(255,200,100,0.4)';
    ctx.lineWidth = 2;
    const tw = 420;
    const th = 65;
    const tx = (CONFIG.W - tw) / 2;
    const ty = CONFIG.H / 2 - 80;
    ctx.shadowColor = 'rgba(255,200,100,0.2)';
    ctx.shadowBlur = 20;
    ctx.fillRect(tx, ty, tw, th);
    ctx.shadowBlur = 0;
    ctx.strokeRect(tx, ty, tw, th);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.toastMessage, CONFIG.W / 2, ty + th / 2);
    ctx.restore();
  }

  drawMenu(ctx) {
    ctx.save();
    // Title glow
    const tg = ctx.createRadialGradient(CONFIG.W/2, 180, 0, CONFIG.W/2, 180, 350);
    tg.addColorStop(0, 'rgba(255,200,100,0.06)');
    tg.addColorStop(1, 'transparent');
    ctx.fillStyle = tg;
    ctx.fillRect(0, 0, CONFIG.W, 400);

    ctx.textAlign = 'center';
    // Title shadow
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur = 30 + Math.sin(this.titlePulse * 2) * 10;
    ctx.font = 'bold 76px Orbitron, sans-serif';
    const grad = ctx.createLinearGradient(CONFIG.W/2 - 250, 0, CONFIG.W/2 + 250, 0);
    grad.addColorStop(0, '#ff6b35');
    grad.addColorStop(0.5, '#ffd700');
    grad.addColorStop(1, '#ff6b35');
    ctx.fillStyle = grad;
    ctx.fillText('DHARMYUDH', CONFIG.W/2, 170);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 24px Rajdhani, sans-serif';
    ctx.fillStyle = '#b8966a';
    ctx.fillText('द  र ् म  य ु द  ् ध', CONFIG.W/2, 215);

    ctx.font = '16px Rajdhani, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('THE GREAT WAR OF KURUKSHETRA', CONFIG.W/2, 248);

    // Decorative line
    ctx.strokeStyle = 'rgba(255,200,100,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CONFIG.W/2 - 180, 270);
    ctx.lineTo(CONFIG.W/2 + 180, 270);
    ctx.stroke();

    // Menu items
    const startY = 330;
    const itemH = 58;
    this.menuItems.forEach((item, i) => {
      const y = startY + i * itemH;
      const selected = i === this.selectedMenuItem;
      if (selected) {
        ctx.fillStyle = 'rgba(255,200,100,0.08)';
        const rw = 280;
        ctx.fillRect(CONFIG.W/2 - rw/2, y - 18, rw, 46);
        ctx.strokeStyle = 'rgba(255,200,100,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(CONFIG.W/2 - rw/2, y - 18, rw, 46);
      }
      ctx.font = `${selected ? 'bold 24px' : '20px'} Rajdhani, sans-serif`;
      ctx.fillStyle = selected ? '#ffd700' : 'rgba(255,255,255,0.45)';
      ctx.fillText(item, CONFIG.W/2, y);
      if (selected) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px sans-serif';
        ctx.fillText('▶', CONFIG.W/2 - 130, y);
        ctx.fillText('◀', CONFIG.W/2 + 130, y);
      }
    });

    // Difficulty indicator
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '13px Rajdhani, sans-serif';
    const diffNames = { easy: 'Easy [1]', normal: 'Normal [2]', hard: 'Hard [3]' };
    ctx.fillText(`Difficulty: ${diffNames[this.difficulty]}`, CONFIG.W/2, startY + itemH * 3 + 15);

    // Controls
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '12px Rajdhani, sans-serif';
    ctx.fillText('↑↓ Navigate  •  Enter Select  •  ←→ Move  •  J Light  •  K Heavy  •  L Special  •  Shift Block  •  W/S Jump/Dodge', CONFIG.W/2, CONFIG.H - 35);

    // How to play overlay
    if (this.showingHelp) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 28px Rajdhani, sans-serif';
      ctx.fillText('HOW TO PLAY', CONFIG.W/2, 220);
      const helpLines = [
        ['← → or A/D', 'Move your warrior'],
        ['W or ↑', 'Jump / Air attack'],
        ['S or ↓', 'Dodge (invincible frames)'],
        ['J or Z', 'Light Attack (fast)'],
        ['K or X', 'Heavy Attack (powerful)'],
        ['L or C', 'Special Move (costs 50 energy)'],
        ['Shift (hold)', 'Block (reduces damage)'],
        ['', ''],
        ['BUILD ENERGY by fighting!'],
        ['LAND COMBOS for bonus damage!'],
        ['SURVIVAL MODE: defeat waves of enemies!'],
      ];
      ctx.textAlign = 'center';
      helpLines.forEach((line, i) => {
        const y = 280 + i * 28;
        ctx.font = '16px Rajdhani, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(line[0] || line, CONFIG.W/2 - 150, y);
        if (line[1]) {
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.textAlign = 'left';
          ctx.fillText(line[1], CONFIG.W/2 + 50, y);
          ctx.textAlign = 'center';
        }
      });
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '14px Rajdhani, sans-serif';
      ctx.fillText('Press Esc to close', CONFIG.W/2, CONFIG.H - 60);
    }
    ctx.restore();
  }

  drawCharacterSelect(ctx) {
    const char = CHARACTERS[this.selectedChar];
    ctx.save();

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 26px Rajdhani, sans-serif';
    ctx.fillText('SELECT YOUR WARRIOR', CONFIG.W/2, 45);

    // Character glow
    const cx = CONFIG.W/2, cy = 340;
    const cg = ctx.createRadialGradient(cx, cy - 30, 0, cx, cy - 30, 200);
    cg.addColorStop(0, `${char.color}20`);
    cg.addColorStop(1, 'transparent');
    ctx.fillStyle = cg;
    ctx.fillRect(cx - 200, cy - 200, 400, 400);

    // Large character preview
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(2.8, 2.8);
    char.draw(ctx, 0, 0, 30, 50, 1, this.animFrame * 2, { attacking: false, specialActive: true }, false);
    ctx.restore();

    // Name
    ctx.fillStyle = char.color;
    ctx.font = 'bold 38px Rajdhani, sans-serif';
    ctx.fillText(char.name, cx, 490);

    // Devanagari
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '22px Noto Sans Devanagari, sans-serif';
    ctx.fillText(char.devanagari, cx, 520);

    // Title
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '18px Rajdhani, sans-serif';
    ctx.fillText(char.title, cx, 548);

    // Taunt
    ctx.fillStyle = 'rgba(255,200,100,0.3)';
    ctx.font = '15px Rajdhani, sans-serif';
    ctx.fillText(`"${char.taunt}"`, cx, 575);

    // Weapon
    ctx.fillStyle = 'rgba(255,200,100,0.5)';
    ctx.font = '14px Rajdhani, sans-serif';
    ctx.fillText(`⚔ ${char.weapon} (${char.weaponDevanagari})`, cx, 600);

    // Stats
    const statY = 625;
    const statW = 200;
    const statH = 10;
    const statGap = 22;
    const stats = [
      { label: 'HP', value: char.stats.hp, max: 180, color: '#ef5350' },
      { label: 'ATK', value: char.stats.attack, max: 25, color: '#ff7043' },
      { label: 'DEF', value: char.stats.defense, max: 18, color: '#42a5f5' },
      { label: 'SPD', value: char.stats.speed, max: 240, color: '#66bb6a' },
      { label: 'SPC', value: char.stats.specialDmg, max: 55, color: '#ab47bc' },
    ];
    stats.forEach((stat, i) => {
      const sy = statY + i * statGap;
      const fill = (stat.value / stat.max) * statW;
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '12px Rajdhani, sans-serif';
      ctx.fillText(stat.label, cx - statW/2 - 35, sy + 4);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(cx - statW/2, sy - 4, statW, statH);
      ctx.fillStyle = stat.color;
      ctx.fillRect(cx - statW/2, sy - 4, fill, statH);
    });

    // Navigation
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '16px Rajdhani, sans-serif';
    ctx.fillText('◄  ←  →  ►', cx, 700);
    ctx.fillText('Enter to Select  |  Esc to Back', cx, 718);

    ctx.restore();
  }

  drawBattle(ctx) {
    if (!this.player || !this.enemy) return;

    // Battlefield extras
    this.drawBattlefield(ctx);

    // Draw characters (sort by y for depth)
    const entities = [
      { e: this.player, c: this.playerChar },
      { e: this.enemy, c: this.enemyChar }
    ];
    entities.sort((a, b) => a.e.y - b.e.y);

    for (const { e, c } of entities) {
      this.drawEntity(ctx, e, c);
    }

    // Damage numbers
    this.drawDamageNumbers(ctx);

    // Particles on top
    this.particles.draw(ctx);

    // HUD
    this.drawHUD(ctx);

    // Round intro
    if (this.roundIntroTimer > 0) {
      const alpha = Math.min(this.roundIntroTimer * 2, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 48px Orbitron, sans-serif';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 30;
      ctx.fillText('ROUND ' + this.round, CONFIG.W/2, CONFIG.H/2 - 20);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '24px Rajdhani, sans-serif';
      ctx.fillText('FIGHT!', CONFIG.W/2, CONFIG.H/2 + 35);
      ctx.restore();
    }

    // Survival wave counter
    if (this.gameMode === 'survival') {
      ctx.save();
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,200,100,0.4)';
      ctx.font = '14px Rajdhani, sans-serif';
      ctx.fillText(`Wave ${this.survivalWave} • Kills: ${this.survivalKills}`, CONFIG.W - 20, 45);
      ctx.restore();
    }

    // Controls hint
    if (this.gameTime < 6) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - this.gameTime / 6);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.font = '12px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('←→ Move | J Light | K Heavy | L Special | Shift Block | W Jump | S Dodge', CONFIG.W/2, CONFIG.H - 12);
      ctx.restore();
    }
  }

  drawBattlefield(ctx) {
    ctx.save();

    // Dust clouds
    for (let i = 0; i < 5; i++) {
      const dx = (this.gameTime * 15 + i * 230) % CONFIG.W;
      const dy = CONFIG.GROUND_Y - 5 - Math.sin(i * 2) * 15;
      ctx.fillStyle = 'rgba(100,80,50,0.03)';
      ctx.beginPath();
      ctx.arc(dx, dy, 35 + Math.sin(this.gameTime * 0.5 + i) * 10, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawEntity(ctx, entity, charData) {
    if (!entity || !charData) return;
    ctx.save();

    // Shadow
    const shadowScale = 1 - (CONFIG.GROUND_Y - entity.y) / 200;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(entity.x, CONFIG.GROUND_Y + 5, 35 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dodge effect
    if (entity.dodgeTimer > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(entity.dodgeTimer * 40) * 0.3;
    }

    const flash = entity.hitFlash > 0;
    const state = {
      attacking: entity.attacking,
      attackType: entity.attackType,
      attackFrame: entity.attackFrame,
      specialActive: entity.specialActive,
      blocking: entity.blocking,
    };

    charData.draw(ctx, entity.x, entity.y - entity.h/2, entity.w, entity.h, entity.facing, entity.animFrame, state, flash);

    // Energy bar above (small)
    const barW = 60;
    const barH = 4;
    const barX = entity.x - barW / 2;
    const barY = entity.y - entity.h - 18;

    // Energy
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY + barH + 1, barW, 3);
    ctx.fillStyle = '#42a5f5';
    ctx.fillRect(barX, barY + barH + 1, barW * (entity.energy / entity.maxEnergy), 3);

    // Block indicator
    if (entity.blocking) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(entity.x, entity.y - 20, 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();
      // Shield text
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BLOCK', entity.x, entity.y - 20);
    }

    // Character name
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px Rajdhani, sans-serif';
    ctx.fillText(charData.name, entity.x, barY - 4);

    ctx.restore();
  }

  drawDamageNumbers(ctx) {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.y += dn.vy * (1 / 60);
      dn.life -= 1 / 60;
      dn.vy *= 0.97;

      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = dn.life / dn.maxLife;
      ctx.textAlign = 'center';
      ctx.font = `bold ${28 + (1 - dn.life / dn.maxLife) * 8}px Rajdhani, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = dn.color;
      ctx.fillText(dn.text, dn.x, dn.y);
      ctx.shadowBlur = 0;
      // Outline
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeText(dn.text, dn.x, dn.y);
      ctx.restore();
    }
  }

  drawHUD(ctx) {
    if (!this.player || !this.enemy) return;
    ctx.save();

    // Player HUD - left
    const pBarX = 20;
    const pBarW = 280;
    const pBarY = 50;

    // Player name + HP text
    ctx.textAlign = 'left';
    ctx.fillStyle = this.playerChar.color;
    ctx.font = 'bold 20px Rajdhani, sans-serif';
    ctx.fillText(this.playerChar.name, pBarX, pBarY);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '14px Rajdhani, sans-serif';
    ctx.fillText(`${Math.ceil(this.player.currentHp)} / ${this.player.stats.hp}`, pBarX + pBarW - 70, pBarY);

    // HP bar
    const hpY = pBarY + 12;
    const hpB = 16;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(pBarX, hpY, pBarW, hpB);
    const hpR = this.player.currentHp / this.player.stats.hp;
    const hpC = hpR > 0.5 ? '#66bb6a' : hpR > 0.25 ? '#ffa726' : '#ef5350';
    ctx.fillStyle = hpC;
    ctx.fillRect(pBarX, hpY, pBarW * hpR, hpB);
    // HP bar shine
    const shineGrad = ctx.createLinearGradient(pBarX, hpY, pBarX, hpY + hpB);
    shineGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
    shineGrad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    shineGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = shineGrad;
    ctx.fillRect(pBarX, hpY, pBarW, hpB);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pBarX, hpY, pBarW, hpB);

    // Energy bar
    const enY = hpY + hpB + 4;
    const enB = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(pBarX, enY, pBarW, enB);
    ctx.fillStyle = '#42a5f5';
    ctx.fillRect(pBarX, enY, pBarW * (this.player.energy / this.player.maxEnergy), enB);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '9px Rajdhani, sans-serif';
    ctx.fillText('ENERGY', pBarX + 3, enY + 7);

    // Combo counter
    if (this.player.comboCount > 1) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 28px Rajdhani, sans-serif';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 15;
      ctx.fillText(`${this.player.comboCount}x COMBO!`, pBarX, enY + 38);
      ctx.shadowBlur = 0;
    }

    // Global combo
    if (this.comboCount > 2) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 20px Rajdhani, sans-serif';
      ctx.fillText(`${this.comboCount} HIT!`, CONFIG.W/2, 70);
    }

    // Enemy HUD - right
    const eBarX = CONFIG.W - 20 - pBarW;
    const eBarY = 50;

    ctx.textAlign = 'right';
    ctx.fillStyle = this.enemyChar.color;
    ctx.font = 'bold 20px Rajdhani, sans-serif';
    ctx.fillText(this.enemyChar.name, CONFIG.W - 20, eBarY);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '14px Rajdhani, sans-serif';
    ctx.fillText(`${Math.ceil(this.enemy.currentHp)} / ${this.enemy.stats.hp}`, eBarX + 70, eBarY);

    // HP bar
    const eHpY = eBarY + 12;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(eBarX, eHpY, pBarW, hpB);
    const eHpR = this.enemy.currentHp / this.enemy.stats.hp;
    const eHpC = eHpR > 0.5 ? '#66bb6a' : eHpR > 0.25 ? '#ffa726' : '#ef5350';
    ctx.fillStyle = eHpC;
    ctx.fillRect(eBarX, eHpY, pBarW * eHpR, hpB);
    const eShineGrad = ctx.createLinearGradient(eBarX, eHpY, eBarX, eHpY + hpB);
    eShineGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
    eShineGrad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    eShineGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = eShineGrad;
    ctx.fillRect(eBarX, eHpY, pBarW, hpB);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(eBarX, eHpY, pBarW, hpB);

    // Round timer (center top)
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = 'bold 22px Rajdhani, sans-serif';
    const timeStr = Math.ceil(this.battleTimer).toString();
    ctx.fillText(timeStr, CONFIG.W/2, 45);
    // Timer circle
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    const timerPct = this.battleTimer / this.maxBattleTime;
    ctx.beginPath();
    ctx.arc(CONFIG.W/2, 35, 22, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * timerPct);
    ctx.stroke();

    // Wins indicator
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '12px Rajdhani, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Wins: ${this.playerWins}`, 25, 20);
    ctx.textAlign = 'right';
    ctx.fillText(`Wins: ${this.enemyWins}`, CONFIG.W - 25, 20);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = '11px Rajdhani, sans-serif';
    ctx.fillText(`ROUND ${this.round}`, CONFIG.W/2, 18);

    // Survival mode: wave info
    if (this.gameMode === 'survival') {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 18px Rajdhani, sans-serif';
      ctx.globalAlpha = 0.3 + Math.sin(this.gameTime * 2) * 0.15;
      ctx.fillText(`WAVE ${this.survivalWave}`, CONFIG.W/2, CONFIG.H - 35);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  drawResult(ctx) {
    ctx.save();
    const won = this.matchWinner === 'player';

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

    // Particle celebration for win
    if (won) {
      if (Math.random() < 0.1) {
        this.particles.emit(Math.random() * CONFIG.W, -10, {
          count: 3, type: 'sparkle', speed: 100, life: 1.5,
          angle: Math.PI / 2, color: ['#ffd700', '#ffffff', '#ff6b35'],
          gravity: 50, fadeOut: true,
        });
      }
    }

    // Result box
    const bx = CONFIG.W / 2 - 220;
    const by = CONFIG.H / 2 - 120;
    const bw = 440;
    const bh = 240;

    ctx.shadowColor = won ? 'rgba(255,215,0,0.3)' : 'rgba(255,0,0,0.3)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = 'rgba(10,10,20,0.95)';
    ctx.strokeStyle = won ? 'rgba(255,215,0,0.4)' : 'rgba(255,50,50,0.4)';
    ctx.lineWidth = 2;
    ctx.fillRect(bx, by, bw, bh);
    ctx.shadowBlur = 0;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.textAlign = 'center';

    if (won) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 54px Orbitron, sans-serif';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 25;
      ctx.fillText('VICTORY!', CONFIG.W / 2, by + 80);
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '20px Rajdhani, sans-serif';
      ctx.fillText(`${this.playerChar.name} triumphs over ${this.enemyChar.name}!`, CONFIG.W / 2, by + 125);

      ctx.fillStyle = 'rgba(255,200,100,0.4)';
      ctx.font = '16px Rajdhani, sans-serif';
      ctx.fillText(`"${this.playerChar.taunt}"`, CONFIG.W / 2, by + 158);

      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '14px Noto Sans Devanagari, sans-serif';
      ctx.fillText('धर्मो रक्षति रक्षितः', CONFIG.W / 2, by + 188);
    } else {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 54px Orbitron, sans-serif';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 20;
      ctx.fillText('DEFEATED', CONFIG.W / 2, by + 80);
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '20px Rajdhani, sans-serif';
      ctx.fillText(`${this.enemyChar.name} prevails this time...`, CONFIG.W / 2, by + 125);

      ctx.fillStyle = 'rgba(255,200,100,0.3)';
      ctx.font = '16px Rajdhani, sans-serif';
      ctx.fillText(`"${this.enemyChar.taunt}"`, CONFIG.W / 2, by + 158);

      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '15px Rajdhani, sans-serif';
      ctx.fillText('Train harder and return to the battlefield!', CONFIG.W / 2, by + 188);
    }

    // Survival mode extra info
    if (this.gameMode === 'survival') {
      ctx.fillStyle = 'rgba(255,200,100,0.4)';
      ctx.font = '16px Rajdhani, sans-serif';
      ctx.fillText(`Survived ${this.survivalKills} waves`, CONFIG.W / 2, by + 215);
    }

    // Blinking prompt
    const blink = Math.sin(this.gameTime * 3) > 0;
    if (blink) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '16px Rajdhani, sans-serif';
      const prompt = (this.gameMode === 'survival' && won)
        ? 'Press Enter to continue or Esc to menu'
        : 'Press Enter or tap to continue';
      ctx.fillText(prompt, CONFIG.W / 2, by + bh + 25);
    }

    ctx.restore();
  }

  // ─── GAME LOOP ────────────────────────────────────────
  gameLoop() {
    const dt = 1 / 60;
    this.update(dt);
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }
}

// ─── INIT ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  window.game = new DharmYudhGame('gameCanvas');
});
