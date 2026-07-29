(() => {
  // js/engine/config.js
  var CONFIG2 = {
    W: 1280,
    H: 720,
    GROUND_Y: 520,
    GRAVITY: 1800,
    COMBO_WINDOW: 0.35,
    MAX_COMBO: 20,
    ENERGY_REGEN: 14,
    SPECIAL_COST: 50,
    SPECIAL_COOLDOWN: 2.5,
    FPS: 60,
    PHYSICS_STEP: 1 / 120
    // 120Hz physics step
  };
  var clamp2 = (v, m, M) => Math.max(m, Math.min(M, v));
  var rng = (a, b) => a + Math.random() * (b - a);
  var easeOut = (t) => 1 - (1 - t) * (1 - t);
  var easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  // js/engine/storage.js
  var StorageSystem = class {
    constructor() {
      this.key = "dharmyudh_save_v1";
      this.data = this.getInitialData();
      this.load();
    }
    getInitialData() {
      return {
        settings: {
          volumeMaster: 0.35,
          volumeMusic: 0.1,
          volumeSfx: 0.5,
          graphicsQuality: "high",
          // 'low', 'medium', 'high', 'ultra'
          screenShakeEnabled: false,
          particleDensity: 1,
          controlsMode: "classic",
          // 'classic', 'modern'
          keyBindings: {
            // Player 1 Defaults
            "MoveLeft": "a",
            "MoveRight": "d",
            "Jump": "w",
            "Dodge": "s",
            "AttackLight": "j",
            "AttackHeavy": "k",
            "Special": "l",
            "Block": "Shift",
            // Player 2 Defaults (Local Versus)
            "P2MoveLeft": "ArrowLeft",
            "P2MoveRight": "ArrowRight",
            "P2Jump": "ArrowUp",
            "P2Dodge": "ArrowDown",
            "P2AttackLight": "1",
            "P2AttackHeavy": "2",
            "P2Special": "3",
            "P2Block": "0"
          }
        },
        progression: {
          xp: 0,
          level: 1,
          dharmaPoints: 0,
          unlocks: {
            characters: ["arjuna", "bhima", "karna", "duryodhana", "nakula", "yudhishthira"],
            // Default roster unlocked
            lockedCharacters: ["abhimanyu", "ashwatthama", "draupadi", "bhishma"],
            // Locked by default
            stages: ["kurukshetra", "indraprastha", "hastinapura"],
            // Default stages
            lockedStages: ["celestial_realm", "forest_of_dharma", "bridge_of_lanka"],
            // Locked stages
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
              bhishma: [0]
            }
          },
          achievements: [],
          characterStats: {},
          // Matches played, won, etc. per character
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
          this.data = this.deepMerge(this.getInitialData(), parsed);
        } else {
          this.save();
        }
      } catch (e) {
        console.error("StorageSystem load failed, using defaults:", e);
        this.data = this.getInitialData();
      }
    }
    save() {
      try {
        localStorage.setItem(this.key, JSON.stringify(this.data));
      } catch (e) {
        console.error("StorageSystem save failed:", e);
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
    getSettings() {
      return this.data.settings;
    }
    saveSettings(settings) {
      this.data.settings = this.deepMerge(this.data.settings, settings);
      this.save();
    }
    getProgression() {
      return this.data.progression;
    }
    addXP(amount) {
      const prog = this.data.progression;
      prog.xp += amount;
      let xpNeeded = prog.level * 1e3;
      let leveledUp = false;
      while (prog.xp >= xpNeeded) {
        prog.xp -= xpNeeded;
        prog.level++;
        xpNeeded = prog.level * 1e3;
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
        unlocks.lockedCharacters = unlocks.lockedCharacters.filter((id) => id !== charId);
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
        unlocks.lockedStages = unlocks.lockedStages.filter((id) => id !== stageId);
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
  };

  // js/engine/audio.js
  var AudioEngine = class {
    constructor(storage) {
      this.storage = storage;
      this.ctx = null;
      this.masterGain = null;
      this.musicGain = null;
      this.sfxGain = null;
      this.initialized = false;
      this.musicPlaying = false;
      this.musicOscs = [];
      this.musicIntensity = 0;
      this.pulseInterval = null;
      this.bpm = 135;
    }
    init() {
      if (this.initialized) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
          console.warn("Web Audio API not supported in this browser.");
          return;
        }
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.updateVolumes();
        this.initialized = true;
      } catch (e) {
        console.warn("AudioEngine initialization failed:", e);
      }
    }
    speakAnnouncer(text) {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1.1;
        utter.pitch = 0.85;
        utter.volume = 0.9;
        window.speechSynthesis.speak(utter);
      } catch (e) {
        console.warn("Speech synthesis error:", e);
      }
    }
    ensureInit() {
      if (!this.initialized) this.init();
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }
    updateVolumes() {
      if (!this.masterGain) return;
      const settings = this.storage.getSettings();
      this.masterGain.gain.value = settings.volumeMaster;
      this.musicGain.gain.value = settings.volumeMusic;
      this.sfxGain.gain.value = settings.volumeSfx;
    }
    playSfx(type, pitch = 1, vol = 1, panX = 0) {
      this.ensureInit();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      if (panner) {
        panner.pan.setValueAtTime(clamp2(panX, -1, 1), now);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.sfxGain);
      } else {
        osc.connect(gain);
        gain.connect(this.sfxGain);
      }
      const bv = vol * 0.3;
      switch (type) {
        case "hit":
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(260 * pitch, now);
          osc.frequency.exponentialRampToValueAtTime(60 * pitch, now + 0.08);
          gain.gain.setValueAtTime(bv, now);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          this._noise(now, 0.05, bv * 0.5, panX);
          break;
        case "heavy":
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(150 * pitch, now);
          osc.frequency.exponentialRampToValueAtTime(25 * pitch, now + 0.18);
          gain.gain.setValueAtTime(bv * 1.6, now);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
          this._noise(now, 0.12, bv, panX);
          break;
        case "special":
          osc.type = "square";
          osc.frequency.setValueAtTime(400 * pitch, now);
          osc.frequency.exponentialRampToValueAtTime(1200 * pitch, now + 0.15);
          osc.frequency.exponentialRampToValueAtTime(60 * pitch, now + 0.45);
          gain.gain.setValueAtTime(bv * 1.5, now);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
          const o2 = this.ctx.createOscillator();
          const g2 = this.ctx.createGain();
          if (panner) {
            o2.connect(g2);
            g2.connect(panner);
          } else {
            o2.connect(g2);
            g2.connect(this.sfxGain);
          }
          o2.type = "sine";
          o2.frequency.setValueAtTime(600 * pitch, now);
          o2.frequency.exponentialRampToValueAtTime(2e3 * pitch, now + 0.1);
          g2.gain.setValueAtTime(bv * 0.6, now);
          g2.gain.exponentialRampToValueAtTime(1e-3, now + 0.35);
          o2.start(now);
          o2.stop(now + 0.35);
          break;
        case "block":
          osc.type = "triangle";
          osc.frequency.setValueAtTime(180 * pitch, now);
          osc.frequency.exponentialRampToValueAtTime(40 * pitch, now + 0.05);
          gain.gain.setValueAtTime(bv * 0.4, now);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.07);
          osc.start(now);
          osc.stop(now + 0.07);
          break;
        case "death":
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(400 * pitch, now);
          osc.frequency.exponentialRampToValueAtTime(10 * pitch, now + 1.2);
          gain.gain.setValueAtTime(bv * 1.3, now);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + 1.2);
          osc.start(now);
          osc.stop(now + 1.2);
          break;
        case "select":
          osc.type = "sine";
          osc.frequency.setValueAtTime(500 * pitch, now);
          osc.frequency.setValueAtTime(720 * pitch, now + 0.06);
          gain.gain.setValueAtTime(bv * 0.4, now);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        case "win":
          [440, 494, 554, 659, 740].forEach((f, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.connect(g);
            g.connect(this.sfxGain);
            o.type = "sine";
            o.frequency.setValueAtTime(f, now + i * 0.08);
            g.gain.setValueAtTime(bv * 0.6, now + i * 0.08);
            g.gain.exponentialRampToValueAtTime(1e-3, now + i * 0.08 + 0.3);
            o.start(now + i * 0.08);
            o.stop(now + i * 0.08 + 0.3);
          });
          break;
        case "combo":
          osc.type = "square";
          osc.frequency.setValueAtTime(400 * pitch, now);
          osc.frequency.exponentialRampToValueAtTime(1500 * pitch, now + 0.12);
          gain.gain.setValueAtTime(bv * 0.3, now);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.14);
          osc.start(now);
          osc.stop(now + 0.14);
          break;
        case "ko":
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(700, now);
          osc.frequency.exponentialRampToValueAtTime(20, now + 1.5);
          gain.gain.setValueAtTime(bv * 1.6, now);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + 1.5);
          osc.start(now);
          osc.stop(now + 1.5);
          break;
        case "jump":
          osc.type = "sine";
          osc.frequency.setValueAtTime(180 * pitch, now);
          osc.frequency.exponentialRampToValueAtTime(550 * pitch, now + 0.12);
          gain.gain.setValueAtTime(bv * 0.3, now);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.14);
          osc.start(now);
          osc.stop(now + 0.14);
          break;
        case "dodge":
          osc.type = "triangle";
          osc.frequency.setValueAtTime(500 * pitch, now);
          osc.frequency.exponentialRampToValueAtTime(900 * pitch, now + 0.06);
          gain.gain.setValueAtTime(bv * 0.25, now);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        case "land":
          osc.type = "triangle";
          osc.frequency.setValueAtTime(80 * pitch, now);
          osc.frequency.exponentialRampToValueAtTime(30 * pitch, now + 0.08);
          gain.gain.setValueAtTime(bv * 0.3, now);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        case "clash":
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(600 * pitch, now);
          osc.frequency.exponentialRampToValueAtTime(100 * pitch, now + 0.15);
          gain.gain.setValueAtTime(bv * 1.8, now);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          this._noise(now, 0.08, bv * 0.8, panX);
          break;
        default:
          osc.disconnect();
          gain.disconnect();
          break;
      }
    }
    _noise(now, dur, vol, panX = 0) {
      if (!this.ctx) return;
      const sz = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, sz, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < sz; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sz * 0.3));
      }
      const s = this.ctx.createBufferSource();
      s.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(1e-3, now + dur);
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      if (panner) {
        panner.pan.setValueAtTime(clamp2(panX, -1, 1), now);
        s.connect(g);
        g.connect(panner);
        panner.connect(this.sfxGain);
      } else {
        s.connect(g);
        g.connect(this.sfxGain);
      }
      s.start(now);
    }
    startMusic(intensity = 0) {
      if (this.musicPlaying || !this.ctx) return;
      this.musicPlaying = true;
      this.musicIntensity = intensity;
      this.ensureInit();
      const now = this.ctx.currentTime;
      const baseFreq = 110;
      const d1 = this.ctx.createOscillator();
      const g1 = this.ctx.createGain();
      d1.type = "sawtooth";
      d1.frequency.value = baseFreq;
      const filter1 = this.ctx.createBiquadFilter();
      filter1.type = "lowpass";
      filter1.frequency.setValueAtTime(250, now);
      d1.connect(filter1);
      filter1.connect(g1);
      g1.connect(this.musicGain);
      g1.gain.setValueAtTime(0.04, now);
      d1.start(now);
      this.musicOscs.push(d1);
      const d2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      d2.type = "sine";
      d2.frequency.value = baseFreq * 1.5;
      d2.connect(g2);
      g2.connect(this.musicGain);
      g2.gain.setValueAtTime(0.03, now);
      d2.start(now);
      this.musicOscs.push(d2);
      const rhythmNode = this.ctx.createOscillator();
      const rhythmGain = this.ctx.createGain();
      rhythmNode.type = "triangle";
      rhythmNode.frequency.setValueAtTime(baseFreq * 2, now);
      rhythmNode.connect(rhythmGain);
      rhythmGain.connect(this.musicGain);
      rhythmGain.gain.setValueAtTime(0, now);
      rhythmNode.start(now);
      this.musicOscs.push(rhythmNode);
      const stepMs = 60 / this.bpm * 1e3 / 2;
      let stepCount = 0;
      const playBeat = () => {
        if (!this.musicPlaying) return;
        const t = this.ctx.currentTime;
        const vol = 0.03 + this.musicIntensity * 0.08;
        const isAccent = stepCount % 8 === 0 || stepCount % 8 === 3 || stepCount % 8 === 6;
        const currentVol = isAccent ? vol * 1.4 : vol * 0.7;
        if (stepCount % 4 === 0) {
          rhythmNode.frequency.setValueAtTime(70, t);
          rhythmNode.frequency.exponentialRampToValueAtTime(115, t + 0.15);
        } else {
          rhythmNode.frequency.setValueAtTime(baseFreq * (isAccent ? 3 : 2), t);
        }
        rhythmGain.gain.setValueAtTime(currentVol, t);
        rhythmGain.gain.exponentialRampToValueAtTime(1e-3, t + (isAccent ? 0.18 : 0.08));
        if (this.musicIntensity > 0.4 && stepCount % 16 === 12) {
          this.playMelodicHit();
        }
        stepCount++;
      };
      this.pulseInterval = setInterval(playBeat, stepMs);
    }
    playMelodicHit() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [220, 246.94, 277.18, 329.63, 369.99, 440];
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const sitarOsc = this.ctx.createOscillator();
      const sitarGain = this.ctx.createGain();
      sitarOsc.type = "sawtooth";
      sitarOsc.frequency.setValueAtTime(freq, now);
      sitarGain.gain.setValueAtTime(0.02 * this.musicIntensity, now);
      sitarGain.gain.exponentialRampToValueAtTime(1e-4, now + 0.4);
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1500, now);
      sitarOsc.connect(filter);
      filter.connect(sitarGain);
      sitarGain.connect(this.musicGain);
      sitarOsc.start(now);
      sitarOsc.stop(now + 0.5);
    }
    setMusicIntensity(v) {
      this.musicIntensity = clamp2(v, 0, 1);
      this.updateVolumes();
    }
    stopMusic() {
      this.musicPlaying = false;
      if (this.pulseInterval) {
        clearInterval(this.pulseInterval);
        this.pulseInterval = null;
      }
      this.musicOscs.forEach((o) => {
        try {
          o.stop();
        } catch (e) {
        }
      });
      this.musicOscs = [];
    }
  };

  // js/engine/input.js
  var InputSystem = class {
    constructor(storage) {
      this.storage = storage;
      this.keys = {};
      this.keyJustPressed = {};
      this.inputBuffer = [];
      this.maxBufferFrames = 6;
      this.gamepads = [];
      this.mouseClicked = false;
      this.mousePos = { x: 0, y: 0 };
      this.bindKeyboard();
      this.bindMouseAndTouch();
      this.bindGamepads();
      this.isMobile = this.detectMobile();
      this.bindTouchControls();
    }
    bindKeyboard() {
      window.addEventListener("keydown", (e) => {
        const key = e.key;
        if (!this.keys[key]) {
          this.keyJustPressed[key] = true;
          this.addToBuffer(key, "press");
        }
        this.keys[key] = true;
      });
      window.addEventListener("keyup", (e) => {
        const key = e.key;
        this.keys[key] = false;
        this.addToBuffer(key, "release");
      });
    }
    bindMouseAndTouch() {
      window.addEventListener("mousedown", (e) => {
        this.mouseClicked = true;
        this.updateMousePos(e);
      });
      window.addEventListener("touchstart", (e) => {
        this.mouseClicked = true;
        if (e.touches && e.touches[0]) {
          this.updateMousePos(e.touches[0]);
        }
      }, { passive: true });
    }
    updateMousePos(e) {
      const canvas = document.getElementById("gameCanvas");
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      this.mousePos.x = (e.clientX - rect.left) / rect.width * 1280;
      this.mousePos.y = (e.clientY - rect.top) / rect.height * 720;
    }
    bindGamepads() {
      window.addEventListener("gamepadconnected", (e) => {
        console.log("Gamepad connected:", e.gamepad.id);
        this.scanGamepads();
      });
      window.addEventListener("gamepaddisconnected", (e) => {
        console.log("Gamepad disconnected:", e.gamepad.id);
        this.scanGamepads();
      });
    }
    scanGamepads() {
      this.gamepads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
    }
    detectMobile() {
      return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0 && window.innerWidth < 1024;
    }
    bindTouchControls() {
      const touchControls = document.getElementById("touch-controls");
      if (!touchControls) return;
      touchControls.setAttribute("aria-hidden", "true");
      const handleStart = (action) => {
        const bindings = this.storage.getSettings().keyBindings;
        const map = {
          "up": bindings.Jump,
          "down": bindings.Dodge,
          "left": bindings.MoveLeft,
          "right": bindings.MoveRight,
          "light": bindings.AttackLight,
          "heavy": bindings.AttackHeavy,
          "special": bindings.Special,
          "block": bindings.Block
        };
        const key = map[action];
        if (!key) return;
        const isJustPress = action === "light" || action === "heavy" || action === "special" || action === "up" || action === "down";
        if (isJustPress) {
          this["keyJustPressed"][key] = true;
          this.keys[key] = true;
          this.addToBuffer(key, "press");
        } else {
          this.keys[key] = true;
        }
      };
      const handleEnd = (action) => {
        const bindings = this.storage.getSettings().keyBindings;
        const map = {
          "up": bindings.Jump,
          "down": bindings.Dodge,
          "left": bindings.MoveLeft,
          "right": bindings.MoveRight,
          "light": bindings.AttackLight,
          "heavy": bindings.AttackHeavy,
          "special": bindings.Special,
          "block": bindings.Block
        };
        const key = map[action];
        if (key) {
          this.keys[key] = false;
        }
      };
      const buttons = touchControls.querySelectorAll("[data-touch]");
      buttons.forEach((btn) => {
        const action = btn.getAttribute("data-touch");
        if (!action) return;
        btn.addEventListener("touchstart", (e) => {
          e.preventDefault();
          btn.classList.add("active");
          handleStart(action);
        }, { passive: false });
        btn.addEventListener("touchend", (e) => {
          e.preventDefault();
          btn.classList.remove("active");
          handleEnd(action);
        }, { passive: false });
        btn.addEventListener("touchcancel", () => {
          btn.classList.remove("active");
          handleEnd(action);
        });
      });
    }
    setTouchControlsVisible(visible) {
      const el = document.getElementById("touch-controls");
      if (!el) return;
      if (visible && this.isMobile) {
        el.setAttribute("aria-hidden", "false");
      } else {
        el.setAttribute("aria-hidden", "true");
      }
    }
    update() {
      this.scanGamepads();
      this.updateGamepadInputs();
      this.pruneBuffer();
    }
    clearJustPressed() {
      this.keyJustPressed = {};
      this.mouseClicked = false;
    }
    addToBuffer(key, action) {
      this.inputBuffer.push({
        key,
        action,
        time: performance.now(),
        frame: this.inputBuffer.length
      });
      if (this.inputBuffer.length > 30) {
        this.inputBuffer.shift();
      }
    }
    pruneBuffer() {
      const now = performance.now();
      this.inputBuffer = this.inputBuffer.filter((entry) => now - entry.time < 500);
    }
    // Check if a sequence of keys was entered recently
    checkCombo(sequence, windowMs = 400) {
      if (sequence.length === 0) return false;
      const now = performance.now();
      let seqIdx = sequence.length - 1;
      for (let i = this.inputBuffer.length - 1; i >= 0; i--) {
        const entry = this.inputBuffer[i];
        if (now - entry.time > windowMs) break;
        const target = sequence[seqIdx];
        const matches = typeof target === "string" ? entry.key.toLowerCase() === target.toLowerCase() && entry.action === "press" : false;
        if (matches) {
          seqIdx--;
          if (seqIdx < 0) return true;
        }
      }
      return false;
    }
    updateGamepadInputs() {
      for (const gp of this.gamepads) {
        if (!gp) continue;
      }
    }
    isActionPressed(action, playerNum = 1) {
      const bindings = this.storage.getSettings().keyBindings;
      const key = playerNum === 1 ? bindings[action] : bindings["P2" + action];
      if (!key) return false;
      if (key.length === 1 && key.match(/[a-z]/i)) {
        return this.keys[key.toLowerCase()] || this.keys[key.toUpperCase()];
      }
      return this.keys[key];
    }
    isActionJustPressed(action, playerNum = 1) {
      const bindings = this.storage.getSettings().keyBindings;
      const key = playerNum === 1 ? bindings[action] : bindings["P2" + action];
      if (!key) return false;
      if (key.length === 1 && key.match(/[a-z]/i)) {
        return this.keyJustPressed[key.toLowerCase()] || this.keyJustPressed[key.toUpperCase()];
      }
      return this.keyJustPressed[key];
    }
    getHorizontalAxis(playerNum = 1) {
      let axis = 0;
      if (this.isActionPressed("MoveLeft", playerNum)) axis -= 1;
      if (this.isActionPressed("MoveRight", playerNum)) axis += 1;
      const gp = this.gamepads[playerNum - 1];
      if (gp) {
        if (gp.axes && gp.axes[0] !== void 0) {
          const deadzone = 0.25;
          const rawAxis = gp.axes[0];
          if (Math.abs(rawAxis) > deadzone) {
            axis += rawAxis;
          }
        }
        if (gp.buttons) {
          if (gp.buttons[14] && gp.buttons[14].pressed) axis -= 1;
          if (gp.buttons[15] && gp.buttons[15].pressed) axis += 1;
        }
      }
      return axis;
    }
    getVerticalAxis(playerNum = 1) {
      let axis = 0;
      if (this.isActionPressed("Jump", playerNum)) axis -= 1;
      if (this.isActionPressed("Dodge", playerNum)) axis += 1;
      const gp = this.gamepads[playerNum - 1];
      if (gp) {
        if (gp.axes && gp.axes[1] !== void 0) {
          const deadzone = 0.25;
          const rawAxis = gp.axes[1];
          if (Math.abs(rawAxis) > deadzone) {
            axis += rawAxis;
          }
        }
        if (gp.buttons) {
          if (gp.buttons[12] && gp.buttons[12].pressed) axis -= 1;
          if (gp.buttons[13] && gp.buttons[13].pressed) axis += 1;
        }
      }
      return axis;
    }
  };

  // js/engine/animation.js
  var AnimationEngine = class {
    constructor() {
      this.easings = {
        linear: (t) => t,
        easeOut,
        easeInOut,
        easeIn: (t) => t * t,
        elasticOut: (t) => {
          const p = 0.3;
          return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
        },
        bounceOut: (t) => {
          const n1 = 7.5625;
          const d1 = 2.75;
          if (t < 1 / d1) return n1 * t * t;
          if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
          if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
          return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
      };
    }
    // Generate bone/joint offset coordinates dynamically
    // based on character state, elapsed frames, and speed coefficients
    getPose(state, time, entity = {}) {
      const pose = {
        bodyY: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        limbs: {
          leftLeg: 0,
          rightLeg: 0,
          leftArm: 0,
          rightArm: 0,
          weaponAngle: 0,
          headAngle: 0
        }
      };
      switch (state) {
        case "idle": {
          const f = time * 0.05;
          pose.bodyY = Math.sin(f) * 2.5;
          pose.limbs.headAngle = Math.sin(f) * 0.02;
          pose.limbs.leftArm = Math.sin(f) * 0.05;
          pose.limbs.rightArm = -Math.sin(f) * 0.05;
          pose.limbs.leftLeg = 0.18;
          pose.limbs.rightLeg = -0.06;
          pose.limbs.weaponAngle = Math.sin(f * 0.8) * 0.04;
          break;
        }
        case "walk": {
          const speed = entity.speed || 150;
          const speedMultiplier = speed / 150;
          const f = time * 0.08 * speedMultiplier;
          pose.bodyY = Math.abs(Math.sin(f)) * -1.5;
          pose.limbs.leftLeg = Math.sin(f) * 0.45;
          pose.limbs.rightLeg = -Math.sin(f) * 0.45;
          pose.limbs.leftArm = -Math.sin(f) * 0.3;
          pose.limbs.rightArm = Math.sin(f) * 0.3;
          pose.rotation = 0.05 * (entity.facing || 1);
          break;
        }
        case "jump": {
          const vy = entity.velocityY || 0;
          pose.bodyY = vy * 0.02;
          pose.limbs.leftLeg = 0.15;
          pose.limbs.rightLeg = -0.1;
          pose.limbs.leftArm = -0.3;
          pose.limbs.rightArm = 0.3;
          if (vy < 0) {
            pose.scaleX = 0.92;
            pose.scaleY = 1.1;
          } else {
            pose.scaleX = 0.95;
            pose.scaleY = 1.05;
          }
          break;
        }
        case "attack": {
          const attackFrame = entity.attackFrame || 0;
          const attackType = entity.attackType || "light";
          const dur = attackType === "heavy" ? 8 : 5;
          let progress = 0;
          let windUp = 0;
          if (attackFrame <= 2) {
            windUp = attackFrame / 2;
          } else {
            progress = (attackFrame - 2) / (dur - 2);
          }
          const eased = this.easings.easeOut(progress);
          const anticipation = this.easings.easeOut(windUp);
          if (progress === 0) {
            pose.rotation = anticipation * -0.15 * (entity.facing || 1);
            pose.limbs.weaponAngle = anticipation * -Math.PI * 0.15;
            pose.limbs.rightArm = anticipation * -0.3;
            pose.bodyY = anticipation * 5;
            pose.limbs.leftLeg = anticipation * 0.25;
            pose.limbs.rightLeg = anticipation * -0.15;
          } else {
            pose.limbs.weaponAngle = eased * Math.PI * 0.8;
            pose.rotation = eased * 0.25 * (entity.facing || 1);
            pose.limbs.leftLeg = 0.38 * (1 - eased);
            pose.limbs.rightLeg = -0.45 * eased;
            if (attackType === "heavy") {
              pose.scaleX = 1.15;
              pose.scaleY = 0.85;
              pose.limbs.rightArm = eased * Math.PI * 0.6;
            } else {
              pose.scaleX = 1.05;
              pose.scaleY = 0.95;
              pose.limbs.rightArm = eased * Math.PI * 0.45;
            }
          }
          break;
        }
        case "hitstun": {
          const progress = Math.min(1, (entity.stateTimer || 0) / 0.35);
          const impact = 1 - this.easings.easeOut(progress);
          pose.bodyY = impact * 15;
          pose.rotation = impact * -0.35 * (entity.facing || 1);
          pose.scaleX = 1 + impact * 0.1;
          pose.scaleY = 1 - impact * 0.1;
          pose.limbs.leftArm = impact * -0.7;
          pose.limbs.rightArm = impact * -0.5;
          pose.limbs.headAngle = impact * -0.4 * (entity.facing || 1);
          break;
        }
        case "knockdown": {
          const t = clamp(entity.stateTimer || 0, 0, 1);
          pose.bodyY = -t * 60;
          pose.rotation = -t * 0.8 * Math.PI * (entity.facing || 1);
          pose.alpha = 1 - t;
          pose.limbs.leftLeg = 0.2;
          pose.limbs.rightLeg = 0.2;
          break;
        }
        case "block": {
          pose.scaleX = 0.95;
          pose.scaleY = 0.9;
          pose.limbs.leftArm = 0.6;
          pose.limbs.rightArm = 0.2;
          pose.limbs.leftLeg = 0.35;
          pose.limbs.rightLeg = -0.22;
          break;
        }
        default:
          break;
      }
      return pose;
    }
  };

  // js/engine/webgl_renderer.js
  var WebGLRendererSystem = class {
    constructor(canvas, storage) {
      this.canvas = canvas;
      this.storage = storage;
      this.isThreeAvailable = typeof window !== "undefined" && !!window.THREE;
      this.width = CONFIG2.W;
      this.height = CONFIG2.H;
      this.cameraX = 0;
      this.cameraY = 0;
      this.targetCameraX = 0;
      this.targetCameraY = 0;
      this.cameraZoom = 1;
      this.targetZoom = 1;
      this.shakeIntensity = 0;
      this.shakeDecay = 0.88;
      this.screenShakeEnabled = true;
      if (this.isThreeAvailable) {
        this.initThreeScene();
      } else {
        this.ctx = canvas.getContext("2d");
      }
    }
    initThreeScene() {
      const THREE = window.THREE;
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(657940);
      this.scene.fog = new THREE.FogExp2(657940, 8e-4);
      this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 3e3);
      this.camera.position.set(0, 180, 520);
      this.camera.lookAt(0, 100, 0);
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
      });
      this.renderer.setSize(this.width, this.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.ambientLight = new THREE.AmbientLight(14411519, 0.65);
      this.scene.add(this.ambientLight);
      this.sunLight = new THREE.DirectionalLight(16771757, 1.3);
      this.sunLight.position.set(250, 450, 300);
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 2048;
      this.sunLight.shadow.mapSize.height = 2048;
      this.sunLight.shadow.camera.near = 10;
      this.sunLight.shadow.camera.far = 1200;
      this.sunLight.shadow.camera.left = -700;
      this.sunLight.shadow.camera.right = 700;
      this.sunLight.shadow.camera.top = 500;
      this.sunLight.shadow.camera.bottom = -200;
      this.scene.add(this.sunLight);
      this.rimLight = new THREE.DirectionalLight(16742144, 0.7);
      this.rimLight.position.set(-300, 200, -200);
      this.scene.add(this.rimLight);
      this.build3DArena();
    }
    build3DArena() {
      const THREE = window.THREE;
      const groundGeo = new THREE.PlaneGeometry(3e3, 1500);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 4008735,
        roughness: 0.85,
        metalness: 0.1
      });
      this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
      this.groundMesh.rotation.x = -Math.PI / 2;
      this.groundMesh.position.y = 0;
      this.groundMesh.receiveShadow = true;
      this.scene.add(this.groundMesh);
      const pillarGeo = new THREE.CylinderGeometry(20, 25, 220, 12);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 6049089,
        roughness: 0.7,
        metalness: 0.2
      });
      for (let i = -4; i <= 4; i++) {
        if (i === 0) continue;
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(i * 280, 110, -350);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        this.scene.add(pillar);
      }
    }
    resize(container) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
      if (this.isThreeAvailable && this.renderer) {
        this.renderer.setSize(rect.width, rect.height);
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
      } else if (this.ctx) {
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
      }
    }
    update(dt, player, enemy) {
      if (player && enemy) {
        const midX = (player.x + enemy.x) / 2;
        const midY = (player.y + enemy.y) / 2;
        this.targetCameraX = midX - CONFIG2.W / 2;
        this.targetCameraY = midY - CONFIG2.H * 0.7;
        const distance = Math.abs(player.x - enemy.x);
        const zoomRatio = clamp2(CONFIG2.W / (distance + 400), 0.65, 1.25);
        this.targetZoom = zoomRatio;
      }
      this.cameraX += (this.targetCameraX - this.cameraX) * 0.08;
      this.cameraY += (this.targetCameraY - this.cameraY) * 0.08;
      this.cameraZoom += (this.targetZoom - this.cameraZoom) * 0.08;
      if (this.shakeIntensity > 0.1) {
        this.shakeIntensity *= Math.pow(this.shakeDecay, dt * 60);
      } else {
        this.shakeIntensity = 0;
      }
      if (this.isThreeAvailable && this.camera) {
        const shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
        const shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
        const targetZ = 520 / this.cameraZoom;
        this.camera.position.x = this.cameraX + CONFIG2.W / 2 - 640 + shakeX;
        this.camera.position.y = 180 - this.cameraY * 0.3 + shakeY;
        this.camera.position.z = targetZ;
        this.camera.lookAt(this.cameraX + CONFIG2.W / 2 - 640, 90, 0);
      }
    }
    triggerShake(intensity) {
      if (!this.screenShakeEnabled) return;
      this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }
    drawScreenFlash(alpha, color = "#ffffff") {
      if (alpha <= 0.01) return;
      if (this.ctx) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = clamp2(alpha, 0, 1);
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.restore();
      }
    }
    begin() {
      if (this.isThreeAvailable && this.renderer) {
      } else if (this.ctx) {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.translate(this.width / 2, this.height * 0.6);
        this.ctx.scale(this.cameraZoom, this.cameraZoom);
        this.ctx.translate(this.cameraX, this.cameraY);
      }
    }
    end() {
      if (this.isThreeAvailable && this.renderer) {
        this.renderer.render(this.scene, this.camera);
      } else if (this.ctx) {
        this.ctx.restore();
      }
    }
  };

  // js/vfx/particles.js
  var Particle = class {
    constructor() {
      this.active = false;
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.gravity = 0;
      this.drag = 0.97;
      this.life = 0;
      this.maxLife = 0;
      this.size = 0;
      this.color = "#ff6b35";
      this.type = "spark";
      this.alpha = 1;
      this.rotation = 0;
      this.rotSpeed = 0;
      this.text = "";
      this.trail = [];
      this.maxTrail = 6;
    }
    init(x, y, cfg = {}) {
      this.active = true;
      this.x = x;
      this.y = y;
      this.type = cfg.type || "spark";
      this.life = cfg.life || 1;
      this.maxLife = this.life;
      this.size = cfg.size || 4;
      this.color = cfg.color || "#ff6b35";
      this.gravity = cfg.gravity || 0;
      this.drag = cfg.drag || 0.97;
      this.rotation = rng(0, Math.PI * 2);
      this.rotSpeed = cfg.rotSpeed || rng(-5, 5);
      this.text = cfg.text || "";
      this.alpha = 1;
      this.trail = [];
      this.maxTrail = cfg.trail ? cfg.maxTrail || 6 : 0;
      const angle = cfg.angle !== void 0 ? cfg.angle : rng(0, Math.PI * 2);
      const speed = cfg.speed !== void 0 ? cfg.speed : rng(50, 200);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
    }
    update(dt) {
      if (!this.active) return;
      if (this.maxTrail > 0) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) {
          this.trail.shift();
        }
      }
      this.vx *= this.drag;
      this.vy *= this.drag;
      this.vy += this.gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.rotation += this.rotSpeed * dt;
      this.life -= dt;
      this.alpha = clamp2(this.life / this.maxLife, 0, 1);
      if (this.life <= 0) {
        this.active = false;
      }
    }
    draw(ctx) {
      if (!this.active) return;
      ctx.save();
      ctx.globalAlpha = this.alpha;
      if (this.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
          ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size * 0.4;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      switch (this.type) {
        case "spark":
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(0, 0, this.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "smoke":
          ctx.fillStyle = this.color;
          ctx.beginPath();
          const sizeMult = 1 + (1 - this.alpha) * 1.5;
          ctx.arc(0, 0, this.size * sizeMult, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "ring":
          ctx.strokeStyle = this.color;
          ctx.lineWidth = this.size * 0.25;
          ctx.beginPath();
          const radius = this.size * (2 - this.alpha);
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case "shard":
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.moveTo(-this.size, 0);
          ctx.lineTo(0, -this.size * 1.5);
          ctx.lineTo(this.size, 0);
          ctx.lineTo(0, this.size * 1.5);
          ctx.closePath();
          ctx.fill();
          break;
        case "aura":
          const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
          radGrad.addColorStop(0, this.color);
          radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(0, 0, this.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "text":
          ctx.rotate(-this.rotation);
          ctx.fillStyle = this.color;
          ctx.font = `bold ${this.size}px Rajdhani`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 4;
          ctx.strokeText(this.text, 0, 0);
          ctx.fillText(this.text, 0, 0);
          break;
      }
      ctx.restore();
    }
  };
  var ParticleSystem = class {
    constructor(maxParticles = 500) {
      this.maxParticles = maxParticles;
      this.pool = [];
      for (let i = 0; i < maxParticles; i++) {
        this.pool.push(new Particle());
      }
    }
    // Retrieve an inactive particle from the pool
    spawn(x, y, cfg = {}) {
      const particle = this.pool.find((p) => !p.active);
      if (particle) {
        particle.init(x, y, cfg);
        return particle;
      }
      return null;
    }
    update(dt) {
      for (let i = 0; i < this.maxParticles; i++) {
        if (this.pool[i].active) {
          this.pool[i].update(dt);
        }
      }
    }
    draw(ctx) {
      for (let i = 0; i < this.maxParticles; i++) {
        if (this.pool[i].active) {
          this.pool[i].draw(ctx);
        }
      }
    }
    clear() {
      for (let i = 0; i < this.maxParticles; i++) {
        this.pool[i].active = false;
      }
    }
    // Pre-configured burst helper algorithms
    spawnHitSparks(x, y, color = "#ff8f00") {
      for (let i = 0; i < 15; i++) {
        this.spawn(x, y, {
          type: "spark",
          color,
          life: rng(0.2, 0.5),
          size: rng(2, 5),
          speed: rng(100, 250),
          drag: 0.95,
          trail: true,
          maxTrail: 4
        });
      }
      for (let i = 0; i < 3; i++) {
        this.spawn(x, y, {
          type: "aura",
          color,
          life: rng(0.15, 0.3),
          size: rng(20, 45),
          speed: rng(10, 40)
        });
      }
      this.spawn(x, y, {
        type: "ring",
        color: "#ffffff",
        life: 0.25,
        size: 30,
        speed: 0
      });
    }
    spawnHeavyHitSparks(x, y, color = "#e65100") {
      for (let i = 0; i < 25; i++) {
        this.spawn(x, y, {
          type: "shard",
          color,
          life: rng(0.3, 0.7),
          size: rng(3, 7),
          speed: rng(200, 400),
          drag: 0.94,
          gravity: 300,
          trail: true,
          maxTrail: 6
        });
      }
      for (let i = 0; i < 2; i++) {
        this.spawn(x, y, {
          type: "ring",
          color: "#ffffff",
          life: 0.35,
          size: 50 + i * 20,
          speed: 0
        });
      }
    }
    spawnSpecialBurst(x, y, color = "#8e24aa") {
      for (let i = 0; i < 40; i++) {
        const angle = i / 40 * Math.PI * 2;
        this.spawn(x, y, {
          type: "spark",
          color,
          life: rng(0.4, 0.9),
          size: rng(3, 6),
          angle,
          speed: rng(250, 450),
          drag: 0.96,
          trail: true,
          maxTrail: 8
        });
      }
    }
    spawnFloatingText(x, y, text, color = "#ffd700") {
      this.spawn(x, y - 20, {
        type: "text",
        color,
        text,
        life: 0.8,
        size: 24,
        angle: -Math.PI / 2 + rng(-0.2, 0.2),
        // float upwards
        speed: rng(60, 100),
        drag: 0.96
      });
    }
  };

  // js/vfx/lighting.js
  var LightingSystem = class {
    constructor(game) {
      this.game = game;
      this.ambientColor = "rgba(10, 10, 20, 0.4)";
      this.lights = [];
    }
    addLight(x, y, radius, color, intensity = 1) {
      this.lights.push({ x, y, radius, color, intensity });
    }
    clearLights() {
      this.lights = [];
    }
    // Draw lighting masks on the screen
    draw(ctx) {
      const player = this.game.player;
      const enemy = this.game.enemy;
      if (player && !player.died) {
        this.drawFeetShadow(ctx, player);
      }
      if (enemy && !enemy.died) {
        this.drawFeetShadow(ctx, enemy);
      }
      if (player && player.specialActive) {
        this.drawCharacterAura(ctx, player, player.color || "#4fc3f7");
      }
      if (enemy && enemy.specialActive) {
        this.drawCharacterAura(ctx, enemy, enemy.color || "#ff5252");
      }
      this.drawPointLights(ctx);
    }
    drawFeetShadow(ctx, entity) {
      ctx.save();
      const heightAboveGround = CONFIG2.GROUND_Y - entity.y;
      const shadowScale = clamp2(1 - heightAboveGround / 250, 0.1, 1);
      const shadowAlpha = 0.5 * shadowScale;
      ctx.translate(entity.x, CONFIG2.GROUND_Y);
      ctx.scale(1 * shadowScale, 0.25 * shadowScale);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
      grad.addColorStop(0, `rgba(0, 0, 0, ${shadowAlpha})`);
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawCharacterAura(ctx, entity, color) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const timePulse = Math.sin(performance.now() * 6e-3) * 10;
      const size = 90 + timePulse;
      ctx.translate(entity.x, entity.y - 60);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      grad.addColorStop(0, color);
      grad.addColorStop(0.3, this.hexToRgba(color, 0.35));
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawPointLights(ctx) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (const light of this.lights) {
        const grad = ctx.createRadialGradient(
          light.x,
          light.y,
          0,
          light.x,
          light.y,
          light.radius
        );
        grad.addColorStop(0, this.hexToRgba(light.color, light.intensity));
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      this.clearLights();
    }
    hexToRgba(hex, alpha) {
      let c = hex.substring(1);
      if (c.length === 3) {
        c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
      }
      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  };

  // js/vfx/screen_effects.js
  var ScreenEffectsSystem = class {
    constructor(game) {
      this.game = game;
    }
    // Freeze time temporarily on hit to sell kinetic impact ("hit stop")
    triggerHitStop(type = "light") {
      let duration = 0.06;
      if (type === "heavy") duration = 0.12;
      if (type === "special") duration = 0.18;
      this.game.hitStopTimer = duration;
    }
    // Dynamic dramatic time slowdown
    triggerSlowMo(duration = 0.4) {
      this.game.slowMo = duration;
    }
    // KO dramatic screen flash
    triggerKoFlash() {
      this.game.koFlash = 1;
      this.game.renderer.triggerShake(35);
      this.triggerSlowMo(1.5);
      this.game.koFreezeTimer = 0.5;
    }
    // Render high-action overlays on canvas (e.g. speed lines when special is charging)
    draw(ctx) {
      const player = this.game.player;
      const enemy = this.game.enemy;
      const isSpecialActive = player && player.specialActive && player.specialTimer > 0.4 || enemy && enemy.specialActive && enemy.specialTimer > 0.4;
      if (isSpecialActive) {
        this.drawSpeedLines(ctx);
      }
    }
    drawSpeedLines(ctx) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1.5;
      const centerX = CONFIG2.W / 2;
      const centerY = CONFIG2.H / 2;
      const radius = 600;
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const startDist = radius + Math.random() * 200;
        const endDist = radius - Math.random() * 300;
        const sx = centerX + Math.cos(angle) * startDist;
        const sy = centerY + Math.sin(angle) * startDist;
        const ex = centerX + Math.cos(angle) * endDist;
        const ey = centerY + Math.sin(angle) * endDist;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  // js/stages/stage_renderer.js
  var StageRenderer = class {
    constructor(game) {
      this.game = game;
      this.currentStage = "kurukshetra";
      this.layers = [];
      this.weather = {
        type: "clear",
        // 'clear', 'rain', 'storm', 'mist'
        intensity: 0,
        wind: 0,
        particles: []
      };
      this.timeOfDay = 0;
      this.stageData = {};
      this.setStage(this.currentStage);
    }
    setStage(stageId) {
      this.currentStage = stageId;
      this.layers = [];
      switch (stageId) {
        case "kurukshetra":
          this.initKurukshetra();
          break;
        case "indraprastha":
          this.initIndraprastha();
          break;
        case "hastinapura":
          this.initHastinapura();
          break;
        case "celestial_realm":
          this.initCelestialRealm();
          break;
        case "forest_of_dharma":
          this.initForestOfDharma();
          break;
        case "bridge_of_lanka":
          this.initBridgeOfLanka();
          break;
      }
    }
    update(dt) {
      for (const layer of this.layers) {
        if (layer.update) layer.update(dt);
      }
      this.updateWeather(dt);
    }
    updateWeather(dt) {
      if (this.weather.type === "clear") return;
      if (this.weather.particles.length < 100 * this.weather.intensity) {
        this.weather.particles.push({
          x: Math.random() * CONFIG2.W * 1.5 - CONFIG2.W * 0.25,
          y: -10,
          speedY: 400 + Math.random() * 200,
          speedX: this.weather.wind + (Math.random() - 0.5) * 50,
          length: 10 + Math.random() * 15,
          alpha: Math.random() * 0.5
        });
      }
      for (let i = this.weather.particles.length - 1; i >= 0; i--) {
        const p = this.weather.particles[i];
        p.x += p.speedX * dt;
        p.y += p.speedY * dt;
        if (p.y > CONFIG2.H) {
          this.weather.particles.splice(i, 1);
        }
      }
    }
    draw(ctx) {
      const camX = this.game.renderer.cameraX;
      for (const layer of this.layers) {
        ctx.save();
        const offsetX = camX * layer.parallaxFactor;
        ctx.translate(offsetX, 0);
        layer.draw(ctx);
        ctx.restore();
      }
      this.drawWeather(ctx);
    }
    drawWeather(ctx) {
      if (this.weather.type === "clear") return;
      ctx.save();
      if (this.weather.type === "rain" || this.weather.type === "storm") {
        ctx.strokeStyle = "rgba(174, 194, 224, 0.4)";
        ctx.lineWidth = 1;
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
      this.weather.type = "storm";
      this.weather.intensity = 0.5;
      this.weather.wind = -50;
      this.layers.push({
        parallaxFactor: 0.1,
        draw: (ctx) => {
          const grad = ctx.createLinearGradient(0, 0, 0, CONFIG2.H);
          grad.addColorStop(0, "#100a1c");
          grad.addColorStop(0.5, "#35122c");
          grad.addColorStop(1, "#651c32");
          ctx.fillStyle = grad;
          ctx.fillRect(-CONFIG2.W, 0, CONFIG2.W * 3, CONFIG2.H);
        }
      });
      this.layers.push({
        parallaxFactor: 0.25,
        draw: (ctx) => {
          ctx.fillStyle = "#220b1e";
          ctx.beginPath();
          ctx.moveTo(-CONFIG2.W, CONFIG2.GROUND_Y);
          ctx.lineTo(-600, 250);
          ctx.lineTo(-200, 420);
          ctx.lineTo(300, 180);
          ctx.lineTo(800, 390);
          ctx.lineTo(CONFIG2.W * 2, CONFIG2.GROUND_Y);
          ctx.closePath();
          ctx.fill();
        }
      });
      let time = 0;
      this.layers.push({
        parallaxFactor: 0.5,
        update: (dt) => {
          time += dt;
        },
        draw: (ctx) => {
          ctx.fillStyle = "#421626";
          for (let x = -800; x < CONFIG2.W * 1.5; x += 400) {
            ctx.beginPath();
            ctx.moveTo(x, CONFIG2.GROUND_Y);
            ctx.lineTo(x + 100, CONFIG2.GROUND_Y - 120);
            ctx.lineTo(x + 200, CONFIG2.GROUND_Y);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#18070d";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x + 100, CONFIG2.GROUND_Y - 120);
            ctx.lineTo(x + 100, CONFIG2.GROUND_Y - 200);
            ctx.stroke();
            ctx.fillStyle = "#ff8f00";
            ctx.beginPath();
            ctx.moveTo(x + 100, CONFIG2.GROUND_Y - 200);
            const wave = Math.sin(time * 5 + x * 0.01) * 10;
            ctx.quadraticCurveTo(x + 140, CONFIG2.GROUND_Y - 210 + wave, x + 180, CONFIG2.GROUND_Y - 200);
            ctx.lineTo(x + 180, CONFIG2.GROUND_Y - 160);
            ctx.quadraticCurveTo(x + 140, CONFIG2.GROUND_Y - 170 + wave, x + 100, CONFIG2.GROUND_Y - 160);
            ctx.closePath();
            ctx.fill();
          }
        }
      });
      this.layers.push({
        parallaxFactor: 1,
        draw: (ctx) => {
          const grad = ctx.createLinearGradient(0, CONFIG2.GROUND_Y, 0, CONFIG2.H);
          grad.addColorStop(0, "#1c140d");
          grad.addColorStop(1, "#050302");
          ctx.fillStyle = grad;
          ctx.fillRect(-CONFIG2.W, CONFIG2.GROUND_Y, CONFIG2.W * 3, CONFIG2.H - CONFIG2.GROUND_Y);
          ctx.strokeStyle = "rgba(255, 143, 0, 0.08)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let x = -600; x < CONFIG2.W * 1.5; x += 150) {
            ctx.moveTo(x, CONFIG2.GROUND_Y);
            ctx.lineTo(x + 50, CONFIG2.GROUND_Y + 40);
            ctx.lineTo(x + 30, CONFIG2.GROUND_Y + 120);
          }
          ctx.stroke();
        }
      });
    }
    initIndraprastha() {
      this.weather.type = "clear";
      this.layers.push({
        parallaxFactor: 0.1,
        draw: (ctx) => {
          const grad = ctx.createLinearGradient(0, 0, 0, CONFIG2.H);
          grad.addColorStop(0, "#0c1b33");
          grad.addColorStop(0.6, "#ffd166");
          grad.addColorStop(1, "#ff8b94");
          ctx.fillStyle = grad;
          ctx.fillRect(-CONFIG2.W, 0, CONFIG2.W * 3, CONFIG2.H);
        }
      });
      this.layers.push({
        parallaxFactor: 0.4,
        draw: (ctx) => {
          ctx.fillStyle = "#825c38";
          for (let x = -800; x < CONFIG2.W * 1.5; x += 600) {
            ctx.fillRect(x, 150, 60, CONFIG2.GROUND_Y - 150);
            ctx.fillRect(x + 400, 150, 60, CONFIG2.GROUND_Y - 150);
            ctx.save();
            ctx.strokeStyle = "#dfa650";
            ctx.lineWidth = 15;
            ctx.beginPath();
            ctx.arc(x + 230, 200, 200, Math.PI, 0);
            ctx.stroke();
            ctx.restore();
          }
        }
      });
      this.layers.push({
        parallaxFactor: 1,
        draw: (ctx) => {
          const grad = ctx.createLinearGradient(0, CONFIG2.GROUND_Y, 0, CONFIG2.H);
          grad.addColorStop(0, "#e5d9c2");
          grad.addColorStop(1, "#ad9c82");
          ctx.fillStyle = grad;
          ctx.fillRect(-CONFIG2.W, CONFIG2.GROUND_Y, CONFIG2.W * 3, CONFIG2.H - CONFIG2.GROUND_Y);
          ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
          for (let x = -600; x < CONFIG2.W * 1.5; x += 250) {
            ctx.fillRect(x, CONFIG2.GROUND_Y + 10, 150, 10);
          }
        }
      });
    }
    initHastinapura() {
      this.weather.type = "clear";
      this.layers.push({
        parallaxFactor: 0.1,
        draw: (ctx) => {
          ctx.fillStyle = "#050508";
          ctx.fillRect(-CONFIG2.W, 0, CONFIG2.W * 3, CONFIG2.H);
        }
      });
      let time = 0;
      this.layers.push({
        parallaxFactor: 0.6,
        update: (dt) => {
          time += dt;
        },
        draw: (ctx) => {
          ctx.fillStyle = "#1c1b21";
          for (let x = -800; x < CONFIG2.W * 1.5; x += 300) {
            ctx.fillRect(x, 0, 45, CONFIG2.GROUND_Y);
            ctx.fillStyle = "#3c2a21";
            ctx.fillRect(x - 5, 250, 10, 30);
            const flameSize = 10 + Math.sin(time * 12 + x * 0.05) * 3;
            ctx.fillStyle = "#e65c00";
            ctx.beginPath();
            ctx.arc(x, 240, flameSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffb300";
            ctx.beginPath();
            ctx.arc(x, 243, flameSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
      this.layers.push({
        parallaxFactor: 1,
        draw: (ctx) => {
          ctx.fillStyle = "#2b2323";
          ctx.fillRect(-CONFIG2.W, CONFIG2.GROUND_Y, CONFIG2.W * 3, CONFIG2.H - CONFIG2.GROUND_Y);
          ctx.fillStyle = "#660b13";
          ctx.fillRect(-600, CONFIG2.GROUND_Y, 1200, CONFIG2.H - CONFIG2.GROUND_Y);
        }
      });
    }
    initCelestialRealm() {
      this.weather.type = "clear";
      this.layers.push({
        parallaxFactor: 0.1,
        draw: (ctx) => {
          const grad = ctx.createLinearGradient(0, 0, 0, CONFIG2.H);
          grad.addColorStop(0, "#020010");
          grad.addColorStop(0.5, "#0c0728");
          grad.addColorStop(1, "#240845");
          ctx.fillStyle = grad;
          ctx.fillRect(-CONFIG2.W, 0, CONFIG2.W * 3, CONFIG2.H);
          ctx.fillStyle = "#ffffff";
          for (let i = 0; i < 40; i++) {
            const x = i * 97 % (CONFIG2.W * 2) - CONFIG2.W;
            const y = i * 123 % 400;
            ctx.globalAlpha = 0.2 + Math.abs(Math.sin(performance.now() * 1e-3 + i));
            ctx.fillRect(x, y, 2, 2);
          }
        }
      });
      let time = 0;
      this.layers.push({
        parallaxFactor: 0.3,
        update: (dt) => {
          time += dt;
        },
        draw: (ctx) => {
          ctx.fillStyle = "rgba(156, 122, 201, 0.15)";
          for (let x = -800; x < CONFIG2.W * 1.5; x += 500) {
            const waveY = Math.sin(time * 0.5 + x * 2e-3) * 20;
            ctx.beginPath();
            ctx.arc(x, 300 + waveY, 150, 0, Math.PI * 2);
            ctx.arc(x + 100, 270 + waveY, 120, 0, Math.PI * 2);
            ctx.arc(x - 100, 310 + waveY, 100, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
      this.layers.push({
        parallaxFactor: 1,
        draw: (ctx) => {
          const grad = ctx.createLinearGradient(0, CONFIG2.GROUND_Y, 0, CONFIG2.H);
          grad.addColorStop(0, "#e5ba4f");
          grad.addColorStop(0.5, "#ab7c1a");
          grad.addColorStop(1, "#473103");
          ctx.fillStyle = grad;
          ctx.fillRect(-CONFIG2.W, CONFIG2.GROUND_Y, CONFIG2.W * 3, CONFIG2.H - CONFIG2.GROUND_Y);
        }
      });
    }
    initForestOfDharma() {
      this.weather.type = "mist";
      this.weather.intensity = 0.3;
      this.weather.wind = 5;
      this.layers.push({
        parallaxFactor: 0.1,
        draw: (ctx) => {
          const grad = ctx.createLinearGradient(0, 0, 0, CONFIG2.H);
          grad.addColorStop(0, "#0c1b0c");
          grad.addColorStop(0.7, "#1f382a");
          grad.addColorStop(1, "#4f705b");
          ctx.fillStyle = grad;
          ctx.fillRect(-CONFIG2.W, 0, CONFIG2.W * 3, CONFIG2.H);
        }
      });
      this.layers.push({
        parallaxFactor: 0.45,
        draw: (ctx) => {
          ctx.fillStyle = "#0a1a12";
          for (let x = -800; x < CONFIG2.W * 1.5; x += 220) {
            ctx.fillRect(x, 150, 30, CONFIG2.GROUND_Y - 150);
            ctx.beginPath();
            ctx.arc(x + 15, 120, 100, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
      this.layers.push({
        parallaxFactor: 1,
        draw: (ctx) => {
          const grad = ctx.createLinearGradient(0, CONFIG2.GROUND_Y, 0, CONFIG2.H);
          grad.addColorStop(0, "#102a1e");
          grad.addColorStop(1, "#05120a");
          ctx.fillStyle = grad;
          ctx.fillRect(-CONFIG2.W, CONFIG2.GROUND_Y, CONFIG2.W * 3, CONFIG2.H - CONFIG2.GROUND_Y);
          ctx.fillStyle = "#a6e22e";
          for (let i = 0; i < 20; i++) {
            const x = i * 123 % (CONFIG2.W * 2) - CONFIG2.W;
            const y = CONFIG2.GROUND_Y + 10 + i * 57 % 150;
            ctx.globalAlpha = 0.3 + Math.abs(Math.sin(performance.now() * 2e-3 + i)) * 0.7;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
    }
    initBridgeOfLanka() {
      this.weather.type = "clear";
      this.layers.push({
        parallaxFactor: 0.15,
        draw: (ctx) => {
          const grad = ctx.createLinearGradient(0, 0, 0, CONFIG2.H);
          grad.addColorStop(0, "#0c1b3a");
          grad.addColorStop(0.5, "#7b2cbf");
          grad.addColorStop(0.7, "#ff5400");
          grad.addColorStop(1, "#ffc300");
          ctx.fillStyle = grad;
          ctx.fillRect(-CONFIG2.W, 0, CONFIG2.W * 3, CONFIG2.H);
        }
      });
      let time = 0;
      this.layers.push({
        parallaxFactor: 0.5,
        update: (dt) => {
          time += dt;
        },
        draw: (ctx) => {
          ctx.fillStyle = "#03045e";
          ctx.beginPath();
          ctx.moveTo(-CONFIG2.W, CONFIG2.GROUND_Y - 40);
          for (let x = -CONFIG2.W; x < CONFIG2.W * 2; x += 100) {
            const waveHeight = Math.sin(time * 3 + x * 0.01) * 8;
            ctx.lineTo(x, CONFIG2.GROUND_Y - 40 + waveHeight);
          }
          ctx.lineTo(CONFIG2.W * 2, CONFIG2.GROUND_Y + 300);
          ctx.lineTo(-CONFIG2.W, CONFIG2.GROUND_Y + 300);
          ctx.closePath();
          ctx.fill();
        }
      });
      this.layers.push({
        parallaxFactor: 1,
        draw: (ctx) => {
          const grad = ctx.createLinearGradient(0, CONFIG2.GROUND_Y, 0, CONFIG2.H);
          grad.addColorStop(0, "#5a5d64");
          grad.addColorStop(1, "#2c2e35");
          ctx.fillStyle = grad;
          ctx.fillRect(-CONFIG2.W, CONFIG2.GROUND_Y, CONFIG2.W * 3, CONFIG2.H - CONFIG2.GROUND_Y);
          ctx.fillStyle = "#3f4147";
          ctx.fillRect(-CONFIG2.W, CONFIG2.GROUND_Y, CONFIG2.W * 3, 20);
        }
      });
    }
  };

  // js/characters/base_character.js
  var BaseCharacter = class {
    constructor(charData, isPlayer) {
      this.id = charData.id;
      this.name = charData.name;
      this.title = charData.title;
      this.color = charData.color;
      this.colorDark = charData.colorDark;
      this.colors = charData.colors;
      this.weapon = charData.weapon;
      this.taunts = [charData.taunt, charData.taunt2, charData.taunt3, charData.taunt4].filter(Boolean);
      this.hp = charData.stats.hp;
      this.speed = charData.stats.speed;
      this.attack = charData.stats.attack;
      this.defense = charData.stats.defense;
      this.specialDmg = charData.stats.specialDmg;
      this.currentHp = this.hp;
      const baseX = isPlayer ? 220 : CONFIG2.W - 220;
      this.x = baseX;
      this.y = CONFIG2.GROUND_Y;
      this.lastX = baseX;
      this.width = 80;
      this.height = 150;
      this.velocityX = 0;
      this.velocityY = 0;
      this.targetVelocityX = 0;
      this.grounded = true;
      this.facing = isPlayer ? 1 : -1;
      this.state = "idle";
      this.stateTimer = 0;
      this.animTime = 0;
      this.attacking = false;
      this.attackType = "light";
      this.attackFrame = 0;
      this.hasHit = false;
      this.energy = 0;
      this.maxEnergy = 100;
      this.attackCooldown = 0;
      this.specialCooldown = 0;
      this.dodgeCooldown = 0;
      this.dodgeTimer = 0;
      this.invTimer = 0;
      this.invincible = false;
      this.blocking = false;
      this.tauntCooldown = 0;
      this.hitstun = 0;
      this.hitFlash = 0;
      this.died = false;
      this.weaponTrail = [];
      this.aiState = "approach";
      this.aiTimer = 0;
      this.aiOppLastAttacking = false;
      this.aiPunishWindow = 0;
      this.passive = charData.passive || null;
      this.passiveData = {};
      this._initPassiveState();
    }
    _initPassiveState() {
      if (!this.passive) return;
      switch (this.passive.id) {
        case "gandiva_precision":
          this.passiveData.consecutiveLights = 0;
          break;
        case "vayu_wrath":
          break;
        // Passive is applied via multipliers in damage calculation
        case "solar_kavach":
          this.passiveData.regenTimer = 0;
          this.passiveData.damageReduction = 0.15;
          break;
        case "indomitable_will":
          break;
        // Checked dynamically when HP < 30%
        case "blade_dance":
          break;
        // Cooldown reduction applied in update()
        case "dharma_aura":
          this.passiveData.regenTimer = 0;
          this.passiveData.regenInterval = 2;
          break;
        case "chakravyuha_tactician":
          this.passiveData.roundFirstHitLanded = false;
          break;
        case "immortal_resolve":
          this.passiveData.immortalUsed = false;
          break;
        case "sacred_flame":
          this.passiveData.vengeanceStacks = 0;
          this.passiveData.maxVengeanceStacks = 5;
          break;
        case "vow_of_protection":
          this.passiveData.tauntHealUsed = false;
          this.passiveData.blockAbsorption = 0.92;
          break;
      }
    }
    // Reset round-specific passive state (called at round start)
    resetRoundPassive() {
      if (!this.passive) return;
      switch (this.passive.id) {
        case "chakravyuha_tactician":
          this.passiveData.roundFirstHitLanded = false;
          break;
        case "vow_of_protection":
          this.passiveData.tauntHealUsed = false;
          break;
      }
    }
    update(dt, opp) {
      this.stateTimer += dt;
      this.animTime += dt * 60;
      this.attackCooldown = Math.max(0, this.attackCooldown - dt);
      this.specialCooldown = Math.max(0, this.specialCooldown - dt);
      this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
      this.invTimer = Math.max(0, this.invTimer - dt);
      this.invincible = this.invTimer > 0;
      this.hitstun = Math.max(0, this.hitstun - dt);
      this.tauntCooldown = Math.max(0, this.tauntCooldown - dt);
      this.hitFlash = Math.max(0, this.hitFlash - dt * 5);
      this.energy = Math.min(this.maxEnergy, this.energy + CONFIG2.ENERGY_REGEN * dt);
      this._updatePassive(dt);
      if (this.hitstun > 0) {
        this.state = "hitstun";
        this.velocityX *= Math.pow(0.85, dt * 60);
        return;
      }
      if (this.died) {
        this.state = "knockdown";
        return;
      }
      if (!this.attacking) {
        this.facing = opp.x > this.x ? 1 : -1;
      }
      if (!this.grounded) {
        this.state = "jump";
      } else if (this.blocking) {
        this.state = "block";
      } else if (this.attacking) {
        this.state = "attack";
        this.attackFrame += dt * (1e3 / 45);
        const dur = this.attackType === "heavy" ? 8 : this.attackType === "special" ? 10 : 5;
        if (this.attackFrame >= dur) {
          this.attacking = false;
          this.specialActive = false;
          this.hasHit = false;
        }
      } else if (Math.abs(this.x - this.lastX) > 2) {
        this.state = "walk";
      } else {
        this.state = "idle";
      }
      this.lastX = this.x;
    }
    _updatePassive(dt) {
      if (!this.passive) return;
      switch (this.passive.id) {
        case "blade_dance": {
          break;
        }
        case "solar_kavach": {
          this.passiveData.regenTimer += dt;
          if (this.passiveData.regenTimer >= 5 && this.currentHp > 0 && this.currentHp < this.hp) {
            this.currentHp = Math.min(this.hp, this.currentHp + 3);
            this.passiveData.regenTimer = 0;
          }
          break;
        }
        case "dharma_aura": {
          if (this.currentHp > 0 && this.currentHp < this.hp) {
            this.passiveData.regenTimer += dt;
            if (this.passiveData.regenTimer >= this.passiveData.regenInterval) {
              this.currentHp = Math.min(this.hp, this.currentHp + 1);
              this.passiveData.regenTimer = 0;
            }
          }
          break;
        }
        case "indomitable_will": {
          break;
        }
      }
    }
    takeDamage(amount, knockbackX = 0, knockbackY = 0) {
      if (this.invincible || this.died) return { hit: false, blocked: false };
      let mitigation = clamp2(this.defense / 100, 0, 0.75);
      let damageDealt = amount;
      if (this.passive && this.passive.id === "solar_kavach") {
        mitigation = Math.min(0.75, mitigation + this.passiveData.damageReduction);
      }
      let blockMitigation = 0.85;
      if (this.passive && this.passive.id === "vow_of_protection") {
        blockMitigation = this.passiveData.blockAbsorption;
      }
      if (this.blocking) {
        damageDealt = amount * (1 - blockMitigation);
        this.velocityX = this.facing * -150;
        this.hitFlash = 0.1;
        return { hit: true, blocked: true, damage: damageDealt };
      }
      damageDealt = Math.max(1, amount * (1 - mitigation));
      this.currentHp = Math.max(0, this.currentHp - damageDealt);
      if (this.currentHp <= 0 && this.passive && this.passive.id === "immortal_resolve" && !this.passiveData.immortalUsed) {
        this.passiveData.immortalUsed = true;
        this.currentHp = 1;
        return { hit: true, blocked: false, damage: damageDealt, immortalSaved: true, knockbackForce: knockbackX * 2 };
      }
      if (this.passive && this.passive.id === "sacred_flame" && this.currentHp > 0) {
        this.passiveData.vengeanceStacks = Math.min(
          this.passiveData.maxVengeanceStacks,
          this.passiveData.vengeanceStacks + 1
        );
      }
      this.velocityX = knockbackX;
      if (knockbackY !== 0) {
        this.velocityY = knockbackY;
        this.grounded = false;
      }
      if (this.passive && this.passive.id === "indomitable_will" && this.currentHp < this.hp * 0.3) {
        this.hitstun = (knockbackY !== 0 ? 0.6 : 0.25) * 0.7;
      } else {
        this.hitstun = knockbackY !== 0 ? 0.6 : 0.25;
      }
      this.hitFlash = 0.3;
      if (this.currentHp <= 0) {
        this.died = true;
        this.velocityX = this.facing * -250;
        this.velocityY = -350;
        this.grounded = false;
      }
      return { hit: true, blocked: false, damage: damageDealt };
    }
    // Get attack damage bonus from passives
    getDamageBonus(attackType) {
      if (!this.passive) return 1;
      let bonus = 1;
      switch (this.passive.id) {
        case "gandiva_precision":
          if (attackType === "light" && this.passiveData.consecutiveLights >= 2) {
            bonus = 1.25;
          }
          break;
        case "vayu_wrath":
          if (attackType === "heavy") {
            bonus = 1.25;
          }
          break;
        case "indomitable_will":
          if (this.currentHp < this.hp * 0.3) {
            bonus = 1.2;
          }
          break;
        case "dharma_aura":
          if (attackType === "special") {
            bonus = 1.15;
          }
          break;
        case "chakravyuha_tactician":
          if (!this.passiveData.roundFirstHitLanded) {
            bonus = 1.3;
          }
          break;
        case "sacred_flame":
          if (this.passiveData.vengeanceStacks > 0) {
            bonus = 1 + this.passiveData.vengeanceStacks * 0.06;
            this.passiveData.vengeanceStacks = 0;
          }
          break;
      }
      return bonus;
    }
    // Get knockback multiplier from passives
    getKnockbackBonus(attackType) {
      if (!this.passive) return 1;
      if (this.passive.id === "vayu_wrath" && attackType === "heavy") {
        return 1.4;
      }
      return 1;
    }
    // Get attack cooldown multiplier from passives
    getCooldownMultiplier(attackType) {
      if (!this.passive) return 1;
      if (this.passive.id === "blade_dance" && attackType === "light") {
        return 0.75;
      }
      if (this.passive.id === "blade_dance") {
        return 0.8;
      }
      return 1;
    }
    // Called when the character lands a hit (for passive tracking)
    onHitLanded(attackType) {
      if (!this.passive) return;
      switch (this.passive.id) {
        case "gandiva_precision":
          if (attackType === "light") {
            this.passiveData.consecutiveLights = (this.passiveData.consecutiveLights + 1) % 3;
          } else {
            this.passiveData.consecutiveLights = 0;
          }
          break;
        case "chakravyuha_tactician":
          this.passiveData.roundFirstHitLanded = true;
          break;
        case "sacred_flame":
          this.passiveData.vengeanceJustTriggered = this.passiveData.vengeanceStacks >= this.passiveData.maxVengeanceStacks;
          this.passiveData.vengeanceStacks = 0;
          break;
      }
    }
  };

  // js/characters/warrior_mesh_3d.js
  var WarriorMesh3D = class {
    constructor(scene, entity) {
      this.scene = scene;
      this.entity = entity;
      this.isThreeAvailable = typeof window !== "undefined" && !!window.THREE;
      if (this.isThreeAvailable && this.scene) {
        this.build3DHumanoidMesh();
      }
    }
    build3DHumanoidMesh() {
      const THREE = window.THREE;
      this.group = new THREE.Group();
      const colors = this.entity.colors || {
        skin: 13935988,
        cloth: 2763322,
        armor: 1402304,
        gold: 16766720
      };
      const parseHex = (c) => typeof c === "number" ? c : parseInt(c.replace("#", "0x"), 16);
      const skinHex = parseHex(colors.skin);
      const armorHex = parseHex(colors.armor);
      const goldHex = parseHex(colors.gold);
      this.skinMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.55 });
      this.armorMat = new THREE.MeshStandardMaterial({ color: armorHex, roughness: 0.3, metalness: 0.7 });
      this.goldMat = new THREE.MeshStandardMaterial({ color: goldHex, roughness: 0.25, metalness: 0.95 });
      this.hairMat = new THREE.MeshStandardMaterial({ color: 1710618, roughness: 0.9 });
      const torsoGeo = new THREE.CylinderGeometry(24, 15, 55, 12);
      this.torsoMesh = new THREE.Mesh(torsoGeo, this.armorMat);
      this.torsoMesh.position.set(0, 85, 0);
      this.torsoMesh.castShadow = true;
      this.torsoMesh.receiveShadow = true;
      this.group.add(this.torsoMesh);
      const headGeo = new THREE.SphereGeometry(14, 16, 16);
      this.headMesh = new THREE.Mesh(headGeo, this.skinMat);
      this.headMesh.position.set(0, 130, 0);
      this.headMesh.castShadow = true;
      this.group.add(this.headMesh);
      const crownGeo = new THREE.ConeGeometry(15, 25, 8);
      this.crownMesh = new THREE.Mesh(crownGeo, this.goldMat);
      this.crownMesh.position.set(0, 145, 0);
      this.crownMesh.castShadow = true;
      this.group.add(this.crownMesh);
      const armGeo = new THREE.CylinderGeometry(6, 4.5, 40, 8);
      this.leftArmMesh = new THREE.Mesh(armGeo, this.skinMat);
      this.leftArmMesh.position.set(-25, 95, 0);
      this.leftArmMesh.castShadow = true;
      this.group.add(this.leftArmMesh);
      this.rightArmMesh = new THREE.Mesh(armGeo, this.skinMat);
      this.rightArmMesh.position.set(25, 95, 0);
      this.rightArmMesh.castShadow = true;
      this.group.add(this.rightArmMesh);
      const legGeo = new THREE.CylinderGeometry(8, 6, 50, 8);
      this.leftLegMesh = new THREE.Mesh(legGeo, this.skinMat);
      this.leftLegMesh.position.set(-12, 35, 0);
      this.leftLegMesh.castShadow = true;
      this.leftLegMesh.receiveShadow = true;
      this.group.add(this.leftLegMesh);
      this.rightLegMesh = new THREE.Mesh(legGeo, this.skinMat);
      this.rightLegMesh.position.set(12, 35, 0);
      this.rightLegMesh.castShadow = true;
      this.rightLegMesh.receiveShadow = true;
      this.group.add(this.rightLegMesh);
      this.build3DWeapon(goldHex);
      this.scene.add(this.group);
    }
    build3DWeapon(goldHex) {
      const THREE = window.THREE;
      const type = this.entity.weapon || "Sword";
      if (type.includes("Bow")) {
        const bowGeo = new THREE.TorusGeometry(35, 3, 8, 24, Math.PI);
        this.weaponMesh = new THREE.Mesh(bowGeo, this.goldMat);
        this.weaponMesh.rotation.z = -Math.PI / 2;
      } else if (type.includes("Mace") || type.includes("Gada")) {
        const shaftGeo = new THREE.CylinderGeometry(3, 3, 60, 8);
        const headGeo = new THREE.SphereGeometry(18, 12, 12);
        this.weaponMesh = new THREE.Group();
        const shaft = new THREE.Mesh(shaftGeo, this.skinMat);
        const head = new THREE.Mesh(headGeo, this.goldMat);
        head.position.y = 30;
        this.weaponMesh.add(shaft);
        this.weaponMesh.add(head);
      } else {
        const bladeGeo = new THREE.BoxGeometry(4, 65, 8);
        this.weaponMesh = new THREE.Mesh(bladeGeo, this.goldMat);
      }
      this.weaponMesh.position.set(30, 80, 15);
      this.weaponMesh.castShadow = true;
      this.group.add(this.weaponMesh);
    }
    update(pose) {
      if (!this.group) return;
      const posX = this.entity.x - CONFIG2.W / 2;
      const posY = CONFIG2.GROUND_Y - this.entity.y;
      this.group.position.set(posX, posY, 0);
      this.group.rotation.y = this.entity.facing === 1 ? Math.PI / 2 : -Math.PI / 2;
      if (pose && pose.limbs) {
        if (this.leftArmMesh) this.leftArmMesh.rotation.z = pose.limbs.leftArm || 0;
        if (this.rightArmMesh) this.rightArmMesh.rotation.z = pose.limbs.rightArm || 0;
        if (this.leftLegMesh) this.leftLegMesh.rotation.z = pose.limbs.leftLeg || 0;
        if (this.rightLegMesh) this.rightLegMesh.rotation.z = pose.limbs.rightLeg || 0;
        if (this.headMesh) this.headMesh.rotation.z = pose.limbs.headAngle || 0;
        if (this.weaponMesh) this.weaponMesh.rotation.z = pose.limbs.weaponAngle || 0;
      }
    }
    destroy() {
      if (this.group && this.scene) {
        this.scene.remove(this.group);
      }
    }
  };

  // js/characters/character_renderer.js
  var CharacterRenderer = class {
    constructor(animEngine) {
      this.anim = animEngine;
      this.mesh3DMap = /* @__PURE__ */ new Map();
    }
    /**
     * Draws a detailed mythological warrior with anatomical shading, metallic highlights,
     * customized crowns, cloth dynamics, and weapon motion slash arcs.
     */
    draw(ctx, entity, renderer) {
      if (!entity) return;
      const pose = this.anim.getPose(entity.state, entity.animTime || 0, entity);
      if (renderer && renderer.isThreeAvailable && renderer.scene) {
        if (!this.mesh3DMap.has(entity)) {
          this.mesh3DMap.set(entity, new WarriorMesh3D(renderer.scene, entity));
        }
        const mesh3D = this.mesh3DMap.get(entity);
        if (mesh3D) {
          mesh3D.update(pose);
        }
      }
      if (!ctx) return;
      ctx.save();
      ctx.globalAlpha = pose.alpha;
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      const shadowScale = clamp2(1 - (CONFIG2.GROUND_Y - entity.y) * 5e-3, 0.2, 1);
      ctx.beginPath();
      ctx.ellipse(entity.x, CONFIG2.GROUND_Y, 38 * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.translate(entity.x, entity.y);
      ctx.scale(entity.facing * pose.scaleX, pose.scaleY);
      let isFlashing = entity.hitFlash > 0;
      const colors = entity.colors || {
        skin: "#d4a574",
        skinShadow: "#b8885a",
        hair: "#1a1a1a",
        cloth: "#2a2a3a",
        clothLight: "#3a3a4a",
        armor: "#1565c0",
        armorLight: "#1e88e5",
        dhoti: "#e8d5b0",
        dhotiShadow: "#c4a882",
        gold: "#ffd700",
        goldShadow: "#c8a000"
      };
      if (entity.energy >= CONFIG2.SPECIAL_COST || entity.specialActive) {
        this.drawDivineAura(ctx, entity);
      }
      const headX = 0, headY = -135 + pose.bodyY;
      const neckX = 0, neckY = -120 + pose.bodyY;
      const hipsX = 0, hipsY = -70 + pose.bodyY;
      const shoulderLX = -24, shoulderLY = -110 + pose.bodyY;
      const shoulderRX = 24, shoulderRY = -110 + pose.bodyY;
      this.drawLeg(ctx, hipsX, hipsY, pose.limbs.leftLeg, colors, isFlashing, "left", entity);
      this.drawArm(ctx, shoulderLX, shoulderLY, pose.limbs.leftArm, colors, isFlashing, "left", entity);
      this.drawTorso(ctx, neckX, neckY, hipsX, hipsY, colors, isFlashing, entity);
      this.drawHead(ctx, headX, headY, pose.limbs.headAngle, colors, isFlashing, entity);
      this.drawLeg(ctx, hipsX, hipsY, pose.limbs.rightLeg, colors, isFlashing, "right", entity);
      this.drawArm(ctx, shoulderRX, shoulderRY, pose.limbs.rightArm, colors, isFlashing, "right", entity);
      this.drawWeapon(ctx, shoulderRX, shoulderRY, pose.limbs.rightArm, pose.limbs.weaponAngle, entity, colors, isFlashing);
      ctx.restore();
    }
    /**
     * Draws Divine Astra Energy Aura
     */
    drawDivineAura(ctx, entity) {
      ctx.save();
      const auraPulse = 0.7 + Math.sin((entity.animTime || 0) * 8) * 0.3;
      const isKarna = entity.id === "karna";
      const isDraupadi = entity.id === "draupadi";
      const isAshwatthama = entity.id === "ashwatthama";
      let colorInner = "rgba(255, 215, 0, ";
      let colorMid = "rgba(255, 140, 0, ";
      if (isKarna) {
        colorInner = "rgba(255, 235, 59, ";
        colorMid = "rgba(255, 112, 67, ";
      } else if (isDraupadi) {
        colorInner = "rgba(255, 61, 0, ";
        colorMid = "rgba(216, 67, 21, ";
      } else if (isAshwatthama) {
        colorInner = "rgba(0, 176, 255, ";
        colorMid = "rgba(1, 87, 155, ";
      }
      const auraGrad = ctx.createRadialGradient(0, -75, 10, 0, -75, 85);
      auraGrad.addColorStop(0, colorInner + 0.6 * auraPulse + ")");
      auraGrad.addColorStop(0.5, colorMid + 0.35 * auraPulse + ")");
      auraGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, -75, 85, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const angle = (entity.animTime * 0.1 + i * (Math.PI / 2)) % (Math.PI * 2);
        const rx = Math.cos(angle) * (50 + auraPulse * 15);
        const ry = -75 + Math.sin(angle) * (50 + auraPulse * 15);
        ctx.beginPath();
        ctx.arc(rx, ry, 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    /**
     * Draws Head, Mukut Crown, Hair, Tilak, and Expressions
     */
    drawHead(ctx, hx, hy, angle, colors, isFlashing, entity) {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(angle);
      if (isFlashing) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }
      const id = entity ? entity.id : "arjuna";
      ctx.fillStyle = id === "bhishma" ? "#eceff1" : colors.hair;
      ctx.beginPath();
      ctx.arc(0, -15, 7, 0, Math.PI * 2);
      ctx.fill();
      if (id === "bhishma") {
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.quadraticCurveTo(-18, 5, -14, 20);
        ctx.lineTo(-6, 20);
        ctx.quadraticCurveTo(-10, 5, -5, -10);
        ctx.closePath();
        ctx.fill();
      } else if (id === "draupadi") {
        ctx.beginPath();
        ctx.moveTo(-12, -8);
        ctx.quadraticCurveTo(-22, 10, -18, 30);
        ctx.lineTo(-8, 30);
        ctx.quadraticCurveTo(-12, 10, -5, -8);
        ctx.closePath();
        ctx.fill();
      }
      const skinGrad = ctx.createLinearGradient(-12, -12, 12, 12);
      skinGrad.addColorStop(0, colors.skin);
      skinGrad.addColorStop(1, colors.skinShadow);
      ctx.fillStyle = skinGrad;
      ctx.beginPath();
      ctx.arc(0, -2, 11.5, 0, Math.PI * 2);
      ctx.fill();
      if (id === "bhishma") {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(2, 3);
        ctx.quadraticCurveTo(8, 10, 4, 18);
        ctx.quadraticCurveTo(-2, 18, -4, 5);
        ctx.closePath();
        ctx.fill();
      } else if (id === "bhima") {
        ctx.fillStyle = "#1c1c1c";
        ctx.beginPath();
        ctx.moveTo(1, 4);
        ctx.lineTo(8, 5);
        ctx.lineTo(6, 12);
        ctx.lineTo(0, 11);
        ctx.closePath();
        ctx.fill();
      }
      if (id === "ashwatthama") {
        ctx.fillStyle = "#ff1744";
        ctx.beginPath();
        ctx.arc(3, -5, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(4, -6, 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#d32f2f";
        ctx.fillRect(-1.5, -7, 3, 7);
        ctx.fillStyle = colors.gold;
        ctx.beginPath();
        ctx.arc(0, 1.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      const isHurt = entity && (entity.hitstun > 0 || entity.died);
      const isAttacking = entity && (entity.attacking || entity.specialActive);
      const isVictory = entity && entity.state === "victory";
      ctx.strokeStyle = colors.hair || "#1a1a1a";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      if (isAttacking) {
        ctx.moveTo(1, -6);
        ctx.lineTo(8, -3.5);
      } else if (isHurt) {
        ctx.moveTo(1, -3.5);
        ctx.lineTo(8, -6);
      } else {
        ctx.moveTo(1, -5);
        ctx.lineTo(8, -5);
      }
      ctx.stroke();
      ctx.fillStyle = isHurt ? "#ff8a80" : "#ffffff";
      ctx.fillRect(2.5, -3, 4.5, 2.5);
      ctx.fillStyle = "#0f0f0f";
      ctx.fillRect(isAttacking ? 4.5 : 4, -3, 1.8, 2.5);
      ctx.strokeStyle = "#3e2723";
      ctx.lineWidth = 1.3;
      if (isHurt) {
        ctx.fillStyle = "#261c14";
        ctx.beginPath();
        ctx.arc(4, 3.5, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (isVictory) {
        ctx.beginPath();
        ctx.arc(4, 2.5, 3.5, 0.1, Math.PI * 0.9);
        ctx.stroke();
      } else if (isAttacking) {
        ctx.beginPath();
        ctx.moveTo(2, 4);
        ctx.lineTo(7, 5);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(2.5, 3.5);
        ctx.lineTo(6, 3.5);
        ctx.stroke();
      }
      const mukutGrad = ctx.createLinearGradient(-14, -8, 14, -28);
      mukutGrad.addColorStop(0, colors.gold);
      mukutGrad.addColorStop(0.5, "#fff176");
      mukutGrad.addColorStop(1, colors.goldShadow);
      ctx.fillStyle = mukutGrad;
      ctx.beginPath();
      ctx.moveTo(-13, -7);
      ctx.lineTo(-4, -18);
      ctx.lineTo(0, -28);
      ctx.lineTo(4, -18);
      ctx.lineTo(13, -7);
      ctx.lineTo(0, -4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(0, -4);
      ctx.stroke();
      ctx.fillStyle = colors.armorLight || "#00e5ff";
      ctx.beginPath();
      ctx.arc(0, -14, 2.5, 0, Math.PI * 2);
      ctx.fill();
      if (id === "arjuna") {
        ctx.save();
        ctx.translate(0, -28);
        ctx.rotate(-0.25);
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-12, -22);
        ctx.stroke();
        const featherGrad = ctx.createRadialGradient(-12, -22, 1, -12, -22, 8);
        featherGrad.addColorStop(0, "#00b0ff");
        featherGrad.addColorStop(0.4, "#00e676");
        featherGrad.addColorStop(0.8, "#ffd700");
        featherGrad.addColorStop(1, "rgba(0, 230, 118, 0)");
        ctx.fillStyle = featherGrad;
        ctx.beginPath();
        ctx.ellipse(-12, -22, 6, 9, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = colors.gold;
      ctx.beginPath();
      ctx.arc(-12, 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    /**
     * Draws Torso, Muscular Contours, Metallic Armor (Kavacha), and Sashes
     */
    drawTorso(ctx, nx, ny, hx, hy, colors, isFlashing, entity) {
      ctx.save();
      if (isFlashing) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-22, ny, 44, hy - ny);
        ctx.restore();
        return;
      }
      const id = entity ? entity.id : "arjuna";
      if (entity) {
        const time = entity.animTime || 0;
        const moveSway = (entity.velocityX || 0) * 0.05;
        const sashWave = Math.sin(time * 6) * 4 - moveSway * 8;
        ctx.fillStyle = colors.clothLight || colors.cloth;
        ctx.beginPath();
        ctx.moveTo(-18, ny + 10);
        ctx.quadraticCurveTo(-28 + sashWave, ny + 35, -22 + sashWave * 1.5, hy + 30);
        ctx.lineTo(-14 + sashWave * 1.5, hy + 30);
        ctx.quadraticCurveTo(-20 + sashWave, ny + 35, -14, ny + 10);
        ctx.closePath();
        ctx.fill();
      }
      const skinGrad = ctx.createLinearGradient(-24, ny, 24, ny + 14);
      skinGrad.addColorStop(0, colors.skin);
      skinGrad.addColorStop(1, colors.skinShadow);
      ctx.fillStyle = skinGrad;
      ctx.fillRect(-24, ny, 48, 14);
      ctx.fillStyle = colors.cloth;
      ctx.beginPath();
      ctx.moveTo(-23, ny + 12);
      ctx.lineTo(23, ny + 12);
      ctx.lineTo(13, hy);
      ctx.lineTo(-13, hy);
      ctx.closePath();
      ctx.fill();
      const armorGrad = ctx.createLinearGradient(-22, ny + 8, 22, hy - 6);
      if (id === "karna") {
        armorGrad.addColorStop(0, "#ffffff");
        armorGrad.addColorStop(0.3, colors.gold);
        armorGrad.addColorStop(1, colors.goldShadow);
      } else if (id === "bhishma") {
        armorGrad.addColorStop(0, "#ffffff");
        armorGrad.addColorStop(0.5, "#cfd8dc");
        armorGrad.addColorStop(1, "#90a4ae");
      } else {
        armorGrad.addColorStop(0, colors.armorLight);
        armorGrad.addColorStop(0.6, colors.armor);
        armorGrad.addColorStop(1, colors.armor);
      }
      ctx.fillStyle = armorGrad;
      ctx.beginPath();
      ctx.moveTo(-21, ny + 8);
      ctx.lineTo(21, ny + 8);
      ctx.lineTo(12, hy - 6);
      ctx.lineTo(-12, hy - 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, ny + 10);
      ctx.lineTo(0, hy - 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-7, ny + 20, 6, 0, Math.PI * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(7, ny + 20, 6, Math.PI * 0.2, Math.PI);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-16, ny + 12);
      ctx.lineTo(-8, hy - 12);
      ctx.stroke();
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, ny + 8, 10, 0, Math.PI);
      ctx.stroke();
      ctx.fillStyle = colors.gold;
      ctx.fillRect(-14, hy - 6, 28, 6);
      ctx.fillStyle = colors.goldShadow;
      ctx.fillRect(-3, hy - 6, 6, 14);
      ctx.restore();
    }
    /**
     * Draws Arm (Upper arm bicep, wrist band, forearm)
     */
    drawArm(ctx, sx, sy, armAngle, colors, isFlashing, side, entity) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(armAngle);
      if (isFlashing) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-6, 0, 12, 52);
        ctx.restore();
        return;
      }
      const pauldronGrad = ctx.createLinearGradient(-9, 0, 9, 8);
      pauldronGrad.addColorStop(0, colors.gold);
      pauldronGrad.addColorStop(1, colors.goldShadow);
      ctx.fillStyle = pauldronGrad;
      ctx.fillRect(-9, 0, 18, 7);
      const armGrad = ctx.createLinearGradient(-8, 7, 8, 32);
      armGrad.addColorStop(0, colors.skin);
      armGrad.addColorStop(1, colors.skinShadow);
      ctx.fillStyle = armGrad;
      ctx.beginPath();
      ctx.moveTo(-6, 7);
      ctx.quadraticCurveTo(-10, 19, -4.5, 32);
      ctx.lineTo(4.5, 32);
      ctx.quadraticCurveTo(8, 19, 5.5, 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = colors.gold;
      ctx.fillRect(-5.5, 32, 11, 6);
      ctx.fillStyle = armGrad;
      ctx.fillRect(-4, 38, 8, 14);
      ctx.restore();
    }
    /**
     * Draws Leg (Dhoti folds, knee band, calf muscle, payal anklet, foot)
     */
    drawLeg(ctx, hx, hy, legAngle, colors, isFlashing, side, entity) {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(legAngle);
      if (isFlashing) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-9, 0, 18, 72);
        ctx.restore();
        return;
      }
      const isBackLeg = side === "left";
      const dhotiGrad = ctx.createLinearGradient(-12, 0, 12, 38);
      if (isBackLeg) {
        dhotiGrad.addColorStop(0, colors.dhotiShadow);
        dhotiGrad.addColorStop(1, "#756044");
      } else {
        dhotiGrad.addColorStop(0, colors.dhoti);
        dhotiGrad.addColorStop(1, colors.dhotiShadow);
      }
      ctx.fillStyle = dhotiGrad;
      ctx.fillRect(-11, 0, 22, 38);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-5, 2);
      ctx.lineTo(-2, 36);
      ctx.moveTo(3, 2);
      ctx.lineTo(5, 36);
      ctx.stroke();
      ctx.fillStyle = isBackLeg ? colors.goldShadow : colors.gold;
      ctx.fillRect(-9, 37, 18, 4);
      const legGrad = ctx.createLinearGradient(-8, 41, 8, 62);
      if (isBackLeg) {
        legGrad.addColorStop(0, colors.skinShadow);
        legGrad.addColorStop(1, "#7a5735");
      } else {
        legGrad.addColorStop(0, colors.skin);
        legGrad.addColorStop(1, colors.skinShadow);
      }
      ctx.fillStyle = legGrad;
      ctx.beginPath();
      ctx.moveTo(-6.5, 41);
      ctx.quadraticCurveTo(-12, 51, -5.5, 63);
      ctx.lineTo(5.5, 63);
      ctx.lineTo(5.5, 41);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = isBackLeg ? colors.goldShadow : colors.gold;
      ctx.fillRect(-5.5, 63, 11, 3.5);
      ctx.fillStyle = legGrad;
      ctx.fillRect(-5.5, 66.5, 15, 7.5);
      ctx.restore();
    }
    /**
     * Draws Mythological Weapon Models & Motion Slash Arc Trails
     */
    drawWeapon(ctx, sx, sy, armAngle, weaponAngle, entity, colors, isFlashing) {
      const type = entity.weapon || "Sword";
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(armAngle);
      ctx.translate(0, 52);
      ctx.rotate(weaponAngle);
      if (isFlashing) {
        ctx.strokeStyle = "#ffffff";
        ctx.fillStyle = "#ffffff";
      }
      if (entity.attacking) {
        ctx.save();
        const trailGrad = ctx.createLinearGradient(0, 0, 50, -60);
        trailGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
        trailGrad.addColorStop(0.5, entity.color || colors.gold);
        trailGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
        ctx.fillStyle = trailGrad;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.arc(0, -10, 65, -Math.PI * 0.6, Math.PI * 0.35, false);
        ctx.lineTo(0, -10);
        ctx.fill();
        ctx.restore();
      }
      switch (type) {
        case "Gandiva Bow":
        case "Vijaya Bow": {
          const isVijaya = type === "Vijaya Bow";
          const bowColor = isVijaya ? "#ffb300" : colors.gold;
          ctx.strokeStyle = bowColor;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(0, -45);
          ctx.bezierCurveTo(26, -45, 22, -12, 7, 0);
          ctx.bezierCurveTo(22, 12, 26, 45, 0, 45);
          ctx.stroke();
          ctx.strokeStyle = isVijaya ? "#ffff8d" : "rgba(255, 255, 255, 0.9)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -40);
          ctx.lineTo(0, 40);
          ctx.stroke();
          if (entity.attacking || entity.specialActive) {
            const arrowColor = isVijaya ? "#ff3d00" : "#00e5ff";
            ctx.strokeStyle = arrowColor;
            ctx.fillStyle = arrowColor;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(-15, 0);
            ctx.lineTo(32, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(32, 0);
            ctx.lineTo(23, -5.5);
            ctx.lineTo(23, 5.5);
            ctx.closePath();
            ctx.fill();
          }
          break;
        }
        case "Gada (Mace)":
        case "Iron Mace": {
          ctx.strokeStyle = type === "Gada (Mace)" ? "#4e342e" : "#212121";
          ctx.lineWidth = 5.5;
          ctx.beginPath();
          ctx.moveTo(0, 16);
          ctx.lineTo(0, -32);
          ctx.stroke();
          const headRadius = type === "Gada (Mace)" ? 20 : 17;
          const gadColor = type === "Gada (Mace)" ? colors.gold : "#757575";
          const gadShadow = type === "Gada (Mace)" ? colors.goldShadow : "#424242";
          const maceGrad = ctx.createRadialGradient(-6, -40, 4, 0, -36, headRadius);
          maceGrad.addColorStop(0, "#ffffff");
          maceGrad.addColorStop(0.35, gadColor);
          maceGrad.addColorStop(1, gadShadow);
          ctx.fillStyle = maceGrad;
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = i / 8 * Math.PI * 2;
            const nx = Math.cos(angle) * headRadius;
            const ny = -36 + Math.sin(angle) * headRadius;
            if (i === 0) ctx.moveTo(nx, ny);
            else ctx.quadraticCurveTo(0, -36, nx, ny);
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#ff1744";
          ctx.beginPath();
          ctx.arc(0, -36, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = gadColor;
          ctx.beginPath();
          ctx.moveTo(-4, -36 - headRadius);
          ctx.lineTo(4, -36 - headRadius);
          ctx.lineTo(0, -50 - headRadius);
          ctx.closePath();
          ctx.fill();
          break;
        }
        case "Sword & Shield":
        case "Sword": {
          const bladeGrad = ctx.createLinearGradient(-3, -42, 5, 0);
          bladeGrad.addColorStop(0, "#ffffff");
          bladeGrad.addColorStop(0.4, "#e0e0e0");
          bladeGrad.addColorStop(1, "#9e9e9e");
          ctx.fillStyle = isFlashing ? "#ffffff" : bladeGrad;
          ctx.beginPath();
          ctx.moveTo(-2.5, 0);
          ctx.lineTo(-2.5, -38);
          ctx.quadraticCurveTo(-2.5, -58, 13, -64);
          ctx.quadraticCurveTo(7, -42, 4.5, -20);
          ctx.lineTo(3.5, 0);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = colors.gold;
          ctx.fillRect(-9, -2, 18, 4.5);
          ctx.strokeStyle = colors.goldShadow;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 5, 8.5, Math.PI, Math.PI * 2.5);
          ctx.stroke();
          ctx.fillStyle = "#3e2723";
          ctx.fillRect(-2.5, 2, 5, 11);
          ctx.fillStyle = colors.gold;
          ctx.beginPath();
          ctx.arc(0, 14, 3.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "Divine Spear": {
          ctx.strokeStyle = "#4e342e";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, 26);
          ctx.lineTo(0, -65);
          ctx.stroke();
          ctx.fillStyle = colors.gold;
          ctx.beginPath();
          ctx.moveTo(-7, -65);
          ctx.lineTo(0, -90);
          ctx.lineTo(7, -65);
          ctx.lineTo(0, -58);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#d32f2f";
          ctx.beginPath();
          ctx.moveTo(0, -54);
          ctx.lineTo(-16, -48);
          ctx.lineTo(0, -42);
          ctx.closePath();
          ctx.fill();
          break;
        }
      }
      ctx.restore();
    }
  };

  // js/characters/roster.js
  var CHARACTERS2 = [
    {
      id: "arjuna",
      name: "Arjuna",
      title: "The Peerless Archer",
      devanagari: "\u0905\u0930\u094D\u091C\u0941\u0928",
      color: "#4fc3f7",
      colorDark: "#0288d1",
      weapon: "Gandiva Bow",
      weaponDevanagari: "\u0917\u093E\u0923\u094D\u0921\u0940\u0935",
      stats: { hp: 100, speed: 185, attack: 13, defense: 8, specialDmg: 34 },
      taunt: "I am Arjuna, the greatest archer!",
      taunt2: "Pashupatastra, arise!",
      taunt3: "My arrows never miss their mark!",
      taunt4: "Lord Krishna guides my hand!",
      winQuote: "Dharma always prevails on the battlefield.",
      defeatQuote: "Dharma always triumphs...",
      passive: {
        id: "gandiva_precision",
        name: "Gandiva Precision",
        desc: "Every 3rd consecutive light attack during a combo deals +25% damage and hits twice.",
        icon: "\u{1F3F9}"
      },
      colors: {
        skin: "#d4a574",
        skinShadow: "#b8885a",
        hair: "#1a1a1a",
        cloth: "#2a2a3a",
        clothLight: "#3a3a4a",
        armor: "#1565c0",
        armorLight: "#1e88e5",
        dhoti: "#e8d5b0",
        dhotiShadow: "#c4a882",
        gold: "#ffd700",
        goldShadow: "#c8a000"
      }
    },
    {
      id: "bhima",
      name: "Bhima",
      title: "The Mighty",
      devanagari: "\u092D\u0940\u092E",
      color: "#ff8f00",
      colorDark: "#e65100",
      weapon: "Gada (Mace)",
      weaponDevanagari: "\u0917\u0926\u093E",
      stats: { hp: 160, speed: 120, attack: 20, defense: 14, specialDmg: 48 },
      taunt: "No one can withstand my Gada!",
      taunt2: "Taste the wrath of Vayu!",
      taunt3: "I will crush you like a dried leaf!",
      taunt4: "This mace will be your doom!",
      winQuote: "Ha! Even mountains tremble before me!",
      defeatQuote: "My strength has failed me...",
      passive: {
        id: "vayu_wrath",
        name: "Vayu's Wrath",
        desc: "Heavy attacks deal +25% damage and knockback is increased by 40%.",
        icon: "\u{1F4AA}"
      },
      colors: {
        skin: "#c69c6d",
        skinShadow: "#a77a4f",
        hair: "#262626",
        cloth: "#4e342e",
        clothLight: "#5d4037",
        armor: "#37474f",
        armorLight: "#455a64",
        dhoti: "#ffcc80",
        dhotiShadow: "#ffa726",
        gold: "#ffd700",
        goldShadow: "#c8a000"
      }
    },
    {
      id: "karna",
      name: "Karna",
      title: "The Radiant Warrior",
      devanagari: "\u0915\u0930\u094D\u0923",
      color: "#ffeb3b",
      colorDark: "#fbc02d",
      weapon: "Vijaya Bow",
      weaponDevanagari: "\u0935\u093F\u091C\u092F",
      stats: { hp: 115, speed: 170, attack: 16, defense: 9, specialDmg: 42 },
      taunt: "I fight for loyalty and honor!",
      taunt2: "Surya Dev, grant me strength!",
      taunt3: "My Kavach is impenetrable!",
      taunt4: "Radiant as the sun itself!",
      winQuote: "The sun always rises after darkness.",
      defeatQuote: "My destiny is fulfilled...",
      passive: {
        id: "solar_kavach",
        name: "Solar Kavach",
        desc: "Permanent 15% damage reduction from all attacks. Regenerates 3 HP every 5 seconds.",
        icon: "\u2600\uFE0F"
      },
      colors: {
        skin: "#e0b07f",
        skinShadow: "#c29362",
        hair: "#1c1c1c",
        cloth: "#c62828",
        clothLight: "#d32f2f",
        armor: "#ffd700",
        // Kavach
        armorLight: "#fff176",
        dhoti: "#fff9c4",
        dhotiShadow: "#fbc02d",
        gold: "#ffd700",
        goldShadow: "#c8a000"
      }
    },
    {
      id: "duryodhana",
      name: "Duryodhana",
      title: "The Crowned Prince",
      devanagari: "\u0926\u0941\u0930\u094D\u092F\u094B\u0927\u0928",
      color: "#e53935",
      colorDark: "#b71c1c",
      weapon: "Iron Mace",
      weaponDevanagari: "\u0917\u0926\u093E",
      stats: { hp: 145, speed: 140, attack: 19, defense: 12, specialDmg: 46 },
      taunt: "I rule this battlefield!",
      taunt2: "Fear the wrath of the Kauravas!",
      taunt3: "Hastinapur will be mine alone!",
      taunt4: "Krishna cannot save you now!",
      winQuote: "The throne belongs to the strong!",
      defeatQuote: "This throne is mine...",
      passive: {
        id: "indomitable_will",
        name: "Indomitable Will",
        desc: "When below 30% HP, deals +20% damage and recovers from hitstun 30% faster.",
        icon: "\u{1F451}"
      },
      colors: {
        skin: "#d4a574",
        skinShadow: "#b8885a",
        hair: "#0f0f0f",
        cloth: "#1a1a1a",
        clothLight: "#2c2c2c",
        armor: "#880e4f",
        armorLight: "#ad1457",
        dhoti: "#ff8a80",
        dhotiShadow: "#ff5252",
        gold: "#ffd700",
        goldShadow: "#c8a000"
      }
    },
    {
      id: "nakula",
      name: "Nakula",
      title: "The Swordmaster",
      devanagari: "\u0928\u0915\u0941\u0932",
      color: "#00e676",
      colorDark: "#00c853",
      weapon: "Sword & Shield",
      weaponDevanagari: "\u0916\u0921\u094D\u0917",
      stats: { hp: 100, speed: 225, attack: 14, defense: 7, specialDmg: 32 },
      taunt: "Too fast for your eyes!",
      taunt2: "My blade is unmatched!",
      taunt3: "Speed is the true weapon!",
      taunt4: "Watch and learn, brother!",
      winQuote: "Swift as the wind, sharp as justice!",
      defeatQuote: "My shield broke...",
      passive: {
        id: "blade_dance",
        name: "Blade Dance",
        desc: "Light attack cooldown reduced by 25%. Dodge cooldown reduced by 20%. First hit of a combo is guaranteed critical.",
        icon: "\u2694\uFE0F"
      },
      colors: {
        skin: "#dfa675",
        skinShadow: "#b58051",
        hair: "#2a1a1a",
        cloth: "#004d40",
        clothLight: "#00695c",
        armor: "#00897b",
        armorLight: "#26a69a",
        dhoti: "#b9f6ca",
        dhotiShadow: "#69f0ae",
        gold: "#ffd700",
        goldShadow: "#c8a000"
      }
    },
    {
      id: "yudhishthira",
      name: "Yudhishthira",
      title: "The Dharmic King",
      devanagari: "\u092F\u0941\u0927\u093F\u0937\u094D\u0920\u093F\u0930",
      color: "#ab47bc",
      colorDark: "#7b1fa2",
      weapon: "Divine Spear",
      weaponDevanagari: "\u0936\u0942\u0932",
      stats: { hp: 135, speed: 155, attack: 14, defense: 14, specialDmg: 38 },
      taunt: "Righteousness is my weapon.",
      taunt2: "Let dharma guide my hand.",
      taunt3: "A king fights for his people!",
      taunt4: "Justice will always prevail.",
      winQuote: "Dharma stands victorious today.",
      defeatQuote: "I have strayed from the path...",
      passive: {
        id: "dharma_aura",
        name: "Dharma's Aura",
        desc: "Slowly regenerates 1 HP every 2 seconds. Special attacks deal +15% damage.",
        icon: "\u{1F549}\uFE0F"
      },
      colors: {
        skin: "#e0ad84",
        skinShadow: "#bf8e65",
        hair: "#241a1a",
        cloth: "#4a148c",
        clothLight: "#6a1b9a",
        armor: "#8e24aa",
        armorLight: "#ab47bc",
        dhoti: "#ea80fc",
        dhotiShadow: "#e040fb",
        gold: "#ffd700",
        goldShadow: "#c8a000"
      }
    },
    // NEW LOCKED CHARACTERS (Unlocked via progression)
    {
      id: "abhimanyu",
      name: "Abhimanyu",
      title: "The Young Lion",
      devanagari: "\u0905\u092D\u093F\u092E\u0928\u094D\u092F\u0941",
      color: "#ff4081",
      colorDark: "#f50057",
      weapon: "Sword & Shield",
      weaponDevanagari: "\u0916\u0921\u094D\u0917",
      stats: { hp: 105, speed: 200, attack: 15, defense: 8, specialDmg: 36 },
      taunt: "I know how to enter the formation!",
      taunt2: "I will break the Chakravyuha!",
      taunt3: "For my father Arjuna!",
      taunt4: "A lion does not fear wolves!",
      winQuote: "The Chakravyuha could not hold me!",
      defeatQuote: "Father, I fought bravely...",
      passive: {
        id: "chakravyuha_tactician",
        name: "Chakravyuha Tactician",
        desc: "Immune to combo damage scaling \u2014 full damage on every combo hit. First hit of any round deals +30% damage.",
        icon: "\u{1F300}"
      },
      colors: {
        skin: "#e5b88f",
        skinShadow: "#c49770",
        hair: "#111111",
        cloth: "#ad1457",
        clothLight: "#d81b60",
        armor: "#fbc02d",
        armorLight: "#fff59d",
        dhoti: "#f8bbd0",
        dhotiShadow: "#f48fb1",
        gold: "#ffd700",
        goldShadow: "#c8a000"
      }
    },
    {
      id: "ashwatthama",
      name: "Ashwatthama",
      title: "The Immortal Rage",
      devanagari: "\u0905\u0936\u094D\u0935\u0924\u094D\u0925\u093E\u092E\u093E",
      color: "#00b0ff",
      colorDark: "#0091ea",
      weapon: "Sword",
      weaponDevanagari: "\u0916\u0921\u094D\u0917",
      stats: { hp: 120, speed: 160, attack: 17, defense: 10, specialDmg: 48 },
      taunt: "The gem on my forehead guides my blade!",
      taunt2: "Narayanastra will destroy you!",
      taunt3: "I cannot die \u2014 I can only rage!",
      taunt4: "My curse is my greatest weapon!",
      winQuote: "Immortality is its own punishment...",
      defeatQuote: "My curse is my eternal prison...",
      passive: {
        id: "immortal_resolve",
        name: "Immortal's Resolve",
        desc: "Once per match, survives fatal blow with 1 HP and triggers a shockwave that knocks the opponent back.",
        icon: "\u{1F525}"
      },
      colors: {
        skin: "#cfa282",
        skinShadow: "#a87e5e",
        hair: "#1f1c1c",
        cloth: "#01579b",
        clothLight: "#0288d1",
        armor: "#263238",
        armorLight: "#37474f",
        dhoti: "#b3e5fc",
        dhotiShadow: "#4fc3f7",
        gold: "#ffd700",
        goldShadow: "#c8a000"
      }
    },
    {
      id: "draupadi",
      name: "Draupadi",
      title: "Fire Born",
      devanagari: "\u0926\u094D\u0930\u094C\u092A\u0926\u0940",
      color: "#ff3d00",
      colorDark: "#dd2c00",
      weapon: "Sword",
      weaponDevanagari: "\u0916\u0921\u094D\u0917",
      stats: { hp: 95, speed: 180, attack: 16, defense: 7, specialDmg: 44 },
      taunt: "Born from the sacred fire!",
      taunt2: "Agni Dev, consume them!",
      taunt3: "Fire burns all evil away!",
      taunt4: "My vengeance will be legendary!",
      winQuote: "The fire within me cannot be extinguished!",
      defeatQuote: "Dharma must protect...",
      passive: {
        id: "sacred_flame",
        name: "Sacred Flame",
        desc: "Each time she takes damage, next attack deals +6% damage (stacks up to 5 times, +30% max). Resets on landing a hit.",
        icon: "\u{1F525}"
      },
      colors: {
        skin: "#d29f73",
        skinShadow: "#b08056",
        hair: "#0c0a0a",
        cloth: "#bf360c",
        clothLight: "#d84315",
        armor: "#e64a19",
        armorLight: "#ff7043",
        dhoti: "#ffccbc",
        dhotiShadow: "#ffab91",
        gold: "#ffd700",
        goldShadow: "#c8a000"
      }
    },
    {
      id: "bhishma",
      name: "Bhishma",
      title: "The Grand Patriarch",
      devanagari: "\u092D\u0940\u0937\u094D\u092E",
      color: "#eceff1",
      colorDark: "#b0bec5",
      weapon: "Gandiva Bow",
      // Heavy Bow wielder
      weaponDevanagari: "\u0927\u0928\u0941\u0937",
      stats: { hp: 150, speed: 110, attack: 17, defense: 16, specialDmg: 40 },
      taunt: "I hold the vow of absolute steel.",
      taunt2: "My arrow bed awaits.",
      taunt3: "I chose duty over happiness long ago.",
      taunt4: "These old bones still know war!",
      winQuote: "My vow remains unbroken till the end.",
      defeatQuote: "My vow is fulfilled...",
      passive: {
        id: "vow_of_protection",
        name: "Vow of Protection",
        desc: "Block absorbs 92% damage. Slowly regenerates 1 HP per 3 seconds while blocking.",
        icon: "\u{1F6E1}\uFE0F"
      },
      colors: {
        skin: "#d7ab87",
        skinShadow: "#ba8f6c",
        hair: "#eceff1",
        // White hair of age
        cloth: "#37474f",
        clothLight: "#455a64",
        armor: "#cfd8dc",
        // Silver armor
        armorLight: "#eceff1",
        dhoti: "#ffffff",
        dhotiShadow: "#cfd8dc",
        gold: "#ffd700",
        goldShadow: "#c8a000"
      }
    }
  ];

  // js/ui/settings.js
  var SettingsPanel = class {
    constructor(game) {
      this.game = game;
      this.active = false;
      this.selectedOption = 0;
      this.options = [
        { id: "volumeMaster", label: "Master Volume", type: "slider", min: 0, max: 1, step: 0.05 },
        { id: "volumeMusic", label: "Music Volume", type: "slider", min: 0, max: 1, step: 0.05 },
        { id: "volumeSfx", label: "SFX Volume", type: "slider", min: 0, max: 1, step: 0.05 },
        { id: "graphicsQuality", label: "Graphics Quality", type: "select", values: ["low", "medium", "high", "ultra"] },
        { id: "screenShakeEnabled", label: "Screen Shake", type: "toggle" },
        { id: "controlsMode", label: "Controls Type", type: "select", values: ["classic", "modern"] },
        { id: "back", label: "Save & Return", type: "button" }
      ];
    }
    toggle() {
      this.active = !this.active;
      if (this.active) {
        this.selectedOption = 0;
        this.game.audio.playSfx("select", 1.2);
      }
    }
    update(dt) {
      if (!this.active) return;
      if (this.game.input.isActionJustPressed("Jump") || this.game.input.keyJustPressed["ArrowUp"]) {
        this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
        this.game.audio.playSfx("select", 0.85);
      }
      if (this.game.input.isActionJustPressed("Dodge") || this.game.input.keyJustPressed["ArrowDown"]) {
        this.selectedOption = (this.selectedOption + 1) % this.options.length;
        this.game.audio.playSfx("select", 0.85);
      }
      const current = this.options[this.selectedOption];
      const settings = this.game.storage.getSettings();
      if (current.type === "slider") {
        let val = settings[current.id];
        if (this.game.input.keyJustPressed["ArrowLeft"]) {
          val = clamp2(val - current.step, current.min, current.max);
          this.updateValue(current.id, val);
          this.game.audio.playSfx("select", 1);
        }
        if (this.game.input.keyJustPressed["ArrowRight"]) {
          val = clamp2(val + current.step, current.min, current.max);
          this.updateValue(current.id, val);
          this.game.audio.playSfx("select", 1);
        }
      }
      if (current.type === "select") {
        const idx = current.values.indexOf(settings[current.id]);
        if (this.game.input.keyJustPressed["ArrowLeft"]) {
          const nextIdx = (idx - 1 + current.values.length) % current.values.length;
          this.updateValue(current.id, current.values[nextIdx]);
          this.game.audio.playSfx("select", 1);
        }
        if (this.game.input.keyJustPressed["ArrowRight"]) {
          const nextIdx = (idx + 1) % current.values.length;
          this.updateValue(current.id, current.values[nextIdx]);
          this.game.audio.playSfx("select", 1);
        }
      }
      if (current.type === "toggle") {
        if (this.game.input.keyJustPressed["ArrowLeft"] || this.game.input.keyJustPressed["ArrowRight"] || this.game.input.keyJustPressed["Enter"]) {
          this.updateValue(current.id, !settings[current.id]);
          this.game.audio.playSfx("select", 1);
        }
      }
      if (this.game.input.mouseClicked) {
        const mx = this.game.input.mousePos.x;
        const my = this.game.input.mousePos.y;
        const startY = 160;
        const spacingY = 50;
        for (let i = 0; i < this.options.length; i++) {
          const optY = startY + i * spacingY;
          if (my >= optY - 25 && my <= optY + 15) {
            this.selectedOption = i;
            const clickedOpt = this.options[i];
            if (clickedOpt.type === "button") {
              this.toggle();
              this.game.audio.playSfx("select", 1.3);
            } else if (clickedOpt.type === "toggle") {
              this.updateValue(clickedOpt.id, !settings[clickedOpt.id]);
              this.game.audio.playSfx("select", 1);
            } else if (clickedOpt.type === "select") {
              const idx = clickedOpt.values.indexOf(settings[clickedOpt.id]);
              const nextIdx = mx < CONFIG2.W / 2 ? (idx - 1 + clickedOpt.values.length) % clickedOpt.values.length : (idx + 1) % clickedOpt.values.length;
              this.updateValue(clickedOpt.id, clickedOpt.values[nextIdx]);
              this.game.audio.playSfx("select", 1);
            } else if (clickedOpt.type === "slider") {
              const barX = CONFIG2.W - 370;
              const barWidth = 150;
              if (mx >= barX && mx <= barX + barWidth) {
                const pct = (mx - barX) / barWidth;
                this.updateValue(clickedOpt.id, clamp2(pct, 0, 1));
                this.game.audio.playSfx("select", 1);
              }
            }
            break;
          }
        }
      }
      if (this.game.input.keyJustPressed["Enter"]) {
        if (current.id === "back") {
          this.toggle();
          this.game.audio.playSfx("select", 1.3);
        }
      }
      if (this.game.input.keyJustPressed["Escape"]) {
        this.toggle();
      }
    }
    updateValue(key, val) {
      const settings = this.game.storage.getSettings();
      settings[key] = val;
      this.game.storage.saveSettings(settings);
      this.game.audio.updateVolumes();
    }
    draw(ctx) {
      if (!this.active) return;
      ctx.save();
      ctx.fillStyle = "rgba(10, 10, 15, 0.9)";
      ctx.fillRect(0, 0, CONFIG2.W, CONFIG2.H);
      ctx.strokeStyle = "#dfa650";
      ctx.lineWidth = 2;
      ctx.strokeRect(100, 50, CONFIG2.W - 200, CONFIG2.H - 100);
      ctx.fillStyle = "#dfa650";
      ctx.font = "bold 32px Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText("CUSTOMIZATION & SETTINGS", CONFIG2.W / 2, 100);
      const startY = 160;
      const spacingY = 50;
      const settings = this.game.storage.getSettings();
      for (let i = 0; i < this.options.length; i++) {
        const opt = this.options[i];
        const val = settings[opt.id];
        const y = startY + i * spacingY;
        const isSelected = i === this.selectedOption;
        if (isSelected) {
          ctx.fillStyle = "rgba(223, 166, 80, 0.15)";
          ctx.fillRect(200, y - 25, CONFIG2.W - 400, 36);
          ctx.fillStyle = "#ffffff";
        } else {
          ctx.fillStyle = "#e8d5b0";
        }
        ctx.font = "bold 20px Rajdhani";
        ctx.textAlign = "left";
        ctx.fillText(opt.label, 220, y);
        ctx.textAlign = "right";
        if (opt.type === "slider") {
          const barWidth = 150;
          const fillWidth = val * barWidth;
          const barX = CONFIG2.W - 370;
          ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
          ctx.fillRect(barX, y - 12, barWidth, 10);
          ctx.fillStyle = isSelected ? "#ffd700" : "#b8966a";
          ctx.fillRect(barX, y - 12, fillWidth, 10);
          ctx.fillStyle = isSelected ? "#ffffff" : "#e8d5b0";
          ctx.fillText(Math.round(val * 100) + "%", CONFIG2.W - 220, y);
        } else if (opt.type === "select") {
          ctx.fillText(`<  ${val.toUpperCase()}  >`, CONFIG2.W - 220, y);
        } else if (opt.type === "toggle") {
          ctx.fillText(val ? "[ ENABLED ]" : "[ DISABLED ]", CONFIG2.W - 220, y);
        } else if (opt.type === "button") {
          ctx.textAlign = "center";
          ctx.fillText("PRESS ENTER TO SAVE", CONFIG2.W / 2, y);
        }
      }
      const binds = settings.keyBindings;
      ctx.fillStyle = "rgba(76, 175, 80, 0.9)";
      ctx.font = "bold 18px Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText(`PLAYER 1: Move [${binds.MoveLeft.toUpperCase()},${binds.Jump.toUpperCase()},${binds.Dodge.toUpperCase()},${binds.MoveRight.toUpperCase()}] | Light [${binds.AttackLight.toUpperCase()}] | Heavy [${binds.AttackHeavy.toUpperCase()}] | Special [${binds.Special.toUpperCase()}] | Block [${binds.Block.toUpperCase()}]`, CONFIG2.W / 2, CONFIG2.H - 130);
      ctx.fillStyle = "rgba(33, 150, 243, 0.9)";
      ctx.fillText(`PLAYER 2: Move [ARROWS] | Light [${binds.P2AttackLight.toUpperCase()}] | Heavy [${binds.P2AttackHeavy.toUpperCase()}] | Special [${binds.P2Special.toUpperCase()}] | Block [${binds.P2Block.toUpperCase()}]`, CONFIG2.W / 2, CONFIG2.H - 100);
      ctx.restore();
    }
  };

  // js/progression/achievements.js
  var ACHIEVEMENTS = [
    // ─── COMBAT & SKILL ACHIEVEMENTS ───────────────────────────
    { id: "first_blood", name: "First Blood", desc: "Win your first round of combat.", xp: 100 },
    { id: "perfect_victory", name: "Divine Perfect", desc: "Win a round without taking any damage.", xp: 500 },
    { id: "combo_10", name: "Combo Specialist", desc: "Execute a combo of 10 hits or more.", xp: 200 },
    { id: "combo_20", name: "Vayu's Torrent", desc: "Execute a combo of 20 hits or more.", xp: 500 },
    { id: "combo_30", name: "Unstoppable Storm", desc: "Execute a combo of 30 hits or more.", xp: 1e3 },
    { id: "heavy_hitter", name: "Titan Smash", desc: "Deal 150+ damage in a single hit.", xp: 150 },
    { id: "astra_finisher", name: "Godly Wrath", desc: "Defeat an opponent using a Divine Astra ultimate.", xp: 400 },
    { id: "clash_master", name: "Blade Wall", desc: "Trigger a weapon clash 3 times in a single match.", xp: 250 },
    { id: "juggle_god", name: "Gravity Defier", desc: "Hit an airborne opponent 5 times before they land.", xp: 300 },
    { id: "wall_breaker", name: "Stage Smasher", desc: "Trigger a wall break stage transition.", xp: 350 },
    // ─── MORALITY & ALIGNMENT ACHIEVEMENTS ──────────────────────
    { id: "pure_dharma", name: "Saintly Path", desc: "Reach 100 (Full Dharma) on the Karma meter.", xp: 300 },
    { id: "pure_adharma", name: "Demon King's Will", desc: "Reach -100 (Full Adharma) on the Karma meter.", xp: 300 },
    { id: "balance_point", name: "Middling Soul", desc: "Complete a fight with exactly 0 Karma.", xp: 250 },
    // ─── CHARACTER SPECIFIC RIVALRIES ───────────────────────────
    { id: "rival_arjuna_karna", name: "Epic Destiny", desc: "Defeat Karna as Arjuna.", xp: 300 },
    { id: "rival_bhima_duryodhana", name: "Broken Crown", desc: "Defeat Duryodhana as Bhima.", xp: 300 },
    { id: "guru_surpassed", name: "Pupil Outgrows Guru", desc: "Defeat Drona as Arjuna or Abhimanyu.", xp: 400 },
    { id: "patriarch_fall", name: "Fall of the Patriarch", desc: "Defeat Bhishma on the Arrow Bed stage.", xp: 500 },
    // ─── GAME MODES & CAMPAIGNS ───────────────────────────────
    { id: "arcade_easy", name: "Warrior Apprentice", desc: "Beat Arcade Mode on Easy difficulty.", xp: 300 },
    { id: "arcade_normal", name: "Champion of Bharat", desc: "Beat Arcade Mode on Normal difficulty.", xp: 600 },
    { id: "arcade_hard", name: "Grand Maharatha", desc: "Beat Arcade Mode on Hard difficulty.", xp: 1200 },
    { id: "survival_5", name: "Vanguard", desc: "Reach wave 5 in Survival Mode.", xp: 200 },
    { id: "survival_10", name: "Unbreakable Guard", desc: "Reach wave 10 in Survival Mode.", xp: 500 },
    { id: "survival_20", name: "Eternal Guardian", desc: "Reach wave 20 in Survival Mode.", xp: 1500 },
    // ─── GENERAL MILESTONES ──────────────────────────────────
    { id: "level_5", name: "Rising Star", desc: "Reach Player Level 5.", xp: 250 },
    { id: "level_10", name: "Revered Warrior", desc: "Reach Player Level 10.", xp: 500 },
    { id: "level_20", name: "Avatar of War", desc: "Reach Player Level 20.", xp: 1500 },
    { id: "rich_warrior", name: "Wealthy Merchant", desc: "Accumulate 1,000 Dharma Points (DP).", xp: 200 },
    { id: "hoarder", name: "Treasury Owner", desc: "Accumulate 5,000 Dharma Points (DP).", xp: 800 },
    { id: "unlock_all", name: "Ascended Roster", desc: "Unlock all locked characters.", xp: 1e3 }
  ];
  for (let i = 1; i <= 25; i++) {
    ACHIEVEMENTS.push({
      id: `custom_milestone_${i}`,
      name: `Valor Crest ${i}`,
      desc: `Earn ${i * 10} victory medals in local versus matches.`,
      xp: 50 + i * 10
    });
  }

  // js/ui/ui_system.js
  var UISystem = class {
    constructor(game) {
      this.game = game;
      this.settingsPanel = new SettingsPanel(game);
      this.toastText = "";
      this.toastTimer = 0;
      this.toastMaxTime = 2;
      this.selectedMenuItem = 0;
      this.pauseMenuSelection = 0;
      this.resultMenuSelection = 0;
      this.menuItems = ["Arcade Mode", "Story Mode", "Versus 2-Player", "Survival Mode", "Achievements", "Settings"];
    }
    showToast(text) {
      this.toastText = text;
      this.toastTimer = this.toastMaxTime;
    }
    update(dt) {
      if (this.settingsPanel.active) {
        this.settingsPanel.update(dt);
        return;
      }
      if (this.toastTimer > 0) {
        this.toastTimer -= dt;
      }
      if (this.game.state === "menu") {
        if (this.game.input.keyJustPressed["ArrowUp"] || this.game.input.keyJustPressed["w"] || this.game.input.keyJustPressed["W"]) {
          this.selectedMenuItem = (this.selectedMenuItem - 1 + this.menuItems.length) % this.menuItems.length;
          this.game.audio.playSfx("select", 0.85);
        }
        if (this.game.input.keyJustPressed["ArrowDown"] || this.game.input.keyJustPressed["s"] || this.game.input.keyJustPressed["S"]) {
          this.selectedMenuItem = (this.selectedMenuItem + 1) % this.menuItems.length;
          this.game.audio.playSfx("select", 0.85);
        }
        if (this.game.input.keyJustPressed["Enter"] || this.game.input.keyJustPressed[" "]) {
          this.confirmMenuSelection();
        }
        if (this.game.input.mouseClicked) {
          const mx = this.game.input.mousePos.x;
          const my = this.game.input.mousePos.y;
          if (mx > 400 && mx < 880) {
            const startY = CONFIG2.H / 2 + 50;
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
      if (this.game.state === "achievements") {
        if (this.game.input.keyJustPressed["Escape"] || this.game.input.keyJustPressed["Enter"] || this.game.input.mouseClicked) {
          this.game.state = "menu";
          this.game.audio.playSfx("select");
        }
      }
      if (this.game.state === "pause") {
        const kjp = "keyJustPressed";
        if (this.game.input[kjp]["ArrowUp"] || this.game.input[kjp]["w"]) {
          this.pauseMenuSelection = 0;
          this.game.audio.playSfx("select", 0.85);
        }
        if (this.game.input[kjp]["ArrowDown"] || this.game.input[kjp]["s"]) {
          this.pauseMenuSelection = 1;
          this.game.audio.playSfx("select", 0.85);
        }
        if (this.game.input[kjp]["Enter"]) {
          if (this.pauseMenuSelection === 0) {
            this.game.state = "battle";
          } else {
            this.game.state = "menu";
            this.game.audio.stopMusic();
          }
          this.game.audio.playSfx("select", 1.2);
        }
        if (this.game.input[kjp]["Escape"]) {
          this.game.state = "battle";
          this.game.audio.playSfx("select", 0.85);
        }
        if (this.game.input.mouseClicked) {
          const mx = this.game.input.mousePos.x;
          const my = this.game.input.mousePos.y;
          if (mx > 400 && mx < 880) {
            const startY = CONFIG2.H / 2;
            const spacingY = 50;
            if (my >= startY - 20 && my <= startY + 20) {
              this.pauseMenuSelection = 0;
              this.game.state = "battle";
              this.game.audio.playSfx("select", 1.2);
            } else if (my >= startY + spacingY - 20 && my <= startY + spacingY + 20) {
              this.pauseMenuSelection = 1;
              this.game.state = "menu";
              this.game.audio.stopMusic();
              this.game.audio.playSfx("select", 1.2);
            }
          }
        }
      }
      if (this.game.state === "result") {
        const kjp = "keyJustPressed";
        if (this.game.input[kjp]["ArrowLeft"] || this.game.input[kjp]["a"]) {
          this.resultMenuSelection = 0;
          this.game.audio.playSfx("select", 0.85);
        }
        if (this.game.input[kjp]["ArrowRight"] || this.game.input[kjp]["d"]) {
          this.resultMenuSelection = 1;
          this.game.audio.playSfx("select", 0.85);
        }
        if (this.game.input[kjp]["Enter"]) {
          if (this.resultMenuSelection === 0) {
            this.game.state = "battle";
            this.game.playerWins = 0;
            this.game.enemyWins = 0;
            this.game.round = 1;
            this.game.startRound();
          } else {
            this.game.state = "menu";
          }
          this.game.audio.playSfx("select", 1.2);
        }
        if (this.game.input.mouseClicked) {
          const mx = this.game.input.mousePos.x;
          const my = this.game.input.mousePos.y;
          if (my >= CONFIG2.H - 110 && my <= CONFIG2.H - 50) {
            const startX = CONFIG2.W / 2 - 150;
            const spacingX = 300;
            if (mx >= startX - 100 && mx <= startX + 100) {
              this.resultMenuSelection = 0;
              this.game.state = "battle";
              this.game.playerWins = 0;
              this.game.enemyWins = 0;
              this.game.round = 1;
              this.game.startRound();
              this.game.audio.playSfx("select", 1.2);
            } else if (mx >= startX + spacingX - 100 && mx <= startX + spacingX + 100) {
              this.resultMenuSelection = 1;
              this.game.state = "menu";
              this.game.audio.playSfx("select", 1.2);
            }
          }
        }
      }
      if (this.game.state === "characterSelect") {
      }
    }
    confirmMenuSelection() {
      this.game.audio.playSfx("select", 1.2);
      const selected = this.menuItems[this.selectedMenuItem];
      if (selected === "Arcade Mode") {
        this.game.state = "characterSelect";
        this.game.gameMode = "arcade";
      } else if (selected === "Story Mode") {
        this.game.state = "characterSelect";
        this.game.gameMode = "story";
      } else if (selected === "Versus 2-Player") {
        this.game.state = "characterSelect";
        this.game.gameMode = "versus2p";
      } else if (selected === "Survival Mode") {
        this.game.state = "characterSelect";
        this.game.gameMode = "survival";
        this.game.survivalWave = 1;
      } else if (selected === "Achievements") {
        this.game.state = "achievements";
      } else if (selected === "Settings") {
        this.settingsPanel.toggle();
      }
    }
    draw(ctx, state) {
      if (this.settingsPanel.active) {
        this.settingsPanel.draw(ctx);
        return;
      }
      switch (state) {
        case "menu":
          this.drawMainMenu(ctx);
          break;
        case "achievements":
          this.drawAchievementsScreen(ctx);
          break;
        case "characterSelect":
          this.drawCharacterSelect(ctx);
          break;
        case "battle":
          this.drawHUD(ctx);
          this.drawRoundIntro(ctx);
          this.drawToast(ctx);
          break;
        case "result":
          this.drawResults(ctx);
          break;
        case "pause":
          this.drawHUD(ctx);
          this.drawPauseMenu(ctx);
          break;
      }
    }
    drawMainMenu(ctx) {
      ctx.save();
      const bgGrad = ctx.createRadialGradient(CONFIG2.W / 2, CONFIG2.H / 2, 50, CONFIG2.W / 2, CONFIG2.H / 2, CONFIG2.H);
      bgGrad.addColorStop(0, "#1c1212");
      bgGrad.addColorStop(1, "#080505");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CONFIG2.W, CONFIG2.H);
      ctx.fillStyle = "rgba(223, 166, 80, 0.05)";
      ctx.font = "bold 200px Devanagari, Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText("\u0927\u0930\u094D\u092E\u092F\u0941\u0926\u094D\u0927", CONFIG2.W / 2, CONFIG2.H / 2 + 70);
      ctx.fillStyle = "#ff8f00";
      ctx.font = "900 70px Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText("DHARMYUDH", CONFIG2.W / 2, CONFIG2.H / 2 - 100);
      ctx.fillStyle = "#dfa650";
      ctx.font = "bold 24px Noto Sans Devanagari, Rajdhani";
      ctx.fillText("The Great War of Kurukshetra", CONFIG2.W / 2, CONFIG2.H / 2 - 50);
      const startY = CONFIG2.H / 2 + 50;
      const spacingY = 40;
      for (let i = 0; i < this.menuItems.length; i++) {
        const item = this.menuItems[i];
        const y = startY + i * spacingY;
        const isSelected = i === this.selectedMenuItem;
        if (isSelected) {
          ctx.fillStyle = "#ffd700";
          ctx.font = "bold 26px Rajdhani";
          ctx.fillText(`\u25B6  ${item.toUpperCase()}  \u25C0`, CONFIG2.W / 2, y);
        } else {
          ctx.fillStyle = "#b8966a";
          ctx.font = "bold 22px Rajdhani";
          ctx.fillText(item.toUpperCase(), CONFIG2.W / 2, y);
        }
      }
      ctx.restore();
    }
    drawCharacterSelect(ctx) {
      ctx.save();
      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, CONFIG2.W, CONFIG2.H);
      ctx.strokeStyle = "#dfa650";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, CONFIG2.W - 40, CONFIG2.H - 40);
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 36px Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText("SELECT YOUR WARRIOR", CONFIG2.W / 2, 65);
      const chData = CHARACTERS2[this.game.selectedChar];
      if (chData) {
        if (!this.selectedCharEntity || this.selectedCharEntity.id !== chData.id) {
          this.selectedCharEntity = new BaseCharacter(chData, true);
        }
        const cx = CONFIG2.W / 2;
        const cy = 300;
        const grad = ctx.createRadialGradient(cx, cy - 30, 10, cx, cy - 30, 200);
        grad.addColorStop(0, `${chData.color}35`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(cx - 250, cy - 230, 500, 400);
        ctx.save();
        ctx.translate(cx, cy + 40);
        ctx.scale(2.4, 2.4);
        this.selectedCharEntity.x = 0;
        this.selectedCharEntity.y = 0;
        this.selectedCharEntity.facing = 1;
        this.selectedCharEntity.state = "idle";
        this.selectedCharEntity.animTime = (this.selectedCharEntity.animTime || 0) + 1 / 60;
        this.game.charRenderer.draw(ctx, this.selectedCharEntity);
        ctx.restore();
        const isLocked = this.game.storage.data.progression.unlocks.lockedCharacters.includes(chData.id);
        if (isLocked) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(cx - 150, cy - 100, 300, 200);
          ctx.fillStyle = "#ff3b30";
          ctx.font = "bold 80px Rajdhani";
          ctx.textAlign = "center";
          ctx.fillText("\u{1F512}", cx, cy + 10);
          ctx.font = "bold 16px Rajdhani";
          ctx.fillText("LOCKED WARRIOR", cx, cy + 50);
          ctx.fillStyle = "#e8d5b0";
          ctx.fillText("Beat Arcade Mode to unlock!", cx, cy + 75);
        }
        ctx.fillStyle = chData.color;
        ctx.font = "bold 36px Rajdhani";
        ctx.textAlign = "center";
        ctx.fillText(chData.name.toUpperCase(), cx, 430);
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.font = "22px Noto Sans Devanagari, Rajdhani";
        ctx.fillText(chData.devanagari || "", cx, 460);
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.font = "italic 16px Rajdhani";
        ctx.fillText(chData.title.toUpperCase(), cx, 485);
        ctx.fillStyle = "rgba(255, 215, 0, 0.2)";
        ctx.font = "italic 15px Rajdhani";
        ctx.fillText(`"${chData.taunt}"`, cx, 510);
        if (chData.passive) {
          ctx.fillStyle = "#4fc3f7";
          ctx.font = "bold 14px Rajdhani";
          ctx.fillText(`${chData.passive.icon} ${chData.passive.name}`, cx, 530);
          ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
          ctx.font = "12px Rajdhani";
          ctx.fillText(chData.passive.desc, cx, 548);
        }
        const st = chData.passive ? 558 : 535;
        const sw = 250;
        const sh = 10;
        const sg = 18;
        const stats = [
          { label: "HP", val: chData.stats.hp, max: 200, color: "#ef5350" },
          { label: "ATK", val: chData.stats.attack, max: 25, color: "#ff7043" },
          { label: "DEF", val: chData.stats.defense, max: 18, color: "#42a5f5" },
          { label: "SPD", val: chData.stats.speed, max: 240, color: "#66bb6a" },
          { label: "SPC", val: chData.stats.specialDmg, max: 55, color: "#ab47bc" }
        ];
        stats.forEach((s, idx) => {
          const yy = st + idx * sg;
          const fillWidth = s.val / s.max * sw;
          ctx.textAlign = "left";
          ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
          ctx.font = "bold 12px Rajdhani";
          ctx.fillText(s.label, cx - sw / 2 - 35, yy + 8);
          ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
          ctx.fillRect(cx - sw / 2, yy, sw, sh);
          ctx.fillStyle = s.color;
          ctx.fillRect(cx - sw / 2, yy, fillWidth, sh);
        });
      }
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff8f00";
      ctx.font = "bold 15px Rajdhani";
      ctx.fillText("\u25C4  CLICK LEFT/RIGHT SIDE TO NAVIGATE  \u25BA", CONFIG2.W / 2, CONFIG2.H - 65);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px Rajdhani";
      ctx.fillText("PRESS ENTER OR CLICK MIDDLE TO CONFIRM  |  ESC TO RETURN", CONFIG2.W / 2, CONFIG2.H - 45);
      const binds = this.game.storage.getSettings().keyBindings;
      const p1Controls = `P1: Move [${binds.MoveLeft.toUpperCase()},${binds.Jump.toUpperCase()},${binds.Dodge.toUpperCase()},${binds.MoveRight.toUpperCase()}] Atk [${binds.AttackLight.toUpperCase()},${binds.AttackHeavy.toUpperCase()}] Spc [${binds.Special.toUpperCase()}] Blk [${binds.Block.toUpperCase()}]`;
      const p2Controls = this.game.gameMode === "versus2p" ? `  ||  P2: Move [ARROWS] Atk [${binds.P2AttackLight},${binds.P2AttackHeavy}] Spc [${binds.P2Special}] Blk [${binds.P2Block}]` : "";
      ctx.fillStyle = "#4caf50";
      ctx.font = "bold 14px Rajdhani";
      ctx.fillText(`CONTROLS: ${p1Controls}${p2Controls}`, CONFIG2.W / 2, CONFIG2.H - 20);
      ctx.restore();
    }
    drawHUD(ctx) {
      if (!this.game.player || !this.game.enemy) return;
      ctx.save();
      const pBX = 30, pBW = 320, pBY = 40;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px Rajdhani";
      ctx.textAlign = "left";
      ctx.fillText(this.game.playerChar.name, pBX, pBY);
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(pBX, pBY + 10, pBW, 18);
      const pHP = this.game.player.currentHp / this.game.player.hp;
      const pHpColor = pHP > 0.5 ? "#4caf50" : pHP > 0.25 ? "#ff9800" : "#f44336";
      ctx.fillStyle = pHpColor;
      ctx.fillRect(pBX, pBY + 10, pBW * pHP, 18);
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(pBX, pBY + 32, pBW, 8);
      const pEnergy = this.game.player.energy / this.game.player.maxEnergy;
      ctx.fillStyle = "#00e5ff";
      ctx.fillRect(pBX, pBY + 32, pBW * pEnergy, 8);
      const eBX = CONFIG2.W - 350, eBW = 320, eBY = 40;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px Rajdhani";
      ctx.textAlign = "right";
      ctx.fillText(this.game.enemyChar.name, CONFIG2.W - 30, eBY);
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(eBX, eBY + 10, eBW, 18);
      const eHP = this.game.enemy.currentHp / this.game.enemy.hp;
      const eHpColor = eHP > 0.5 ? "#4caf50" : eHP > 0.25 ? "#ff9800" : "#f44336";
      ctx.fillStyle = eHpColor;
      ctx.fillRect(eBX + (eBW - eBW * eHP), eBY + 10, eBW * eHP, 18);
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 36px Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText(Math.ceil(this.game.battleTimer), CONFIG2.W / 2, 55);
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.fillRect(CONFIG2.W / 2 - 40, 70, 80, 26);
      ctx.strokeRect(CONFIG2.W / 2 - 40, 70, 80, 26);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px Rajdhani";
      ctx.fillText("\u23F8 PAUSE", CONFIG2.W / 2, 87);
      if (this.game.comboCount > 1) {
        ctx.fillStyle = "#ff8f00";
        ctx.font = "bold 44px Rajdhani";
        ctx.fillText(`${this.game.comboCount} HITS!`, CONFIG2.W / 2, 130);
      }
      ctx.restore();
    }
    drawRoundIntro(ctx) {
      if (this.game.roundIntroTimer <= 0) return;
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, CONFIG2.H / 2 - 80, CONFIG2.W, 160);
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 48px Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText(`ROUND ${this.game.round}`, CONFIG2.W / 2, CONFIG2.H / 2 - 10);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Rajdhani";
      ctx.fillText("PREPARE FOR BATTLE", CONFIG2.W / 2, CONFIG2.H / 2 + 35);
      ctx.restore();
    }
    drawToast(ctx) {
      if (this.toastTimer <= 0) return;
      ctx.save();
      ctx.globalAlpha = clamp2(this.toastTimer / 0.5, 0, 1);
      ctx.fillStyle = "rgba(10, 10, 10, 0.85)";
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 1;
      ctx.fillRect(CONFIG2.W / 2 - 200, CONFIG2.H - 120, 400, 50);
      ctx.strokeRect(CONFIG2.W / 2 - 200, CONFIG2.H - 120, 400, 50);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText(this.toastText, CONFIG2.W / 2, CONFIG2.H - 90);
      ctx.restore();
    }
    drawResults(ctx) {
      ctx.save();
      ctx.fillStyle = "rgba(5, 5, 10, 0.96)";
      ctx.fillRect(0, 0, CONFIG2.W, CONFIG2.H);
      ctx.strokeStyle = "#dfa650";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, CONFIG2.W - 40, CONFIG2.H - 40);
      const res = this.game.lastMatchResults;
      if (res) {
        const isWin = res.winner === "player";
        ctx.fillStyle = isWin ? "#ffd700" : "#ff3b30";
        ctx.font = "bold 64px Rajdhani";
        ctx.textAlign = "center";
        ctx.fillText(isWin ? "VICTORY" : "DEFEAT", CONFIG2.W / 2, CONFIG2.H / 2 - 130);
        ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.fillRect(CONFIG2.W / 2 - 250, CONFIG2.H / 2 - 80, 500, 160);
        ctx.strokeRect(CONFIG2.W / 2 - 250, CONFIG2.H / 2 - 80, 500, 160);
        ctx.fillStyle = "#e8d5b0";
        ctx.font = "bold 20px Rajdhani";
        ctx.textAlign = "left";
        ctx.fillText(`WARRIOR LEVEL: ${res.newLevel}`, CONFIG2.W / 2 - 200, CONFIG2.H / 2 - 40);
        ctx.fillText(`XP EARNED: +${res.xpEarned} XP`, CONFIG2.W / 2 - 200, CONFIG2.H / 2 - 10);
        ctx.fillText(`DHARMA POINTS: +${res.dpEarned} DP`, CONFIG2.W / 2 - 200, CONFIG2.H / 2 + 20);
        if (res.leveledUp) {
          ctx.fillStyle = "#4cd964";
          ctx.font = "bold 22px Rajdhani";
          ctx.fillText("LEVEL UP!", CONFIG2.W / 2 + 80, CONFIG2.H / 2 - 10);
        }
        if (res.unlockedAchievements && res.unlockedAchievements.length > 0) {
          ctx.fillStyle = "#ffd700";
          ctx.font = "bold 16px Rajdhani";
          ctx.textAlign = "center";
          ctx.fillText(`UNLOCKED AWARDS: ${res.unlockedAchievements.join(", ")}`, CONFIG2.W / 2, CONFIG2.H / 2 + 130);
        }
      } else {
        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 50px Rajdhani";
        ctx.textAlign = "center";
        ctx.fillText("BATTLE OVER", CONFIG2.W / 2, CONFIG2.H / 2 - 50);
      }
      const opts = ["PLAY AGAIN", "MAIN MENU"];
      const startX = CONFIG2.W / 2 - 150;
      const spacingX = 300;
      for (let i = 0; i < opts.length; i++) {
        const isSelected = i === this.resultMenuSelection;
        const x = startX + i * spacingX;
        if (isSelected) {
          ctx.fillStyle = "#ff8f00";
          ctx.font = "bold 24px Rajdhani";
          ctx.textAlign = "center";
          ctx.fillText(`\u25B6 ${opts[i]} \u25C0`, x, CONFIG2.H - 80);
        } else {
          ctx.fillStyle = "#b8966a";
          ctx.font = "bold 20px Rajdhani";
          ctx.textAlign = "center";
          ctx.fillText(opts[i], x, CONFIG2.H - 80);
        }
      }
      ctx.restore();
    }
    drawPauseMenu(ctx) {
      ctx.save();
      ctx.fillStyle = "rgba(5, 5, 10, 0.85)";
      ctx.fillRect(0, 0, CONFIG2.W, CONFIG2.H);
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 64px Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText("PAUSED", CONFIG2.W / 2, CONFIG2.H / 2 - 80);
      const pauseOptions = ["Resume Battle", "Quit to Menu"];
      const startY = CONFIG2.H / 2;
      const spacingY = 50;
      for (let i = 0; i < pauseOptions.length; i++) {
        const item = pauseOptions[i];
        const y = startY + i * spacingY;
        const isSelected = i === this.pauseMenuSelection;
        if (isSelected) {
          ctx.fillStyle = "#ff8f00";
          ctx.font = "bold 26px Rajdhani";
          ctx.fillText(`\u25B6  ${item.toUpperCase()}  \u25C0`, CONFIG2.W / 2, y);
        } else {
          ctx.fillStyle = "#b8966a";
          ctx.font = "bold 22px Rajdhani";
          ctx.fillText(item.toUpperCase(), CONFIG2.W / 2, y);
        }
      }
      const cardX = CONFIG2.W / 2 - 250;
      const cardY = CONFIG2.H / 2 + 100;
      const cardW = 500;
      const cardH = 180;
      ctx.fillStyle = "rgba(20, 20, 35, 0.85)";
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 18px Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText("\u2694 MOVE LIST & CONTROLS GUIDE", CONFIG2.W / 2, cardY + 28);
      ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardX + 20, cardY + 36);
      ctx.lineTo(cardX + cardW - 20, cardY + 36);
      ctx.stroke();
      ctx.font = "15px Rajdhani";
      ctx.textAlign = "left";
      ctx.fillStyle = "#e8d5b0";
      ctx.fillText("Move Left / Right:", cardX + 30, cardY + 62);
      ctx.fillText("Jump / Dodge:", cardX + 30, cardY + 90);
      ctx.fillText("Light / Heavy Attack:", cardX + 30, cardY + 118);
      ctx.fillText("Astra Special (100% Karma):", cardX + 30, cardY + 146);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffb300";
      ctx.fillText("A / D  or  \u2190 / \u2192", cardX + cardW - 30, cardY + 62);
      ctx.fillText("W (Jump)  /  L-Shift (Dodge)", cardX + cardW - 30, cardY + 90);
      ctx.fillText("J (Light)  /  K (Heavy)", cardX + cardW - 30, cardY + 118);
      ctx.fillText("L  or  Num 3", cardX + cardW - 30, cardY + 146);
      ctx.restore();
    }
    drawAchievementsScreen(ctx) {
      ctx.save();
      ctx.fillStyle = "rgba(5, 5, 10, 0.95)";
      ctx.fillRect(0, 0, CONFIG2.W, CONFIG2.H);
      ctx.strokeStyle = "#dfa650";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, CONFIG2.W - 40, CONFIG2.H - 40);
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 36px Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText("WARRIOR AWARDS & ACHIEVEMENTS", CONFIG2.W / 2, 60);
      const earned = this.game.storage.data.progression.achievements;
      ctx.fillStyle = "#e8d5b0";
      ctx.font = "18px Rajdhani";
      ctx.fillText(`Unlocked: ${earned.length} / ${ACHIEVEMENTS.length} achievements`, CONFIG2.W / 2, 90);
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
        ctx.fillStyle = isCompleted ? "rgba(223, 166, 80, 0.12)" : "rgba(255, 255, 255, 0.03)";
        ctx.fillRect(x, y, 350, 75);
        ctx.strokeStyle = isCompleted ? "#ffd700" : "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, 350, 75);
        ctx.fillStyle = isCompleted ? "#ffd700" : "#666";
        ctx.font = "bold 16px Rajdhani";
        ctx.textAlign = "left";
        ctx.fillText(ach.name.toUpperCase(), x + 15, y + 25);
        ctx.fillStyle = isCompleted ? "#ffd700" : "#888";
        ctx.font = "bold 12px Rajdhani";
        ctx.textAlign = "right";
        ctx.fillText(`+${ach.xp} XP`, x + 335, y + 25);
        ctx.fillStyle = isCompleted ? "#e8d5b0" : "#555";
        ctx.font = "13px Rajdhani";
        ctx.textAlign = "left";
        const descText = ach.desc;
        ctx.fillText(descText, x + 15, y + 50);
      }
      ctx.fillStyle = "#ff8f00";
      ctx.font = "bold 16px Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText("CLICK ANYWHERE OR PRESS ENTER TO RETURN", CONFIG2.W / 2, CONFIG2.H - 45);
      ctx.restore();
    }
  };

  // js/progression/progression.js
  var ProgressionManager = class {
    constructor(game) {
      this.game = game;
    }
    // Award XP and Dharma Points at the end of a match
    awardMatchRewards(winner, playerKills = 0, roundsPlayed = 2) {
      const isWin = winner === "player";
      let xpEarned = isWin ? 500 : 150;
      xpEarned += roundsPlayed * 50;
      xpEarned += playerKills * 100;
      let dpEarned = isWin ? 50 : 10;
      dpEarned += playerKills * 10;
      const result = this.game.storage.addXP(xpEarned);
      this.game.storage.addDharmaPoints(dpEarned);
      if (this.game.gameMode === "survival") {
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
      if (fightStats.maxCombo >= 10) {
        if (storage.completeAchievement("combo_10")) {
          unlocks.push("Combo Master (10+ Hits)");
        }
      }
      if (fightStats.perfectRound) {
        if (storage.completeAchievement("perfect_victory")) {
          unlocks.push("Divine Perfect (Win without taking damage)");
        }
      }
      if (fightStats.firstWin) {
        if (storage.completeAchievement("first_blood")) {
          unlocks.push("First Blood (Win your first round)");
        }
      }
      if (this.game.playerChar.id === "arjuna" && this.game.enemyChar.id === "karna" && fightStats.wonMatch) {
        if (storage.completeAchievement("rival_arjuna_karna")) {
          unlocks.push("Epic Destiny (Defeat Karna as Arjuna)");
        }
      }
      return unlocks;
    }
  };

  // js/modes/story.js
  var STORY_CAMPAIGNS = {
    arjuna: {
      title: "The Path of the Archer",
      chapters: [
        {
          opponentId: "drona",
          title: "Chapter 1: The Guru's Blessing",
          intro: [
            "Drona: Arjuna, your focus is unmatched, but a true archer sees only the eye of the bird. Are you ready for the ultimate test of your training?",
            "Arjuna: Guru-dev, my Gandiva is always ready. I seek only your guidance and blessing on the path of dharma.",
            "Drona: Show me your resolve. Draw your bow!"
          ],
          outro: [
            "Drona: Excellent, Arjuna! You have surpassed my expectations. The sky itself shall witness your arrows.",
            "Arjuna: I am humbled, Guru-dev. Your teachings are my armor."
          ]
        },
        {
          opponentId: "karna",
          title: "Chapter 2: The Duel of Destiny",
          intro: [
            "Karna: Arjuna! The world calls you the greatest, but today the sun shall witness who truly rules the bow.",
            "Arjuna: Karna, your strength is legendary, but your path lies in the shadows of adharma. I must fight to defend the righteous.",
            "Karna: Dharma is decided by the victors. Let our arrows speak!"
          ],
          outro: [
            "Arjuna: Your skill is peerless, Karna. But your arrows could not pierce the shield of truth.",
            "Karna: The day is yours, Arjuna. But our final battle is yet to come under the eyes of the gods."
          ]
        },
        {
          opponentId: "krishna",
          title: "Chapter 3: The Divine Revelation",
          intro: [
            "Krishna: Partha, you have triumphed over your rivals, but do you understand the true nature of the war you fight?",
            "Arjuna: Madhava, my heart is heavy with the sight of my kinsmen. Guide me, for I am lost in doubt.",
            "Krishna: Lift your Gandiva, Partha! Fight not for victory, but for duty. Let me test your spiritual readiness!"
          ],
          outro: [
            "Krishna: You have understood, Arjuna. Let your action be your reward. The battlefield of Kurukshetra awaits you.",
            "Arjuna: My doubts are cleared, Madhava. I am ready to fight for dharma!"
          ]
        }
      ]
    },
    bhima: {
      title: "The Might of the Wind",
      chapters: [
        {
          opponentId: "duryodhana",
          title: "Chapter 1: The Rivalry of Mace",
          intro: [
            "Duryodhana: Bhima! You think your raw strength can defeat the crown prince of Hastinapura? My iron mace will shatter your pride today.",
            "Bhima: Duryodhana! Your sins have filled the pot of adharma. My mace shall break your thighs and free this land from your tyranny.",
            "Duryodhana: Empty words, beast! Draw your weapon!"
          ],
          outro: [
            "Bhima: Your crown lies in the dust, Duryodhana. Your reign of greed ends here.",
            "Duryodhana: This is but a temporary setback. I will return stronger!"
          ]
        }
      ]
    },
    karna: {
      title: "The Sun Warrior's Loyalty",
      chapters: [
        {
          opponentId: "arjuna",
          title: "Chapter 1: The Ultimate Rivalry",
          intro: [
            "Arjuna: Karna, you have chosen to stand with the wicked. The Gandiva bow will show you the path of dharma.",
            "Karna: Arjuna, I fight not for Duryodhana's crown, but for the vow of friendship I made. I shall prove my loyalty with my blood.",
            "Arjuna: Let the arrows of destiny fly!"
          ],
          outro: [
            "Karna: The Vijaya bow has triumphed this day. But my respect for your skill remains undiminished, Partha.",
            "Arjuna: You are a noble warrior, Karna. It is a tragedy that we must meet as foes."
          ]
        }
      ]
    }
  };
  var StoryModeEngine = class {
    constructor(game) {
      this.game = game;
      this.active = false;
      this.currentChapter = 0;
      this.dialogueIdx = 0;
      this.inDialogue = false;
      this.dialogueMode = "intro";
    }
    startCampaign(charId) {
      this.campaign = STORY_CAMPAIGNS[charId] || STORY_CAMPAIGNS["arjuna"];
      this.currentChapter = 0;
      this.dialogueIdx = 0;
      this.inDialogue = true;
      this.dialogueMode = "intro";
      this.game.state = "battle";
      this.game.gameMode = "story";
      this.game.playerChar = CHARACTERS.find((c) => c.id === charId) || CHARACTERS[0];
      this.setChapterOpponent();
    }
    setChapterOpponent() {
      const chapter = this.campaign.chapters[this.currentChapter];
      this.game.enemyChar = CHARACTERS.find((c) => c.id === chapter.opponentId) || CHARACTERS[1];
    }
    update(dt) {
      if (!this.inDialogue) return;
      if (this.game.input.keyJustPressed["Enter"] || this.game.input.mouseClicked) {
        this.game.audio.playSfx("select", 1);
        this.dialogueIdx++;
        const chapter = this.campaign.chapters[this.currentChapter];
        const dialogues = this.dialogueMode === "intro" ? chapter.intro : chapter.outro;
        if (this.dialogueIdx >= dialogues.length) {
          this.inDialogue = false;
          this.dialogueIdx = 0;
          if (this.dialogueMode === "intro") {
            this.game.startRound();
          } else {
            this.currentChapter++;
            if (this.currentChapter >= this.campaign.chapters.length) {
              this.game.state = "result";
              this.game.ui.showToast("Campaign Completed successfully!");
            } else {
              this.setChapterOpponent();
              this.dialogueMode = "intro";
              this.inDialogue = true;
            }
          }
        }
      }
    }
    draw(ctx) {
      if (!this.inDialogue) return;
      ctx.save();
      ctx.fillStyle = "rgba(5, 5, 8, 0.88)";
      ctx.fillRect(50, CONFIG.H - 220, CONFIG.W - 100, 180);
      ctx.strokeStyle = "#dfa650";
      ctx.lineWidth = 2;
      ctx.strokeRect(50, CONFIG.H - 220, CONFIG.W - 100, 180);
      const chapter = this.campaign.chapters[this.currentChapter];
      const dialogues = this.dialogueMode === "intro" ? chapter.intro : chapter.outro;
      const currentLine = dialogues[this.dialogueIdx];
      if (currentLine) {
        const parts = currentLine.split(":");
        const speaker = parts[0];
        const text = parts[1] || "";
        ctx.fillStyle = "#ff8f00";
        ctx.font = "bold 24px Rajdhani";
        ctx.fillText(speaker.toUpperCase(), 80, CONFIG.H - 180);
        ctx.fillStyle = "#e8d5b0";
        ctx.font = "20px Rajdhani";
        this.wrapText(ctx, text.trim(), 80, CONFIG.H - 140, CONFIG.W - 160, 26);
      }
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "12px Rajdhani";
      ctx.textAlign = "right";
      ctx.fillText("PRESS ENTER OR CLICK TO CONTINUE", CONFIG.W - 80, CONFIG.H - 60);
      ctx.restore();
    }
    // Text wrapper utility
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
      const words = text.split(" ");
      let line = "";
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + " ";
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, y);
          line = words[n] + " ";
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, y);
    }
  };

  // js/modes/game_modes.js
  var GameModesController = class {
    constructor(game) {
      this.game = game;
      this.arcadeLadder = [];
      this.arcadeStageIdx = 0;
      this.trainingDummyState = "dummy_idle";
    }
    // ─── ARCADE MODE LADDER ─────────────────────────────────────
    startArcadeMode(playerCharId) {
      this.arcadeStageIdx = 0;
      this.game.gameMode = "arcade";
      this.game.state = "battle";
      this.game.playerChar = CHARACTERS2.find((c) => c.id === playerCharId) || CHARACTERS2[0];
      const opponents = CHARACTERS2.filter((c) => c.id !== playerCharId);
      for (let i = opponents.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opponents[i], opponents[j]] = [opponents[j], opponents[i]];
      }
      this.arcadeLadder = opponents.slice(0, 5);
      this.game.enemyChar = this.arcadeLadder[0];
      this.game.playerWins = 0;
      this.game.enemyWins = 0;
      this.game.round = 1;
      this.game.startRound();
    }
    advanceArcadeStage() {
      this.arcadeStageIdx++;
      if (this.arcadeStageIdx >= this.arcadeLadder.length) {
        this.game.state = "result";
        this.game.storage.data.progression.arcadeBeaten = true;
        this.game.storage.save();
        this.game.ui.showToast("Arcade Mode Completed! Rank Up!");
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
      this.game.gameMode = "versus2p";
      this.game.state = "battle";
      this.game.playerChar = CHARACTERS2.find((c) => c.id === p1CharId) || CHARACTERS2[0];
      this.game.enemyChar = CHARACTERS2.find((c) => c.id === p2CharId) || CHARACTERS2[1];
      this.game.playerWins = 0;
      this.game.enemyWins = 0;
      this.game.round = 1;
      this.game.startRound();
    }
    updatePlayer2Controls(entity, dt) {
      if (entity.attacking || entity.hitstun > 0 || entity.died) return;
      let speed = entity.speed;
      entity.blocking = !!(this.game.input.isActionPressed("Block", 2) && entity.grounded);
      if (entity.blocking) speed *= 0.5;
      let moveIntent = 0;
      if (this.game.input.isActionPressed("MoveLeft", 2)) {
        entity.x -= speed * dt;
        moveIntent = -1;
      }
      if (this.game.input.isActionPressed("MoveRight", 2)) {
        entity.x += speed * dt;
        moveIntent = 1;
      }
      if (moveIntent !== 0 && entity.grounded && Math.random() < 0.15) {
        this.game.particles.spawn(entity.x - entity.facing * 10, CONFIG2.GROUND_Y, { type: "smoke", color: "#888", size: 5, speed: 30 });
      }
      if (this.game.input.isActionJustPressed("Jump", 2) && entity.grounded) {
        entity.velocityY = -650;
        entity.grounded = false;
        this.game.audio.playSfx("jump", rng(0.85, 1.15));
      }
      if (this.game.input.isActionJustPressed("Dodge", 2) && entity.dodgeCooldown <= 0 && entity.grounded) {
        entity.dodgeTimer = 0.15;
        entity.dodgeCooldown = 0.6;
        entity.invTimer = 0.2;
        entity.velocityX = entity.facing * -450;
        this.game.audio.playSfx("dodge");
      }
      if (this.game.input.isActionJustPressed("AttackLight", 2) && entity.attackCooldown <= 0) {
        this.game.performAttack(entity, this.game.player, "light");
      } else if (this.game.input.isActionJustPressed("AttackHeavy", 2) && entity.attackCooldown <= 0) {
        this.game.performAttack(entity, this.game.player, "heavy");
      } else if (this.game.input.isActionJustPressed("Special", 2) && entity.specialCooldown <= 0 && entity.energy >= CONFIG2.SPECIAL_COST) {
        this.game.performSpecial(entity, this.game.player);
      }
    }
    // ─── TRAINING PRACTICE MODE ────────────────────────────────
    startTrainingMode(playerCharId, dummyCharId) {
      this.game.gameMode = "training";
      this.game.state = "battle";
      this.game.playerChar = CHARACTERS2.find((c) => c.id === playerCharId) || CHARACTERS2[0];
      this.game.enemyChar = CHARACTERS2.find((c) => c.id === dummyCharId) || CHARACTERS2[1];
      this.game.playerWins = 0;
      this.game.enemyWins = 0;
      this.game.round = 1;
      this.game.startRound();
    }
    updateTrainingDummy(entity, dt, opp) {
      if (entity.died) {
        setTimeout(() => {
          if (entity.died) {
            entity.died = false;
            entity.currentHp = entity.hp;
            entity.x = CONFIG2.W - 220;
            entity.y = CONFIG2.GROUND_Y;
            entity.velocityY = 0;
            entity.velocityX = 0;
            entity.state = "idle";
            this.game.particles.spawn(entity.x, entity.y, { type: "aura", color: "#00e5ff", size: 40 });
          }
        }, 1e3);
        return;
      }
      opp.energy = opp.maxEnergy;
      entity.energy = entity.maxEnergy;
      if (this.game.comboCount === 0 && entity.currentHp < entity.hp && entity.hitstun <= 0) {
        entity.currentHp = entity.hp;
      }
      entity.blocking = this.trainingDummyState === "dummy_block";
      if (this.trainingDummyState === "dummy_jump" && entity.grounded) {
        entity.velocityY = -650;
        entity.grounded = false;
      }
      if (this.trainingDummyState === "dummy_fight") {
        this.game.updateAIControls(entity, dt, opp);
      }
    }
    drawTrainingOverlay(ctx) {
      if (this.game.gameMode !== "training") return;
      ctx.save();
      ctx.fillStyle = "rgba(10, 10, 15, 0.65)";
      ctx.fillRect(CONFIG2.W / 2 - 180, 80, 360, 45);
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 1;
      ctx.strokeRect(CONFIG2.W / 2 - 180, 80, 360, 45);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px Rajdhani";
      ctx.textAlign = "center";
      const dummyModeText = this.trainingDummyState.replace("dummy_", "").toUpperCase();
      ctx.fillText(`PRACTICE MODE  |  DUMMY: ${dummyModeText}`, CONFIG2.W / 2, 108);
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(30, 150, 240, 110);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.strokeRect(30, 150, 240, 110);
      ctx.fillStyle = "#b8966a";
      ctx.font = "bold 14px Rajdhani";
      ctx.textAlign = "left";
      ctx.fillText("DUMMY CONTROL KEYS:", 45, 175);
      ctx.fillStyle = "#ffffff";
      ctx.fillText("[T] Toggle Idle / Block", 45, 200);
      ctx.fillText("[Y] Toggle Jump dummy", 45, 225);
      ctx.fillText("[U] Toggle CPU Fight", 45, 250);
      ctx.restore();
    }
    handleTrainingInputs() {
      if (this.game.gameMode !== "training") return;
      if (this.game.input.keyJustPressed["t"] || this.game.input.keyJustPressed["T"]) {
        this.trainingDummyState = this.trainingDummyState === "dummy_block" ? "dummy_idle" : "dummy_block";
        this.game.audio.playSfx("select");
      }
      if (this.game.input.keyJustPressed["y"] || this.game.input.keyJustPressed["Y"]) {
        this.trainingDummyState = this.trainingDummyState === "dummy_jump" ? "dummy_idle" : "dummy_jump";
        this.game.audio.playSfx("select");
      }
      if (this.game.input.keyJustPressed["u"] || this.game.input.keyJustPressed["U"]) {
        this.trainingDummyState = this.trainingDummyState === "dummy_fight" ? "dummy_idle" : "dummy_fight";
        this.game.audio.playSfx("select");
      }
    }
  };

  // js/combat/combat_upgrade.js
  var CombatUpgradeSystem = class {
    constructor(game) {
      this.game = game;
      this.karma = 0;
      this.astraActive = false;
      this.astraTimer = 0;
      this.astraCaster = null;
      this.astraCutsceneProgress = 0;
    }
    // Adjust karma balance based on actions
    adjustKarma(amount) {
      if (this.game.gameMode === "training") return;
      const prevKarma = this.karma;
      this.karma = clamp2(this.karma + amount, -100, 100);
      if (prevKarma < 100 && this.karma === 100) {
        this.game.ui.showToast("DIVINE ASTRA UNLOCKED! (Full Dharma)");
        this.game.audio.playSfx("win", 1.5);
      }
      if (prevKarma > -100 && this.karma === -100) {
        this.game.ui.showToast("DARK ASTRA UNLOCKED! (Full Adharma)");
        this.game.audio.playSfx("death", 1.5);
      }
    }
    update(dt) {
      if (this.astraActive) {
        this.astraTimer -= dt;
        this.astraCutsceneProgress = 1 - this.astraTimer / 2;
        this.game.hitStopTimer = 0.1;
        this.game.renderer.cameraZoom = 1.5 + Math.sin(this.astraCutsceneProgress * Math.PI) * 0.4;
        this.game.renderer.triggerShake(5);
        if (this.astraTimer <= 0) {
          this.executeAstraAttack();
        }
      }
    }
    // ─── ASTRA SYSTEM (Divine Ultimates) ────────────────────────
    triggerAstra(caster) {
      if (this.astraActive) return;
      this.astraActive = true;
      this.astraTimer = 2;
      this.astraCaster = caster;
      this.astraCutsceneProgress = 0;
      this.game.audio.playSfx("special", 0.5, 2);
      this.game.renderer.triggerShake(20);
      const color = this.karma >= 0 ? "#ffd700" : "#d50000";
      for (let i = 0; i < 30; i++) {
        this.game.particles.spawn(caster.x, caster.y - 60, {
          type: "aura",
          color,
          speed: rng(150, 300),
          life: 1.5,
          size: rng(15, 30)
        });
      }
      this.game.ui.showToast(`${caster.name.toUpperCase()} SUMMONS THE ASTRA!`);
    }
    executeAstraAttack() {
      this.astraActive = false;
      const caster = this.astraCaster;
      const opp = caster === this.game.player ? this.game.enemy : this.game.player;
      const rawDamage = opp.hp * 0.45;
      this.game.flashEffect = 0.8;
      this.game.audio.playSfx("ko", 1, 2);
      opp.takeDamage(rawDamage, caster.facing * 500, -450);
      const color = this.karma >= 0 ? "#ffd700" : "#880e4f";
      this.game.particles.spawnHeavyHitSparks(opp.x, opp.y - 50, color);
      this.karma = 0;
      this.astraCaster = null;
    }
    // ─── WEAPON CLASH SYSTEM ──────────────────────────────────
    checkWeaponClash(p1, p2) {
      if (p1.attacking && p1.attackFrame === 2 && p2.attacking && p2.attackFrame === 2) {
        const distance = Math.abs(p1.x - p2.x);
        if (distance < 110) {
          p1.attacking = false;
          p2.attacking = false;
          p1.attackCooldown = 0.5;
          p2.attackCooldown = 0.5;
          p1.velocityX = p1.facing * -200;
          p2.velocityX = p2.facing * -200;
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2 - 40;
          this.game.particles.spawnHitSparks(midX, midY, "#ffffff");
          this.game.particles.spawn(midX, midY, { type: "ring", color: "#ffb300", size: 40 });
          this.game.particles.spawnFloatingText(midX, midY - 30, "CLASH!", "#ffd700");
          this.game.hitStopTimer = 0.15;
          this.game.audio.playSfx("clash");
          this.game.renderer.triggerShake(10);
          return true;
        }
      }
      return false;
    }
    // ─── JUGGLE PHYSICS SYSTEM ────────────────────────────────
    applyJuggleForce(entity, knockbackY) {
      if (!entity.grounded) {
        entity.velocityY = Math.max(-550, entity.velocityY + knockbackY * 0.75);
        entity.velocityX *= 1.1;
        this.game.particles.spawnFloatingText(entity.x, entity.y - 90, "JUGGLE!", "#ffd700");
      }
    }
    // ─── WALL BREAK & STAGE TRANSITIONS ────────────────────────
    checkStageTransition(entity) {
      const minX = 50;
      const maxX = CONFIG2.W - 50;
      if ((entity.x <= minX || entity.x >= maxX) && entity.hitstun > 0 && Math.abs(entity.velocityX) > 280) {
        this.game.flashEffect = 0.7;
        this.game.renderer.triggerShake(25);
        this.game.audio.playSfx("heavy");
        for (let i = 0; i < 15; i++) {
          this.game.particles.spawn(entity.x, entity.y - rng(20, 100), {
            type: "shard",
            color: "#555",
            size: rng(5, 12),
            speed: rng(100, 300)
          });
        }
        const player = this.game.player;
        const enemy = this.game.enemy;
        player.x = CONFIG2.W / 2 - 200;
        enemy.x = CONFIG2.W / 2 + 200;
        player.velocityX = 0;
        enemy.velocityX = 0;
        const stages = ["kurukshetra", "indraprastha", "hastinapura", "celestial_realm", "forest_of_dharma", "bridge_of_lanka"];
        const currentIdx = stages.indexOf(this.game.stage.currentStage);
        const nextStage = stages[(currentIdx + 1) % stages.length];
        this.game.stage.setStage(nextStage);
        this.game.ui.showToast(`WALL BREAK! STAGE TRANSITION: ${nextStage.toUpperCase()}`);
      }
    }
    // Draw HUD indicators for Karma split balance bar
    drawKarmaHUD(ctx) {
      ctx.save();
      const x = CONFIG2.W / 2;
      const y = CONFIG2.H - 50;
      const width = 300;
      const height = 10;
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(x - width / 2, y, width, height);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.strokeRect(x - width / 2, y, width, height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 2, y - 4, 4, height + 8);
      if (this.karma > 0) {
        const fillW = this.karma / 100 * (width / 2);
        ctx.fillStyle = "#ffd700";
        ctx.fillRect(x, y + 1, fillW, height - 2);
      } else if (this.karma < 0) {
        const fillW = Math.abs(this.karma) / 100 * (width / 2);
        ctx.fillStyle = "#d50000";
        ctx.fillRect(x - fillW, y + 1, fillW, height - 2);
      }
      ctx.fillStyle = "#d50000";
      ctx.font = "bold 12px Rajdhani";
      ctx.textAlign = "right";
      ctx.fillText("ADHARMA", x - width / 2 - 10, y + 9);
      ctx.fillStyle = "#ffd700";
      ctx.textAlign = "left";
      ctx.fillText("DHARMA", x + width / 2 + 10, y + 9);
      ctx.restore();
    }
  };

  // js/engine/core.js
  var DharmYudhGame = class {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.storage = new StorageSystem();
      this.audio = new AudioEngine(this.storage);
      this.input = new InputSystem(this.storage);
      this.anim = new AnimationEngine();
      this.renderer = new WebGLRendererSystem(this.canvas, this.storage);
      this.particles = new ParticleSystem(400);
      this.lighting = new LightingSystem(this);
      this.screenEffects = new ScreenEffectsSystem(this);
      this.stage = new StageRenderer(this);
      this.charRenderer = new CharacterRenderer(this.anim);
      this.ui = new UISystem(this);
      this.progression = new ProgressionManager(this);
      this.story = new StoryModeEngine(this);
      this.modes = new GameModesController(this);
      this.combat = new CombatUpgradeSystem(this);
      this.state = "loading";
      this.gameMode = "versus";
      this.difficulty = "normal";
      this.battleActive = false;
      this.roundActive = false;
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
      this.konamiActivated = false;
      this.selectedChar = 0;
      this.init();
    }
    init() {
      this.resize();
      window.addEventListener("resize", () => this.resize());
      this.loadAssets();
    }
    resize() {
      const container = document.getElementById("game-container");
      this.renderer.resize(container);
    }
    loadAssets() {
      let progress = 0;
      const bar = document.getElementById("loading-bar");
      const textNode = document.querySelector(".loading-text");
      const interval = setInterval(() => {
        progress += Math.random() * 12 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          if (bar) bar.style.width = "100%";
          setTimeout(() => {
            const loadingScreen = document.getElementById("loading-screen");
            if (loadingScreen) loadingScreen.classList.add("hidden");
            this.state = "menu";
            this.audio.init();
            this.startGameLoop();
          }, 500);
        }
        if (bar) bar.style.width = `${progress}%`;
        if (textNode) {
          if (progress < 30) textNode.textContent = "Summoning Warriors...";
          else if (progress < 60) textNode.textContent = "Forging Divine Weapons...";
          else if (progress < 85) textNode.textContent = "Preparing Kurukshetra...";
          else textNode.textContent = "Blessing by Gods...";
        }
      }, 150);
    }
    startGameLoop() {
      let lastTime = performance.now();
      let accumulator = 0;
      const loop = (now) => {
        let dt = (now - lastTime) / 1e3;
        lastTime = now;
        if (dt > 0.1) dt = 0.1;
        this.input.update();
        this.input.setTouchControlsVisible(this.state === "battle");
        if (this.input["keyJustPressed"]["1"]) {
          this.difficulty = "easy";
          this.showToast("Difficulty: Easy");
        }
        if (this.input["keyJustPressed"]["2"]) {
          this.difficulty = "normal";
          this.showToast("Difficulty: Normal");
        }
        if (this.input["keyJustPressed"]["3"]) {
          this.difficulty = "hard";
          this.showToast("Difficulty: Hard");
        }
        if (!this.konamiActivated && this.input.checkCombo(
          ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"],
          2e3
        )) {
          this.konamiActivated = true;
          this.showToast("\u{1F525} KURUKSHETRA AWAKENED! All characters unlocked! \u{1F525}");
          this.audio.playSfx("win", 1, 2);
          this.storage.data.progression.unlocks.lockedCharacters = [];
        }
        if (this.input["keyJustPressed"]["Escape"]) {
          if (this.state === "menu") {
            this.ui.settingsPanel.toggle();
          } else if (this.state === "battle") {
            this.state = "pause";
            this.audio.playSfx("select");
          }
        }
        if (this.state === "battle" && this.input.mouseClicked) {
          const mx = this.input.mousePos.x;
          const my = this.input.mousePos.y;
          if (mx >= CONFIG2.W / 2 - 40 && mx <= CONFIG2.W / 2 + 40 && my >= 75 && my <= 100) {
            this.state = "pause";
            this.audio.playSfx("select");
          }
        }
        if (this.state === "characterSelect") {
          if (this.input.keyJustPressed["ArrowLeft"] || this.input.mouseClicked && this.input.mousePos.x < 300) {
            this.selectedChar = (this.selectedChar - 1 + CHARACTERS2.length) % CHARACTERS2.length;
            this.audio.playSfx("select");
          }
          if (this.input.keyJustPressed["ArrowRight"] || this.input.mouseClicked && this.input.mousePos.x > 980) {
            this.selectedChar = (this.selectedChar + 1) % CHARACTERS2.length;
            this.audio.playSfx("select");
          }
          if (this.input.keyJustPressed["Enter"] || this.input.mouseClicked && this.input.mousePos.x >= 300 && this.input.mousePos.x <= 980) {
            this.confirmCharacter();
          }
        }
        accumulator += dt;
        while (accumulator >= CONFIG2.PHYSICS_STEP) {
          this.updateFixed(CONFIG2.PHYSICS_STEP);
          accumulator -= CONFIG2.PHYSICS_STEP;
        }
        this.updateVariable(dt);
        this.render();
        this.input.clearJustPressed();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
    confirmCharacter() {
      this.playerChar = CHARACTERS2[this.selectedChar];
      if (this.gameMode === "story") {
        this.story.startCampaign(this.playerChar.id);
        return;
      }
      if (this.gameMode === "arcade") {
        this.modes.startArcadeMode(this.playerChar.id);
        return;
      }
      const enemies = CHARACTERS2.filter((c) => c.id !== this.playerChar.id);
      this.enemyChar = enemies[Math.floor(Math.random() * enemies.length)];
      this.state = "battle";
      this.battleActive = false;
      this.round = 1;
      this.playerWins = 0;
      this.enemyWins = 0;
      this.comboCount = 0;
      this.audio.startMusic();
      this.showToast(`${this.playerChar.name} VS ${this.enemyChar.name}!`);
      const rivalPairs = {
        "arjuna_karna": 'Arjuna: "Karna! This battle will decide who is the greatest!"',
        "karna_arjuna": 'Karna: "Arjuna! The sun shines on the true warrior today!"',
        "bhima_duryodhana": 'Bhima: "Duryodhana! I swore to break your thigh \u2014 and I will!"',
        "duryodhana_bhima": 'Duryodhana: "Bhima! You Pandavas will never have Hastinapur!"',
        "bhishma_arjuna": 'Bhishma: "Arjuna... I am bound by my vow. Come, grandson!"',
        "arjuna_bhishma": 'Arjuna: "Grandsire... I will fight you with all my might!"',
        "draupadi_duryodhana": 'Draupadi: "Duryodhana! I will wash my hair with your blood!"',
        "duryodhana_draupadi": 'Duryodhana: "Draupadi! Your pride will be your downfall!"',
        "abhimanyu_karna": `Abhimanyu: "You killed my father's friend! Face me, Karna!"`,
        "karna_abhimanyu": 'Karna: "Young Abhimanyu... I will not go easy on you!"',
        "yudhishthira_duryodhana": 'Yudhishthira: "Duryodhana! This war is your doing!"',
        "duryodhana_yudhishthira": 'Duryodhana: "Yudhishthira! You gambled everything and lost!"'
      };
      const pairKey = `${this.playerChar.id}_${this.enemyChar.id}`;
      const rivalLine = rivalPairs[pairKey];
      if (rivalLine && this.gameMode !== "training") {
        setTimeout(() => {
          if (this.state === "battle") this.showToast(rivalLine);
        }, 800);
      }
      this.roundIntroTimer = 2.5;
      const stages = ["kurukshetra", "indraprastha", "hastinapura", "celestial_realm", "forest_of_dharma", "bridge_of_lanka"];
      this.stage.setStage(stages[Math.floor(Math.random() * stages.length)]);
      this.player = new BaseCharacter(this.playerChar, true);
      this.enemy = new BaseCharacter(this.enemyChar, false);
      setTimeout(() => {
        if (this.state === "battle") this.startRound();
      }, 2500);
    }
    startRound() {
      if (this.state !== "battle") return;
      this.battleActive = true;
      this.roundActive = true;
      this.player = new BaseCharacter(this.playerChar, true);
      this.enemy = new BaseCharacter(this.enemyChar, false);
      if (this.gameMode === "survival") {
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
      if (this.player) this.player.resetRoundPassive();
      if (this.enemy) this.enemy.resetRoundPassive();
      this.audio.setMusicIntensity(0.3);
      this.ui.showToast(`Round ${this.round} \u2014 FIGHT!`);
      this.audio.playSfx("win");
      this.audio.speakAnnouncer(`Round ${this.round}... FIGHT!`);
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
      if (this.state === "battle" && this.battleActive && this.roundActive) {
        this.gameTime += dt;
        this.battleTimer -= dt;
        if (this.battleTimer <= 0) {
          this.endRound("time");
          return;
        }
        if (this.comboTimer > 0) {
          this.comboTimer -= dt;
        } else {
          this.comboCount = 0;
        }
        if (this.input.isActionJustPressed("Special", 1) && Math.abs(this.combat.karma) === 100 && this.player.energy >= CONFIG2.SPECIAL_COST) {
          this.combat.triggerAstra(this.player);
        }
        if (this.input.isActionJustPressed("Special", 2) && Math.abs(this.combat.karma) === 100 && this.gameMode === "versus2p" && this.enemy.energy >= CONFIG2.SPECIAL_COST) {
          this.combat.triggerAstra(this.enemy);
        }
        this.updatePlayerControls(this.player, dt, this.enemy);
        if (this.gameMode === "versus2p") {
          this.modes.updatePlayer2Controls(this.enemy, dt);
        } else if (this.gameMode === "training") {
          this.modes.handleTrainingInputs();
          this.modes.updateTrainingDummy(this.enemy, dt, this.player);
        } else {
          this.updateAIControls(this.enemy, dt, this.player);
        }
        this.player.update(dt, this.enemy);
        this.enemy.update(dt, this.player);
        this.updateEntityPhysics(this.player, dt);
        this.updateEntityPhysics(this.enemy, dt);
        this.resolveCombatCollisions(dt);
        const midX = (this.player.x + this.enemy.x) / 2;
        const distance = Math.abs(this.player.x - this.enemy.x);
        const zoom = clamp2(CONFIG2.W / (distance + 400), 0.65, 1.25);
        const halfVisibleWidth = CONFIG2.W / 2 / zoom;
        const minX = midX - halfVisibleWidth + 60;
        const maxX = midX + halfVisibleWidth - 60;
        this.player.x = clamp2(this.player.x, minX, maxX);
        this.enemy.x = clamp2(this.enemy.x, minX, maxX);
        const clashed = this.combat.checkWeaponClash(this.player, this.enemy);
        if (!clashed) {
          this.checkCombatHits(this.player, this.enemy);
          this.checkCombatHits(this.enemy, this.player);
        }
        this.combat.checkStageTransition(this.player);
        this.combat.checkStageTransition(this.enemy);
        this.combat.update(dt);
        this._updatePassiveAuras(dt, this.player);
        this._updatePassiveAuras(dt, this.enemy);
        if (this.player.died || this.enemy.died) {
          this.endRound("ko");
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
        entity.velocityY += CONFIG2.GRAVITY * dt;
      }
      if (entity.targetVelocityX !== void 0 && !entity.attacking && entity.hitstun <= 0) {
        const accel = entity.grounded ? 12 : 5;
        entity.velocityX += (entity.targetVelocityX - entity.velocityX) * accel * dt;
      } else if (entity.hitstun <= 0 && !entity.attacking) {
        entity.velocityX *= Math.pow(0.85, dt * 60);
      }
      entity.x += entity.velocityX * dt;
      entity.y += entity.velocityY * dt;
      if (entity.y >= CONFIG2.GROUND_Y) {
        entity.y = CONFIG2.GROUND_Y;
        entity.velocityY = 0;
        if (!entity.grounded) {
          entity.grounded = true;
          this.particles.spawn(entity.x, entity.y, { type: "smoke", color: "#666", count: 4, size: 8 });
          this.audio.playSfx("land");
        }
      }
      entity.x = clamp2(entity.x, 40, CONFIG2.W - 40);
    }
    updatePlayerControls(entity, dt, opp) {
      if (entity.attacking || entity.hitstun > 0 || entity.died) return;
      let speed = entity.speed;
      entity.blocking = !!(this.input.isActionPressed("Block", 1) && entity.grounded);
      if (entity.blocking) speed *= 0.5;
      let moveIntent = 0;
      if (this.input.isActionPressed("MoveLeft", 1)) moveIntent = -1;
      if (this.input.isActionPressed("MoveRight", 1)) moveIntent = 1;
      entity.targetVelocityX = moveIntent * speed;
      if (moveIntent !== 0 && entity.grounded && Math.random() < 0.15) {
        this.particles.spawn(entity.x - entity.facing * 10, CONFIG2.GROUND_Y, { type: "smoke", color: "#888", size: 5, speed: 30 });
      }
      if (this.input.isActionJustPressed("Jump", 1) && entity.grounded) {
        entity.velocityY = -650;
        entity.grounded = false;
        this.audio.playSfx("jump", rng(0.85, 1.15));
      }
      if (this.input.isActionJustPressed("Dodge", 1) && entity.dodgeCooldown <= 0 && entity.grounded) {
        entity.dodgeTimer = 0.15;
        let dodgeCD = 0.6;
        if (entity.getCooldownMultiplier) {
          dodgeCD *= entity.getCooldownMultiplier("dodge");
        }
        entity.dodgeCooldown = dodgeCD;
        entity.invTimer = 0.2;
        entity.velocityX = entity.facing * -450;
        this.audio.playSfx("dodge");
      }
      if (this.input.isActionJustPressed("AttackLight", 1) && entity.attackCooldown <= 0) {
        this.performAttack(entity, opp, "light");
      } else if (this.input.isActionJustPressed("AttackHeavy", 1) && entity.attackCooldown <= 0) {
        this.performAttack(entity, opp, "heavy");
      } else if (this.input.isActionJustPressed("Special", 1) && entity.specialCooldown <= 0 && entity.energy >= CONFIG2.SPECIAL_COST) {
        this.performSpecial(entity, opp);
      }
      if ((this.input["keyJustPressed"]["t"] || this.input["keyJustPressed"]["T"]) && entity.tauntCooldown <= 0 && entity.grounded) {
        entity.tauntCooldown = 4;
        const tauntText = entity.taunts.length > 0 ? entity.taunts[Math.floor(Math.random() * entity.taunts.length)] : "You cannot match my strength!";
        this.particles.spawnFloatingText(entity.x, entity.y - 100, `"${tauntText}"`, entity.color);
        this.audio.playSfx("select");
      }
    }
    updateAIControls(entity, dt, opp) {
      if (entity.attacking || entity.hitstun > 0 || entity.died) return;
      entity.aiTimer -= dt;
      const distance = Math.abs(entity.x - opp.x);
      if (entity.aiTimer <= 0) {
        entity.aiTimer = 0.2;
        if (distance > 160) {
          entity.aiState = "approach";
        } else {
          entity.aiState = "fight";
        }
      }
      if (entity.aiState === "approach") {
        const dir = opp.x > entity.x ? 1 : -1;
        entity.targetVelocityX = dir * entity.speed;
      } else if (entity.aiState === "fight") {
        entity.targetVelocityX = 0;
        if (Math.random() < 0.2 && entity.energy >= CONFIG2.SPECIAL_COST && entity.specialCooldown <= 0) {
          this.performSpecial(entity, opp);
        } else if (Math.random() < 0.4 && entity.attackCooldown <= 0) {
          this.performAttack(entity, opp, "heavy");
        } else if (entity.attackCooldown <= 0) {
          this.performAttack(entity, opp, "light");
        }
      }
    }
    performAttack(entity, opp, type) {
      entity.attacking = true;
      entity.attackType = type;
      entity.attackFrame = 0;
      entity.hasHit = false;
      let baseCooldown = type === "heavy" ? 0.6 : 0.35;
      if (entity.getCooldownMultiplier) {
        baseCooldown *= entity.getCooldownMultiplier(type);
      }
      entity.attackCooldown = baseCooldown;
      const lunge = type === "heavy" ? 250 : 130;
      entity.velocityX = entity.facing * lunge;
      this.audio.playSfx(type === "heavy" ? "heavy" : "hit", rng(0.9, 1.1));
    }
    performSpecial(entity, opp) {
      entity.attacking = true;
      entity.attackType = "special";
      entity.attackFrame = 0;
      entity.specialActive = true;
      entity.specialTimer = 0.5;
      entity.energy -= CONFIG2.SPECIAL_COST;
      entity.specialCooldown = CONFIG2.SPECIAL_COOLDOWN;
      entity.velocityX = entity.facing * 350;
      this.slowMo = 0.35;
      this.flashEffect = 0.5;
      this.renderer.triggerShake(14);
      this.particles.spawnFloatingText(entity.x, entity.y - 110, "ASTRA UNLEASHED!", "#ffd700");
      this.audio.playSfx("special");
      this.audio.speakAnnouncer("ASTRA UNLEASHED!");
    }
    checkCombatHits(attacker, defender) {
      const activeFrameStart = attacker.attackType === "heavy" ? 3 : 2;
      if (!attacker.attacking || attacker.hasHit || attacker.attackFrame < activeFrameStart) return;
      let hitDist = 95;
      if (attacker.attackType === "heavy") hitDist = 140;
      if (attacker.attackType === "special") hitDist = 220;
      const actualDist = Math.abs(attacker.x - defender.x);
      if (actualDist < hitDist) {
        attacker.hasHit = true;
        this.hitstopTimer = attacker.attackType === "heavy" ? 0.08 : attacker.attackType === "special" ? 0.12 : 0.05;
        if (attacker.onHitLanded) {
          attacker.onHitLanded(attacker.attackType);
        }
        const isCounter = defender.attacking && defender.attackFrame < 3;
        let counterMult = 1;
        if (isCounter) {
          counterMult = 1.25;
          this.particles.spawnFloatingText(defender.x, defender.y - 120, "COUNTER HIT!", "#ffea00");
          this.audio.playSfx("counter");
          this.audio.speakAnnouncer("COUNTER!");
          this.flashEffect = 0.3;
        }
        let damage = attacker.attack * counterMult;
        let knockbackX = attacker.facing * 180;
        let knockbackY = 0;
        if (attacker.attackType === "heavy") {
          damage *= 1.6;
          knockbackX = attacker.facing * 300;
          knockbackY = -280;
        } else if (attacker.attackType === "special") {
          damage = attacker.specialDmg;
          knockbackX = attacker.facing * 450;
          knockbackY = -350;
        }
        if (attacker.getDamageBonus) {
          damage *= attacker.getDamageBonus(attacker.attackType);
        }
        if (attacker.getKnockbackBonus) {
          const kbMult = attacker.getKnockbackBonus(attacker.attackType);
          knockbackX *= kbMult;
          if (knockbackY !== 0) knockbackY *= kbMult;
        }
        if (attacker.passive && attacker.passive.id === "chakravyuha_tactician") {
        } else {
          if (attacker === this.player) {
            this.comboCount++;
            this.comboTimer = CONFIG2.COMBO_WINDOW;
            damage *= 1 + (this.comboCount - 1) * 0.07;
          }
        }
        if (!defender.grounded && knockbackY !== 0) {
          this.combat.applyJuggleForce(defender, knockbackY);
        }
        const result = defender.takeDamage(damage, knockbackX, knockbackY);
        if (result && result.immortalSaved) {
          this.particles.spawn(defender.x, defender.y - 40, { type: "ring", color: "#00e5ff", size: 80, count: 3 });
          this.particles.spawnFloatingText(defender.x, defender.y - 100, "IMMORTAL!", "#00e5ff");
          this.flashEffect = 0.6;
          this.renderer.triggerShake(20);
          this.audio.playSfx("counter");
          const shockDir = defender.x < attacker.x ? -1 : 1;
          attacker.velocityX = shockDir * 350;
          attacker.hitstun = 0.3;
          this.ui.showToast("Ashwatthama refuses to fall!");
        }
        if (result.hit) {
          this.screenEffects.triggerHitStop(attacker.attackType);
          if (attacker === this.player) {
            const karmaShift = attacker.attackType === "special" ? -15 : -5;
            this.combat.adjustKarma(karmaShift);
          }
          if (result.blocked) {
            if (attacker === this.enemy) {
              this.combat.adjustKarma(15);
            }
            this.particles.spawn(defender.x, defender.y - 40, { type: "ring", color: "#ffffff", size: 30 });
            this.particles.spawnFloatingText(defender.x, defender.y - 80, "BLOCKED", "#9e9e9e");
            this.audio.playSfx("block");
          } else {
            if (attacker.attackType === "heavy") {
              this.particles.spawnHeavyHitSparks(defender.x, defender.y - 40, attacker.color);
            } else if (attacker.attackType === "special") {
              this.particles.spawnSpecialBurst(defender.x, defender.y - 40, attacker.color);
            } else {
              this.particles.spawnHitSparks(defender.x, defender.y - 40, attacker.color);
            }
            this.particles.spawnFloatingText(defender.x, defender.y - 80, Math.round(result.damage), "#ff3d00");
          }
          if (!result.blocked) {
            if (attacker.passive && attacker.passive.id === "vayu_wrath" && attacker.attackType === "heavy") {
              this.particles.spawn(attacker.x, CONFIG2.GROUND_Y, { type: "ring", color: "#ff6d00", size: 55, count: 2, life: 0.3 });
              this.particles.spawn(attacker.x, CONFIG2.GROUND_Y, { type: "spark", color: "#ffab00", count: 8, speed: 200, gravity: 400, life: 0.25 });
              this.renderer.triggerShake(8);
            }
            if (attacker.passive && attacker.passive.id === "sacred_flame" && attacker.passiveData.vengeanceJustTriggered) {
              attacker.passiveData.vengeanceJustTriggered = false;
              this.particles.spawn(defender.x, defender.y - 40, { type: "spark", color: "#ff3d00", count: 25, speed: 350, gravity: 100, life: 0.5 });
              this.particles.spawn(defender.x, defender.y - 40, { type: "ring", color: "#ff6d00", size: 40, life: 0.35 });
              this.particles.spawnFloatingText(defender.x, defender.y - 120, "\u{1F525} SACRED FLAME!", "#ff3d00");
              this.renderer.triggerShake(12);
              this.audio.playSfx("special");
            }
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
        const maxX = CONFIG2.W - 40;
        const p1AtBound = this.player.x <= minX && dir === -1 || this.player.x >= maxX && dir === 1;
        const p2AtBound = this.enemy.x <= minX && dir === 1 || this.enemy.x >= maxX && dir === -1;
        if (p1AtBound && !p2AtBound) {
          this.enemy.x -= dir * overlap;
        } else if (p2AtBound && !p1AtBound) {
          this.player.x += dir * overlap;
        } else {
          this.player.x += dir * overlap * 0.5;
          this.enemy.x -= dir * overlap * 0.5;
        }
        this.player.x = clamp2(this.player.x, minX, maxX);
        this.enemy.x = clamp2(this.enemy.x, minX, maxX);
      }
    }
    endRound(type) {
      this.roundActive = false;
      this.battleActive = false;
      let winner = "player";
      if (type === "time") {
        if (this.player.currentHp < this.enemy.currentHp) winner = "enemy";
      } else {
        if (this.player.currentHp <= 0) winner = "enemy";
      }
      if (winner === "player") {
        this.playerWins++;
      } else {
        this.enemyWins++;
      }
      if (type === "ko") {
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
      if (this.gameMode === "story") {
        if (winner === "player") {
          this.story.dialogueMode = "outro";
          this.story.inDialogue = true;
          this.state = "battle";
          return;
        }
      }
      if (this.gameMode === "arcade") {
        if (winner === "player") {
          this.modes.advanceArcadeStage();
          return;
        }
      }
      const rewards = this.progression.awardMatchRewards(winner, winner === "player" ? 1 : 0, this.round);
      const unlocks = this.progression.checkFightAchievements({
        maxCombo: this.comboCount,
        perfectRound: this.player.currentHp === this.player.hp,
        firstWin: winner === "player",
        wonMatch: winner === "player"
      });
      this.lastMatchResults = {
        winner,
        xpEarned: rewards.xp,
        dpEarned: rewards.dp,
        leveledUp: rewards.leveledUp,
        newLevel: rewards.newLevel,
        unlockedAchievements: unlocks
      };
      this.state = "result";
    }
    render() {
      this.renderer.begin();
      if (this.stage) {
        this.stage.draw(this.renderer.ctx);
      }
      if (this.lighting) {
        this.lighting.draw(this.renderer.ctx);
      }
      if (this.player) {
        this.charRenderer.draw(this.renderer.ctx, this.player, this.renderer);
      }
      if (this.enemy) {
        this.charRenderer.draw(this.renderer.ctx, this.enemy, this.renderer);
      }
      if (this.particles) {
        this.particles.draw(this.renderer.ctx);
      }
      this.renderer.end();
      this.renderer.drawScreenFlash(this.flashEffect, "#ffffff");
      this.renderer.drawScreenFlash(this.koFlash, "#ff3b30");
      if (this.ui) {
        this.ui.draw(this.renderer.ctx, this.state);
      }
      if (this.state === "battle") {
        this.modes.drawTrainingOverlay(this.renderer.ctx);
        if (!this.story.inDialogue) {
          this.combat.drawKarmaHUD(this.renderer.ctx);
        }
      }
      if (this.state === "battle" && this.story.inDialogue) {
        this.story.draw(this.renderer.ctx);
      }
    }
    // ─── PASSIVE AURA VISUAL EFFECTS ────────────────────────
    _updatePassiveAuras(dt, entity) {
      if (!entity || !entity.passive || entity.died) return;
      if (entity.passive.id === "indomitable_will" && entity.currentHp < entity.hp * 0.3 && entity.currentHp > 0) {
        if (Math.random() < 0.15) {
          this.particles.spawn(entity.x + rng(-25, 25), entity.y - rng(15, 55), {
            type: "aura",
            color: "#e53935",
            size: rng(6, 14),
            life: 0.35,
            speed: rng(15, 40)
          });
        }
      }
    }
    showToast(msg) {
      if (this.ui && this.ui.showToast) {
        this.ui.showToast(msg);
      }
    }
  };

  // js/main.js
  document.addEventListener("DOMContentLoaded", () => {
    const game = new DharmYudhGame("gameCanvas");
    window.game = game;
  });
})();
