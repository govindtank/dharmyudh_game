// ============================================================
// DHARMYUDH - Audio Engine
// ============================================================

import { clamp } from './config.js';

export class AudioEngine {
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
        console.warn('Web Audio API not supported in this browser.');
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
      console.warn('AudioEngine initialization failed:', e);
    }
  }

  ensureInit() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
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
    
    // Add positional audio panning (between -1 and 1)
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    
    if (panner) {
      panner.pan.setValueAtTime(clamp(panX, -1, 1), now);
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxGain);
    } else {
      osc.connect(gain);
      gain.connect(this.sfxGain);
    }

    const bv = vol * 0.3;

    switch (type) {
      case 'hit':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(60 * pitch, now + 0.08);
        gain.gain.setValueAtTime(bv, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        this._noise(now, 0.05, bv * 0.5, panX);
        break;

      case 'heavy':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(25 * pitch, now + 0.18);
        gain.gain.setValueAtTime(bv * 1.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        this._noise(now, 0.12, bv, panX);
        break;

      case 'special':
        osc.type = 'square';
        osc.frequency.setValueAtTime(400 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(1200 * pitch, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(60 * pitch, now + 0.45);
        gain.gain.setValueAtTime(bv * 1.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);

        // Sub oscillator for celestial resonance (reminiscent of shankha/shell call)
        const o2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        if (panner) {
          o2.connect(g2);
          g2.connect(panner);
        } else {
          o2.connect(g2);
          g2.connect(this.sfxGain);
        }
        o2.type = 'sine';
        o2.frequency.setValueAtTime(600 * pitch, now);
        o2.frequency.exponentialRampToValueAtTime(2000 * pitch, now + 0.1);
        g2.gain.setValueAtTime(bv * 0.6, now);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        o2.start(now);
        o2.stop(now + 0.35);
        break;

      case 'block':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(40 * pitch, now + 0.05);
        gain.gain.setValueAtTime(bv * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
        break;

      case 'death':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(10 * pitch, now + 1.2);
        gain.gain.setValueAtTime(bv * 1.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.start(now);
        osc.stop(now + 1.2);
        break;

      case 'select':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500 * pitch, now);
        osc.frequency.setValueAtTime(720 * pitch, now + 0.06);
        gain.gain.setValueAtTime(bv * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'win':
        // Indian Raga style ascending swara flourish
        [440, 494, 554, 659, 740].forEach((f, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.sfxGain);
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now + i * 0.08);
          g.gain.setValueAtTime(bv * 0.6, now + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
          o.start(now + i * 0.08);
          o.stop(now + i * 0.08 + 0.3);
        });
        break;

      case 'combo':
        osc.type = 'square';
        osc.frequency.setValueAtTime(400 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(1500 * pitch, now + 0.12);
        gain.gain.setValueAtTime(bv * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
        break;

      case 'ko':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 1.5);
        gain.gain.setValueAtTime(bv * 1.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc.start(now);
        osc.stop(now + 1.5);
        break;

      case 'jump':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(550 * pitch, now + 0.12);
        gain.gain.setValueAtTime(bv * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
        break;

      case 'dodge':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(900 * pitch, now + 0.06);
        gain.gain.setValueAtTime(bv * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'land':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(30 * pitch, now + 0.08);
        gain.gain.setValueAtTime(bv * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      
      case 'clash':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(100 * pitch, now + 0.15);
        gain.gain.setValueAtTime(bv * 1.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        this._noise(now, 0.08, bv * 0.8, panX);
        break;

      default:
        // Cleanup default unused nodes
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
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime(clamp(panX, -1, 1), now);
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
    
    // Scale: Sa (110Hz - A2), Re (123.47Hz), Ga (138.59Hz), Pa (165Hz), Dha (185Hz)
    // Modeled as a drone tanpura + dynamic rhythm
    const baseFreq = 110; // A2

    // Tanpura Drone 1 (Root - Sa)
    const d1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    d1.type = 'sawtooth';
    d1.frequency.value = baseFreq;
    // Lower pass filter to make it sound warm/traditional
    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(250, now);
    
    d1.connect(filter1);
    filter1.connect(g1);
    g1.connect(this.musicGain);
    g1.gain.setValueAtTime(0.04, now);
    d1.start(now);
    this.musicOscs.push(d1);

    // Tanpura Drone 2 (Fifth - Pa)
    const d2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    d2.type = 'sine';
    d2.frequency.value = baseFreq * 1.5; // Pa
    d2.connect(g2);
    g2.connect(this.musicGain);
    g2.gain.setValueAtTime(0.03, now);
    d2.start(now);
    this.musicOscs.push(d2);

    // Dynamic Tabla-like rhythm generator
    const rhythmNode = this.ctx.createOscillator();
    const rhythmGain = this.ctx.createGain();
    rhythmNode.type = 'triangle';
    rhythmNode.frequency.setValueAtTime(baseFreq * 2, now); // Higher octave Sa
    rhythmNode.connect(rhythmGain);
    rhythmGain.connect(this.musicGain);
    rhythmGain.gain.setValueAtTime(0, now);
    rhythmNode.start(now);
    this.musicOscs.push(rhythmNode);

    const stepMs = (60 / this.bpm) * 1000 / 2; // Eighth notes
    let stepCount = 0;
    
    const playBeat = () => {
      if (!this.musicPlaying) return;
      const t = this.ctx.currentTime;
      const vol = 0.03 + this.musicIntensity * 0.08;
      
      // Traditional Indian Tala pattern (Teesra or Keharwa style beats)
      // Accentuate steps: 0, 3, 5, 7
      const isAccent = stepCount % 8 === 0 || stepCount % 8 === 3 || stepCount % 8 === 6;
      const currentVol = isAccent ? vol * 1.4 : vol * 0.7;
      
      // Pitch modulation for "bayan" (bass tabla sweep)
      if (stepCount % 4 === 0) {
        // Bass stroke: sweep pitch from 70Hz to 110Hz
        rhythmNode.frequency.setValueAtTime(70, t);
        rhythmNode.frequency.exponentialRampToValueAtTime(115, t + 0.15);
      } else {
        rhythmNode.frequency.setValueAtTime(baseFreq * (isAccent ? 3.0 : 2.0), t);
      }

      rhythmGain.gain.setValueAtTime(currentVol, t);
      rhythmGain.gain.exponentialRampToValueAtTime(0.001, t + (isAccent ? 0.18 : 0.08));

      // Sitar-like background melodic hits at higher intensity
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
    const notes = [220, 246.94, 277.18, 329.63, 369.99, 440]; // A3, B3, C#4, E4, F#4, A4 (Bhupali/pentatonic swaras)
    const freq = notes[Math.floor(Math.random() * notes.length)];
    
    const sitarOsc = this.ctx.createOscillator();
    const sitarGain = this.ctx.createGain();
    
    sitarOsc.type = 'sawtooth';
    sitarOsc.frequency.setValueAtTime(freq, now);
    
    // Add rapid decay to simulate string pluck
    sitarGain.gain.setValueAtTime(0.02 * this.musicIntensity, now);
    sitarGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    
    // Lowpass filter to avoid harshness
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, now);
    
    sitarOsc.connect(filter);
    filter.connect(sitarGain);
    sitarGain.connect(this.musicGain);
    
    sitarOsc.start(now);
    sitarOsc.stop(now + 0.5);
  }

  setMusicIntensity(v) {
    this.musicIntensity = clamp(v, 0, 1);
    this.updateVolumes();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
    this.musicOscs.forEach(o => {
      try { o.stop(); } catch (e) {}
    });
    this.musicOscs = [];
  }
}
