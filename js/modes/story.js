// ============================================================
// DHARMYUDH - Story Mode Narrative Campaign Engine
// ============================================================

export const STORY_CAMPAIGNS = {
  arjuna: {
    title: 'The Path of the Archer',
    chapters: [
      {
        opponentId: 'drona',
        title: 'Chapter 1: The Guru\'s Blessing',
        intro: [
          'Drona: Arjuna, your focus is unmatched, but a true archer sees only the eye of the bird. Are you ready for the ultimate test of your training?',
          'Arjuna: Guru-dev, my Gandiva is always ready. I seek only your guidance and blessing on the path of dharma.',
          'Drona: Show me your resolve. Draw your bow!'
        ],
        outro: [
          'Drona: Excellent, Arjuna! You have surpassed my expectations. The sky itself shall witness your arrows.',
          'Arjuna: I am humbled, Guru-dev. Your teachings are my armor.'
        ]
      },
      {
        opponentId: 'karna',
        title: 'Chapter 2: The Duel of Destiny',
        intro: [
          'Karna: Arjuna! The world calls you the greatest, but today the sun shall witness who truly rules the bow.',
          'Arjuna: Karna, your strength is legendary, but your path lies in the shadows of adharma. I must fight to defend the righteous.',
          'Karna: Dharma is decided by the victors. Let our arrows speak!'
        ],
        outro: [
          'Arjuna: Your skill is peerless, Karna. But your arrows could not pierce the shield of truth.',
          'Karna: The day is yours, Arjuna. But our final battle is yet to come under the eyes of the gods.'
        ]
      },
      {
        opponentId: 'krishna',
        title: 'Chapter 3: The Divine Revelation',
        intro: [
          'Krishna: Partha, you have triumphed over your rivals, but do you understand the true nature of the war you fight?',
          'Arjuna: Madhava, my heart is heavy with the sight of my kinsmen. Guide me, for I am lost in doubt.',
          'Krishna: Lift your Gandiva, Partha! Fight not for victory, but for duty. Let me test your spiritual readiness!'
        ],
        outro: [
          'Krishna: You have understood, Arjuna. Let your action be your reward. The battlefield of Kurukshetra awaits you.',
          'Arjuna: My doubts are cleared, Madhava. I am ready to fight for dharma!'
        ]
      }
    ]
  },
  bhima: {
    title: 'The Might of the Wind',
    chapters: [
      {
        opponentId: 'duryodhana',
        title: 'Chapter 1: The Rivalry of Mace',
        intro: [
          'Duryodhana: Bhima! You think your raw strength can defeat the crown prince of Hastinapura? My iron mace will shatter your pride today.',
          'Bhima: Duryodhana! Your sins have filled the pot of adharma. My mace shall break your thighs and free this land from your tyranny.',
          'Duryodhana: Empty words, beast! Draw your weapon!'
        ],
        outro: [
          'Bhima: Your crown lies in the dust, Duryodhana. Your reign of greed ends here.',
          'Duryodhana: This is but a temporary setback. I will return stronger!'
        ]
      }
    ]
  },
  karna: {
    title: 'The Sun Warrior\'s Loyalty',
    chapters: [
      {
        opponentId: 'arjuna',
        title: 'Chapter 1: The Ultimate Rivalry',
        intro: [
          'Arjuna: Karna, you have chosen to stand with the wicked. The Gandiva bow will show you the path of dharma.',
          'Karna: Arjuna, I fight not for Duryodhana\'s crown, but for the vow of friendship I made. I shall prove my loyalty with my blood.',
          'Arjuna: Let the arrows of destiny fly!'
        ],
        outro: [
          'Karna: The Vijaya bow has triumphed this day. But my respect for your skill remains undiminished, Partha.',
          'Arjuna: You are a noble warrior, Karna. It is a tragedy that we must meet as foes.'
        ]
      }
    ]
  }
};

export class StoryModeEngine {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.currentChapter = 0;
    this.dialogueIdx = 0;
    this.inDialogue = false;
    this.dialogueMode = 'intro'; // 'intro', 'outro'
  }

  startCampaign(charId) {
    this.campaign = STORY_CAMPAIGNS[charId] || STORY_CAMPAIGNS['arjuna'];
    this.currentChapter = 0;
    this.dialogueIdx = 0;
    this.inDialogue = true;
    this.dialogueMode = 'intro';
    
    this.game.state = 'battle';
    this.game.gameMode = 'story';
    this.game.playerChar = CHARACTERS.find(c => c.id === charId) || CHARACTERS[0];
    this.setChapterOpponent();
  }

  setChapterOpponent() {
    const chapter = this.campaign.chapters[this.currentChapter];
    this.game.enemyChar = CHARACTERS.find(c => c.id === chapter.opponentId) || CHARACTERS[1];
  }

  update(dt) {
    if (!this.inDialogue) return;

    // Advance dialogue on enter or mouse click
    if (this.game.input.keyJustPressed['Enter'] || this.game.input.mouseClicked) {
      this.game.audio.playSfx('select', 1.0);
      this.dialogueIdx++;
      
      const chapter = this.campaign.chapters[this.currentChapter];
      const dialogues = this.dialogueMode === 'intro' ? chapter.intro : chapter.outro;

      if (this.dialogueIdx >= dialogues.length) {
        this.inDialogue = false;
        this.dialogueIdx = 0;
        
        if (this.dialogueMode === 'intro') {
          // Start the actual combat round
          this.game.startRound();
        } else {
          // Advance chapter or finish campaign
          this.currentChapter++;
          if (this.currentChapter >= this.campaign.chapters.length) {
            // Campaign Completed!
            this.game.state = 'result';
            this.game.ui.showToast('Campaign Completed successfully!');
          } else {
            // Next chapter
            this.setChapterOpponent();
            this.dialogueMode = 'intro';
            this.inDialogue = true;
          }
        }
      }
    }
  }

  draw(ctx) {
    if (!this.inDialogue) return;

    ctx.save();
    
    // Draw visual novel dialogue card (Glassmorphic dark board)
    ctx.fillStyle = 'rgba(5, 5, 8, 0.88)';
    ctx.fillRect(50, CONFIG.H - 220, CONFIG.W - 100, 180);
    ctx.strokeStyle = '#dfa650';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, CONFIG.H - 220, CONFIG.W - 100, 180);

    const chapter = this.campaign.chapters[this.currentChapter];
    const dialogues = this.dialogueMode === 'intro' ? chapter.intro : chapter.outro;
    const currentLine = dialogues[this.dialogueIdx];

    if (currentLine) {
      const parts = currentLine.split(':');
      const speaker = parts[0];
      const text = parts[1] || '';

      // Speaker Name
      ctx.fillStyle = '#ff8f00';
      ctx.font = 'bold 24px Rajdhani';
      ctx.fillText(speaker.toUpperCase(), 80, CONFIG.H - 180);

      // Dialogue Text
      ctx.fillStyle = '#e8d5b0';
      ctx.font = '20px Rajdhani';
      this.wrapText(ctx, text.trim(), 80, CONFIG.H - 140, CONFIG.W - 160, 26);
    }

    // Blinking prompt
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px Rajdhani';
    ctx.textAlign = 'right';
    ctx.fillText('PRESS ENTER OR CLICK TO CONTINUE', CONFIG.W - 80, CONFIG.H - 60);

    ctx.restore();
  }

  // Text wrapper utility
  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }
}
export default StoryModeEngine;
