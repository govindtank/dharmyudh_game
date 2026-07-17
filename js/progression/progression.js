// ============================================================
// DHARMYUDH - Progression & Level Manager
// ============================================================

export class ProgressionManager {
  constructor(game) {
    this.game = game;
  }

  // Award XP and Dharma Points at the end of a match
  awardMatchRewards(winner, playerKills = 0, roundsPlayed = 2) {
    const isWin = winner === 'player';
    
    // XP math: Win = 500 XP, Loss = 150 XP, plus 50 XP per round and 100 XP per kill
    let xpEarned = isWin ? 500 : 150;
    xpEarned += roundsPlayed * 50;
    xpEarned += playerKills * 100;
    
    // Dharma Points (currency): 50 DP on win, 10 DP on loss
    let dpEarned = isWin ? 50 : 10;
    dpEarned += playerKills * 10;

    // Apply via storage
    const result = this.game.storage.addXP(xpEarned);
    this.game.storage.addDharmaPoints(dpEarned);

    // Save survival stats if in survival mode
    if (this.game.gameMode === 'survival') {
      this.game.storage.updateSurvivalHighScore(this.game.survivalWave);
    }

    return {
      xp: xpEarned,
      dp: dpEarned,
      leveledUp: result.leveledUp,
      newLevel: result.level
    };
  }

  // Evaluate achievements based on fight criteria
  checkFightAchievements(fightStats) {
    const unlocks = [];
    const storage = this.game.storage;

    // 1. Check combo count achievement
    if (fightStats.maxCombo >= 10) {
      if (storage.completeAchievement('combo_10')) {
        unlocks.push('Combo Master (10+ Hits)');
      }
    }
    
    // 2. Perfect round achievement
    if (fightStats.perfectRound) {
      if (storage.completeAchievement('perfect_victory')) {
        unlocks.push('Divine Perfect (Win without taking damage)');
      }
    }

    // 3. First blood achievement
    if (fightStats.firstWin) {
      if (storage.completeAchievement('first_blood')) {
        unlocks.push('First Blood (Win your first round)');
      }
    }

    // 4. Defeat rival (Arjuna defeating Karna)
    if (this.game.playerChar.id === 'arjuna' && this.game.enemyChar.id === 'karna' && fightStats.wonMatch) {
      if (storage.completeAchievement('rival_arjuna_karna')) {
        unlocks.push('Epic Destiny (Defeat Karna as Arjuna)');
      }
    }

    return unlocks;
  }
}
export default ProgressionManager;
