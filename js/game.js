// ============================================================
// DHARMYUDH v3.0 - The Great War of Kurukshetra
// Premium Visual Engine - Gradient Art, Silky Animation, Epic Battles
// ============================================================

// ─── CONFIG ────────────────────────────────────────────────
const CONFIG = {
  W: 1280, H: 720,
  GROUND_Y: 520,
  GRAVITY: 1800,
  COMBO_WINDOW: 0.35,
  MAX_COMBO: 20,
  ENERGY_REGEN: 14,
  SPECIAL_COST: 50,
  SPECIAL_COOLDOWN: 2.5,
  MAX_PARTICLES: 800,       // Hard cap for mobile safety
  PARTICLE_SKIP_MOBILE: .3, // Skip prob on mobile (0 = never, 1 = always)
};

function lerp(a,b,t){return a+(b-a)*t}
function clamp(v,m,M){return Math.max(m,Math.min(M,v))}
function rng(a,b){return a+Math.random()*(b-a)}
function rngI(a,b){return Math.floor(rng(a,b+1))}
function dist(x1,y1,x2,y2){return Math.hypot(x2-x1,y2-y1)}
function easeOut(t){return 1-(1-t)*(1-t)}
function easeInOut(t){return t<.5?2*t*t:-1+(4-2*t)*t}

// ─── AUDIO ENGINE ─────────────────────────────────────────
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.initialized = false;
    this.musicPlaying = false;
    this.musicOscs = [];
    this.musicIntensity = 0;
    // Crowd ambience
    this.crowdPlaying = false;
    this.crowdSource = null;
    this.crowdGain = null;
    this.crowdIntensity = 0;
    this.crowdTargetIntensity = 0;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.35;
      this.masterGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.1;
      this.musicGain.connect(this.masterGain);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.masterGain);
      this.initialized = true;
    } catch(e){console.warn('Audio:',e)}
  }

  ensureInit() {
    if(!this.initialized) this.init();
    if(this.ctx&&this.ctx.state==='suspended') this.ctx.resume();
  }

  playSfx(type,pitch=1,vol=1){
    this.ensureInit(); if(!this.ctx) return;
    const now=this.ctx.currentTime, osc=this.ctx.createOscillator(), gain=this.ctx.createGain();
    osc.connect(gain); gain.connect(this.sfxGain);
    const bv=vol*0.3;
    switch(type){
      case 'hit':
        osc.type='sawtooth'; osc.frequency.setValueAtTime(260*pitch,now);
        osc.frequency.exponentialRampToValueAtTime(60*pitch,now+.08);
        gain.gain.setValueAtTime(bv,now); gain.gain.exponentialRampToValueAtTime(.001,now+.1);
        osc.start(now); osc.stop(now+.1);
        this._noise(now,.05,bv*.5); break;
      case 'heavy':
        osc.type='sawtooth'; osc.frequency.setValueAtTime(150*pitch,now);
        osc.frequency.exponentialRampToValueAtTime(25*pitch,now+.18);
        gain.gain.setValueAtTime(bv*1.6,now); gain.gain.exponentialRampToValueAtTime(.001,now+.2);
        osc.start(now); osc.stop(now+.2);
        this._noise(now,.12,bv); break;
      case 'special':
        osc.type='square'; osc.frequency.setValueAtTime(400*pitch,now);
        osc.frequency.exponentialRampToValueAtTime(1200*pitch,now+.15);
        osc.frequency.exponentialRampToValueAtTime(60*pitch,now+.45);
        gain.gain.setValueAtTime(bv*1.5,now); gain.gain.exponentialRampToValueAtTime(.001,now+.5);
        osc.start(now); osc.stop(now+.5);
        const o2=this.ctx.createOscillator(),g2=this.ctx.createGain();
        o2.connect(g2);g2.connect(this.sfxGain);
        o2.type='sine';o2.frequency.setValueAtTime(600*pitch,now);
        o2.frequency.exponentialRampToValueAtTime(2000*pitch,now+.1);
        g2.gain.setValueAtTime(bv*.6,now);g2.gain.exponentialRampToValueAtTime(.001,now+.35);
        o2.start(now);o2.stop(now+.35); break;
      case 'block':
        osc.type='triangle'; osc.frequency.setValueAtTime(180*pitch,now);
        osc.frequency.exponentialRampToValueAtTime(40*pitch,now+.05);
        gain.gain.setValueAtTime(bv*.4,now); gain.gain.exponentialRampToValueAtTime(.001,now+.07);
        osc.start(now); osc.stop(now+.07); break;
      case 'death':
        osc.type='sawtooth'; osc.frequency.setValueAtTime(400*pitch,now);
        osc.frequency.exponentialRampToValueAtTime(10*pitch,now+1.2);
        gain.gain.setValueAtTime(bv*1.3,now); gain.gain.exponentialRampToValueAtTime(.001,now+1.2);
        osc.start(now); osc.stop(now+1.2); break;
      case 'select':
        osc.type='sine'; osc.frequency.setValueAtTime(500*pitch,now);
        osc.frequency.setValueAtTime(720*pitch,now+.06);
        gain.gain.setValueAtTime(bv*.4,now); gain.gain.exponentialRampToValueAtTime(.001,now+.15);
        osc.start(now); osc.stop(now+.15); break;
      case 'win':
        [400,500,600,800].forEach((f,i)=>{
          const o=this.ctx.createOscillator(),g=this.ctx.createGain();
          o.connect(g);g.connect(this.sfxGain);o.type='sine';
          o.frequency.setValueAtTime(f,now+i*.1);
          g.gain.setValueAtTime(bv*.6,now+i*.1);g.gain.exponentialRampToValueAtTime(.001,now+i*.1+.25);
          o.start(now+i*.1);o.stop(now+i*.1+.25);
        }); break;
      case 'combo':
        osc.type='square'; osc.frequency.setValueAtTime(400*pitch,now);
        osc.frequency.exponentialRampToValueAtTime(1500*pitch,now+.12);
        gain.gain.setValueAtTime(bv*.3,now); gain.gain.exponentialRampToValueAtTime(.001,now+.14);
        osc.start(now); osc.stop(now+.14); break;
      case 'ko':
        osc.type='sawtooth'; osc.frequency.setValueAtTime(700,now);
        osc.frequency.exponentialRampToValueAtTime(20,now+1.5);
        gain.gain.setValueAtTime(bv*1.6,now); gain.gain.exponentialRampToValueAtTime(.001,now+1.5);
        osc.start(now); osc.stop(now+1.5); break;
      case 'jump':
        osc.type='sine'; osc.frequency.setValueAtTime(180*pitch,now);
        osc.frequency.exponentialRampToValueAtTime(550*pitch,now+.12);
        gain.gain.setValueAtTime(bv*.3,now); gain.gain.exponentialRampToValueAtTime(.001,now+.14);
        osc.start(now); osc.stop(now+.14); break;
      case 'dodge':
        osc.type='triangle'; osc.frequency.setValueAtTime(500*pitch,now);
        osc.frequency.exponentialRampToValueAtTime(900*pitch,now+.06);
        gain.gain.setValueAtTime(bv*.25,now); gain.gain.exponentialRampToValueAtTime(.001,now+.08);
        osc.start(now); osc.stop(now+.08); break;
      case 'land':
        osc.type='triangle'; osc.frequency.setValueAtTime(80*pitch,now);
        osc.frequency.exponentialRampToValueAtTime(30*pitch,now+.08);
        gain.gain.setValueAtTime(bv*.3,now); gain.gain.exponentialRampToValueAtTime(.001,now+.1);
        osc.start(now); osc.stop(now+.1); break;
      case 'round_start':
        // Deep gong resonance for round start
        osc.type='sine'; osc.frequency.setValueAtTime(180,now);
        osc.frequency.exponentialRampToValueAtTime(120,now+.6);
        gain.gain.setValueAtTime(bv*2,now); gain.gain.exponentialRampToValueAtTime(.001,now+.8);
        osc.start(now); osc.stop(now+.8);
        const gong2=this.ctx.createOscillator(),gg2=this.ctx.createGain();
        gong2.connect(gg2);gg2.connect(this.sfxGain);
        gong2.type='sine';gong2.frequency.setValueAtTime(360,now+.02);
        gong2.frequency.exponentialRampToValueAtTime(240,now+.5);
        gg2.gain.setValueAtTime(bv*.8,now+.02);gg2.gain.exponentialRampToValueAtTime(.001,now+.7);
        gong2.start(now+.02);gong2.stop(now+.7);
        // Harmonic shimmer
        const gong3=this.ctx.createOscillator(),gg3=this.ctx.createGain();
        gong3.connect(gg3);gg3.connect(this.sfxGain);
        gong3.type='triangle';gong3.frequency.setValueAtTime(540,now+.05);
        gong3.frequency.exponentialRampToValueAtTime(360,now+.4);
        gg3.gain.setValueAtTime(bv*.4,now+.05);gg3.gain.exponentialRampToValueAtTime(.001,now+.5);
        gong3.start(now+.05);gong3.stop(now+.5); break;
      case 'victory':
        // Triumphant fanfare - ascending arpeggiated chords
        [0,150,300,450,600,800].forEach((d,i)=>{
          const baseFreq=260;
          const notes=[baseFreq,baseFreq*5/4,baseFreq*3/2,baseFreq*2,baseFreq*5/2,baseFreq*3];
          const f=notes[i%notes.length];
          const o=this.ctx.createOscillator(),g=this.ctx.createGain();
          o.connect(g);g.connect(this.sfxGain);o.type=i<3?'sine':'triangle';
          o.frequency.setValueAtTime(f,now+d/1000);
          o.frequency.exponentialRampToValueAtTime(f*1.02,now+d/1000+.15);
          g.gain.setValueAtTime(bv*1.2,now+d/1000);
          g.gain.setValueAtTime(bv*1.2,now+d/1000+.22);
          g.gain.exponentialRampToValueAtTime(.001,now+d/1000+.35);
          o.start(now+d/1000);o.stop(now+d/1000+.35);
        });
        // Underlying bass drone
        const bDrone=this.ctx.createOscillator(),bGain=this.ctx.createGain();
        bDrone.connect(bGain);bGain.connect(this.sfxGain);
        bDrone.type='sine';bDrone.frequency.value=130;
        bGain.gain.setValueAtTime(bv*.5,now);bGain.gain.exponentialRampToValueAtTime(.001,now+.9);
        bDrone.start(now);bDrone.stop(now+.9); break;
      case 'counter':
        // Sharp, metallic parry/riposte sound
        osc.type='square'; osc.frequency.setValueAtTime(800,now);
        osc.frequency.exponentialRampToValueAtTime(2000,now+.04);
        osc.frequency.exponentialRampToValueAtTime(400,now+.12);
        gain.gain.setValueAtTime(bv*.7,now); gain.gain.exponentialRampToValueAtTime(.001,now+.15);
        osc.start(now); osc.stop(now+.15);
        this._noise(now,.03,bv*.8); break;
      case 'special_arjuna':
        // Ethereal arrow volley - streaming high harmonics
        osc.type='sine'; osc.frequency.setValueAtTime(600,now);
        osc.frequency.exponentialRampToValueAtTime(1800,now+.12);
        osc.frequency.exponentialRampToValueAtTime(200,now+.35);
        gain.gain.setValueAtTime(bv*1.2,now); gain.gain.exponentialRampToValueAtTime(.001,now+.4);
        osc.start(now); osc.stop(now+.4);
        // Wind-up layer
        const w1=this.ctx.createOscillator(),wg1=this.ctx.createGain();
        w1.connect(wg1);wg1.connect(this.sfxGain);
        w1.type='triangle';w1.frequency.setValueAtTime(400,now);
        w1.frequency.linearRampToValueAtTime(2000,now+.15);
        w1.frequency.linearRampToValueAtTime(100,now+.4);
        wg1.gain.setValueAtTime(bv*.6,now);wg1.gain.exponentialRampToValueAtTime(.001,now+.4);
        w1.start(now);w1.stop(now+.4);
        // Sparkle layer
        for(let i=0;i<5;i++){const sO=this.ctx.createOscillator(),sG=this.ctx.createGain();sO.connect(sG);sG.connect(this.sfxGain);sO.type='sine';sO.frequency.setValueAtTime(1200+Math.random()*800,now+i*.06);sG.gain.setValueAtTime(bv*.15,now+i*.06);sG.gain.exponentialRampToValueAtTime(.001,now+i*.06+.08);sO.start(now+i*.06);sO.stop(now+i*.06+.08);}
        this._noise(now,.08,bv*.4); break;
      case 'special_bheema':
        // Earth-shattering smash - deep rumbling bass
        osc.type='sawtooth'; osc.frequency.setValueAtTime(80,now);
        osc.frequency.exponentialRampToValueAtTime(20,now+.5);
        gain.gain.setValueAtTime(bv*2.2,now); gain.gain.exponentialRampToValueAtTime(.001,now+.55);
        osc.start(now); osc.stop(now+.55);
        // Sub-bass rumble
        const sub=this.ctx.createOscillator(),sg=this.ctx.createGain();
        sub.connect(sg);sg.connect(this.sfxGain);
        sub.type='sine';sub.frequency.setValueAtTime(50,now);
        sub.frequency.exponentialRampToValueAtTime(15,now+.5);
        sg.gain.setValueAtTime(bv*1.5,now);sg.gain.exponentialRampToValueAtTime(.001,now+.5);
        sub.start(now);sub.stop(now+.5);
        this._noise(now,.2,bv*1.2); break;
      case 'special_yudhi':
        // Royal decree - majestic horn-like fanfare
        osc.type='triangle'; osc.frequency.setValueAtTime(300,now);
        osc.frequency.setValueAtTime(380,now+.1);
        osc.frequency.setValueAtTime(450,now+.2);
        osc.frequency.exponentialRampToValueAtTime(150,now+.5);
        gain.gain.setValueAtTime(bv*1.2,now); gain.gain.setValueAtTime(bv*1.2,now+.4);
        gain.gain.exponentialRampToValueAtTime(.001,now+.55);
        osc.start(now); osc.stop(now+.55);
        // Brass-like overtone
        const br=this.ctx.createOscillator(),bg=this.ctx.createGain();
        br.connect(bg);bg.connect(this.sfxGain);
        br.type='square';br.frequency.setValueAtTime(600,now);
        br.frequency.setValueAtTime(760,now+.1);
        br.frequency.setValueAtTime(900,now+.2);
        br.frequency.exponentialRampToValueAtTime(300,now+.5);
        bg.gain.setValueAtTime(bv*.4,now);bg.gain.exponentialRampToValueAtTime(.001,now+.5);
        br.start(now);br.stop(now+.55); break;
      case 'special_duryo':
        // Dark malevolent energy - harsh, clashing
        osc.type='sawtooth'; osc.frequency.setValueAtTime(200,now);
        osc.frequency.exponentialRampToValueAtTime(800,now+.1);
        osc.frequency.exponentialRampToValueAtTime(30,now+.5);
        gain.gain.setValueAtTime(bv*1.8,now); gain.gain.exponentialRampToValueAtTime(.001,now+.55);
        osc.start(now); osc.stop(now+.55);
        // Discordant second oscillator
        const d1=this.ctx.createOscillator(),dg1=this.ctx.createGain();
        d1.connect(dg1);dg1.connect(this.sfxGain);
        d1.type='square';d1.frequency.setValueAtTime(230,now);
        d1.frequency.setValueAtTime(860,now+.1);
        d1.frequency.exponentialRampToValueAtTime(40,now+.45);
        dg1.gain.setValueAtTime(bv*.7,now);dg1.gain.exponentialRampToValueAtTime(.001,now+.5);
        d1.start(now);d1.stop(now+.5);
        this._noise(now,.15,bv*1.1); break;
      case 'special_nakula':
        // Swift blade dance - quick, nimble slicks
        osc.type='sine'; osc.frequency.setValueAtTime(500,now);
        osc.frequency.exponentialRampToValueAtTime(1200,now+.06);
        osc.frequency.exponentialRampToValueAtTime(300,now+.15);
        gain.gain.setValueAtTime(bv*1.3,now); gain.gain.exponentialRampToValueAtTime(.001,now+.18);
        osc.start(now); osc.stop(now+.18);
        // Rapid flurry - 3 quick strikes
        for(let i=0;i<3;i++){const sO=this.ctx.createOscillator(),sG=this.ctx.createGain();sO.connect(sG);sG.connect(this.sfxGain);sO.type='triangle';sO.frequency.setValueAtTime(700,now+i*.06);sO.frequency.exponentialRampToValueAtTime(200,now+i*.06+.08);sG.gain.setValueAtTime(bv*.5,now+i*.06);sG.gain.exponentialRampToValueAtTime(.001,now+i*.06+.1);sO.start(now+i*.06);sO.stop(now+i*.06+.1);}
        this._noise(now,.05,bv*.6); break;
      case 'special_sahadeva':
        // Mystical celestial strike - ethereal, otherworldly
        osc.type='triangle'; osc.frequency.setValueAtTime(400,now);
        osc.frequency.setValueAtTime(600,now+.08);
        osc.frequency.setValueAtTime(900,now+.16);
        osc.frequency.exponentialRampToValueAtTime(100,now+.5);
        gain.gain.setValueAtTime(bv*1.4,now); gain.gain.exponentialRampToValueAtTime(.001,now+.55);
        osc.start(now); osc.stop(now+.55);
        // Celestial shimmer
        const c1=this.ctx.createOscillator(),cg1=this.ctx.createGain();
        c1.connect(cg1);cg1.connect(this.sfxGain);
        c1.type='sine';c1.frequency.setValueAtTime(800,now);
        c1.frequency.setValueAtTime(1200,now+.08);
        c1.frequency.setValueAtTime(1800,now+.16);
        c1.frequency.linearRampToValueAtTime(300,now+.45);
        cg1.gain.setValueAtTime(bv*.5,now);cg1.gain.exponentialRampToValueAtTime(.001,now+.5);
        c1.start(now);c1.stop(now+.5);
        // Sparkle dust
        for(let i=0;i<6;i++){const pO=this.ctx.createOscillator(),pG=this.ctx.createGain();pO.connect(pG);pG.connect(this.sfxGain);pO.type='sine';pO.frequency.setValueAtTime(1500+rng(0,1000),now+i*.05);pG.gain.setValueAtTime(bv*.12,now+i*.05);pG.gain.exponentialRampToValueAtTime(.001,now+i*.05+.07);pO.start(now+i*.05);pO.stop(now+i*.05+.07);} break;
      case 'special_karna':
        // Blazing solar energy - bright, piercing, radiant
        osc.type='sawtooth'; osc.frequency.setValueAtTime(500,now);
        osc.frequency.exponentialRampToValueAtTime(1500,now+.08);
        osc.frequency.exponentialRampToValueAtTime(200,now+.4);
        gain.gain.setValueAtTime(bv*1.5,now); gain.gain.exponentialRampToValueAtTime(.001,now+.45);
        osc.start(now); osc.stop(now+.45);
        // Solar flare layer
        const s1=this.ctx.createOscillator(),sg1=this.ctx.createGain();
        s1.connect(sg1);sg1.connect(this.sfxGain);
        s1.type='sine';s1.frequency.setValueAtTime(800,now);
        s1.frequency.linearRampToValueAtTime(2400,now+.12);
        s1.frequency.linearRampToValueAtTime(400,now+.4);
        sg1.gain.setValueAtTime(bv*.8,now);sg1.gain.exponentialRampToValueAtTime(.001,now+.45);
        s1.start(now);s1.stop(now+.45);
        this._noise(now,.1,bv*.6); break;
      case 'crowd_cheer':
        // Cheering burst — layered noise with tonal rise
        this._noise(now,.6,bv*1.5);
        const ch1=this.ctx.createOscillator(),chG=this.ctx.createGain();
        ch1.connect(chG);chG.connect(this.sfxGain);
        ch1.type='sine';ch1.frequency.setValueAtTime(200,now);
        ch1.frequency.linearRampToValueAtTime(600,now+.5);
        chG.gain.setValueAtTime(bv*.3,now);chG.gain.exponentialRampToValueAtTime(.001,now+.6);
        ch1.start(now);ch1.stop(now+.6); break;
      case 'crowd_gasp':
        // Collective gasp — quick reversed-style noise sweep
        this._noise(now,.25,bv*1.2);
        const gs=this.ctx.createOscillator(),gsG=this.ctx.createGain();
        gs.connect(gsG);gsG.connect(this.sfxGain);
        gs.type='sine';gs.frequency.setValueAtTime(800,now);
        gs.frequency.exponentialRampToValueAtTime(200,now+.2);
        gsG.gain.setValueAtTime(bv*.4,now);gsG.gain.exponentialRampToValueAtTime(.001,now+.25);
        gs.start(now);gs.stop(now+.25); break;
    }
  }
  _noise(now,dur,vol){
    if(!this.ctx) return;
    const sz=Math.floor(this.ctx.sampleRate*dur),buf=this.ctx.createBuffer(1,sz,this.ctx.sampleRate);
    const d=buf.getChannelData(0); for(let i=0;i<sz;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/(sz*.3));
    const s=this.ctx.createBufferSource();s.buffer=buf;
    const g=this.ctx.createGain();g.gain.value=vol;
    s.connect(g);g.connect(this.sfxGain);s.start(now);
  }
  // ── CROWD AMBIENCE ──
  startCrowd(){
    if(this.crowdPlaying||!this.ctx) return;
    this.ensureInit();
    this.crowdPlaying=true;this.crowdIntensity=0;
    this.crowdTargetIntensity=0;
    // Continuous crowd murmur via noise + filtered hum
    const bufSize=Math.floor(this.ctx.sampleRate*.5);
    const buf=this.ctx.createBuffer(1,bufSize,this.ctx.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<bufSize;i++){
      const t=i/this.ctx.sampleRate;
      d[i]=(Math.random()*2-1)*Math.exp(-i/(bufSize*.4))*0.5+
           Math.sin(t*170)*.07+Math.sin(t*230)*.05;
    }
    this.crowdSource=this.ctx.createBufferSource();
    this.crowdSource.buffer=buf;
    this.crowdSource.loop=true;
    this.crowdGain=this.ctx.createGain();
    this.crowdGain.gain.value=0;
    this.crowdSource.connect(this.crowdGain);
    this.crowdGain.connect(this.masterGain);
    this.crowdSource.start();
  }
  setCrowdIntensity(v){
    this.crowdTargetIntensity=clamp(v,0,1);
  }
  updateCrowd(){
    if(!this.crowdPlaying||!this.crowdGain) return;
    this.crowdIntensity+=(this.crowdTargetIntensity-this.crowdIntensity)*.1;
    this.crowdGain.gain.value=this.crowdIntensity*.04;
  }
  crowdCheer(vol=1){
    if(!this.ctx) return;
    this.playSfx('crowd_cheer',1,vol);
  }
  crowdGasp(vol=1){
    if(!this.ctx) return;
    this.playSfx('crowd_gasp',1,vol);
  }
  stopCrowd(){
    this.crowdPlaying=false;
    if(this.crowdSource)try{this.crowdSource.stop()}catch(e){};
    if(this.crowdGain)this.crowdGain.gain.value=0;
  }

  startMusic(intensity=0){
    if(this.musicPlaying||!this.ctx) return;
    this.musicPlaying=true; this.musicIntensity=intensity; this.ensureInit();
    const now=this.ctx.currentTime,base=110;
    const d1=this.ctx.createOscillator(),g1=this.ctx.createGain();
    d1.type='sine';d1.frequency.value=base;g1.gain.value=.06;d1.connect(g1);g1.connect(this.musicGain);d1.start(now);
    this.musicOscs.push(d1);
    const d2=this.ctx.createOscillator(),g2=this.ctx.createGain();
    d2.type='sine';d2.frequency.value=base*1.5;g2.gain.value=.04;d2.connect(g2);g2.connect(this.musicGain);d2.start(now);
    this.musicOscs.push(d2);
    const pulse=this.ctx.createOscillator(),pg=this.ctx.createGain();
    pulse.type='triangle';pulse.frequency.value=base*2;
    pg.gain.setValueAtTime(0,now);pulse.connect(pg);pg.connect(this.musicGain);pulse.start(now);
    this.musicOscs.push(pulse);
    const pi=setInterval(()=>{
      if(!this.musicPlaying){clearInterval(pi);return;}
      const t=this.ctx.currentTime,v=.04+this.musicIntensity*.1;
      pg.gain.setValueAtTime(v,t);pg.gain.exponentialRampToValueAtTime(.001,t+.06);
      setTimeout(()=>{
        if(!this.musicPlaying) return;
        const t2=this.ctx.currentTime;
        pg.gain.setValueAtTime(v*.5,t2);pg.gain.exponentialRampToValueAtTime(.001,t2+.04);
      },200);
    },400);
    this._pulseInterval=pi;
  }
  setMusicIntensity(v){this.musicIntensity=clamp(v,0,1);if(this.musicGain) this.musicGain.gain.value=.08+this.musicIntensity*.18;}
  stopMusic(){this.musicPlaying=false;if(this._pulseInterval)clearInterval(this._pulseInterval);this.musicOscs.forEach(o=>{try{o.stop()}catch(e){}});this.musicOscs=[];this.stopCrowd();}
}

