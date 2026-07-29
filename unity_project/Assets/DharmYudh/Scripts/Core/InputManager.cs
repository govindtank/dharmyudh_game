using UnityEngine;

namespace DharmYudh.Core
{
    public class InputManager : MonoBehaviour
    {
        public static InputManager Instance { get; private set; }

        [Header("Cross-Platform Input State")]
        public float moveHorizontal = 0f;
        public bool jumpPressed = false;
        public bool lightAttackPressed = false;
        public bool heavyAttackPressed = false;
        public bool specialAttackPressed = false;
        public bool blockHeld = false;
        public bool dodgePressed = false;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Update()
        {
            // Reset one-frame trigger flags
            jumpPressed = false;
            lightAttackPressed = false;
            heavyAttackPressed = false;
            specialAttackPressed = false;
            dodgePressed = false;

            // Keyboard / Controller Inputs
            float keyboardAxis = Input.GetAxisRaw("Horizontal");
            if (Mathf.Abs(keyboardAxis) > 0.1f)
            {
                moveHorizontal = keyboardAxis;
            }

            if (Input.GetKeyDown(KeyCode.W) || Input.GetKeyDown(KeyCode.UpArrow) || Input.GetButtonDown("Jump"))
            {
                jumpPressed = true;
            }

            if (Input.GetKeyDown(KeyCode.J) || Input.GetButtonDown("Fire1"))
            {
                lightAttackPressed = true;
            }

            if (Input.GetKeyDown(KeyCode.K) || Input.GetButtonDown("Fire2"))
            {
                heavyAttackPressed = true;
            }

            if (Input.GetKeyDown(KeyCode.L) || Input.GetButtonDown("Fire3"))
            {
                specialAttackPressed = true;
            }

            blockHeld = Input.GetKey(KeyCode.I) || Input.GetKey(KeyCode.LeftShift) || Input.GetButton("Block");

            if (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.U))
            {
                dodgePressed = true;
            }
        }

        // Virtual Touch Button Handlers (Mobile Support)
        public void SetVirtualMove(float value) => moveHorizontal = value;
        public void TriggerVirtualJump() => jumpPressed = true;
        public void TriggerVirtualLightAttack() => lightAttackPressed = true;
        public void TriggerVirtualHeavyAttack() => heavyAttackPressed = true;
        public void TriggerVirtualSpecialAttack() => specialAttackPressed = true;
        public void SetVirtualBlock(bool active) => blockHeld = active;
        public void TriggerVirtualDodge() => dodgePressed = true;
    }
}
