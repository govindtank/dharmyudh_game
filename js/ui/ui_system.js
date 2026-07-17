// ============================================================
// DHARMYUDH - Master UI & HUD System
// ============================================================

import { CONFIG, clamp } from '../engine/config.js';
import { SettingsPanel } from './settings.js';
import { ACHIEVEMENTS } from '../progression/achievements.js';

export class UISystem {
  constructor(game) {
    this.game = game;
    this.settingsPanel = new SettingsPanel(game);
    
    // UI state
    this.toastText = '';
    this.toastTimer = 0;
    this.toastMaxTime = 2.0;

    // Menu selections
    this.selectedMenuItem = 0;
    this.menuItems = ['Arcade Mode', 'Story Mode', 'Versus 2-Player', 'Survival Mode', 'Achievements', 'Settings'];
  }

  showToast(text) {
    this.toastText = text;
    this.toastTimer = this.toastMaxTime;
  }

  update(dt) {
    // If settings overlay is active, route all updates there
    if (this.settingsPanel.active) {
      this.settingsPanel.update(dt);
      return;
    }

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
    }

    // Main Menu State inputs
    if (this.game.state === 'menu') {
      if (this.game.input.keyJustPressed['ArrowUp']) {
        this.selectedMenuItem = (this.selectedMenuItem - 1 + this.menuItems.length) % this.menuItems.length;
        this.game.audio.playSfx('select', 0.85);
      }
      if (this.game.input.keyJustPressed['ArrowDown']) {
        this.selectedMenuItem = (this.selectedMenuItem + 1) % this.menuItems.length;
        this.game.audio.playSfx('select', 0.85);
      }
      if (this.game.input.keyJustPressed['Enter']) {
        this.confirmMenuSelection();
      }

      // Mouse/Touch click support
      if (this.game.input.mouseClicked) {
        const mx = this.game.input.mousePos.x;
        const my = this.game.input.mousePos.y;
        
        // Check if click was horizontally centered
        if (mx > 400 && mx < 880) {
          const startY = CONFIG.H / 2 + 50;
          const spacingY = 40;
          
          for (let i = 0; i < this.menuItems.length; i++) {
            const itemY = startY + i * spacingY;
            if (my >= itemY - 20 && my <= itemY + 20) {
              this.selectedMenuItem = i;
              this.confirmMenuSelection();
              break;
            }
          }
        }
      }
    }

    // Achievements Screen inputs
    if (this.game.state === 'achievements') {
      if (this.game.input.keyJustPressed['Escape'] || this.game.input.keyJustPressed['Enter'] || this.game.input.mouseClicked) {
        this.game.state = 'menu';
        this.game.audio.playSfx('select');
      }
    }

