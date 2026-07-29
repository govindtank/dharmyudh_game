using UnityEngine;
using UnityEngine.UI;
using DharmYudh.Characters;
using DharmYudh.Core;

namespace DharmYudh.UI
{
    public class HUDController : MonoBehaviour
    {
        public static HUDController Instance { get; private set; }

        [Header("Player UI Elements")]
        public Image playerHpBar;
        public Image playerHpRedFill;
        public Image playerEnergyBar;
        public Text playerTitleText;
        public Text playerNameText;

        [Header("Enemy UI Elements")]
        public Image enemyHpBar;
        public Image enemyHpRedFill;
        public Image enemyEnergyBar;
        public Text enemyTitleText;
        public Text enemyNameText;

        [Header("Match Info UI")]
        public Text timerText;
        public Text roundText;
        public Text toastText;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Update()
        {
            UpdatePlayerHUD();
            UpdateEnemyHUD();
            UpdateTimer();
        }

        private void UpdatePlayerHUD()
        {
            WarriorController p = CombatManager.Instance?.playerWarrior;
            if (p == null) return;

            if (playerHpBar != null)
            {
                float targetFill = p.currentHp / p.maxHp;
                playerHpBar.fillAmount = Mathf.Lerp(playerHpBar.fillAmount, targetFill, Time.deltaTime * 10f);
                if (playerHpRedFill != null)
                {
                    playerHpRedFill.fillAmount = Mathf.Lerp(playerHpRedFill.fillAmount, targetFill, Time.deltaTime * 3f);
                }
            }

            if (playerEnergyBar != null)
            {
                playerEnergyBar.fillAmount = p.energy / p.maxEnergy;
            }

            if (playerNameText != null && p.characterData != null)
            {
                playerNameText.text = p.characterData.warriorName.ToUpper();
            }
        }

        private void UpdateEnemyHUD()
        {
            WarriorController e = CombatManager.Instance?.enemyWarrior;
            if (e == null) return;

            if (enemyHpBar != null)
            {
                float targetFill = e.currentHp / e.maxHp;
                enemyHpBar.fillAmount = Mathf.Lerp(enemyHpBar.fillAmount, targetFill, Time.deltaTime * 10f);
                if (enemyHpRedFill != null)
                {
                    enemyHpRedFill.fillAmount = Mathf.Lerp(enemyHpRedFill.fillAmount, targetFill, Time.deltaTime * 3f);
                }
            }

            if (enemyEnergyBar != null)
            {
                enemyEnergyBar.fillAmount = e.energy / e.maxEnergy;
            }

            if (enemyNameText != null && e.characterData != null)
            {
                enemyNameText.text = e.characterData.warriorName.ToUpper();
            }
        }

        private void UpdateTimer()
        {
            if (timerText != null && CombatManager.Instance != null)
            {
                int seconds = Mathf.CeilToInt(CombatManager.Instance.matchTimer);
                timerText.text = seconds.ToString("00");
            }
        }

        public void ShowToast(string message, float duration = 2.0f)
        {
            if (toastText != null)
            {
                toastText.text = message;
                toastText.gameObject.SetActive(true);
                CancelInvoke(nameof(HideToast));
                Invoke(nameof(HideToast), duration);
            }
        }

        private void HideToast()
        {
            if (toastText != null) toastText.gameObject.SetActive(false);
        }
    }
}
