// ============================================================
// DHARMYUDH - Main Entry Point & Bootstrapper
// ============================================================

import { DharmYudhGame } from './engine/core.js';

document.addEventListener('DOMContentLoaded', () => {
  const game = new DharmYudhGame('gameCanvas');
  window.game = game; // Expose globally for testing/debugging
});
