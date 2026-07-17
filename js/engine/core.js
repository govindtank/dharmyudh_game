// ============================================================
// DHARMYUDH - Master Core Engine Controller
// ============================================================

import { CONFIG, clamp, rng, rngI } from './config.js';
import { StorageSystem } from './storage.js';
import { AudioEngine } from './audio.js';
import { InputSystem } from './input.js';
import { AnimationEngine } from './animation.js';
import { RendererSystem } from './renderer.js';

// Visual VFX & Stages
import { ParticleSystem } from '../vfx/particles.js';
import { LightingSystem } from '../vfx/lighting.js';
import { ScreenEffectsSystem } from '../vfx/screen_effects.js';
import { StageRenderer } from '../stages/stage_renderer.js';

// Characters & UI
import { BaseCharacter } from '../characters/base_character.js';
import { CharacterRenderer } from '../characters/character_renderer.js';
import { CHARACTERS } from '../characters/roster.js';
import { UISystem } from '../ui/ui_system.js';

// Progression & Game Modes
import { ProgressionManager } from '../progression/progression.js';
import { StoryModeEngine } from '../modes/story.js';
import { GameModesController } from '../modes/game_modes.js';
import { CombatUpgradeSystem } from '../combat/combat_upgrade.js';

export class DharmYudhGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    
    // Core Subsystems
    this.storage = new StorageSystem();
    this.audio = new AudioEngine(this.storage);
    this.input = new InputSystem(this.storage);
    this.anim = new AnimationEngine();
    this.renderer = new RendererSystem(this.canvas, this.storage);

    // Visual & Environmental Systems
    this.particles = new ParticleSystem(400);
    this.lighting = new LightingSystem(this);
    this.screenEffects = new ScreenEffectsSystem(this);
    this.stage = new StageRenderer(this);
    this.charRenderer = new CharacterRenderer(this.anim);
    this.ui = new UISystem(this);

    // Progression & Game Modes
    this.progression = new ProgressionManager(this);
    this.story = new StoryModeEngine(this);
    this.modes = new GameModesController(this);
    this.combat = new CombatUpgradeSystem(this);
    
    // Game States
    this.state = 'loading'; // 'loading', 'menu', 'characterSelect', 'battle', 'result'
    this.gameMode = 'versus'; // 'versus', 'survival', 'story', 'training'
    this.difficulty = 'normal';
    
    // Active Match State
    this.battleActive = false;
    this.roundActive = false;
    
    // Warriors
    this.playerChar = null;
    this.enemyChar = null;
    this.player = null;
    this.enemy = null;
    
    this.round = 1;
    this.playerWins = 0;
    this.enemyWins = 0;
    this.maxRounds = 3;
    
    this.gameTime = 0;
    this.battleTimer = 0;
    this.maxBattleTime = 60;
    this.roundIntroTimer = 0;
    
    this.comboCount = 0;
    this.comboTimer = 0;
    this.hitStopTimer = 0;
    this.slowMo = 0;
    
    this.koFlash = 0;
    this.flashEffect = 0;
    this.koFreezeTimer = 0;

    // Menu settings
    this.selectedChar = 0;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Start fake/cosmetic asset load
    this.loadAssets();
  }

  resize() {
    const container = document.getElementById('game-container');
    this.renderer.resize(container);
  }

  loadAssets() {
    let progress = 0;
    const bar = document.getElementById('loading-bar');
    const textNode = document.querySelector('.loading-text');

    const interval = setInterval(() => {
      progress += Math.random() * 12 + 5;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        if (bar) bar.style.width = '100%';
        
        setTimeout(() => {
          const loadingScreen = document.getElementById('loading-screen');
          if (loadingScreen) loadingScreen.classList.add('hidden');
          
          this.state = 'menu';
          this.audio.init();
          
          // Start the Game Loop
          this.startGameLoop();
        }, 500);
      }

      if (bar) bar.style.width = `${progress}%`;
      
      if (textNode) {
        if (progress < 30) textNode.textContent = 'Summoning Warriors...';
        else if (progress < 60) textNode.textContent = 'Forging Divine Weapons...';
        else if (progress < 85) textNode.textContent = 'Preparing Kurukshetra...';
        else textNode.textContent = 'Blessing by Gods...';
      }
    }, 150);
  }

  startGameLoop() {
    let lastTime = performance.now();
    let accumulator = 0;

    const loop = (now) => {
      let dt = (now - lastTime) / 1000;
      lastTime = now;

      if (dt > 0.1) dt = 0.1;

      this.input.update();

      // Keyboard hotkeys for difficulty toggle
      if (this.input.keyJustPressed['1']) { this.difficulty = 'easy'; this.showToast('Difficulty: Easy'); }
      if (this.input.keyJustPressed['2']) { this.difficulty = 'normal'; this.showToast('Difficulty: Normal'); }
      if (this.input.keyJustPressed['3']) { this.difficulty = 'hard'; this.showToast('Difficulty: Hard'); }

      // Settings screen shortcut
      if (this.input.keyJustPressed['Escape'] && this.state === 'menu') {
        this.ui.settingsPanel.toggle();
      }

      // State specific controls routing
      if (this.state === 'characterSelect') {
        // Arrow Keys or Click on left/right side of screen to change character
        if (this.input.keyJustPressed['ArrowLeft'] || (this.input.mouseClicked && this.input.mousePos.x < 300)) {
          this.selectedChar = (this.selectedChar - 1 + CHARACTERS.length) % CHARACTERS.length;
          this.audio.playSfx('select');
        }
        if (this.input.keyJustPressed['ArrowRight'] || (this.input.mouseClicked && this.input.mousePos.x > 980)) {
          this.selectedChar = (this.selectedChar + 1) % CHARACTERS.length;
          this.audio.playSfx('select');
        }
        // Enter key or click in middle of screen to confirm character selection
        if (this.input.keyJustPressed['Enter'] || (this.input.mouseClicked && this.input.mousePos.x >= 300 && this.input.mousePos.x <= 980)) {
          this.confirmCharacter();
        }
      }

      if (this.state === 'result') {
        if (this.input.keyJustPressed['Enter'] || this.input.mouseClicked) {
          this.state = 'menu';
          this.audio.playSfx('select');
        }
      }

      // Fixed update physics ticks
      accumulator += dt;
      while (accumulator >= CONFIG.PHYSICS_STEP) {
        this.updateFixed(CONFIG.PHYSICS_STEP);
        accumulator -= CONFIG.PHYSICS_STEP;
      }

      // Variable visual ticks
      this.updateVariable(dt);

      // Draw frames
      this.render();

      // Clear single frame inputs after all update logic checks
      this.input.clearJustPressed();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  confirmCharacter() {
    this.playerChar = CHARACTERS[this.selectedChar];

    // Check if character is locked
    const locked = this.storage.data.progression.unlocks.lockedCharacters;
    if (locked.includes(this.playerChar.id)) {
      this.audio.playSfx('death');
      this.showToast('WARRIOR IS LOCKED! BEAT ARCADE TO UNLOCK.');
      return;
    }
    
    if (this.gameMode === 'story') {
      this.story.startCampaign(this.playerChar.id);
      return;
    }

    if (this.gameMode === 'arcade') {
      this.modes.startArcadeMode(this.playerChar.id);
      return;
    }

    const enemies = CHARACTERS.filter(c => c.id !== this.playerChar.id);
    this.enemyChar = enemies[Math.floor(Math.random() * enemies.length)];
    
    this.state = 'battle';
    this.battleActive = false;
    this.round = 1;
    this.playerWins = 0;
    this.enemyWins = 0;
    this.comboCount = 0;

    this.audio.startMusic();
    this.showToast(`${this.playerChar.name} VS ${this.enemyChar.name}!`);
    this.roundIntroTimer = 2.5;

    // Pick stage corresponding to the character's home or random
    const stages = ['kurukshetra', 'indraprastha', 'hastinapura', 'celestial_realm', 'forest_of_dharma', 'bridge_of_lanka'];
    this.stage.setStage(stages[Math.floor(Math.random() * stages.length)]);

    setTimeout(() => {
      if (this.state === 'battle') this.startRound();
    }, 2500);
  }

  startRound() {
    if (this.state !== 'battle') return;
    this.battleActive = true;
    this.roundActive = true;

    this.player = new BaseCharacter(this.playerChar, true);
    this.enemy = new BaseCharacter(this.enemyChar, false);

    // Apply survival scaling difficulty modifications
    if (this.gameMode === 'survival') {
      const buff = 1 + (this.survivalWave - 1) * 0.12;
      this.enemy.hp = Math.floor(this.enemy.hp * buff);
      this.enemy.attack = Math.floor(this.enemy.attack * buff);
      this.enemy.currentHp = this.enemy.hp;
    }

    this.gameTime = 0;
    this.battleTimer = this.maxBattleTime;
    this.particles.clear();
    
    this.flashEffect = 0;
    this.koFlash = 0;
    this.hitStopTimer = 0;
    this.slowMo = 0;
    this.koFreezeTimer = 0;

    this.audio.setMusicIntensity(0.3);
    this.ui.showToast(`Round ${this.round} — FIGHT!`);
    this.audio.playSfx('win');
  }

  updateFixed(dt) {
    if (this.story.inDialogue) {
      this.story.update(dt);
      return;
    }

    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return;
    }

    if (this.koFreezeTimer > 0) {
      this.koFreezeTimer -= dt;
      return;
    }

    if (this.roundIntroTimer > 0) {
      this.roundIntroTimer -= dt;
      return;
    }

    if (this.state === 'battle' && this.battleActive && this.roundActive) {
      this.gameTime += dt;
      this.battleTimer -= dt;

      if (this.battleTimer <= 0) {
        this.endRound('time');
        return;
      }

      // Combo timers
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
      } else {
        this.comboCount = 0;
      }

      // Check Astra trigger hotkeys (Q for P1, P for P2)
      if ((this.input.keyJustPressed['q'] || this.input.keyJustPressed['Q']) && Math.abs(this.combat.karma) === 100) {
        this.combat.triggerAstra(this.player);
      }
      if ((this.input.keyJustPressed['p'] || this.input.keyJustPressed['P']) && Math.abs(this.combat.karma) === 100 && this.gameMode === 'versus2p') {
        this.combat.triggerAstra(this.enemy);
      }

      // Update character controls based on Game Mode selection
      this.updatePlayerControls(this.player, dt, this.enemy);
      
      if (this.gameMode === 'versus2p') {
        this.modes.updatePlayer2Controls(this.enemy, dt);
      } 
      else if (this.gameMode === 'training') {
        this.modes.handleTrainingInputs();
        this.modes.updateTrainingDummy(this.enemy, dt, this.player);
      } 
      else {
        this.updateAIControls(this.enemy, dt, this.player);
      }

      this.player.update(dt, this.enemy);
      this.enemy.update(dt, this.player);

      // Handle gravity physics
      this.updateEntityPhysics(this.player, dt);
      this.updateEntityPhysics(this.enemy, dt);

      // Handle overlap resolutions
      this.resolveCombatCollisions(dt);

      // Trigger weapon clash check
      const clashed = this.combat.checkWeaponClash(this.player, this.enemy);

      if (!clashed) {
        // Handle attack hit detection
        this.checkCombatHits(this.player, this.enemy);
        this.checkCombatHits(this.enemy, this.player);
      }

      // Check wall breaks and screen shifts
      this.combat.checkStageTransition(this.player);
      this.combat.checkStageTransition(this.enemy);

      // Tick active Astras
      this.combat.update(dt);

      // Check round end state
      if (this.player.died || this.enemy.died) {
        this.endRound('ko');
      }
    }
  }

  updateVariable(dt) {
    let visualDt = dt;
    if (this.slowMo > 0) {
      this.slowMo -= dt * 2;
      visualDt *= 0.3;
    }

    this.renderer.update(visualDt, this.player, this.enemy);

    if (this.particles) this.particles.update(visualDt);
    if (this.stage) this.stage.update(visualDt);
    if (this.ui) this.ui.update(visualDt);

    if (this.flashEffect > 0) this.flashEffect -= dt * 3;
    if (this.koFlash > 0) this.koFlash -= dt * 2;
  }

  updateEntityPhysics(entity, dt) {
    if (!entity.grounded) {
      entity.velocityY += CONFIG.GRAVITY * dt;
    }

    entity.x += entity.velocityX * dt;
    entity.y += entity.velocityY * dt;

    if (entity.y >= CONFIG.GROUND_Y) {
      entity.y = CONFIG.GROUND_Y;
      entity.velocityY = 0;
      if (!entity.grounded) {
        entity.grounded = true;
        this.particles.spawn(entity.x, entity.y, { type: 'smoke', color: '#666', count: 4, size: 8 });
        this.audio.playSfx('land');
      }
    }

    entity.x = clamp(entity.x, 40, CONFIG.W - 40);
  }

  updatePlayerControls(entity, dt, opp) {
    if (entity.attacking || entity.hitstun > 0 || entity.died) return;

    // Movement
    let speed = entity.speed;
    entity.blocking = !!(this.input.keys['Shift'] && entity.grounded);
    if (entity.blocking) speed *= 0.5;

    let moveIntent = 0;
    if (this.input.keys['ArrowLeft'] || this.input.keys['a'] || this.input.keys['A']) {
      entity.x -= speed * dt;
      moveIntent = -1;
    }
    if (this.input.keys['ArrowRight'] || this.input.keys['d'] || this.input.keys['D']) {
      entity.x += speed * dt;
      moveIntent = 1;
    }

    // Footsteps smoke particles
    if (moveIntent !== 0 && entity.grounded && Math.random() < 0.15) {
      this.particles.spawn(entity.x - entity.facing * 10, CONFIG.GROUND_Y, { type: 'smoke', color: '#888', size: 5, speed: 30 });
    }

    // Jump
    if ((this.input.keyJustPressed['w'] || this.input.keyJustPressed['W'] || this.input.keyJustPressed['ArrowUp']) && entity.grounded) {
      entity.velocityY = -650;
      entity.grounded = false;
      this.audio.playSfx('jump', rng(0.85, 1.15));
    }

    // Dodge
    if ((this.input.keyJustPressed['s'] || this.input.keyJustPressed['S'] || this.input.keyJustPressed['ArrowDown']) && entity.dodgeCooldown <= 0 && entity.grounded) {
      entity.dodgeTimer = 0.15;
      entity.dodgeCooldown = 0.6;
      entity.invTimer = 0.2;
      entity.velocityX = entity.facing * -450;
      this.audio.playSfx('dodge');
    }

    // Attacks
    if ((this.input.keyJustPressed['j'] || this.input.keyJustPressed['J'] || this.input.keyJustPressed['z'] || this.input.keyJustPressed['Z']) && entity.attackCooldown <= 0) {
      this.performAttack(entity, opp, 'light');
    }
    else if ((this.input.keyJustPressed['k'] || this.input.keyJustPressed['K'] || this.input.keyJustPressed['x'] || this.input.keyJustPressed['X']) && entity.attackCooldown <= 0) {
      this.performAttack(entity, opp, 'heavy');
    }
    else if ((this.input.keyJustPressed['l'] || this.input.keyJustPressed['L'] || this.input.keyJustPressed['c'] || this.input.keyJustPressed['C']) && entity.specialCooldown <= 0 && entity.energy >= CONFIG.SPECIAL_COST) {
      this.performSpecial(entity, opp);
    }
  }

  updateAIControls(entity, dt, opp) {
    if (entity.attacking || entity.hitstun > 0 || entity.died) return;

    entity.aiTimer -= dt;
    const distance = Math.abs(entity.x - opp.x);

    // AI logic ticks every 200ms
    if (entity.aiTimer <= 0) {
      entity.aiTimer = 0.2;

      // Basic behavior trees
      if (distance > 160) {
        entity.aiState = 'approach';
      } else {
        entity.aiState = 'fight';
      }
    }

    if (entity.aiState === 'approach') {
      const dir = opp.x > entity.x ? 1 : -1;
      entity.x += dir * entity.speed * dt;
    } 
    else if (entity.aiState === 'fight') {
      // Choose attack type randomly
      if (Math.random() < 0.2 && entity.energy >= CONFIG.SPECIAL_COST && entity.specialCooldown <= 0) {
        this.performSpecial(entity, opp);
      } else if (Math.random() < 0.4 && entity.attackCooldown <= 0) {
        this.performAttack(entity, opp, 'heavy');
      } else if (entity.attackCooldown <= 0) {
        this.performAttack(entity, opp, 'light');
      }
    }
  }

  performAttack(entity, opp, type) {
    entity.attacking = true;
    entity.attackType = type;
    entity.attackFrame = 0;
    entity.attackCooldown = type === 'heavy' ? 0.6 : 0.35;

    // Attacking lunge velocities
    const lunge = type === 'heavy' ? 250 : 130;
    entity.velocityX = entity.facing * lunge;

    this.audio.playSfx(type === 'heavy' ? 'heavy' : 'hit', rng(0.9, 1.1));

    // Reset attack state after animation frames
    const dur = type === 'heavy' ? 8 : 5;
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      entity.attackFrame = frame;
      if (frame >= dur) {
        entity.attacking = false;
        clearInterval(interval);
      }
    }, 45); // 45ms per animation frame tick
  }

  performSpecial(entity, opp) {
    entity.attacking = true;
    entity.attackType = 'special';
    entity.attackFrame = 0;
    entity.specialActive = true;
    entity.specialTimer = 0.5;
    entity.energy -= CONFIG.SPECIAL_COST;
    entity.specialCooldown = CONFIG.SPECIAL_COOLDOWN;

    entity.velocityX = entity.facing * 350;
    this.audio.playSfx('special');
    
    // Play full-screen special flash burst
    this.renderer.triggerShake(12);

    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      entity.attackFrame = frame;
      if (frame >= 10) {
        entity.attacking = false;
        entity.specialActive = false;
        clearInterval(interval);
      }
    }, 50);
  }

  checkCombatHits(attacker, defender) {
    if (!attacker.attacking || attacker.attackFrame !== 2) return; // check hit on specific active frames

    // Hit ranges
    let hitDist = 95;
    if (attacker.attackType === 'heavy') hitDist = 140;
    if (attacker.attackType === 'special') hitDist = 220;

    const actualDist = Math.abs(attacker.x - defender.x);
    if (actualDist < hitDist) {
      // Calculate damage
      let damage = attacker.attack;
      let knockbackX = attacker.facing * 180;
      let knockbackY = 0;

      if (attacker.attackType === 'heavy') {
        damage *= 1.6;
        knockbackX = attacker.facing * 300;
        knockbackY = -280; // Launches opponent
      } 
      else if (attacker.attackType === 'special') {
        damage = attacker.specialDmg;
        knockbackX = attacker.facing * 450;
        knockbackY = -350; // Launch skyward
      }

      // Combo scale modifier
      if (attacker === this.player) {
        this.comboCount++;
        this.comboTimer = CONFIG.COMBO_WINDOW;
        damage *= (1 + (this.comboCount - 1) * 0.07);
      }

      // Apply air juggle scaling physics
      if (!defender.grounded && knockbackY !== 0) {
        this.combat.applyJuggleForce(defender, knockbackY);
      }

      // Resolve damage
      const result = defender.takeDamage(damage, knockbackX, knockbackY);
      
      if (result.hit) {
        this.screenEffects.triggerHitStop(attacker.attackType);
        this.renderer.triggerShake(attacker.attackType === 'special' ? 18 : 8);

        // Track and modify Dharma/Karma balance
        if (attacker === this.player) {
          // Player hit AI -> shift towards aggressive Adharma
          const karmaShift = attacker.attackType === 'special' ? -15 : -5;
          this.combat.adjustKarma(karmaShift);
        }

        // Spawn hit particle effects
        if (result.blocked) {
          if (attacker === this.enemy) {
            // Player successfully blocked AI strike -> shift towards righteous Dharma
            this.combat.adjustKarma(15);
          }
          this.particles.spawn(defender.x, defender.y - 40, { type: 'ring', color: '#ffffff', size: 30 });
          this.particles.spawnFloatingText(defender.x, defender.y - 80, 'BLOCKED', '#9e9e9e');
          this.audio.playSfx('block');
        } else {
          if (attacker.attackType === 'heavy') {
            this.particles.spawnHeavyHitSparks(defender.x, defender.y - 40, attacker.color);
          } else if (attacker.attackType === 'special') {
            this.particles.spawnSpecialBurst(defender.x, defender.y - 40, attacker.color);
          } else {
            this.particles.spawnHitSparks(defender.x, defender.y - 40, attacker.color);
          }
          this.particles.spawnFloatingText(defender.x, defender.y - 80, Math.round(result.damage), '#ff3d00');
        }
      }
    }
  }

  resolveCombatCollisions(dt) {
    if (!this.player || !this.enemy) return;

    const collisionWidth = 70;
    const overlap = collisionWidth - Math.abs(this.player.x - this.enemy.x);
    
    if (overlap > 0) {
      const dir = this.player.x < this.enemy.x ? -1 : 1;
      const minX = 40;
      const maxX = CONFIG.W - 40;
      
      const p1AtBound = (this.player.x <= minX && dir === -1) || (this.player.x >= maxX && dir === 1);
      const p2AtBound = (this.enemy.x <= minX && dir === 1) || (this.enemy.x >= maxX && dir === -1);
      
      if (p1AtBound && !p2AtBound) {
        this.enemy.x -= dir * overlap;
      } else if (p2AtBound && !p1AtBound) {
        this.player.x += dir * overlap;
      } else {
        this.player.x += dir * overlap * 0.5;
        this.enemy.x -= dir * overlap * 0.5;
      }
      
      this.player.x = clamp(this.player.x, minX, maxX);
      this.enemy.x = clamp(this.enemy.x, minX, maxX);
    }
  }

  endRound(type) {
    this.roundActive = false;
    this.battleActive = false;
    
    let winner = 'player';
    if (type === 'time') {
      if (this.player.currentHp < this.enemy.currentHp) winner = 'enemy';
    } else {
      if (this.player.currentHp <= 0) winner = 'enemy';
    }

    if (winner === 'player') {
      this.playerWins++;
    } else {
      this.enemyWins++;
    }

    if (type === 'ko') {
      this.screenEffects.triggerKoFlash();
    }

    setTimeout(() => {
      if (this.playerWins >= 2 || this.enemyWins >= 2) {
        this.endBattle(winner);
      } else {
        this.round++;
        this.startRound();
      }
    }, 2500);
  }

  endBattle(winner) {
    this.audio.stopMusic();

    // In Story mode, advance chapters if player wins
    if (this.gameMode === 'story') {
      if (winner === 'player') {
        this.story.dialogueMode = 'outro';
        this.story.inDialogue = true;
        this.state = 'battle';
        return;
      }
    }

    // In Arcade mode, advance ladder stages if player wins
    if (this.gameMode === 'arcade') {
      if (winner === 'player') {
        this.modes.advanceArcadeStage();
        return;
      }
    }

    // Calculate progression rewards
    const rewards = this.progression.awardMatchRewards(winner, winner === 'player' ? 1 : 0, this.round);
    const unlocks = this.progression.checkFightAchievements({
      maxCombo: this.comboCount,
      perfectRound: this.player.currentHp === this.player.hp,
      firstWin: winner === 'player',
      wonMatch: winner === 'player'
    });

    this.lastMatchResults = {
      winner,
      xpEarned: rewards.xp,
      dpEarned: rewards.dp,
      leveledUp: rewards.leveledUp,
      newLevel: rewards.newLevel,
      unlockedAchievements: unlocks
    };

    this.state = 'result';
  }

  render() {
    this.renderer.begin();

    // 1. Draw Parallax Background Stage
    if (this.stage) {
      this.stage.draw(this.renderer.ctx);
    }

    // 2. Draw Dynamic Lighting Layer (Shadows, Auras)
    if (this.lighting) {
      this.lighting.draw(this.renderer.ctx);
    }

    // 3. Draw Characters (Detailed skeletal models)
    if (this.player) {
      this.charRenderer.draw(this.renderer.ctx, this.player);
    }
    if (this.enemy) {
      this.charRenderer.draw(this.renderer.ctx, this.enemy);
    }

    // 4. Draw Particles Systems (Sparks, blood, embers)
    if (this.particles) {
      this.particles.draw(this.renderer.ctx);
    }

    // Restore viewport transformations
    this.renderer.end();

    // 5. Draw Visual Flash effects
    this.renderer.drawScreenFlash(this.flashEffect, '#ffffff');
    this.renderer.drawScreenFlash(this.koFlash, '#ff3b30');

    // 6. Draw HUD overlays and Screen menus
    if (this.ui) {
      this.ui.draw(this.renderer.ctx, this.state);
    }

    if (this.state === 'battle') {
      // Draw training overlays and help panels
      this.modes.drawTrainingOverlay(this.renderer.ctx);
      
      // Draw Dharma/Adharma Karma meters
      if (!this.story.inDialogue) {
        this.combat.drawKarmaHUD(this.renderer.ctx);
      }
    }

    // Draw Story dialogues box if active
    if (this.state === 'battle' && this.story.inDialogue) {
      this.story.draw(this.renderer.ctx);
    }
  }

  showToast(msg) {
    if (this.ui && this.ui.showToast) {
      this.ui.showToast(msg);
    }
  }
}
