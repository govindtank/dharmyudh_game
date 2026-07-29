// Native Node DOM Mock for testing game rendering
class Element {
  constructor(tag) {
    this.tagName = tag;
    this.style = {};
    this.classList = { add: () => {}, remove: () => {} };
    this.setAttribute = () => {};
    this.removeAttribute = () => {};
    this.querySelectorAll = () => [];
    this.querySelector = () => null;
    this.addEventListener = () => {};


    this.width = 1280;
    this.height = 720;
  }
  getContext(type) {
    if (type === '2d') return mockCtx;
    return null;
  }
  getBoundingClientRect() {
    return { width: 1280, height: 720, top: 0, left: 0 };
  }
}

const elements = {
  'gameCanvas': new Element('canvas'),
  'game-container': new Element('div'),
  'loading-screen': new Element('div'),
  'loading-bar': new Element('div')
};

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  devicePixelRatio: 1,
  THREE: null
};

global.document = {
  getElementById: (id) => elements[id] || new Element('div'),
  querySelector: () => new Element('div'),
  querySelectorAll: () => [],
  createElement: (tag) => new Element(tag),
  body: new Element('body'),
  addEventListener: () => {}
};

Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node' }, writable: true });

global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (fn) => setTimeout(fn, 16);

const mockCtx = {
  save: () => {},
  restore: () => {},
  clearRect: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  beginPath: () => {},
  closePath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  arc: () => {},
  ellipse: () => {},
  fill: () => {},
  stroke: () => {},
  translate: () => {},
  scale: () => {},
  rotate: () => {},
  setTransform: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
  createPattern: () => ({}),
  measureText: () => ({ width: 50 }),
  fillText: () => {},
  strokeText: () => {},
  drawImage: () => {},
  clip: () => {},
  quadraticCurveTo: () => {},
  bezierCurveTo: () => {},
  globalAlpha: 1,
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'left',
  textBaseline: 'top',
  shadowColor: '',
  shadowBlur: 0
};

// Import game core
import { DharmYudhGame } from '../js/engine/core.js';
import { CHARACTERS } from '../js/characters/roster.js';

try {
  console.log("Initializing game instance...");
  const game = new DharmYudhGame('gameCanvas');
  
  console.log("Testing state: 'menu'");
  game.state = 'menu';
  game.render();
  console.log("Menu rendered successfully!");

  console.log("Testing state: 'characterSelect'");
  game.state = 'characterSelect';
  game.render();
  console.log("Character Select rendered successfully!");

  console.log("Testing state: 'battle'");
  game.state = 'battle';
  game.playerChar = CHARACTERS[0];
  game.enemyChar = CHARACTERS[1];
  game.startRound();
  game.updateFixed(0.016);
  game.updateVariable(0.016);
  game.render();
  console.log("Battle rendered successfully!");

  console.log("SUCCESS! NO RUNTIME EXCEPTIONS IN GAME LOOP!");
} catch (err) {
  console.error("RUNTIME ERROR CATCHED:", err);
  process.exit(1);
}
