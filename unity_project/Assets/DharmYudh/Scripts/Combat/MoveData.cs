using System;
using UnityEngine;

namespace DharmYudh.Combat
{
    public enum AttackType
    {
        Light,
        Heavy,
        Special
    }

    [CreateAssetMenu(fileName = "NewMoveData", menuName = "DharmYudh/Move Data")]
    public class MoveData : ScriptableObject
    {
        public string moveName;
        public AttackType attackType = AttackType.Light;

        [Header("Frame Data (At 60 FPS)")]
        public int startupFrames = 3;
        public int activeFrames = 4;
        public int recoveryFrames = 6;

        [Header("Damage & Pushback")]
        public float baseDamage = 12f;
        public Vector2 knockbackVector = new Vector2(150f, 0f);
        public float hitstunDuration = 0.25f;

        [Header("Visual & Sound FX")]
        public AudioClip attackSwingSfx;
        public AudioClip hitImpactSfx;
        public GameObject hitParticlePrefab;
        public Color trailGlowColor = Color.cyan;
    }
}
