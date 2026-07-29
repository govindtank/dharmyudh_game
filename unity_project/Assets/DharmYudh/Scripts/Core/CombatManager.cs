using System.Collections;
using UnityEngine;
using DharmYudh.Characters;

namespace DharmYudh.Core
{
    public class CombatManager : MonoBehaviour
    {
        public static CombatManager Instance { get; private set; }

        [Header("Fighters")]
        public WarriorController playerWarrior;
        public WarriorController enemyWarrior;

        [Header("Match Settings")]
        public float matchTimer = 99f;
        public bool isTimerRunning = false;
        public int playerWins = 0;
        public int enemyWins = 0;
        public int currentRound = 1;
        public int maxRounds = 3;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Update()
        {
            if (isTimerRunning)
            {
                matchTimer -= Time.deltaTime;
                if (matchTimer <= 0f)
                {
                    matchTimer = 0f;
                    OnTimeOut();
                }
            }

            CheckRoundOver();
        }

        public void StartRound()
        {
            matchTimer = 99f;
            isTimerRunning = true;
            Debug.Log($"Round {currentRound} START!");
        }

        private void CheckRoundOver()
        {
            if (!isTimerRunning) return;

            if (playerWarrior != null && playerWarrior.currentHp <= 0f)
            {
                enemyWins++;
                EndRound(enemyWarrior != null ? enemyWarrior.characterData.warriorName : "Enemy");
            }
            else if (enemyWarrior != null && enemyWarrior.currentHp <= 0f)
            {
                playerWins++;
                EndRound(playerWarrior != null ? playerWarrior.characterData.warriorName : "Player");
            }
        }

        private void OnTimeOut()
        {
            isTimerRunning = false;
            if (playerWarrior.currentHp > enemyWarrior.currentHp)
            {
                playerWins++;
                EndRound(playerWarrior.characterData.warriorName);
            }
            else if (enemyWarrior.currentHp > playerWarrior.currentHp)
            {
                enemyWins++;
                EndRound(enemyWarrior.characterData.warriorName);
            }
            else
            {
                EndRound("DRAW");
            }
        }

        private void EndRound(string winnerName)
        {
            isTimerRunning = false;
            Debug.Log($"Round {currentRound} Winner: {winnerName}");

            int requiredWins = Mathf.CeilToInt(maxRounds / 2f);
            if (playerWins >= requiredWins || enemyWins >= requiredWins)
            {
                Debug.Log($"MATCH OVER! Overall Champion: {winnerName}");
            }
            else
            {
                currentRound++;
                Invoke(nameof(StartRound), 3.0f);
            }
        }
    }
}
