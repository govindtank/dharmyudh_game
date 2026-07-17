// ============================================================
// DHARMYUDH - Storage System
// ============================================================

export class StorageSystem {
  constructor() {
    this.key = 'dharmyudh_save_v1';
    this.data = this.getInitialData();
    this.load();
  }

  getInitialData() {
    return {
      settings: {
        volumeMaster: 0.35,
        volumeMusic: 0.1,
        volumeSfx: 0.5,
        graphicsQuality: 'high', // 'low', 'medium', 'high', 'ultra'
        screenShakeEnabled: true,
        particleDensity: 1.0,
        controlsMode: 'classic', // 'classic', 'modern'
        keyBindings: {
          // Player 1 Defaults
          'MoveLeft': 'a',
          'MoveRight': 'd',
          'Jump': 'w',
          'Dodge': 's',
          'AttackLight': 'j',
          'AttackHeavy': 'k',
          'Special': 'l',
          'Block': 'Shift',
          // Player 2 Defaults (Local Versus)
          'P2MoveLeft': 'ArrowLeft',
          'P2MoveRight': 'ArrowRight',
          'P2Jump': 'ArrowUp',
          'P2Dodge': 'ArrowDown',
          'P2AttackLight': '1',
          'P2AttackHeavy': '2',
          'P2Special': '3',
          'P2Block': '0',
        }
      },
      progression: {
        xp: 0,
        level: 1,
        dharmaPoints: 0,
        unlocks: {
          characters: ['arjuna', 'bhima', 'karna', 'duryodhana', 'nakula', 'yudhishthira'], // Default roster unlocked
          lockedCharacters: ['abhimanyu', 'ashwatthama', 'draupadi', 'bhishma'], // Locked by default
          stages: ['kurukshetra', 'indraprastha', 'hastinapura'], // Default stages
          lockedStages: ['celestial_realm', 'forest_of_dharma', 'bridge_of_lanka'], // Locked stages
          palettes: {
            arjuna: [0],
            bhima: [0],
            karna: [0],
            duryodhana: [0],
            nakula: [0],
            yudhishthira: [0],
            abhimanyu: [0],
            ashwatthama: [0],
            draupadi: [0],
            bhishma: [0],
          }
        },
        achievements: [],
        characterStats: {}, // Matches played, won, etc. per character
        survivalHighScore: 0,
        arcadeBeaten: false
      }
    };
  }

  load() {
    try {
      const stored = localStorage.getItem(this.key);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with initial data to support structure updates
        this.data = this.deepMerge(this.getInitialData(), parsed);
      } else {
        this.save();
      }
    } catch (e) {
      console.error('StorageSystem load failed, using defaults:', e);
      this.data = this.getInitialData();
    }
  }

  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch (e) {
      console.error('StorageSystem save failed:', e);
    }
  }

  deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target) {
        Object.assign(source[key], this.deepMerge(target[key], source[key]));
      }
    }
    Object.assign(target || {}, source);
    return target;
  }

  // Getters & Setters
  getSettings() { return this.data.settings; }
  saveSettings(settings) {
    this.data.settings = this.deepMerge(this.data.settings, settings);
    this.save();
  }

  getProgression() { return this.data.progression; }
  
  addXP(amount) {
    const prog = this.data.progression;
    prog.xp += amount;
    
    // Level up calculation (e.g. level * 1000 XP required)
    let xpNeeded = prog.level * 1000;
    let leveledUp = false;
    
    while (prog.xp >= xpNeeded) {
      prog.xp -= xpNeeded;
      prog.level++;
      xpNeeded = prog.level * 1000;
      leveledUp = true;
    }
    
    this.save();
    return { leveledUp, level: prog.level };
  }

  addDharmaPoints(amount) {
    this.data.progression.dharmaPoints += amount;
    this.save();
  }

  unlockCharacter(charId) {
    const unlocks = this.data.progression.unlocks;
    if (unlocks.lockedCharacters.includes(charId)) {
      unlocks.lockedCharacters = unlocks.lockedCharacters.filter(id => id !== charId);
      if (!unlocks.characters.includes(charId)) {
        unlocks.characters.push(charId);
      }
      this.save();
      return true;
    }
    return false;
  }

  unlockStage(stageId) {
    const unlocks = this.data.progression.unlocks;
    if (unlocks.lockedStages.includes(stageId)) {
      unlocks.lockedStages = unlocks.lockedStages.filter(id => id !== stageId);
      if (!unlocks.stages.includes(stageId)) {
        unlocks.stages.push(stageId);
      }
      this.save();
      return true;
    }
    return false;
  }

  unlockPalette(charId, paletteIndex) {
    const palettes = this.data.progression.unlocks.palettes;
    if (!palettes[charId]) palettes[charId] = [0];
    if (!palettes[charId].includes(paletteIndex)) {
      palettes[charId].push(paletteIndex);
      this.save();
      return true;
    }
    return false;
  }

  completeAchievement(achievementId) {
    const achievements = this.data.progression.achievements;
    if (!achievements.includes(achievementId)) {
      achievements.push(achievementId);
      this.save();
      return true;
    }
    return false;
  }

  updateSurvivalHighScore(waves) {
    const prog = this.data.progression;
    if (waves > prog.survivalHighScore) {
      prog.survivalHighScore = waves;
      this.save();
      return true;
    }
    return false;
  }
}
