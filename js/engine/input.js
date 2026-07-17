// ============================================================
// DHARMYUDH - Input System
// ============================================================

export class InputSystem {
  constructor(storage) {
    this.storage = storage;
    this.keys = {};
    this.keyJustPressed = {};
    this.inputBuffer = []; // stores inputs with timestamps for special combos
    this.maxBufferFrames = 6; 
    this.gamepads = [];
    
    // Mouse / Touch input state
    this.mouseClicked = false;
    this.mousePos = { x: 0, y: 0 };
    
    this.bindKeyboard();
    this.bindMouseAndTouch();
    this.bindGamepads();
    this.isMobile = this.detectMobile();
    this.bindTouchControls();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      const key = e.key; 
      if (!this.keys[key]) {
        this.keyJustPressed[key] = true;
        this.addToBuffer(key, 'press');
      }
      this.keys[key] = true;
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key;
      this.keys[key] = false;
      this.addToBuffer(key, 'release');
    });
  }

  bindMouseAndTouch() {
    // Mouse Down
    window.addEventListener('mousedown', (e) => {
      this.mouseClicked = true;
      this.updateMousePos(e);
    });

    // Touch Start
    window.addEventListener('touchstart', (e) => {
      this.mouseClicked = true;
      if (e.touches && e.touches[0]) {
        this.updateMousePos(e.touches[0]);
      }
    }, { passive: true });
  }

  updateMousePos(e) {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Translate client coordinates back to internal 1280x720 canvas coordinates
    this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 1280;
    this.mousePos.y = ((e.clientY - rect.top) / rect.height) * 720;
  }

  bindGamepads() {
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad.id);
      this.scanGamepads();
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('Gamepad disconnected:', e.gamepad.id);
      this.scanGamepads();
    });
  }

  scanGamepads() {
    this.gamepads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
  }

  detectMobile() {
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
  }

  bindTouchControls() {
    const touchControls = document.getElementById('touch-controls');
    if (!touchControls) return;

    // Force hidden initially
    touchControls.setAttribute('aria-hidden', 'true');

    const keyMap = {
      'up':    { key: 'ArrowUp',    mode: 'just' },
      'down':  { key: 'ArrowDown',  mode: 'just' },
      'left':  { key: 'ArrowLeft',  mode: 'hold' },
      'right': { key: 'ArrowRight', mode: 'hold' },
      'light': { key: 'j', mode: 'just' },
      'heavy': { key: 'k', mode: 'just' },
      'special': { key: 'l', mode: 'just' },
      'block': { key: 'Shift', mode: 'hold' },
    };

    const handleStart = (action) => {
      const m = keyMap[action];
      if (!m) return;
      if (m.mode === 'just') {
        this.keyJustPressed[m.key] = true;
        this.keys[m.key] = true;
        this.addToBuffer(m.key, 'press');
      } else {
        this.keys[m.key] = true;
      }
    };

    const handleEnd = (action) => {
      const m = keyMap[action];
      if (!m) return;
      this.keys[m.key] = false;
    };

    const buttons = touchControls.querySelectorAll('[data-touch]');
    buttons.forEach(btn => {
      const action = btn.getAttribute('data-touch');
      if (!action) return;

      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btn.classList.add('active');
        handleStart(action);
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.classList.remove('active');
        handleEnd(action);
      }, { passive: false });

      btn.addEventListener('touchcancel', () => {
        btn.classList.remove('active');
        handleEnd(action);
      });
    });
  }

  setTouchControlsVisible(visible) {
    const el = document.getElementById('touch-controls');
    if (!el) return;
    if (visible && this.isMobile) {
      el.setAttribute('aria-hidden', 'false');
    } else {
      el.setAttribute('aria-hidden', 'true');
    }
  }

  update() {
    // Note: keyJustPressed and mouseClicked must be cleared at the END of the frame
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
    this.inputBuffer = this.inputBuffer.filter(entry => now - entry.time < 500);
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
      const matches = typeof target === 'string' 
        ? entry.key.toLowerCase() === target.toLowerCase() && entry.action === 'press'
        : false;

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
    const key = playerNum === 1 ? bindings[action] : bindings['P2' + action];
    if (!key) return false;

    if (key.length === 1 && key.match(/[a-z]/i)) {
      return this.keys[key.toLowerCase()] || this.keys[key.toUpperCase()];
    }
    
    return this.keys[key];
  }

  isActionJustPressed(action, playerNum = 1) {
    const bindings = this.storage.getSettings().keyBindings;
    const key = playerNum === 1 ? bindings[action] : bindings['P2' + action];
    if (!key) return false;

    if (key.length === 1 && key.match(/[a-z]/i)) {
      return this.keyJustPressed[key.toLowerCase()] || this.keyJustPressed[key.toUpperCase()];
    }

    return this.keyJustPressed[key];
  }

  getHorizontalAxis(playerNum = 1) {
    let axis = 0;
    if (this.isActionPressed('MoveLeft', playerNum)) axis -= 1;
    if (this.isActionPressed('MoveRight', playerNum)) axis += 1;

    const gp = this.gamepads[playerNum - 1];
    if (gp) {
      if (gp.axes && gp.axes[0] !== undefined) {
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
    if (this.isActionPressed('Jump', playerNum)) axis -= 1; 
    if (this.isActionPressed('Dodge', playerNum)) axis += 1; 

    const gp = this.gamepads[playerNum - 1];
    if (gp) {
      if (gp.axes && gp.axes[1] !== undefined) {
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
}
export default InputSystem;
