using UnityEngine;
using UnityEngine.SceneManagement;

namespace DharmYudh.Core
{
    public enum GameState
    {
        MainMenu,
        ModeSelect,
        CharacterSelect,
        StageSelect,
        Battle,
        Pause,
        Victory
    }

    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("State Management")]
        public GameState currentState = GameState.MainMenu;

        [Header("Match Configurations")]
        public string selectedPlayerCharacterId = "arjuna";
        public string selectedEnemyCharacterId = "karna";
        public string selectedStageId = "kurukshetra_sunset";
        public string selectedGameMode = "versus"; // "versus", "story", "survival", "training"

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        public void ChangeState(GameState newState)
        {
            currentState = newState;
            Debug.Log($"[GameManager] State changed to: {newState}");
        }

        public void StartMatch(string playerCharId, string enemyCharId, string mode = "versus")
        {
            selectedPlayerCharacterId = playerCharId;
            selectedEnemyCharacterId = enemyCharId;
            selectedGameMode = mode;
            ChangeState(GameState.Battle);
            
            // Load Battle Scene
            // SceneManager.LoadScene("BattleScene");
        }

        public void ReturnToMainMenu()
        {
            ChangeState(GameState.MainMenu);
            // SceneManager.LoadScene("MainMenuScene");
        }
    }
}
