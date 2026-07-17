// ============================================================
// DHARMYUDH - Game Modes Controller (Arcade, Versus 2P, Training)
// ============================================================

import { CONFIG, rng } from '../engine/config.js';
import { CHARACTERS } from '../characters/roster.js';
import { BaseCharacter } from '../characters/base_character.js';

export class GameModesController {
  constructor(game) {
    this.game = game;

    // Arcade Mode progression state
    this.arcadeLadder = [];
    this.arcadeStageIdx = 0;

    // Training Mode dummy behaviors
    this.trainingDummyState = 'dummy_idle'; // 'dummy_idle', 'dummy_jump', 'dummy_block', 'dummy_fight'
  }

  // ─── ARCADE MODE LADDER ─────────────────────────────────────
  startArcadeMode(playerCharId) {
    this.arcadeStageIdx = 0;
    this.game.gameMode = 'arcade';
    this.game.state = 'battle';
    
    this.game.playerChar = CHARACTERS.find(c => c.id === playerCharId) || CHARACTERS[0];
    
    // Generate an 8-match sequence containing unique warriors, ending with Krishna or Bhishma as boss
    const opponents = CHARACTERS.filter(c => c.id !== playerCharId);
    
    // Shuffle opponents
    for (let i = opponents.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opponents[i], opponents[j]] = [opponents[j], opponents[i]];
    }
    
    this.arcadeLadder = opponents.slice(0, 5); // 5 ladder fights
    this.game.enemyChar = this.arcadeLadder[0];
    