// ─── PARTICLE SYSTEM (performance-optimized with object pooling) ─
class Particle {
  constructor(){this.trailPos=[];this.maxTrail=6;this.reset(0,0,{});}
  reset(x,y,cfg={}){
    this.x=x;this.y=y;
    this.type=cfg.type||'spark';
    this.life=cfg.life||1;this.maxLife=this.life;
    this.size=cfg.size||4;this.speed=cfg.speed||200;
    const a=cfg.angle!=null?cfg.angle:(cfg.spread?0:Math.random()*Math.PI*2);
    this.angle=a;
    this.vx=Math.cos(a)*this.speed;this.vy=Math.sin(a)*this.speed;
    this.gravity=cfg.gravity||0;this.drag=cfg.drag||.97;
    this._colorCache=Array.isArray(cfg.color)?cfg.color:null;
    this.color=Array.isArray(cfg.color)?cfg.color[Math.floor(Math.random()*cfg.color.length)]:(cfg.color||'#ff6b35');
    this.colors=cfg.colors||null;
    this.alpha=1;this.rotation=Math.random()*Math.PI*2;this.rotSpeed=(Math.random()-.5)*10;
    this.trail=cfg.trail||false;this.trailPos.length=0;
    this.fadeOut=cfg.fadeOut!==false;this.scaleX=1;this.scaleY=1;
    this._text=cfg.text||null;
    return this;
  }
  update(dt){
    if(this.trail&&this.trailPos.length<this.maxTrail) this.trailPos.push({x:this.x,y:this.y});
    this.vx*=this.drag;this.vy*=this.drag;this.vy+=this.gravity*dt;
    this.x+=this.vx*dt;this.y+=this.vy*dt;
    this.rotation+=this.rotSpeed*dt;this.life-=dt;
    if(this.fadeOut) this.alpha=Math.max(0,this.life/this.maxLife);
  }
  get dead(){return this.life<=0}
  draw(ctx){
    if(this.alpha<=0) return;
    ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(this.rotation);
    ctx.scale(this.scaleX,this.scaleY);
    const c=this.colors?this.colors[Math.floor(Math.random()*this.colors.length)]:this.color;
    if(this.trail&&this.trailPos.length>1){
      ctx.beginPath();ctx.moveTo(this.trailPos[0].x-this.x,this.trailPos[0].y-this.y);
      for(let i=1;i<this.trailPos.length;i++) ctx.lineTo(this.trailPos[i].x-this.x,this.trailPos[i].y-this.y);
      ctx.strokeStyle=c;ctx.globalAlpha=this.alpha*.4;ctx.lineWidth=this.size*.4;ctx.stroke();
    }
    ctx.globalAlpha=this.alpha;
    switch(this.type){
      case 'spark':
        ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=12;
        ctx.beginPath();ctx.arc(0,0,this.size*this.alpha,0,Math.PI*2);ctx.fill();break;
      case 'glow':{
        const g=ctx.createRadialGradient(0,0,0,0,0,this.size*3);
        g.addColorStop(0,c);g.addColorStop(1,'transparent');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,this.size*3,0,Math.PI*2);ctx.fill();break;
      }
      case 'ring':
        ctx.strokeStyle=c;ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(0,0,this.size*(1+(1-this.alpha)*3),0,Math.PI*2);ctx.stroke();break;
      case 'shard':
        ctx.fillStyle=c;ctx.beginPath();
        ctx.moveTo(0,-this.size*this.alpha);ctx.lineTo(this.size*.5*this.alpha,0);
        ctx.lineTo(0,this.size*this.alpha);ctx.lineTo(-this.size*.5*this.alpha,0);
        ctx.closePath();ctx.fill();break;
      case 'smoke':
        ctx.fillStyle=c;ctx.globalAlpha=this.alpha*.25;
        ctx.beginPath();ctx.arc(0,0,this.size*(2-this.alpha*.5),0,Math.PI*2);ctx.fill();break;
      case 'sparkle':
        ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=20;
        const s=this.size*this.alpha;ctx.fillRect(-s/2,-s/2,s,s);break;
      case 'blood':
        ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,0,this.size*this.alpha*1.3,0,Math.PI*2);ctx.fill();break;
      case 'text':
        ctx.fillStyle=c;ctx.font=`bold ${Math.floor(this.size*(.7+.3*this.alpha))}px Rajdhani,sans-serif`;
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=6;
        if(this._text) ctx.fillText(this._text,0,0);break;
      case 'snow':
        ctx.fillStyle=c;ctx.globalAlpha=this.alpha*.6;
        ctx.fillRect(-1,-1,2,2);break;
    }
    ctx.restore();
  }
}

class ParticleSystem {
  constructor(game){
    this.game=game;
    this.particles=[];this.pool=[];
  }
  _alloc(x,y,cfg={}){
    let p;
    if(this.pool.length>0){p=this.pool.pop();}else{p=new Particle();}
    p.reset(x,y,cfg);
    this.particles.push(p);
    return p;
  }
  emit(x,y,cfg={}){
    const c=cfg.count||10;
    // Cap particles to prevent lag
    const skip=!cfg._force&&this.particles.length+this.pool.length>CONFIG.MAX_PARTICLES;
    const skipMobile=this.game&&this.game.isMobile&&CONFIG.PARTICLE_SKIP_MOBILE>Math.random();
    const spread=cfg.spread;
    const baseAngle=cfg.angle||0;
    for(let i=0;i<c;i++){
      if(skip&&Math.random()<.5)continue;
      if(skipMobile&&Math.random()<CONFIG.PARTICLE_SKIP_MOBILE)continue;
      const a=spread?baseAngle+(Math.random()-.5)*spread:Math.random()*Math.PI*2;
      this._alloc(x,y,{
        type:cfg.type||'spark',life:(cfg.life||.5)*(.7+Math.random()*.6),
        size:(cfg.size||4)*(.5+Math.random()),
        speed:(cfg.speed||200)*(.5+Math.random()),
        angle:a,
        color:Array.isArray(cfg.color)?cfg.color:[cfg.color||'#ff6b35'],
        colors:cfg.colors||null,gravity:cfg.gravity||0,drag:cfg.drag||.97,
        trail:cfg.trail||false,fadeOut:cfg.fadeOut!==false,
        text:cfg.text||null,
      });
    }
  }
  emitText(x,y,text,color='#ffd700',size=28){
    this._alloc(x,y,{type:'text',life:.9,size,color,gravity:-120,speed:120,angle:-Math.PI/2,fadeOut:true,drag:.9,text});
  }
  hitSparks(x,y,color='#ff6b35'){
    this.emit(x,y,{count:20,type:'spark',speed:400,life:.35,size:3,spread:Math.PI,color:[color,'#ffffff','#ffd700'],gravity:350,drag:.93});
    this.emit(x,y,{count:6,type:'glow',speed:50,life:.2,size:18,color});
    this.emit(x,y,{count:8,type:'blood',speed:250,life:.5,size:4,spread:Math.PI*.8,color:'#cc0000',gravity:450});
    this.emit(x,y,{count:4,type:'shard',speed:200,life:.3,size:5,spread:Math.PI,color:['#ffffff','#ffd700'],gravity:200});
  }
  heavyHitSparks(x,y){
    this.emit(x,y,{count:35,type:'spark',speed:550,life:.45,size:5,spread:Math.PI*2,color:['#ff4400','#ffffff','#ffd700','#ff8800'],gravity:250,trail:true});
    this.emit(x,y,{count:10,type:'ring',speed:0,life:.4,size:30,color:'#ff4400'});
    this.emit(x,y,{count:14,type:'glow',speed:100,life:.35,size:35,color:'#ffd700'});
    this.emit(x,y,{count:12,type:'blood',speed:350,life:.6,size:5,spread:Math.PI*.6,color:'#cc0000',gravity:500});
  }
  specialBurst(x,y,color='#ffd700'){
    this.emit(x,y,{count:50,type:'spark',speed:500,life:.7,size:5,spread:Math.PI*2,color:[color,'#ffffff','#ff8800','#ff4400'],gravity:80,trail:true});
    this.emit(x,y,{count:10,type:'ring',speed:0,life:.6,size:25,color});
    this.emit(x,y,{count:16,type:'glow',speed:100,life:.5,size:30,color});
    this.emit(x,y,{count:8,type:'shard',speed:400,life:.4,size:8,spread:Math.PI*2,color:['#ffffff',color],gravity:150});
  }
  deathBurst(x,y){
    this.emit(x,y,{count:100,type:'spark',speed:650,life:1,size:7,spread:Math.PI*2,color:['#ff4400','#ff8800','#ffd700','#ffffff'],gravity:150,trail:true});
    this.emit(x,y,{count:20,type:'ring',speed:0,life:.9,size:50,color:'#ff4400'});
    this.emit(x,y,{count:30,type:'smoke',speed:150,life:1.5,size:40,spread:Math.PI*2,color:'#333333',gravity:-40});
    this.emit(x,y,{count:25,type:'glow',speed:180,life:.6,size:35,color:'#ff4400'});
    this.emit(x,y,{count:15,type:'shard',speed:500,life:.5,size:10,spread:Math.PI*2,color:['#ffd700','#ffffff'],gravity:200});
  }
  footstep(x,y){this.emit(x,y,{count:2,type:'smoke',speed:20,life:.2,size:7,spread:.5,color:'#665544',gravity:0});}
  land(x,y){this.emit(x,y,{count:5,type:'smoke',speed:40,life:.25,size:10,spread:.3,color:'#776655',gravity:0});}
  update(dt){
    let writeIdx=0;
    for(let i=0,len=this.particles.length;i<len;i++){
      const p=this.particles[i];
      p.update(dt);
      if(p.dead){this.pool.push(p);continue;}
      this.particles[writeIdx++]=p;
    }
    this.particles.length=writeIdx;
  }
  draw(ctx){
    for(let i=0,len=this.particles.length;i<len;i++){this.particles[i].draw(ctx);}
  }
  clear(){
    for(let i=0;i<this.particles.length;i++){this.pool.push(this.particles[i]);}
    this.particles.length=0;
  }
}

// ─── ANIMATION HELPERS ─────────────────────────────────────
// Smooth animation blend helpers
const ANIM = {
  idle: (f) => ({ torso: Math.sin(f*.06)*.015, head: Math.sin(f*.05)*.008, weapon: Math.sin(f*.04)*.02 }),
  walk: (f,speed=1) => ({
    legL: Math.sin(f*.1*speed)*.3, legR: Math.sin(f*.1*speed+Math.PI)*.3,
    armL: Math.sin(f*.1*speed+Math.PI)*.2, armR: Math.sin(f*.1*speed)*.2,
    bodyLean: Math.sin(f*.1*speed)*.05,
  }),
  attack: (f,type='light') => {
    const dur=type==='heavy'?8:5;
    const t=Math.min(f/dur,1);
    const windup=easeInOut(Math.min(t*2,1));
    const strike=Math.max(0,Math.min((t-.5)*4,1));
    const recover=Math.max(0,Math.min((t-.75)*4,1));
    return {windup,strike,recover,t};
  },
  hitstun: (f) => ({ stagger: Math.sin(f*.15)*.1, lean: -.08 }),
  knockdown: (f) => {
    const t=Math.min(f/20,1);
    return {yOffset:-t*60,rotation:-t*.8*Math.PI,alpha:1-t};
  },
};

