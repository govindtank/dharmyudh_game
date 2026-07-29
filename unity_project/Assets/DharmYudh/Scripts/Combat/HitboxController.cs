using UnityEngine;
using DharmYudh.Characters;

namespace DharmYudh.Combat
{
    public class HitboxController : MonoBehaviour
    {
        public WarriorController ownerWarrior;
        public MoveData currentMove;
        public Collider2D hitboxCollider;
        public LayerMask targetLayer;

        private bool isActive = false;
        private bool hasHit = false;

        private void Awake()
        {
            if (hitboxCollider == null) hitboxCollider = GetComponent<Collider2D>();
            if (hitboxCollider != null) hitboxCollider.enabled = false;
        }

        public void ActivateHitbox(MoveData move)
        {
            currentMove = move;
            isActive = true;
            hasHit = false;
            if (hitboxCollider != null) hitboxCollider.enabled = true;
        }

        public void DeactivateHitbox()
        {
            isActive = false;
            hasHit = false;
            if (hitboxCollider != null) hitboxCollider.enabled = false;
        }

        private void OnTriggerEnter2D(Collider2D collision)
        {
            if (!isActive || hasHit) return;

            WarriorController target = collision.GetComponent<WarriorController>();
            if (target != null && target != ownerWarrior)
            {
                hasHit = true;
                float finalDamage = currentMove != null ? currentMove.baseDamage : 10f;
                Vector2 knockback = currentMove != null ? currentMove.knockbackVector : new Vector2(150f, 0f);

                // Apply owner damage bonus (from stats / passives)
                if (ownerWarrior != null && ownerWarrior.characterData != null)
                {
                    finalDamage += ownerWarrior.characterData.stats.attack * 0.5f;
                }

                target.TakeDamage(finalDamage, knockback);
                Debug.Log($"Hit connected! Damage: {finalDamage} to {target.characterData?.warriorName}");
            }
        }
    }
}