    this.game.playerWins = 0;
    this.game.enemyWins = 0;
    this.game.round = 1;
    this.game.startRound();
  }

  advanceArcadeStage() {
    this.arcadeStageIdx++;
    if (this.arcadeStageIdx >= this.arcadeLadder.length) {
      // Beaten Arcade!
      this.game.state = 'result';
      this.game.storage.data.progression.arcadeBeaten = true;
      this.game.storage.save();
      this.game.ui.showToast('Arcade Mode Completed! Rank Up!');
      
      // Unlock a locked character as a reward
      const locked = this.game.storage.data.progression.unlocks.lockedCharacters;
      if (locked.length > 0) {
        const toUnlock = locked[0];
        this.game.storage.unlockCharacter(toUnlock);
        this.game.ui.showToast(`UNLOCKED WARRIOR: ${toUnlock.toUpperCase()}!`);
      }
    } else {
      this.game.enemyChar = this.arcadeLadder[this.arcadeStageIdx];
      this.game.round = 1;
      this.game.playerWins = 0;
      this.game.enemyWins = 0;
      this.game.startRound();
    }
  }

  // ─── LOCAL VERSUS 2-PLAYER MODE ─────────────────────────────
  startLocalVersus(p1CharId, p2CharId) {
    this.game.gameMode = 'versus2p';
    this.game.state = 'battle';
    
    this.game.playerChar = CHARACTERS.find(c => c.id === p1CharId) || CHARACTERS[0];
    this.game.enemyChar = CHARACTERS.find(c => c.id === p2CharId) || CHARACTERS[1];
    
    this.game.playerWins = 0;
    this.game.enemyWins = 0;
    this.game.round = 1;
    this.game.startRound();
  }

  updatePlayer2Controls(entity, dt) {
    if (entity.attacking || entity.hitstun > 0 || entity.died) return;

    // Fetch Player 2 bindings from input system
    let speed = entity.speed;
    entity.blocking = !!(this.game.input.isActionPressed('Block', 2) && entity.grounded);
    if (entity.blocking) speed *= 0.5;

    let moveIntent = 0;
    if (this.game.input.isActionPressed('MoveLeft', 2)) {
      entity.x -= speed * dt;
      moveIntent = -1;
    }
    if (this.game.input.isActionPressed('MoveRight', 2)) {
      entity.x += speed * dt;
      moveIntent = 1;
    }

    // Footsteps smoke
    if (moveIntent !== 0 && entity.grounded && Math.random() < 0.15) {
      this.game.particles.spawn(entity.x - entity.facing * 10, CONFIG.GROUND_Y, { type: 'smoke', color: '#888', size: 5, speed: 30 });
    }

    // Jump
    if (this.game.input.isActionJustPressed('Jump', 2) && entity.grounded) {
      entity.velocityY = -650;
      entity.grounded = false;
      this.game.audio.playSfx('jump', rng(0.85, 1.15));
    }

    // Dodge
    if (this.game.input.isActionJustPressed('Dodge', 2) && entity.dodgeCooldown <= 0 && entity.grounded) {
      entity.dodgeTimer = 0.15;
      entity.dodgeCooldown = 0.6;
      entity.invTimer = 0.2;
      entity.velocityX = entity.facing * -450;
      this.game.audio.playSfx('dodge');
    }

    // P2 Attacks
    if (this.game.input.isActionJustPressed('AttackLight', 2) && entity.attackCooldown <= 0) {
      this.game.performAttack(entity, this.game.player, 'light');
    }
    else if (this.game.input.isActionJustPressed('AttackHeavy', 2) && entity.attackCooldown <= 0) {
      this.game.performAttack(entity, this.game.player, 'heavy');
    }
    else if (this.game.input.isActionJustPressed('Special', 2) && entity.specialCooldown <= 0 && entity.energy >= CONFIG.SPECIAL_COST) {
      this.game.performSpecial(entity, this.game.player);
    }
  }

  // ─── TRAINING PRACTICE MODE ────────────────────────────────
  startTrainingMode(playerCharId, dummyCharId) {
    this.game.gameMode = 'training';
    this.game.state = 'battle';
    
    this.game.playerChar = CHARACTERS.find(c => c.id === playerCharId) || CHARACTERS[0];
    this.game.enemyChar = CHARACTERS.find(c => c.id === dummyCharId) || CHARACTERS[1];
    
    this.game.playerWins = 0;
    this.game.enemyWins = 0;
    this.game.round = 1;
    this.game.startRound();
  }

  updateTrainingDummy(entity, dt, opp) {
    if (entity.died) {
      // Instantly resurrect dummy in training mode
      setTimeout(() => {
        if (entity.died) {
          entity.died = false;
          entity.currentHp = entity.hp;
          entity.x = CONFIG.W - 220;
          entity.y = CONFIG.GROUND_Y;
          entity.velocityY = 0;
          entity.velocityX = 0;
          entity.state = 'idle';
          this.game.particles.spawn(entity.x, entity.y, { type: 'aura', color: '#00e5ff', size: 40 });
        }
      }, 1000);
      return;
    }

    // Keep energy filled for training special spamming
    opp.energy = opp.maxEnergy;
    entity.energy = entity.maxEnergy;

    // Reset dummy HP to max if combo ends
    if (this.game.comboCount === 0 && entity.currentHp < entity.hp && entity.hitstun <= 0) {
      entity.currentHp = entity.hp;
    }

    // Control dummy state behaviors based on selections
    entity.blocking = this.trainingDummyState === 'dummy_block';

    if (this.trainingDummyState === 'dummy_jump' && entity.grounded) {
      entity.velocityY = -650;
      entity.grounded = false;
    }

    if (this.trainingDummyState === 'dummy_fight') {
      this.game.updateAIControls(entity, dt, opp);
    }
  }

  drawTrainingOverlay(ctx) {
    if (this.game.gameMode !== 'training') return;
    
    ctx.save();
    
    // Top center training layout banner
    ctx.fillStyle = 'rgba(10, 10, 15, 0.65)';
    ctx.fillRect(CONFIG.W / 2 - 180, 80, 360, 45);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.strokeRect(CONFIG.W / 2 - 180, 80, 360, 45);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Rajdhani';
    ctx.textAlign = 'center';
    
    const dummyModeText = this.trainingDummyState.replace('dummy_', '').toUpperCase();
    ctx.fillText(`PRACTICE MODE  |  DUMMY: ${dummyModeText}`, CONFIG.W / 2, 108);

    // Help box for dummy customization
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(30, 150, 240, 110);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(30, 150, 240, 110);

    ctx.fillStyle = '#b8966a';
    ctx.font = 'bold 14px Rajdhani';
    ctx.textAlign = 'left';
    ctx.fillText('DUMMY CONTROL KEYS:', 45, 175);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('[T] Toggle Idle / Block', 45, 200);
    ctx.fillText('[Y] Toggle Jump dummy', 45, 225);
    ctx.fillText('[U] Toggle CPU Fight', 45, 250);

    ctx.restore();
  }

  handleTrainingInputs() {
    if (this.game.gameMode !== 'training') return;

    if (this.game.input.keyJustPressed['t'] || this.game.input.keyJustPressed['T']) {
      this.trainingDummyState = this.trainingDummyState === 'dummy_block' ? 'dummy_idle' : 'dummy_block';
      this.game.audio.playSfx('select');
    }
    if (this.game.input.keyJustPressed['y'] || this.game.input.keyJustPressed['Y']) {
      this.trainingDummyState = this.trainingDummyState === 'dummy_jump' ? 'dummy_idle' : 'dummy_jump';
      this.game.audio.playSfx('select');
    }
    if (this.game.input.keyJustPressed['u'] || this.game.input.keyJustPressed['U']) {
      this.trainingDummyState = this.trainingDummyState === 'dummy_fight' ? 'dummy_idle' : 'dummy_fight';
      this.game.audio.playSfx('select');
    }
  }
}
export default GameModesController;
