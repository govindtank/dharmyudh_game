using System.Collections;
using UnityEngine;

namespace DharmYudh.Characters
{
    public enum CharacterState
    {
        Idle,
        Walk,
        Jump,
        Attack,
        Hitstun,
        Knockdown,
        Block,
        Special
    }

    public class WarriorController : MonoBehaviour
    {
        [Header("Character Data")]
        public CharacterData characterData;
        public bool isPlayer = true;

        [Header("Kinematics & Physics")]
        public float moveSpeed = 5.0f;
        public float jumpForce = 12.0f;
        public float groundY = 0.0f;
        public int facingDirection = 1; // 1 = Facing Right, -1 = Facing Left

        [Header("Current Runtime Stats")]
        public float currentHp;
        public float maxHp;
        public float energy = 0f;
        public float maxEnergy = 100f;
        public CharacterState currentState = CharacterState.Idle;

        [Header("Timers & Cooldowns")]
        public float hitstunTimer = 0f;
        public float attackCooldown = 0f;
        public float dodgeCooldown = 0f;
        public float invincibilityTimer = 0f;
        public bool isBlocking = false;
        public bool isAttacking = false;
        public bool isGrounded = true;

        private Rigidbody2D rb;
        private Animator animator;

        private void Awake()
        {
            rb = GetComponent<Rigidbody2D>();
            animator = GetComponent<Animator>();
        }

        private void Start()
        {
            if (characterData != null)
            {
                maxHp = characterData.stats.hp;
                currentHp = maxHp;
                moveSpeed = characterData.stats.speed * 0.03f;
            }
        }

        private void Update()
        {
            float dt = Time.deltaTime;

            // Update timers
            hitstunTimer = Mathf.Max(0f, hitstunTimer - dt);
            attackCooldown = Mathf.Max(0f, attackCooldown - dt);
            dodgeCooldown = Mathf.Max(0f, dodgeCooldown - dt);
            invincibilityTimer = Mathf.Max(0f, invincibilityTimer - dt);

            // Energy regeneration
            energy = Mathf.Min(maxEnergy, energy + 5.0f * dt);

            if (hitstunTimer > 0f)
            {
                currentState = CharacterState.Hitstun;
                return;
            }

            if (currentHp <= 0f)
            {
                currentState = CharacterState.Knockdown;
                return;
            }

            UpdateState();
        }

        private void UpdateState()
        {
            if (!isGrounded)
            {
                currentState = CharacterState.Jump;
            }
            else if (isBlocking)
            {
                currentState = CharacterState.Block;
            }
            else if (isAttacking)
            {
                currentState = CharacterState.Attack;
            }
            else if (rb != null && Mathf.Abs(rb.velocity.x) > 0.1f)
            {
                currentState = CharacterState.Walk;
            }
            else
            {
                currentState = CharacterState.Idle;
            }

            if (animator != null)
            {
                animator.SetInteger("State", (int)currentState);
            }
        }

        public void Move(float direction)
        {
            if (hitstunTimer > 0f || isAttacking || isBlocking) return;

            if (rb != null)
            {
                rb.velocity = new Vector2(direction * moveSpeed, rb.velocity.y);
            }

            if (direction != 0)
            {
                facingDirection = direction > 0 ? 1 : -1;
                transform.localScale = new Vector3(facingDirection, 1, 1);
            }
        }

        public void Jump()
        {
            if (isGrounded && hitstunTimer <= 0f && !isAttacking)
            {
                if (rb != null)
                {
                    rb.velocity = new Vector2(rb.velocity.x, jumpForce);
                }
                isGrounded = false;
            }
        }

        public void TakeDamage(float amount, Vector2 knockback)
        {
            if (invincibilityTimer > 0f || currentHp <= 0f) return;

            float damageDealt = amount;

            if (isBlocking)
            {
                damageDealt *= 0.15f; // 85% damage absorption
                if (rb != null) rb.velocity = new Vector2(-facingDirection * knockback.x * 0.5f, 0);
                return;
            }

            currentHp = Mathf.Max(0f, currentHp - damageDealt);
            hitstunTimer = 0.3f;

            if (rb != null)
            {
                rb.velocity = new Vector2(-facingDirection * knockback.x, knockback.y);
            }

            if (currentHp <= 0f)
            {
                currentState = CharacterState.Knockdown;
            }
        }
    }
}
