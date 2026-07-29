using System.Collections.Generic;
using UnityEngine;

namespace DharmYudh.Core
{
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [Header("Audio Sources")]
        public AudioSource bgmSource;
        public AudioSource sfxSourcePrefab;
        public int sfxPoolSize = 10;

        [Header("Audio Clips Cache")]
        public AudioClip bgmBattle;
        public AudioClip bgmMenu;
        public AudioClip lightHitSfx;
        public AudioClip heavyHitSfx;
        public AudioClip blockHitSfx;
        public AudioClip weaponSwingSfx;
        public AudioClip specialAstraSfx;
        public AudioClip victoryFanfare;

        private List<AudioSource> sfxPool = new List<AudioSource>();

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializePool();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializePool()
        {
            for (int i = 0; i < sfxPoolSize; i++)
            {
                GameObject obj = new GameObject($"SFX_Source_{i}");
                obj.transform.SetParent(transform);
                AudioSource src = obj.AddComponent<AudioSource>();
                src.playOnAwake = false;
                sfxPool.Add(src);
            }
        }

        public void PlaySFX(AudioClip clip, float volume = 1.0f, float pitchRandomization = 0.1f)
        {
            if (clip == null) return;

            AudioSource availableSource = sfxPool.Find(s => !s.isPlaying);
            if (availableSource == null) availableSource = sfxPool[0]; // Reuse first if all busy

            availableSource.clip = clip;
            availableSource.volume = volume;
            availableSource.pitch = 1.0f + Random.Range(-pitchRandomization, pitchRandomization);
            availableSource.Play();
        }

        public void PlayBGM(AudioClip clip, bool loop = true)
        {
            if (bgmSource == null || clip == null) return;

            bgmSource.clip = clip;
            bgmSource.loop = loop;
            bgmSource.Play();
        }

        public void PlayLightHit() => PlaySFX(lightHitSfx, 0.8f);
        public void PlayHeavyHit() => PlaySFX(heavyHitSfx, 1.0f);
        public void PlayBlockHit() => PlaySFX(blockHitSfx, 0.7f);
        public void PlayWeaponSwing() => PlaySFX(weaponSwingSfx, 0.6f);
        public void PlaySpecialAstra() => PlaySFX(specialAstraSfx, 1.2f);
    }
}
