// ============================================================
// DHARMYUDH - Game Configuration and Utilities
// ============================================================

export const CONFIG = {
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
  PHYSICS_STEP: 1 / 120, // 120Hz physics step
};

// Math & Utility Helpers
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, m, M) => Math.max(m, Math.min(M, v));
export const rng = (a, b) => a + Math.random() * (b - a);
export const rngI = (a, b) => Math.floor(rng(a, b + 1));
export const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
export const easeOut = (t) => 1 - (1 - t) * (1 - t);
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
