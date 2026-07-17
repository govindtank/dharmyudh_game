// ============================================================
// DHARMYUDH - Settings & Customization Panel
// ============================================================

import { CONFIG, clamp } from '../engine/config.js';

export class SettingsPanel {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.selectedOption = 0;
    
    // Settings Options
    this.options = [
      { id: 'volumeMaster', label: 'Master Volume', type: 'slider', min: 0, max: 1, step: 0.05 },
      { id: 'volumeMusic', label: 'Music Volume', type: 'slider', min: 0, max: 1, step: 0.05 },
      { id: 'volumeSfx', label: 'SFX Volume', type: 'slider', min: 0, max: 1, step: 0.05 },
      { id: 'graphicsQuality', label: 'Graphics Quality', type: 'select', values: ['low', 'medium', 'high', 'ultra'] },
      { id: 'screenShakeEnabled', label: 'Screen Shake', type: 'toggle' },
      { id: 'controlsMode', label: 'Controls Type', type: 'select', values: ['classic', 'modern'] },
      { id: 'back', label: 'Save & Return', type: 'button' }
    ];
  }

  toggle() {
    this.active = !this.active;
    if (this.active) {
      this.selectedOption = 0;
      this.game.audio.playSfx('select', 1.2);
    }
  }

  update(dt) {
    if (!this.active) return;

    // Menu Navigation
    if (this.game.input.isActionJustPressed('Jump') || this.game.input.keyJustPressed['ArrowUp']) {
      this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
      this.game.audio.playSfx('select', 0.85);
    }
    if (this.game.input.isActionJustPressed('Dodge') || this.game.input.keyJustPressed['ArrowDown']) {
      this.selectedOption = (this.selectedOption + 1) % this.options.length;
      this.game.audio.playSfx('select', 0.85);
    }

    const current = this.options[this.selectedOption];
    const settings = this.game.storage.getSettings();

    // Adjusting Option Values via Keyboard
    if (current.type === 'slider') {
      let val = settings[current.id];
      if (this.game.input.keyJustPressed['ArrowLeft']) {
        val = clamp(val - current.step, current.min, current.max);
        this.updateValue(current.id, val);
        this.game.audio.playSfx('select', 1.0);
      }
      if (this.game.input.keyJustPressed['ArrowRight']) {
        val = clamp(val + current.step, current.min, current.max);
        this.updateValue(current.id, val);
        this.game.audio.playSfx('select', 1.0);
      }
    }

    if (current.type === 'select') {
      const idx = current.values.indexOf(settings[current.id]);
      if (this.game.input.keyJustPressed['ArrowLeft']) {
        const nextIdx = (idx - 1 + current.values.length) % current.values.length;
        this.updateValue(current.id, current.values[nextIdx]);
        this.game.audio.playSfx('select', 1.0);
      }
      if (this.game.input.keyJustPressed['ArrowRight']) {
        const nextIdx = (idx + 1) % current.values.length;
        this.updateValue(current.id, current.values[nextIdx]);
        this.game.audio.playSfx('select', 1.0);
      }
    }

    if (current.type === 'toggle') {
      if (this.game.input.keyJustPressed['ArrowLeft'] || this.game.input.keyJustPressed['ArrowRight'] || this.game.input.keyJustPressed['Enter']) {
        this.updateValue(current.id, !settings[current.id]);
        this.game.audio.playSfx('select', 1.0);
      }
    }

    // Adjusting Option Values via Mouse/Touch Clicks
    if (this.game.input.mouseClicked) {
      const mx = this.game.input.mousePos.x;
      const my = this.game.input.mousePos.y;
      
      const startY = 160;
      const spacingY = 50;
      
      for (let i = 0; i < this.options.length; i++) {
        const optY = startY + i * spacingY;
        // Check vertical collision box for this setting option row
        if (my >= optY - 25 && my <= optY + 15) {
          this.selectedOption = i;
          const clickedOpt = this.options[i];
          
          if (clickedOpt.type === 'button') {
            this.toggle();
            this.game.audio.playSfx('select', 1.3);
          } 
          else if (clickedOpt.type === 'toggle') {
            this.updateValue(clickedOpt.id, !settings[clickedOpt.id]);
            this.game.audio.playSfx('select', 1.0);
          } 
          else if (clickedOpt.type === 'select') {
            const idx = clickedOpt.values.indexOf(settings[clickedOpt.id]);
            // If clicked on left side of text vs right side
            const nextIdx = mx < CONFIG.W / 2 ? (idx - 1 + clickedOpt.values.length) % clickedOpt.values.length : (idx + 1) % clickedOpt.values.length;
            this.updateValue(clickedOpt.id, clickedOpt.values[nextIdx]);
            this.game.audio.playSfx('select', 1.0);
          } 
          else if (clickedOpt.type === 'slider') {
            const barX = CONFIG.W - 370;
            const barWidth = 150;
            if (mx >= barX && mx <= barX + barWidth) {
              const pct = (mx - barX) / barWidth;
              this.updateValue(clickedOpt.id, clamp(pct, 0, 1));
              this.game.audio.playSfx('select', 1.0);
            }
          }
          break;
        }
      }
    }

    // Select Button Actions via Enter Key
    if (this.game.input.keyJustPressed['Enter']) {
      if (current.id === 'back') {
        this.toggle();
        this.game.audio.playSfx('select', 1.3);
      }
    }

    // Escape out
    if (this.game.input.keyJustPressed['Escape']) {
      this.toggle();
    }
  }

  updateValue(key, val) {
    const settings = this.game.storage.getSettings();
    settings[key] = val;
    this.game.storage.saveSettings(settings);
    
    // Sync volumes immediately
    this.game.audio.updateVolumes();
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    
    // Dark blur-backing card (Glassmorphism effect)
    ctx.fillStyle = 'rgba(10, 10, 15, 0.9)';
    ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

    // Render outer frame border (Ornamented gold)
    ctx.strokeStyle = '#dfa650';
    ctx.lineWidth = 2;
    ctx.strokeRect(100, 50, CONFIG.W - 200, CONFIG.H - 100);

    // Title
    ctx.fillStyle = '#dfa650';
    ctx.font = 'bold 32px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('CUSTOMIZATION & SETTINGS', CONFIG.W / 2, 100);

    // Settings list
    const startY = 160;
    const spacingY = 50;
    const settings = this.game.storage.getSettings();

    for (let i = 0; i < this.options.length; i++) {
      const opt = this.options[i];
      const val = settings[opt.id];
      const y = startY + i * spacingY;
      const isSelected = i === this.selectedOption;

      // Selection background highlight
      if (isSelected) {
        ctx.fillStyle = 'rgba(223, 166, 80, 0.15)';
        ctx.fillRect(200, y - 25, CONFIG.W - 400, 36);
        ctx.fillStyle = '#ffffff'; // White text on selection
      } else {
        ctx.fillStyle = '#e8d5b0'; // Gold tint on unselected
      }

      ctx.font = 'bold 20px Rajdhani';
      ctx.textAlign = 'left';
      ctx.fillText(opt.label, 220, y);

      // Render right-side value fields
      ctx.textAlign = 'right';
      if (opt.type === 'slider') {
        const barWidth = 150;
        const fillWidth = val * barWidth;
        const barX = CONFIG.W - 370;

        // Draw slide bar container
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(barX, y - 12, barWidth, 10);
        ctx.fillStyle = isSelected ? '#ffd700' : '#b8966a';
        ctx.fillRect(barX, y - 12, fillWidth, 10);

        // Numeric text representation
        ctx.fillStyle = isSelected ? '#ffffff' : '#e8d5b0';
        ctx.fillText(Math.round(val * 100) + '%', CONFIG.W - 220, y);
      } 
      else if (opt.type === 'select') {
        ctx.fillText(`<  ${val.toUpperCase()}  >`, CONFIG.W - 220, y);
      } 
      else if (opt.type === 'toggle') {
        ctx.fillText(val ? '[ ENABLED ]' : '[ DISABLED ]', CONFIG.W - 220, y);
      } 
      else if (opt.type === 'button') {
        ctx.textAlign = 'center';
        ctx.fillText('PRESS ENTER TO SAVE', CONFIG.W / 2, y);
      }
    }

    ctx.restore();
  }
}
export default SettingsPanel;
