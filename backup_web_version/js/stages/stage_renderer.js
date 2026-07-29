// ============================================================
// DHARMYUDH - Stage Visual Engine & Parallax Renderer
// ============================================================

import { CONFIG, clamp } from '../engine/config.js';

export class StageRenderer {
  constructor(game) {
    this.game = game;
    this.currentStage = 'kurukshetra';
    this.layers = [];
    this.weather = {
      type: 'clear', // 'clear', 'rain', 'storm', 'mist'
      intensity: 0.0,
      wind: 0,
      particles: []
    };
    
    this.timeOfDay = 0; // 0 = dawn, 0.5 = noon, 1.0 = twilight/night
    this.stageData = {};
    
    this.setStage(this.currentStage);
  }

  setStage(stageId) {
    this.currentStage = stageId;
    this.layers = [];
    
    switch (stageId) {
      case 'kurukshetra':
        this.initKurukshetra();
        break;
      case 'indraprastha':
        this.initIndraprastha();
        break;
      case 'hastinapura':
        this.initHastinapura();
        break;
      case 'celestial_realm':
        this.initCelestialRealm();
        break;
      case 'forest_of_dharma':
        this.initForestOfDharma();
        break;
      case 'bridge_of_lanka':
        this.initBridgeOfLanka();
        break;
    }
  }

  update(dt) {
    // Tick background elements
    for (const layer of this.layers) {
      if (layer.update) layer.update(dt);
    }
    
    // Tick dynamic weather
    this.updateWeather(dt);
  }

