# ⚔️ DharmYudh (धर्मयुद्ध) - The Great War of Kurukshetra

> **A High-Fidelity 2D/3D Hybrid Mythological Fighting Game Built with Vanilla JavaScript, HTML5 Canvas, WebGL & Web Audio API.**

---

## 🌟 Game Overview

**DharmYudh** brings the epic battles of the ancient Indian epic *Mahabharata* to life in a fast-paced, production-grade fighting game. Take command of legendary mythological warriors—such as **Arjuna**, **Bhima**, **Karna**, **Duryodhana**, and **Bhishma**—and clash on the sacred battlefield of Kurukshetra using devastating weapon combos, tactical passive abilities, and cosmic **Divine Astras**.

---

## 🔥 Key Features & Visual Renderer Upgrades

### 🎨 AAA Visual Aesthetics & Anatomy
- **Anatomical Muscular Definition**: Layered chest pectorals, 8-pack abdominal contours, deltoid shoulders, bicep bulges, wrist guards, calf curves, and anklet greaves.
- **Metallic Kavacha Specular Highlights**: Multi-stop linear gradients with specular shine lines, bevel edges, and drop shadows on golden, bronze, and silver armor plates.
- **Character-Specific Mythological Detailing**:
  - **Arjuna**: Golden *Mukut* crown featuring a glowing **Mayur Pankh** (peacock feather) with iridescent blue/emerald/gold concentric eye spots.
  - **Ashwatthama**: Glowing red **Mani** gem on his forehead with an ethereal aura.
  - **Bhishma**: Silver patriarch crown with long white hair and a majestic white beard.
  - **Bhima**: Rugged dark warrior beard with heavy bronze lion pauldrons.
  - **Draupadi**: Flowing dark locks, lotus flame headband, and fiery red silk robes.
  - **Karna**: Radiant glowing golden **Sun Kavach** radiating solar flares.

### ⚡ Particle VFX & Volumetric Stage Lighting
- **Motion Slash Arc Trails**: Translucent glowing arc ribbons drawn behind weapon swings during light, heavy, and special attacks.
- **Elemental Impact Particles**: Character-unique hit signatures—Arjuna's celestial stardust, Bhima's rock debris ground cracks, Karna's solar flares, and Draupadi's flame whirlwinds.
- **Volumetric Sunbeams & Stage Destruction**: Rays of divine sunlight streaming down on Kurukshetra + destructible corner pillars at stage boundaries.
- **Cinematic Super Astra Cut-Ins**: Screen freeze-frames, dark vignettes, radial speed lines, and dynamic title cut-in banners when activating ultimate Astras.

### 🎺 Procedural Web Audio Soundscape
- **Shankhnaad (Conch Shell Call)**: Resonant low-frequency conch horn synthesis played during Super Astras and match intros.
- **Nagada & Dhol Drums**: Deep thundering battle drum impact pulses.
- **Metallic Clashes & Announcer**: Synthesized metallic ringing during weapon clashes and speech synthesis announcer for rounds.

---

## 🏹 Warrior Roster & Passive Abilities

| Warrior | Title | Weapon | Unique Passive | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Arjuna** | The Peerless Archer | Gandiva Bow | *Gandiva Precision* | Every 3rd consecutive light attack during a combo deals +25% damage and hits twice. |
| **Bhima** | The Mighty | Gada (Mace) | *Vayu's Wrath* | Heavy attacks deal +25% damage and knockback is increased by 40%. |
| **Karna** | The Radiant Warrior | Vijaya Bow | *Solar Kavach* | Permanent 15% damage reduction from all attacks. Regenerates 3 HP every 5 seconds. |
| **Duryodhana** | The Crowned Prince | Iron Mace | *Indomitable Will* | When below 30% HP, deals +20% damage and recovers from hitstun 30% faster. |
| **Nakula** | The Swordmaster | Sword & Shield | *Blade Dance* | Light attack & dodge cooldowns reduced. First combo hit is guaranteed critical. |
| **Yudhishthira** | The Dharmic King | Divine Spear | *Dharma's Aura* | Slowly regenerates 1 HP every 2 seconds. Special attacks deal +15% damage. |
| **Abhimanyu** | The Young Lion | Sword & Shield | *Chakravyuha Tactician* | Immune to combo damage scaling; first hit of any round deals +30% damage. |
| **Ashwatthama** | The Immortal Rage | Sword | *Immortal's Resolve* | Once per match, survives fatal blow with 1 HP and triggers a knockback shockwave. |
| **Draupadi** | Fire Born | Sword | *Sacred Flame* | Taking damage builds vengeance stacks (+6% damage per stack, up to +30%). |
| **Bhishma** | The Grand Patriarch | Heavy Bow | *Vow of Protection* | Block absorbs 92% damage; slowly regenerates HP while blocking. |