    // Character Select State inputs
    if (this.game.state === 'characterSelect') {
      // Nav handled directly in core for now
    }
  }

  confirmMenuSelection() {
    this.game.audio.playSfx('select', 1.2);
    const selected = this.menuItems[this.selectedMenuItem];

    if (selected === 'Arcade Mode') {
      this.game.state = 'characterSelect';
      this.game.gameMode = 'arcade';
    } 
    else if (selected === 'Story Mode') {
      this.game.state = 'characterSelect';
      this.game.gameMode = 'story';
    }
    else if (selected === 'Versus 2-Player') {
      this.game.state = 'characterSelect';
      this.game.gameMode = 'versus2p';
    }
    else if (selected === 'Survival Mode') {
      this.game.state = 'characterSelect';
      this.game.gameMode = 'survival';
      this.game.survivalWave = 1;
    } 
    else if (selected === 'Achievements') {
      this.game.state = 'achievements';
    }
    else if (selected === 'Settings') {
      this.settingsPanel.toggle();
    }
  }

  draw(ctx, state) {
    if (this.settingsPanel.active) {
      this.settingsPanel.draw(ctx);
      return;
    }

    switch (state) {
      case 'menu':
        this.drawMainMenu(ctx);
        break;
      case 'achievements':
        this.drawAchievementsScreen(ctx);
        break;
      case 'characterSelect':
        this.drawCharacterSelect(ctx);
        break;
      case 'battle':
        this.drawHUD(ctx);
        this.drawRoundIntro(ctx);
        this.drawToast(ctx);
        break;
      case 'result':
        this.drawResults(ctx);
        break;
    }
  }

  drawMainMenu(ctx) {
    ctx.save();
    
    // Background Dark radial tint
    const bgGrad = ctx.createRadialGradient(CONFIG.W/2, CONFIG.H/2, 50, CONFIG.W/2, CONFIG.H/2, CONFIG.H);
    bgGrad.addColorStop(0, '#1c1212');
    bgGrad.addColorStop(1, '#080505');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

    // Ornamented Sanskrit patterns
    ctx.fillStyle = 'rgba(223, 166, 80, 0.05)';
    ctx.font = 'bold 200px Devanagari, Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('धर्मयुद्ध', CONFIG.W / 2, CONFIG.H / 2 + 70);

    // Game Title
    ctx.fillStyle = '#ff8f00';
    ctx.font = '900 70px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('DHARMYUDH', CONFIG.W / 2, CONFIG.H / 2 - 100);

    ctx.fillStyle = '#dfa650';
    ctx.font = 'bold 24px Noto Sans Devanagari, Rajdhani';
    ctx.fillText('The Great War of Kurukshetra', CONFIG.W / 2, CONFIG.H / 2 - 50);

    // Render Menu Items
    const startY = CONFIG.H / 2 + 50;
    const spacingY = 40;

    for (let i = 0; i < this.menuItems.length; i++) {
      const item = this.menuItems[i];
      const y = startY + i * spacingY;
      const isSelected = i === this.selectedMenuItem;

      if (isSelected) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 26px Rajdhani';
        ctx.fillText(`▶  ${item.toUpperCase()}  ◀`, CONFIG.W / 2, y);
      } else {
        ctx.fillStyle = '#b8966a';
        ctx.font = 'bold 22px Rajdhani';
        ctx.fillText(item.toUpperCase(), CONFIG.W / 2, y);
      }
    }

    ctx.restore();
  }

  drawCharacterSelect(ctx) {
    ctx.save();
    
    // Background Dark tint
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

    ctx.fillStyle = '#dfa650';
    ctx.font = 'bold 32px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT YOUR WARRIOR', CONFIG.W / 2, 70);

    ctx.restore();
  }

  drawHUD(ctx) {
    if (!this.game.player || !this.game.enemy) return;

    ctx.save();

    // 1. Player HUD (Left side)
    const pBX = 30, pBW = 320, pBY = 40;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Rajdhani';
    ctx.textAlign = 'left';
    ctx.fillText(this.game.playerChar.name, pBX, pBY);

    // HP Bar backing
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(pBX, pBY + 10, pBW, 18);
    // Fill HP Bar (Decelerating gradient color)
    const pHP = this.game.player.currentHp / this.game.player.hp;
    const pHpColor = pHP > 0.5 ? '#4caf50' : pHP > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillStyle = pHpColor;
    ctx.fillRect(pBX, pBY + 10, pBW * pHP, 18);

    // Energy Bar backing
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(pBX, pBY + 32, pBW, 8);
    const pEnergy = this.game.player.energy / this.game.player.maxEnergy;
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(pBX, pBY + 32, pBW * pEnergy, 8);

    // 2. Enemy HUD (Right side)
    const eBX = CONFIG.W - 350, eBW = 320, eBY = 40;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Rajdhani';
    ctx.textAlign = 'right';
    ctx.fillText(this.game.enemyChar.name, CONFIG.W - 30, eBY);

    // HP Bar backing
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(eBX, eBY + 10, eBW, 18);
    const eHP = this.game.enemy.currentHp / this.game.enemy.hp;
    const eHpColor = eHP > 0.5 ? '#4caf50' : eHP > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillStyle = eHpColor;
    ctx.fillRect(eBX + (eBW - eBW * eHP), eBY + 10, eBW * eHP, 18);

    // 3. Center Timer
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 36px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(this.game.battleTimer), CONFIG.W / 2, 55);

    // 4. Combo Counter
    if (this.game.comboCount > 1) {
      ctx.fillStyle = '#ff8f00';
      ctx.font = 'bold 44px Rajdhani';
      ctx.fillText(`${this.game.comboCount} HITS!`, CONFIG.W / 2, 130);
    }

    ctx.restore();
  }

  drawRoundIntro(ctx) {
    if (this.game.roundIntroTimer <= 0) return;
    ctx.save();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, CONFIG.H / 2 - 80, CONFIG.W, 160);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText(`ROUND ${this.game.round}`, CONFIG.W / 2, CONFIG.H / 2 - 10);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Rajdhani';
    ctx.fillText('PREPARE FOR BATTLE', CONFIG.W / 2, CONFIG.H / 2 + 35);

    ctx.restore();
  }

  drawToast(ctx) {
    if (this.toastTimer <= 0) return;
    ctx.save();
    ctx.globalAlpha = clamp(this.toastTimer / 0.5, 0, 1);

    ctx.fillStyle = 'rgba(10, 10, 10, 0.85)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.fillRect(CONFIG.W / 2 - 200, CONFIG.H - 120, 400, 50);
    ctx.strokeRect(CONFIG.W / 2 - 200, CONFIG.H - 120, 400, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText(this.toastText, CONFIG.W / 2, CONFIG.H - 90);

    ctx.restore();
  }

  drawResults(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 5, 10, 0.96)';
    ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

    // Decorative Borders
    ctx.strokeStyle = '#dfa650';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, CONFIG.W - 40, CONFIG.H - 40);

    const res = this.game.lastMatchResults;
    if (res) {
      const isWin = res.winner === 'player';

      // Header Victory/Defeat
      ctx.fillStyle = isWin ? '#ffd700' : '#ff3b30';
      ctx.font = 'bold 64px Rajdhani';
      ctx.textAlign = 'center';
      ctx.fillText(isWin ? 'VICTORY' : 'DEFEAT', CONFIG.W / 2, CONFIG.H / 2 - 130);

      // Reward Container Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(CONFIG.W / 2 - 250, CONFIG.H / 2 - 80, 500, 160);
      ctx.strokeRect(CONFIG.W / 2 - 250, CONFIG.H / 2 - 80, 500, 160);

      // XP & level progression drawing
      ctx.fillStyle = '#e8d5b0';
      ctx.font = 'bold 20px Rajdhani';
      ctx.textAlign = 'left';
      ctx.fillText(`WARRIOR LEVEL: ${res.newLevel}`, CONFIG.W / 2 - 200, CONFIG.H / 2 - 40);
      ctx.fillText(`XP EARNED: +${res.xpEarned} XP`, CONFIG.W / 2 - 200, CONFIG.H / 2 - 10);
      ctx.fillText(`DHARMA POINTS: +${res.dpEarned} DP`, CONFIG.W / 2 - 200, CONFIG.H / 2 + 20);

      if (res.leveledUp) {
        ctx.fillStyle = '#4cd964';
        ctx.font = 'bold 22px Rajdhani';
        ctx.fillText('LEVEL UP!', CONFIG.W / 2 + 80, CONFIG.H / 2 - 10);
      }

      // Draw unlocked achievements list if any
      if (res.unlockedAchievements && res.unlockedAchievements.length > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 16px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillText(`UNLOCKED AWARDS: ${res.unlockedAchievements.join(', ')}`, CONFIG.W / 2, CONFIG.H / 2 + 130);
      }
    } else {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 50px Rajdhani';
      ctx.textAlign = 'center';
      ctx.fillText('BATTLE OVER', CONFIG.W / 2, CONFIG.H / 2 - 50);
    }

    // Prompt to return
    ctx.fillStyle = '#ff8f00';
    ctx.font = 'bold 18px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS ENTER OR CLICK ANYWHERE TO RETURN TO MENU', CONFIG.W / 2, CONFIG.H - 80);

    ctx.restore();
  }

  drawAchievementsScreen(ctx) {
    ctx.save();
    
    // Background Darkening Overlay
    ctx.fillStyle = 'rgba(5, 5, 10, 0.95)';
    ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

    // Decorative Borders
    ctx.strokeStyle = '#dfa650';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, CONFIG.W - 40, CONFIG.H - 40);

    // Screen Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 36px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('WARRIOR AWARDS & ACHIEVEMENTS', CONFIG.W / 2, 60);

    // Calculate progression values
    const earned = this.game.storage.data.progression.achievements;
    ctx.fillStyle = '#e8d5b0';
    ctx.font = '18px Rajdhani';
    ctx.fillText(`Unlocked: ${earned.length} / ${ACHIEVEMENTS.length} achievements`, CONFIG.W / 2, 90);

    // Draw scrollable-grid area for top 12 achievements
    const startX = 60;
    const startY = 120;
    const spacingX = 380;
    const spacingY = 90;
    const itemsPerRow = 3;

    for (let i = 0; i < 12; i++) {
      const ach = ACHIEVEMENTS[i];
      if (!ach) break;

      const col = i % itemsPerRow;
      const row = Math.floor(i / itemsPerRow);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;
      
      const isCompleted = earned.includes(ach.id);

      // Card Background (Golden border if completed, grey if locked)
      ctx.fillStyle = isCompleted ? 'rgba(223, 166, 80, 0.12)' : 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(x, y, 350, 75);
      ctx.strokeStyle = isCompleted ? '#ffd700' : 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, 350, 75);

      // Status Indicator
      ctx.fillStyle = isCompleted ? '#ffd700' : '#666';
      ctx.font = 'bold 16px Rajdhani';
      ctx.textAlign = 'left';
      ctx.fillText(ach.name.toUpperCase(), x + 15, y + 25);

      // XP Indicator
      ctx.fillStyle = isCompleted ? '#ffd700' : '#888';
      ctx.font = 'bold 12px Rajdhani';
      ctx.textAlign = 'right';
      ctx.fillText(`+${ach.xp} XP`, x + 335, y + 25);

      // Description
      ctx.fillStyle = isCompleted ? '#e8d5b0' : '#555';
      ctx.font = '13px Rajdhani';
      ctx.textAlign = 'left';
      
      // Wrap description text
      const descText = ach.desc;
      ctx.fillText(descText, x + 15, y + 50);
    }

    // Return prompt
    ctx.fillStyle = '#ff8f00';
    ctx.font = 'bold 16px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('CLICK ANYWHERE OR PRESS ENTER TO RETURN', CONFIG.W / 2, CONFIG.H - 45);

    ctx.restore();
  }
}
export default UISystem;
