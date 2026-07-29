using UnityEngine;

namespace DharmYudh.Characters
{
    public class PassiveSystem : MonoBehaviour
    {
        private WarriorController warrior;
        private string passiveId;

        // Passive State Trackers
        private int consecutiveLights = 0;
        private float regenTimer = 0f;
        private bool immortalSavedUsed = false;
        private int sacredFlameStacks = 0;

        private void Awake()
        {
            warrior = GetComponent<WarriorController>();
        }

        private void Start()
        {
            if (warrior != null && warrior.characterData != null)
            {
                passiveId = warrior.characterData.passive.id;
            }
        }

        private void Update()
        {
            if (warrior == null || string.IsNullOrEmpty(passiveId)) return;

            float dt = Time.deltaTime;

            switch (passiveId)
            {
                case "solar_kavach":
                    // Regenerate 3 HP every 5 seconds
                    regenTimer += dt;
                    if (regenTimer >= 5.0f && warrior.currentHp > 0 && warrior.currentHp < warrior.maxHp)
                    {
                        warrior.currentHp = Mathf.Min(warrior.maxHp, warrior.currentHp + 3f);
                        regenTimer = 0f;
                    }
                    break;

                case "dharma_aura":
                    // Regenerate 1 HP every 2 seconds
                    regenTimer += dt;
                    if (regenTimer >= 2.0f && warrior.currentHp > 0 && warrior.currentHp < warrior.maxHp)
                    {
                        warrior.currentHp = Mathf.Min(warrior.maxHp, warrior.currentHp + 1f);
                        regenTimer = 0f;
                    }
                    break;
            }
        }

        public float ModifyOutgoingDamage(float baseDamage, string attackType)
        {
            if (string.IsNullOrEmpty(passiveId)) return baseDamage;

            float multiplier = 1.0f;

            switch (passiveId)
            {
                case "gandiva_precision":
                    if (attackType == "light")
                    {
                        consecutiveLights = (consecutiveLights + 1) % 3;
                        if (consecutiveLights == 2) multiplier = 1.25f;
                    }
                    break;

                case "vayu_wrath":
                    if (attackType == "heavy") multiplier = 1.25f;
                    break;

                case "indomitable_will":
                    if (warrior.currentHp < warrior.maxHp * 0.3f) multiplier = 1.20f;
                    break;

                case "sacred_flame":
                    if (sacredFlameStacks > 0)
                    {
                        multiplier = 1.0f + (sacredFlameStacks * 0.06f);
                        sacredFlameStacks = 0; // reset on hit
                    }
                    break;
            }

            return baseDamage * multiplier;
        }

        public void OnTakeDamage()
        {
            if (passiveId == "sacred_flame")
            {
                sacredFlameStacks = Mathf.Min(5, sacredFlameStacks + 1);
            }
        }
    }
}