---

## 🎮 Game Modes

1. **Arcade Mode**: Climb the ladder against 8 warriors to reach the final champion.
2. **Story Campaign**: Interactive story chapters with Devanagari epic dialogues and boss battles.
3. **Versus 2-Player Mode**: Local 2-player battle on the same keyboard or gamepads.
4. **Survival Mode**: Fight endless waves of increasingly powerful opponents.
5. **Training Mode**: Practice combos, inspect hitboxes, and test frame data with dummy controls.

---

## ⌨️ Controls

### Keyboard Controls (Player 1)
* **Movement / Walk**: `A` / `D` or `Left Arrow` / `Right Arrow`
* **Jump**: `W` or `Up Arrow`
* **Block**: `Shift` or `I`
* **Dodge / Roll**: `Space` or `U`
* **Light Attack**: `J`
* **Heavy Attack**: `K`
* **Special Astra**: `L` (Requires 100% Karma / Full Energy)
* **Taunt**: `T`

### Mobile & Touch Support
- Fully integrated touch D-Pad and action buttons for iOS / Android mobile browsers.

---

## 🚀 Running Locally

No build tools or heavy dependencies required! Run using any standard HTTP server:

```bash
# Clone the repository
git clone git@github.com:govindtank/dharmyudh_game.git
cd dharmyudh_game

# Start local server using Python
python3 -m http.server 8080
```

Open your browser and navigate to:
👉 **`http://localhost:8080`**

---

## 📂 Directory Structure

```
dharmyudh_game/
├── index.html                  # Main HTML5 entry point & canvas wrapper
├── css/
│   └── style.css               # Styling, dark mode theme, loading screen & HUD
├── js/
│   ├── main.js                 # Bootstrapper & entry script
│   ├── characters/
│   │   ├── base_character.js   # Kinematics, state machine & weapon trails
│   │   ├── character_renderer.js# 2D Joint Renderer, muscular contours & Mukuts
│   │   ├── roster.js           # 10 Warrior definitions, stats, colors & passives
│   │   └── warrior_mesh_3d.js  # Three.js 3D warrior humanoid mesh engine
│   ├── combat/
│   │   └── combat_upgrade.js   # Karma meter, clashes, juggles & Super Astra cut-ins
│   ├── engine/
│   │   ├── animation.js        # Joint pose interpolation, stance breathing & windups
│   │   ├── audio.js            # Shankhnaad & Nagada Web Audio sound synthesizer
│   │   ├── config.js           # Canvas dimensions, physics step & game constants
│   │   ├── core.js             # Master game loop & state machine controller
│   │   ├── input.js            # Cross-platform keyboard, gamepad & touch input
│   │   ├── renderer.js         # 2D Canvas viewport camera system & screen flash
│   │   ├── storage.js          # PlayerPrefs & JSON save system
│   │   └── webgl_renderer.js   # Three.js 3D scene background manager
│   ├── modes/
│   │   ├── game_modes.js       # Arcade, 2-Player Versus, Survival & Training modes
│   │   └── story.js            # Story campaign dialogue engine
│   ├── progression/
│   │   ├── achievements.js     # Achievement definitions & tracking
│   │   └── progression.js      # Player XP, Leveling & Unlock manager
│   ├── stages/
│   │   └── stage_renderer.js   # Parallax stage layers, sunbeams & corner pillars
│   ├── ui/
│   │   ├── settings.js         # Graphic & keybinding settings panel
│   │   └── ui_system.js        # Main menu, HUD, character select & Stat Radar Chart
│   └── vfx/
│       ├── lighting.js         # Dynamic lighting layer
│       ├── particles.js        # Object-pooled elemental impact particles
│       └── screen_effects.js   # KO flashes & screen shake
└── backup_web_version/         # Codebase backup tag (v1.0-web-backup)
```

---

## 📜 License & Credits

Created for **DharmYudh - The Great War of Kurukshetra**. All rights reserved.