// ─── CHARACTER DEFINITIONS (Premium Art) ──────────────────
const CHARACTERS = [
  {
    id:'arjuna',name:'Arjuna',title:'The Peerless Archer',
    devanagari:'अर्जुन',color:'#4fc3f7',colorDark:'#0288d1',
    weapon:'Gandiva Bow',weaponDevanagari:'गाण्डीव',
    stats:{hp:100,speed:185,attack:13,defense:8,specialDmg:34},
    taunt:'I am Arjuna, the greatest archer!',
    taunt2:'Pashupatastra, arise!',
    defeatQuote:'Dharma always triumphs...',
    colors:{skin:'#d4a574',skinShadow:'#b8885a',hair:'#1a1a1a',cloth:'#2a2a3a',clothLight:'#3a3a4a',armor:'#1565c0',armorLight:'#1e88e5',dhoti:'#e8d5b0',dhotiShadow:'#c4a882',gold:'#ffd700',goldShadow:'#c8a000'},
    draw:(ctx,x,y,w,h,facing,animFrame,state,flash)=>{
      ctx.save();ctx.translate(x,y);
      if(facing<0)ctx.scale(-1,1);
      const f=animFrame;
      const breath=Math.sin(f*.06)*2;
      const atk=state.attacking?ANIM.attack(f,state.attackType):null;
      const hitstun=state.hitstun>0;
      const hitLean=hitstun?-.06:0;
      const blockLean=state.blocking?.05:0;
      const bodyY=breath+hitLean*60;
      const c=flash?{skin:'#fff',hair:'#fff',cloth:'#fff',clothLight:'#fff',armor:'#fff',armorLight:'#fff',dhoti:'#fff',dhotiShadow:'#fff',gold:'#fff',goldShadow:'#fff'}:CHARACTERS[0].colors;
      ctx.shadowColor=state.specialActive?'#4fc3f7':'transparent';
      ctx.shadowBlur=state.specialActive?45+Math.sin(f*.15)*15:0;
      
      // ─── TORSO (gradient) ───
      const bodyG=ctx.createLinearGradient(0,-h*.45+bodyY,0,-h*.05+bodyY);
      bodyG.addColorStop(0,c.clothLight);bodyG.addColorStop(1,c.cloth);
      ctx.fillStyle=bodyG;
      ctx.beginPath();
      ctx.moveTo(-w*.26,-h*.45+bodyY);ctx.quadraticCurveTo(-w*.3,-h*.25+bodyY,-w*.26,-h*.05+bodyY);
      ctx.lineTo(w*.26,-h*.05+bodyY);ctx.quadraticCurveTo(w*.3,-h*.25+bodyY,w*.26,-h*.45+bodyY);
      ctx.closePath();ctx.fill();
      
      // Armor chest plate
      const armorG=ctx.createLinearGradient(0,-h*.42+bodyY,0,-h*.2+bodyY);
      armorG.addColorStop(0,c.armorLight);armorG.addColorStop(1,c.armor);
      ctx.fillStyle=armorG;
      ctx.beginPath();
      ctx.moveTo(-w*.18,-h*.43+bodyY);ctx.quadraticCurveTo(-w*.22,-h*.32+bodyY,-w*.18,-h*.18+bodyY);
      ctx.lineTo(w*.18,-h*.18+bodyY);ctx.quadraticCurveTo(w*.22,-h*.32+bodyY,w*.18,-h*.43+bodyY);
      ctx.closePath();ctx.fill();
      ctx.strokeStyle=c.gold;ctx.lineWidth=1;
      ctx.stroke();
      
      // Chest emblem (Om)
      ctx.fillStyle=c.gold;ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.shadowColor=c.gold;ctx.shadowBlur=8;
      ctx.fillText('ॐ',0,-h*.3+bodyY);
      ctx.shadowBlur=0;
      
      // Belt
      ctx.fillStyle=c.gold;
      ctx.fillRect(-w*.2,-h*.09+bodyY,w*.4,4);
      ctx.fillStyle=c.goldShadow;
      ctx.fillRect(-w*.2,-h*.06+bodyY,w*.4,2);
      
      // DHOTI (gradient)
      const dhotiG=ctx.createLinearGradient(0,-h*.06+bodyY,0,h*.05+bodyY);
      dhotiG.addColorStop(0,c.dhoti);dhotiG.addColorStop(1,c.dhotiShadow);
      ctx.fillStyle=dhotiG;
      ctx.beginPath();
      ctx.moveTo(-w*.24,-h*.06+bodyY);ctx.quadraticCurveTo(-w*.28,h*.02+bodyY,-w*.2,h*.1+bodyY);
      ctx.lineTo(w*.2,h*.1+bodyY);ctx.quadraticCurveTo(w*.28,h*.02+bodyY,w*.24,-h*.06+bodyY);
      ctx.closePath();ctx.fill();
      // Dhoti folds
      ctx.strokeStyle='rgba(0,0,0,.1)';ctx.lineWidth=1;
      for(let i=0;i<3;i++){const yy=-h*.03+bodyY+i*12;ctx.beginPath();ctx.moveTo(-w*.12,yy);ctx.lineTo(w*.12,yy+3);ctx.stroke();}
      
      // ARMS
      const armW=.08;const armLen=.3;
      // Left arm (quiver arm, behind)
      ctx.fillStyle=c.skin;
      ctx.save();ctx.translate(-w*.28,-h*.35+bodyY);
      ctx.rotate(.15+blockLean);
      ctx.beginPath();ctx.ellipse(0,armLen*h*.5,armW*w*.5,armLen*h*.5,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      // Right arm (bow arm)
      ctx.fillStyle=c.skin;
      ctx.save();ctx.translate(w*.25,-h*.35+bodyY);
      const armAngle=state.attacking?.15+.3*Math.min(f/5,1):.15;
      ctx.rotate(armAngle);
      ctx.beginPath();ctx.ellipse(0,armLen*h*.5,armW*w*.5,armLen*h*.5,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      
      // QUIVER on back
      ctx.fillStyle='#5d4037';
      ctx.beginPath();
      ctx.moveTo(-w*.3,-h*.35+bodyY);ctx.lineTo(-w*.36,-h*.05+bodyY);
      ctx.lineTo(-w*.28,-h*.05+bodyY);ctx.lineTo(-w*.24,-h*.35+bodyY);
      ctx.closePath();ctx.fill();
      // Arrows in quiver
      for(let i=0;i<4;i++){
        ctx.fillStyle='#ccc';ctx.fillRect(-w*.3+i*3,-h*.3+bodyY+i*5,2,20);
        ctx.fillStyle='#fff';ctx.beginPath();
        ctx.moveTo(-w*.29+i*3,-h*.1+bodyY+i*5);ctx.lineTo(-w*.27+i*3,-h*.12+bodyY+i*5);ctx.lineTo(-w*.29+i*3,-h*.14+bodyY+i*5);ctx.closePath();ctx.fill();
      }
      
      // BOW (Gandiva) - drawn when not attacking
      if(!state.attacking){
        ctx.strokeStyle=c.gold;ctx.lineWidth=3.5;
        ctx.shadowColor=c.gold;ctx.shadowBlur=10;
        ctx.beginPath();ctx.arc(w*.32,bodyY,w*.22,-.9,.9);ctx.stroke();
        ctx.shadowBlur=0;
        ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.2;
        ctx.beginPath();
        const sa=-.9,ea=.9,r=w*.22;
        ctx.moveTo(w*.32+r*Math.cos(sa),bodyY+r*Math.sin(sa));
        ctx.lineTo(w*.32+r*Math.cos(ea),bodyY+r*Math.sin(ea));
        ctx.stroke();
      }
      
      // HEAD
      const headY=-h*.5+bodyY;
      // Neck
      ctx.fillStyle=c.skin;
      ctx.fillRect(-w*.06,headY+w*.04,w*.12,w*.06);
      
      // Face gradient
      const faceG=ctx.createRadialGradient(0,headY,w*.05,0,headY,w*.18);
      faceG.addColorStop(0,c.skin);faceG.addColorStop(1,c.skinShadow);
      ctx.fillStyle=faceG;
      ctx.beginPath();ctx.arc(0,headY,w*.18,0,Math.PI*2);ctx.fill();
      
      // Eyes
      ctx.fillStyle='#1a1a1a';
      ctx.fillRect(-w*.07,headY-w*.02,w*.045,w*.03);
      ctx.fillRect(w*.025,headY-w*.02,w*.045,w*.03);
      // Eyebrow
      ctx.strokeStyle='#1a1a1a';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(-w*.08,headY-w*.04);ctx.lineTo(-w*.02,headY-w*.035);ctx.stroke();
      ctx.beginPath();ctx.moveTo(w*.02,headY-w*.035);ctx.lineTo(w*.08,headY-w*.04);ctx.stroke();
      
      // Nose
      ctx.fillStyle=c.skinShadow;
      ctx.beginPath();ctx.moveTo(0,headY+w*.01);ctx.lineTo(-w*.025,headY+w*.05);ctx.lineTo(w*.025,headY+w*.05);ctx.closePath();ctx.fill();
      // Mouth
      ctx.strokeStyle='#8a6a4a';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(-w*.04,headY+w*.08);ctx.lineTo(w*.04,headY+w*.08);ctx.stroke();
      
      // Hair (traditional bun)
      ctx.fillStyle=c.hair;
      ctx.beginPath();ctx.arc(w*.06,headY-w*.08,w*.14,0,Math.PI*2);ctx.fill();
      // Hair strands
      ctx.strokeStyle='#2a2a2a';ctx.lineWidth=1;
      for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(w*.06+i*5,headY-w*.12);ctx.lineTo(w*.02+i*8,headY-w*.02);ctx.stroke();}
      
      // Crown/Tiara
      const crownG=ctx.createLinearGradient(0,headY-w*.12,0,headY-w*.22);
      crownG.addColorStop(0,c.gold);crownG.addColorStop(1,c.goldShadow);
      ctx.fillStyle=crownG;
      ctx.beginPath();
      ctx.moveTo(-w*.16,headY-w*.1);ctx.lineTo(-w*.14,headY-w*.2);
      ctx.lineTo(-w*.07,headY-w*.15);ctx.lineTo(0,headY-w*.24);
      ctx.lineTo(w*.07,headY-w*.15);ctx.lineTo(w*.14,headY-w*.2);
      ctx.lineTo(w*.16,headY-w*.1);ctx.closePath();ctx.fill();
      ctx.strokeStyle=c.goldShadow;ctx.lineWidth=1;ctx.stroke();
      // Crown jewel
      ctx.fillStyle='#ff0000';ctx.beginPath();ctx.arc(0,headY-w*.22,3,0,Math.PI*2);ctx.fill();
      ctx.shadowColor='#ff0000';ctx.shadowBlur=8;ctx.fill();ctx.shadowBlur=0;
      
      // Earrings
      ctx.fillStyle=c.gold;
      ctx.beginPath();ctx.arc(-w*.16,headY+w*.02,3,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(w*.16,headY+w*.02,3,0,Math.PI*2);ctx.fill();
      
      // LEGS
      const legW=.12,legLen=.25;
      const legAnim=state.walking?Math.sin(f*.08)*8:0;
      ctx.fillStyle=c.skin;
      // Left leg
      ctx.save();ctx.translate(-w*.12,bodyY);
      ctx.beginPath();
      ctx.ellipse(0,legLen*h*.5+legAnim,legW*w*.5,legLen*h*.5,0,0,Math.PI*2);
      ctx.fill();
      // Left foot
      ctx.fillStyle='#5d4037';
      ctx.beginPath();ctx.ellipse(0,legLen*h+legAnim,w*.08,w*.04,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      // Right leg
      ctx.save();ctx.translate(w*.12,bodyY);
      ctx.beginPath();
      ctx.ellipse(0,legLen*h*.5-legAnim,legW*w*.5,legLen*h*.5,0,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='#5d4037';
      ctx.beginPath();ctx.ellipse(0,legLen*h-legAnim,w*.08,w*.04,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      
      // ATTACK EFFECT
      if(state.attacking&&state.attackFrame===2){
        ctx.strokeStyle='#4fc3f7';ctx.lineWidth=3;
        ctx.shadowColor='#4fc3f7';ctx.shadowBlur=30;
        ctx.beginPath();ctx.moveTo(w*.3,bodyY-10);
        const atkAngle=state.attackType==='heavy'?.5:.3;
        ctx.lineTo(w*.3+60+Math.sin(f*.2)*15,bodyY-30-20*atkAngle);
        ctx.stroke();
        ctx.fillStyle='#fff';
        ctx.beginPath();ctx.moveTo(w*.3+55+Math.sin(f*.2)*15,bodyY-25-20*atkAngle);
        ctx.lineTo(w*.3+50+Math.sin(f*.2)*15,bodyY-20-20*atkAngle);
        ctx.lineTo(w*.3+50+Math.sin(f*.2)*15,bodyY-30-20*atkAngle);
        ctx.closePath();ctx.fill();
      }
      
      ctx.restore();
    },
    specialEffect:(game,x,y,facing)=>{
      game.particles.specialBurst(x,y,'#4fc3f7');
      game.audio.playSfx('special_arjuna');
      game.screenShake=12;
      for(let i=0;i<22;i++){
        setTimeout(()=>{
          if(!game.battleActive) return;
          const tx=x+(Math.random()-.5)*400,ty=y-280-Math.random()*180;
          game.particles.emit(tx,ty,{count:6,type:'spark',speed:650,life:.4,size:3,angle:Math.PI/2+(Math.random()-.5)*.3,color:['#4fc3f7','#ffffff','#81d4fa'],gravity:550,trail:true});
        },i*45);
      }
    }
  },
  {
    id:'bhima',name:'Bhima',title:'The Mighty',
    devanagari:'भीम',color:'#ff7043',colorDark:'#d84315',
    weapon:'Gada (Mace)',weaponDevanagari:'गदा',
    stats:{hp:160,speed:120,attack:22,defense:14,specialDmg:52},
    taunt:'None can match Bhima\'s strength!',
    taunt2:'Feel the might of my gada!',
    defeatQuote:'Argh... my strength... fades...',
    colors:{skin:'#c49a6c',skinShadow:'#a07a50',hair:'#1a1a1a',cloth:'#3a2a1a',clothLight:'#5a3a2a',armor:'#b71c1c',armorLight:'#e53935',dhoti:'#e8d5b0',dhotiShadow:'#c4a882',gold:'#ffd700',goldShadow:'#c8a000'},
    draw:(ctx,x,y,w,h,facing,animFrame,state,flash)=>{
      ctx.save();ctx.translate(x,y);
      if(facing<0)ctx.scale(-1,1);
      const f=animFrame,breath=Math.sin(f*.05)*2.5,bodyY=breath;
      const atk=state.attacking?ANIM.attack(f,state.attackType):null;
      const c=flash?{skin:'#fff',hair:'#fff',cloth:'#fff',clothLight:'#fff',armor:'#fff',armorLight:'#fff',dhoti:'#fff',dhotiShadow:'#fff',gold:'#fff',goldShadow:'#fff'}:CHARACTERS[1].colors;
      ctx.shadowColor=state.specialActive?'#ff7043':'transparent';
      ctx.shadowBlur=state.specialActive?50+Math.sin(f*.12)*15:0;
      
      // TORSO (larger - Bhima is hefty)
      const bg=ctx.createLinearGradient(0,-h*.45+bodyY,0,-h*.05+bodyY);
      bg.addColorStop(0,c.clothLight);bg.addColorStop(1,c.cloth);
      ctx.fillStyle=bg;
      ctx.beginPath();
      ctx.moveTo(-w*.32,-h*.45+bodyY);ctx.quadraticCurveTo(-w*.36,-h*.25+bodyY,-w*.32,-h*.05+bodyY);
      ctx.lineTo(w*.32,-h*.05+bodyY);ctx.quadraticCurveTo(w*.36,-h*.25+bodyY,w*.32,-h*.45+bodyY);
      ctx.closePath();ctx.fill();
      
      // ARMOR (red)
      const ag=ctx.createLinearGradient(0,-h*.42+bodyY,0,-h*.18+bodyY);
      ag.addColorStop(0,c.armorLight);ag.addColorStop(1,c.armor);
      ctx.fillStyle=ag;
      ctx.beginPath();
      ctx.moveTo(-w*.26,-h*.44+bodyY);ctx.quadraticCurveTo(-w*.3,-h*.3+bodyY,-w*.26,-h*.16+bodyY);
      ctx.lineTo(w*.26,-h*.16+bodyY);ctx.quadraticCurveTo(w*.3,-h*.3+bodyY,w*.26,-h*.44+bodyY);
      ctx.closePath();ctx.fill();
      ctx.strokeStyle=c.gold;ctx.lineWidth=1.5;ctx.stroke();
      
      // Belt
      ctx.fillStyle=c.gold;
      ctx.fillRect(-w*.22,-h*.08+bodyY,w*.44,5);
      ctx.fillStyle=c.goldShadow;
      ctx.fillRect(-w*.22,-h*.04+bodyY,w*.44,2);
      
      // DHOTI
      const dg=ctx.createLinearGradient(0,-h*.04+bodyY,0,h*.06+bodyY);
      dg.addColorStop(0,c.dhoti);dg.addColorStop(1,c.dhotiShadow);
      ctx.fillStyle=dg;
      ctx.beginPath();
      ctx.moveTo(-w*.28,-h*.04+bodyY);ctx.quadraticCurveTo(-w*.32,h*.03+bodyY,-w*.24,h*.12+bodyY);
      ctx.lineTo(w*.24,h*.12+bodyY);ctx.quadraticCurveTo(w*.32,h*.03+bodyY,w*.28,-h*.04+bodyY);
      ctx.closePath();ctx.fill();
      
      // Chest hair
      ctx.fillStyle='rgba(50,30,10,.3)';
      for(let i=0;i<6;i++) ctx.fillRect(-w*.02+i*3,-h*.28+bodyY+i*5,2,6);
      
      // ARMS (thick)
      ctx.fillStyle=c.skin;
      // Left arm
      ctx.save();ctx.translate(-w*.3,-h*.32+bodyY);
      ctx.beginPath();ctx.ellipse(0,.3*h*.5,.1*w*.5,.3*h*.5,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      // Right arm (mace arm)
      ctx.save();ctx.translate(w*.28,-h*.32+bodyY);
      const armA=state.attacking?-.5+.8*Math.min(f/6,1):.1;
      ctx.rotate(armA);
      ctx.beginPath();ctx.ellipse(0,.3*h*.5,.1*w*.5,.3*h*.5,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      
      // HEAD
      const headY=-h*.5+bodyY;
      // Neck (thick)
      ctx.fillStyle=c.skin;
      ctx.fillRect(-w*.08,headY+w*.03,w*.16,w*.06);
      
      const hg=ctx.createRadialGradient(0,headY,w*.06,0,headY,w*.22);
      hg.addColorStop(0,c.skin);hg.addColorStop(1,c.skinShadow);
      ctx.fillStyle=hg;
      ctx.beginPath();ctx.arc(0,headY,w*.22,0,Math.PI*2);ctx.fill();
      
      // Wild hair
      ctx.fillStyle=c.hair;
      for(let i=-4;i<=4;i++){
        ctx.beginPath();ctx.arc(i*w*.06,headY-w*.12+Math.abs(i)*3,w*.1,0,Math.PI*2);ctx.fill();
      }
      // Forehead band
      ctx.fillStyle='#b71c1c';
      ctx.fillRect(-w*.16,headY-w*.14,w*.32,4);
      
      // Angry eyes
      ctx.fillStyle='#fff';
      ctx.fillRect(-w*.1,headY-w*.02,w*.07,w*.03);
      ctx.fillRect(w*.03,headY-w*.02,w*.07,w*.03);
      ctx.fillStyle='#ff0000';
      ctx.fillRect(-w*.09,headY-w*.02,w*.05,w*.025);
      ctx.fillRect(w*.04,headY-w*.02,w*.05,w*.025);
      // Angry eyebrows
      ctx.strokeStyle='#1a1a1a';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(-w*.12,headY-w*.05);ctx.lineTo(-w*.02,headY-w*.04);ctx.stroke();
      ctx.beginPath();ctx.moveTo(w*.02,headY-w*.04);ctx.lineTo(w*.12,headY-w*.05);ctx.stroke();
      
      // Nose
      ctx.fillStyle=c.skinShadow;
      ctx.beginPath();ctx.moveTo(0,headY+w*.01);ctx.lineTo(-w*.03,headY+w*.06);ctx.lineTo(w*.03,headY+w*.06);ctx.closePath();ctx.fill();
      // Mouth (open roar)
      ctx.fillStyle='#2a1a0a';
      ctx.beginPath();ctx.ellipse(0,headY+w*.09,w*.05,w*.03,0,0,Math.PI*2);ctx.fill();
      
      // Earrings
      ctx.fillStyle=c.gold;
      ctx.beginPath();ctx.arc(-w*.2,headY+w*.01,4,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(w*.2,headY+w*.01,4,0,Math.PI*2);ctx.fill();
      
      // MACE (Gada)
      const atkSwing=state.attacking?Math.sin(f*.2)*25:0;
      ctx.fillStyle='#757575';
      ctx.fillRect(w*.24,-h*.15+bodyY+atkSwing,w*.07,h*.3);
      const maceG=ctx.createRadialGradient(w*.27,-h*.22+bodyY+atkSwing,0,w*.27,-h*.22+bodyY+atkSwing,w*.12);
      maceG.addColorStop(0,'#bdbdbd');maceG.addColorStop(.5,'#9e9e9e');maceG.addColorStop(1,'#616161');
      ctx.fillStyle=maceG;
      ctx.beginPath();ctx.arc(w*.27,-h*.22+bodyY+atkSwing,w*.12,0,Math.PI*2);ctx.fill();
      // Mace spikes
      ctx.fillStyle='#616161';
      for(let a=0;a<8;a++){
        const angle=a*Math.PI/4;
        const sx=w*.27+Math.cos(angle)*w*.14,sy=-h*.22+bodyY+Math.sin(angle)*w*.14+atkSwing;
        ctx.beginPath();ctx.arc(sx,sy,4,0,Math.PI*2);ctx.fill();
      }
      // Mace chain
      ctx.strokeStyle='#757575';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(w*.27,-h*.15+bodyY+atkSwing);
      ctx.lineTo(w*.27,-h*.04+bodyY+atkSwing);ctx.stroke();
      
      // LEGS (thick)
      const legAnim=state.walking?Math.sin(f*.07)*8:0;
      ctx.fillStyle=c.skin;
      ctx.save();ctx.translate(-w*.15,bodyY);
      ctx.beginPath();ctx.ellipse(0,.25*h*.5+legAnim,.14*w*.5,.25*h*.5,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5d4037';ctx.beginPath();ctx.ellipse(0,.25*h+legAnim,w*.09,w*.05,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      ctx.save();ctx.translate(w*.15,bodyY);
      ctx.beginPath();ctx.ellipse(0,.25*h*.5-legAnim,.14*w*.5,.25*h*.5,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5d4037';ctx.beginPath();ctx.ellipse(0,.25*h-legAnim,w*.09,w*.05,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      
      ctx.restore();
    },
    specialEffect:(game,x,y,facing)=>{
      game.particles.specialBurst(x,y+20,'#ff7043');
      game.audio.playSfx('special_bheema');
      game.screenShake=30;
      for(let i=0;i<8;i++){
        setTimeout(()=>{
          game.particles.emit(x,y+10,{count:15,type:'ring',speed:0,life:.35,size:30+i*40,color:'#ff7043'});
          game.particles.emit(x+50,CONFIG.GROUND_Y,{count:10,type:'shard',speed:300,life:.3,size:8,spread:Math.PI/2,color:['#ff7043','#d84315','#fff'],gravity:400});
        },i*45);
      }
    }
  },
  {
    id:'karna',name:'Karna',title:'The Radiant Warrior',
    devanagari:'कर्ण',color:'#ffd700',colorDark:'#f9a825',
    weapon:'Vijaya Bow',weaponDevanagari:'विजय धनुष',
    stats:{hp:115,speed:170,attack:16,defense:9,specialDmg:42},
    taunt:'My Vijaya bow will decide your fate!',
    taunt2:'This armor is my birthright!',
    defeatQuote:'A worthy opponent... I salute you...',
    colors:{skin:'#c49a6c',skinShadow:'#a07a50',hair:'#1a1a1a',cloth:'#2a1a0a',clothLight:'#4a2a10',armor:'#ffd700',armorLight:'#ffe082',dhoti:'#e8d5b0',dhotiShadow:'#c4a882',gold:'#ffd700',goldShadow:'#f9a825'},
    draw:(ctx,x,y,w,h,facing,animFrame,state,flash)=>{
      ctx.save();ctx.translate(x,y);
      if(facing<0)ctx.scale(-1,1);
      const f=animFrame,breath=Math.sin(f*.055)*2,bodyY=breath;
      const c=flash?{skin:'#fff',hair:'#fff',cloth:'#fff',clothLight:'#fff',armor:'#fff',armorLight:'#fff',dhoti:'#fff',dhotiShadow:'#fff',gold:'#fff',goldShadow:'#fff'}:CHARACTERS[2].colors;
      ctx.shadowColor=state.specialActive?'#ffd700':'transparent';
      ctx.shadowBlur=state.specialActive?55+Math.sin(f*.13)*20:0;
      
      // TORSO
      const bg=ctx.createLinearGradient(0,-h*.45+bodyY,0,-h*.05+bodyY);
      bg.addColorStop(0,c.clothLight);bg.addColorStop(1,c.cloth);
      ctx.fillStyle=bg;
      ctx.beginPath();
      ctx.moveTo(-w*.26,-h*.45+bodyY);ctx.quadraticCurveTo(-w*.3,-h*.25+bodyY,-w*.26,-h*.05+bodyY);
      ctx.lineTo(w*.26,-h*.05+bodyY);ctx.quadraticCurveTo(w*.3,-h*.25+bodyY,w*.26,-h*.45+bodyY);
      ctx.closePath();ctx.fill();
      
      // GOLDEN ARMOR (Kavach)
      const kg=ctx.createLinearGradient(0,-h*.43+bodyY,0,-h*.18+bodyY);
      kg.addColorStop(0,c.armorLight);kg.addColorStop(1,c.armor);
      ctx.fillStyle=kg;
      ctx.beginPath();
      ctx.moveTo(-w*.23,-h*.44+bodyY);ctx.quadraticCurveTo(-w*.26,-h*.3+bodyY,-w*.23,-h*.16+bodyY);
      ctx.lineTo(w*.23,-h*.16+bodyY);ctx.quadraticCurveTo(w*.26,-h*.3+bodyY,w*.23,-h*.44+bodyY);
      ctx.closePath();ctx.fill();
      ctx.strokeStyle=c.goldShadow;ctx.lineWidth=1.5;
      ctx.stroke();
      // Kavach pattern
      for(let i=0;i<4;i++){
        ctx.fillStyle='#ff8f00';
        ctx.beginPath();ctx.arc(-w*.15+i*w*.1,-h*.28+bodyY,3,0,Math.PI*2);ctx.fill();
      }
      // Chest emblem (sun)
      ctx.fillStyle=c.goldShadow;
      ctx.beginPath();ctx.arc(0,-h*.3+bodyY,8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=c.gold;
      ctx.beginPath();ctx.arc(0,-h*.3+bodyY,5,0,Math.PI*2);ctx.fill();
      
      // Belt
      ctx.fillStyle=c.gold;
      ctx.fillRect(-w*.2,-h*.08+bodyY,w*.4,4);
      
      // DHOTI
      const dg=ctx.createLinearGradient(0,-h*.04+bodyY,0,h*.06+bodyY);
      dg.addColorStop(0,c.dhoti);dg.addColorStop(1,c.dhotiShadow);
      ctx.fillStyle=dg;
      ctx.beginPath();
      ctx.moveTo(-w*.24,-h*.04+bodyY);ctx.quadraticCurveTo(-w*.28,h*.02+bodyY,-w*.2,h*.1+bodyY);
      ctx.lineTo(w*.2,h*.1+bodyY);ctx.quadraticCurveTo(w*.28,h*.02+bodyY,w*.24,-h*.04+bodyY);
      ctx.closePath();ctx.fill();
      
      // HEAD
      const headY=-h*.5+bodyY;
      ctx.fillStyle=c.skin;
      ctx.fillRect(-w*.06,headY+w*.04,w*.12,w*.05);
      const hg=ctx.createRadialGradient(0,headY,w*.05,0,headY,w*.18);
      hg.addColorStop(0,c.skin);hg.addColorStop(1,c.skinShadow);
      ctx.fillStyle=hg;
      ctx.beginPath();ctx.arc(0,headY,w*.18,0,Math.PI*2);ctx.fill();
      
      // Hair
      ctx.fillStyle=c.hair;
      ctx.beginPath();ctx.arc(0,headY-w*.08,w*.14,0,Math.PI*2);ctx.fill();
      // Hair strands
      ctx.strokeStyle='#2a2a2a';ctx.lineWidth=1;
      for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(0+i*4,headY-w*.14);ctx.lineTo(-2+i*7,headY-w*.02);ctx.stroke();}
      
      // Royal crown
      const cg=ctx.createLinearGradient(0,headY-w*.1,0,headY-w*.24);
      cg.addColorStop(0,c.gold);cg.addColorStop(1,c.goldShadow);
      ctx.fillStyle=cg;
      ctx.beginPath();
      ctx.moveTo(-w*.18,headY-w*.1);ctx.lineTo(-w*.14,headY-w*.22);
      ctx.lineTo(-w*.07,headY-w*.16);ctx.lineTo(0,headY-w*.26);
      ctx.lineTo(w*.07,headY-w*.16);ctx.lineTo(w*.14,headY-w*.22);
      ctx.lineTo(w*.18,headY-w*.1);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ff0000';
      ctx.beginPath();ctx.arc(0,headY-w*.24,3,0,Math.PI*2);ctx.fill();
      
      // Eyes
      ctx.fillStyle='#1a1a1a';
      ctx.fillRect(-w*.07,headY-w*.02,w*.045,w*.03);
      ctx.fillRect(w*.025,headY-w*.02,w*.045,w*.03);
      ctx.strokeStyle='#1a1a1a';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(-w*.08,headY-w*.04);ctx.lineTo(-w*.02,headY-w*.035);ctx.stroke();
      ctx.beginPath();ctx.moveTo(w*.02,headY-w*.035);ctx.lineTo(w*.08,headY-w*.04);ctx.stroke();
      
      // Nose & mouth
      ctx.fillStyle=c.skinShadow;
      ctx.beginPath();ctx.moveTo(0,headY+w*.01);ctx.lineTo(-w*.025,headY+w*.05);ctx.lineTo(w*.025,headY+w*.05);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#8a6a4a';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(-w*.04,headY+w*.08);ctx.lineTo(w*.04,headY+w*.08);ctx.stroke();
      
      // Kundal (earrings)
      ctx.fillStyle=c.gold;
      ctx.beginPath();ctx.arc(-w*.18,headY+w*.02,4,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(w*.18,headY+w*.02,4,0,Math.PI*2);ctx.fill();
      
      // BOW (Vijaya)
      if(!state.attacking){
        ctx.strokeStyle=c.gold;ctx.lineWidth=3.5;
        ctx.shadowColor=c.gold;ctx.shadowBlur=15;
        ctx.beginPath();ctx.arc(w*.32,bodyY,w*.24,-.85,.85);ctx.stroke();
        ctx.shadowBlur=0;
        ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.2;
        ctx.beginPath();
        const r=w*.24;ctx.moveTo(w*.32+r*Math.cos(-.85),bodyY+r*Math.sin(-.85));
        ctx.lineTo(w*.32+r*Math.cos(.85),bodyY+r*Math.sin(.85));ctx.stroke();
      }
      
      // LEGS
      const legAnim=state.walking?Math.sin(f*.08)*7:0;
      ctx.fillStyle=c.skin;
      ctx.save();ctx.translate(-w*.12,bodyY);
      ctx.beginPath();ctx.ellipse(0,.25*h*.5+legAnim,.1*w*.5,.25*h*.5,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5d4037';ctx.beginPath();ctx.ellipse(0,.25*h+legAnim,w*.07,w*.04,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      ctx.save();ctx.translate(w*.12,bodyY);
      ctx.beginPath();ctx.ellipse(0,.25*h*.5-legAnim,.1*w*.5,.25*h*.5,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5d4037';ctx.beginPath();ctx.ellipse(0,.25*h-legAnim,w*.07,w*.04,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      
      ctx.restore();
    },
    specialEffect:(game,x,y,facing)=>{
      game.particles.specialBurst(x,y,'#ffd700');
      game.audio.playSfx('special_karna');
      game.screenShake=14;
      for(let i=0;i<25;i++){
        setTimeout(()=>{
          if(!game.battleActive) return;
          const angle=-Math.PI/2+(Math.random()-.5)*2;
          game.particles.emit(x+Math.cos(angle)*60,y+Math.sin(angle)*60,{
            count:5,type:'sparkle',speed:700,life:.5,size:4,angle,
            color:['#ffd700','#ffffff','#ffecb3'],gravity:250,trail:true,
          });
        },i*30);
      }
    }
  },
  {
    id:'duryodhana',name:'Duryodhana',title:'The Crowned Prince',
    devanagari:'दुर्योधन',color:'#b71c1c',colorDark:'#7f0000',
    weapon:'Iron Mace',weaponDevanagari:'लौह गदा',
    stats:{hp:145,speed:140,attack:19,defense:12,specialDmg:46},
    taunt:'I am the rightful king of Hastinapur!',
    taunt2:'No one can stand against me!',
    defeatQuote:'This is not over...',
    colors:{skin:'#c49a6c',skinShadow:'#a07a50',hair:'#1a1a1a',cloth:'#3a2a1a',clothLight:'#5a3a2a',armor:'#4a148c',armorLight:'#7b1fa2',dhoti:'#e8d5b0',dhotiShadow:'#c4a882',gold:'#ffd700',goldShadow:'#c8a000'},
    draw:(ctx,x,y,w,h,facing,animFrame,state,flash)=>{
      ctx.save();ctx.translate(x,y);
      if(facing<0)ctx.scale(-1,1);
      const f=animFrame,breath=Math.sin(f*.05)*2,bodyY=breath;
      const c=flash?{skin:'#fff',hair:'#fff',cloth:'#fff',clothLight:'#fff',armor:'#fff',armorLight:'#fff',dhoti:'#fff',dhotiShadow:'#fff',gold:'#fff',goldShadow:'#fff'}:CHARACTERS[3].colors;
      ctx.shadowColor=state.specialActive?'#b71c1c':'transparent';
      ctx.shadowBlur=state.specialActive?40+Math.sin(f*.1)*12:0;
      
      // TORSO (broad)
      const bg=ctx.createLinearGradient(0,-h*.45+bodyY,0,-h*.05+bodyY);
      bg.addColorStop(0,c.clothLight);bg.addColorStop(1,c.cloth);
      ctx.fillStyle=bg;
      ctx.beginPath();
      ctx.moveTo(-w*.3,-h*.45+bodyY);ctx.quadraticCurveTo(-w*.34,-h*.25+bodyY,-w*.3,-h*.05+bodyY);
      ctx.lineTo(w*.3,-h*.05+bodyY);ctx.quadraticCurveTo(w*.34,-h*.25+bodyY,w*.3,-h*.45+bodyY);
      ctx.closePath();ctx.fill();
      
      // DARK PURPLE ARMOR
      const ag=ctx.createLinearGradient(0,-h*.43+bodyY,0,-h*.18+bodyY);
      ag.addColorStop(0,c.armorLight);ag.addColorStop(1,c.armor);
      ctx.fillStyle=ag;
      ctx.beginPath();
      ctx.moveTo(-w*.28,-h*.44+bodyY);ctx.quadraticCurveTo(-w*.32,-h*.3+bodyY,-w*.28,-h*.16+bodyY);
      ctx.lineTo(w*.28,-h*.16+bodyY);ctx.quadraticCurveTo(w*.32,-h*.3+bodyY,w*.28,-h*.44+bodyY);
      ctx.closePath();ctx.fill();
      ctx.strokeStyle=c.gold;ctx.lineWidth=2;ctx.stroke();
      
      // Gold trim patterns
      ctx.strokeStyle=c.gold;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(-w*.2,-h*.38+bodyY);ctx.lineTo(-w*.12,-h*.3+bodyY);ctx.stroke();
      ctx.beginPath();ctx.moveTo(w*.2,-h*.38+bodyY);ctx.lineTo(w*.12,-h*.3+bodyY);ctx.stroke();
      
      // Belt
      ctx.fillStyle=c.gold;
      ctx.fillRect(-w*.24,-h*.08+bodyY,w*.48,5);
      ctx.fillStyle=c.goldShadow;
      ctx.fillRect(-w*.24,-h*.04+bodyY,w*.48,2);
      
      // DHOTI
      const dg=ctx.createLinearGradient(0,-h*.04+bodyY,0,h*.06+bodyY);
      dg.addColorStop(0,c.dhoti);dg.addColorStop(1,c.dhotiShadow);
      ctx.fillStyle=dg;
      ctx.beginPath();
      ctx.moveTo(-w*.28,-h*.04+bodyY);ctx.quadraticCurveTo(-w*.32,h*.03+bodyY,-w*.24,h*.12+bodyY);
      ctx.lineTo(w*.24,h*.12+bodyY);ctx.quadraticCurveTo(w*.32,h*.03+bodyY,w*.28,-h*.04+bodyY);
      ctx.closePath();ctx.fill();
      
      // HEAD
      const headY=-h*.5+bodyY;
      ctx.fillStyle=c.skin;
      ctx.fillRect(-w*.08,headY+w*.03,w*.16,w*.05);
      const hg=ctx.createRadialGradient(0,headY,w*.06,0,headY,w*.22);
      hg.addColorStop(0,c.skin);hg.addColorStop(1,c.skinShadow);
      ctx.fillStyle=hg;
      ctx.beginPath();ctx.arc(0,headY,w*.22,0,Math.PI*2);ctx.fill();
      
      // Royal elaborate crown
      const cg=ctx.createLinearGradient(0,headY-w*.1,0,headY-w*.26);
      cg.addColorStop(0,c.gold);cg.addColorStop(1,c.goldShadow);
      ctx.fillStyle=cg;
      ctx.beginPath();
      ctx.moveTo(-w*.2,headY-w*.1);ctx.lineTo(-w*.14,headY-w*.22);
      ctx.lineTo(-w*.07,headY-w*.16);ctx.lineTo(0,headY-w*.26);
      ctx.lineTo(w*.07,headY-w*.16);ctx.lineTo(w*.14,headY-w*.22);
      ctx.lineTo(w*.2,headY-w*.1);ctx.closePath();ctx.fill();
      // Crown details
      ctx.fillStyle='#ff0000';
      ctx.beginPath();ctx.arc(0,headY-w*.24,3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#00ff00';
      ctx.beginPath();ctx.arc(-w*.1,headY-w*.18,2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(w*.1,headY-w*.18,2,0,Math.PI*2);ctx.fill();
      
      // Hair
      ctx.fillStyle=c.hair;
      ctx.beginPath();ctx.arc(0,headY-w*.08,w*.14,0,Math.PI*2);ctx.fill();
      
      // Angry red eyes
      ctx.fillStyle='#fff';
      ctx.fillRect(-w*.1,headY-w*.02,w*.07,w*.03);
      ctx.fillRect(w*.03,headY-w*.02,w*.07,w*.03);
      ctx.fillStyle='#ff0000';
      ctx.fillRect(-w*.09,headY-w*.02,w*.05,w*.025);
      ctx.fillRect(w*.04,headY-w*.02,w*.05,w*.025);
      ctx.strokeStyle='#1a1a1a';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(-w*.12,headY-w*.05);ctx.lineTo(-w*.02,headY-w*.04);ctx.stroke();
      ctx.beginPath();ctx.moveTo(w*.02,headY-w*.04);ctx.lineTo(w*.12,headY-w*.05);ctx.stroke();
      
      // Nose & mouth
      ctx.fillStyle=c.skinShadow;
      ctx.beginPath();ctx.moveTo(0,headY+w*.02);ctx.lineTo(-w*.03,headY+w*.06);ctx.lineTo(w*.03,headY+w*.06);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#8a6a4a';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(-w*.05,headY+w*.09);ctx.lineTo(w*.05,headY+w*.09);ctx.stroke();
      
      // IRON MACE
      const atkSwing=state.attacking?Math.sin(f*.18)*22:0;
      ctx.fillStyle='#616161';
      ctx.fillRect(w*.25,-h*.12+bodyY+atkSwing,w*.06,h*.28);
      const ig=ctx.createRadialGradient(w*.28,-h*.2+bodyY+atkSwing,0,w*.28,-h*.2+bodyY+atkSwing,w*.13);
      ig.addColorStop(0,'#9e9e9e');ig.addColorStop(.5,'#757575');ig.addColorStop(1,'#424242');
      ctx.fillStyle=ig;
      ctx.beginPath();ctx.arc(w*.28,-h*.2+bodyY+atkSwing,w*.13,0,Math.PI*2);ctx.fill();
      for(let a=0;a<10;a++){
        const angle=a*Math.PI/5;
        ctx.fillStyle='#757575';
        ctx.beginPath();ctx.arc(w*.28+Math.cos(angle)*w*.15,-h*.2+bodyY+Math.sin(angle)*w*.15+atkSwing,3,0,Math.PI*2);ctx.fill();
      }
      
      // LEGS
      const legAnim=state.walking?Math.sin(f*.07)*7:0;
      ctx.fillStyle=c.skin;
      ctx.save();ctx.translate(-w*.15,bodyY);
      ctx.beginPath();ctx.ellipse(0,.25*h*.5+legAnim,.12*w*.5,.25*h*.5,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5d4037';ctx.beginPath();ctx.ellipse(0,.25*h+legAnim,w*.08,w*.04,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      ctx.save();ctx.translate(w*.15,bodyY);
      ctx.beginPath();ctx.ellipse(0,.25*h*.5-legAnim,.12*w*.5,.25*h*.5,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5d4037';ctx.beginPath();ctx.ellipse(0,.25*h-legAnim,w*.08,w*.04,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      
      ctx.restore();
    },
    specialEffect:(game,x,y,facing)=>{
      game.particles.specialBurst(x,y,'#b71c1c');
      game.audio.playSfx('special_duryo');
      game.screenShake=25;
      for(let i=0;i<12;i++){
        setTimeout(()=>{
          game.particles.emit(x+(Math.random()-.5)*300,y-80,{
            count:12,type:'shard',speed:400,life:.5,size:9,
            spread:Math.PI,color:['#b71c1c','#7f0000','#ff1744'],gravity:400,
          });
        },i*50);
      }
    }
  },
  {
    id:'nakula',name:'Nakula',title:'The Swordmaster',
    devanagari:'नकुल',color:'#66bb6a',colorDark:'#2e7d32',
    weapon:'Sword & Shield',weaponDevanagari:'खड्ग एवं ढाल',
    stats:{hp:95,speed:225,attack:13,defense:6,specialDmg:32},
    taunt:'Speed is my greatest weapon!',
    taunt2:'You cannot hit what you cannot see!',
    defeatQuote:'I was not fast enough...',
    colors:{skin:'#d4a574',skinShadow:'#b8885a',hair:'#1a1a1a',cloth:'#2a2a3a',clothLight:'#3a3a4a',armor:'#2e7d32',armorLight:'#43a047',dhoti:'#e8d5b0',dhotiShadow:'#c4a882',gold:'#ffd700',goldShadow:'#c8a000'},
    draw:(ctx,x,y,w,h,facing,animFrame,state,flash)=>{
      ctx.save();ctx.translate(x,y);
      if(facing<0)ctx.scale(-1,1);
      const f=animFrame,breath=Math.sin(f*.07)*1.5,bodyY=breath;
      const c=flash?{skin:'#fff',hair:'#fff',cloth:'#fff',clothLight:'#fff',armor:'#fff',armorLight:'#fff',dhoti:'#fff',dhotiShadow:'#fff',gold:'#fff',goldShadow:'#fff'}:CHARACTERS[4].colors;
      
      // TORSO (lean)
      const bg=ctx.createLinearGradient(0,-h*.45+bodyY,0,-h*.05+bodyY);
      bg.addColorStop(0,c.clothLight);bg.addColorStop(1,c.cloth);
      ctx.fillStyle=bg;
      ctx.beginPath();
      ctx.moveTo(-w*.23,-h*.45+bodyY);ctx.quadraticCurveTo(-w*.26,-h*.25+bodyY,-w*.23,-h*.05+bodyY);
      ctx.lineTo(w*.23,-h*.05+bodyY);ctx.quadraticCurveTo(w*.26,-h*.25+bodyY,w*.23,-h*.45+bodyY);
      ctx.closePath();ctx.fill();
      
      // GREEN ARMOR
      const ag=ctx.createLinearGradient(0,-h*.42+bodyY,0,-h*.2+bodyY);
      ag.addColorStop(0,c.armorLight);ag.addColorStop(1,c.armor);
      ctx.fillStyle=ag;
      ctx.beginPath();
      ctx.moveTo(-w*.2,-h*.43+bodyY);ctx.quadraticCurveTo(-w*.24,-h*.32+bodyY,-w*.2,-h*.18+bodyY);
      ctx.lineTo(w*.2,-h*.18+bodyY);ctx.quadraticCurveTo(w*.24,-h*.32+bodyY,w*.2,-h*.43+bodyY);
      ctx.closePath();ctx.fill();
      ctx.strokeStyle=c.gold;ctx.lineWidth=1;ctx.stroke();
      
      // Chest emblem
      ctx.fillStyle=c.gold;ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('॥',0,-h*.3+bodyY);
      
      // Belt
      ctx.fillStyle=c.gold;
      ctx.fillRect(-w*.18,-h*.08+bodyY,w*.36,3);
      
      // DHOTI
      const dg=ctx.createLinearGradient(0,-h*.06+bodyY,0,h*.04+bodyY);
      dg.addColorStop(0,c.dhoti);dg.addColorStop(1,c.dhotiShadow);
      ctx.fillStyle=dg;
      ctx.beginPath();
      ctx.moveTo(-w*.22,-h*.06+bodyY);ctx.quadraticCurveTo(-w*.26,h*.02+bodyY,-w*.18,h*.1+bodyY);
      ctx.lineTo(w*.18,h*.1+bodyY);ctx.quadraticCurveTo(w*.26,h*.02+bodyY,w*.22,-h*.06+bodyY);
      ctx.closePath();ctx.fill();
      
      // HEAD
      const headY=-h*.5+bodyY;
      ctx.fillStyle=c.skin;
      ctx.fillRect(-w*.05,headY+w*.03,w*.1,w*.04);
      const hg=ctx.createRadialGradient(0,headY,w*.04,0,headY,w*.16);
      hg.addColorStop(0,c.skin);hg.addColorStop(1,c.skinShadow);
      ctx.fillStyle=hg;
      ctx.beginPath();ctx.arc(0,headY,w*.16,0,Math.PI*2);ctx.fill();
      
      // Hair
      ctx.fillStyle=c.hair;
      ctx.beginPath();ctx.arc(0,headY-w*.08,w*.1,0,Math.PI*2);ctx.fill();
      
      // Crown
      ctx.fillStyle=c.gold;
      ctx.beginPath();
      ctx.moveTo(-w*.12,headY-w*.08);ctx.lineTo(-w*.1,headY-w*.16);
      ctx.lineTo(-w*.04,headY-w*.1);ctx.lineTo(0,headY-w*.18);
      ctx.lineTo(w*.04,headY-w*.1);ctx.lineTo(w*.1,headY-w*.16);
      ctx.lineTo(w*.12,headY-w*.08);ctx.closePath();ctx.fill();
      
      // Eyes
      ctx.fillStyle='#1a1a1a';
      ctx.fillRect(-w*.06,headY-w*.02,w*.04,w*.03);
      ctx.fillRect(w*.02,headY-w*.02,w*.04,w*.03);
      
      // Nose & mouth
      ctx.fillStyle=c.skinShadow;
      ctx.beginPath();ctx.moveTo(0,headY+w*.01);ctx.lineTo(-w*.02,headY+w*.04);ctx.lineTo(w*.02,headY+w*.04);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#8a6a4a';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(-w*.03,headY+w*.07);ctx.lineTo(w*.03,headY+w*.07);ctx.stroke();
      
      // SWORD
      ctx.save();
      const swordAngle=state.attacking?Math.sin(f*.25)*.8:0;
      ctx.translate(w*.25,-h*.08+bodyY);
      ctx.rotate(swordAngle);
      // Blade
      const bladeG=ctx.createLinearGradient(-1,-30,-1,10);
      bladeG.addColorStop(0,'#ffffff');bladeG.addColorStop(.5,'#b0bec5');bladeG.addColorStop(1,'#78909c');
      ctx.fillStyle=bladeG;
      ctx.fillRect(-1,-30,3,40);
      // Handle
      ctx.fillStyle='#5d4037';
      ctx.fillRect(-2,10,6,6);
      // Guard
      ctx.fillStyle=c.gold;
      ctx.fillRect(-5,8,10,3);
      ctx.restore();
      
      // SHIELD
      ctx.save();
      ctx.translate(-w*.22,-h*.15+bodyY);
      const shieldG=ctx.createRadialGradient(0,0,0,0,0,w*.12);
      shieldG.addColorStop(0,c.gold);shieldG.addColorStop(.6,'#5d4037');shieldG.addColorStop(1,'#3e2723');
      ctx.fillStyle=shieldG;
      ctx.beginPath();ctx.arc(0,0,w*.12,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=c.gold;ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(0,0,w*.12,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle=c.gold;
      ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('॥',0,1);
      ctx.restore();
      
      // LEGS
      const legAnim=state.walking?Math.sin(f*.1)*10:0;
      ctx.fillStyle=c.skin;
      ctx.save();ctx.translate(-w*.1,bodyY);
      ctx.beginPath();ctx.ellipse(0,.25*h*.5+legAnim,.08*w*.5,.25*h*.5,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5d4037';ctx.beginPath();ctx.ellipse(0,.25*h+legAnim,w*.06,w*.03,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      ctx.save();ctx.translate(w*.1,bodyY);
      ctx.beginPath();ctx.ellipse(0,.25*h*.5-legAnim,.08*w*.5,.25*h*.5,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5d4037';ctx.beginPath();ctx.ellipse(0,.25*h-legAnim,w*.06,w*.03,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      
      ctx.restore();
    },
    specialEffect:(game,x,y,facing)=>{
      game.particles.specialBurst(x,y,'#66bb6a');
      game.audio.playSfx('special_nakula');game.screenShake=10;
      for(let i=0;i<10;i++){
        setTimeout(()=>{
          const angle=(i/10)*Math.PI*2;
          game.particles.emit(x+Math.cos(angle)*60,y+Math.sin(angle)*60,{
            count:8,type:'spark',speed:300,life:.35,size:4,
            color:['#66bb6a','#ffffff','#a5d6a7'],
          });
          game.particles.emit(x+Math.cos(angle)*40,y+Math.sin(angle)*40,{
            count:4,type:'sparkle',speed:150,life:.2,size:7,color:'#ffffff',
          });
        },i*30);
      }
    }
  },
  {
    id:'yudhishthira',name:'Yudhishthira',title:'The Dharmic King',
    devanagari:'युधिष्ठिर',color:'#ab47bc',colorDark:'#6a1b9a',
    weapon:'Divine Spear',weaponDevanagari:'दिव्य भाला',
    stats:{hp:125,speed:150,attack:14,defense:15,specialDmg:38},
    taunt:'Dharma protects those who uphold it!',
    taunt2:'Justice shall prevail!',
    defeatQuote:'Even in defeat, dharma stands eternal...',
    colors:{skin:'#d4a574',skinShadow:'#b8885a',hair:'#1a1a1a',cloth:'#2a2a3a',clothLight:'#3a3a4a',armor:'#6a1b9a',armorLight:'#9c27b0',dhoti:'#e8d5b0',dhotiShadow:'#c4a882',gold:'#ffd700',goldShadow:'#c8a000'},
    draw:(ctx,x,y,w,h,facing,animFrame,state,flash)=>{
      ctx.save();ctx.translate(x,y);
      if(facing<0)ctx.scale(-1,1);
      const f=animFrame,breath=Math.sin(f*.055)*2,bodyY=breath;
      const c=flash?{skin:'#fff',hair:'#fff',cloth:'#fff',clothLight:'#fff',armor:'#fff',armorLight:'#fff',dhoti:'#fff',dhotiShadow:'#fff',gold:'#fff',goldShadow:'#fff'}:CHARACTERS[5].colors;
      ctx.shadowColor=state.specialActive?'#ab47bc':'transparent';
      ctx.shadowBlur=state.specialActive?50+Math.sin(f*.12)*15:0;
      
      // TORSO
      const bg=ctx.createLinearGradient(0,-h*.45+bodyY,0,-h*.05+bodyY);
      bg.addColorStop(0,c.clothLight);bg.addColorStop(1,c.cloth);
      ctx.fillStyle=bg;
      ctx.beginPath();
      ctx.moveTo(-w*.25,-h*.45+bodyY);ctx.quadraticCurveTo(-w*.28,-h*.25+bodyY,-w*.25,-h*.05+bodyY);
      ctx.lineTo(w*.25,-h*.05+bodyY);ctx.quadraticCurveTo(w*.28,-h*.25+bodyY,w*.25,-h*.45+bodyY);
      ctx.closePath();ctx.fill();
      
      // PURPLE ROYAL ARMOR
      const ag=ctx.createLinearGradient(0,-h*.43+bodyY,0,-h*.18+bodyY);
      ag.addColorStop(0,c.armorLight);ag.addColorStop(1,c.armor);
      ctx.fillStyle=ag;
      ctx.beginPath();
      ctx.moveTo(-w*.23,-h*.44+bodyY);ctx.quadraticCurveTo(-w*.26,-h*.3+bodyY,-w*.23,-h*.16+bodyY);
      ctx.lineTo(w*.23,-h*.16+bodyY);ctx.quadraticCurveTo(w*.26,-h*.3+bodyY,w*.23,-h*.44+bodyY);
      ctx.closePath();ctx.fill();
      ctx.strokeStyle=c.gold;ctx.lineWidth=2;ctx.stroke();
      
      // Dharma symbol on chest
      ctx.fillStyle=c.gold;
      ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('ध',0,-h*.3+bodyY);
      
      // Belt
      ctx.fillStyle=c.gold;
      ctx.fillRect(-w*.2,-h*.08+bodyY,w*.4,4);
      
      // DHOTI
      const dg=ctx.createLinearGradient(0,-h*.05+bodyY,0,h*.05+bodyY);
      dg.addColorStop(0,c.dhoti);dg.addColorStop(1,c.dhotiShadow);
      ctx.fillStyle=dg;
      ctx.beginPath();
      ctx.moveTo(-w*.23,-h*.05+bodyY);ctx.quadraticCurveTo(-w*.27,h*.02+bodyY,-w*.2,h*.1+bodyY);
      ctx.lineTo(w*.2,h*.1+bodyY);ctx.quadraticCurveTo(w*.27,h*.02+bodyY,w*.23,-h*.05+bodyY);
      ctx.closePath();ctx.fill();
      
      // HEAD
      const headY=-h*.5+bodyY;
      ctx.fillStyle=c.skin;
      ctx.fillRect(-w*.06,headY+w*.03,w*.12,w*.05);
      const hg=ctx.createRadialGradient(0,headY,w*.05,0,headY,w*.18);
      hg.addColorStop(0,c.skin);hg.addColorStop(1,c.skinShadow);
      ctx.fillStyle=hg;
      ctx.beginPath();ctx.arc(0,headY,w*.18,0,Math.PI*2);ctx.fill();
      
      // Hair
      ctx.fillStyle=c.hair;
      ctx.beginPath();ctx.arc(0,headY-w*.08,w*.12,0,Math.PI*2);ctx.fill();
      
      // Crown
      const cg=ctx.createLinearGradient(0,headY-w*.1,0,headY-w*.2);
      cg.addColorStop(0,c.gold);cg.addColorStop(1,c.goldShadow);
      ctx.fillStyle=cg;
      ctx.beginPath();
      ctx.moveTo(-w*.18,headY-w*.1);ctx.lineTo(-w*.12,headY-w*.18);
      ctx.lineTo(-w*.06,headY-w*.1);ctx.lineTo(0,headY-w*.22);
      ctx.lineTo(w*.06,headY-w*.1);ctx.lineTo(w*.12,headY-w*.18);
      ctx.lineTo(w*.18,headY-w*.1);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ffd700';
      ctx.beginPath();ctx.arc(0,headY-w*.2,2,0,Math.PI*2);ctx.fill();
      
      // Eyes (wise, serene)
      ctx.fillStyle='#1a1a1a';
      ctx.fillRect(-w*.06,headY-w*.02,w*.04,w*.025);
      ctx.fillRect(w*.02,headY-w*.02,w*.04,w*.025);
      ctx.strokeStyle='#1a1a1a';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(-w*.07,headY-w*.04);ctx.lineTo(-w*.01,headY-w*.035);ctx.stroke();
      ctx.beginPath();ctx.moveTo(w*.01,headY-w*.035);ctx.lineTo(w*.07,headY-w*.04);ctx.stroke();
      
      // Nose & mouth
      ctx.fillStyle=c.skinShadow;
      ctx.beginPath();ctx.moveTo(0,headY+w*.01);ctx.lineTo(-w*.02,headY+w*.04);ctx.lineTo(w*.02,headY+w*.04);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#8a6a4a';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(-w*.04,headY+w*.07);ctx.lineTo(w*.04,headY+w*.07);ctx.stroke();
      
      // DIVINE SPEAR
      ctx.save();
      ctx.translate(w*.22,-h*.4+bodyY);
      // Shaft
      ctx.fillStyle='#9e9e9e';
      ctx.fillRect(-1,0,3,h*.9);
      // Spear head glow
      ctx.shadowColor='#ab47bc';ctx.shadowBlur=state.specialActive?25:10;
      const sg=ctx.createLinearGradient(0,-30,0,0);
      sg.addColorStop(0,'#ffffff');sg.addColorStop(.5,'#ffd700');sg.addColorStop(1,'#9e9e9e');
      ctx.fillStyle=sg;
      ctx.beginPath();
      ctx.moveTo(2,-30);ctx.lineTo(-3,-5);ctx.lineTo(2,0);ctx.lineTo(7,-5);
      ctx.closePath();ctx.fill();
      ctx.shadowBlur=0;
      // Spear banner
      const wave=Math.sin(f*.06)*5;
      ctx.fillStyle='#ab47bc';ctx.globalAlpha=.6;
      ctx.beginPath();
      ctx.moveTo(2,-20);ctx.lineTo(2+15+wave,-12);ctx.lineTo(2,-6);
      ctx.closePath();ctx.fill();
      ctx.globalAlpha=1;
      ctx.restore();
      
      // LEGS
      const legAnim=state.walking?Math.sin(f*.07)*6:0;
      ctx.fillStyle=c.skin;
      ctx.save();ctx.translate(-w*.12,bodyY);
      ctx.beginPath();ctx.ellipse(0,.25*h*.5+legAnim,.1*w*.5,.25*h*.5,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5d4037';ctx.beginPath();ctx.ellipse(0,.25*h+legAnim,w*.07,w*.04,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      ctx.save();ctx.translate(w*.12,bodyY);
      ctx.beginPath();ctx.ellipse(0,.25*h*.5-legAnim,.1*w*.5,.25*h*.5,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5d4037';ctx.beginPath();ctx.ellipse(0,.25*h-legAnim,w*.07,w*.04,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      
      ctx.restore();
    },
    specialEffect:(game,x,y,facing)=>{
      game.particles.specialBurst(x,y,'#ab47bc');
      game.audio.playSfx('special_yudhi');
      game.screenShake=12;
      for(let i=0;i<5;i++){
        setTimeout(()=>{
          game.particles.emit(x,y,{count:20,type:'ring',speed:0,life:.4,size:40+i*50,color:'#ab47bc'});
          game.particles.emit(x,y,{count:15,type:'glow',speed:120,life:.45,size:25,color:'#ce93d8'});
          game.particles.emit(x,y,{count:8,type:'shard',speed:350,life:.3,size:6,spread:Math.PI*2,color:['#ab47bc','#ffffff','#ce93d8']});
        },i*60);
      }
    }
  }
];

// ─── BACKGROUND SYSTEM (enhanced with dynamic elements & cached gradients) ─
class BackgroundSystem {
  constructor(game){
    this.game=game;
    this.stars=[];this.clouds=[];this.torches=[];this.banners=[];
    this.fireflies=[];this.time=0;
    for(let i=0;i<120;i++) this.stars.push({x:Math.random()*CONFIG.W,y:Math.random()*(CONFIG.GROUND_Y-50),size:.5+Math.random()*2,speed:.02+Math.random()*.05,twinkle:Math.random()*Math.PI*2});
    for(let i=0;i<6;i++) this.clouds.push({x:Math.random()*CONFIG.W,y:30+Math.random()*120,w:80+Math.random()*180,speed:3+Math.random()*8,opacity:.08+Math.random()*.12});
    for(let i=0;i<6;i++) this.torches.push({x:40+i*250,y:CONFIG.GROUND_Y-5,flameOffset:Math.random()*Math.PI*2,intensity:.6+Math.random()*.4});
    for(let i=0;i<4;i++) this.banners.push({x:120+i*400,y:CONFIG.GROUND_Y-70,color:i%2===0?'#b71c1c':'#ffd700',waveOffset:i*1.7});
    for(let i=0;i<15;i++) this.fireflies.push({x:Math.random()*CONFIG.W,y:50+Math.random()*(CONFIG.GROUND_Y-100),speed:.3+Math.random()*.7,phase:Math.random()*Math.PI*2,size:1+Math.random()*2});
    // Pre-cache gradients
    this._gradients = {};
    this._buildGradients();
    // Offscreen canvas for static background elements
    this._bgCanvas = null;
  }
  _buildGradients(){
    const W=CONFIG.W,H=CONFIG.H,GY=CONFIG.GROUND_Y;
    // Sky gradient
    const sky=document.createElement('canvas').getContext('2d').createLinearGradient(0,0,0,GY);
    sky.addColorStop(0,'#070720');sky.addColorStop(.3,'#0a0a2e');
    sky.addColorStop(.5,'#1a0a2e');sky.addColorStop(.7,'#2a1520');
    sky.addColorStop(1,'#2a1a10');
    this._gradients.sky=sky;
    // Ground gradient
    const gr=document.createElement('canvas').getContext('2d').createLinearGradient(0,GY,0,H);
    gr.addColorStop(0,'#4a3520');gr.addColorStop(.08,'#3a2510');
    gr.addColorStop(.35,'#2a1a0a');gr.addColorStop(1,'#150800');
    this._gradients.ground=gr;
    // Moon glow gradient
    const mg=document.createElement('canvas').getContext('2d').createRadialGradient(1000,100,0,1000,100,100);
    mg.addColorStop(0,'rgba(255,230,180,.15)');mg.addColorStop(.5,'rgba(255,220,150,.08)');mg.addColorStop(1,'transparent');
    this._gradients.moon=mg;
  }
  update(dt){
    this.time+=dt;
    for(const c of this.clouds){c.x+=c.speed*dt;if(c.x>CONFIG.W+c.w)c.x=-c.w;}
    for(const f of this.fireflies){
      f.x+=Math.sin(this.time*f.speed+f.phase)*.3;f.y+=Math.cos(this.time*f.speed*2+f.phase)*.2;
      if(f.x<0)f.x=CONFIG.W;if(f.x>CONFIG.W)f.x=0;
      if(f.y<50)f.y=CONFIG.GROUND_Y-100;if(f.y>CONFIG.GROUND_Y-50)f.y=50;
    }
  }
  draw(ctx){
    const W=CONFIG.W,H=CONFIG.H;
    // Sky (cached gradient)
    ctx.fillStyle=this._gradients.sky;ctx.fillRect(0,0,W,CONFIG.GROUND_Y);
    
    // Stars
    for(const s of this.stars){
      const tw=.3+Math.sin(this.time*s.speed*3+s.twinkle)*.3;
      ctx.globalAlpha=tw*.7;ctx.fillStyle=s.size>1.2?'#aaddff':'#ffffff';
      ctx.fillRect(s.x,s.y,s.size,s.size);
      if(s.size>1.5){
        ctx.shadowColor='#ffffff';ctx.shadowBlur=4;ctx.fillRect(s.x,s.y,s.size,s.size);ctx.shadowBlur=0;
      }
    }
    ctx.globalAlpha=1;
    
    // Moon (cached glow gradient)
    ctx.save();
    ctx.fillStyle=this._gradients.moon;ctx.beginPath();ctx.arc(1000,100,100,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,220,150,.12)';ctx.beginPath();ctx.arc(1000,100,50,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,220,150,.18)';ctx.beginPath();ctx.arc(1000,100,30,0,Math.PI*2);ctx.fill();
    // Moon glow
    ctx.shadowColor='rgba(255,220,150,.3)';ctx.shadowBlur=40;
    ctx.fillStyle='rgba(255,220,150,.08)';ctx.beginPath();ctx.arc(1000,100,25,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
    ctx.restore();
    
    // Clouds
    for(const c of this.clouds){
      ctx.globalAlpha=c.opacity;
      ctx.fillStyle='#15152a';
      ctx.beginPath();ctx.ellipse(c.x,c.y,c.w*.4,14,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(c.x-c.w*.2,c.y+4,c.w*.25,10,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(c.x+c.w*.25,c.y+2,c.w*.22,9,0,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
    
    // Mountains
    ctx.fillStyle='rgba(20,15,35,.4)';
    for(let i=0;i<10;i++){
      const mx=i*150-30,mh=60+Math.sin(i*2.7)*50;
      ctx.beginPath();ctx.moveTo(mx-120,CONFIG.GROUND_Y);
      ctx.quadraticCurveTo(mx,CONFIG.GROUND_Y-mh,mx+120,CONFIG.GROUND_Y);ctx.fill();
    }
    // Distant hills
    ctx.fillStyle='rgba(15,10,25,.2)';
    for(let i=0;i<8;i++){
      const mx=i*200+30,mh=30+Math.sin(i*1.8)*20;
      ctx.beginPath();ctx.moveTo(mx-150,CONFIG.GROUND_Y);
      ctx.quadraticCurveTo(mx,CONFIG.GROUND_Y-mh,mx+150,CONFIG.GROUND_Y);ctx.fill();
    }
    
    // Ground (cached gradient)
    ctx.fillStyle=this._gradients.ground;ctx.fillRect(0,CONFIG.GROUND_Y,W,H-CONFIG.GROUND_Y);
    
    // Ground texture
    ctx.strokeStyle='rgba(100,70,40,.1)';ctx.lineWidth=1;
    for(let i=0;i<20;i++){
      const lx=(i*97+30)%W,ly=CONFIG.GROUND_Y+10+(i*23)%(H-CONFIG.GROUND_Y-20);
      ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(lx+15+i%4*4,ly+4+i%3);ctx.stroke();
    }
    
    // Ground line with glow
    ctx.strokeStyle='rgba(255,200,100,.1)';ctx.lineWidth=3;
    ctx.shadowColor='rgba(255,200,100,.1)';ctx.shadowBlur=15;
    ctx.beginPath();ctx.moveTo(0,CONFIG.GROUND_Y);ctx.lineTo(W,CONFIG.GROUND_Y);ctx.stroke();
    ctx.shadowBlur=0;
    
    // Banners
    for(const b of this.banners){
      const wave=Math.sin(this.time*2.5+b.waveOffset)*10;
      ctx.globalAlpha=.45;
      ctx.strokeStyle='rgba(180,150,100,.3)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x,b.y-55);ctx.stroke();
      ctx.fillStyle=b.color;
      ctx.beginPath();
      ctx.moveTo(b.x,b.y-55);ctx.quadraticCurveTo(b.x+22+wave*.6,b.y-46,b.x+35+wave,b.y-38);
      ctx.lineTo(b.x,b.y-32);ctx.closePath();ctx.fill();
    }
    ctx.globalAlpha=1;
    
    // Torches
    for(const t of this.torches){
      const flick=Math.sin(this.time*10+t.flameOffset)*.15+.85;
      const fh=12+Math.sin(this.time*6+t.flameOffset*2)*5;
      const fl=ctx.createRadialGradient(t.x,t.y-24,0,t.x,t.y-24,18*flick);
      fl.addColorStop(0,`rgba(255,200,100,${.7*flick})`);
      fl.addColorStop(.4,`rgba(255,150,50,${.5*flick})`);
      fl.addColorStop(1,'rgba(255,100,20,0)');
      ctx.fillStyle=fl;ctx.beginPath();ctx.arc(t.x,t.y-24-fh*.3,18*flick,0,Math.PI*2);ctx.fill();
      const fg=ctx.createRadialGradient(t.x,t.y,0,t.x,t.y,35*flick);
      fg.addColorStop(0,`rgba(255,200,100,${.12*flick})`);
      fg.addColorStop(1,'rgba(255,200,100,0)');
      ctx.fillStyle=fg;ctx.beginPath();ctx.arc(t.x,t.y,35*flick,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(80,50,30,.3)';ctx.fillRect(t.x-2,t.y-28,4,28);
    }
    
    // Fireflies
    for(const f of this.fireflies){
      const bright=.3+Math.sin(this.time*2+f.phase)*.3;
      ctx.fillStyle=`rgba(200,255,200,${bright*.5})`;
      ctx.shadowColor='rgba(200,255,200,.4)';ctx.shadowBlur=6;
      ctx.beginPath();ctx.arc(f.x,f.y,f.size,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    }
  }
}

// ─── CAMERA SYSTEM ────────────────────────────────────────
class Camera {
  constructor(){this.x=0;this.y=0;this.zoom=1;this.targetZoom=1;this.shakeX=0;this.shakeY=0;this.targetX=0;this.targetY=0;}
  update(dt){
    this.x+=(this.targetX-this.x)*.08;this.y+=(this.targetY-this.y)*.08;
    this.zoom+=(this.targetZoom-this.zoom)*.08;
    this.shakeX*=Math.pow(.85,dt*60);this.shakeY*=Math.pow(.85,dt*60);
  }
  apply(ctx,W,H){
    ctx.translate(W/2,H/2);
    ctx.scale(this.zoom,this.zoom);
    ctx.translate(-W/2+this.x+this.shakeX,-H/2+this.y+this.shakeY);
  }
  shake(intensity){this.shakeX+=(Math.random()-.5)*intensity*2;this.shakeY+=(Math.random()-.5)*intensity*2;}
  zoomTo(z){this.targetZoom=clamp(z,.5,2);}
}

// ─── GAME CLASS ─────────────────────────────────────────
class DharmYudhGame {
  constructor(canvasId){
    this.canvas=document.getElementById(canvasId);
    this.ctx=this.canvas.getContext('2d');
    this.W=this.canvas.width=CONFIG.W;
    this.H=this.canvas.height=CONFIG.H;
    this.audio=new AudioEngine();
    this.particles=new ParticleSystem(this);
    this.background=new BackgroundSystem(this);
    this.camera=new Camera();
    this.state='loading';
    this.battleActive=false;this.roundActive=false;
    this.playerChar=null;this.enemyChar=null;this.player=null;this.enemy=null;
    this.gameTime=0;this.screenShake=0;
    this.round=1;this.playerWins=0;this.enemyWins=0;this.maxRounds=3;
    this.comboCount=0;this.hitStopTimer=0;this.slowMo=0;
    this.battleTimer=0;this.maxBattleTime=60;
    this.damageNumbers=[];this._damageNumPool=[];this.roundIntroTimer=0;
    this.gameMode='versus';this.survivalWave=1;this.survivalKills=0;
    this.difficulty='normal';
    this.keys={};this.lastKeyPress=0;this.keyJustPressed={};
    this.isMobile=this.detectMobile();
    this.touchState={left:false,right:false,up:false,down:false,light:false,heavy:false,special:false,block:false,blockTap:false};
    this.touchSwipeStart=null;
    this.selectedChar=0;
    this.menuItems=['Quick Battle','Survival Mode','How to Play'];
    this.selectedMenuItem=0;this.showingHelp=false;
    this.toastMessage='';this.toastTimer=0;
    this.flashEffect=0;this.koFlash=0;
    this.cinematicZoom=0;this.cinematicZoomTarget=0;
    this.comboEffectTimer=0;
    this.maxComboDisplay=0;
    this.titlePulse=0;
    this.koFreezeTimer=0;this.koFreezeText='';
    this.specialZoomPulse=0;
    this.bindInput();this.resize();
    this.loadAssets();
  }
  resize(){
    const c=document.getElementById('game-container');
    const r=()=>{const rect=c.getBoundingClientRect();this.canvas.style.width=rect.width+'px';this.canvas.style.height=rect.height+'px';};
    r();window.addEventListener('resize',r);
  }
  loadAssets(){
    let p=0;
    const li=setInterval(()=>{
      p+=Math.random()*12+5;
      if(p>=100){p=100;clearInterval(li);
        document.getElementById('loading-bar').style.width='100%';
        setTimeout(()=>{
          document.getElementById('loading-screen').classList.add('hidden');
          this.state='menu';this.audio.init();this.gameLoop();
        },500);
      }
      document.getElementById('loading-bar').style.width=p+'%';
      const t=document.querySelector('.loading-text');
      if(p<30)t.textContent='Summoning Warriors...';
      else if(p<60)t.textContent='Forging Divine Weapons...';
      else if(p<85)t.textContent='Preparing Kurukshetra...';
      else t.textContent='Blessing by Gods...';
    },200);
  }
  detectMobile(){
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)||(navigator.maxTouchPoints>0&&window.innerWidth<1024);
  }
  setTouchVisible(v){
    const el=document.getElementById('touch-controls');
    if(!el)return;
    el.setAttribute('aria-hidden',v&&this.isMobile?'false':'true');
  }
  bindInput(){
    document.addEventListener('keydown',e=>{
      if(!this.keys[e.key])this.keyJustPressed[e.key]=true;
      this.keys[e.key]=true;this.lastKeyPress=Date.now();
      if(this.state==='battle'&&!this.battleActive&&!this.roundActive&&(e.key==='Enter'||e.key===' '))this.startRound();
      if(e.key==='Enter'||e.key===' '){
        if(this.state==='menu')this.menuSelect();
        else if(this.state==='characterSelect')this.confirmCharacter();
        else if(this.state==='result')this.handleResultInput();
      }
      if(e.key==='ArrowUp'||e.key==='ArrowDown'){
        if(this.state==='menu'){
          if(e.key==='ArrowUp')this.selectedMenuItem=Math.max(0,(this.selectedMenuItem-1+this.menuItems.length)%this.menuItems.length);
          if(e.key==='ArrowDown')this.selectedMenuItem=(this.selectedMenuItem+1)%this.menuItems.length;
          this.audio.playSfx('select',.5);
        }
      }
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
        if(this.state==='characterSelect'){
          const dir=e.key==='ArrowLeft'?-1:1;
          this.selectedChar=(this.selectedChar+dir+CHARACTERS.length)%CHARACTERS.length;
          this.audio.playSfx('select');
        }
      }
      if(e.key==='Escape'){
        if(this.showingHelp)this.showingHelp=false;
        else if(this.state==='characterSelect')this.state='menu';
        else if(this.state==='result')this.state='menu';
      }
      if(e.key==='1')this.difficulty='easy';
      if(e.key==='2')this.difficulty='normal';
      if(e.key==='3')this.difficulty='hard';
    });
    document.addEventListener('keyup',e=>{this.keys[e.key]=false;});
    this.setupTouchControls();
  }
  setupTouchControls(){
    this.canvas.addEventListener('touchstart',e=>{
      e.preventDefault();const t=e.touches[0];
      if(this.state==='menu')this.menuSelect();
      else if(this.state==='characterSelect'){
        this.selectedChar=(this.selectedChar+(t.clientX<window.innerWidth/2?-1:1)+CHARACTERS.length)%CHARACTERS.length;
        this.audio.playSfx('select');
      }
      if(this.state==='result')this.handleResultInput();
      if(this.state==='battle'&&!this.battleActive&&!this.roundActive)this.startRound();
    },{passive:false});
    this.canvas.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
    // Wire up DOM touch buttons for battle controls
    const tc=document.getElementById('touch-controls');
    if(!tc)return;
    tc.setAttribute('aria-hidden','true');
    const km={
      'up':{k:'ArrowUp',m:'j'},'down':{k:'ArrowDown',m:'j'},
      'left':{k:'ArrowLeft',m:'h'},'right':{k:'ArrowRight',m:'h'},
      'light':{k:'j',m:'j'},'heavy':{k:'k',m:'j'},
      'special':{k:'l',m:'j'},'block':{k:'Shift',m:'h'},
    };
    tc.querySelectorAll('[data-touch]').forEach(btn=>{
      const a=btn.getAttribute('data-touch');
      if(!a)return;const m=km[a];
      if(!m)return;
      btn.addEventListener('touchstart',e=>{
        e.preventDefault();e.stopPropagation();
        btn.classList.add('active');
        if(m.m==='j'){this.keyJustPressed[m.k]=true;this.keys[m.k]=true;}
        else{this.keys[m.k]=true;}
      },{passive:false});
      btn.addEventListener('touchend',e=>{
        e.preventDefault();e.stopPropagation();
        btn.classList.remove('active');this.keys[m.k]=false;
      },{passive:false});
      btn.addEventListener('touchcancel',()=>{
        btn.classList.remove('active');this.keys[m.k]=false;
      });
    });
  }
  menuSelect(){
    switch(this.selectedMenuItem){
      case 0:this.state='characterSelect';this.selectedChar=0;this.gameMode='versus';this.audio.playSfx('select',1.2);break;
      case 1:this.state='characterSelect';this.selectedChar=0;this.gameMode='survival';this.survivalWave=1;this.survivalKills=0;this.audio.playSfx('select',1.2);break;
      case 2:this.showingHelp=!this.showingHelp;this.audio.playSfx('select');break;
    }
  }
  confirmCharacter(){
    this.playerChar=CHARACTERS[this.selectedChar];
    const enemies=CHARACTERS.filter(c=>c.id!==this.playerChar.id);
    this.enemyChar=enemies[Math.floor(Math.random()*enemies.length)];
    this.startBattle();this.audio.playSfx('select',1.5);
  }
  handleResultInput(){
    if(this.state==='result'){
      if(this.gameMode==='survival'&&this.lastMatchWon){
        this.survivalWave++;this.survivalKills++;
        this.state='characterSelect';
        this.selectedChar=CHARACTERS.findIndex(c=>c.id===this.playerChar.id);
        this.audio.playSfx('select',1.2);
      }else{this.state='menu';this.audio.playSfx('select');}
    }
  }
  startBattle(){
    this.state='battle';this.battleActive=false;this.round=1;this.playerWins=0;this.enemyWins=0;this.comboCount=0;
    this.survivalWave=this.survivalWave||1;
    this.audio.startMusic();
    this.showToast(`${this.playerChar.name} VS ${this.enemyChar.name}!`);
    this.roundIntroTimer=2.5;
    this.cinematicZoom=0;this.cinematicZoomTarget=.85;
    setTimeout(()=>{if(this.state==='battle')this.startRound();},2500);
  }
  createEntity(charData,isPlayer){
    const baseX=isPlayer?180:CONFIG.W-180;
    return{
      ...charData.stats,
      stats: charData.stats,
      currentHp:charData.stats.hp,
      displayHp:charData.stats.hp,
      damageHp:charData.stats.hp,
      x:baseX,y:CONFIG.GROUND_Y,w:80,h:120,
      facing:isPlayer?1:-1,state:'idle',stateTimer:0,animFrame:0,
      attacking:false,attackType:'light',attackFrame:0,attackCooldown:0,
      specialCooldown:0,specialActive:false,specialTimer:0,
      energy:0,maxEnergy:100,blocking:false,blockTimer:0,
      hitFlash:0,invincible:false,invTimer:0,died:false,
      velocityX:0,velocityY:0,grounded:true,jumpTimer:0,
      dodgeTimer:0,dodgeCooldown:0,comboCount:0,comboTimer:0,
      lastX:baseX,moveIntent:0,tauntTimer:0,damageDealt:0,
      hitstun:0,walking:false,
      rageActive:false,rageTimer:0,rageUsed:false,parryFrames:0,airJuggleCount:0,
      // AI state
      aiState:'approach',aiTimer:0,aiLastAction:'',aiComboChain:0,aiOppLastAttacking:false,aiPunishWindow:0,
      // AI v2: Pattern recognition, wake-up, rage awareness
      aiActionHistory:[],aiPatterns:{attackFreq:0,blockFreq:0,jumpFreq:0,dodgeFreq:0,specialFreq:0,lastPatternScan:0},
      aiWakeupMode:'',aiRageDefensive:false,aiAggressiveTimer:0,aiNextAction:'',aiWasHitstun:false,
    };
  }
  startRound(){
    if(this.state!=='battle')return;
    this.battleActive=true;this.roundActive=true;
    this.player=this.createEntity(this.playerChar,true);
    this.enemy=this.createEntity(this.enemyChar,false);
    if(this.gameMode==='survival'){
      const buff=1+(this.survivalWave-1)*.12;
      this.enemy.stats.hp=Math.floor(this.enemyChar.stats.hp*buff);
      this.enemy.stats.attack=Math.floor(this.enemyChar.stats.attack*buff);
      this.enemy.currentHp=this.enemy.stats.hp;
    }
    this.gameTime=0;this.battleTimer=this.maxBattleTime;
    this.screenShake=0;this.particles.clear();this.flashEffect=0;this.koFlash=0;
    this.hitStopTimer=0;this.slowMo=0;this.damageNumbers=[];
    this.koFreezeTimer=0;this.koFreezeText='';
    this.cinematicZoom=0;this.cinematicZoomTarget=1;
    this.audio.setMusicIntensity(.3);
    this.showToast(`Round ${this.round} — FIGHT!`);
    this.audio.playSfx('round_start');
    // Start crowd if not already playing
    this.audio.startCrowd();
    this.audio.crowdCheer(.5);
  }
  showToast(msg){this.toastMessage=msg;this.toastTimer=2;}

  _addDamageNum(x,y,text,color,life,vy){
    let d;
    if(this._damageNumPool.length>0){d=this._damageNumPool.pop();}else{d={};}
    d.x=x;d.y=y;d.text=text;d.color=color;d.life=life;d.maxLife=life;d.vy=vy;
    this.damageNumbers.push(d);
    return d;
  }

  update(dt){
    if(dt>.05)dt=.05;
    this.animFrame=(this.animFrame||0)+1;
    this.gameTime+=dt;this.titlePulse+=dt;
    this.particles.update(dt);this.background.update(dt);
    this.camera.update(dt);
    // Show touch controls only during battle on mobile
    if(this.animFrame%6===0)this.setTouchVisible(this.state==='battle'&&this.battleActive);
    
    // Camera zoom transition
    this.cinematicZoom+=(this.cinematicZoomTarget-this.cinematicZoom)*.05;
    
    // Special zoom pulse — slight shake during charge
    if(this.specialZoomPulse>0){
      this.specialZoomPulse-=dt;
      this.camera.shake(2+Math.sin(this.gameTime*50)*2);
    }
    
    // Screen shake
    if(this.screenShake>.3){
      this.camera.shake(this.screenShake);
      this.screenShake*=Math.pow(.88,dt*60);
      if(this.screenShake<.3)this.screenShake=0;
    }
    if(this.flashEffect>0)this.flashEffect-=dt*3;
    if(this.koFlash>0)this.koFlash-=dt*2;
    
    // Hit stop (stop game updates)
    if(this.hitStopTimer>0){this.hitStopTimer-=dt;return;}
    
    // KO freeze frame — dramatic pause on death
    if(this.koFreezeTimer>0){
      this.koFreezeTimer-=dt;
      this.camera.zoomTo(.85+Math.sin(this.koFreezeTimer*8)*.03);
      return;
    }
    
    if(this.toastTimer>0)this.toastTimer-=dt;
    if(this.roundIntroTimer>0){this.roundIntroTimer-=dt;return;}
    
    // Slow mo
    if(this.slowMo>0){this.slowMo-=dt*2;dt*=.3;}
    
    if(this.state!=='battle'||!this.battleActive||!this.roundActive)return;
    this.battleTimer-=dt;
    if(this.battleTimer<=0){this.endRound('time');return;}
    
    const avgHp=((this.player.currentHp/this.player.stats.hp)+(this.enemy.currentHp/this.enemy.stats.hp))/2;
    this.audio.setMusicIntensity(1-avgHp*.7);
    this.audio.setCrowdIntensity(1-avgHp*.5);
    this.audio.updateCrowd();
    
    if(this.comboTimer>0)this.comboTimer-=dt;else this.comboCount=0;
    
    this.updateEntity(this.player,dt,false);
    this.updateEntity(this.enemy,dt,true);
    
    // Camera follows mid-point
    if(this.player&&this.enemy){
      this.camera.targetX=-(this.player.x+this.enemy.x)/2+CONFIG.W/2;
      this.camera.targetY=0;
    }
    
    if(this.player.died&&this.enemy.died)this.endRound('draw');
    else if(this.player.died)this.endRound('enemy');
    else if(this.enemy.died)this.endRound('player');
    
    this.keyJustPressed={};
  }
  
  updateEntity(entity,dt,isAI){
    if(entity.died)return;
    entity.attackCooldown=Math.max(0,entity.attackCooldown-dt);
    entity.specialCooldown=Math.max(0,entity.specialCooldown-dt);
    entity.hitFlash=Math.max(0,entity.hitFlash-dt*5);
    entity.invTimer=Math.max(0,entity.invTimer-dt);
    entity.invincible=entity.invTimer>0;
    entity.hitstun=Math.max(0,entity.hitstun-dt);
    entity.dodgeCooldown=Math.max(0,entity.dodgeCooldown-dt);
    entity.energy=Math.min(entity.maxEnergy,entity.energy+CONFIG.ENERGY_REGEN*dt*(entity.rageActive?2.5:1));
    if(entity.specialActive){entity.specialTimer-=dt;if(entity.specialTimer<=0)entity.specialActive=false;}
    if(entity.comboTimer>0)entity.comboTimer-=dt;else entity.comboCount=0;
    if(entity.dodgeTimer>0)entity.dodgeTimer-=dt;
    
    // Parry tracking: first ~5 frames (80ms) of block = parry window
    if(entity.blocking)entity.parryFrames++;else entity.parryFrames=0;
    
    // RAGE MODE: activate at ≤25% HP (once per round, after hitstun clears)
    if(!entity.rageUsed&&entity.currentHp/entity.stats.hp<=0.25&&!entity.died&&entity.hitstun<=0){
      if(!entity.rageActive){
        entity.rageActive=true;entity.rageUsed=true;entity.rageTimer=8;
        this.particles.specialBurst(entity.x,entity.y-30,'#ff0000');
        this.screenShake=10;this.audio.playSfx('special',1.3);
        this.flashEffect=.5;
        this._addDamageNum(entity.x,entity.y-60,'RAGE!','#ff0000',1.2,-120);
      }
    }
    if(entity.rageActive){
      entity.rageTimer-=dt;
      if(entity.rageTimer<=0)entity.rageActive=false;
    }
    
    // Smooth HP bar animation — displayHp follows currentHp quickly, damageHp lags behind
    entity.displayHp += (entity.currentHp - entity.displayHp) * Math.min(1, dt * 10);
    entity.damageHp += (entity.currentHp - entity.damageHp) * Math.min(1, dt * 3);
    
    // Hitstun
    if(entity.hitstun>0){
      entity.animFrame+=dt*60;
      entity.x+=entity.velocityX*dt*.5;
      return;
    }
    
    // Physics
    if(!entity.grounded){
      entity.velocityY+=CONFIG.GRAVITY*dt;
      entity.y+=entity.velocityY*dt;
      if(entity.y>=CONFIG.GROUND_Y){
        entity.y=CONFIG.GROUND_Y;entity.velocityY=0;
        if(!entity.grounded){entity.grounded=true;this.particles.land(entity.x,entity.y);this.audio.playSfx('land');entity.airJuggleCount=0;}
      }
    }
    entity.x+=entity.velocityX*dt;
    entity.velocityX*=.9;
    entity.x=clamp(entity.x,40,CONFIG.W-40);
    
    const opp=isAI?this.player:this.enemy;
    if(!entity.attacking&&entity.hitstun<=0)entity.facing=opp.x>entity.x?1:-1;
    
    entity.walking=Math.abs(entity.x-(entity.lastX||entity.x))>2;
    entity.animFrame+=dt*60;
    
    if(entity.walking&&Math.random()<.15)this.particles.footstep(entity.x,entity.y);
    entity.lastX=entity.x;
    
    if(isAI)this.updateAI(entity,dt,opp);
    else this.updatePlayer(entity,dt,opp);
  }
  
  updatePlayer(entity,dt,opp){
    if(entity.attacking||entity.hitstun>0)return;
    entity.moveIntent=0;
    if(this.keys['ArrowLeft']||this.keys['a']){entity.x-=entity.speed*dt;entity.moveIntent=-1;}
    if(this.keys['ArrowRight']||this.keys['d']){entity.x+=entity.speed*dt;entity.moveIntent=1;}
    if((this.keyJustPressed['w']||this.keyJustPressed['W']||this.keyJustPressed['ArrowUp'])&&entity.grounded&&entity.dodgeCooldown<=0){
      entity.velocityY=-650;entity.grounded=false;entity.jumpTimer=.3;
      this.audio.playSfx('jump',rng(.8,1.2));
    }
    if((this.keyJustPressed['s']||this.keyJustPressed['S']||this.keyJustPressed['ArrowDown'])&&entity.dodgeCooldown<=0&&entity.grounded){
      entity.dodgeTimer=.15;entity.dodgeCooldown=.6;entity.invTimer=.2;
      entity.velocityX=entity.facing*-450;
      this.audio.playSfx('dodge',rng(.9,1.1));
      this.particles.emit(entity.x,entity.y,{count:6,type:'smoke',speed:120,life:.2,spread:1,color:'#888',gravity:0});
    }
    if((this.keyJustPressed['j']||this.keyJustPressed['J']||this.keyJustPressed['z']||this.keyJustPressed['Z'])&&entity.attackCooldown<=0)
      this.performAttack(entity,opp,'light');
    if((this.keyJustPressed['k']||this.keyJustPressed['K']||this.keyJustPressed['x']||this.keyJustPressed['X'])&&entity.attackCooldown<=0)
      this.performAttack(entity,opp,'heavy');
    if((this.keyJustPressed['l']||this.keyJustPressed['L']||this.keyJustPressed['c']||this.keyJustPressed['C'])&&entity.specialCooldown<=0&&entity.energy>=CONFIG.SPECIAL_COST)
      this.performSpecial(entity,opp);
    entity.blocking=!!(this.keys['Shift']&&!entity.attacking&&entity.grounded);
    entity.speed=entity.blocking?entity.stats.speed*.5:entity.stats.speed;
  }
  
  updateAI(entity,dt,opp){
    if(entity.attacking||entity.hitstun>0){
      entity.aiWasHitstun=true;return;
    }
    
    // ─── WAKE-UP: entity just recovered from hitstun ───
    if(entity.aiWasHitstun){
      entity.aiWasHitstun=false;
      const dist=Math.abs(entity.x-opp.x);
      const r=Math.random();
      const hpLow=entity.currentHp/entity.stats.hp<.35;
      const oppClose=dist<130;
      // Choose wake-up based on situation and difficulty
      const wakeDifficulty=this.difficulty==='hard'?1:(this.difficulty==='normal'?.6:.3);
      if(oppClose&&entity.energy>=CONFIG.SPECIAL_COST&&entity.specialCooldown<=0&&r<.15*wakeDifficulty)
        entity.aiWakeupMode='special_wake';  // Reversal special
      else if(oppClose&&r<.25*wakeDifficulty)
        entity.aiWakeupMode='dodge_wake';     // Backdash away
      else if(oppClose&&r<.15*wakeDifficulty)
        entity.aiWakeupMode='attack_wake';    // Mash out
      else if(!oppClose&&r<.15*wakeDifficulty)
        entity.aiWakeupMode='jump_wake';      // Jump to reposition
      else
        entity.aiWakeupMode='block_wake';     // Safe block
    }
    
    // ─── WAKE-UP EXECUTION ───
    if(entity.aiWakeupMode){
      const wm=entity.aiWakeupMode;
      entity.aiWakeupMode='';
      if(wm==='block_wake'){
        entity.blocking=true;entity.blockTimer=.25+Math.random()*.15;
        entity.aiLastAction='wake_block';
      }else if(wm==='dodge_wake'){
        if(entity.dodgeCooldown<=0&&entity.grounded){
          entity.dodgeTimer=.15;entity.dodgeCooldown=.6;entity.invTimer=.2;
          entity.velocityX=entity.facing*-450;
          this.audio.playSfx('dodge',rng(.9,1.1));
          entity.aiLastAction='wake_dodge';
        }else entity.blocking=true;
      }else if(wm==='special_wake'){
        if(entity.energy>=CONFIG.SPECIAL_COST&&entity.specialCooldown<=0){
          this.performSpecial(entity,opp);entity.stateTimer=1.0;entity.aiLastAction='wake_special';
        }else entity.blocking=true;
      }else if(wm==='jump_wake'){
        if(entity.grounded){entity.velocityY=-580;entity.grounded=false;
        entity.aiLastAction='wake_jump';}
      }else if(wm==='attack_wake'){
        if(entity.attackCooldown<=0){this.performAttack(entity,opp,'light');
        entity.aiLastAction='wake_attack';}
      }
      entity.aiTimer=.2;return;
    }
    entity.stateTimer-=dt;
    entity.aiTimer-=dt;
    entity.aiPunishWindow=Math.max(0,entity.aiPunishWindow-dt);
    const dist=Math.abs(entity.x-opp.x);
    const hpRatio=entity.currentHp/entity.stats.hp;
    const oppHpRatio=opp.currentHp/opp.stats.hp;
    const oppWasAttacking=entity.aiOppLastAttacking;
    entity.aiOppLastAttacking=opp.attacking;

    // Difficulty params
    let rt,ag,bc,dc,predictChance,punishWindow,comboChance,specialChance,jumpChance;
    if(this.difficulty==='easy'){
      rt=.35;ag=.35;bc=.12;dc=.08;
      predictChance=.1;punishWindow=.15;comboChance=.1;specialChance=.12;jumpChance=.2;
    }else if(this.difficulty==='hard'){
      rt=.08;ag=.85;bc=.4;dc=.25;
      predictChance=.5;punishWindow=.45;comboChance=.55;specialChance=.45;jumpChance=.5;
    }else{
      rt=.2;ag=.6;bc=.25;dc=.15;
      predictChance=.25;punishWindow=.3;comboChance=.25;specialChance=.2;jumpChance=.35;
    }

    // Survival scaling: each wave makes AI harder
    if(this.gameMode==='survival'){
      const waveScale=Math.min(1+(this.survivalWave-1)*.08,1.6);
      ag*=waveScale;dc*=waveScale;punishWindow*=waveScale;
      specialChance*=waveScale;comboChance*=waveScale;predictChance*=waveScale;
    }

    // Dynamic aggression: losing = more aggressive, winning = defensive
    const aggroMod=hpRatio<.3?1.4:(hpRatio<.5?1.15:(hpRatio>.8&&oppHpRatio<.5?.7:1));
    ag*=aggroMod;bc/=aggroMod;

    // ─── OPPONENT ACTION TRACKING ──────────────────────────────
    // Record opponent's current action into rolling history
    let oppAction='none';
    if(opp.attacking)oppAction=opp.attackType==='special'?'special':(opp.attackType==='heavy'?'heavy':'light');
    else if(opp.blocking)oppAction='block';
    else if(!opp.grounded)oppAction='jump';
    else if(opp.dodgeTimer>0||(Math.abs(opp.velocityX)>300&&!opp.attacking))oppAction='dodge';
    entity.aiActionHistory.push(oppAction);
    if(entity.aiActionHistory.length>12)entity.aiActionHistory.shift();

    // ─── PATTERN SCAN: every ~2s, analyze player tendencies ────
    entity.aiPatterns.lastPatternScan-=dt;
    if(entity.aiPatterns.lastPatternScan<=0&&entity.aiActionHistory.length>=6){
      entity.aiPatterns.lastPatternScan=1.5+Math.random()*.5;
      const hist=entity.aiActionHistory;
      let aC=0,bC=0,jC=0,dC=0,sC=0,tot=hist.length;
      for(let i=0;i<tot;i++){
        const a=hist[i];
        if(a==='light'||a==='heavy')aC++;
        else if(a==='block')bC++;
        else if(a==='jump')jC++;
        else if(a==='dodge')dC++;
        else if(a==='special')sC++;
      }
      entity.aiPatterns.attackFreq=aC/tot;
      entity.aiPatterns.blockFreq=bC/tot;
      entity.aiPatterns.jumpFreq=jC/tot;
      entity.aiPatterns.dodgeFreq=dC/tot;
      entity.aiPatterns.specialFreq=sC/tot;
    }

    // ─── RAGE AWARENESS ────────────────────────────────────────
    // If opponent is in rage mode, AI plays defensively
    const oppRage=opp.rageActive;
    if(oppRage){
      ag*=0.5;        // Much less aggressive
      bc=Math.min(bc*2.5,0.7);  // Block more
      dc=Math.min(dc*3,0.6);    // Dodge more
      punishWindow*=0.5;  // Don't overcommit to punishes
      jumpChance*=0.5;    // Less jumping (vulnerable in air)
      specialChance*=0.3; // Don't waste specials (slow recovery)
    }
    // If AI itself is in rage, become hyper-aggressive
    if(entity.rageActive){
      ag*=1.4;
      comboChance=Math.min(comboChance*1.5,0.9);
      specialChance=Math.min(specialChance*1.4,0.7);
      bc*=0.5;
    }

    // ─── PATTERN-BASED ADAPTATION ──────────────────────────────
    // Adjust strategy based on detected player tendencies
    const p=entity.aiPatterns;
    if(p.lastPatternScan>0){ // Only if we've scanned at least once
      // Player jumps a lot → anti-air with light attacks when they approach
      if(p.jumpFreq>0.25&&dist<180&&entity.grounded){
        entity.aiLastAction='anti_air';
      }
      // Player blocks a lot → use more throws/grabs (heavies that guard crush)
      if(p.blockFreq>0.4){
        ag*=1.15; // More aggressive, force them to stop blocking
        comboChance=Math.min(comboChance*1.2,0.8); // Longer block pressure
      }
      // Player dodges a lot → delay attacks to catch dodge recovery
      if(p.dodgeFreq>0.2){
        bc*=0.7; // Less blocking, more chasing
      }
      // Player spams specials → stay close to pressure them
      if(p.specialFreq>0.2){
        ag*=1.2; // Close the distance
        dc=Math.min(dc*1.5,0.5); // Dodge their specials
      }
    }

    // --- WHIFF PUNISH: opponent just finished attacking ---
    if(oppWasAttacking&&!opp.attacking&&dist<140&&entity.aiPunishWindow<=0){
      if(Math.random()<punishWindow){
        const direction=opp.x>entity.x?1:-1;
        entity.x+=direction*entity.speed*dt*2;
        if(entity.energy>=CONFIG.SPECIAL_COST&&entity.specialCooldown<=0&&Math.random()<specialChance*.6){
          this.performSpecial(entity,opp);entity.stateTimer=.8;entity.aiLastAction='punish_special';
        }else if(entity.attackCooldown<=0&&Math.random()<.7){
          this.performAttack(entity,opp,'heavy');entity.stateTimer=.5;entity.aiLastAction='punish_heavy';
        }else if(entity.attackCooldown<=0){
          this.performAttack(entity,opp,'light');entity.stateTimer=.3;entity.aiLastAction='punish_light';
        }return;
      }
    }

    // --- COMBO CHAINING: follow up after hitting ---
    if(entity.aiComboChain>0&&entity.attackCooldown<=0&&dist<110&&entity.aiTimer<=0){
      entity.aiComboChain--;
      if(Math.random()<comboChance){
        if(Math.random()<.4&&entity.energy>=CONFIG.SPECIAL_COST&&entity.specialCooldown<=0){
          this.performSpecial(entity,opp);entity.stateTimer=1.0;entity.aiLastAction='combo_special';
        }else{
          this.performAttack(entity,opp,Math.random()<.35?'heavy':'light');
          entity.stateTimer=.4;entity.aiLastAction='combo_light';
        }entity.aiTimer=.15;return;
      }
    }

    if(entity.aiTimer>0)return; // still in cooldown between decisions

    const roll=Math.random();

    // --- OPTIMAL RANGE POSITIONING ---
    const wantClose=entity.attackCooldown<=0;
    const optimalDist=wantClose?80:180;

    // --- ANTI-AIR: punish airborne opponents ---
    if(!opp.grounded&&dist<160&&entity.grounded&&entity.attackCooldown<=0&&roll<ag*.6){
      this.performAttack(entity,opp,'light');
      entity.stateTimer=.4;entity.aiLastAction='anti_air';
      entity.aiTimer=.2;return;
    }

    // --- REACTIVE COUNTERS ---
    // Dodge when opponent attacks at close range
    if(opp.attacking&&dist<120&&roll<dc&&entity.grounded&&entity.dodgeCooldown<=0){
      entity.dodgeTimer=.15;entity.dodgeCooldown=.6;entity.invTimer=.2;
      entity.velocityX=entity.facing*-450;
      this.audio.playSfx('dodge',rng(.9,1.1));
      entity.stateTimer=.3;entity.aiLastAction='dodge';entity.aiTimer=.2;return;
    }

    // Block when opponent attacks at mid range
    if(opp.attacking&&dist<150&&roll<bc*.7&&entity.grounded){
      // AI parry chance on harder difficulties
      const parryChance=this.difficulty==='hard'?.2:(this.difficulty==='normal'?.05:0);
      if(dist<100&&roll<parryChance){
        // AI initiates a parry by starting block just before hit connects
        entity.blocking=true;entity.parryFrames=0;
        entity.blockTimer=.2;entity.stateTimer=.4;entity.aiLastAction='parry';entity.aiTimer=.2;
        // Visually indicate AI is parrying
        this.particles.emit((entity.x+opp.x)/2,entity.y-20,{count:4,type:'ring',speed:0,life:.15,size:10,color:'#00ffff'});
      }else{
        entity.blocking=true;entity.blockTimer=.3+Math.random()*.25;
      }
      entity.stateTimer=.4;entity.aiLastAction='block';entity.aiTimer=.15;return;
    }

    // --- PREDICTIVE MOVEMENT ---
    // Predict where opponent is going and move to intercept
    if(dist>optimalDist+40&&entity.grounded&&roll<predictChance){
      const oppMoveDir=opp.velocityX>5?1:(opp.velocityX<-5?-1:0);
      const interceptX=opp.x+oppMoveDir*80;
      entity.x+=(interceptX>entity.x?1:-1)*entity.speed*dt*1.3;
      entity.aiTimer=.2;entity.aiLastAction='predict_move';return;
    }

    // --- SPECIAL ATTACK ---
    if(dist<180&&entity.energy>=CONFIG.SPECIAL_COST&&entity.specialCooldown<=0&&roll<specialChance*.4){
      this.performSpecial(entity,opp);entity.stateTimer=1.2;entity.aiLastAction='special';
      entity.aiTimer=.5;return;
    }

    // --- HEAVY ATTACK ---
    if(dist<120&&entity.attackCooldown<=0&&roll<ag*.35){
      this.performAttack(entity,opp,'heavy');entity.stateTimer=.7;entity.aiLastAction='heavy';
      entity.aiComboChain=1;entity.aiTimer=.3;return;
    }

    // --- LIGHT ATTACK ---
    if(dist<110&&entity.attackCooldown<=0&&roll<ag*.5){
      this.performAttack(entity,opp,'light');entity.stateTimer=.4;entity.aiLastAction='light';
      entity.aiComboChain=2;entity.aiTimer=.2;return;
    }

    // --- BLOCK (defensive) ---
    if(dist<110&&roll<bc&&entity.grounded&&!entity.blocking){
      entity.blocking=true;entity.blockTimer=.15+Math.random()*.3;
      entity.stateTimer=.35;entity.aiLastAction='block';entity.aiTimer=.2;return;
    }

    // --- JUMP IN (approach tool) ---
    if(dist>160&&entity.grounded&&roll<jumpChance*.25){
      entity.velocityY=-580;entity.grounded=false;entity.stateTimer=.6;
      entity.aiLastAction='jump';
      setTimeout(()=>{
        if(!this.battleActive||entity.died||!entity.grounded)return;
        const nd=Math.abs(entity.x-opp.x);
        if(nd<130&&entity.attackCooldown<=0){
          this.performAttack(entity,opp,Math.random()<.4?'heavy':'light');
          entity.aiComboChain=1;
        }
      },220);
      entity.aiTimer=.4;return;
    }

    // --- INTELLIGENT MOVEMENT ---
    if(!entity.blocking){
      if(dist>optimalDist+30){
        // Approach opponent
        const dir=opp.x>entity.x?1:-1;
        const speedMul=ag>.7?1.2:1;
        entity.x+=dir*entity.speed*dt*(.5+Math.random()*.3)*speedMul;
        entity.aiLastAction='approach';
      }else if(dist<optimalDist-30){
        // Back off slight
        const dir=entity.x>opp.x?1:-1;
        entity.x+=dir*entity.speed*dt*(.2+Math.random()*.2);
        entity.aiLastAction='retreat';
      }else{
        // Circle strafe
        const dir=Math.random()<.5?1:-1;
        entity.x+=dir*entity.speed*dt*(.1+Math.random()*.2);
        entity.aiLastAction='circle';
      }
    }

    entity.stateTimer=rt+Math.random()*.2;
    entity.aiTimer=.1+Math.random()*.1;
    if(entity.blocking){entity.blockTimer-=dt;if(entity.blockTimer<=0)entity.blocking=false;}
  }
  
  performAttack(attacker,defender,type){
    const isHeavy=type==='heavy';
    attacker.attacking=true;attacker.attackType=type;
    attacker.attackFrame=0;attacker.attackCooldown=isHeavy?.6:.35;
    if(!attacker.grounded){attacker.velocityY=200;attacker.attackCooldown=.4;}
    attacker.velocityX=attacker.facing*(isHeavy?220:130);
    const hitDelay=isHeavy?280:140,hitDist=isHeavy?140:95;
    setTimeout(()=>{
      if(!this.battleActive||attacker.died||!this.roundActive){attacker.attacking=false;return;}
      const dist=Math.abs(attacker.x-defender.x);
      if(dist<hitDist&&!defender.invincible){
        let damage=isHeavy?attacker.attack*1.6+rng(0,4):attacker.attack+rng(0,3);
        
        // ── PARRY / RIPOSTE ──
        // If defender started blocking within last ~5 frames (80ms), they parry!
        if(defender.blocking&&defender.parryFrames<=5){
          damage=0;defender.hitFlash=1;defender.blocking=false;
          defender.invincible=true;defender.invTimer=.5;
          // Stun the attacker, opening them for a counter
          attacker.hitstun=.4;attacker.attacking=false;
          attacker.velocityX=(attacker.x>defender.x?1:-1)*150;
          // Visual & audio
          this.particles.specialBurst((attacker.x+defender.x)/2,defender.y-20,'#00ffff');
          this.particles.emit((attacker.x+defender.x)/2,defender.y-20,{count:12,type:'ring',speed:0,life:.4,size:15,color:'#00ffff'});
          this.screenShake=10;this.hitStopTimer=.1;
          this.audio.playSfx('counter');
          this._addDamageNum(defender.x,defender.y-50,'PARRY!','#00ffff',.8,-120);
          defender.parryFrames=10; // prevent chain parry
          defender.currentHp=Math.max(0,defender.currentHp-damage);
          attacker.attacking=false;return;
        }
        
        // ── RAGE DAMAGE BONUS ──
        if(attacker.rageActive)damage*=1.3;
        if(defender.rageActive)damage*=.85; // 15% damage reduction
        
        // ── BLOCK (normal) ──
        if(defender.blocking){
          damage*=.2;this.particles.hitSparks((attacker.x+defender.x)/2,defender.y-20,'#ffd700');
          this.audio.playSfx('block');defender.blocking=false;defender.hitstun=.1;
        }else{
          this.hitStopTimer=isHeavy?.12:.06;
          if(isHeavy){this.particles.heavyHitSparks(defender.x,defender.y-20);this.screenShake=14;this.audio.playSfx('heavy');this.audio.crowdGasp(.6);}
          else{this.particles.hitSparks(defender.x,defender.y-20,'#ff6b35');this.screenShake=6;this.audio.playSfx('hit');}
          defender.hitFlash=1;defender.hitstun=isHeavy?.4:.18;
          const kd=defender.x>attacker.x?1:-1;
          defender.velocityX=kd*(isHeavy?70:35);
          if(isHeavy){defender.velocityY=-220;defender.grounded=false;}
          attacker.comboCount++;attacker.comboTimer=CONFIG.COMBO_WINDOW;
          if(attacker.comboCount>=3)this.comboCount=Math.max(this.comboCount,attacker.comboCount);
          this.maxComboDisplay=Math.max(this.maxComboDisplay,attacker.comboCount);
          if(attacker.comboCount>1){damage*=1+(attacker.comboCount-1)*.07;}
          if(attacker.comboCount%3===0){this.audio.playSfx('combo');this.audio.crowdCheer(.4);this.flashEffect=.3;}
          
          // ── AIR COMBO (JUGGLE) ──
          if(!defender.grounded&&attacker.airJuggleCount<3){
            attacker.airJuggleCount++;
            // Pop defender back up for continued juggle
            defender.velocityY=-280;defender.grounded=false;
            defender.hitstun=.3;defender.velocityX=kd*20;
            damage*=1.15; // juggle bonus
            this.particles.hitSparks(defender.x,defender.y-30,'#00ccff');
            this._addDamageNum(defender.x,defender.y-60,'AIR!','#00ccff',.6,-100);
          }else if(!defender.grounded&&attacker.airJuggleCount>=3){
            // Max juggle reached — hard knock down
            defender.velocityY=-350;defender.velocityX=kd*120;
            this.particles.heavyHitSparks(defender.x,defender.y-20);
            this.screenShake=18;
          }
          
          this._addDamageNum(defender.x,defender.y-40,Math.ceil(damage).toString(),isHeavy?'#ff4400':'#ffd700',.8,-80-rng(0,40));
          attacker.damageDealt+=damage;
        }
        defender.currentHp=Math.max(0,defender.currentHp-damage);
        if(defender.currentHp<=0&&!defender.died){
          defender.died=true;this.particles.deathBurst(defender.x,defender.y-30);
          this.screenShake=25;this.audio.playSfx('death');this.slowMo=.4;this.koFlash=1.5;
          this.audio.crowdCheer(1.0);
          this.hitStopTimer=.4;this.koFreezeTimer=.8;
          this.koFreezeText='K.O.!';
          this.camera.zoomTo(.75);
          setTimeout(()=>{if(this.state==='battle')this.camera.zoomTo(1);},900);
        }
      }
      attacker.attacking=false;
    },hitDelay);
    const ai=setInterval(()=>{attacker.attackFrame++;if(attacker.attackFrame>(isHeavy?5:3))clearInterval(ai);},50);
  }
  
  performSpecial(user,target){
    user.energy-=CONFIG.SPECIAL_COST;user.specialCooldown=CONFIG.SPECIAL_COOLDOWN;
    user.specialActive=true;user.specialTimer=.6;user.attacking=true;
    const ch=(user===this.player)?this.playerChar:this.enemyChar;
    if(ch&&ch.specialEffect)ch.specialEffect(this,user.x,user.y-30,user.facing);
    // Dramatic zoom pulse before the hit
    this.specialZoomPulse=.5;
    this.cinematicZoomTarget=.75;
    this.slowMo=.15;
    setTimeout(()=>{
      if(this.state==='battle'){this.cinematicZoomTarget=1;this.specialZoomPulse=0;}
    },600);
    setTimeout(()=>{
      if(!this.battleActive||user.died||!this.roundActive){user.attacking=false;return;}
      const dist=Math.abs(user.x-target.x);
      let damage=user.specialDmg+rng(0,10);
      if(user.rageActive)damage*=1.25;
      if(target.rageActive)damage*=.85;
      if(dist<220){
        if(target.blocking){damage*=.3;this.audio.playSfx('block');}
        else{this.hitStopTimer=.18;this.screenShake=22;}
        target.currentHp=Math.max(0,target.currentHp-damage);
        target.hitFlash=1;target.hitstun=.5;
        target.velocityX=(target.x>user.x?1:-1)*100;target.velocityY=-200;target.grounded=false;
        this._addDamageNum(target.x,target.y-60,Math.ceil(damage).toString(),'#ff00ff',1.1,-120);
        this.slowMo=.25;
        this.particles.hitSparks(target.x,target.y-20,'#ffffff');
        this.audio.playSfx('hit',1.5);
        if(target.currentHp<=0&&!target.died){target.died=true;this.particles.deathBurst(target.x,target.y-30);this.screenShake=30;this.koFlash=2;this.slowMo=.6;this.audio.playSfx('death');this.audio.playSfx('ko');this.audio.crowdCheer(1.2);this.hitStopTimer=.5;this.koFreezeTimer=1.0;this.koFreezeText='K.O.!';this.camera.zoomTo(.7);setTimeout(()=>{if(this.state==='battle')this.camera.zoomTo(1);},1100);}
      }
      user.attacking=false;
    },450);
    const an=setInterval(()=>{user.attackFrame++;if(user.attackFrame>6)clearInterval(an);},60);
  }
  
  endRound(winner){
    this.battleActive=false;this.roundActive=false;
    if(winner==='player'){this.playerWins++;this.showToast('You Win the Round!');this.audio.playSfx('win');}
    else if(winner==='enemy'){this.enemyWins++;this.showToast('Opponent Wins!');}
    else if(winner==='draw'){this.showToast('Draw!');}
    else if(winner==='time'){
      if(this.player.currentHp>this.enemy.currentHp){this.playerWins++;this.showToast('Time! You Win!');}
      else if(this.enemy.currentHp>this.player.currentHp){this.enemyWins++;this.showToast('Time! Opponent Wins!');}
      else{this.showToast('Time! Draw!');}
    }
    if(this.gameMode==='versus'){
      if(this.playerWins>=2||this.enemyWins>=2)this.endMatch(this.playerWins>this.enemyWins?'player':'enemy');
      else{this.round++;setTimeout(()=>{if(this.state==='battle'){this.showToast(`Round ${this.round}`);setTimeout(()=>this.startRound(),1200);}},1500);}
    }else if(this.gameMode==='survival'){
      if(winner==='player'){
        this.survivalWave++;this.survivalKills++;
        setTimeout(()=>{
          if(this.state==='battle'){
            const es=CHARACTERS.filter(c=>c.id!==this.playerChar.id);
            this.enemyChar=es[Math.floor(Math.random()*es.length)];
            this.showToast(`Wave ${this.survivalWave} — ${this.enemyChar.name}!`);
            setTimeout(()=>this.startRound(),1500);
          }
        },2000);
      }else this.endMatch('enemy');
    }
  }
  
  endMatch(winner){
    this.audio.stopMusic();this.state='result';this.matchWinner=winner;this.lastMatchWon=winner==='player';
    if(winner==='player')this.audio.playSfx('victory');
    else{this.audio.playSfx('death');this.audio.playSfx('ko');}
  }

  draw(){
    const ctx=this.ctx;ctx.save();
    this.camera.apply(ctx,this.W,this.H);
    this.background.draw(ctx);
    switch(this.state){
      case 'menu':this.drawMenu(ctx);break;
      case 'characterSelect':this.drawCharacterSelect(ctx);break;
      case 'battle':this.drawBattle(ctx);break;
      case 'result':this.drawBattle(ctx);this.drawResult(ctx);break;
    }
    // Screen effects
    if(this.flashEffect>0){ctx.fillStyle=`rgba(255,255,255,${this.flashEffect*.25})`;ctx.fillRect(0,0,CONFIG.W,CONFIG.H);}
    if(this.koFlash>0){ctx.fillStyle=`rgba(255,255,255,${Math.sin(this.koFlash*20)*.3*this.koFlash})`;ctx.fillRect(0,0,CONFIG.W,CONFIG.H);}
    if(this.toastTimer>0)this.drawToast(ctx);
    ctx.restore();
  }
  
  drawToast(ctx){
    const a=Math.min(1,this.toastTimer*2);
    ctx.save();ctx.globalAlpha=a;
    ctx.fillStyle='rgba(0,0,0,.85)';ctx.strokeStyle='rgba(255,200,100,.4)';ctx.lineWidth=2;
    const tw=440,th=70,tx=(CONFIG.W-tw)/2,ty=CONFIG.H/2-100;
    ctx.shadowColor='rgba(255,200,100,.2)';ctx.shadowBlur=25;
    ctx.fillRect(tx,ty,tw,th);ctx.shadowBlur=0;ctx.strokeRect(tx,ty,tw,th);
    ctx.fillStyle='#ffd700';ctx.font='bold 30px Rajdhani,sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(this.toastMessage,CONFIG.W/2,ty+th/2);
    ctx.restore();
  }

  drawMenu(ctx){
    ctx.save();
    const tg=ctx.createRadialGradient(CONFIG.W/2,180,0,CONFIG.W/2,180,380);
    tg.addColorStop(0,'rgba(255,200,100,.07)');tg.addColorStop(1,'transparent');
    ctx.fillStyle=tg;ctx.fillRect(0,0,CONFIG.W,400);
    ctx.textAlign='center';
    ctx.shadowColor='#ff6b35';ctx.shadowBlur=30+Math.sin(this.titlePulse*2)*12;
    ctx.font='bold 80px Orbitron,sans-serif';
    const g=ctx.createLinearGradient(CONFIG.W/2-280,0,CONFIG.W/2+280,0);
    g.addColorStop(0,'#ff6b35');g.addColorStop(.5,'#ffd700');g.addColorStop(1,'#ff6b35');
    ctx.fillStyle=g;ctx.fillText('DHARMYUDH',CONFIG.W/2,165);
    ctx.shadowBlur=0;
    ctx.font='bold 26px Rajdhani,sans-serif';
    ctx.fillStyle='#b8966a';ctx.fillText('द  र ् म  य ु द  ् ध',CONFIG.W/2,212);
    ctx.font='18px Rajdhani,sans-serif';
    ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillText('THE GREAT WAR OF KURUKSHETRA',CONFIG.W/2,248);
    ctx.strokeStyle='rgba(255,200,100,.15)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(CONFIG.W/2-200,270);ctx.lineTo(CONFIG.W/2+200,270);ctx.stroke();
    
    const startY=330,itemH=60;
    this.menuItems.forEach((item,i)=>{
      const y=startY+i*itemH,sel=i===this.selectedMenuItem;
      if(sel){
        ctx.fillStyle='rgba(255,200,100,.07)';ctx.fillRect(CONFIG.W/2-140,y-18,280,46);
        ctx.strokeStyle='rgba(255,200,100,.2)';ctx.lineWidth=1;ctx.strokeRect(CONFIG.W/2-140,y-18,280,46);
      }
      ctx.font=`${sel?'bold 26px':'22px'} Rajdhani,sans-serif`;
      ctx.fillStyle=sel?'#ffd700':'rgba(255,255,255,.4)';ctx.fillText(item,CONFIG.W/2,y);
      if(sel){ctx.fillStyle='#ffd700';ctx.font='18px sans-serif';ctx.fillText('▶',CONFIG.W/2-115,y);ctx.fillText('◀',CONFIG.W/2+115,y);}
    });
    
    const dn={easy:'Easy [1]',normal:'Normal [2]',hard:'Hard [3]'};
    ctx.fillStyle='rgba(255,255,255,.15)';ctx.font='14px Rajdhani,sans-serif';
    ctx.fillText(`Difficulty: ${dn[this.difficulty]}`,CONFIG.W/2,startY+itemH*3+15);
    ctx.fillStyle='rgba(255,255,255,.12)';ctx.font='13px Rajdhani,sans-serif';
    ctx.fillText('↑↓ Navigate • Enter Select • ←→ Move • J Light • K Heavy • L Special • Shift Block • W/S Jump/Dodge',CONFIG.W/2,CONFIG.H-35);
    
    if(this.showingHelp){
      ctx.fillStyle='rgba(0,0,0,.85)';ctx.fillRect(0,0,CONFIG.W,CONFIG.H);
      ctx.fillStyle='#ffd700';ctx.font='bold 30px Rajdhani,sans-serif';
      ctx.fillText('HOW TO PLAY',CONFIG.W/2,220);
      const hl=[
        ['← → or A/D','Move your warrior'],
        ['W or ↑','Jump / Air attack'],
        ['S or ↓','Dodge (invincibility frames)'],
        ['J or Z','Light Attack (fast, air juggle)'],
        ['K or X','Heavy Attack (strong, launches enemy)'],
        ['L or C','Special Move (costs 50 energy)'],
        ['Shift (hold)','Block (tap to PARRY!)'],
        ['',''],
        ['⭑ PARRY: Tap block at moment of impact to deflect & stun!'],
        ['⭑ AIR COMBOS: Launch enemy (K) then hit them in the air (J)!'],
        ['⭑ RAGE MODE: Below 25% HP — +30% ATK, -15% DMG taken!'],
        [''],
        ['COMBOS: hit quickly for bonus damage!'],
        ['SURVIVAL: defeat waves of enemies!'],
      ];
      hl.forEach((l,i)=>{
        const yy=280+i*30;
        ctx.font='16px Rajdhani,sans-serif';
        ctx.fillStyle='rgba(255,255,255,.4)';ctx.textAlign='center';
        if(l[0])ctx.fillText(l[0],CONFIG.W/2-180,yy);
        if(l[1]){ctx.fillStyle='rgba(255,255,255,.6)';ctx.textAlign='left';ctx.fillText(l[1],CONFIG.W/2+50,yy);ctx.textAlign='center';}
        if(!l[0]){ctx.fillStyle='rgba(255,200,100,.6)';ctx.fillText(l[1]||l[0],CONFIG.W/2,yy);}
      });
      ctx.fillStyle='rgba(255,255,255,.25)';ctx.font='14px Rajdhani,sans-serif';
      ctx.fillText('Press Esc to close',CONFIG.W/2,CONFIG.H-60);
    }
    ctx.restore();
  }

  drawCharacterSelect(ctx){
    const ch=CHARACTERS[this.selectedChar];
    ctx.save();
    ctx.textAlign='center';
    ctx.fillStyle='#ffd700';ctx.font='bold 28px Rajdhani,sans-serif';
    ctx.fillText('SELECT YOUR WARRIOR',CONFIG.W/2,45);
    const cx=CONFIG.W/2,cy=330;
    const cg=ctx.createRadialGradient(cx,cy-30,0,cx,cy-30,220);
    cg.addColorStop(0,`${ch.color}25`);cg.addColorStop(1,'transparent');
    ctx.fillStyle=cg;ctx.fillRect(cx-220,cy-220,440,440);
    ctx.save();ctx.translate(cx,cy);ctx.scale(3,3);
    ch.draw(ctx,0,0,30,50,1,this.animFrame*2,{attacking:false,specialActive:true},false);
    ctx.restore();
    ctx.fillStyle=ch.color;ctx.font='bold 40px Rajdhani,sans-serif';
    ctx.fillText(ch.name,cx,485);
    ctx.fillStyle='rgba(255,255,255,.45)';ctx.font='24px Noto Sans Devanagari,sans-serif';
    ctx.fillText(ch.devanagari,cx,515);
    ctx.fillStyle='rgba(255,255,255,.35)';ctx.font='18px Rajdhani,sans-serif';
    ctx.fillText(ch.title,cx,545);
    ctx.fillStyle='rgba(255,200,100,.25)';ctx.font='15px Rajdhani,sans-serif';
    ctx.fillText(`"${ch.taunt}"`,cx,572);
    ctx.fillStyle='rgba(255,200,100,.5)';ctx.font='14px Rajdhani,sans-serif';
    ctx.fillText(`⚔ ${ch.weapon} (${ch.weaponDevanagari})`,cx,598);
    
    const st=624,sw=220,sh=12,sg=24;
    const stats=[
      {l:'HP',v:ch.stats.hp,m:180,c:'#ef5350'},
      {l:'ATK',v:ch.stats.attack,m:25,c:'#ff7043'},
      {l:'DEF',v:ch.stats.defense,m:18,c:'#42a5f5'},
      {l:'SPD',v:ch.stats.speed,m:240,c:'#66bb6a'},
      {l:'SPC',v:ch.stats.specialDmg,m:55,c:'#ab47bc'},
    ];
    stats.forEach((s,i)=>{
      const yy=st+i*sg,fill=(s.v/s.m)*sw;
      ctx.textAlign='left';ctx.fillStyle='rgba(255,255,255,.45)';ctx.font='13px Rajdhani,sans-serif';
      ctx.fillText(s.l,cx-sw/2-38,yy+4);
      ctx.fillStyle='rgba(255,255,255,.07)';ctx.fillRect(cx-sw/2,yy-4,sw,sh);
      ctx.fillStyle=s.c;ctx.fillRect(cx-sw/2,yy-4,fill,sh);
    });
    ctx.textAlign='center';ctx.fillStyle='rgba(255,255,255,.25)';ctx.font='16px Rajdhani,sans-serif';
    ctx.fillText('◄  ←  →  ►',cx,695);ctx.fillText('Enter Select | Esc Back',cx,718);
    ctx.restore();
  }

  drawBattle(ctx){
    if(!this.player||!this.enemy)return;
    this.drawBattlefield(ctx);
    const es=[{e:this.player,c:this.playerChar},{e:this.enemy,c:this.enemyChar}];
    for(const{e,c}of es)this.drawEntity(ctx,e,c);
    this.drawDamageNumbers(ctx);
    this.particles.draw(ctx);
    // KO freeze overlay
    if(this.koFreezeTimer>0){
      const koa=Math.min(this.koFreezeTimer*3,1);
      ctx.save();ctx.globalAlpha=koa;
      ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(0,0,CONFIG.W,CONFIG.H);
      ctx.textAlign='center';
      ctx.shadowColor='#ff0000';ctx.shadowBlur=50;
      ctx.font='bold 100px Orbitron,sans-serif';
      ctx.fillStyle='#ffffff';ctx.fillText(this.koFreezeText,CONFIG.W/2,CONFIG.H/2-40);
      ctx.shadowColor='#ff4400';ctx.shadowBlur=30;
      ctx.font='bold 36px Rajdhani,sans-serif';
      ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillText('FATALITY',CONFIG.W/2,CONFIG.H/2+40);
      ctx.shadowBlur=0;
      ctx.restore();
    }
    this.drawHUD(ctx);
    
    // Round intro overlay
    if(this.roundIntroTimer>0){
      const a=Math.min(this.roundIntroTimer*2,1);
      ctx.save();ctx.globalAlpha=a;
      ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(0,0,CONFIG.W,CONFIG.H);
      ctx.textAlign='center';
      ctx.fillStyle='#ffd700';ctx.font='bold 52px Orbitron,sans-serif';
      ctx.shadowColor='#ffd700';ctx.shadowBlur=40;
      ctx.fillText('ROUND '+this.round,CONFIG.W/2,CONFIG.H/2-25);
      ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.6)';ctx.font='28px Rajdhani,sans-serif';
      ctx.fillText('FIGHT!',CONFIG.W/2,CONFIG.H/2+40);
      // VS portrait display
      if(this.roundIntroTimer>1.5){
        ctx.font='18px Rajdhani,sans-serif';ctx.fillStyle=this.playerChar.color;
        ctx.fillText(this.playerChar.name,CONFIG.W/2-200,CONFIG.H/2+80);
        ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillText('VS',CONFIG.W/2,CONFIG.H/2+80);
        ctx.fillStyle=this.enemyChar.color;
        ctx.fillText(this.enemyChar.name,CONFIG.W/2+200,CONFIG.H/2+80);
      }
      ctx.restore();
    }
    
    if(this.gameMode==='survival'){
      ctx.save();
      ctx.textAlign='right';ctx.fillStyle='rgba(255,200,100,.35)';ctx.font='14px Rajdhani,sans-serif';
      ctx.fillText(`Wave ${this.survivalWave} • Kills: ${this.survivalKills}`,CONFIG.W-20,45);
      ctx.restore();
    }
    if(this.gameTime<6){
      ctx.save();ctx.globalAlpha=Math.max(0,1-this.gameTime/6);
      ctx.fillStyle='rgba(255,255,255,.1)';ctx.font='12px Rajdhani,sans-serif';
      ctx.textAlign='center';
      const hint=this.isMobile?'Use on-screen controls to fight!':'←→ Move | J Light | K Heavy | L Special | Shift Block | W Jump | S Dodge';
      ctx.fillText(hint,CONFIG.W/2,CONFIG.H-12);
      ctx.restore();
    }
  }

  drawBattlefield(ctx){
    ctx.save();
    for(let i=0;i<6;i++){
      const dx=(this.gameTime*12+i*250)%CONFIG.W,dy=CONFIG.GROUND_Y-5-Math.sin(i*2)*18;
      ctx.fillStyle='rgba(100,80,50,.025)';
      ctx.beginPath();ctx.arc(dx,dy,40+Math.sin(this.gameTime*.5+i)*12,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  drawEntity(ctx,entity,charData){
    if(!entity||!charData)return;
    ctx.save();
    // Weapon trail particles while attacking
    if(entity.attacking&&entity.attackFrame>0&&entity.attackFrame<4){
      const trailColor=charData.color||'#ffd700';
      this.particles.emit(entity.x+entity.facing*20,entity.y-30,{
        count:2,type:'spark',speed:80,life:.15,size:3,
        angle:entity.facing>0?0:Math.PI,spread:.5,
        color:[trailColor,'#ffffff'],gravity:0,drag:.97,
      });
    }
    // Shadow
    const ss=1-(CONFIG.GROUND_Y-entity.y)/200;
    ctx.fillStyle='rgba(0,0,0,.22)';
    ctx.beginPath();ctx.ellipse(entity.x,CONFIG.GROUND_Y+4,38*ss,8*ss,0,0,Math.PI*2);ctx.fill();
    // Dodge effect
    if(entity.dodgeTimer>0)ctx.globalAlpha=.5+Math.sin(entity.dodgeTimer*40)*.3;
    // Rage aura
    if(entity.rageActive){
      const pulse=.2+Math.sin(this.gameTime*10)*.15;
      ctx.shadowColor='#ff0000';ctx.shadowBlur=40+Math.sin(this.gameTime*8)*15;
      ctx.strokeStyle=`rgba(255,50,50,${pulse})`;ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(entity.x,entity.y-entity.h/3,entity.w*.7,0,Math.PI*2);ctx.stroke();
      ctx.shadowBlur=0;
      // Inner rage glow
      const rg=ctx.createRadialGradient(entity.x,entity.y-entity.h/3,0,entity.x,entity.y-entity.h/3,entity.w*.5);
      rg.addColorStop(0,`rgba(255,0,0,${pulse*.12})`);rg.addColorStop(1,'transparent');
      ctx.fillStyle=rg;ctx.beginPath();ctx.arc(entity.x,entity.y-entity.h/3,entity.w*.5,0,Math.PI*2);ctx.fill();
    }
    const flash=entity.hitFlash>0;
    const st={attacking:entity.attacking,attackType:entity.attackType||'light',attackFrame:entity.attackFrame,specialActive:entity.specialActive,blocking:entity.blocking,hitstun:entity.hitstun,walking:entity.walking};
    charData.draw(ctx,entity.x,entity.y-entity.h/2,entity.w,entity.h,entity.facing,entity.animFrame,st,flash);
    // Block indicator
    if(entity.blocking){
      ctx.strokeStyle='rgba(255,255,255,.15)';ctx.lineWidth=2;
      ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(entity.x,entity.y-20,44,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='rgba(255,255,255,.06)';ctx.beginPath();ctx.arc(entity.x,entity.y-20,42,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.25)';ctx.font='10px Rajdhani,sans-serif';ctx.textAlign='center';
      ctx.fillText('BLOCK',entity.x,entity.y-20);
    }
    // Name
    ctx.textAlign='center';ctx.fillStyle='rgba(255,255,255,.3)';ctx.font='10px Rajdhani,sans-serif';
    ctx.fillText(charData.name,entity.x,entity.y-entity.h-24);
    ctx.restore();
  }

  drawDamageNumbers(ctx){
    let writeIdx=0;
    for(let i=0,len=this.damageNumbers.length;i<len;i++){
      const d=this.damageNumbers[i];
      d.y+=d.vy*(1/60);d.life-=1/60;d.vy*=.97;
      if(d.life<=0){this._damageNumPool.push(d);continue;}
      this.damageNumbers[writeIdx++]=d;
    }
    this.damageNumbers.length=writeIdx;
    // Draw all active damage numbers
    for(let i=0,len=this.damageNumbers.length;i<len;i++){
      const d=this.damageNumbers[i];
      ctx.save();ctx.globalAlpha=d.life/d.maxLife;
      ctx.textAlign='center';
      ctx.font=`bold ${28+(1-d.life/d.maxLife)*8}px Rajdhani,sans-serif`;
      ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=8;
      ctx.fillStyle=d.color;ctx.fillText(d.text,d.x,d.y);
      ctx.shadowBlur=0;ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=3;
      ctx.strokeText(d.text,d.x,d.y);
      ctx.restore();
    }
  }

  drawHUD(ctx){
    if(!this.player||!this.enemy)return;
    ctx.save();
    const pBX=20,pBW=290,pBY=50;
    ctx.textAlign='left';
    ctx.fillStyle=this.playerChar.color;
    ctx.font='bold 22px Rajdhani,sans-serif';
    ctx.fillText(this.playerChar.name,pBX,pBY);
    // Character portrait
    ctx.save();
    ctx.beginPath();ctx.rect(pBX-34,pBY-8,30,36);ctx.clip();
    this.playerChar.draw(ctx,pBX-19,pBY+12,24,32,1,this.animFrame*2,{attacking:false,specialActive:false},false);
    ctx.restore();
    ctx.strokeStyle='rgba(255,255,255,.15)';ctx.lineWidth=1;
    ctx.strokeRect(pBX-34,pBY-8,30,36);
    ctx.fillStyle='rgba(255,255,255,.35)';ctx.font='14px Rajdhani,sans-serif';
    ctx.fillText(`${Math.ceil(this.player.currentHp)} / ${this.player.stats.hp}`,pBX+pBW-70,pBY);
    const hpY=pBY+14,hpB=18;
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(pBX,hpY,pBW,hpB);
    const hpR=this.player.currentHp/this.player.stats.hp;
    const displayR=this.player.displayHp/this.player.stats.hp;
    const damageR=this.player.damageHp/this.player.stats.hp;
    const hpC=hpR>.5?'#66bb6a':hpR>.25?'#ffa726':'#ef5350';
    // Damage preview bar (lags behind actual HP — shows recent damage taken)
    if(damageR>displayR){
      ctx.fillStyle='rgba(255,255,255,.12)';
      ctx.fillRect(pBX,hpY,pBW*damageR,hpB);
    }
    ctx.fillStyle=hpC;ctx.fillRect(pBX,hpY,pBW*displayR,hpB);
    const sg=ctx.createLinearGradient(pBX,hpY,pBX,hpY+hpB);
    sg.addColorStop(0,'rgba(255,255,255,.15)');sg.addColorStop(.5,'rgba(255,255,255,.05)');sg.addColorStop(1,'rgba(0,0,0,.1)');
    ctx.fillStyle=sg;ctx.fillRect(pBX,hpY,pBW,hpB);
    ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=1;ctx.strokeRect(pBX,hpY,pBW,hpB);
    const enY=hpY+hpB+5,enB=9;
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(pBX,enY,pBW,enB);
    ctx.fillStyle='#42a5f5';ctx.fillRect(pBX,enY,pBW*(this.player.energy/this.player.maxEnergy),enB);
    ctx.fillStyle='rgba(255,255,255,.18)';ctx.font='9px Rajdhani,sans-serif';
    ctx.fillText('ENERGY',pBX+3,enY+7);
    // Flash effect when energy >= SPECIAL_COST
    if(this.player.energy>=CONFIG.SPECIAL_COST){
      const pulse=.3+Math.sin(this.gameTime*8)*.2;
      ctx.save();
      ctx.shadowColor='#42a5f5';ctx.shadowBlur=15+Math.sin(this.gameTime*6)*8;
      ctx.fillStyle=`rgba(255,255,255,${pulse*.15})`;
      ctx.fillRect(pBX-2,enY-2,pBW+4,enB+4);
      ctx.shadowBlur=0;
      ctx.fillStyle=`rgba(66,165,245,${pulse*.2})`;
      ctx.fillRect(pBX,enY,pBW,enB);
      ctx.fillStyle='rgba(255,255,255,.25)';ctx.font='9px Rajdhani,sans-serif';
      ctx.fillText('ENERGY FULL!',pBX+3,enY+7);
      ctx.restore();
    }
    
    if(this.player.comboCount>1){
      ctx.textAlign='left';ctx.fillStyle='#ffd700';ctx.font='bold 30px Rajdhani,sans-serif';
      ctx.shadowColor='#ffd700';ctx.shadowBlur=18;
      ctx.fillText(`${this.player.comboCount}x COMBO!`,pBX,enY+42);
      ctx.shadowBlur=0;
    }
    if(this.comboCount>2){
      ctx.textAlign='center';ctx.fillStyle='#ffd700';ctx.font='bold 22px Rajdhani,sans-serif';
      ctx.fillText(`${this.comboCount} HIT!`,CONFIG.W/2,70);
    }
    
    // Enemy HUD - right
    const eBX=CONFIG.W-20-pBW;
    ctx.textAlign='right';ctx.fillStyle=this.enemyChar.color;
    ctx.font='bold 22px Rajdhani,sans-serif';
    ctx.fillText(this.enemyChar.name,CONFIG.W-20,50);
    // Enemy character portrait (mirrored)
    ctx.save();
    ctx.beginPath();ctx.rect(CONFIG.W-20-pBW+4,pBY-8,30,36);ctx.clip();
    this.enemyChar.draw(ctx,CONFIG.W-20-pBW+19,pBY+12,24,32,-1,this.animFrame*2,{attacking:false,specialActive:false},false);
    ctx.restore();
    ctx.strokeStyle='rgba(255,255,255,.15)';ctx.lineWidth=1;
    ctx.strokeRect(CONFIG.W-20-pBW+4,pBY-8,30,36);
    ctx.fillStyle='rgba(255,255,255,.35)';ctx.font='14px Rajdhani,sans-serif';
    ctx.fillText(`${Math.ceil(this.enemy.currentHp)} / ${this.enemy.stats.hp}`,eBX+70,50);
    const eHpY=64;
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(eBX,eHpY,pBW,hpB);
    const eHpR=this.enemy.currentHp/this.enemy.stats.hp;
    const eDisplayR=this.enemy.displayHp/this.enemy.stats.hp;
    const eDamageR=this.enemy.damageHp/this.enemy.stats.hp;
    const eHpC=eHpR>.5?'#66bb6a':eHpR>.25?'#ffa726':'#ef5350';
    if(eDamageR>eDisplayR){
      ctx.fillStyle='rgba(255,255,255,.12)';
      ctx.fillRect(eBX,eHpY,pBW*eDamageR,hpB);
    }
    ctx.fillStyle=eHpC;ctx.fillRect(eBX,eHpY,pBW*eDisplayR,hpB);
    const esg=ctx.createLinearGradient(eBX,eHpY,eBX,eHpY+hpB);
    esg.addColorStop(0,'rgba(255,255,255,.15)');esg.addColorStop(.5,'rgba(255,255,255,.05)');esg.addColorStop(1,'rgba(0,0,0,.1)');
    ctx.fillStyle=esg;ctx.fillRect(eBX,eHpY,pBW,hpB);
    ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=1;ctx.strokeRect(eBX,eHpY,pBW,hpB);
    
    // Timer
    ctx.textAlign='center';ctx.fillStyle='rgba(255,255,255,.25)';ctx.font='bold 24px Rajdhani,sans-serif';
    ctx.fillText(Math.ceil(this.battleTimer),CONFIG.W/2,46);
    ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=2;
    const tp=this.battleTimer/this.maxBattleTime;
    ctx.beginPath();ctx.arc(CONFIG.W/2,36,24,-Math.PI/2,-Math.PI/2+Math.PI*2*tp);ctx.stroke();
    
    ctx.fillStyle='rgba(255,255,255,.15)';ctx.font='12px Rajdhani,sans-serif';
    ctx.textAlign='left';ctx.fillText(`Wins: ${this.playerWins}`,25,20);
    ctx.textAlign='right';ctx.fillText(`Wins: ${this.enemyWins}`,CONFIG.W-25,20);
    ctx.textAlign='center';ctx.fillStyle='rgba(255,255,255,.1)';ctx.font='11px Rajdhani,sans-serif';
    ctx.fillText(`ROUND ${this.round}`,CONFIG.W/2,18);
    
    if(this.gameMode==='survival'){
      ctx.textAlign='center';ctx.fillStyle='#ffd700';ctx.font='bold 20px Rajdhani,sans-serif';
      ctx.globalAlpha=.3+Math.sin(this.gameTime*2)*.15;
      ctx.fillText(`WAVE ${this.survivalWave}`,CONFIG.W/2,CONFIG.H-35);
      ctx.globalAlpha=1;
    }
    // Difficulty indicator
    const dn={easy:'EASY',normal:'NORMAL',hard:'HARD'};
    ctx.fillStyle='rgba(255,255,255,.12)';ctx.font='10px Rajdhani,sans-serif';
    ctx.textAlign='center';ctx.fillText(dn[this.difficulty]||'NORMAL',CONFIG.W/2,CONFIG.H-14);
    if(this.maxComboDisplay>2){
      ctx.fillStyle='rgba(255,215,0,.2)';ctx.font='10px Rajdhani,sans-serif';
      ctx.fillText(`Best Combo: ${this.maxComboDisplay}`,CONFIG.W/2,CONFIG.H-4);
    }
    ctx.restore();
  }

  drawResult(ctx){
    ctx.save();
    const won=this.matchWinner==='player';
    const winnerChar=won?this.playerChar:this.enemyChar;
    const loserChar=won?this.enemyChar:this.playerChar;
    const primColor=winnerChar.color||'#ffd700';
    
    // Dark overlay with radial gradient
    const overlayG=ctx.createRadialGradient(CONFIG.W/2,CONFIG.H/2,0,CONFIG.W/2,CONFIG.H/2,500);
    overlayG.addColorStop(0,won?'rgba(20,10,0,.85)':'rgba(10,0,0,.85)');
    overlayG.addColorStop(1,'rgba(0,0,0,.92)');
    ctx.fillStyle=overlayG;ctx.fillRect(0,0,CONFIG.W,CONFIG.H);
    
    // Victory confetti & sparkle effects
    if(won){
      if(Math.random()<.15)this.particles.emit(Math.random()*CONFIG.W,-10,{count:4,type:'sparkle',speed:120+rng(0,80),life:1.8+rng(0,.5),angle:Math.PI/2+rng(-.3,.3),color:['#ffd700','#ffffff','#ff6b35','#ff4400','#4fc3f7'],gravity:60});
      if(Math.random()<.05)this.particles.emit(rng(0,CONFIG.W),-5,{count:8,type:'shard',speed:200+rng(0,100),life:2+rng(0,1),angle:Math.PI/2+rng(-.4,.4),color:['#ffd700','#ff7043','#4fc3f7','#66bb6a','#ab47bc'],gravity:120});
    }else{
      // Defeat embers
      if(Math.random()<.08)this.particles.emit(rng(0,CONFIG.W),CONFIG.GROUND_Y,{count:2,type:'smoke',speed:30,life:1.5,size:15,spread:.3,color:'#444',gravity:-20});
    }
    
    // Large winner character silhouette (translucent, side)
    ctx.save();
    ctx.globalAlpha=.2;
    const sideX=won?110:CONFIG.W-110;
    ctx.translate(sideX,CONFIG.H/2+20);
    ctx.scale(5.5,5.5);
    winnerChar.draw(ctx,0,0,30,50,won?1:-1,this.animFrame*3,{attacking:false,specialActive:true},false);
    ctx.restore();
    
    // Result panel with rounded corners
    const bx=CONFIG.W/2-240,by=CONFIG.H/2-140,bw=480,bh=280;
    ctx.shadowColor=won?'rgba(255,215,0,.4)':'rgba(255,0,0,.4)';ctx.shadowBlur=50;
    ctx.fillStyle='rgba(10,10,20,.95)';ctx.beginPath();
    ctx.roundRect(bx,by,bw,bh,8);ctx.fill();
    ctx.shadowBlur=0;
    ctx.strokeStyle=won?'rgba(255,215,0,.4)':'rgba(255,50,50,.4)';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.roundRect(bx,by,bw,bh,8);ctx.stroke();
    
    // Inner glow gradient
    const ig=ctx.createLinearGradient(bx,by,bx+bw,by);
    ig.addColorStop(0,won?'rgba(255,215,0,.06)':'rgba(255,0,0,.06)');
    ig.addColorStop(.5,'transparent');
    ig.addColorStop(1,won?'transparent':'rgba(255,0,0,.06)');
    ctx.fillStyle=ig;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,8);ctx.fill();
    
    ctx.textAlign='center';
    
    if(won){
      // VICTORY with gentle pulse
      const pulse=1+Math.sin(this.gameTime*2)*.025;
      ctx.save();
      ctx.translate(CONFIG.W/2,by+72);
      ctx.scale(pulse,pulse);
      ctx.fillStyle=primColor;ctx.font='bold 56px Orbitron,sans-serif';
      ctx.shadowColor=primColor;ctx.shadowBlur=40;
      ctx.fillText('VICTORY!',0,0);
      ctx.restore();
      ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,255,255,.75)';ctx.font='21px Rajdhani,sans-serif';
      ctx.fillText(`${this.playerChar.name} triumphs over ${this.enemyChar.name}!`,CONFIG.W/2,by+128);
      ctx.fillStyle='rgba(255,215,0,.4)';ctx.font='17px Rajdhani,sans-serif';
      ctx.fillText(`\"${this.playerChar.taunt}\"`,CONFIG.W/2,by+163);
      ctx.fillStyle='rgba(255,255,255,.2)';ctx.font='16px Noto Sans Devanagari,sans-serif';
      ctx.fillText('धर्मो रक्षति रक्षितः',CONFIG.W/2,by+198);
    }else{
      ctx.fillStyle='#ff4444';ctx.font='bold 56px Orbitron,sans-serif';
      ctx.shadowColor='#ff0000';ctx.shadowBlur=35;
      ctx.fillText('DEFEATED',CONFIG.W/2,by+72);
      ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,255,255,.65)';ctx.font='21px Rajdhani,sans-serif';
      ctx.fillText(`${this.enemyChar.name} prevails this time...`,CONFIG.W/2,by+128);
      ctx.fillStyle='rgba(255,200,100,.25)';ctx.font='17px Rajdhani,sans-serif';
      ctx.fillText(`\"${this.enemyChar.taunt}\"`,CONFIG.W/2,by+163);
      ctx.fillStyle='rgba(255,255,255,.22)';ctx.font='16px Rajdhani,sans-serif';
      ctx.fillText('Train harder and return to the battlefield!',CONFIG.W/2,by+198);
    }
    if(this.gameMode==='survival'){
      ctx.fillStyle='rgba(255,200,100,.35)';ctx.font='16px Rajdhani,sans-serif';
      ctx.fillText(`Survived ${this.survivalKills} waves`,CONFIG.W/2,by+235);
    }
    if(Math.sin(this.gameTime*3)>0){
      ctx.fillStyle='rgba(255,255,255,.3)';ctx.font='16px Rajdhani,sans-serif';
      const p=(this.gameMode==='survival'&&won)?'Press Enter to continue or Esc to menu':'Press Enter or tap to continue';
      ctx.fillText(p,CONFIG.W/2,by+bh+28);
    }
    ctx.restore();
  }

  gameLoop(){
    const dt=1/60;
    this.update(dt);
    this.draw();
    requestAnimationFrame(()=>this.gameLoop());
  }
}

window.addEventListener('DOMContentLoaded',()=>{window.game=new DharmYudhGame('gameCanvas');});
