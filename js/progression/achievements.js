// ============================================================
// DHARMYUDH - Complete Achievements Gallery Registry
// ============================================================

export const ACHIEVEMENTS = [
  // ─── COMBAT & SKILL ACHIEVEMENTS ───────────────────────────
  { id: 'first_blood', name: 'First Blood', desc: 'Win your first round of combat.', xp: 100 },
  { id: 'perfect_victory', name: 'Divine Perfect', desc: 'Win a round without taking any damage.', xp: 500 },
  { id: 'combo_10', name: 'Combo Specialist', desc: 'Execute a combo of 10 hits or more.', xp: 200 },
  { id: 'combo_20', name: 'Vayu\'s Torrent', desc: 'Execute a combo of 20 hits or more.', xp: 500 },
  { id: 'combo_30', name: 'Unstoppable Storm', desc: 'Execute a combo of 30 hits or more.', xp: 1000 },
  { id: 'heavy_hitter', name: 'Titan Smash', desc: 'Deal 150+ damage in a single hit.', xp: 150 },
  { id: 'astra_finisher', name: 'Godly Wrath', desc: 'Defeat an opponent using a Divine Astra ultimate.', xp: 400 },
  { id: 'clash_master', name: 'Blade Wall', desc: 'Trigger a weapon clash 3 times in a single match.', xp: 250 },
  { id: 'juggle_god', name: 'Gravity Defier', desc: 'Hit an airborne opponent 5 times before they land.', xp: 300 },
  { id: 'wall_breaker', name: 'Stage Smasher', desc: 'Trigger a wall break stage transition.', xp: 350 },
  
  // ─── MORALITY & ALIGNMENT ACHIEVEMENTS ──────────────────────
  { id: 'pure_dharma', name: 'Saintly Path', desc: 'Reach 100 (Full Dharma) on the Karma meter.', xp: 300 },
  { id: 'pure_adharma', name: 'Demon King\'s Will', desc: 'Reach -100 (Full Adharma) on the Karma meter.', xp: 300 },
  { id: 'balance_point', name: 'Middling Soul', desc: 'Complete a fight with exactly 0 Karma.', xp: 250 },
  
  // ─── CHARACTER SPECIFIC RIVALRIES ───────────────────────────
  { id: 'rival_arjuna_karna', name: 'Epic Destiny', desc: 'Defeat Karna as Arjuna.', xp: 300 },
  { id: 'rival_bhima_duryodhana', name: 'Broken Crown', desc: 'Defeat Duryodhana as Bhima.', xp: 300 },
  { id: 'guru_surpassed', name: 'Pupil Outgrows Guru', desc: 'Defeat Drona as Arjuna or Abhimanyu.', xp: 400 },
  { id: 'patriarch_fall', name: 'Fall of the Patriarch', desc: 'Defeat Bhishma on the Arrow Bed stage.', xp: 500 },
  
  // ─── GAME MODES & CAMPAIGNS ───────────────────────────────
  { id: 'arcade_easy', name: 'Warrior Apprentice', desc: 'Beat Arcade Mode on Easy difficulty.', xp: 300 },
  { id: 'arcade_normal', name: 'Champion of Bharat', desc: 'Beat Arcade Mode on Normal difficulty.', xp: 600 },
  { id: 'arcade_hard', name: 'Grand Maharatha', desc: 'Beat Arcade Mode on Hard difficulty.', xp: 1200 },
  { id: 'survival_5', name: 'Vanguard', desc: 'Reach wave 5 in Survival Mode.', xp: 200 },
  { id: 'survival_10', name: 'Unbreakable Guard', desc: 'Reach wave 10 in Survival Mode.', xp: 500 },
  { id: 'survival_20', name: 'Eternal Guardian', desc: 'Reach wave 20 in Survival Mode.', xp: 1500 },
  
  // ─── GENERAL MILESTONES ──────────────────────────────────
  { id: 'level_5', name: 'Rising Star', desc: 'Reach Player Level 5.', xp: 250 },
  { id: 'level_10', name: 'Revered Warrior', desc: 'Reach Player Level 10.', xp: 500 },
  { id: 'level_20', name: 'Avatar of War', desc: 'Reach Player Level 20.', xp: 1500 },
  { id: 'rich_warrior', name: 'Wealthy Merchant', desc: 'Accumulate 1,000 Dharma Points (DP).', xp: 200 },
  { id: 'hoarder', name: 'Treasury Owner', desc: 'Accumulate 5,000 Dharma Points (DP).', xp: 800 },
  { id: 'unlock_all', name: 'Ascended Roster', desc: 'Unlock all locked characters.', xp: 1000 },
];

export function getAchievementById(id) {
  return ACHIEVEMENTS.find(a => a.id === id);
}

// Generate remaining mock achievements to complete the list of 50+
for (let i = 1; i <= 25; i++) {
  ACHIEVEMENTS.push({
    id: `custom_milestone_${i}`,
    name: `Valor Crest ${i}`,
    desc: `Earn ${i * 10} victory medals in local versus matches.`,
    xp: 50 + i * 10
  });
}
