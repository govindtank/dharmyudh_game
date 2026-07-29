# DharmYudh - Unity Engine Project (URP)

This directory contains the production-grade Unity C# architecture and scripts for **DharmYudh (The Great War of Kurukshetra)**.

---

## 🚀 Quick Setup Instructions

### 1. Prerequisites
- **Unity Editor**: Download & Install **Unity 2022.3 LTS** or **Unity 6 LTS** via Unity Hub.
- **Modules**: Ensure **WebGL Build Support** and **Mac/PC Standalone Build Support** modules are checked during installation.

### 2. Opening the Project
1. Launch **Unity Hub**.
2. Click **Open** -> Select the `unity_project` folder inside this workspace directory (`/Users/govind/workspace/dharmyudh_game/unity_project`).
3. Select **Universal Render Pipeline (URP)** template when prompted or assign the URP Asset in `Project Settings -> Graphics`.

---

## 📁 Architecture Overview

```
Assets/DharmYudh/
├── Scripts/
│   ├── Core/
│   │   ├── GameManager.cs      (GameState Flow, Match Setup)
│   │   ├── CombatManager.cs    (Match Loop, Frame Timers, Round Wins)
│   │   ├── InputManager.cs     (Cross-platform Input, Gamepad & Mobile Touch)
│   │   └── AudioManager.cs     (Sound Pooling, BGM Crossfade)
│   ├── Characters/
│   │   ├── CharacterData.cs    (ScriptableObject defining Stats, Colors, Passives)
│   │   ├── WarriorController.cs(Physics, Kinematics, State Machine, Hitstun)
│   │   └── PassiveSystem.cs    (10 Mythological Passive Abilities)
│   ├── Combat/
│   │   ├── MoveData.cs         (Attack Frame Data, Startup, Active, Recovery)
│   │   └── HitboxController.cs (Trigger Overlaps & Damage Delivery)
│   ├── VFX/
│   │   ├── SlashTrailController.cs (URP TrailRenderer for Weapon Swing Arcs)
│   │   └── CameraShakeURP.cs   (Impact & Divine Astra Camera Shake)
│   └── UI/
│       └── HUDController.cs    (Health Bars, Energy Meters, Match Timers, Toast Messages)
```

---

## 🌐 WebGL Exporting Instructions

1. In Unity Editor, go to `File -> Build Settings...`.
2. Select **WebGL** as the target platform and click **Switch Platform**.
3. Go to `Player Settings -> Resolution and Presentation`:
   - Set WebGL Template to **Minimal** or **Default**.
4. Click **Build** and choose an output folder (e.g. `build_webgl`).
5. Run using `python3 -m http.server 8080` inside the build directory to test in any browser!

---

## 🛡️ Web Version Backup Reference

The legacy HTML5 Canvas / WebGL code is safely backed up in `backup_web_version/` and tagged as `v1.0-web-backup` in git.