  updateWeather(dt) {
    if (this.weather.type === 'clear') return;
    
    // Spawn weather particles (rain, dust, snow)
    if (this.weather.particles.length < 100 * this.weather.intensity) {
      this.weather.particles.push({
        x: Math.random() * CONFIG.W * 1.5 - CONFIG.W * 0.25,
        y: -10,
        speedY: 400 + Math.random() * 200,
        speedX: this.weather.wind + (Math.random() - 0.5) * 50,
        length: 10 + Math.random() * 15,
        alpha: Math.random() * 0.5
      });
    }

    // Tick weather particles
    for (let i = this.weather.particles.length - 1; i >= 0; i--) {
      const p = this.weather.particles[i];
      p.x += p.speedX * dt;
      p.y += p.speedY * dt;

      if (p.y > CONFIG.H) {
        this.weather.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    const camX = this.game.renderer.cameraX;
    
    // Draw layers with parallax scrolling multipliers
    for (const layer of this.layers) {
      ctx.save();
      
      // Calculate parallax translation: closer layers move faster
      const offsetX = camX * layer.parallaxFactor;
      ctx.translate(offsetX, 0);
      
      layer.draw(ctx);
      ctx.restore();
    }

    // Draw Weather overlay
    this.drawWeather(ctx);
  }

  drawWeather(ctx) {
    if (this.weather.type === 'clear') return;
    ctx.save();

    if (this.weather.type === 'rain' || this.weather.type === 'storm') {
      ctx.strokeStyle = 'rgba(174, 194, 224, 0.4)';
      ctx.lineWidth = 1.0;
      for (const p of this.weather.particles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.speedX * 0.02, p.y + p.speedY * 0.02);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // STAGE SPECIFIC BUILDERS (Vector art driven for zero load latency)

  initKurukshetra() {
    this.weather.type = 'storm';
    this.weather.intensity = 0.5;
    this.weather.wind = -50;

    // Layer 0: Sky (Distant horizon)
    this.layers.push({
      parallaxFactor: 0.1,
      draw: (ctx) => {
        const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.H);
        grad.addColorStop(0, '#100a1c'); // Deep storm purple
        grad.addColorStop(0.5, '#35122c');
        grad.addColorStop(1, '#651c32'); // Dark horizon orange
        ctx.fillStyle = grad;
        ctx.fillRect(-CONFIG.W, 0, CONFIG.W * 3, CONFIG.H);
      }
    });

    // Layer 1: Distant Mountains
    this.layers.push({
      parallaxFactor: 0.25,
      draw: (ctx) => {
        ctx.fillStyle = '#220b1e';
        ctx.beginPath();
        ctx.moveTo(-CONFIG.W, CONFIG.GROUND_Y);
        ctx.lineTo(-600, 250);
        ctx.lineTo(-200, 420);
        ctx.lineTo(300, 180);
        ctx.lineTo(800, 390);
        ctx.lineTo(CONFIG.W * 2, CONFIG.GROUND_Y);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Layer 2: War Tents & Flags (Animated waving)
    let time = 0;
    this.layers.push({
      parallaxFactor: 0.5,
      update: (dt) => { time += dt; },
      draw: (ctx) => {
        ctx.fillStyle = '#421626';
        
        // Draw silhouettes of tents
        for (let x = -800; x < CONFIG.W * 1.5; x += 400) {
          ctx.beginPath();
          ctx.moveTo(x, CONFIG.GROUND_Y);
          ctx.lineTo(x + 100, CONFIG.GROUND_Y - 120);
          ctx.lineTo(x + 200, CONFIG.GROUND_Y);
          ctx.closePath();
          ctx.fill();

          // Draw waving flag poles
          ctx.strokeStyle = '#18070d';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x + 100, CONFIG.GROUND_Y - 120);
          ctx.lineTo(x + 100, CONFIG.GROUND_Y - 200);
          ctx.stroke();

          // Flag banner waving path
          ctx.fillStyle = '#ff8f00';
          ctx.beginPath();
          ctx.moveTo(x + 100, CONFIG.GROUND_Y - 200);
          const wave = Math.sin(time * 5 + x * 0.01) * 10;
          ctx.quadraticCurveTo(x + 140, CONFIG.GROUND_Y - 210 + wave, x + 180, CONFIG.GROUND_Y - 200);
          ctx.lineTo(x + 180, CONFIG.GROUND_Y - 160);
          ctx.quadraticCurveTo(x + 140, CONFIG.GROUND_Y - 170 + wave, x + 100, CONFIG.GROUND_Y - 160);
          ctx.closePath();
          ctx.fill();
        }
      }
    });

    // Layer 3: Main Ground Floor
    this.layers.push({
      parallaxFactor: 1.0,
      draw: (ctx) => {
        const grad = ctx.createLinearGradient(0, CONFIG.GROUND_Y, 0, CONFIG.H);
        grad.addColorStop(0, '#1c140d'); // Dark Kurukshetra soil
        grad.addColorStop(1, '#050302');
        ctx.fillStyle = grad;
        ctx.fillRect(-CONFIG.W, CONFIG.GROUND_Y, CONFIG.W * 3, CONFIG.H - CONFIG.GROUND_Y);

        // Ground cracks detail
        ctx.strokeStyle = 'rgba(255, 143, 0, 0.08)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = -600; x < CONFIG.W * 1.5; x += 150) {
          ctx.moveTo(x, CONFIG.GROUND_Y);
          ctx.lineTo(x + 50, CONFIG.GROUND_Y + 40);
          ctx.lineTo(x + 30, CONFIG.GROUND_Y + 120);
        }
        ctx.stroke();
      }
    });
  }

  initIndraprastha() {
    this.weather.type = 'clear';

    // Royal palace architecture details
    this.layers.push({
      parallaxFactor: 0.1,
      draw: (ctx) => {
        // Dawn clear sky
        const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.H);
        grad.addColorStop(0, '#0c1b33'); // Royal Blue
        grad.addColorStop(0.6, '#ffd166'); // Golden morning sun glow
        grad.addColorStop(1, '#ff8b94');
        ctx.fillStyle = grad;
        ctx.fillRect(-CONFIG.W, 0, CONFIG.W * 3, CONFIG.H);
      }
    });

    // Golden palace arches
    this.layers.push({
      parallaxFactor: 0.4,
      draw: (ctx) => {
        ctx.fillStyle = '#825c38'; // Dark wood/gold architecture columns
        for (let x = -800; x < CONFIG.W * 1.5; x += 600) {
          // Columns
          ctx.fillRect(x, 150, 60, CONFIG.GROUND_Y - 150);
          ctx.fillRect(x + 400, 150, 60, CONFIG.GROUND_Y - 150);
          
          // Majestic overhead arch
          ctx.save();
          ctx.strokeStyle = '#dfa650';
          ctx.lineWidth = 15;
          ctx.beginPath();
          ctx.arc(x + 230, 200, 200, Math.PI, 0);
          ctx.stroke();
          ctx.restore();
        }
      }
    });

    // Lotus pools and polished floor
    this.layers.push({
      parallaxFactor: 1.0,
      draw: (ctx) => {
        // Polished marble floor
        const grad = ctx.createLinearGradient(0, CONFIG.GROUND_Y, 0, CONFIG.H);
        grad.addColorStop(0, '#e5d9c2'); // Marble tan
        grad.addColorStop(1, '#ad9c82');
        ctx.fillStyle = grad;
        ctx.fillRect(-CONFIG.W, CONFIG.GROUND_Y, CONFIG.W * 3, CONFIG.H - CONFIG.GROUND_Y);

        // Floor reflection details
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let x = -600; x < CONFIG.W * 1.5; x += 250) {
          ctx.fillRect(x, CONFIG.GROUND_Y + 10, 150, 10);
        }
      }
    });
  }

  initHastinapura() {
    this.weather.type = 'clear';

    // Dark majestic royal throne room
    this.layers.push({
      parallaxFactor: 0.1,
      draw: (ctx) => {
        ctx.fillStyle = '#050508'; // Pitch darkness
        ctx.fillRect(-CONFIG.W, 0, CONFIG.W * 3, CONFIG.H);
      }
    });

    // Pillars and torches
    let time = 0;
    this.layers.push({
      parallaxFactor: 0.6,
      update: (dt) => { time += dt; },
      draw: (ctx) => {
        // Red carpets & ornate pillars
        ctx.fillStyle = '#1c1b21';
        for (let x = -800; x < CONFIG.W * 1.5; x += 300) {
          // Pillars
          ctx.fillRect(x, 0, 45, CONFIG.GROUND_Y);
          
          // Torch holders on pillars
          ctx.fillStyle = '#3c2a21';
          ctx.fillRect(x - 5, 250, 10, 30);
          
          // Flickering flames
          const flameSize = 10 + Math.sin(time * 12 + x * 0.05) * 3;
          ctx.fillStyle = '#e65c00';
          ctx.beginPath();
          ctx.arc(x, 240, flameSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Golden core
          ctx.fillStyle = '#ffb300';
          ctx.beginPath();
          ctx.arc(x, 243, flameSize * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    this.layers.push({
      parallaxFactor: 1.0,
      draw: (ctx) => {
        // Carpet & dark stones
        ctx.fillStyle = '#2b2323'; // Dark brown-red stone floor
        ctx.fillRect(-CONFIG.W, CONFIG.GROUND_Y, CONFIG.W * 3, CONFIG.H - CONFIG.GROUND_Y);

        // Center velvet red carpet
        ctx.fillStyle = '#660b13';
        ctx.fillRect(-600, CONFIG.GROUND_Y, 1200, CONFIG.H - CONFIG.GROUND_Y);
      }
    });
  }

  initCelestialRealm() {
    this.weather.type = 'clear';

    // Sky with stars/galaxy details
    this.layers.push({
      parallaxFactor: 0.1,
      draw: (ctx) => {
        const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.H);
        grad.addColorStop(0, '#020010');
        grad.addColorStop(0.5, '#0c0728');
        grad.addColorStop(1, '#240845');
        ctx.fillStyle = grad;
        ctx.fillRect(-CONFIG.W, 0, CONFIG.W * 3, CONFIG.H);
        
        // Shiny star particles
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 40; i++) {
          const x = (i * 97) % (CONFIG.W * 2) - CONFIG.W;
          const y = (i * 123) % 400;
          ctx.globalAlpha = 0.2 + Math.abs(Math.sin(performance.now() * 0.001 + i));
          ctx.fillRect(x, y, 2, 2);
        }
      }
    });

    // Distant floating clouds
    let time = 0;
    this.layers.push({
      parallaxFactor: 0.3,
      update: (dt) => { time += dt; },
      draw: (ctx) => {
        ctx.fillStyle = 'rgba(156, 122, 201, 0.15)'; // Mystical purple clouds
        for (let x = -800; x < CONFIG.W * 1.5; x += 500) {
          const waveY = Math.sin(time * 0.5 + x * 0.002) * 20;
          ctx.beginPath();
          ctx.arc(x, 300 + waveY, 150, 0, Math.PI * 2);
          ctx.arc(x + 100, 270 + waveY, 120, 0, Math.PI * 2);
          ctx.arc(x - 100, 310 + waveY, 100, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // Floating sky crystals and temple details
    this.layers.push({
      parallaxFactor: 1.0,
      draw: (ctx) => {
        // Glowing gold cloud platform (no solid floor)
        const grad = ctx.createLinearGradient(0, CONFIG.GROUND_Y, 0, CONFIG.H);
        grad.addColorStop(0, '#e5ba4f'); // Golden clouds
        grad.addColorStop(0.5, '#ab7c1a');
        grad.addColorStop(1, '#473103');
        ctx.fillStyle = grad;
        ctx.fillRect(-CONFIG.W, CONFIG.GROUND_Y, CONFIG.W * 3, CONFIG.H - CONFIG.GROUND_Y);
      }
    });
  }

  initForestOfDharma() {
    this.weather.type = 'mist';
    this.weather.intensity = 0.3;
    this.weather.wind = 5;

    this.layers.push({
      parallaxFactor: 0.1,
      draw: (ctx) => {
        // Deep forest sunset sky
        const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.H);
        grad.addColorStop(0, '#0c1b0c'); // Emerald night
        grad.addColorStop(0.7, '#1f382a');
        grad.addColorStop(1, '#4f705b');
        ctx.fillStyle = grad;
        ctx.fillRect(-CONFIG.W, 0, CONFIG.W * 3, CONFIG.H);
      }
    });

    // Silhouette trees
    this.layers.push({
      parallaxFactor: 0.45,
      draw: (ctx) => {
        ctx.fillStyle = '#0a1a12';
        for (let x = -800; x < CONFIG.W * 1.5; x += 220) {
          ctx.fillRect(x, 150, 30, CONFIG.GROUND_Y - 150);
          // Leaves arcs
          ctx.beginPath();
          ctx.arc(x + 15, 120, 100, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // Forest ground
    this.layers.push({
      parallaxFactor: 1.0,
      draw: (ctx) => {
        const grad = ctx.createLinearGradient(0, CONFIG.GROUND_Y, 0, CONFIG.H);
        grad.addColorStop(0, '#102a1e'); // Grass moss green
        grad.addColorStop(1, '#05120a');
        ctx.fillStyle = grad;
        ctx.fillRect(-CONFIG.W, CONFIG.GROUND_Y, CONFIG.W * 3, CONFIG.H - CONFIG.GROUND_Y);

        // Mystical fireflies
        ctx.fillStyle = '#a6e22e';
        for (let i = 0; i < 20; i++) {
          const x = (i * 123) % (CONFIG.W * 2) - CONFIG.W;
          const y = CONFIG.GROUND_Y + 10 + ((i * 57) % 150);
          ctx.globalAlpha = 0.3 + Math.abs(Math.sin(performance.now() * 0.002 + i)) * 0.7;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  }

  initBridgeOfLanka() {
    this.weather.type = 'clear';

    // Ocean horizon sky
    this.layers.push({
      parallaxFactor: 0.15,
      draw: (ctx) => {
        const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.H);
        grad.addColorStop(0, '#0c1b3a'); // Crimson ocean horizon
        grad.addColorStop(0.5, '#7b2cbf');
        grad.addColorStop(0.7, '#ff5400');
        grad.addColorStop(1, '#ffc300');
        ctx.fillStyle = grad;
        ctx.fillRect(-CONFIG.W, 0, CONFIG.W * 3, CONFIG.H);
      }
    });

    // Ocean waves (Animated)
    let time = 0;
    this.layers.push({
      parallaxFactor: 0.5,
      update: (dt) => { time += dt; },
      draw: (ctx) => {
        ctx.fillStyle = '#03045e'; // Deep ocean blue
        ctx.beginPath();
        ctx.moveTo(-CONFIG.W, CONFIG.GROUND_Y - 40);
        
        for (let x = -CONFIG.W; x < CONFIG.W * 2; x += 100) {
          const waveHeight = Math.sin(time * 3 + x * 0.01) * 8;
          ctx.lineTo(x, CONFIG.GROUND_Y - 40 + waveHeight);
        }
        ctx.lineTo(CONFIG.W * 2, CONFIG.GROUND_Y + 300);
        ctx.lineTo(-CONFIG.W, CONFIG.GROUND_Y + 300);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Lanka bridge stone platform
    this.layers.push({
      parallaxFactor: 1.0,
      draw: (ctx) => {
        // Stone bridge
        const grad = ctx.createLinearGradient(0, CONFIG.GROUND_Y, 0, CONFIG.H);
        grad.addColorStop(0, '#5a5d64'); // Cool stone gray
        grad.addColorStop(1, '#2c2e35');
        ctx.fillStyle = grad;
        ctx.fillRect(-CONFIG.W, CONFIG.GROUND_Y, CONFIG.W * 3, CONFIG.H - CONFIG.GROUND_Y);

        // Stone borders/carvings
        ctx.fillStyle = '#3f4147';
        ctx.fillRect(-CONFIG.W, CONFIG.GROUND_Y, CONFIG.W * 3, 20);
      }
    });
  }
}
